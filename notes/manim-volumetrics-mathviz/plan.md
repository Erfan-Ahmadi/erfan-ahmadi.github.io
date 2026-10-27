# Plan

The goal of the series: by the end, the RTE should feel less like something handed to you and more like something you could have derived yourself.

## Rough flow of this video

1. **Intro**: the beer tanks, the equation, where it's used, and the questions it raises. *(animated; see choreography.md)*
2. **The four effects**: back to laser → volume → sensor, and what a single photon can do in there: absorption, emission, out-scattering, in-scattering. Two take light away, two give it back.
3. **Absorption only**: drop everything else for now. Distance and density both change the reading, and the ratio out/in turns out to be an exponential, aˣ.
4. **Why e?** aˣ and Beer–Lambert's e^(−kx) are the same curve. e is only there for convenience (its derivative is itself), with a shout-out to 3Blue1Brown's video on e.
5. **Why exponential at all?** The quick answer: slice the volume into slabs, each taking a fixed fraction, which gives repeated multiplication, which gives a power. But that quietly assumes every slab takes the same fraction no matter what came before.
6. **The longer answer**: why a fraction per slab has to do with probabilities and how the particles are arranged in space.
7. **Varying density**: when density changes along the ray, you get optical depth, and that is why there's an integral inside the exponent.
8. **Recap**: now you know why that integral sits in the exponent.

The storyboard pages in `original_materials/storyboard/` cover parts 2 to 7 (plus "ray invariance" right after the intro).

## Open ideas

- When the intro asks its questions, show short previews of the future sections (e.g. slabs and fractions for "why exponential?", varying density for "why the integral in the exponent?").
- A quick quiz on varying density before explaining it.
- Possible extras for curious viewers, maybe as separate videos:
  - the real history of the Beer–Lambert law, what Beer and Lambert each did
  - wavelength dependence (the video treats sunlight and laser light as the same)
  - the RTE's limits: light as geometric rays, not waves; fluorescence
  - clumpy media where attenuation is *not* exponential
  - radiance invariance along a ray, and why we work with rays at all
  - a sensor is like a pixel, and in graphics a pixel is RGB, not a single value
