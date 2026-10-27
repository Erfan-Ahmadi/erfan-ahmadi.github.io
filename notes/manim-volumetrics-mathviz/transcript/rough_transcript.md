# Rough narration

The draft narration. The intro is final (recorded); the rest is still rough and open to change.

## Intro

You and I are in a bar, with a fish tank full of beer between us, and we're about to have a lot of fun. Just not the kind you'd expect.

I shine a laser through the tank, and you, on the other end, measure how much of the light comes out.

In this setup, the sensor in your hand reads 50%.
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

## four effects

So back to our original setup. A laser at one end, a sensor at the other, some volume in the middle. It doesn't have to be beer — it could be fog, smoke, a cloud or a cup of tea.

Just watch what a single photon can do in there.

Photons can run into one of the particles and get absorbed and swallowed, the energy here doesn't disappear, it turns into heat.

But it also works the other way. The particles can emit light of their own — nothing to do with our laser — and some of it happens to set off toward the sensor.

And that's still not everything that can happen to our tiny little photons. One could bounce off of a particle and leave at some angle that never reaches us at the other end this is called out-scattering.

On the other hand, A photon from some other source entirely, like the sun, wanders in hits a particle and bounces right into our lane.

That's it. Four things. Two take light away, two give it back.

## Absorbtion begin

So for the rest of this video I'm going to be slightly dishonest. Our volume doesn't scatter, and it doesn't emit. It does exactly one thing: it absorbs light passing through. The rest, I'll come back for in next videos.

It's tempting to jump straight to what the formula means when you get rid of all the other terms. But let's watch it in action first.

We've seen how distance changes the reading.

Distance isn't the only knob, though. Hold the sensor still and the reading still moves if the volume changes — pack the particles closer together and more light gets taken out of the beam.

So two things are in play: how far the light has to travel, and how much the stuff along the way takes from it. And the ratio between what we send in and what comes out  I1/I0  turns out to be an exponential function in the form a to the x

Here x is distance, and a is a property of the volume itself. the lower a is the faster it absorbs our light.

For example, let's fix $a$ at zero point five and walk the sensor out. See how at the one meter mark it reads fifty percent.

Two things worth noticing here. At $x = 0$ the reading is one hundred percent, whatever $a$ happens to be — no distance travelled, nothing taken.

And when $a$ is exactly one, distance stops mattering altogether. there is nothing that absorbs light, That's a vacuum, or anything that lets light through untouched.

A lot of you may have already seen this formula, with a slightly different shape, under the name Beer–Lambert, and written as e to the power of some constant multiplied by x.

It's the same formula written differently, Our $0.5^x$ is $e^{-0.693x}$ — the exact same behaviour, shown with two different looking formulas

The number multiplying $x$ is what picks the shape. The $e$ itself isn't special. It's just used for convenience, because the derivative of $e^x$ is $e^x$ again, which makes it pleasant to work with for differental equations.

For the full story on why $e$ earns that, there's a beautiful explanation by the one and only Grant Sanderson of 3Blue1Brown.

Now you might raise your hand, and ask me "But that only explains the $e$. It doesn't explain the shape. Why should absorption be exponential at all?"

Fair question, and there are two answers to it: a quick one, and a longer one, that I think is a lot more satisfying. I'll give you the quick answer first, partly because it's nice to have something in hand, and partly because the quick answer quietly sneaks in an assumption that people rarely mention or talk about, we will look into that assumption in the longer asnwer.

Here is the quick version, take the volume and slice it into thin slabs
Each slab, it turns out, takes a fixed fraction of whatever light comes into it.
Let's say this one takes ten percent.  100% goes in, 90% comes out.

Now when we bolt a second slab onto it, it takes 10% of the remaining 90% and leaves 81%
Add a third, and it absorbs 10% of the 81 leaving 72.9%

Notice what each slab is really doing, It's not subtracting 10%, It's multiplying by 90%

So with three slabs, you've multiplied by 90% three times. With n slabs,
n times. That's 90% to the power of n.

And that's really all an exponential is. Something that gets multiplied
by the same factor every time you take one more step. Same factor, over and
over, and you get a power. And since n slabs is just some distance x, this is
where the a to the x we saw earlier was coming from all along.

that's the quick answer, and it works! but it sneaks in a very important assumption.
Every slab of our volume takes a fixed fraction of the light, regardless of what happened to the light before it arrived.
It's like every slab is saying "I don't care what happened before me, I take 10% of ANY incoming light.

But is that actually true? why should a slab of fog or any volume for that matter, behave that way?

that's what the longer answer is about.
