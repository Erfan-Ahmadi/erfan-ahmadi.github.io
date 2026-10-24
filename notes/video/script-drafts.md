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
```
