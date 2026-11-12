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

**12.–12b.** [The braces and the grid fade. A yellow box goes around the integral in the exponent, and everything outside it greys out; the part keeps a light yellow tint. Next press: the box leaves the equation and turns into a card that stays, the question writing in as its title on the way, so it's done as the card lands, "why an integral in the exponent?", and most of the card a place for the animation that answers it later (TODO: variable density).]
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

**17.–20.** [One press per field, each a playing card fading in at its own place in a row of three: astronomy (starlight through dust on its way to a telescope), climate science (sunlight through the atmosphere, the bluer light scattering away), medical imaging (X-rays through the stick figure onto a detector). The light in each is drawn as rays, as everywhere else: streaks, brightest at the front, that bend where they scatter and fade where they're absorbed. Then this video, at once: a laser, a closed box with plain stuff in it (a haze with specks drifting in it, in the yellow of the caption's "stuff"), and a sensor with no reading on it yet (nothing on screen before it is introduced), the beam dimmer past the box, drawn like the bench's laser and tank. It opens on the left and pushes the other three into a column on the right, where they lose their colour and slow to a stop: the focus has moved. The caption's "light" takes the laser's red.]
> And "stuff" really can be anything. In astronomy, it's the dust between the stars. In climate science, it's our own atmosphere. In medical imaging, it's your body. And for us, here, it's a box of… stuff.


**20b.–20h.** [One press per thing the box holds, the beam dimming more or less across it: fog; a cloud; smoke, thin streams curling up like a cigarette's and gathering under the lid; a block of tinted glass, catching the light; coffee; beer, with a head of foam; then, at "It doesn't matter yet", plain stuff again.]
> Fog, [20c] a cloud, [20d] smoke, [20e] tinted glass, [20f] a cup of coffee, [20g] a glass of beer. [20h] It doesn't matter yet. Different stuff, same story.

## Part 3: only absorption, and the first formula

**21.–21b.** [The three field cards and the caption go, and the box grows out of its card until the laser, the box of plain stuff and the sensor fill the stage. Next press, the dishonesty, shown on this very box: the few specks right in the beam's path light up where it hits them, and from each, every second or so, a thin red ray of its light leaves in some direction; every speck a ray meets on its way sends it off in a new one, flashing as it's hit, a few bounces, each a little dimmer, until the ray leaves the box; the stuff around the beam glows a faint red: scattering. Over the box, "No Scattering" writes in.]
> For the rest of this video I'm going to be slightly dishonest. [21b] I'll assume our stuff doesn't scatter light,

**21c.** [The scattering stops. Each speck glows red on its own, and the beam dims a little so the glow shows: emission. Under "No Scattering", "No Emission" writes in.]
> and that it doesn't glow, or give off any light of its own. I'll get to them in the next video.

**21d.** [The glow goes: plain stuff again, the beam dimmer past the box. The two lines turn into one, the letters they share moving over: "Just Absorption". It goes when the setup is copied, at 23.]
> For now, our particles only absorb light: whenever light hits one particle, it's is taken in and turned into a little heat.

**22.–22b.** [The sensor's reading appears for the first time, 50%, already brought forward: everything else dims and the readout is a little bigger. Next press, everything goes back as it was.]
> So they take some of the laser's light, and less of it makes it to the other end. How much less? That's what the sensor is for. Here it reads fifty percent: half the light made it through. [22b]

**23.–23b.** [The whole setup is copied, without its readout, and the copy slides down, slowly, to the bottom half of the stage. Next press, in the copy, a second identical box slides in from the right beside the first, the laser and the sensor moving outward to make room, and the light past the first box gives way to a row of "?" drifting through the second box to the sensor, which goes dark: nothing gives the answer away. Then a readout pops up on the copy's sensor: "?". So: above, one box and 50%; below, two boxes and "?".]
> Now, I've got a question for you. [23b] What if I put a second, identical box right next to this one? What does the sensor read now? Pause and try to answer, if you want.

**24.–24b.** [An aside, as every aside with the stick figure goes (as in beat 2): both setups shrink into a card of their own colour, moved over to the left, and the figure comes in on the right, its readout "0%". Next press, over its head, the guess worked out, the same amount off for every box: "1 box: 100% − 50% = 50%", "2 boxes: 100% − 100% = 0%" (the count in blue; what's taken off, its minus sign and all, in red, the colour of light taken away; the rest in white).]
> It's natural to say zero. [24b] One box took half the light, so two should take all of it.

**25.–25f.** [At "But that's not what happens", a red cross strikes out the wrong sum. Next press, the figure, its readout and the sum go, and the card grows back to fill the stage. The question marks clear, the light carries on through the second box to the sensor, and the reading reshapes from "?" into 25%; from here the top row has a touch less colour, hardly noticed, so the eye stays on the bottom one, where the question is. Next press, a third box slides in the same way, and as soon as it starts sliding the reading reshapes into 12.5%. Next press, at "multiplying by a fixed fraction", the bottom row fades and comes back as one box, "100%" over a small pointer where the light goes in and, where the box ends, "100% × ½", which turns into "50%": what comes out of it; the reading shows 50%. Next press, the row makes room and a second box drops into its place from just above; the reading halves as it appears, and then at its end "50% × ½" fades in and turns into "25%". Next press, a third the same way: the reading to 12.5%, and "25% × ½" into "12.5%". The amounts are in lavender and the "× ½" in the red of the wrong sum's "− 50%": minus a half has become times a half. (Other ways to animate this, such as one label riding along with the light and halved by each box, are in the bench's Halving tab.)]
> But that's not what happens. [25b] The sensor reads twenty-five percent. [25c] Add a third box: twelve and a half. Each box halves the light that enters it. That's exactly what exponential means: [25d] multiplying by a fixed fraction, [25e] again [25f] and again.

**26.–26c.** [The one-box row goes, and the bottom row's three boxes close up, end to end, keeping their amounts over the joins: 100% where the light goes in, 50%, 25% and 12.5% where each box ended. The formula writes in above them, just $e^{-\sigma d}$, plain, no colours yet: we don't know what its letters stand for (the symbol in the exponent is still to be chosen; the full form with $I_0$ waits for the very end of the video). Next press, the three boxes become one long box, three box lengths, a brace in blue under it counting them, "3 boxes", and a plot sketches in between the formula and the box: the light that gets through, 100% at the top, against the distance $d$, in box lengths up to three, its 0 and its 3 exactly over the long box's ends. The curve, in the laser's red, draws from left to right, its dot appearing at the end, over the box's end, a faint dashed line joining the two and another from the dot across to the y-axis; the laser before the box, the sensor after it, reading what the curve says, its readout greyed a little so the eye stays on the curve and the formula. Next press, the amounts rise along dashed lines from the box to their places on the curve, each a dot there with its amount beside it: 100% at 0, 50% at one box, 25% at two, 12.5% at three; the brace's "3 boxes" turns into $d = 3.0$, the count becoming a distance, and with it the $d$ in the formula and on the axis takes the blue the boxes were counted in. $\sigma$ takes the specks' yellow at beat 28, once it's named. From here to beat 29, whichever of the two is changing is lit in the formula, a little bigger, with a thin box around it, and the rest dims.]
> This behaviour has a formula, and you may have heard its name: the Beer–Lambert law. [26b] Let's see it in action. [26c]

**27.** [The amounts on the curve and their lines go. The dot runs back and forth along the curve, from three boxes down to almost nothing and back, over and over until the next press, never stopping on its own; the box grows and shrinks with it, and the sensor reads what the curve says. It's $d$ that's changing, so $d$ is the one lit in the formula, a thin box around it, and the brace under the box counts: $d = 2.0$.]
> Notice how the further the light has to travel through our stuff, the less of it makes it out the other end.

**28.** [The dot settles at two boxes. The constant in the exponent takes the specks' yellow, and then it goes up to twice what it was and down to half, over and over until the next press: up, the stuff looks denser, the curve drops faster and the sensor reads less; down, the stuff thins out and the curve flattens. Now it's $\sigma$ that's lit in the formula, the thin box around it, and the brace gives way to $\sigma = \ldots$ in the box, among the specks. The box stays still for this; only the stuff and the curve change. (Production note: everything on screen should serve a purpose, especially with two synced views, where a viewer is easily confused.)]
> And notice how the more absorbing the stuff is, the quicker it dims the light. That absorptivity is this number in the exponent. Turn it up, and the stuff thickens and less light gets through. Turn it down, and more does.

**29.** [The constant goes to zero, from wherever it was, and stays written in the box, now empty: $\sigma = 0$. The curve flattens into a line at 100%, the box empties and the sensor reads 100%; after the formula comes "$= e^0$", then "$= 1$".]
> And when that number is zero, this is just one: everything gets through. Nothing is absorbed. There is no stuff: it's a vacuum.

**30.** [The plot, the box and the formula go. A vertical stack writes in: $2^{-\sigma d}$, $3^{-\sigma d}$, $10^{-\sigma d}$, ⋮, with $\sigma$ in its yellow and $d$ in its blue. Then a copy of each glides to the right and turns into the same thing with base $e$, the change of base a rough number multiplying $\sigma$ (that's $\ln 2$, $\ln 3$, $\ln 10$), and an equals sign writes in between the two as it lands: $2^{-\sigma d} = e^{-0.69\,\sigma d}$, $3^{-\sigma d} = e^{-1.10\,\sigma d}$, $10^{-\sigma d} = e^{-2.30\,\sigma d}$, ⋮, the rows lined up on their equals signs. The $-$, $\sigma$ and $d$ glide across, the base turns into $e$ and the number comes in.]
> If you're a little rusty on calculus and wondering why the number $e$ is in there, roughly 2.718, I have to say: there's nothing special about it. You could use any base: two, three, ten. We just rewrite them all with base $e$, because $e$ makes integrals and differential equations a little easier to work with. You don't have to worry about that here.

**31.** [An aside, the device for every "you might be asking": the stack shrinks into a card of its own colour, moved over to the left, and the stick figure comes in on the right, its readout "but why exponential?".]
> Now, you might still be asking: fine, there's nothing special about $e$. But why do we get exponential behaviour here at all?

(The next parts are still to be written.)

## Open

- The cards in beats 12–14 hold TODO placeholders for the animations that answer them.
- What the box holds once the body starts, the example the rest of the video keeps, is open. For now it is plain stuff.
- The symbol for the constant in the exponent (beat 26 on) is to be chosen.
- The formula stays $e^{-\sigma d}$ throughout. The full form, and how it turns into the version with emission, comes at the very end of the video, as the lead into the next one.
- The quiz's three readings aren't marked on the curve in beat 26. They could be: dots at one, two and three boxes, at 50%, 25% and 12.5%.
