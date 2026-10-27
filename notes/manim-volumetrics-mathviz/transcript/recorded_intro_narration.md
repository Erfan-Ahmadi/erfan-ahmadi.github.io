# Recorded intro narration

What was actually recorded for the intro (auto-transcribed, so a few words are misheard, e.g. "have" for "halve").

You and I are in a bar, with a fish tank full of beer between us, and we are about to have a lot of fun.

Just not the kind you'd expect.

I shine a laser through the tank, and you on the other end measure how much of the light comes out.

In this setup, the sensor in your hand reads 50%.

In other words, half of the light got absorbed and scattered away by beer inside the tank, making our light dimmer on the other end and the sensor in your hand read 50%.

Now, here's my question for you.

If I put a second identical tank right beside the first one, what does your sensor read?

It's tempting to say zero.

One tank takes half the light, so two tanks should take twice as much.

And no light comes out the other side, and it gives you a 0 % reading.

But that's not what happens.

Your sensor reads 25 % at a third tank, and it reads 12 .5%.

Each tank will have the light entering it.

And this isn't some quirk of beer tanks.

There's an equation that describes exactly what happens here.

It's called the radiative transfer equation.

It's the equation that describes what happens to radiation along a ray as it travels a certain distance through a volume of stuff.

This equation turns up in so many places.

In astronomy, the stuff is the gas and dust between the stars, and the radiation is the starlight making its way to your telescopes.

Similarly, in climate science, the stuff is our own atmosphere.

And the most surprising of all, at least for me, is medical imaging, where the stuff the x -ray radiation passes through is the tissues inside your body.

But the place I know it best is computer graphics, because that is my day job.

And I remember the first time I ran into this equation, wanting to simulate the looks of clouds and smoke on a computer program.

By the end of this series, I want this equation to feel less like something handed to you, and more like something you could have derived yourself.

You usually hear that this equation is built out of a handful of separate pieces.

Some of them take light away, and others add light to it.

But nothing about it tells you why it's built this way.

Why does E show up?

Why is there an integral inside an exponent inside another integral?

But to me, the most interesting question is why light behaves exponentially here at all.

It's usually treated like an unquestionable law of nature, rather than something we can actually unpack.

But as it turns out, you only get this behavior if you make some very specific assumptions about how the particles are arranged in space.

But I'm getting ahead of myself.

Before we get to answer these questions, let's first see what each of those pieces actually mean.
