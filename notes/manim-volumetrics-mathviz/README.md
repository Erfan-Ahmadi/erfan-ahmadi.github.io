# Volumetrics / RTE explainer: handoff

I'm a graphics programmer making a 3Blue1Brown-style explainer series about volumetric rendering and the radiative transfer equation (RTE). The intro was animated in Manim. I now want to move to web artifacts (HTML/SVG/JS) and rethink the visuals there.

This folder holds what exists so far. **Treat it as a starting point, not a spec.** Keep what works, and feel free to come up with better ideas for anything, especially the parts that aren't animated yet.

## What's here

| Path | What it is |
|---|---|
| `choreography.md` | What happens on screen in the intro, loosely, with the stills that go with each part |
| `plan.md` | Where the video goes after the intro, plus open ideas |
| `transcript/rough_transcript.md` | The narration draft: the intro, the four effects, and the start of absorption |
| `transcript/recorded_intro_narration.md` | The intro as I actually recorded it |
| `stills/` | Key moments of the intro, full frame (16:9, 3840×2160), as PNG + SVG |
| `items/` | The individual pieces, cropped (figure, tank, laser, sensor, equation, cards…), as PNG + SVG |
| `original_materials/storyboard/` | My hand-drawn storyboard pages for the sections after the intro |
| `original_materials/` | A source note on Beer–Lambert and Max's 1995 paper "Optical Models for Direct Volume Rendering" |

The SVGs were rendered straight from the Manim scenes. Each one has a black rectangle as its first element (the background): delete it if you need transparency. Text and maths are outlined paths, not live text.

## Look and feel

- Black background. White, slightly hand-drawn stick figures. The bar is a dim grey chalk sketch that stays in the background.
- Beer is amber (`#F0A030`) with white foam. The laser beam is red and fades as it passes through the beer.
- The sensor readout is sky blue (`#5CC8FF`) on a very dark blue panel (`#04101C`).
- Things that take light away are red; things that add light are green. Yellow highlights whatever is being talked about.
- Maths is LaTeX (Computer Modern).
- Grey panels in the cards are placeholders for pictures I'll provide later.

## How I like animations to feel

- Something is almost always moving while I talk (the 3b1b way).
- Motions overlap and flow into each other. No step, pause, step.
- When something makes room for something new, it does that in one continuous move while the new thing fades or grows in.
- Cards and text fade in where they are, without sliding or typewriter effects.
- When something shrinks, its line widths shrink with it.
- Everything ends up looking centred and balanced.

## Working with me

- Ask me when something is open to interpretation. Don't guess: I usually have a picture in my head and answer quickly.
- Use simple placeholders (a labelled panel) for pictures and clips. Don't build elaborate stand-ins.
- English isn't my first language, so help with phrasing in the narration is welcome.
