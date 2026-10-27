## Intro

You and I are in a bar, with a fish tank full of beer between us, and we're about to have a lot of fun. [beat] Just not the kind you'd expect.

I shine a laser through the tank, and you, on the other end, measure how much of the light comes out. 

In this setup, the sensor in your hand reads 50%. [beat] 
In other words, half of the light got absorbed and scattered away by beer inside the tank, making our light dimmer on the other end and the sensor in your hand read 50%.

Now, here's my question for you. If I put a second, identical tank right beside the first one, what does your sensor read?

It's tempting to say zero. One tank takes half the light, so two tanks should take twice as much, and no light comes out the other end giving you a 0% reading.

But that's not what happens, your sensor reads 25%. Add a third tank, and it's 12.5%. Each tank will halve the light entering it.

And this isn't some quirk of beer tanks. There's an equation that describes exactly what happens here.

It's called the radiative transfer equation.

It's the equation that decribes what happens to radiation along a ray as it travels a certain distance through a volume of stuff.

This equation turns up in so many places.

In astronomy, the stuff is the gas and dust between the stars, and the radiation is the starlight making its way to our telescopes.

Similarly In climate science, the stuff is our own atmosphere.

And the most surprising of all, at least to me is Medical Imaging where the stuff the X-ray radiation passes through is the tissues inside your body.

But the place I know it best is computer graphics because that is my day job and I remember the first time I ran into this equation, wanting to simulate the looks of clouds and smoke on a computer program.

By the end of this series, I want this equation to feel less like something handed to you, and more like something you could have derived yourself.

You usually hear that this equation is built out of a handful of separate pieces.
Some of them take light away, and others add light to it.

But nothing about that tells you why it's built this way. Why does e show up? Why is there an integral inside an exponent, inside another integral? 

But to me, the most interesting question is why light behaves exponentially here at all. It's usually treated like an unquestionable law of nature, rather than something we can actually unpack. But, as It turns out, you only get this behavior if you make some very specific assumptions about how the particles are arranged in space. But... I'm getting ahead of myself.

Before we get to answer these questions, let's first see what each of these pieces actually mean.

[some montage or pause]

## four effects

So back to our original setup. A laser at one end, a sensor at the other, some volume in the middle. It doesn't have to be beer — it could be fog, smoke, a cloud or a cup of tea.
[setup returns; sensor parked on the right side, laser is on the left poitning right]

Just watch what a single photon can do in there.

