---
title: Render Targets Abstraction
permalink: /blog/Yugen/RenderTargets
---


# What's the problem I'm trying to solve?

A good usable interface and abstraction for binding/creating/using render targets over Modern Graphics APIs considering following limitation(s):
- We are not going to support subpasses and tiled-based rendering.
- Minimizing extra memory and state handling in RenderBackend Implementation. 

# Vulkan and D3D12

Vulkan and D3D12 use different concepts and ideas to render to a resource.

In Vulkan Tiled-Base Rendering is a first-class citizen and that's why the concept of a **RenderPass** exists,
In Vulkan we have multiple objects to handle what we're going to render to and the most important one is RenderPasses.

Assuming we **ignore subpasses** in Vulkan: 

1. Create the **RenderPass**, describing 2 main things:
    - Attachments Formats (Color and Depth)
    - Load/Store Operations (LOAD/CLEAR/DONT_CARE)
2. Create PSOs using this RenderPass
    - Note that the PSO can be used with another RenderPass it only has to be Compatible (see [Render Pass Compatibility](https://www.khronos.org/registry/vulkan/specs/1.1-extensions/html/chap8.html#renderpass-compatibility)), and just like D3D12 only render target formats are needed to create a PSO.
3. Create FrameBuffer which has actual references to ImageViews (Texture handle already available on the GPU)

4. Then we will bind our RenderPass+FrameBuffer (vkCmdRenderPassBegin) and use our PSO to render stuff. (which was created with a compatible RenderPass)

In D3D12 It's much simpler : 

1. You create your RenderTarget resources 
2. You bind them at command recording time 
3. In PSO creation only formats to those are needed so PSOs can be created very sooner without dependency to actual render targets.
(I hope I'm right having not actually written serious D3D12 yet)

# Solutions

## #0 : Initial Idea

Let's first talk about what is already available in YRB to render to textures which is very similar to Vulkan (becuase it's the initial backend).

1. RenderTarget is exposed as Textures/Images just like Vulkan.s
2. RenderPass is exposed but subpasses are ignored, So it will become only bunch of formats and their load/store operations
3. Framebuffers are exposed very similar to Vulkan
4. PSO creation needs a RenderPass

Pros: Simple vulkan and d3d12 implementation
Cons: Too many objects to handle to be able to render to something, also textures might not be a good handle for RenderTarget resource types 

## #1 : Let's make the names a bit better.

1. Expose Render Targets as a ResourceType instead of using textures, For explicity and clarity of the Renderer
2. RenderPass is a bit misleading and this name has thousands of meaning in Rendering System Design. and since we don't handle subpasses the better name would be **FramebufferBindings** (Thanks to one of the replies to my comments, FrameGraphBindings [@MGDev91](https://twitter.com/MGDev91))

PSO then will need a **FramebufferBindings** object to be created (format data for D3D12 and )

Pros: Simple Interface, Better namings than before, explicit RenderTarget type exposed (but handled like a texture in the implementation)
Cons: Still many objects to handle to be able to render to something, and they are all needed.

## #2 : Getting rid of Framebuffer

We would still have **FramebufferBindings** but Framebuffers are created and looked up internally from render target handles to Framebuffer.
Binding render targets would be like : ``Cmd_BindRenderTargets(CommandBuffer cmd, FramebufferBindings bindings, RenderTarget * rts, uint32_t count)`` and bindings will have VkRenderPass for Vulkan and won't be used for D3D12

Pros: Less objects to handle, Simpler to use
Cons: Why though? just create your framebuffer It's only a few lines more than setting up an array of RenderTargets

### Getting Rid Of FrameBuffers:

{% highlight c++ %}

// Not Setup

// Recording Command Buffer
YRB::RenderTarget targets[2] = {swap_chain.images[i], depth_stencil_textures[i]};
YRB::Cmd_BindRenderTargets(cmd, targets, 2)

{% endhighlight %}

### Not Getting Rid Of FrameBuffers:

{% highlight c++ %}

// Setup
YRB::FramebufferCreateInfo framebuffer_ci = {};
framebuffer_ci.frame_buffer_bindings = &my_fb_bindings;
framebuffer_ci.render_target[0] = swap_chain.images[i];
framebuffer_ci.render_target[1] = depth_stencil_textures[i];
YRB::Framebuffer_Create(&framebuffers[i], framebuffer_ci);
.
.
.
// Recording Command Buffer
Cmd_BeginUseFrameBuffer(cmd, my_fb_bindings, framebuffers[frame_id])
Cmd_EndUseFrameBuffer(cmd)
{% endhighlight %}


## #3 : Let's use less objects to handle (failed attempt)

Merge Framebuffer and RenderPass -> Fail -> Reason: PSO would then need Actual GPU Allocations for RenderTargets to happen before creation.
Tackle this again -> Try to create PSO with a temprory compatible renderpass (only format data is needed from user which is fine) -> Fail -> Reasons:
1. A Temp RenderPass is created and deleted each time a PSO is going to be created. wouldn't this be better if we hashed those for later usages?
2. How do we handle Load/Store operations then, are they going to be defined at Framebuffer create time by user? (Can't reuse RenderPasses and Framebuffers would be much larger than their name indicates which are a bunch of render targets grouped together)

## #4 : Let's use EVEN less objects to handle

To achieve re-use of these objects and simpler interface for the user. we will have no such concepts as RenderPass and Framebuffers.
- We have RenderTargets and we create those very similar to textures
- PSO creation only needs RenderTarget Formats
- Binding of RenderTargets happens with a function like this: ``Cmd_BindRenderTargets(CommandBuffer cmd, RenderTarget * rts, uint32_t count)``

Pros
- Maps really well to D3D12
- Simple Interface and Ease of use
- Even though vulkan implementation is harder, We automatically have the ability to re-use the same RenderPasses and Framebuffers 

Cons
- Runtime decisions and object creation for Vulkan
- Extra state handling and thread-safe operations/lookups for Vulkan Implementation (gets dirty)
- Extra memory to manage and hold for each command buffer.
    

For Vulkan's Implementation:
- Framebuffers are fetched/created from a hashmap of RenderTargetHandles -> FrameBuffer.
- RenderPass is fetched from a similar hashmap of the current state of command buffer -> RenderPass.


# Conclusion

## Going with the nice interface #3 ?
If I decide to go with #3 which has a really nice looking interface. The Renderer implementation for Vulkan will get much harder to manage especially with multi-thread command buffer recording and I think I'm not experienced/ready to implement this yet although it seems very appealing if done correctly, who cares if those lookups take some nano-seconds (hopefully :D). 

Plus if i implement this, going back becomes very hard, I need a middle ground implementation to stay happy for now and I need to know I can easily move to #3 solution which seems nice.

Since our Higher-Level Renderer uses [FrameGraphs](https://www.gdcvault.com/play/1024612/FrameGraph-Extensible-Rendering-Architecture-in) these are mostly the job of the FrameGraph to handle these objects related to using/allocating render targets and objects around it, maybe It would be a waste of time implementing what I don't really need right now.



This is post the following of this [tweet](https://twitter.com/ahmadierfan999/status/1292069752924524544), and thanks to all the people for replying and helping me gather my thoughts :)

# References
- [D3D12_GRAPHICS_PIPELINE_STATE_DESC structure](https://docs.microsoft.com/en-us/windows/win32/api/d3d12/ns-d3d12-d3d12_graphics_pipeline_state_desc)
- [VK Spec : 9.2. Graphics Pipelines](https://www.khronos.org/registry/vulkan/specs/1.1-extensions/html/chap10.html#pipelines-graphics)
- [VK Spec : Render Pass Compatibility](https://www.khronos.org/registry/vulkan/specs/1.1-extensions/html/chap8.html#renderpass-compatibility)
- [Tweet](https://twitter.com/ahmadierfan999/status/1292069752924524544)