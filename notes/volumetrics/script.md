# Volumetrics video: script

Each numbered beat is one key press in presentation mode (press <kbd>V</kbd> or the Present button on the test bench; <kbd>→</kbd> next, <kbd>←</kbd> back, <kbd>Space</kbd> pauses every animation, <kbd>R</kbd> replays the beat, <kbd>Esc</kbd> leaves). Animations inside a beat play on their own. Stepping back shows a beat the way it ends.
The working script below has light edits; the original drafts, word for word, are in script-drafts.md.

## Part 1: the hook

**1.** [The cloud in 3D, lit by the sun, the camera still. The laser is already shining through it onto the sensor; no reading is shown. A panel is already open on a section of the beam inside the cloud: the discrete version. The cloud is particles, wobbling, the rays stop at them, and under them the step plot of how many rays are left: bare axes, no formula, no smooth curve yet.]
> Not long after I started making things with computers, I found out that people could simulate the look of clouds with actual physics.

**2.** [The picture shrinks into a card on the left and keeps playing. A stick figure, me, appears on the right, and its readout writes in: "Woah, this is cool AF".]
> I got very excited about that, especially when I saw them in my favourite games and animations.

**3.** [The readout reshapes, the way manim transforms one formula into another, into "This is my goal now".]
> Rendering clouds became one of the biggest goals of my career. It's a big part of why I kept going in computer graphics. But, for years, I delayed learning how it actually works.

**7.** [The card goes. The figure shrinks into the bottom-left corner and stays there; as soon as it starts moving, its readout reshapes into "WTF?!". The equation writes in, large, in about two seconds.]
> Mainly because the first thing I ran into was a formula that looked like this. And that was intimidating, and every resource I found just handed it to me and said: accept it.

