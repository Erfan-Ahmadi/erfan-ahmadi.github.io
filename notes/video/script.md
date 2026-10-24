# GPU-Driven Anything: video script

Each numbered beat is one key press in presentation mode. Animations inside a beat play on their own.
The working script below has light edits; the original drafts, word for word, are in script-drafts.md.

## Part 1: the hook

**1.** [Culling scene, full frame. Camera moving. No panel, no labels.]
> If you're here, chances are you've seen something like this before. It's culling. The idea is simple: we want to filter out the objects that are outside the camera's view.

**2.** [The CPU code slides in on the left.]
> On the CPU, it's easy: if an object is visible, push it to our list of visible objects.

**3.** [The scene freezes. A debugger-style highlight steps through the loop, one object at a time: the for line, then the if line with a ring on the object being checked, then push_back for the visible ones, which fly into an `out` list under the code.]
> (line to write) For example: one object at a time. Is it visible? Push it to the list. Next one.

**4.** [Lots of new objects pop into the camera's view.]
> But what if you have a hundred thousand objects?

**5.** [The objects fly into a row on the left and turn into thread blocks. They keep their size; the row runs off the edge with "…".]
> Instead of one CPU loop going through them one by one, you give each object its own GPU thread.

**6.** [`push_back` in the code dims and gets struck through.]
> And now you don't have a simple push_back anymore.

**7.** [Every thread writes into the output at the same moment, each landing in its place, with an arrow from each visible thread to the slot it writes. This shows the goal, before we explain how.]
> So how do all these threads, running at the same time, each find their own place in the output, in order, with no gaps?

**8.**
> It turns out the answer to this one question is hiding inside a lot of computer graphics.

**9.** [Level of detail: three low-poly bunnies, one straight ahead and two a little behind it. The camera moves straight in and out on the near one, so it steps through all four levels (22, 12, 7 and 4 triangles) while the ones behind switch later and less. Each switch pops with a ring. Panel with counts and ribbons.]
> Like choosing a level of detail, where each object produces a different number of triangles depending on how close the camera is.

**10.** [Light clusters, simple setup, panel.]
> Or assigning lights to clusters in clustered shading, where a cluster can end up with any number of lights.

**11–14.** [Particles, curves, marching squares, Gaussian splatting. One press each, quick transitions. Curves: one circle in the middle and one bezier, zooming in and out every few seconds so the counts keep changing.]
> Once you start looking, you see it everywhere: particle systems, curves, marching squares, Gaussian splatting.

**15.** [The last example shrinks into a grid of every example.]
> Different problems, different engines, different decades. But underneath all of them, it's the same pattern.

(optional closer: "build them yourself" clashes with beat 17's "no implementation details", so either drop it or use something like this)
> And once you see it, you'll start spotting it everywhere.

## Part 2: three kinds

**16.** [Three examples are picked out of the grid and move into tall cards, side by side, while the others fade out. The example itself moves and grows into its card (no cross-fade). Each card has only its name, and its example loops the whole time.]
- Compaction: culling
- Expansion: level of detail
- Binning: light clusters

> All of them come down to three versions of one idea: compaction, expansion and binning.

**17.** [The cards keep looping.]
> I'm not going to go into shader code or implementation details.

**18.** [Aside: everything on screen shrinks, keeping its shape, into a card on the left and keeps running.]

**19.** [On the right, beside the card: "Goal", then "Recognize the patterns".]
> My goal is to show you this pattern the clearest way I know how, so that next time you run into a problem like this, you'll recognize it right away and know exactly what to do.

## Presentation mode

Built into the artifact, beats 1 to 19. Start it with V, the Present button, or `#present` at the end of the URL.

Keys: → (or Enter, ↓, Page Down) next beat · ← back · Space pause and resume (everything holds still; moving to another beat resumes) · R replay the beat · I beat counter · F fullscreen · Esc exit.

- Stepping back shows a beat the way it ends; stepping forward plays it.
- Asides (like 18 and 19) take two presses: first whatever is on screen shrinks into a card on the left and keeps running, then a title and lines come in on the right, the way 3Blue1Brown steps back to talk over a concept. Any later beat can reuse it with a title and a few lines.
- Every start builds the scenes fresh, so each take begins the same way. To redo a take from the top, press Esc and then V.
- The key list shows at the bottom for the first 3 seconds after starting; start recording after it fades.

Optional later: one press per card in beat 16, naming each as it appears, instead of all three at once.

Decided:
- Beat 7 shows the goal (a clean burst), with no "chaos" beat before it.
- Beat 16 picks culling, level of detail and light clusters out of the grid; the other examples fade out. The grid doesn't sort itself into groups.
- The intro stays quiet: every name or number on screen has to serve a purpose, and here the purpose is a taste of where the pattern shows up, not following the algorithm. So there are no names on objects or chips, no distance numbers in LOD, no tile numbers, and no notes under the outputs. The count and start rows and the ribbons stay. Light clusters keeps its cluster numbers.
