---
layout: post
title: The Forge Examples
permalink: /blog/TheForgeExamples/
---

It's been a wonderful couple of weekends for me and I learned a lot of Graphics Techniques and GLSL and HLSL along the way.

I've been implementing these examples in TheForge API which is based on Modern Graphics APIs (Vulkan, DX12, Metal)

[GitHub](https://github.com/Erfan-Ahmadi/TheForgeExamples)

These are some previews: 

### 1. Instancing
<p align="center">
  <img src="https://github.com/Erfan-Ahmadi/TheForgeExamples/raw/master/screenshots/instancing.gif" alt="" width="600" height="400" />
</p>

### 2. Blinn-Phong Lightmapping
Using Blinn-Phong Lighting model with 3 types of lights: **1.Point Light 2.Directional Light 3.Spot Light** and Specular Maps to highlight the outer edges of the cubes. [Blinn-Phong LearnOpenGL](https://learnopengl.com/Lighting/Multiple-lights)
<p align="center">
  <img src="https://github.com/Erfan-Ahmadi/TheForgeExamples/raw/master/screenshots/lightmapping.gif" alt="" width="600" height="400" />
</p>

### 3. Deferred Lighting
Blinn-Phong Deferred Rendering. It writes to normal/position/color map in the 1st Pass, Then uses the Lights Data Passed to GPU as Uniform and Structured Buffers to calculate the colors using these textures.

Deferred Rendering doesn't work too well on High Resolution (**2K**/**4K**) devices such as consoles due to it's memory and It's suggested to use [Visibility Buffers](http://jcgt.org/published/0002/02/04/) instead.

Also on Mobile devices it's good to uses subpasses for tile-based rendering instead of Render Passes, again because of high memory size.

<p align="center">
  <img src="https://github.com/Erfan-Ahmadi/TheForgeExamples/raw/master/screenshots/deffered.gif" alt="" width="600" height="400" />
</p>

### 4. Toon Shading
Simple Toon Shading with outlining. It uses **Stencil Buffers** to draw the cool outlines.
<p align="center">
  <img src="https://github.com/Erfan-Ahmadi/TheForgeExamples/raw/master/screenshots/toonshade.gif" alt="" width="600" height="400" />
</p>

### 5. Tessellation (Passthrough and PN Triangles)
Tessellation using Hull/Control and Domain/Evaluation Shader in HLSL and GLSL. PN-Triangles is a method using **Bezier Triangles** and does not require a heightmap to improve quality of the geometry unlike the first technique which is simple and passthrough tessellation
<p align="center">
  <img src="https://github.com/Erfan-Ahmadi/TheForgeExamples/raw/master/screenshots/tessellation_passthrough.gif" alt="" width="600" height="400" />
  <img src="https://github.com/Erfan-Ahmadi/TheForgeExamples/raw/master/screenshots/tessellation_pntriangles_teapot.gif" alt="" width="600" height="400" />
</p>

### 6. Bloom
Bloom gives noticeable visual cues about the brightness of objects as bloom tends to give the illusion objects are really bright.

The technique used is to render the bloom-affected objects to a 256x256 FBO and then blurred and added to the final scene.
Technique based on **GPU Pro 2 : Post-Processing Effects on Mobile Devices** and [SachaWilliens Vulkan Example](https://github.com/SaschaWillems/Vulkan/tree/master/examples/bloom)

The Final pass is **ToneMapping / Exposure Control** and Gamma Correction  and all the frame buffers before that are rendered as HDR (R16G16B16A16)

<p align="center">
  <img src="https://github.com/Erfan-Ahmadi/TheForgeExamples/raw/master/screenshots/bloom.gif" alt="" width="600"/>
  <img src="https://github.com/Erfan-Ahmadi/TheForgeExamples/raw/master/screenshots/bloom2.gif" alt="" width="600"/>
</p>