**8.** [One press for all four effects: the four braces grow under their terms together, a moment apart, and the four cells fade into a 2 × 2 grid under the equation, each with its name in its corner, the photon and the particle playing in it. Every cell shows the paths in a neutral grey with arrows, the beam's line through the particle toward an eye at the right, all on the centre line. Absorption and out-scattering in red, emission and in-scattering in green. In emission, light leaves the particle every way at once, and only the photon heading for the eye has colour. Nothing already on screen changes.]
> Parts of it made sense: each term is a different way light and the stuff interact.

**12.–12b.** [The braces and the grid fade. A yellow box goes around the integral in the exponent, and everything outside it greys out; the part keeps a light yellow tint. Next press: the box leaves the equation and turns into a card that stays, the question as its title, "why an integral in the exponent?", and most of the card a place for the animation that answers it later (TODO: variable density).]
> But nobody explained to me why there's an integral inside an exponent…

**13.–13b.** [A blue box goes around the outer integral sign, from 0 to $d$; next press, it turns into the second card: "inside another integral?" (TODO: optical depth, an integral inside an integral).]
> …inside another integral.

**14.–14b.** [An orange box goes around the $e$; next press, the first two cards shrink and step aside, one to each side, while the box grows into the third card between them, half as big again: "Why $e$? Why exponentials?" (TODO: the rays, the discrete version on top of the continuous one). The three parts keep their tints, and the three cards sit in a row under the equation, the most important one in the middle: the video's map.]
> And most importantly: why $e$? Why exponentials at all? And the answers turned out to be simpler, and more interesting, than I expected.

## Part 2: what this is, and what we keep

**15.–15g.** [Seven presses, at "This video isn't a physics lecture", "and it isn't a shader tutorial", "It's the part in between", "By the end of this series", "the physics and the math", "derive it yourself" and "And most importantly". The cards and the equation go, and the equation stays away from here until it has been earned, late in the series. A small physics lecture's chalkboard, scribbles and sketches with nothing readable, fades in, an arrow under it. The arrow walks to the right, drawing a line behind it, and a small raymarcher with its shader code comes in at that end. The arrow walks back to the middle and sways back and forth there from then on. Then the whole spectrum moves into an aside at the top, still swaying; under it, "Goals:" comes in on the left, and the figure walks over to the right. Then one bullet per press: "the physics and math behind the intimidating look"; "derive it yourself", while a copy of the figure, "WTF?!" and all, walks out to the right along a growing arrow, its readout widening and the "WTF?!" reshaping into "I understand it now" on the way, "Now" under the first, "Then" under the copy; "a model, not a law: its assumptions and limits".]
> This video isn't a physics lecture, and it isn't a shader tutorial. It's the part in between. By the end of this series, I want the physics and the math to feel so intuitive that you could derive it yourself. And most importantly, I want you to see that this isn't a law of nature to accept blindly. It's a simplified model of the real world, with its own assumptions and limits. So, forget the symbols for a minute.

**16.** [The aside, the goals and the future self go. No formula: the caption alone writes in, large at the top: "light, travelling some distance, through some stuff."]
> In plain words, all of this is about one thing: what happens to light as it travels some distance through some stuff.

**17.–20.** [One press per field, each a playing card in a 2 × 2 grid: astronomy (starlight through dust on its way to a telescope), climate science (sunlight through the atmosphere, the bluer light scattering away), medical imaging (X-rays through the stick figure onto a detector), then this video: a laser, a closed box of plain stuff (a haze with specks drifting in it) and a sensor, the beam dimmer past the box, drawn like the bench's laser and tank. The other three shrink into a column on the left, then this one grows to take the rest of the stage, and the caption moves over it.]
> And "stuff" really can be anything. In astronomy, it's the dust between the stars, and the light is starlight on its way to a telescope. In climate science, it's our own atmosphere. In medical imaging, it's your body, and the light is an X-ray. And for us, here, it's a laser, and a box of… stuff.

**20b.** [The box holds fog, then a cloud, then smoke, then beer, each for a moment, the beam dimming more or less across it, and goes back to plain stuff.]
> Fog, a cloud, smoke, a glass of beer. It doesn't matter yet.

**20c.** [Dotted lines draw from the caption's "light" to the beam, the word taking the laser's colour, and from its "stuff" into the box.]
> Different stuff, same story. Because whatever the stuff is, there are only four things it can do to light passing through. We saw them a minute ago.

**21.** [The cards and the caption go. As in the hook, one effect per press: absorption's tile fades in, lit in its colour, playing. The four tiles fill the stage; no formula above them.]
> Absorption: the photon hits a particle and is swallowed. Its energy doesn't vanish, it becomes a little heat.

**21b.** [Out-scattering's tile fades in, lit; absorption's keeps playing.]
> Out-scattering: it bounces off and leaves in some other direction, so it never reaches the eye.

**21c.** [Emission's tile fades in.]
> Emission: the particle gives off light of its own, and some of it heads our way.

**21d.** [In-scattering's tile fades in.]
> In-scattering: light from somewhere else bounces off a particle, right into our line of sight.

**21e.–21i.** [Five presses. At "Two take light away.", the two red tiles light up together; at "Two add it.", the two green ones. At "our stuff doesn't scatter,", out-scattering and in-scattering grey out and stop; at "and it doesn't emit.", emission does the same. At "It only absorbs.", absorption, still playing, grows over the other three.]
> Two take light away. Two add it. And for the rest of this video I'm going to be slightly dishonest: our stuff doesn't scatter, and it doesn't emit. It only absorbs. The other three build on top of absorption, and I'll come back to them in a separate video. So let's see what absorption alone does to our light.

## Part 3: the quiz (the body starts here)

**22.** [The laser, the cloud as a slab, the sensor. The beam goes in at full brightness and comes out dimmer. The sensor settles on 50%.]
> With absorption alone, here's what happens. The light goes in, some of it gets swallowed on the way, and your sensor reads fifty percent. Half made it through.

**23.** [A second, identical slab slides in behind the first. The sensor shows "??%".]
> Now, quick question. I put a second cloud, same as the first, right behind it. What does your sensor read?

**24.** [The sum writes at the top: 100% − 50% − 50% = 0%. The sensor shows 0%.]
> It's tempting to say zero. One cloud takes half the light, so two should take all of it.

**25.** [Every "− 50%" becomes "× ½". The sensor settles on 25%. A third slab: 12.5%.]
> But that's not what happens. It reads 25%. A third: 12.5%. Each cloud halves whatever reaches it. Why half of what's left, and not the same amount again? That question is the whole video.

(Beats 22–25 are narration only so far; their visuals are not built yet.)

## Why this order

Confusion → goal → definition: each block answers the question the one before it raises ("this is confusing" → "I'll fix that" → "fix what, exactly?"). After the hook the formula leaves the screen: the goals, the definition, the fields and the four effects are about the physics, and the formula comes back only once it has been earned. Showing it everywhere would keep asking the viewer to read it. The goal lands about 90 seconds in, after the questions, so it sounds like a response, not an announcement. The four effects appear twice, first as "some made sense", then as "we keep only this one", and are only named the second time. "What this video is not" is one sentence inside the goal, not a section. The quiz is the first beat of the body: by then they know what the equation describes, what the goal is and what's been cut, so a question is a change of gear rather than a pop quiz.

## Open

- The cards in beats 12–14 hold TODO placeholders for the animations that answer them.
- What the box holds once the body starts, the example the rest of the video keeps, is open. For now it goes back to plain stuff.
- Beats 22–25: visuals to build: the slabs quiz.
