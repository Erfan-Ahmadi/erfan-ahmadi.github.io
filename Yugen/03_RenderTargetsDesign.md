---
title: Render Targets Abstraction
permalink: /blog/Yugen/RenderTargets
---

# What's the problem I'm trying to solve?

This is the following of this [tweet](https://twitter.com/ahmadierfan999/status/1292069752924524544), and thanks to all the people for replying and helping me gather my thoughts :)

A good usable interface and abstraction for binding/creating/using render targets over Modern Graphics APIs considering following limitation(s):
- We are not going to support subpasses and tiled-based rendering.
- Minimizing extra memory and state handling in RenderBackend Implementation. 

Note that this design problem is when desiging a Rendering Architecture over Modern Graphics APIs specifically Vulkan and D3D12 for now.

# Vulkan and D3D12

Vulkan and D3D12 are using different concepts and Ideas to this problems.

In Vulkan Tiled-Base Rendering in a first-class citizen and that's why the concept of a RenderPass exists,
In Vulkan we have multiple objects to handle what we're going to render to and the most important one is RenderPasses
assuming we **ignore subpasses** that's how we render to textures!

1. Create the **RenderPass**, describing 2 main things:
    - Attachments Formats (Color and Depth)
    - Load/Store Operations (LOAD/CLEAR/DONT_CARE)
2. Create PSOs using this RenderPass
    - Note that the PSO can be used with another RenderPass it only has to be Compatible (see [RenderPass Compatibility]()), and just like D3D12 only render target formats are needed to create a PSO.
3. Create FrameBuffer which has actual references to ImageViews (Texture handle already available on the GPU)

4. Then we will bind our RenderPass+FrameBuffer (vkCmdRenderPassBegin) and use our PSO to render stuff. (which was created with a compatible RenderPass)

In D3D12 It's much simpler : 

1. You create your RenderTarget resources 
2. You bind them at command recording time 
3. In PSO creation only formats to those are needed so PSOs can be created very sooner without dependency to actual render targets.
(I hope I'm right having not actually written serious D3D12 yet)

# Solutions to this Problem

## #0 : Initial Idea

Let's first talk about what is already available in YRB to render to textures which is very similar to Vulkan (becuase it's the initial backend).

1. RenderTarget is exposed as Textures/Images just like Vulkan.s
2. RenderPass is exposed but subpasses are ignored, So it will become only bunch of formats and their load/store operations
3. Framebuffers are exposed very similar to Vulkan
4. PSO creation needs a RenderPass

Pros: Really easy vulkan and d3d12 implementation
Cons: Too many objects to handle to be able to render to something, also textures might not be a good handle for RenderTarget resource types 

## #1 : Let's make the names a bit better.

Pros: Better namings than before, explicit RenderTarget type exposed (but handled like a texture in the implementation)
Cons: Still many objects to handle to be able to render to something, and they are all needed.

## #2 : Let's use less objects to handle

Try to merge Framebuffer and RenderPass -> Fail -> Reason: PSO would then need Actual GPU Allocations for RenderTargets to happen before creation.
Tackle this again -> Try to create PSO with a temprory compatible renderpass (only format data is needed from user which is fine) -> Fail -> Reasons:
1. A Temp RenderPass is created and deleted each time a PSO is going to be created. wouldn't this be better if we hashed those for later usages?
2. How do we handle Load/Store operations then, are they going to be defined at Framebuffer create time by user? (Can't reuse RenderPasses and Framebuffers would be much larger than their name indicates which are a bunch of render targets grouped together)

## #3 : Let's use EVEN less objects to handle

To achieve re-use of these objects and simpler interface for the user. we will have no such concepts as RenderPass and Framebuffers.
- We have RenderTargets and we create those very similar to textures
- PSO creation only needs RenderTarget Formats
- Binding of RenderTargets happens with a function like this: ``Cmd_BindRenderTargets(CommandBuffer & cmd, RenderTarget * rts, uint32_t count)``

Pros:
- Maps really well to D3D12
- Simple Interface and Ease of use
Cons:
- Extra state handling and thread-safe operations/lookups for Vulkan Implementation (gets dirty)
- Extra memory to manage and hold for each command buffer.
    
Vulkan Implementation Details :

Framebuffers are fetched/created from a hashmap of RenderTargetHandles -> FrameBuffer.
RenderPass is fetched from a similar hashmap of the current state of command buffer -> RenderPass.