[setup frame duplicates into a 2×2 grid, when talking about each new effect it will zoom to be cenetered and on top of the others, when done it will go back into it's place]
 [after each one of the 2x2 animations is done and is being put in their place, the text above them also names them, absorbtion, emission, out-scattering and in-scattering]

Photons can run into one of the particles and get absorbed and swallowed, the energy here doesn't disappear, it turns into heat.
[top-left: photon strikes a particle and vanishes; particle flushes warm, faint heat rings; readout ticks down; red −]

But it also works the other way. The particles can emit light of their own — nothing to do with our laser — and some of it happens to set off toward the sensor.
[top-right: no beam; particles emit in all directions, only the ones heading at the sensor coloured green; readout ticks up; green +]

And that's still not everything that can happen to our tiny little photons. One could bounce off of a particle and leave at some angle that never reaches us at the other end this is called out-scattering.
[bottom-left: photon deflects off the beam line and exits frame; beam line stays drawn; readout ticks down; red −]

On the other hand, A photon from some other source entirely, like the sun, wanders in hits a particle and bounces right into our lane.
[bottom-right: foreign-tinted photon enters at a steep angle, turns onto the beam line, reaches sensor; readout ticks up; green +]

That's it. Four things. Two take light away, two give it back.
[all four cells loop at once; left column dims red, right column brightens green; the +/− signs from the formula reappear, tethered to their cells]

## Absorbtion begin

[the other effect change color to grey and stop playing]
So for the rest of this video I'm going to be slightly dishonest. Our volume doesn't scatter, and it doesn't emit. It does exactly one thing: it absorbs light passing through. The rest, I'll come back for in next videos.
[the other effects fade away, absorption playing]
[bottom row fades out; emission next; absorption expands to full frame]

[the other three effects finish fading; absorption cell expands to full frame]

It's tempting to jump straight to what the formula means when you get rid of all the other terms. But let's watch it in action first.
[laser + 3m volume + sensor slide down, clearing the top half; plot fades in above, empty axes, no formula yet]

We've seen how distance changes the reading.
[sensor walks back and forth through the volume; plot tracks it with a vertical line at the sensor's x and a horizontal line reading off the y-axis; beam's own fade deepens as the sensor moves out]

Distance isn't the only knob, though. Hold the sensor still and the reading still moves if the volume changes — pack the particles closer together and more light gets taken out of the beam.
[sensor parks at the right edge of the box and stays there; particles in the volume densify, then thin out; the curve on the plot steepens and flattens through a family of exponentials, readout on the sensor moving with it]

So two things are in play: how far the light has to travel, and how much the stuff along the way takes from it. And the ratio between what we send in and what comes out  I1/I0  turns out to be an exponential function in the form a to the x 
[write $I_1/I_0 = a^x$ beside the plot; $I_1$ highlights, then $I_0$, then $a$ and $x$, as each is named]

Here x is distance, and a is a property of the volume itself. the lower a is the faster it absorbs our light. 

For example, let's fix $a$ at zero point five and walk the sensor out. [pause..] See how at the one meter mark it reads fifty percent.
[sensor sweeps the full 3m; readout interpolates $I_1/I_0 = 0.5^x = \dots\%$; pause and hold at $x = 1$, 50%]

Two things worth noticing here. At $x = 0$ the reading is one hundred percent, whatever $a$ happens to be — no distance travelled, nothing taken.

And when $a$ is exactly one, distance stops mattering altogether. there is nothing that absorbs light, That's a vacuum, or anything that lets light through untouched.
[sensor returns to $x = 2$, readout shows $a^2 = \dots\%$ as $a$ sweeps up; at $a = 1.0$ the curve interpolates to a flat line and the beam loses its fade entirely]

A lot of you may have already seen this formula, with a slightly different shape, under the name Beer–Lambert, and written as e to the power of some constant multiplied by x.
[laser, volume and sensor clear out; plot and equation take the frame]

It's the same formula written differently, Our $0.5^x$ is $e^{-0.693x}$ — the exact same behaviour, shown with two different looking formulas
[$e^{-0.693x}$ written as a literal decimal, not $\ln 2$; its curve draws in the same axes at a different shape, then bends until it sits exactly on the $0.5^x$ curve]

The number multiplying $x$ is what picks the shape. The $e$ itself isn't special. It's just used for convenience, because the derivative of $e^x$ is $e^x$ again, which makes it pleasant to work with for differental equations.
[$\frac{d}{dx}e^x = e^x$ writes on below]

For the full story on why $e$ earns that, there's a beautiful explanation by the one and only Grant Sanderson of 3Blue1Brown.
[thumbnail slides into frame]


[back to the single plot synced with the sensor; setup returns underneath]
Now you might raise your hand, and ask me "But that only explains the $e$. It doesn't explain the shape. Why should absorption be exponential at all?"
[everything we talked about in a frame and the sticky figure next to it raises it's hand, talking about the concept in the frame]

Fair question, and there are two answers to it: a quick one, and a longer one, that I think is a lot more satisfying. I'll give you the quick answer first, partly because it's nice to have something in hand, and partly because the quick answer quietly sneaks in an assumption that people rarely mention or talk about, we will look into that assumption in the longer asnwer.
[sticky figure, question in a thought bubble; two frames side by side, labelled
"quick" and "intuitive", each looping a preview of its own future animation]

[zoom into the quick answer]

Here is the quick version, take the volume and slice it into thin slabs [pause]
Each slab, it turns out, takes a fixed fraction of whatever light comes into it. 
Let's say this one takes ten percent.  100% goes in, 90% comes out.
[volume divides into slabs; one slab slides out and zooms up; Δx above it;
"100%" enters from the left, travels through, exits on the right as "90%"]

Now when we bolt a second slab onto it, it takes 10% of the remaining 90% and leaves 81%
[second slab plugs in from the right; label becomes 2Δx; "90%" enters, exits as "81%"]
Add a third, and it absorbs 10% of the 81 leaving 72.9% 
[third slab; 3Δx; exits as "72.9%"]

Notice what each slab is really doing, It's not subtracting 10%, It's multiplying by 90%
[readouts fade; "×90%" appears under each slab; below, the chain 100% × 0.9 × 0.9 × 0.9 writes out one factor at a time]

So with three slabs, you've multiplied by 90% three times. With n slabs,
n times. That's 90% to the power of n.
[the chain collapses into 0.9³; a "…" and an nth slab appear; 0.9ⁿ]

And that's really all an exponential is. [pause] Something that gets multiplied
by the same factor every time you take one more step. Same factor, over and
over, and you get a power. And since n slabs is just some distance x, this is
where the a to the x we saw earlier was coming from all along.
[0.9ⁿ morphs into a^x beside the earlier plot; the curve redraws]

that's the quick answer, and it works! but it sneaks in a very important assumption.
Every slab of our volume takes a fixed fraction of the light, regardless of what happened to the light before it arrived.
It's like every slab is saying "I don't care what happened before me, I take 10% of ANY incoming light.
[thought bubble over a single slab: "I don't care what happened before me.
I take ten percent. That's it."]

But is that actually true? why should a slab of fog or any volume for that matter, behave that way? [pause]

that's what the longer answer is about. 
[zoom out of the quick answer; zoom into the intuitive/longer one]


- For the videos and external references you do not have access to yet, put placeholder texts or frames

TODO:
- ADD a section in beginning stage or modify it, when you're asking the question that want to be answered. show video/clips of future sections (e.g. why is it exponential? -> show video of dx and fractions or why is there integral in the exponent, show clip of varying extinction coefficient)
- varying density, quick test at the beginning, optical density and the integral
- what we've learnt so far and now you learned the reason you see that integral in the exponent.
- video essentially finished, but I'm thinking of a few additions for curious minds (not ordered)
    - actual beer-lamber law and the history and what beer and lamber each did + link to resource
    - wavelength dependent formula but we talked as if the same type of light coming from sun is the same as laser
    - RTE limitation: lights as ray and geometrical rather than waves, flurencese?
    - clumps and shadowing and non-exponential media exist! 
    - radiance invariance and why we use rays
    - sensor is the same as pixel and in computer graphics that is not a single value rather than RGB.
    - should I make these a separate video? not sure.

Style as close as possible to proven formula of 3b1b

Prompt to give to AI:
"I want to create an engaging explainer video about volumetrics, the math behind radiant transfer equations, and I have already sketched a storyboard. I know the rough flow of topics that I want to cover, and I want to make the video in a way that's intuitive, engaging, and fun to watch, and I want to follow the formula of 3b1b channel, Grant Sanderson. Since English is not my mother tongue, I need to come up with more variety of phrases and English vocabulary to make this better. So I need help with that as well as ideas on how to improve the flow, what to say and what not to say based on common sense and what is best for the audience. And I've been writing a transcript that comes with the animation being played as well. I am planning to complete that transcript first, then record an audio for it, and only then start making the animations to match the audio. I know in my mind what those animations are going to look like. And I try to do my best to describe them, but animations are the next step."
