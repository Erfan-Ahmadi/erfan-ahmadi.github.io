# GPU-Driven Anything: video script

Each numbered beat is one key press in presentation mode. Animations inside a beat play on their own.
The working script below has light edits; the original drafts, word for word, are in script-drafts.md.

## Part 1: the hook

**1.** [The culling scene, big, is the focus, the camera moving around. The whole chained example from the end of the video sits as a smaller card on the right, with no names: its rows with their "prefix sum" bars, all of it live as the camera moves. The bunnies are in the scene.]
> If you're here, chances are you've seen this before. It's culling. The idea is simple: we want to filter out the objects that are outside the camera's view.

**2.** [The rows card goes out to the right, the CPU code slides in from the left, and the scene moves over to the right half. The bunnies settle into plain circles; the camera keeps moving.]
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
> Once you start looking, you see it everywhere: particle systems, vector graphics, marching squares, Gaussian splatting.

**15.** [The last example shrinks into a grid of every example.]
> Different problems. But underneath all of them, it's the same pattern.

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

## Part 3: the prefix sum

One press per sum, so each step is under your control. The sums are shown twice: first as the running sum with its + signs, then as the chart.

**20.** [The goal fades away. Three threads come in as colored boxes.]
> Behind all of these is one simple idea: the prefix sum.

**21.** [Each box shows its count, and the triangles it generates appear under it: 5, 3 and 6.]
> If you don't know what a prefix sum is, the idea is simple. Once each thread has counted how many triangles it will generate,

**22.** [An empty start row appears under the boxes.]
> every new item becomes the sum of what came before it.

**23–26.** [One press per sum, the running sum with its + signs: 0 drops into the first cell, then 0 + 5, then 5 + 3, then 8 + 6 = 14, the total. After each one the cells that were used stay marked until the next press.]

**27.** [The empty output track appears at the bottom.]
> And this sum tells each thread where to start writing. A thread can't know where to start until it knows how much room every thread before it needs.

