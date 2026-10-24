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

(optional closer: "build them yourself" clashes with beat 16's "no implementation details", so either drop it or use something like this)
> And once you see it, you'll start spotting it everywhere.

## Part 2: three kinds

**15.** [The grid sorts itself into three groups, and each group becomes a tall card, side by side. Each card has its name, its question and one small animation that loops the whole time.]
- Compaction, "keep it or not?": culling (culling, particles)
- Expansion, "how many?": level of detail (level of detail, curves, marching squares, splat copies)
- Binning, "which list?": material tiles (light clusters, splat tiles)

> All of them come down to three versions of one idea: compaction, expansion and binning.

**16.** [The cards keep looping.]
> I'm not going to go into shader code or implementation details. My goal is to show you this pattern the clearest way I know how, so that next time you run into a problem like this, you'll recognize it right away and know exactly what to do.

## For presentation mode later

Part 1:
- Scene-only view: the culling scene full frame, nothing else drawn.
- Code sliding in from the left.
- "Many objects" culling scenario: objects pop into the camera's view.
- Objects flying into a row of thread blocks with "…" (no shrinking).
- Strike-through on `push_back`.
- The burst: every thread writes into the output at once, each in its place (built from parallel filling).
- Simple, quick versions of LOD (3 objects, dolly in and out), lights, particles, curves, marching squares, splats.
- The last example shrinking into the grid. The grid holds only the examples named in the hook (culling, LOD, lights, particles, curves, marching squares, splats).

Part 2:
- Three tall cards side by side: name, question, one looping mini animation each, rows only, simple scenarios (culling with few objects, LOD with 3 objects, material tiles with a small grid). Material tiles fits a narrow card better than light clusters, which always have 12 columns.
- The grid sorting into three groups that turn into the cards. Gaussian splatting can show up in two groups: its copies are expansion and its tiles are binning.
- Optional: one press per card, naming each as it appears, instead of all three at once.

Decided:
- Beat 6 shows the goal (a clean burst), with no "chaos" beat before it.
