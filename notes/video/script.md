# GPU-Driven Anything: video script

Each numbered beat is one key press in presentation mode. Animations inside a beat play on their own.
The working script below has light edits; the original drafts, word for word, are in script-drafts.md.

## Part 1: the hook

**1.** [Culling scene, full frame. Camera moving. No panel, no labels.]
> If you're here, chances are you've seen something like this before. It's culling. The idea is simple: we want to filter out the objects that are outside the camera's view.

**2.** [The CPU code slides in on the left.]
> On the CPU, it's easy: if an object is visible, push it to our list of visible objects.

**3.** [Lots of new objects pop into the camera's view.]
> But what if you have a hundred thousand objects?

**4.** [The objects fly into a row on the left and turn into thread blocks. They keep their size; the row runs off the edge with "…".]
> Instead of one CPU loop going through them one by one, you give each object its own GPU thread.

**5.** [`push_back` in the code dims and gets struck through.]
> And now you don't have a simple push_back anymore.

**6.** [Every thread writes into the output at the same moment, each landing in its place. This shows the goal, before we explain how.]
> So how do all these threads, running at the same time, each find their own place in the output, in order, with no gaps?

**7.**
> It turns out the answer to this one question is hiding inside a lot of computer graphics.

**8.** [Level of detail: 3 objects, all in view, camera moving in and out. Panel with counts and ribbons.]
> Like choosing a level of detail, where each object produces a different number of triangles depending on how close the camera is.

**9.** [Light clusters, simple setup, panel.]
> Or assigning lights to clusters in clustered shading, where a cluster can end up with any number of lights.

**10–13.** [Particles, curves, marching squares, Gaussian splatting. One press each, quick transitions.]
> Once you start looking, you see it everywhere: particle systems, curves, marching squares, Gaussian splatting.

**14.** [The last example shrinks into a grid of every example.]
> Different problems, different engines, different decades. But underneath all of them, it's the same pattern.

(optional closer)
> And once you see it, you'll be able to build any of these yourself.

## For presentation mode later

New pieces this part needs:
- Scene-only view: the culling scene full frame, nothing else drawn.
- Code sliding in from the left.
- "Many objects" culling scenario: objects pop into the camera's view.
- Objects flying into a row of thread blocks with "…" (no shrinking).
- Strike-through on `push_back`.
- The burst: every thread writes into the output at once, each in its place (built from parallel filling).
- Simple, quick versions of LOD (3 objects, dolly in and out), lights, particles, curves, marching squares, splats.
- The last example shrinking into the All grid.

Decided: beat 6 shows the goal (a clean burst), with no "chaos" beat before it.
