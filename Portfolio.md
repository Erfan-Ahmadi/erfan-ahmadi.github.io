---
title: Erfan Ahmadi Projects
permalink: /Portfolio/
---

Here are my Graphics Projects sorted from latest to oldest.

---
# 1. Bokeh Depth Of Field

[[Blog Post](https://erfan-ahmadi.github.io/Bokeh), [GitHub](https://github.com/Erfan-Ahmadi/BokehDepthOfField)]

It's been a month since I decided to challenge my self with implementing **Bokeh Depth of Field** effect
and began learning complex postfx pipelines.

I've learned a lot about post processing and I'm a lot more comfortable with Scatter-as-Gather thinking

There are 3 methods used to create Depth of Field Effect described briefly in [this blog post](https://erfan-ahmadi.github.io/Bokeh/)

- Circular Depth of Field (paper by Kleber Garcia at Frostbite) used in FIFA, NHS, Need For Speed Heat, Anthem, Mass Effect: Andromeda
- Practical Gather-Based Bokeh (GPU Zen Book)
- Depth of Field in Single Pass (Dennis Gustafsson)
<p align="center">
  <img src="https://github.com/Erfan-Ahmadi/BokehDepthOfField/raw/master/screenshots/simulation/circular-dof/1.jpg" alt="" width="400"/>
  <img src="https://github.com/Erfan-Ahmadi/BokehDepthOfField/raw/master/screenshots/simulation/gather-based/1.jpg" alt="" width="400"/>
  <img src="https://github.com/Erfan-Ahmadi/BokehDepthOfField/raw/master/screenshots/simulation/single-pass/2.jpg" alt="" width="400"/>
</p>

---
# 2. Graphics Projects 

Motivations for these Projects were to get comfortable with TheForge API and gain more experience with some Graphics Techniques I'm interested in.

[[Blog Post](https://erfan-ahmadi.github.io/TheForgeExamples), [GitHub](https://github.com/Erfan-Ahmadi/TheForgeExamples)]

1. Bloom
2. Tessellation
3. Toon Shading
4. Deffered Lighting
5. Instancing

---
### Bloom 

Bloom gives noticeable visual cues about the brightness of objects as bloom tends to give the illusion objects are really bright.

The technique used is to render the bloom-affected objects to a 256x256 FBO and then blurred and added to the final scene.
Technique based on **GPU Pro 2 : Post-Processing Effects on Mobile Devices** and [SachaWilliens Vulkan Example](https://github.com/SaschaWillems/Vulkan/tree/master/examples/bloom)

The Final pass is **ToneMapping / Exposure Control** and Gamma Correction  and all the frame buffers before that are rendered as HDR (R16G16B16A16)

<p align="center">
  <img src="https://github.com/Erfan-Ahmadi/TheForgeExamples/raw/master/screenshots/bloom.gif" alt="" width="400"/>
</p>

---
### Tessellation
Tessellation using Hull/Control and Domain/Evaluation Shader in HLSL and GLSL. PN-Triangles is a method using **Bezier Triangles** and does not require a heightmap to improve quality of the geometry unlike the first technique which is simple and passthrough tessellation
<p align="center">
  <img src="https://github.com/Erfan-Ahmadi/TheForgeExamples/raw/master/screenshots/tessellation_pntriangles_teapot.gif" alt="" width="400"/>
</p>

---
### Toon Shading

Simple Toon Shading with outlining. It uses **Stencil Buffers** to draw the cool outlines.
<p align="center">
  <img src="https://github.com/Erfan-Ahmadi/TheForgeExamples/raw/master/screenshots/toonshade.gif" alt="" width="400"/>
</p>

---
### Deffered Lighting

Blinn-Phong Deferred Rendering. It writes to normal/position/color map in the 1st Pass, Then uses the Lights Data Passed to GPU as Uniform and Structured Buffers to calculate the colors using these textures.

Deferred Rendering doesn't work too well on High Resolution (**2K**/**4K**) devices such as consoles due to it's memory and It's suggested to use [Visibility Buffers](http://jcgt.org/published/0002/02/04/) instead.

Also on Mobile devices it's good to uses subpasses for tile-based rendering instead of Render Passes, again because of high memory size.

<p align="center">
  <img src="https://github.com/Erfan-Ahmadi/TheForgeExamples/raw/master/screenshots/deffered.gif" alt="" width="400" />
</p>

---
# 3. SIMD and GPGPU Collision Detection

Implementing Different Methods of Circle to Circle Collision with **Spatial Partitioning** Techniques and Vulkan Graphics Compute and SIMD AVX2 Technologies

Resources and More Details and Charts are on Github Page.

[[GitHub](https://github.com/Erfan-Ahmadi/CircleCollision)]

### Motivation

This Project Is For Learning Purposes of Following Topics
- SIMD/Vectorization using **AVX**/**AVX2**
- Vulkan Compute Shaders and GPGPU Programming
- Data Oriented Programming

**Circles** were chosen to focus more on [**Broad-Phase**](https://developer.nvidia.com/gpugems/GPUGems3/gpugems3_ch32.html) algorithms of the Collision Detection Pipeline.

<p align="center">
 <img src="https://raw.githubusercontent.com/Erfan-Ahmadi/circle_collision/master/docs/draw-fun.gif" alt="" width="320" height="180" /> 
 <img src="https://raw.githubusercontent.com/Erfan-Ahmadi/circle_collision/master/docs/explode_fun.gif" alt="" width="320" height="180" />
</p>

- **Broad-Phase**
  - Brute Force ( O(n^2) )
  - Spatial Partitioning
    - Grid
    - K-D Tree
    - Quadtrees
    - BSP
  - Sort and sweep
  - Simplex-Based : GJK
  
- **Narrow-Phase**
   - We Have Circles Here and Math/Physics Calculations are easy.
   
- **Technologies/API's**
  - **CPU**
    - Simple Sequential  
    - Multi-Threaded
    - SIMD
      - AVX2
      - AVX-512
  - **GPU**
    - Vulkan Compute Shaders
    - OpenCL

 
