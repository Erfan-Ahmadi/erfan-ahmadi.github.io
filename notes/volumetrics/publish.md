# Publishing the volumetrics video

Texts to paste, for the video "The Hidden Assumption in Every Volume Renderer" (A/B title: "Why Is There an "e" in Every Cloud Renderer?"). Still to fill in: the video's link, the chapter times, and the music credit.

## YouTube description

```text
Every volume renderer has the same term in it: e to the minus an integral. Every resource I found handed it to me and wanted me to accept it. This video builds it from scratch, with a laser, a sensor and a box of fog.

You'll see:
• why two boxes that each absorb half the light leave 25%, not 0%
• why that turns into an exponential (the Beer–Lambert law)
• the assumption about the particles that the exponential rests on, and what it looks like when it doesn't hold
• why the density ends up as an integral in the exponent

This isn't a shader tutorial, and it isn't a physics lecture either. It's the part in between. This one is only about absorption; scattering and emission come in the next video.

Chapters
0:00 The formula nobody explained
0:00 What this video is, and isn't
0:00 Light through "stuff"
0:00 Only absorption
0:00 Two boxes: why not zero?
0:00 The exponential
0:00 Why exponential?
0:00 When the density changes
0:00 From a sum to an integral
0:00 Where the e and the integral come from

Blog post: https://erfan-ahmadi.github.io/blog/the-hidden-assumption-in-every-volume-renderer/

Credits
Bunny renders: Mitsuba 3. Model: the Stanford Bunny, Stanford Computer Graphics Laboratory.
Music: [track and artist]

#computergraphics #rendering #volumetrics
```

Where each chapter starts, by what is said there:

| Chapter | Starts at |
|---|---|
| The formula nobody explained | the start |
| What this video is, and isn't | "This video isn't a shader tutorial…" |
| Light through "stuff" | "In plain words, all of this is about one thing…" |
| Only absorption | "For the rest of this video I'm going to be slightly dishonest…" |
| Two boxes: why not zero? | "How much less? That's what the sensor is for…" |
| The exponential | "This behaviour can be described with an exponential." |
| Why exponential? | the zoom into the thin slab, after the "but why exponential?" aside |
| When the density changes | "But we're still far from what happens in practice…" |
| From a sum to an integral | "And see what happens when your absorption changes continuously" |
| Where the e and the integral come from | "By now I hope you've understood…" |

YouTube needs the first chapter at 0:00, at least three chapters, and each at least 10 seconds long.

## LinkedIn (with the clip attached)

```text
Rendering clouds is a big part of why I kept going in computer graphics. And for years I delayed learning how it actually works.

The first thing I ran into was a formula with an integral inside an exponent, inside another integral. Every resource I found handed it to me and wanted me to accept it. Nobody explained why there is an "e" in it at all.

So I made the video I needed back then. With a laser, a sensor and a box of fog, it builds that term from scratch:
→ why two boxes that each absorb half the light leave 25%, not 0%
→ why that turns into an exponential
→ the assumption about the particles hiding behind it
→ why the density ends up as an integral in the exponent

It isn't a shader tutorial, and it isn't a physics lecture. It's the part in between.

Full video: link in the first comment.

#computergraphics #rendering #gamedev
```

First comment: the YouTube link. (LinkedIn shows posts with a link in the body to fewer people.)

## X / Twitter (same clip)

```text
Every volume renderer multiplies light by e^(−∫σ dx).

Nobody explained to me why there's an e in it. So I made a video that builds it from a laser and a box of fog.

It starts here: two boxes that each absorb half the light leave 25%, not 0%.
```

Reply to it with: `Full video: [link]`

## The clip

The two-box question stands on its own and ends on a surprise: from "Now, I've got a question for you. What if I put a second, identical box right next to this one?" to "Each box halves the light that enters it." About half a minute.

## The blog post

`src/content/posts/2026-11-15-the-hidden-assumption-in-every-volume-renderer/index.mdx`, a draft. Once the video is up: put its id in `youtube:`, add the chapters, set the date, delete the `draft` line.
