# GPU-Driven Anything: release texts

Replace VIDEO_ID with the YouTube id once the video is up (also in the post's frontmatter and chapter links).

## YouTube title

GPU-Driven Anything

## YouTube description

On the CPU, filtering a list is one line: if the object is visible, push it back. On the GPU every object gets its own thread, and that line is gone. A hundred thousand threads all want to write to the same list, in order, with no gaps, and none of them knows where its place is.

The answer to that one question is hiding inside culling, level of detail, light clusters, particle systems, vector graphics, marching squares and Gaussian splatting. This video is about seeing the pattern: count, prefix sum, write. Three shapes of it (compaction, expansion, binning), how they chain, and two nuances for the advanced viewers: push vs. pull, and atomics instead of a prefix sum.

Play with every animation in the video, and find the papers and talks each example comes from:
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

Parallel prefix sum, if you want to go deeper:
GPU Gems 3, chapter 39: https://developer.nvidia.com/gpugems/gpugems3/part-vi-gpu-computing/chapter-39-parallel-prefix-sum-scan-cuda
Single-pass Parallel Prefix Scan with Decoupled Look-back (Merrill, Garland): https://research.nvidia.com/publication/2016-03_single-pass-parallel-prefix-scan-decoupled-look-back
The pull side of expansion, as load-balancing search in ModernGPU: https://moderngpu.github.io/loadbalance.html

Blog: https://erfan-ahmadi.github.io
X: https://x.com/ErFunRender

#gpu #rendering #graphicsprogramming #gamedev #compute #vulkan #shaders

## X (Twitter)

Post (with the clip):

Your GPU can't do push_back. So how do a hundred thousand threads write to one list, in order, with no gaps?

The same trick is hiding inside culling, LOD, light clusters, particles and Gaussian splatting. Once you see it, you see it everywhere.

Reply, right under it:

Watch the full video: https://www.youtube.com/watch?v=VIDEO_ID

Play with every animation here: https://erfan-ahmadi.github.io/blog/gpu-driven-anything/

Shorter alternative for the post:

Culling, LOD, light clusters, particles, splats. Different problems, one GPU pattern: count, prefix sum, write. New video, link below.

## LinkedIn

Post (with the clip):

GPU-driven rendering comes down to one question nobody states out loud: when a hundred thousand threads all want to write to the same list, where does each one write?

On the CPU it's a push_back. On the GPU there is no push_back, and the answer is a pattern you can learn once and then recognize everywhere: count, prefix sum, write.

In the new video I walk through it with interactive visualizations, in three shapes:
- Compaction: culling, every object makes 0 or 1 outputs
- Expansion: level of detail, every object makes a different number of triangles
- Binning: light clusters, every light goes into several lists

Then how the first two chain into a full GPU-driven frame, and two nuances for the advanced crowd: push vs. pull, and why atomics give you a compact list but not a stable one.

The visualizations are an interactive page you can play with; link in the comments along with the full video.

First comment:

Watch the full video: https://www.youtube.com/watch?v=VIDEO_ID
Play with the visualizations: https://erfan-ahmadi.github.io/blog/gpu-driven-anything/

## Clip suggestions for the snippet

- 0:00 to about 0:40: the culling scene, the push_back line struck through, the burst of threads writing. Ends on the question.
- Or the pull counting beats: the thread asking "Where do I come from?" and the triangles being counted up. Ends on "or can it?" energy without the title.
