# GPU-Driven Anything: original drafts

Erfan's drafts exactly as written, kept for reference. The edited working version is in script.md.

## Part 1: the hook (first draft)

```text
If you're here there is a high chance you've already seen this visualization I made, It's culling, the idea is simple we want to filter out the objects that our outisde our cameras view [main idea culling with camera moving showing, nothing extra, no annotations or anything]

And the implementation is easy on the CPU [the cpu implementation begins to slide in] if and object is visible push it to our visible items list.

But what if you have a thousand objects [quickly new objects starts to pop up in the camera's view, not necessarily 1000 but a lot]. but now instead a single serial CPU computation you want to process each object in a single gpu thread [objects will suddenly move into a row on the left side and morph into blocks of threads)  [use ... don't make things smaller]
you don't have a simple vector push_back anymore. 

how do you ensure all of these thousand threads write to their correct ordered place in the output? [sudden burst of gpu writing to locations all at once]

The answer to this question is the backbone any many of the techniques in computer graphics [struggling with finding the right wording for this help me phrase this part better] .

such as choosing the level of detail [3 objects show more lods, and camera going back and forth, all in view]
where each item could generate a different number of geometry based on how close the camera is.
Or when assigning lights to clusters in clustered shading. where each cluster could contain many lights.

There are more examples out there, you see this pattern everywhere, particle systems, marching squares, guassian splatting. [show particles, curves, marching squares, guassian splatting] (I will control how to move to next one but it will be pretty quick so make the animations quick there)

[all the examples above will also come with minimal annotation, simple scenarios that's easy to digest and the left side calculations and ribbons]

The applications are endless but undelying all of these, is the same pattern.
[then the last one will shrink and we'll see a grid of all the examples I have mentioned.
] 
I will write up the rest in a later prompt
```

## Part 2: three kinds (first draft)

```text
[Show the 3 concepts Compaction, Expansion and Binning, with the explicit name and one associated visualization associated with them. I'm thinking of 3 vertical cards, and the animation is running continously while I'm speaking]

I'm not going to go into implemnentation detail or show you code, My goal here is to show you this pattern in the best way I know how. so you can detect when you stumble upon a similar problem you can know just the pattern to use [I need to say this part better].
```

## Part 3: the prefix sum (first draft)

```text
behind all these processes is the simple process of prefix sum; If you don't know what a prefix sum is, the idea is simple. once you've counted how many items a single thread will generate. (count : colored boxes with count inside it). every new item becomes the sum of what came before it.
and this new sum will tell each thread where they should start writing.
because anything that comes before could affect where our offset is (you need to help me clarify this better).  
let me show you that with a simple chart, the first item is 0, the next is 0+5, the next is 5 + 3, then next is 8+6. 
[then the vertical bar becoming the offsets animation we already have]
see how changing the count on the first object affects the offsets of everything that comes after it [the first one changing count and the offsets of the next 2-3 items highlighted with marker]
```

## Part 3: notes on the second pass

```text
the offsets are not poitning to the start of their area for some reason. minor ux issue
I need to see the + sign in the animation happening. the actual running sum which we already have animation of.  I need to control each step. 
make it so that it doesn't jump from 5 to 7 but counts up and down and the offsets are moving.
also I'm thinking of showing these as generating N triangles, so each thread should show N triangles and then small triangle inside each little box in the chart. the first changing number should be more dynamic and smoother for better understanding.

I added some minor changes to transcript. another way to say the last sentence: "A thread can't know where to start until it knows how much room every thread before it needs." let's use this.

based on the transcript so I need to show the sum first.. and then the chart, so the sum animation happens twice. take transcript into account when placing the animations
```

## Part 4: in parallel, and expansion (first draft)

```text
Congratulations, you now know what expansion is and how it works. Expansion is when each thread generates different amount of work decided at runtime. like generating these LoDs here. (the full lod visualization pops up, the expansion + lod selection on top) 

But you might be asking, wait a minute, how do you calculate the prefix sum [the lod stuff with camera view dissapers, and we do aside with only the prefix sum again], it seems suspicoously a serial algorithm that every thread depends on the last. To which I say, great question and there is plenty of clever algorithms developed over the last few decades (a visualization of prefix sum like bleloch or some kind of network thing, doesn't matter and doesn't need to be that exact) that compute the prefix sum in parallel over thousands of threads. I was really tempted to go into these algorithms here, but that's not my goal and there is plenty of resources which you can learn parallel prefix some, some of which I'll link down below.  for now let's sweep that under the rug and just accept that this prefix sum happens in parallel.
```

