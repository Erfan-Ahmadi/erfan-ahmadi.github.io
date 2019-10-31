---
title: The Forge Examples
permalink: /Bokeh/
---

# Bokeh Depth Of Field

Implementing Different Algorithms to mimic Bokeh Depth Of Field: A Physical Camera Effect created due to Focal Length, Aperture size, shape

This Project is using [The Forge Rendering API](https://github.com/ConfettiFX/The-Forge), a cross-platform rendering, and targeted for these devices: PC, Android, macOS, IOS, IPad OS devices.

## Motivation

To mimic the physical camera in real-time in an efficient way to reduce postfx overheads.

## Sample Real Camera Effects

<p align="center">
  <img src="https://github.com/Erfan-Ahmadi/BokehDepthOfField/raw/master/screenshots/real/newyork_maybe.jpg" alt="" width="300"/>
  <img src="https://github.com/Erfan-Ahmadi/BokehDepthOfField/raw/master/screenshots/real/beauty.jpg" alt="" width="300"/>
</p>

## Real-Time Bokeh Screen Shots

- [Circular Seperable Depth of Field](https://github.com/Erfan-Ahmadi/BokehDepthOfField/tree/master/src/CircularDOF) 
<p align="center">
  <img src="https://github.com/Erfan-Ahmadi/BokehDepthOfField/raw/master/screenshots/simulation/circular-dof/1.jpg" alt="" width="400"/>
  <img src="https://github.com/Erfan-Ahmadi/BokehDepthOfField/raw/master/screenshots/simulation/circular-dof/2.jpg" alt="" width="400"/>
</p>

- [Practical Gather-based Bokeh Depth of Field](https://github.com/Erfan-Ahmadi/BokehDepthOfField/tree/master/src/GatherBasedBokeh)
<p align="center">
  <img src="https://github.com/Erfan-Ahmadi/BokehDepthOfField/raw/master/screenshots/simulation/gather-based/1.jpg" alt="" width="400"/>
  <img src="https://github.com/Erfan-Ahmadi/BokehDepthOfField/raw/master/screenshots/simulation/gather-based/3.jpg" alt="" width="400"/>
</p>

- [Single Pass Depth of Field](https://github.com/Erfan-Ahmadi/BokehDepthOfField/tree/master/src/SinglePassBokeh)
<p align="center">
  <img src="https://github.com/Erfan-Ahmadi/BokehDepthOfField/raw/master/screenshots/simulation/single-pass/2.jpg" alt="" width="400"/>
  <img src="https://github.com/Erfan-Ahmadi/BokehDepthOfField/raw/master/screenshots/simulation/single-pass/4.jpg" alt="" width="400"/>
</p>

## Implemented Techniques

- [Circular Seperable Depth of Field](https://github.com/Erfan-Ahmadi/BokehDepthOfField/tree/master/src/CircularDOF) - [Resources](#CircularDOF)
- [Practical Gather-based Bokeh Depth of Field](https://github.com/Erfan-Ahmadi/BokehDepthOfField/tree/master/src/GatherBasedBokeh) - [Resources](#GatherBased)
- [Single Pass Depth of Field](https://github.com/Erfan-Ahmadi/BokehDepthOfField/tree/master/src/SinglePassBokeh) - [Resources](#SinglePass)

## Build
  - [x] Visual Studio 2017:
    * Put Repository folder next to cloned [The-Forge API](https://github.com/ConfettiFX/The-Forge) repository folder
    * Build [The-Forge API](https://github.com/ConfettiFX/The-Forge) Renderer and Tools and place library files in **build/VisualStudio2017/$(Configuration)** for example build/VisualStudio2017/ReleaseDx
    * Assimp: 
      - Build Assimp for Projects involving Loading Models
      - Don't change the directory of assimp.lib, the Default is: 
         - **The-Forge\Common_3\ThirdParty\OpenSource\assimp\4.1.0\win64\Bin**

## Issues

Report any bug on your devices with most detail [here](https://github.com/Erfan-Ahmadi/BokehDepthOfField/issues)

## Resources 

All Bokeh Links and Book Chapters gathered for R&D are in [this github gist](https://gist.github.com/Erfan-Ahmadi/e27842ce9daa163ec10e28ee1fc72659); for detailed resources and links see below:

- <a name="CircularDOF"></a>Circular Depth of Field (Kleber Garcia)
  - [Circular Separable Convolution Depth of Field Paper - Keleber Garcia](https://github.com/kecho/CircularDofFilterGenerator/blob/master/circulardof.pdf)
  - [Circularly Symmetric Convolution and Lens Blur - Olli Niemitalo](http://yehar.com/blog/?p=1495)
- <a name="GatherBased"></a>GPU Zen (Wolfgang Engel) : Screen Space/Practical Gather-based Bokeh Depth of Field
  - [Book Amazon](https://www.amazon.com/GPU-Zen-Advanced-Rendering-Techniques-ebook/dp/B0711SD1DW)
  - [GitHub](https://github.com/wolfgangfengel/GPUZen)
- <a name="SinglePass"></a>[Bokeh depth of field in a single pass - Dennis Gustafsson](http://blog.tuxedolabs.com/2018/05/04/bokeh-depth-of-field-in-single-pass.html)
  
