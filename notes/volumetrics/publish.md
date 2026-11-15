# Publishing the volumetrics video

Texts to paste, for the video "The Hidden Assumption in Every Volume Renderer" (A/B title: "Why Is There an "e" in Every Cloud Renderer?"). Still to fill in: the video's link and the music credit.

## YouTube description

```text
For a long time I wanted to understand the math and physics behind volumetric rendering, and the first thing I ran into was a scary-looking formula: an integral inside an exponent, inside another integral. Every resource I found just handed it to me and wanted me to accept it. Nobody explained why there is an e in it at all.

This is the video I needed back then: the intuition behind some of the questions we usually skip over. It starts from nothing, with a laser, a sensor and a box of fog, and builds that formula up until the e and the integral in its exponent stop looking scary.

This one covers absorption only. Scattering and emission come next.

Chapters
0:00 Intro & Motivation
1:28 Goals
2:29 Light & The Stuff
2:50 Absorption Only
3:32 Another Box?
4:19 Exponential Behaviour
5:46 But Why Exponentials?
7:31 Non-exponentials
8:28 Variable Absorption Coefficient
11:42 Wrap up

Blog post: https://erfan-ahmadi.github.io/blog/the-hidden-assumption-in-every-volume-renderer/

Credits
Bunny renders: Mitsuba 3. Model: the Stanford Bunny, Stanford Computer Graphics Laboratory.
Music: [track and artist]

#computergraphics #rendering #volumetrics
```

The chapter names and times are Erfan's, from the final video (with "Absorbtion" spelled "Absorption").

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