Later notes:

```text
the movememnt of 3-8 for the first item is continous and doesn't make sense. it should be discrete.
when I say let's sweep that under the rug the network disappears and becomes simple or squashes somehow make sure to have that animation as well
hmm I think I'll do the parallel explanation first and then the congrats you now know expansion, it flows better this way
when asking serial , the animation of first item changing should be still playig, also too much empty space due to aspect ration for some reason on the "aside" that feels weird. also remove "links in the description text".
the next animation for lods is too fast. it should do the animation with camera frozen move the camera to another place and do it again.
make the networked prefix sum appear 2x as fast
```

## Part 5: compaction, then the two chained (first draft)

```text
[fade to compaction, camera frozen at a state]
Compaction is the same idea. it's even simpler, each item generates either 0 or 1 items instead of many. count is 1 when object is visible and a 0 when it's culled. [1's visible highlighted, and when next 0s and invisibles highlighted, with their count below them]
it's called compaction because the number of outputs is less than the number  of input. (navigation will highlight the inputs and then with next conrol the outputs highlighted, a bit bigger or something that turns the attention to)

Now that you know what expansion and compaction is (two seperate sections, the lod one will appear or slide in again somehow with the name of expansion and compaction)
you can chain these two operations together and plug them like legos. (the left and right section merge together and the expansion goes under the comapction)
the first pass will compact and cull and the second pass will expand and generate geometry for appropriate LoDs. and this is what actual real-time applications and games do like...
```

Later note:

```text
compaction animations also need to be controlled by navigation, right now it immediately skips to compaction. the two different cameras and the algorithm steps need to be controllable
```

Later notes:

```text
the items in the compaction and the expansion need to be synced and the same color position (except compaction has others outside view)
when showing expansion next to compaction they need the full frozen version not the animation again
the merging needs to be more smooth and items already in screen need to be placed in the correct spots because the items are synced it's natural and then those orange highlight annotations will go over each step, first compaction and then expansion. instead of start write `offset`and between the layers of count and offset put one of those blackbox prefix sums.
oh and for previous animation for the prefix sum. instead of start write ` prefix sum` be careful about annotations like this being properly named to the context they are in
for compaction make the full algorithm show first then navigatable options to highlight outputs and inputs when we have the full version and ribbons
```

## Part 5, rewritten directions

```text
for compaction animations let me rewrite cause you don't know what's in my head.
both compaction and expansion near the end, I don't want the sum + animation, the point was shown before, I want a long bar writing "prefix sum" similar to what we did by abstracting the complex network.
for compaction, I want the first view to be object and count and highlighting visible and invisible ones with 1 and then 0, then show algorithm run without the sum and the arrows poitning to the offsets becoming ribbons then highlight output then highlight inputs.

and for the merge, we should only show the first row above. also I don't want two different sections (it seems like two cards stacked on another), It should be 1 unified one. 
the next navigation will very quickly run the algorithm (without the sum) in 1-2 seconds to get culled output, and then the next run will work on those outputs to generate lods (again quickly)
```

Later note:

```text
for expansion, when camera moves, don't replay the animation allover again, count to targer numbers and stretch those outputs to match the new camera position
```

Later note:

```text
the very first section I want to show the merged expansion and compaction without naming things, the prefix sum should be visible. and it should be dynamic as the camera moves around. and as soon as the code pops in it goes out and the code comes in. similar to what we currently have at the end but with no highlighting or extra explanations
```

Later note:

```text
for the first beat, the idea with the camera should be the main focus and centered, and those merged prefix sum stuff should be on the right and smaller, they go out from the right and code comes in from the left
```

## Part 6, binning (the user's directions)

