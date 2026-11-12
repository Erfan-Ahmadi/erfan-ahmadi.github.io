# Volumetrics video: original drafts

Erfan's drafts exactly as written, kept for reference. The edited working version is in script.md.

## The hook (first draft)

```text
not long after I started learning how to make things with computers, I got super excited when I learned people could simulate the looks of clouds with actual physics; and being able to render clouds became one of my biggest goals in my career and partly why I kept going my way in computer graphics, but ironically I procrastinated learning about it just until very recently, myabe it was too important for me
(first animation is the 3d cloud and in the same cloud viz, we show a section with like a magnifier effect that inside it shows the wobbling of the particles and the discrete version of the effect then we aside this while the animation is still playing a sticky figure with a readout that writes some of my thoughts as I'm speaking about myself, for now it's)
extra notes: space pauses all animations, controls  for navigation like the prev tutorial

but more likely because the first things i encountered was formulas that looked super complex that made me feel... not smart... (sticky figure still there, formula shows up)

This time I started yet again, it made a little bit of sense this time, like how different terms meant different physical interactions of light and medium. (the four brackets under equations and the 4 effects showing up, color coded so things that take light away are red and things that contribute positively is green.

but nobody explained to me, Why does e and exponentials show up? Why is there an integral inside an exponent, inside another integral? (each one navigatble and highlighted with rect and outside greyed out)
```

## The goals (added later, word for word)

```text
By the end of this series I want the physics and math to feel so natural that you can derive the formula yourself and see behind these intimidating looking formulas
We'll build it up gradually and I'll never ask you to just take a formula on pure faith as law of nature
Different stuff, same story.
```

## The body, first draft (added later, word for word)

After beat 20h ("Different stuff, same story."):

(we get rid of the 3 other examples here)

 And for the remainder of this video I'm going be slightly dishonest and assume our "stuff" doesn't scatter light (show the same setup laser hitting those particles in the last "stuff" and scattering in rays and making the volume more reddish) or glow or emit light itself (red glow for each particle, laser light a bit dimmed so the effect of the emission is more visible). I'll come back to emission and scattering in a separate video. for now, our partices only absorb light. 

and here after they absorb the laser light, less of it makes the other end, how much? well that's why have a sensor, here it reads 50%, that means half the light made it through. now let me ask you a question, what if I put a second identical tank right next to this one? (we duplicate the same thing and bring it to the bottom) what would our sensor read now? pause and try to answer it if you want (the sensor reads ? instead of 50%, now you see two setups, above with 1 box and 50, below with 2 and ?)

It's natural to say 0% (sticky figure with 0% readout, the question one goes away), because 1 box took half the light , so two should take all of it away (slide tank to from the right and move laser and sensor outwards for it to fit). but that's not what happens here. our sensor reads 25%. add a third box, it's 12.5%. each box halfs the light entering it. that's exactly what exponential means. multiplication by a fixed fraction.

and this behaviour is described by this formula, you might've heard about the beer-lambert formula. let's see it in action (show the plot, while it's growing from left to write with a dot, the volume under it grows as well)

notice how the more light has to travel through our stuff (a dot and the the box growing and shrinking, ) the less of it makes the other end. and notice how when the stuff becomes more absorbtive it dims light quicker?

this absorbitvity is controlled by [whatever we chose to be in the exponent of e^..*x].  show stationary animamtion increasing and decreasing that value and seeing the stuff change look and the sensor read less

(remember everything on screen should serve a purpose, specially with 2 synced views where viewer can easily get confused)

It's easy to see that when that value is 0, we get a constant 1, that means no light is being absorbed. a.k.a there is no stuff, it's a vaccum. 

For those of you a little bit rusty with calculus and wondering why we have the number e here which is roughly 2 point ..., I'd have to say there is nothing special about it. you can have any base you want, 2^..*x, 3^...*x, .... (shown in a vertical stack) we just rewrite all these different exponential with a base of e (an arrow to the right, all bases change to e). the reason we choose e is that it makes it a little easierworking with integrals and differentual equations but you don't have to worry about them here.

Now you might still be asking. Ok, there is nothing special about e, but why do we have exponential behaviour here?
(aside with sticky figures everytime we play with "you  might be asking")

.... (I'll write the next parts soon)

## Why exponential, first draft (added later, word for word)

to answer that question we should take a look at how light passes through a tiny slab of volume (the zoom in animation, everything else disappears but only a tiny slab remains and we see the shadowing effect with no rays just a sheet, and the length delta_x shows up hinting that it's a delta in distance)
[again remember, every animation or visual component needs to serve a purpose for learning]

here we see that 99% of the particles make it through, the other 1% get absorbed and cause shadows on the other end, that's why the light dims out. 

and notice it doesn't matter how bright or dim the light is (animation of changing light intensity), the particles always absorb 1% and let 99% pass.
in other word this tiny slab of volume says [readout]: I don't care where you come from or how much energy you have, I'm going to take 1% of it.

what the tiny slab does is equivalent to multiplication by 99%, add another, multiply by 99%, add another multiply by 99%. so the percentage of light that gets detected on the other end is 99% to the power of how many slabs you have. (animation that the power of 99% changes in the exponent, and the numbers get added or removed slabs)

[write me better transcripts here.]

but there is still a problem, we're assuming each slab acts independantly as if it doesn't care, but is that true at all? let's assume two slabs with particles placed in a way that block all light (not tiny slabs anymore, but a specific structure that first does 50% and the other does 100% of remainig)
here the first one takes 50% of incoming light, and the other takes 100% of remaining
(or another case where first one does 50% and the second one is hiding behind it absorbing nothing) 
or you might bring up another case where the first slab absorbs 50% the light, and the second slab absorbs nothing, because it sits in the shadow of the first one.

and yes you're correct! and that's why particles being placed like this break our equation! you've now learned that this equation we've been talking about is not a nature of law, it assumes particles are placed randomly (show randomly) not like this or that (the two other versions)

[split screen, left is exponential media, right is non exponential and everything in the next paragraph appears there]
as a matter of fact, particles placed like thos is called non-exponential media and there is research in that field. see for example here in this paper, how assumptions about particle placement change the look of the dragon. [show the image of the dragon on the right side] (https://graphics.unizar.es/projects/Jarabo2018radiative/) 
[btw can I use this in my youtube video with proper attribution?]

but for the sake of this video going forward, we're going to assume exponential media
[pause]
...
we've dicovered .... but real world is rarely like that, a volume changes density and particles and absorbtivity changes as light passes through a volume. [example of cloud or something] ... intro to next quiz about A or B

## Notes from the flow discussions

```text
- The beer bar intro is dropped: too long. Its second-tank question (50% → 25%, not 0%) is kept for after the equation, where "let me show you what I mean" needs an example.
- No quiz in the hook: it looks like a pop quiz and people might drop out. Quizzes come once people are interested.
- Radiance invariance is dropped.
- After the hook: the equation, the four effects highlighted briefly, then the questions about it; "why e?" is one of them.
- What I want to teach: e is not that scary; the exponential, a short answer and a long answer; what an exponential means (fractions, slabs: a slab says "I don't care about the other slabs, I take 10%"); then why does each slab not care → uniform distribution, a hint at probability; a few uses of the radiative transfer equation outside graphics (astronomy and so on).
```
