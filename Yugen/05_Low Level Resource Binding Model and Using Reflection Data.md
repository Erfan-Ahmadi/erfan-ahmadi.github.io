---
layout: post
title: Low-Level Resource Binding Model
permalink: /blog/Yugen/LowLevelResourceBinding
---

# Introduction

In this part of my journal on [Yugen Engine](/blog/Yugen/), I'll be talking about how we use the reflection data provided in our Shader Asset data to update and allocate descriptor sets.

To know more about yugen's asset system and shader asset [see this post](/blog/YUGA)

<p align="left">
  <img src="https://raw.githubusercontent.com/Erfan-Ahmadi/erfan-ahmadi.github.io/master/images/Yugen/YUGA_Shaders.png" alt="" width="300"/>
</p>


To fully understand this post you should be able to have a good undestanding of modern graphics APIs and their binding models and concepts such as descriptor sets, If you don't I suggest the following resources:
   - [Performance Tweets Series: Root signature & descriptor sets - GPUOpen](https://gpuopen.com/performance-root-signature-descriptor-sets/)
   - [Descriptor binding: DX12 and Vulkan - Graphics and GPU Programming - GameDev.net](https://www.gamedev.net/forums/topic/678860-descriptor-binding-dx12-and-vulkan/)
   - [Tips and Tricks: Vulkan Dos and Don'ts | NVIDIA Developer Blog](https://devblogs.nvidia.com/vulkan-dos-donts/)
   - [Shader modules - Vulkan Tutorial](https://vulkan-tutorial.com/Drawing_a_triangle/Graphics_pipeline_basics/Shader_modules)
   - [Descriptor pool and sets - Vulkan Tutorial](https://vulkan-tutorial.com/Uniform_buffers/Descriptor_pool_and_sets)
   - [Choosing a binding model · Issue #19 · gpuweb/gpuweb · GitHub](https://github.com/gpuweb/gpuweb/issues/19)
   - [13.2. Descriptor Sets](https://vulkan.lunarg.com/doc/view/1.0.33.0/linux/vkspec.chunked/ch13s02.html)


I will not go into details on how we reflect shader data, we have ShaderReflector Project that uses a more updated version of this [repository] (https://github.com/yzt/spvreflect)

# Vulkan Binding Model Reminder

``VkDescriptorSetLayout`` describe the layout of the bindings in a set. (for [ImmutableSamplers]() it will have a handle to a VkSampler.)

``VkDescriptorSet`` has references to actual GPU resources and is bound with command buffers and is allocated from a ``VkDescriptorPool`` and with a ``VkDescriptorSetLayout``.

[VkPipelineLayout]() is an important object that makes it possible to access descriptor sets. 

PipelineLayouts are then passed to VkXXXXPipelineCreateInfo at Pipeline Creation time. *(XXX is pipeline type such as Graphics and Compute)*

PipelineLayouts are most importantly created from [VkDescriptorSetLayouts]()

# What does it mean to "update" a DescriptorSet?

It's often misunderstood by beginners the difference between updating a **DescriptorSet** and updating a **resource**.

# DescriptorSet Frequencies 

It's good to note here that we seperate Descriptors into sets based on their frequency at Renderer Interface Level, So each time you want to allocate a descriptor set you'll have to decide which set of the PipelineLayout you want by Frequency.

```c++
enum class DescriptorSetUpdateFrequency {
    Never,
    PerFrame,
    PerBatch,
    PerDraw,
};
```
These 4 frequencies are enough for our low-level renderer and looking at Vulkan Hardware Limits -> **maxBoundDescriptorSets** we're safe on all GPUS, although most modern GPs support 8 bound descriptor sets.

But why is it good to Seperate our DescriptorSets by Frequency and why Is it suggested many places?

## blah blah important stuff blah blah


# YRB::PipelineLayout

[An Image which has ShaderPipelines as Input]

We also have a PipelineLayout exposed to Yugen Backend Renderer interface. 
It internally contains a VkPipelineLayout and has enough data to make it possible for us to update our descriptor sets via name we got from our Shader Asset Blocks.

PipelineLayout helps us
1. Allocate Descriptors 
2. Update Descriptors via name
3. Pushing Constants. See [VkPushConstants]()

Example Usage:

```c++
    YRB::PipelineLayoutCreateInfo plci = {};
    plci.shader_pipelines = &my_shaders; // consists of a vert and a frag shader
    plci.shader_pipelines_count = 1; // count
    plci.static_samplers = &static_sampler_info; // you just give me name and handle of your sampler and I will use it as an Immutable Sampler
    plci.static_samplers_count = 1; // count
    YRB::PipelineLayout_Create(&my_pipeline_layout, plci); // Create PipelineLayout

    // Allocate 1 Descriptor Set with this frequency and pipeline layout
    YRB::DescriptorSets_Allocate(&descriptor_set_no_freq, 1, my_pipeline_layout, YRB::UpdateFreqency::Never);
    // Allocate 1 Descriptor Set with this frequency and pipeline layout
    YRB::DescriptorSets_Allocate(&descriptor_set_per_frame, 1, my_pipeline_layout, YRB::UpdateFreqency::PerFrame);

    // UpdateInfo Scheme
    // { "Name", ArrayCount, TextureArray, BufferArray, SamplersArray } 

    // Update your DescriptorSets with name and resource handles only :)
    YRB::DescriptorUpdateInfo update_infos_per_frame[3] = 
    { 
        { "MyUniformBuf",   1, nullptr,                  &my_buffer, nullptr },
        { "MyRWTextureCoC", 1, &hdr_downsampled_texture, nullptr,    nullptr },
        { "TextureColor",   1, &hdr_texture,             nullptr,    nullptr },
    };
    YRB::DescriptorSet_Update(descriptor_sets_per_frame, update_infos_per_frame, 3);
    
    YRB::DescriptorUpdateInfo update_infos_no_freq[1] = 
    { 
        { "TextureArray", 10, my_texture_handles, nullptr, nullptr },
    };
    YRB::DescriptorSet_Update(descriptor_sets_per_frame, update_infos_per_frame, 1);
```

And Before Draw/Dispatch Commands we bind those descriptors :
```c++
    YRB::Cmd_BindDescriptorSet(cmd, YRB::PipelineBindPoint::GRAPHICS, descriptor_set_no_freq);
    YRB::Cmd_BindDescriptorSet(cmd, YRB::PipelineBindPoint::GRAPHICS, descriptor_set_per_frame);
``` 

If you've worked with Vulkan before, you know how much easier this model is :D

# YRB::ShaderPipeline

Creating a YRB::PipelineLayout needs all your Shaders that go into your graphics or compute pipeline.

We do all kinds of validations with this, for example when two descriptors with same **binding** and **set** in a ShaderPipeline mismatch in offset, size or even name.

We wrap shaders that are going into a pipeline in a ShaderPipeline. 

# Implementation Details on Vulkan

## Variable and Descriptor Infos

These are internal structs helping us assign resource names to actual GPU Resources.

```c++
// Note: DescriptorInfo and VariableInfo is in the Context of PipelineLayout
struct DescriptorInfo {
    DescriptorType          type                    = DescriptorType::Invalid; // Type of the descriptor
    VkShaderStageFlags      stages                  = 0; // Used in which shader stages
    uint32_t                template_data_offset    = 0; // Explained Later
    uint32_t                offset                  = 0;
    uint32_t                size                    = 0;
    uint16_t                first_variable_index    = 0; // Refering to the index in PipelineLayout Variable Array
    uint16_t                variables_count         = 0;
};

struct VariableInfo {
    uint16_t                parent_index            = 0; // Refering to the index in PipelineLayout Descriptor Array
    VkShaderStageFlags      stages                  = 0; // Note: Can be queried by indirection: pipeline_layout.descriptor_infos[parent_index].stages
    uint32_t                offset                  = 0;
    uint32_t                size                    = 0;
};
```

## PipelineLayout Internal Struct

```c++
struct PipelineLayout {
    VkPipelineLayout handle = VK_NULL_HANDLE; // Our Vulkan PipelineLayout

    VkDescriptorSetLayout   layouts[DescriptorSetUpdateFrequency::Count] = {}; // Storing Created DescriptorSetLayouts to Allocate DescriptorsFromLater
    uint8_t                 layouts_count = 0;

    // Descriptor Infos
    DescriptorInfo descriptor_infos[MaxDescriptorsPerPipelineLayout];
    uint16_t       descriptor_infos_count = 0;
    StrToIntMap    descriptor_index_map; // HashMap from name to Index in descriptor_infos

    // Variable Infos
    VariableInfo variable_infos[MaxVariablesPerPipelineLayout]; 
    uint16_t     variable_infos_count = 0;
    StrToIntMap  variable_index_map;  // HashMap from name to Index in variable_infos

    uint32_t                    element_counts[DescriptorSetUpdateFrequency::Count]   = {}; // Count of descriptors in each set
    VkDescriptorUpdateTemplate  update_templates[DescriptorSetUpdateFrequency::Count] = {}; // This is the vulkan object helping us update our descriptor sets in this pipeline layout

    uint16_t dynamic_buffers_counts[MaxDescriptorSets] = {}; // Explained Later
};
```

``StrToIntMap    descriptor_index_map;`` is helping us map names to descriptor infos; Same applies to Descriptor Variables.

# Updating DescriptorSets via VkDescriptorUpdateTemplate