**28.** [The start row clears and the chart's base line appears.]
> Let me show you that with a simple chart.

**29–32.** [One press per bar. Each bar is the one before it plus the next count, with a triangle in every cell, and the start row fills in again: 0, then 0 + 5, then 5 + 3, then 8 + 6 = 14.]
> The first one is 0. The next is 0 + 5. Then 5 + 3. Then 8 + 6.

**33.** [The bars tip over into the output. Each thread's space begins at its sum, with an arrow from its start cell to the start of the space.]
> (line to write) For example: lay the bars down, and each sum marks exactly where its thread starts writing.

**34.** [The first count steps up and down one at a time: 5, 6, 7, 8, then back down to 3 and up again, its triangles with it. The starts after it (and the total) are marked and change with each step, and their spaces in the output glide to their new place. It keeps going until the next press.]
> See how changing the count of the first one shifts the start of everything that comes after it.

## Part 4: in parallel, and expansion

**35.** [Only the prefix sum: the panel from beat 34 shrinks into a card on the left, the first count still stepping and the offsets still moving.]
> But you might be asking, wait a minute, how do you calculate the prefix sum?

**36.** [Beside the card: "Serial?", "Every thread depends on the one before it".]
> It looks suspiciously like a serial algorithm, where every thread depends on the last one.

**37.** [The text is replaced by "Parallel prefix sum" and a scan network: eight counts, four quick rounds of adds, every thread at once in each round, and the starts come out at the bottom. About 2 seconds.]
> To which I say, great question. There are plenty of clever algorithms, developed over the last few decades, that compute the prefix sum in parallel over thousands of threads. I was really tempted to go into these algorithms here, but that's not my goal, and there are plenty of resources where you can learn about parallel prefix sums. I'll link some of them below.

**38.** [A rug sweeps across the network from the right. As it passes, the rounds fold into one box that says "prefix sum", with the counts going in and the starts coming out. The rug slides on out of the way and the simple picture stays.]
> For now, let's sweep that under the rug and just accept that this prefix sum happens in parallel.

**39.** [The aside goes and the full level-of-detail example pops up, rows and scene, under the name "Expansion". Three bunnies, the camera held still. One press per step from here.]
> Congratulations, you now know what expansion is and how it works. Expansion is when each thread generates a different amount of work, decided at runtime. Like generating these levels of detail here.

**40–43.** [Count, offset, spaces, output, one press each, with the first camera. No running sum here: a long "prefix sum" bar sits between count and offset, and the offsets just appear.]

**44.** [The camera moves closer. The panel stays: each count ticks up to its new value, and the offsets, the spaces and the output stretch along with it. The bunnies switch level with a pop.]

## Part 5: compaction, then the two chained

Compaction and expansion share one scene: the same eight objects, the same colors, and the same camera (the one expansion ends on). Expansion's items are the five objects that camera sees; compaction has the three outside the view as well. From here on there is no running sum: a long "prefix sum" bar sits between count and offset.

**45.** [Fade to compaction: the culling example, named, with the camera held still. The objects and their counts.]
> Compaction is the same idea. It's even simpler: each item generates either 0 or 1 items instead of many.

**46.** [The visible objects light up, in the scene and in the rows, with their 1s framed. The rest dims.]
> The count is 1 when the object is visible,

**47.** [Now the culled objects light up, with their 0s.]
> and 0 when it's culled.

**48.** [One press runs the rest: the offsets appear under the "prefix sum" bar, the arrows point at the spaces, and the outputs fly in with their ribbons. About 3 seconds.]

**49.** [The output row is framed and the rest dims.]
> It's called compaction because the number of outputs

**50.** [The row of inputs is framed instead.]
> is less than the number of inputs.

**51.** [The screen splits into two named sections, both complete and still: Compaction on the left, Expansion sliding in on the right.]
> Now that you know what expansion and compaction are,

**52.** [The two sections become one panel, "Compaction, then expansion", showing nothing but the eight objects, with the scene beside it.]
> you can chain these two operations together and plug them in like Lego.

**53.** [One press runs the first pass, quickly: count, offsets, spaces, the list of survivors. The pass is framed while it runs.]
> The first pass will compact and cull,

**54.** [One press runs the second pass on those survivors, quickly: triangles, offsets, spaces, output, the bunnies appearing in the scene.]
> and the second pass will expand and generate geometry for the appropriate LODs. And this is what actual real-time applications and games do, like…

## Part 6: binning

Binning uses the light clusters with four clusters and eight lights, so there are more lights than clusters. The point of the part is that the prefix sum runs over the per-cluster counts, not over the inputs. The rows use the histogram style: a bar per cluster, then each bar takes the bars before it, so the last bar already has the output's layout. The lights move only while the scene is alone (beat 57) and hold still from the moment the rows come in.

**55.** [The combined example shrinks into a card on the left, still showing its result.]
> Now that you understand how expansion and compaction generate a variable amount of output, you might be wondering what happens when there is more than one output to push back into.

**56.** [The question comes in beside it: "Several outputs?" / "What if there is more than one list to push back into?"]
> For example, when we need to assign lights to clusters.

**57.** [The aside goes and the light clusters pop up under the name "Binning": only the scene, with the camera, four clusters and eight lights moving around.]
> In clustered lighting, instead of a single list,

**58.** [The scene makes room on the right and the rows card comes in with one output list.]
> we need one list per cluster,

**59.** [The one list splits into four, one per cluster, each with its cluster number at its left.]
> and we issue one thread per light.

**60.** [A thread per light: a chip flies from each light in the scene into a row of thread blocks along the top of the card.]
> Now let's look at it the other way around.

**61.** [The swap: the cluster numbers go up to head the columns, the thread chips go down the side, one per row, and the table forms under them. Each light's marks appear in the clusters it touches.]
> This is where most people get confused. Unlike compaction or expansion, where the prefix sum runs over the inputs,

**62.** [Count per cluster: the marks of each column drop into its count cell, and a histogram grows right under the counts, one bar per cluster, a cell per light.]
> here we count how many lights fall in each cluster. This is called histogramming.

**63.** [The prefix sum runs over the counts: the "prefix sum" bar appears, the histogram slides under the offset row, and each bar takes the bar above it, so the bars get longer down the chart by construction. An offset fills in as its row completes. One row per press-free second.]
> And we do the prefix sum over the counts themselves. It runs over the clusters, not the lights, so its size is fixed and known up front; here it is four numbers.

**64.** [The bottom bar, which already has the output's layout, slides down into the output and its pieces become the dashed spaces, each offset pointing at its own.]
> So the bottom bar becomes our offsets.

**65.** [Output: every light flies into its clusters' spaces at once, and the ribbons come in.]
> Once we know the offsets, we run our threads once more and each light places itself in the right list. Note that this time the order inside a list doesn't matter much, so an atomic counter per cluster could place the lights instead. If that doesn't make sense yet, don't worry; we'll come back to atomics.

**66.** [Fade to the material tiles, "Binning · material tiles", which run through the same steps on their own in about three seconds: a tile with several materials goes into each material's list.]
> Another example of binning is assigning materials to each tile. You usually see this pattern in deferred shading pipelines.

Fact check for this part:
- "This prefix sum is usually much cheaper because there are a lot more lights than clusters": the scan's length is the number of bins, so it is cheaper than a scan over the inputs only when there are fewer bins than inputs. That holds for material lists (a handful of shaders against thousands of tiles) and for the example here (four clusters, eight lights), but not in general for light clusters: a 16 × 8 × 24 grid has about 3000 clusters, often more than the lights. The safe claim is the one in beat 63: the scan runs over the bins, whose number is fixed and known up front.
- "Atomics instead of a prefix sum" for binning: an atomic counter per cluster places the lights in any order, but the lists then need either a fixed capacity per cluster or a base offset that still comes from a prefix sum (or from one atomic allocation of the cluster's whole range). Beat 65 says "could place the lights" and leaves the rest to the atomics part.

## Presentation mode

Built into the artifact, beats 1 to 66. Start it with V, the Present button, or `#present` at the end of the URL.

Keys: → (or Enter, ↓, Page Down) next beat · ← back · Space pause and resume (everything holds still; moving to another beat resumes) · R replay the beat · I beat counter · F fullscreen · Esc exit.

- Stepping back shows a beat the way it ends; stepping forward plays it.
- Asides (like 18 and 19) take two presses: first whatever is on screen shrinks into a card on the left and keeps running, then a title and lines come in on the right, the way 3Blue1Brown steps back to talk over a concept. Any later beat can reuse it with a title and a few lines.
- Every start builds the scenes fresh, so each take begins the same way. To redo a take from the top, press Esc and then V.
- The key list shows at the bottom for the first 3 seconds after starting; start recording after it fades.

Optional later: one press per card in beat 16, naming each as it appears, instead of all three at once.

Decided:
- Beat 7 shows the goal (a clean burst), with no "chaos" beat before it.
- Beat 16 picks culling, level of detail and light clusters out of the grid; the other examples fade out. The grid doesn't sort itself into groups.
- Row labels are named for their context: the row is "prefix sum" in part 3, where that is what is being explained, and "offset" from part 4 on. From part 4 on a "prefix sum" bar sits between count and offset, with no word on how it is computed; the running sum is only shown in part 3.
- The prefix sum uses three threads with fixed counts (5, 3, 6) so the numbers on screen are the ones being said. Each sum is one press, in both the running sum and the chart. In beat 34 the first count steps up and down on its own, one at a time.
- Part 4 explains the parallel prefix sum first and ends on "you now know expansion"; it flows better that way.
- Part 6 uses four clusters and eight lights (more lights than clusters). In the app, M on Light clusters switches to this setup, and Controls has the histogram style ("How start is shown") for every example.
- The material tiles beat uses every material's list, so a tile with two materials is in two lists, like a light in two clusters. M on Material tiles in the app flips to the one-mixed-list version if that reads better.
- The intro stays quiet: every name or number on screen has to serve a purpose, and here the purpose is a taste of where the pattern shows up, not following the algorithm. So there are no names on objects or chips, no distance numbers in LOD, no tile numbers, and no notes under the outputs. The count and start rows and the ribbons stay. Light clusters keeps its cluster numbers.
