---
title: Render Targets Abstraction
permalink: /blog/Yugen/RenderTargets
---

# What's the problem I'm trying to solve?

This is the following of this [tweet](https://twitter.com/ahmadierfan999/status/1292069752924524544), and thanks to all the people for replying and helping me gather my thoughts :)

A good usable interface and abstraction for binding/creating/using render targets over Modern Graphics APIs considering following limitation(s):
- We are not going to support subpasses and tiled-based rendering.
- Minimizing extra memory and state handling by RenderBackend Implementation. 

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

## #1 : Let's make the names a bit better.
1. Since RenderPass