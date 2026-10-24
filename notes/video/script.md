# GPU-Driven Anything: video script

Each numbered beat is one key press in presentation mode. Animations inside a beat play on their own.
The working script below has light edits; the original drafts, word for word, are in script-drafts.md.

## Part 1: the hook

**1.** [The culling scene, big, is the focus, the camera moving around. The whole chained example from the end of the video sits as a smaller card on the right, with no names: its rows with their "prefix sum" bars, all of it live as the camera moves. The bunnies are in the scene.]
> If you're here, chances are you've seen this before. It's culling. The idea is simple: we want to filter out the objects that are outside the camera's view.

**2.** [The rows card goes out to the right, the CPU code slides in from the left, and the scene moves over to the right half. The bunnies settle into plain circles; the camera keeps moving.]
> On the CPU, it's easy: if an object is visible, push it to our list of visible objects. and if it's not visible don't do anything.

**3.** [The scene freezes. A debugger-style highlight steps through the loop, one object at a time: the for line, then the if line with a ring on the object being checked, then push_back for the visible ones, which fly into an `out` list under the code.]
> PAUSE

**4.** [Lots of new objects pop into the camera's view.]
> But what if you have a hundred thousand objects?

**5.** [The objects fly into a row on the left and turn into thread blocks. They keep their size; the row runs off the edge with "…".]
> Instead of one CPU loop going through them one by one, you give each object its own GPU thread.

**6.** [`push_back` in the code dims and gets struck through.]
> And now you don't have a simple push_back anymore.

**7.** [Every thread writes into the output at the same moment, each landing in its place, with an arrow from each visible thread to the slot it writes. This shows the goal, before we explain how.]
> So how do all these threads, running in parallel, each find their own place in the output, in order, with no gaps?

**8.**
> It turns out the answer to this one question is hiding inside a lot of computer graphics techniques.

**9.** [Level of detail: three low-poly bunnies, one straight ahead and two a little behind it. The camera moves straight in and out on the near one, so it steps through all four levels (22, 12, 7 and 4 triangles) while the ones behind switch later and less. Each switch pops with a ring. Panel with counts and ribbons, each object's box showing its bunny at its level.]
> Like choosing a level of detail, where each object produces a different number of triangles depending on how close the camera is.

**10.** [Light clusters, simple setup, panel.]
> Or assigning lights to clusters in clustered shading, where a cluster can end up with any number of lights.

**11–14.** [Particles, curves, marching squares, Gaussian splatting. One press each, quick transitions. Curves: one circle in the middle and one bezier, zooming in and out every few seconds so the counts keep changing.]
> Once you start looking, you see it everywhere: particle systems, vector graphics, marching squares, even Gaussian splatting.

**15.** [The last example shrinks into a grid of every example.]
> Different problems. But underneath all of them, it's the same pattern.

(optional closer: "build them yourself" clashes with beat 17's "no implementation details", so either drop it or use something like this)
> And once you see it, you'll start spotting it everywhere. [PAUSE]

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

One press per sum, so each step is under your control. The sums are shown twice: first as the running sum with its + signs, then as the chart. The panel carries the title "Prefix sum", with no subtitle, like the named parts after it; the Goal aside fades out as it fades in.

**20.** [The goal fades away. Three threads come in as colored boxes.]
> Behind these three is one simple idea: the prefix sum.

**21.** [The triangles each thread generates appear inside its box, and a count row comes up under the boxes with the numbers: 5, 3 and 6.]
> If you don't know what a prefix sum is, the idea is simple. 

**22.** [An empty prefix-sum row appears under the counts.]
> every new item becomes the sum of what came before it.

**23–26.** [One press per sum, the running sum with its + signs: 0 drops into the first cell, then 0 + 5, then 5 + 3, then 8 + 6 = 14, the total. After each one the cells that were used stay marked until the next press.]

**27.** [The empty output track appears at the bottom.]
> And this sum tells each thread where to start writing. 

**28.** [The start row clears and the chart's base line appears.]
> Let me show you the idea that with a simple chart.

**29–32.** [One press per bar. Each bar is the one before it plus the next count, a + sign between the stack and the count coming down onto it, a triangle in every cell, and the start row fills in again: 0, then 0 + 5, then 5 + 3, then 8 + 6 = 14.]
> The first one is 0. The next is 0 + 5. Then 5 + 3. Then 8 + 6.

**33.** [The bars tip over into the output. Each thread's space begins at its sum, with an arrow from its start cell to the start of the space.]
> each sum marks exactly where its thread starts writing.

**34.** [The first count steps up and down one at a time: 5, 6, 7, 8, then back down to 3 and up again, its triangles with it. The starts after it (and the total) are marked and change with each step, and their spaces in the output glide to their new place. It keeps going until the next press.]
> See for example how changing the count of the first one shifts the start of everything that comes after it.

## Part 4: in parallel, and expansion

**35.** [Only the prefix sum: the panel from beat 34 shrinks into a card on the left, the first count still stepping and the offsets still moving.]
> But you might be asking, wait a minute, how do you calculate the prefix sum?

**36.** [Beside the card: "Serial?", "Every thread depends on the one before it".]
> It looks suspiciously like a serial algorithm, where every thread depends on the last one.

**37.** [The text is replaced by "Parallel prefix sum" and a scan network: eight counts, four quick rounds of adds, every thread at once in each round, and the starts come out at the bottom. About 2 seconds.]
> To which I say, great question. There are plenty of clever algorithms, developed over the last few decades, that compute the prefix sum in parallel over thousands of threads. I was really tempted to go into these algorithms here, but that's not my goal here, and there are plenty of resources where you can learn about parallel prefix sums. I'll link some of them below.

**38.** [A rug sweeps across the network from the right. As it passes, the rounds fold into one box that says "prefix sum", with the counts going in and the starts coming out. The rug slides on out of the way and the simple picture stays.]
> For now, let's sweep that under the rug and just accept that this prefix sum happens in parallel.

**39.** [The aside goes and the full level-of-detail example pops up, rows and scene, under the name "Expansion". Five bunnies, each object's box showing its bunny at its current level, the camera held still. One press per step from here.]
> Btw, Congratulations, you now know what expansion is and how it works. Expansion is when each thread generates a different amount of work,  Here generating the triangles for the chose these levels of detail here. [GIVE EXAMPLES]

**40–43.** [Count, offset, spaces, output, one press each, with the first camera. No running sum here: a long "prefix sum" bar sits between count and offset, and the offsets just appear.]

**44.** [The camera is yours from here: drag in the scene to aim it, drag the camera body to move it, scroll to dolly, or W A S D to move and Q E to turn. The panel stays and follows live: each count counts to its new value, the offsets, the spaces and the output stretch with it, the bunnies switch level with a pop, and the bunny in each object's box switches with them. An object taken out of view is culled (its count drops to 0 and its box goes dashed), so keep the five in view while the point is expansion alone. It runs until the next press, so there is time to talk over it.]

## Part 5: compaction, then the two chained

Compaction and expansion share one scene: the same eight objects, the same colors, and the same camera (the one expansion ends on). Expansion's items are the five objects that camera sees; compaction has the three outside the view as well. From here on there is no running sum: a long "prefix sum" bar sits between count and offset.

**45.** [Fade to compaction: the culling example, named, with the camera held still. The objects and their counts.]
> Compaction is the same idea. It's even simpler: each item generates either 0 or 1.

**46.** [The visible objects light up, in the scene and in the rows, with their 1s framed. The rest dims.]
> Visible objects report a count of 1 and invisible objects will report a count of 0

**47.** [Now the culled objects light up, with their 0s.]

**48.** [One press runs the rest: the offsets appear under the "prefix sum" bar, the arrows point at the spaces, and the outputs fly in with their ribbons. About 3 seconds.]

**49.** [The output row is framed and the rest dims.]
> It's called compaction because the number of outputs
 simply  is less than the number of inputs.
**50.** [The row of inputs is framed instead.]
> is less than the number of inputs.

**51.** [The screen splits into two named sections, both complete and still: Compaction on the left, Expansion sliding in on the right.]
> Now that you know what expansion and compaction are,

**52.** [The two sections become one panel, "Compaction, then expansion", showing nothing but the eight objects, with the scene beside it.]
> you can chain these two operations together and plug them in like Lego.

**53.** [One press runs the first pass, quickly: count, offsets, spaces, the list of survivors. The pass is framed while it runs.]
> The first pass will compact and cull,
 now ew ee have outr visible object
**54.** [One press runs the second pass on those survivors, quickly: triangles, offsets, spaces, output, the bunnies appearing in the scene and inside the survivors' boxes.]
> and the second pass will expand and generate geometry for the appropriate LODs. And this is what actual real-time applications and games do, like…
. [EXAMPLES]  
NOTICE how when an object goes out of sight it only affects the first pass at the top, but when we get closer to our objects more geometry gets generated at the bottom in sceond pass
**55.** [The highlight goes and the camera is yours, as in beat 44 (drag, scroll, W A S D Q E), with the whole chain live: objects leave and enter the view (culled ones turn into dashed circles), the survivors' list and the triangle counts change, and the offsets and the output re-flow. The camera stays yours inside the aside card that follows, the pointer going through the card to the scene, so something is moving while the question is talked over.]
> (The tail of the line above, and whatever else there is to say about real applications, goes here.)

## Part 6: binning

Binning uses the light clusters with four clusters and six lights, so there are more lights than clusters. The point of the part is that the prefix sum runs over the per-cluster counts, not over the inputs. The rows are the presentation's own drawing, not the app's table: a row of threads along the top, one list per cluster under it, and the counting, the prefix sum and the offsets right where the lists are. The bars are numbered by list, with no colors. The lights move only while the scene is alone (beat 58) and hold still from the moment the rows come in. After the counting, one press per cluster picks its count out and lights its cluster up, with everything else greyed, so each count can be checked against the scene while it is talked about.

**56.** [The combined example shrinks into a card on the left, still showing its result.]
> Now that you understand how expansion and compaction generate a variable amount of output, you might be wondering what happens when there is more than one output to push back into.
 together
**57.** [The question comes in beside it: "Several outputs?" / "What if there is more than one list to push back into?"]
> For example, when we need to assign lights to clusters.

**58.** [The aside goes and the light clusters pop up under the name "Binning": only the scene, with the camera, four clusters and six lights moving around.]
> In clustered lighting, instead of a single list,

**59.** [The scene makes room on the right and the rows card comes in with one output list.]
> we need one list per cluster,

**60.** [The one list splits into four, one per cluster, each with its cluster number at its left.]
> and we issue one thread per light.

**61.** [A thread per light: a chip flies from each light in the scene into a row of thread blocks along the top of the card.]
> This is where most people get confused. Unlike compaction or expansion, where the prefix sum runs over the inputs,

**62.** [Each thread drops a mark into every list it belongs to, under its own column.]
> each light finds the clusters it touches,

**63.** [The lists make room on their right. Each list counts its marks into a cell at its end, the total under them, and a histogram grows beside the counts: one numbered bar per list, a cell per light.]
> and we count how many lights fall in each cluster. This is called histogramming.

**64–67.** [One press per cluster, 0 to 3: its count is picked out in the rows and its cluster lights up in the scene, the other rows and lights greyed out.]
> (line to write, one per cluster) This cluster has these two lights, so its count is 2. This one has three…

**68.** [A vertical "prefix sum" box comes up between the counts and the bars, and the prefix sum runs down the bars: each bar takes the bar above it, so the bars get longer down the chart by construction. One row per second.]
> And we do the prefix sum over the counts themselves. It runs over the clusters, not the lights, so its size is fixed and known up front; here it is four numbers.
Once we have the colight unts fofor each cluster, ovef r the countNOT .  no matter how many light s we havewe  we always do prefix sium over our 4 clu
**69.** [The bottom bar, which already has the output's layout, plops down into the output and its pieces become the dashed spaces, numbered by cluster, each with its offset under its left edge.]
> So the bottom bar becomes our offsets.

**70.** [Output: every light flies into its clusters' spaces at once, with a bracket under each cluster's range.]
> Once we know the offsets, we run our threads once more and each light places itself in the right list. Note that this time the order inside a list doesn't matter much, so an atomic counter per cluster could place the lights instead. If that doesn't make sense yet, don't worry; we'll come back to atomics.

**71.** [Fade to the material tiles, "Binning · material tiles": the same rows, six tiles and three lists, with the marks, the counting, the prefix sum, the plop and the output running on their own in about six seconds. A tile with several materials goes into each material's list.]
> Another example of binning is assigning materials to each tile. You usually see this pattern in deferred shading pipelines.

Fact check for this part:
- "This prefix sum is usually much cheaper because there are a lot more lights than clusters": the scan's length is the number of bins, so it is cheaper than a scan over the inputs only when there are fewer bins than inputs. That holds for material lists (a handful of shaders against thousands of tiles) and for the example here (four clusters, eight lights), but not in general for light clusters: a 16 × 8 × 24 grid has about 3000 clusters, often more than the lights. The safe claim is the one in beat 68: the scan runs over the bins, whose number is fixed and known up front.
- "Atomics instead of a prefix sum" for binning: an atomic counter per cluster places the lights in any order, but the lists then need either a fixed capacity per cluster or a base offset that still comes from a prefix sum (or from one atomic allocation of the cluster's whole range). Beat 70 says "could place the lights" and leaves the rest to the atomics part.

## Part 7: using the offsets, push or pull

Four objects with fixed counts (1, 2, 6, 3; total 12). Push and pull are two mirror cards with the same rows at the same heights, so they compare left to right: object (a block with as many small triangles in it as its count), count (numbers), prefix sum (with its total), thread, output, and each side's code under its own rows. The thread row is where the two differ: push has one thread per object, under its object, with "4 threads" right after them; pull has one per output, over its slot, with "12 threads". Push sits in the left half from the start; pull slides into the right half when its turn comes. No text lines: the points are spoken. The part opens with a text beat, not an aside: nothing shrinks into a card, the title and its lines fade in on the left.

**72.** ["Using the offsets" / "Who moves the data: the input, or the output?" / "Push, or pull." The text fades in slowly on the left; nothing shrinks into a card. Beside it a small loop runs on its own, for the eyes while this is talked over: five threads with their triangles, an output with dashed room for each thread from its offset, every thread filling its own room at the same time, the ones with more taking longer, dotted ribbons from each to its room; then again with other counts.]
> Now, before I end this video: for the more advanced viewers, I want to touch on a few nuances I purposely left out.
> I talked about using the prefix sum to compute offsets, but not about how to actually use those offsets to fill, or to walk, the compact output. There are two ways to go about it: first is push style.

**73.** [Push alone, in the left half: the four objects with their triangles inside, their counts, the prefix sum, the four threads under their objects with "4 threads" after them, an empty output, and under it all the push code: a thread per object with a loop over its count writing at `prefix[i] + k`.]
  
> Here you can see we have the object counts and prefix sums, with Push style. we only use 4 threads, one per object, to write all the 12 output triangles.

**74.** [The count row is framed.]

**75.** [The frame moves to the prefix-sum row, the total included.]
> (The line above spans 73 to 75: "the object counts" on 74, "and prefix sums" on 75, the threads back on 73's picture.)

**76.** [Every thread writes its triangles at its offset, one per tick, in lockstep, from its thread block down into the output. The thread with six keeps going while the others, done after one to three, dim and wait. Once the writes are done, dotted ribbons run from each thread to its slots: one thread, several outputs.]

**77.** [A dashed frame around the output: "buffer: 12 slots".]
> This usually needs extra memory, a buffer for all the outputs,

**78.** [The writes play again, and at the bottom of the card one wave fills in tick by tick: a lane per thread, a cell per triangle written, dashed cells where a lane sits idle. One lane is busy for six ticks, the rest for one to three.]
> and the work here is imbalanced across a wave: if one thread has six triangles to write and the others one or two, they all wait for it to finish.

**79.** [Pull slides into the right half, the mirror of push: the same object, count and prefix-sum rows, then 12 threads marked "?", one over each output slot, "12 threads" after them, an empty output, and the pull code under it. Push's wave goes.]
> With pull style, we again have the count and the prefix sum. but this time instead of 4 threads, we generate 12 ones instead, one per output triangle. 
 

**80.** [One thread is picked out and framed, with "idx = 7 · eighth triangle" under it and "Where do I come from?" under that. It waits there.]
> All this thread knows is that it is the 8th overall triangle to render. Its data has to be pulled from the object it belongs to, so it needs to find out where it comes from. try to answer this yourself.

**81.** [On the push side, the same slot is framed in the filled output, "idx = 7 · eighth triangle" under it: there the thread that wrote it knew whose it was. It stays framed from here on; it is the "left side" the next line tells the viewer not to look at.]

**82–89.** [One press per triangle: the triangles are counted up from 0 in the object blocks, each one outlined in turn with the running number over its block; 0 in the first object, 1 and 2 in the second, 3 to 7 in the third. At 7 the count stops on object 2's fifth triangle: "triangle 7 is object 2's", then "object 2, triangle 7 − 3 = 4". The line below runs over these presses; its last sentence is the press into 90.]

**90.** [The search: the prefix-sum cells are compared with 7, the middle first, "3 ≤ 7", then "12 > 7", then "9 > 7", the losing halves dimming; the answer is object 2, triangle 7 − 3 = 4. An arrow from object 2 to the thread, which takes its color and writes its triangle into the slot under it. Then every thread resolves at once: ribbons from each object to its threads, and the output fills.]
> you pause the video here if you want and tell me which object does the 8th triangle belong to.  If you didn't cheat by looking at the left side, you probably did something like this. [1, 2, 3, 4,. .. ] and yes  we found our triangle it's the 5th triangle of the third object. In practice instead of counting like this we use a binary search to speed up this process it gives the same result.
  
> So yes, it is more computation per thread, but it needs less memory and the work is balanced, and it is especially good for the compaction-then-expansion chain we just saw: the expansion pass can pull from the compaction pass's result.

Fact check for this part:
- Push needs the expanded buffer; pull needs only the prefix sums (plus the inputs), because each output thread recomputes where it comes from. Both need the total, to size the buffer or the next dispatch.
- Wave imbalance: lanes in a wave run in lockstep, so a loop with a per-thread trip count runs as many iterations as the longest lane, with the finished lanes masked off. "They all wait for it" is accurate.
- The search: with exclusive prefix sums prefix[0..n] plus the total as prefix[n], the owner of output j is the last i with prefix[i] ≤ j, which is `upper_bound(prefix, j) − 1`. A lower bound is wrong when a count is 0 (two inputs share the same value). With inclusive sums (ends), it is `upper_bound(end, j)`. So "an upper bound" is the right word. For 7 the search takes three compares.
- Index 7 is the eighth triangle: the outputs are numbered from 0, so the counting in beats 82 to 89 runs 0 to 7, and "the 8th" in speech is the slot with index 7. The label on screen says both. "The third object" in speech is object 2 on screen, for the same reason.
- "More balanced" is right; "faster" is not claimed and should not be: pull launches one thread per output (12 here against 4), so it does more total work, in exchange for no idle lanes and no buffer. In the chain, the win is in the expansion pass (many items per input), not in the compaction pass (0 or 1 item per input), where push is fine.
- Related reading if a link is wanted: this is the "load-balancing search" / "expand" pattern (ModernGPU calls it load-balancing search; it is also how vectorized binary search over a scan is done in GPU libraries).

## Part 8: atomics instead of a prefix sum

The original example again. The atomics rows sit in a card at the top left, the counter above the objects: the eight objects, five visible, and a row per frame, with the half's name along its bottom. The code sits in a small card under it. On the right the culling scene, held still at the compaction camera, until the comparison, when the card widens to the whole row, a line down its middle, and the prefix sum's rows take the scene's place in the right half; the bottom right stays empty. The visible threads reach the counter in a shuffled order, a different one each frame, one press per atomic in both frames. The part opens with a text beat, like part 7.

**91.** ["Atomics instead?" / "One counter: every thread adds to it." / "Each writes at the value it gets back." The text fades in on the left; nothing shrinks into a card. Beside it a loop runs on its own: one counter wired with dashed lines to three blocks of eight threads. Threads fire on their own, like neurons: a dot runs up the wire to the counter, which ticks up, and the value runs back down and lights the thread up for a moment.]
> Another thing I want to touch on is using atomics instead of a prefix sum.
> If we go back to our original push_back example, one could easily claim that the prefix sum isn't needed and that an atomic does the same job: every visible object adds one to a counter, and the value it gets back is its offset in the output.

**92.** [The atomics card: the counter at 0 above the objects, the culled ones dashed, "Atomics" along the bottom; the code, `slot = atomicAdd(counter, 1); out[slot] = obj;`, in the card under it; and the scene, frozen, on the right.]


**93–97.** [One press per visible thread, in a shuffled order: the thread is framed, its request goes out to the counter as a dot along a dotted line, the counter ticks up, the value it got comes back along the line and sits under the thread, and its item lands at that slot in frame 1. About two seconds each. No gaps, in arrival order.]
> This gives you a perfectly compact output.

**98–102.** [The same five presses into frame 2, in a different order, the counter starting over from 0. The two rows hold the same objects in different orders.]
> But it isn't necessarily ordered. With the chaos of GPU execution, each frame, your compacted result depends on which threads reached the atomic first. so your second frame might execute atomics in a different order and get something completely different

**103.** [The scene shrinks away, the card widens to the whole row with a line down its middle, and the prefix sum's rows take the scene's place in the right half: "Atomics · when order is arbitrary" along the bottom of the left half, "Prefix sum · when order is important" along the bottom of the right, the same objects with their offsets 0 to 4 under them, and frame 1 and frame 2 in the same order. The code stays under the atomics; the bottom right is empty.]
> This might not matter in some situations. But when you care about preserving the order, the prefix sum is the solution, where every frame comes out the same.

Fact check for this part:
- Order: the arrival order at the counter is not deterministic across waves and workgroups, so the compacted order changes between runs; the prefix sum is a stable compaction and gives the same order every time. Correct, and it is the main argument. Reproducibility for debugging is a related one.
- Round trip: atomics on a buffer are performed on the memory side (at the L2 cache's atomic units, not necessarily in DRAM), and a thread that needs the returned value stalls until it comes back; many threads on one address serialize there. Correct. One standard nuance is worth a sentence or a link: wave-level aggregation (one atomic per wave, then a wave prefix count spreads the lanes over the range it got) cuts the traffic by the wave width, and per-workgroup counters in shared memory cut it further. With those, atomics are practical and common; many GPU-driven cullers use exactly this. The ordering problem stays across waves either way.
- The atomic version is a single pass, with no count, scan and write; that is its appeal. For compaction with no ordering requirement, the claim that the prefix sum isn't needed is right.

## The ending

**104.** [The grid of the seven examples comes back and shrinks into a card on the left.]
> And these were the patterns on the GPU I wanted to show you.

**105.** ["Your turn" / "Seen these patterns somewhere else?" / "Tell me in the comments."]
> If you've run into other examples that fit these patterns, or a case where they don't, tell me in the comments. I'd love to hear about them.

**106.** ["Thanks for watching", on its own.]
> Thanks for watching, and see you in the next one.

Other ways to say goodbye, if the one above feels stiff:
- "That's all I have. If these patterns show up in your work, or you do it a different way, tell me in the comments. Thanks for watching."
- "If you spot one of these patterns in the wild, let me know in the comments; I'll collect the best ones for a follow-up. Thanks for watching, see you next time."

## Presentation mode

Built into the artifact, beats 1 to 106. Start it with V, the Present button, or `#present` at the end of the URL.

Keys: → (or Enter, ↓, Page Down) next beat · ← back · Space pause and resume (everything holds still; moving to another beat resumes) · R replay the beat · I beat counter · F fullscreen · Esc exit.

On beats 44 and 55 (and through the aside after 55) the camera is yours: drag in the scene to aim it, drag the camera body to move it, scroll to dolly, W A S D to move and Q E to turn. The arrow keys still step the beats.

- Stepping back shows a beat the way it ends; stepping forward plays it.
- Asides (like 18 and 19) take two presses: first whatever is on screen shrinks into a card on the left and keeps running, then a title and lines come in on the right, the way 3Blue1Brown steps back to talk over a concept. Any later beat can reuse it with a title and a few lines.
- Parts 7 and 8 open with a text beat instead (72 and 91): one press, the title and lines fading in slowly on the left, nothing shrinking into a card, because what came before is not what the part is about. Each has a small loop running beside its text, so there is something to look at while it is talked over: at 72 threads filling the dashed room their offsets gave them, at 91 a counter wired to blocks of threads that fire at it.
- Every start builds the scenes fresh, so each take begins the same way. To redo a take from the top, press Esc and then V.
- The key list shows at the bottom for the first 3 seconds after starting; start recording after it fades.

Optional later: one press per card in beat 16, naming each as it appears, instead of all three at once.

Decided:
- Beat 7 shows the goal (a clean burst), with no "chaos" beat before it.
- Beat 16 picks culling, level of detail and light clusters out of the grid; the other examples fade out. The grid doesn't sort itself into groups.
- Row labels are named for their context: the row is "prefix sum" in part 3, where that is what is being explained, and "offset" from part 4 on. From part 4 on a "prefix sum" bar sits between count and offset, with no word on how it is computed; the running sum is only shown in part 3.
- The prefix sum uses three threads with fixed counts (5, 3, 6) so the numbers on screen are the ones being said. Each sum is one press, in both the running sum and the chart. In beat 34 the first count steps up and down on its own, one at a time.
- Part 4 explains the parallel prefix sum first and ends on "you now know expansion"; it flows better that way.
- Part 6 uses four clusters and six lights (more lights than clusters). The lists stay as rows: no transposed table. In the app, M on Light clusters switches to the four-cluster setup (with eight lights there), and Controls has the histogram style ("How start is shown") for every example.
- The material tiles beat uses every material's list, so a tile with two materials is in two lists, like a light in two clusters. M on Material tiles in the app flips to the one-mixed-list version if that reads better.
- The light clusters in the overview (the tour at beat 10, the grid, the Binning card) are the same example as part 6: four clusters, six lights, drawn with part 6's rows, which cycle on their own (marks, count, prefix sum, plop, output, about seven seconds, then again) while the lights keep moving.
- Expansion only means no culling: the scripted camera of the expansion beats (39 to 43, and the level-of-detail tour) keeps every object inside the view, so no count drops to 0 there. With the free camera at 44 that is up to the presenter: an object taken out of view is culled, as in the chained example. The dashed 0 chips belong to compaction and to the chained example.
- Wherever a box stands for an object of the level-of-detail scene (the expansion rows, the chained example's second pass, the overview's level of detail), it shows the object the way the scene draws it: its bunny at its current level. The culling rows keep plain boxes, since the scene shows plain circles there.
- Wherever a thread's count is shown next to it (the prefix sum intro, push and pull), the count is a number in its own row and the triangles sit inside the thread's block, so a number on a block is never mistaken for an index.
- The intro stays quiet: every name or number on screen has to serve a purpose, and here the purpose is a taste of where the pattern shows up, not following the algorithm. So there are no names on objects or chips, no distance numbers in LOD, no tile numbers, and no notes under the outputs. The count and start rows and the ribbons stay. Light clusters keeps its cluster numbers.
