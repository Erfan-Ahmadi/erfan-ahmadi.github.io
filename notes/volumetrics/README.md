# Volumetrics video: animation test bench

One page of separate animated scenes for the video on absorption, Beer's law and the radiative transfer equation. The scenes are not in the video's order and don't run into each other; each one is a place to try an animation.

`volumetrics-video.html` is the built page. It is a single self-contained file that requests nothing but Google Fonts, so it opens straight from disk or in a sandboxed iframe. It is not part of the blog: nothing in `src/content` links to it.

## Build

```sh
node notes/volumetrics/build.mjs
```

Edit `src/`, never the built page:

- `src/shell.html` is the markup and the CSS.
- `src/app.js` is the engine and every scene.
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
| 6 | Shadows in a slab | Bohren and Huffman's shadowing: rays stopped by discs, and the fraction that reaches the sensor against $e^{-n\sigma z}$. |
| 7 | Slice the slab | $\left(1 - \frac{\tau}{N}\right)^N \to e^{-\tau}$ as the slab is cut into more slices. |
| 8 | Zoom into a slab | Two fronts meet at a thin slab, then the camera closes in and lands on scene 6. |
| 9 | Optical depth is an area | Paint $\sigma_a(z)$; the area under it is $\tau$, and $T = e^{-\tau}$. |

Buttons under the stage play each scene's animations. The laser, the beam's look and width, the container and the medium are shared, so a change shows in every scene that uses them. "Fade into scene…" crossfades slowly into another scene, and the speed slider scales every animation.

Keys: <kbd>1</kbd>–<kbd>9</kbd> pick a scene, <kbd>Space</kbd> plays the main animation, <kbd>R</kbd> resets, <kbd>←</kbd> <kbd>→</kbd> step, <kbd>H</kbd> hides the controls for recording, <kbd>F</kbd> goes full screen.