```text
perfect, now onto the next: but before that I need some more animations and modifications to the light clustering version. (the number of lights should be more than clusters, so maybe let's make it 4 clusters and 8 lights) and I need an animation that moves those lights to blocks of threads in a row. and then swaps the order when I say "let's look at it the other way around"
[aside the combined thing. question pops up : what if we got multiple outputs to push back into?]
[go into clustering example but only show the idea with the camera]
(a connector the idea of binning) now that you understand how expansion or compaction work to generate variable sized data into the output, you might be wondering what happens if we need multiple outputs to push back into. for example when we need to assign lights to clusters?
in clustered lighting, instead of a single list, we need one list per cluster [one output row becomes multiple clusters.] and we issue one thread per light.
and this is where most people get confused. because unlike compaction or expansion where we do the prefix sum over the inputs, here we count how many lights per cluster, this is called histogramming (show histogram per cluster), and do the prefix sum over the counts themselves, this prefix sum is usually much cheaper than the others because in practice the number of lights is a lot bigger than the number of clusters. (prefix sum vertical bar then histogram horizontal after it, might run out of physical space a bit, let's see how it looks first) then turn the histogram into a prefix sum so bars on the bottom are larger by construct. and then the most bottom one will become the offsets with dashed lines. once we know the offsets we can run our threads once again and place them in the appropriate place. note that this time the order within the buckets themselves doesn't matter much so we can use atomics instead of prefix sum. if you don't understand this don't worry we'll come back to the usage of atomics in these scenarios
```

Later notes:

```text
btw add these new visualization options for binning in the main view outside presentation as well
```

```text
[next, quickly show the material one, similar to binning we will arrive at for the light clustering.]
another example of binning is assigning materials to each tile. you usually see this pattern in deferred shading pipelines.
```

```text
try to publish gradually before working on other items/tasks I've given you so I can review faster
```

Later notes:

```text
for the binning I don't want them transposed. I want them right upfront. let me do a drawing. kind of like this to the right, but you can make it more compact to save space. then the bottom one will plop down to be the offsets dashed thing we have now. also no need for seperate colors now, just number them instead with 0 1 2 3
```
(The drawing: the thread row along the top, the four lists as rows numbered 0 to 3, and to the right of each list a bar: the first short, each next one the one above it plus its own piece.)

```text
also show the total count to the right of the table and the prefix sum vertical bar after this table and before the prefix sum visualization
```

## Part 7, push or pull (the user's draft)

```text
ok now help me write the next sections. I need help with phrasing things.  (please fact check as well)

Now before I end this video. For more advanced viewers I want to touch up on few nuances I had purposefully omitted.
I had talked about how to use prefix sum to calculate offsets, but I didn't go into how to actually use those offsets to either populate or iterate over your compact output.
there are two ways to go about it. Push style vs pull style. [push on the left, pull on the right, with text appearing on each point I speak about)
Push style is when each input thread writes it's values to the appropriate offset in the output.
this usually requires an additional memory to store the outputs. and you get imbalanced workloads across a wave if one thread has many things to add and others have to wait for it to finish (example of 8 waves in a row, one has 8 items in it's column, other only 1-2).

wth pull style, you run the next batch of threads iterating over the outputs insteads. and each thread will ask itself, which input do I belong to? and then known it's local offset to PULL the data. this usually involves each thread doing a binary search or more technically correct upper bound to find it's parent. so it's more calculation but less memory requirements and more balanced workloads and specially good for the compaction expansion chain we just saw where the expansion pass can PULL the compaction pass's result

generate animations for above as well please


next point is atomics vs prefix sum
```

## Part 8, atomics (the user's draft)

```text
another thing I wanted to touch up on is atomics instead of prefix sum. 
If we go back to our original exmaple of push back, one could easily claim that prefix sum is not needed and you could do the same thing with atomics. every visible object will add to that atomic and use it's current offset to find it's offset in the output (actually show some GPU pseudo code with atomics). 
this gives you perfectly compact output, but it's not necessarily ordered, with the chaos of GPU execution, each frame your compacted results depend on which threads executed the atomic first. this might not matter in certain situations. but when you care about preserving the order, the solution is prefix sum.
another problem with atomics is having to rountrip to global memory and sync atomics across thousands of threads globally
```

## The ending (the user's note)

```text
add at the final transcript:
aside. and then saying goodbye in a way (I'm not good at this so I need help)
but I want to say something along "If you have any other examples that match these patterns comment down below..."
```

Later note:

```text
for the atomics, code on the left and takes less space
remove the global memory grid thing at the end of the atomic section
```

Later note:

```text
add prefix sum title in the presentation about prefix sum
```

Later notes:

```text
in the expansion section after the intiial run when I hit next, it will go into a mode of moving the camera around and the left side becomes sync and updated, it doesn't have to be a single move and stop, it can move back and forth and look different directions. it gives me time to talk about things
```

```text
the binning in the initial sections of overview of different usecases is not synced with our recent additions and updates to binning animation
```
