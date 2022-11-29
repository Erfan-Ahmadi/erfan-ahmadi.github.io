---
title: Uploading Textures to GPU - The Good Way
permalink: /blog/Nabla/imageupload
---


<p align="center">
<img src="https://raw.githubusercontent.com/Erfan-Ahmadi/erfan-ahmadi.github.io/master/images/Nabla/image_transfer.png" align="center" alt="" hspace="20"/>
</p>

In this short blog post, I will explain the new utility I added to our open-source [Nabla](https://github.com/Devsh-Graphics-Programming/Nabla) Rendering API, which is a tool used to upload a texture asset to the GPU over a staging buffer.

This tool can upload your texture in batches, meaning when there is not enough "transfer" memory we submit every single block of texture we can and pick up where we left off after the upload to GPU is finished.

[Nabla](https://github.com/Devsh-Graphics-Programming/Nabla) Rendering API has a very similar front-end as Vulkan, and actually has Vulkan as one of it's backends! so expect a lot a vulkan literature from me here.

Additionally I use "copy" and "transfer" interchangeably.

Before going into this blog, It's best if you have an understanding how "Modern" Rendering APIs work with memory and submission of work to GPU.

Let's get started.

# Uploading Textures - The Bad/Tutorial Way

Here is a high level descriptions on the simplest approach to tranfering your textures to the GPU:

1. Image is loaded into CPU Memory
2. Create a CPU-mappable GPU buffer and allocate memory for it, sometimes referred to as `StagingBuffer` or `StagingMemory` with the size of the loaded image (in vulkan terms is `HOST_VISIBLE` and `DEVICE_LOCAL`)
3. Record a copy command from a Buffer to GPU-side Image into a commandbuffer 
4. Submit that command buffer to a "Transfer" capable Queue 
5. Wait for the submission to complete using a fence or semaphore indicating the transfer is done!

The problem with this approach is allocating gpu memory each time you want to upload a texture, and this is not good.
Even if you're using tools such as [VulkanMemoryAllocator](https://gpuopen.com/vulkan-memory-allocator/) that handles your allocations via pools or custom allocators, you'd still run into problems.

 What if there is not enough "Staging" memory available at the moment for you to allocate? Due to it being currently in use by other processes or threads. or even if the GPU has not enough "Staging" memory available for your big MEGA texture.

 # Uploading Textures - The Good Way

1. Our tool, unlike the simple method, creates a single host-mappable buffer (default 64MB) and creates a Pool over it or as we like to call it `GeneralpurposeAddressAllocator`.
The size of this buffer may be much more than the texture you want to upload or much less, that doesn't matter to our tool.

2. try to allocate `min(neededSizeToFinishTransferInOneSubmit, maximumPossiblePoolAllocationSize)` from the pool and get an address into our buffer 

3. Record the copy commands in this order 
   - Try to upload as much arrayLayers as possible 
   - If failed try to upload as much slices/depth as possible (makes sense for 3D textures) 
   - If failed try to upload as much rows as possible
   - If failed try to upload as much blocks as possible
   - Repeat until we run out of staging memory

4. When you run out memory, submit everything to the queue and repeat again until the whole region is transferred.


We should always assume there may not be enough memory to do the whole copy/transfer in one submissionn
that means we may need to submit every (copy) command we've recorded so far into the commandbuffers and resume our work; 
This means command buffers need to be submitted to the queue once the allocation fails (not enough memory)

This brought certain implementation and interface challenges mentioned in the next parts in more detail.


# Some Cool Additions and Features

## 1. Format Promotion

As you may already know there is a lot constraints/limits by your PhysicalDevice/GPU you should look out for in your applications; One of these constraints include the formats and other properties you can create your images with.

Your loaded assets may not be in the format you can use on the GPU.
A simple solution is to convert your assets at runtime on the CPU, that requires allocating a possibly bigger CPU-side memory, for your already MEGA texture.

Our nice solution converts the format WHILE copying to the Staging memory, and there is no need for additional allocations!
So for example you could have `RGB32` asset and upload that to a `BGRA32` gpu texture, or even to block compressed formats :)

## 2. Taking Advantage of Physical Device Information

We take advantage of `optimalBufferCopyRowPitchAlignment` and `optimalBufferCopyOffsetAlignment`. (more details [here](https://registry.khronos.org/vulkan/specs/1.3-extensions/man/html/VkPhysicalDeviceLimits.html))

Also noting that this tool is very Vulkan conformant and considers `minImageTransferGranularity` of the Queue you're using for your command submission along with `nonCoherentAtomSize` if the staging buffer is not Coherent (needs manual cash flush/invalidate)

## 3. Our StreamingBuffer is Async
That means you can submit texture transfers in multiple threads and the allocation in the pool will be available/freed once the submission fence/semaphore has been hit, indicating the GPU is done with the transfer

# Implementation Details (for curious minds)

One of the core parts of this tool is `ImageRegionIterator` that acts as an iterator over the region intended for transfer, based on availableMemory. you can think of it as a state to be resumed later.
You can see interface [here](https://github.com/Devsh-Graphics-Programming/Nabla/blob/dac9855ab4a98d764130e41a69abdc605a91092c/include/nbl/video/utilities/IUtilities.h#L1005) and implementation [here](https://github.com/Devsh-Graphics-Programming/Nabla/blob/dac9855ab4a98d764130e41a69abdc605a91092c/src/nbl/video/utilities/IUtilities.cpp#L466).

The main challenges with this tool was that it needed to do in between submits, and in a low-level rendering api that might come out as quite unpleasant, because:

- We don't want to create command buffers + fence each time and upload is requested
- Ideally, We want the use to give us a command buffer to record copy command into and then let them submit themselves
- We want the user to be able to take advantage of certain synchronization features:
  - be able to wait for semaphores before copy starts
  - be able to signal certain semaphores after the copy finished
  - be able to signal a fence when the copy is finished.

We need to be careful here, for the in-between submits, we shouldn't signal the semaphores, the signal should only happen for the last batch of transfers.

Additionally, after an in-between submit has happened, we should nullify `waitSemaphores` of the submit user wants to do. because the wait has happened already (we ran out memory while transfering the image and we had to submit, no other way).

[Here](https://github.com/Devsh-Graphics-Programming/Nabla/blob/dac9855ab4a98d764130e41a69abdc605a91092c/include/nbl/video/utilities/IUtilities.h#L424) is the final interface we decided to go with that includes additional commments and notes above the function.

