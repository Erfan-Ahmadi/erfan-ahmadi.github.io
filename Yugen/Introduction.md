---
title: Yugen Engine Introduction
permalink: /Yugen/Introduction
---

# Yugen Engine 

Yūgen (幽玄) is an important concept in traditional Japanese aesthetics. The exact translation of the word depends on the context. In the Chinese philosophical texts the term was taken from, yūgen meant "dim", "deep" or "mysterious".

Yugen Engine is an In-House Game Engine we're developing at DeadMage which is in it's early stages of development.

## What is interesting about Yugen?

1. We started it from scratch for the next title of DeadMage Studios (hopefully) and there is no legacy code to wrestle with!
2. We decided to have Vulkan as our First Rendering API to develop on and we have a minimal rendering abstraction on top of it.

In these series of blog posts that come out as a journal for me I'm going to focus mostly on Our Rendering System. 
My friends are working on exciting subsystems such as World Editor, Scripting System, Job system, ECS; I hope they blog about it and share their knowledge too. 

## What is already developed on Yugen Rendering System ?

**Yugen Renderer Backend** is a thin layer of abstraction on top of vulkan getting rid of lots of boiler plate code, And we have the convenience to Update Descriptor Sets and Push Constants with their names with the help of our SPV Reflector (shout out to [@Yzt](https://github.com/yzt/spvreflect))

### Core Rendering System and Binding Model  
Concepts such as SwapChain, Image, Buffer, CommandBuffer, Queues, DescriptorSets, Push Constants, Semaphores and Fences are all exposed in this abstraction layer.
Our biggest structure in **YRB**  is PipelineLayout which holds the most data, I'm going through this and the binding model for **Yugen Renderer Backend** in another blog post.

### Dear Imgui Integration
We also integrated [dear imgui](https://github.com/ocornut/imgui) and we have a imgui_yugen_impl that we can have so much fun with later (online profilers, statistics and runtime debugging tools)

### Demo Framework System
We have a really simple and cool demo-framework system which I'm very proud of that allows us to add Demos really easy.
1. You create a class and inherit from DemoFramework and start implementing a Demo
2. You Register that class and give it a name.
And when you select a Demo from the command line or the command arguments it will construct the selected demo and will run it.

Here is an example simplified demo code :

```
class Demo009_MSAA : public DemoFramework 
{
protected:
    virtual bool DoInitResources() override;
    virtual bool DoExitResources() override;
    virtual void OnUI() override;
    virtual void DoDraw(uint32_t frame_index, float dt) override;
    virtual char const * GetWindowTitle() const override { return "MultiSampling"; }
    virtual void OnResize(uint32_t new_width, uint32_t new_height) { Unload(); Load(new_width, new_height); }
    virtual void OnClose() override { should_quit = true; }
    virtual bool ShouldQuit() override { return should_quit; }
    ...
    ...
    ...
private:
    YRB::GraphicsPipeline   graphics_pipeline_simple = {};
    YRB::GraphicsPipeline   graphics_pipeline_msaa = {};
    YRB::GraphicsPipeline   graphics_pipeline_sample_rate_shading = {};

    // Render Targets:
    YRB::Texture depth_rt_texture[YRB::Swapchain::MaxImages];
    YRB::Texture multisampling_depth_rt_texture[YRB::Swapchain::MaxImages];
    YRB::Texture multisampling_color_rt_texture[YRB::Swapchain::MaxImages];
    
    YRB::Swapchain swap_chain = {};

    YRB::CommandPool onetime_transfer_cmd_pool = {};
    YRB::CommandPool onetime_graphics_cmd_pool = {};

    YRB::Fence      fences_framedone[YRB::Swapchain::MaxImages] = {};
    YRB::Semaphore  semaphore_imageacquire[YRB::Swapchain::MaxImages] = {};
    YRB::Semaphore  semaphore_readytopresent[YRB::Swapchain::MaxImages] = {};
    YRB::CommandPool graphics_cmd_pool = {};
    
    YRB::Buffer             view_proj_uniform_buffer[YRB::Swapchain::MaxImages] = {};
    YRB::Buffer             models_uniform_buffer[YRB::Swapchain::MaxImages];
}

static auto _ = Demo_Register("MultiSampling", [] { return new Demo009_MSAA(); });
```
<p align="center">
  <img src="https://raw.githubusercontent.com/Erfan-Ahmadi/erfan-ahmadi.github.io/master/images/Yugen/techdemo_selection.png" alt="" width="600"/>
</p>

## Demos

These Demos are ran on **YRB** (Yugen Renderer Backend) on Vulkan.

They are still written pretty low-level and one needs understanding of Modern Graphics APIs like D3D12 or Vulkan to be able to work with it because the concepts are 99% similar.

For example our Bokeh Depth of Field Demo is ~1400 SLOC which has 7 Render Passes and 14 Render Targets.

### This Demo shows loading the YUGA Mesh and sending it's data to YRB, We have our own Asset Format named YUGA which is gltf importable.

<p align="center">
  <img src="https://raw.githubusercontent.com/Erfan-Ahmadi/erfan-ahmadi.github.io/master/images/Yugen/yuga_mesh.png" alt="" width="500"/>
</p>


### This Demo uses Dynamic Uniform Buffers in Vulkan. Offsets into a big memory instead of having a descriptor set for each object. 

<p align="center">
  <img src="https://raw.githubusercontent.com/Erfan-Ahmadi/erfan-ahmadi.github.io/master/images/Yugen/dynamic_uniform_buffers.png" alt="" width="500"/>
</p>

### This Demo that challenges the Backend Renderer with lots of PipelineBarriers. RenderTargets and Graphics Pipelines and DescriptorSets 

<p align="center">
  <img src="https://raw.githubusercontent.com/Erfan-Ahmadi/erfan-ahmadi.github.io/master/images/Yugen/dof_c.png" alt="" width="500"/>
</p>

### Other Demos

<p align="center">
  <img src="https://raw.githubusercontent.com/Erfan-Ahmadi/erfan-ahmadi.github.io/master/images/Yugen/msaa.png" alt="" width="300"/>
</p>

## What is under develop?

1. High-Level Rendering System

Our high-level rendering system is inspired by the idea of frame graphs (or some call it render graphs).
High-level renderer user declares what passes need to be done and it implicitly defines dependencies between those passes by declaring resources and connecting inputs and outputs via handles or names(strings).
It the gives us the oportunity to compile this graph before executing it, compiling it allows 1. aliasing transient memories (render targets) 2. Possibility of Async Compute 3. Optimizing away outputs that don't take part in the final results.

-[Tiago Rodrigues, Advanced Graphics Tech: Moving to DirectX 12: Lessons Learned, GDC 2017](https://www.gdcvault.com/play/1024656/Advanced-Graphics-Tech-Moving-to)
-[Yuriy O’Donnell, FrameGraph: Extensible Rendering Architecture in Frostbite, GDC 2017](https://www.gdcvault.com/play/1024612/FrameGraph-Extensible-Rendering-Architecture-in)

2. Material/Shader System
Needs research about what we need for the game we're developing.

3. A Good GPU Memory Manager
  We currently use VMA tool for the underlying memory management but we need to expose extra features to be able to do some low-level jobs like memory aliasing.

## Wrap-Up

I'm learning a lot by contributing to this engine and I want to share it here as a journal and I hope someone enjoys reading it.
This post wasn't technical but I have many many technical ideas to post about Yugen here and I'm excited about it.
