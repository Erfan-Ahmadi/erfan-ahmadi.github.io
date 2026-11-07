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

**8.** [One press for all four effects: the four braces grow under their terms together, a moment apart, and the four cells fade into a 2 × 2 grid under the equation, each with its name in its corner, the particle and photons playing in it, back to back, a little over a second apart, the first already most of the way to the particle. Every cell shows the paths in a neutral grey with arrows, the beam's line through the particle toward an eye at the right, all on the centre line. Absorption and out-scattering in red, emission and in-scattering in green. In emission, light leaves the particle every way at once, and only the photon heading for the eye has colour. Nothing already on screen changes.]
> Parts of it made sense: each term is a different way light and the stuff interact.

**12.–12b.** [The braces and the grid fade. A yellow box goes around the integral in the exponent, and everything outside it greys out; the part keeps a light yellow tint. Next press: the box leaves the equation and turns into a card that stays, the question as its title, "why an integral in the exponent?", and most of the card a place for the animation that answers it later (TODO: variable density).]
> But nobody explained to me why there's an integral inside an exponent…

**13.–13b.** [A blue box goes around the outer integral sign, from 0 to $d$; next press, it turns into the second card: "inside another integral?" (TODO: optical depth, an integral inside an integral).]
> …inside another integral.

**14.–14b.** [An orange box goes around the $e$; next press, the first two cards shrink and step aside, one to each side, while the box grows into the third card between them, half as big again: "Why $e$? Why exponentials?" (TODO: the rays, the discrete version on top of the continuous one). The three parts keep their tints, and the three cards sit in a row under the equation, the most important one in the middle: the video's map.]
> And most importantly: why $e$? Why exponentials at all? And the answers turned out to be simpler, and more interesting, than I expected.

## Part 2: what this is, and what we keep

**15.–15g.** [Seven presses, at "This video isn't a shader tutorial", "and it isn't a physics lecture", "It's the part in between", "By the end of this series", "the physics and the math", "derive it yourself" and "And most importantly". The cards and the equation go, and the equation stays away from here until it has been earned, late in the series. A small raymarcher with its shader code fades in at the left end, an arrow under it. The arrow walks to the right, drawing a line behind it, and a small physics lecture's chalkboard, scribbles and sketches with nothing readable, comes in at that end. The arrow walks back to the middle and sways back and forth there from then on. Then the whole spectrum moves into an aside at the top, still swaying; under it, "Goals:" comes in on the left, and the figure walks over to the right. Then one bullet per press: "the physics and math behind the intimidating look"; "derive it yourself", while a copy of the figure, "WTF?!" and all, walks out to the right along a growing arrow, its readout widening and the "WTF?!" reshaping into "I understand it now" on the way, "Now" under the first, "Then" under the copy. As soon as the copy sets off, the first figure, its "WTF?!" and its "Now" fade to grey: the past; "a model, not a law: its assumptions and limits".]
> This video isn't a shader tutorial, and it isn't a physics lecture. It's the part in between. By the end of this series, I want the physics and the math to feel so intuitive that you could derive it yourself. And most importantly, I want you to see that this isn't a law of nature to accept blindly. It's a simplified model of the real world, with its own assumptions and limits. So, forget the symbols for a minute.

**16.** [The aside, the goals and both figures go; the figure isn't needed from here on, and what follows sits in the middle of the stage. No formula: the caption alone writes in, large at the top: "light, travelling some distance, through some stuff."]
> In plain words, all of this is about one thing: what happens to light as it travels some distance through some stuff.

**17.–20.** [One press per field, each a playing card fading in at its own place in a row of three: astronomy (starlight through dust on its way to a telescope), climate science (sunlight through the atmosphere, the bluer light scattering away), medical imaging (X-rays through the stick figure onto a detector). Then this video, at once: a laser, a closed box with plain stuff in it (a haze with specks drifting in it, in the yellow of the caption's "stuff"), and a sensor with no reading on it yet (nothing on screen before it is introduced), the beam dimmer past the box, drawn like the bench's laser and tank. It opens on the left and pushes the other three into a column on the right, where they lose their colour and slow to a stop: the focus has moved. The caption's "light" takes the laser's red.]
> And "stuff" really can be anything. In astronomy, it's the dust between the stars. In climate science, it's our own atmosphere. In medical imaging, it's your body. And for us, here, it's a box of… stuff.


**20b.–20h.** [One press per thing the box holds, the beam dimming more or less across it: fog; a cloud; smoke, thin streams curling up like a cigarette's and gathering under the lid; a block of tinted glass, catching the light; coffee; beer, with a head of foam; then, at "It doesn't matter yet", plain stuff again.]
> Fog, [20c] a cloud, [20d] smoke, [20e] tinted glass, [20f] a cup of coffee, [20g] a glass of beer. [20h] It doesn't matter yet. Different stuff, same story.

## Part 3: only absorption, and the first formula

**21.–21b.** [The three field cards and the caption go, and the box grows out of its card until the laser, the box of plain stuff and the sensor fill the stage. Next press, the dishonesty, shown on this very box: each speck the beam passes lights up and sends thin red rays off it, fading as they go, and the stuff around the beam glows a faint red: scattering.]
> For the rest of this video I'm going to be slightly dishonest. [21b] I'll assume our stuff doesn't scatter light,

**21c.** [The scattering stops. Each speck glows red on its own, and the beam dims a little so the glow shows: emission.]
> and that it doesn't glow, or give off any light of its own. Scattering and emission get their own video.

**21d.** [The glow goes: plain stuff again, the beam dimmer past the box.]
> For now, our particles only absorb light.

**22.** [The sensor's reading appears for the first time: 50%.]
> So they take some of the laser's light, and less of it makes it to the other end. How much less? That's what the sensor is for. Here it reads fifty percent: half the light made it through.

**23.** [The whole setup is copied, without its readout, and the copy slides down to the bottom half of the stage. In the copy, a second identical box slides in from the right beside the first, the laser and the sensor moving outward to make room; then a readout pops up on the copy's sensor: "?". So: above, one box and 50%; below, two boxes and "?".]
> Now, a question. What if I put a second, identical box right next to this one? What does the sensor read now? Pause and try to answer, if you want.

**24.** [The stick figure comes in, its readout "0%".]
> It's natural to say zero. One box took half the light, so two should take all of it.

**25.–25b.** [The figure and its readout go, and the copy's reading reshapes from "?" into 25%. Next press, a third box slides in the same way, and as soon as it starts sliding the reading reshapes into 12.5%.]
> But that's not what happens. The sensor reads twenty-five percent. [25b] Add a third box: twelve and a half. Each box halves the light that enters it. That's exactly what exponential means: multiplying by a fixed fraction, again and again.

**26.** [The single-box setup goes. The formula writes in, just $e^{-\sigma d}$ (the symbol in the exponent is still to be chosen; the full form with $I_0$ waits for the very end of the video), and under it a plot: the light that gets through, 100% at the top, against the distance $d$, in box lengths, so the curve passes 50%, 25% and 12.5% at one, two and three boxes. The curve, in the laser's red, draws from left to right with a dot riding it; under the plot, the box grows along with the dot, its left end at the plot's 0 and its right end under the dot, a faint dashed line joining the two; the laser before it, the sensor after it, reading what the curve says.]
> This behaviour has a formula, and you may have heard its name: the Beer–Lambert law. Let's see it in action.

**27.** [The dot runs back and forth along the curve; the box grows and shrinks with it, and the sensor reads what the curve says. It stops at two boxes: 25%.]
> Notice how the further the light has to travel through our stuff, the less of it makes it out the other end.

**28.–28b.** [The constant in the exponent lights up in yellow and goes up: the stuff looks denser, the curve drops faster and the sensor reads less. Next press, it goes down: the stuff thins out and the curve flattens. The box stays still for this; only the stuff and the curve change. (Production note: everything on screen should serve a purpose, especially with two synced views, where a viewer is easily confused.)]
> And notice how the more absorbing the stuff is, the quicker it dims the light. That absorptivity is this number in the exponent. Turn it up, and the stuff thickens and less light gets through. [28b] Turn it down, and more does.

**29.** [The constant goes to zero: the curve flattens into a line at 100%, the box empties and the sensor reads 100%; "= 1" comes in after the formula.]
> And when that number is zero, this is just one: everything gets through. Nothing is absorbed. There is no stuff: it's a vacuum.

**30.** [The plot, the box and the formula go. A vertical stack writes in: $2^{-ad}$, $3^{-bd}$, $10^{-cd}$, ⋮; an arrow to the right, and a copy of each reshapes into the same thing with base $e$ and a new constant: $e^{-a'd}$, $e^{-b'd}$, $e^{-c'd}$, ⋮.]
> If you're a little rusty on calculus and wondering why the number $e$ is in there, roughly 2.718, I have to say: there's nothing special about it. You could use any base: two, three, ten. We just rewrite them all with base $e$, because $e$ makes integrals and differential equations a little easier to work with. You don't have to worry about that here.

**31.** [An aside, the device for every "you might be asking": the stick figure comes back, its readout "but why exponential?".]
> Now, you might still be asking: fine, there's nothing special about $e$. But why do we get exponential behaviour here at all?

(The next parts are still to be written.)

## Open

- The cards in beats 12–14 hold TODO placeholders for the animations that answer them.
- What the box holds once the body starts, the example the rest of the video keeps, is open. For now it is plain stuff.
- The symbol for the constant in the exponent (beat 26 on) is to be chosen.
- The formula stays $e^{-\sigma d}$ throughout. The full form, and how it turns into the version with emission, comes at the very end of the video, as the lead into the next one.
- The quiz's three readings aren't marked on the curve in beat 26. They could be: dots at one, two and three boxes, at 50%, 25% and 12.5%.
