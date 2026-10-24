# GPU-Driven Anything: release texts

Replace VIDEO_ID with the YouTube id once the video is up (also in the post's frontmatter and chapter links).

## YouTube title

GPU-Driven Anything

## YouTube description

There is a pattern underneath some of the most important graphics techniques. Culling, level of detail, light clusters, particle systems, marching squares, Gaussian splatting: they look like different problems, but in each one a hundred thousand GPU threads want to write into one list, in order, with no gaps, and none of them knows where its place is.

This video is about that pattern: count, prefix sum, write. The three shapes it takes (compaction, expansion, binning), how they chain into a GPU-driven frame, and two nuances for the advanced viewers: push vs. pull, and atomics instead of a prefix sum.

Every animation in the video is an interactive page you can play with, with the papers and talks each example comes from:
https://erfan-ahmadi.github.io/blog/gpu-driven-anything/

Chapters
0:00 The pattern
2:35 Prefix sum
4:19 Expansion
4:53 Compaction
5:12 Compaction + expansion
6:19 Binning
8:06 Push vs. pull
10:40 Atomics

Prefix sum resources, as promised:

Prefix sum on Wikipedia: the serial version and the two classic parallel ones, a good first stop
https://en.wikipedia.org/wiki/Prefix_sum

GPU Gems 3, chapter 39, Parallel Prefix Sum (Scan) with CUDA (Harris, Sengupta, Owens, 2007): the classic work-efficient scan, with code, and compaction as an application
https://developer.nvidia.com/gpugems/GPUGems3/gpugems3_ch39.html

Prefix Sums and Their Applications (Blelloch, 1990): where the all-prefix-sums idea and its many uses come from
https://www.cs.cmu.edu/~scandal/papers/CMU-CS-90-190.html

Data Parallel Algorithms (Hillis and Steele, 1986): the simple log-step scan
https://doi.org/10.1145/7902.7903

Scan Primitives for GPU Computing (Sengupta, Harris, Zhang, Owens, 2007): scan and segmented scan as GPU building blocks
https://diglib.eg.org/handle/10.2312/EGGH.EGGH07.097-106

Single-pass Parallel Prefix Scan with Decoupled Look-back (Merrill and Garland, 2016): the state of the art, the one inside CUB
https://research.nvidia.com/publication/2016-03_single-pass-parallel-prefix-scan-decoupled-look-back

Prefix sum on Vulkan (Raph Levien, 2020), and the portable follow-up (2021): decoupled look-back in a compute shader, and what it takes to run it everywhere
https://raphlinus.github.io/gpu/2020/04/30/prefix-sum.html
https://raphlinus.github.io/gpu/2021/11/17/prefix-sum-portable.html

GPUPrefixSums (Thomas Smith): a survey of prefix sum implementations in HLSL, CUDA and WGSL, from the wave to the whole device
https://github.com/b0nes164/GPUPrefixSums

Efficient Stream Compaction on Wide SIMD Many-Core Architectures (Billeter, Olsson, Assarsson, 2009): compaction built on a scan
https://diglib.eg.org/handle/10.2312/EGGH.HPG09.159-166

WavePrefixSum in HLSL: the scan within one wave, one intrinsic
https://learn.microsoft.com/en-us/windows/win32/direct3dhlsl/waveprefixsum

The pull side of expansion, as load-balancing search in ModernGPU
https://moderngpu.github.io/loadbalance.html

Blog: https://erfan-ahmadi.github.io
X: https://x.com/ErFunRender

#gpu #rendering #graphicsprogramming #gamedev #compute #vulkan #shaders

## X (Twitter)

Long post (needs Premium for the length), with the clip:

There is a pattern underneath some of the most important graphics techniques. Culling, level of detail, light clusters, particle systems, Gaussian splatting: they look like different problems, but in each one a hundred thousand GPU threads want to write into one list, in order, with no gaps, and none of them knows where its place is.

New video on that pattern: count, prefix sum, write. The three shapes it takes (compaction, expansion, binning), how they chain into a GPU-driven frame, and two nuances for the advanced crowd: push vs. pull, and atomics instead of a prefix sum.

Every animation is an interactive page you can play with. Links below.

Reply, right under it:

Watch the full video: https://www.youtube.com/watch?v=VIDEO_ID
Play with every animation, with the papers each example comes from: https://erfan-ahmadi.github.io/blog/gpu-driven-anything/

Thread version, each under 280 characters, with the clip on the first:

1/ There is a pattern underneath some of the most important graphics techniques: culling, level of detail, light clusters, particles, Gaussian splatting. In each one, 100,000 GPU threads want to write into one list, in order, with no gaps. New video, thread:

2/ The pattern: count, prefix sum, write. Three shapes of it: compaction (culling), expansion (level of detail), binning (light clusters). Then how the first two chain into a GPU-driven frame.

3/ Two nuances for the advanced crowd: push vs. pull, and atomics instead of a prefix sum (perfectly compact, but not in the same order every frame).

4/ Watch the full video: https://www.youtube.com/watch?v=VIDEO_ID
Play with every animation, with the papers each example comes from: https://erfan-ahmadi.github.io/blog/gpu-driven-anything/

## LinkedIn

Post, with the clip:

There is a pattern underneath some of the most important graphics techniques. Culling, level of detail, light clusters, particle systems, marching squares, Gaussian splatting: they look like different problems, but in each one a hundred thousand GPU threads want to write into one list, in order, with no gaps, and none of them knows where its place is.

On the CPU that is a push_back. On the GPU there is no push_back, and what replaces it is a pattern you can learn once and then recognize everywhere: count, prefix sum, write.

The new video walks through it with interactive visualizations:
- The three shapes it takes: compaction (culling), expansion (level of detail), binning (light clusters)
- How compaction and expansion chain into a GPU-driven frame
- Two nuances for the advanced crowd: push vs. pull, and atomics instead of a prefix sum

Every animation is an interactive page you can play with, with the papers and talks each example comes from. The full video and the page are in the first comment.

First comment:

Watch the full video: https://www.youtube.com/watch?v=VIDEO_ID
Play with every animation: https://erfan-ahmadi.github.io/blog/gpu-driven-anything/

## Clip suggestions for the snippet

- 0:00 to about 0:40: the culling scene, the push_back line struck through, the burst of threads writing. Ends on the question.
- Or the pull counting beats: the thread asking "Where do I come from?" and the triangles being counted up. Ends on "or can it?" energy without the title.
