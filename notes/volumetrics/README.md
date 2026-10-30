# Volumetrics video: animation test bench

One page of separate animated scenes for the video on absorption, Beer's law and the radiative transfer equation. The scenes are not in the video's order and don't run into each other; each one is a place to try an animation.

`volumetrics-video.html` is the built page. It is a single self-contained file that requests nothing but Google Fonts, so it opens straight from disk or in a sandboxed iframe. It is not part of the blog: nothing in `src/content` links to it.

## Build

```sh
node notes/volumetrics/build.mjs
```

Edit `src/`, never the built page:

- `src/shell.html` is the markup and the CSS.
- `src/app.js` is the engine and the 2D scenes.
- `src/volume.js` is the WebGL2 volume renderer and scene 17; `src/million.js`, `sheets.js`, `bases.js` and `average.js` are scenes 18 to 21. The build inserts them into `app.js`, after its scenes and in that order, so they can use the engine's helpers and keep their numbers.
- `build.mjs` puts KaTeX's stylesheet (fonts inlined as data URIs), KaTeX's script, the glyph outlines and `app.js` into the shell. KaTeX comes from the blog's `node_modules`, so run `npm install` first.
- `glyphs.mjs` reads the outlines of KaTeX's fonts, which the morphs and the write animation draw as paths.

## Scenes

| Key | Scene | What it shows |
|---|---|---|
| 1 | Laser and tank | A laser through a tank of beer or a cloud, filling the tank, and a sensor reading the percentage that gets through. |
| 2 | Equation morph | The RTE written out, highlighted with braces that stretch into place. Formulas reshape into each other, or move by matching parts. |
| 3 | Plot | Manim-style axes, and a curve drawn from left to right. |
| 4 | Beam and plot | The beam and its plot stacked, with a point on the beam tied to the curve at the same $x$. |
| 5 | $e^{-ax}$ | The curve as $a$ changes, with the numbers counting. |
| 6 | Shadows in a slab | Bohren and Huffman's shadowing: rays stopped by discs, and the fraction that reaches the sensor against $e^{-n\sigma z}$. "Zoom out to millions" carries on into scene 18. |
| 7 | Slice the slab | $\left(1 - \frac{\tau}{N}\right)^N \to e^{-\tau}$ as the slab is cut into more slices. |
| 8 | Zoom into a slab | Two fronts meet at a thin slab, then the camera closes in and lands on scene 6. |
| 9 | Optical depth is an area | Create the medium and its density fills in above it; shine and $T(z) = e^{-\tau(z)}$ is traced below. A draggable marker splits the area into what the light has crossed and what is ahead. Paint $\sigma_a(z)$ on its plot. |
| 10 | What light can do | One photon and one particle: absorption, out-scattering, emission and in-scattering, then absorption alone. The paths are drawn in grey with arrows, along the beam's line toward an eye at the right; photons are particles that bounce off the surface, or wave packets. |
| 11 | Sparse and dense | Two slabs, a few particles and many, each with its rays and sensor. Particles pop in as their number grows. |
| 12 | Why e? | The slope triangle of $b^x$: slope over height is $\ln b$ everywhere, and at $b = e$ the slope is the height, $\frac{d}{dx}e^x = e^x$. |
| 13 | Slice by slice | Identical slices each keep the same fraction: 90%, 81%, 72.9%. Bars of what is left, $e^{-\alpha n}$ through them, and $\frac{dI}{dz} = -\alpha I$. |
| 14 | One photon at a time | Photons fired one by one stop at the first particle they touch. Where they stop builds $P(X \ge x)$, which follows $e^{-\mu x}$; $P(X < x)$ is its complement. |
| 15 | A or B? | The same dense and sparse halves in opposite orders. The factors multiply, the exponents add, and the order does not matter. Steps with Next and Back. |
| 16 | Product to integral | Slices, a product of factors, a sum in the exponent, bars that close in on $\int_0^d \sigma(z)\,dz$. Last, the density changes shape at equal area and the light that gets out stays put. |
| 17 | Cloud in 3D | A cumulus made from noise and lit by the sun, with a laser through it and a sensor reading $T = e^{-(\sigma_a + \sigma_s)\int \rho\,ds}$. Drag to orbit and scroll to come closer. Scattering, absorption and the sun turn on and off. "Zoom into the beam" dissolves the cloud into the particles of scene 6 and lands on it, and scene 6 zooms back out. "The eye" shows an eye, the rays it looks along, and what it sees. |
| 18 | Millions of particles | Scene 6's slab zoomed out across the beam, with the depth kept where it is: more rays and discs come into view, the discs shrink below a pixel, and the fraction of rays still going closes in on $e^{-n\sigma z}$. At a million discs the medium is a liquid in a tank. Zooming in takes the liquid back apart into discs and lands on scene 6. The middle of the beam is simulated, about 80,000 discs; past a thousandfold zoom the picture and the curve are the limit. |
| 19 | Where the shadows fall | Slabs as transparencies, seen beside the beam and turned to look down it, where each ray is a dot. Each slab puts particles on a share $c$ of the rays. Slabs that don't care where earlier shadows fell overlap them and leave $(1-c)^n$; slabs that fill the gaps give the tempting $1 - cn$ and a wall; slabs that line up let the first slab's light through them all; clumps fall in between. "Half and half" is the second-tank question: 50% twice is 25%, not 0. A log scale makes the exponential a straight line. |
| 20 | Same curve, any base | $0.5^x$ and $e^{-kx}$: $k$ slides to 0.693 and the curves become one, which is also $2^{-x}$ and $10^{-0.301x}$. Every $a^x$ starts at 1, and $a = 1$ is a vacuum. Slope over height is the same everywhere, and in base $e$ it is the number in the exponent. |
| 21 | Average, then exponentiate? | Rays through clumps each see their own $\tau$; the sensor reads the average of $e^{-\tau}$. Smear the clumps into the same amount spread evenly, as a coarser level of detail would, and it reads $e^{-\bar\tau}$, which is less: on the convex curve the average of the points lies above the curve. |

Scene 17 needs WebGL2; while the camera is still it keeps averaging frames until the picture settles.

Presentation mode (<kbd>V</kbd> or Present) plays the video's beats from `script.md` on the stage, one key press each: <kbd>→</kbd> next, <kbd>←</kbd> back (a beat the way it ends), <kbd>Space</kbd> pauses every animation, <kbd>R</kbd> replays, <kbd>Esc</kbd> leaves. `#present` opens in it, `#present-7` at beat 7. The beats live in `src/present.js`; the narration in `script.md`, with Erfan's drafts word for word in `script-drafts.md`.

Buttons under the stage play each scene's animations. The laser, the beam's look and width, the container and the medium are shared, so a change shows in every scene that uses them. "Fade into scene…" crossfades slowly into another scene, and the speed slider scales every animation.

Keys: <kbd>1</kbd>–<kbd>9</kbd> pick a scene, and two digits typed quickly pick scenes past nine; <kbd>[</kbd> <kbd>]</kbd> step through scenes, <kbd>Space</kbd> plays the main animation, <kbd>R</kbd> resets, <kbd>←</kbd> <kbd>→</kbd> step back and forth in the step scenes, <kbd>H</kbd> hides the controls for recording, <kbd>F</kbd> goes full screen.
