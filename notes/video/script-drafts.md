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
