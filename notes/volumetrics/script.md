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

**15.–15g.** [Seven presses, at "This video isn't a physics lecture", "and it isn't a shader tutorial", "It's the part in between", "By the end of this series", "the physics and the math", "derive it yourself" and "And most importantly". The cards and the equation go, and the equation stays away from here until it has been earned, late in the series. A small physics lecture's chalkboard, scribbles and sketches with nothing readable, fades in, an arrow under it. The arrow walks to the right, drawing a line behind it, and a small raymarcher with its shader code comes in at that end. The arrow walks back to the middle and sways back and forth there from then on. Then the whole spectrum moves into an aside at the top, still swaying; under it, "Goals:" comes in on the left, and the figure walks over to the right. Then one bullet per press: "the physics and math behind the intimidating look"; "derive it yourself", while a copy of the figure, "WTF?!" and all, walks out to the right along a growing arrow, its readout widening and the "WTF?!" reshaping into "I understand it now" on the way, "Now" under the first, "Then" under the copy. As soon as the copy sets off, the first figure, its "WTF?!" and its "Now" fade to grey: the past; "a model, not a law: its assumptions and limits".]
> This video isn't a physics lecture, and it isn't a shader tutorial. It's the part in between. By the end of this series, I want the physics and the math to feel so intuitive that you could derive it yourself. And most importantly, I want you to see that this isn't a law of nature to accept blindly. It's a simplified model of the real world, with its own assumptions and limits. So, forget the symbols for a minute.

**16.** [The aside, the goals and both figures go; the figure isn't needed from here on, and what follows sits in the middle of the stage. No formula: the caption alone writes in, large at the top: "light, travelling some distance, through some stuff."]
> In plain words, all of this is about one thing: what happens to light as it travels some distance through some stuff.

**17.–20.** [One press per field, each a playing card fading in at its own place in a row of three: astronomy (starlight through dust on its way to a telescope), climate science (sunlight through the atmosphere, the bluer light scattering away), medical imaging (X-rays through the stick figure onto a detector). Then this video, at once: a laser, a closed box with plain stuff in it (a haze with specks drifting in it, in the yellow of the caption's "stuff"), and a sensor, the beam dimmer past the box, drawn like the bench's laser and tank. It opens on the left and pushes the other three into a column on the right, where they lose their colour and slow to a stop: the focus has moved. The caption's "light" takes the laser's red.]
>  And "stuff" really can be anything. In astronomy, it's the dust between the stars. In climate science, it's our own atmosphere. In medical imaging, it's your body. And for us, here, it's a box of… stuff.


**20b.–20h.** [One press per thing the box holds, the beam dimming more or less across it: fog; a cloud; smoke, thin streams curling up like a cigarette's and gathering under the lid; a block of tinted glass, catching the light; coffee; beer, with a head of foam; then, at "It doesn't matter yet", plain stuff again. The narration doesn't name the tinted glass or the coffee yet (see Open).]
> Fog, [20c] a cloud, [20d] smoke, [20g] a glass of beer. [20h] It doesn't matter yet. Different stuff, same story. 

(we get rid of the 3 other examples here)

 And for the remainder of this video I'm going be slightly dishonest and assume our "stuff" doesn't scatter light (show the same setup laser hitting those particles in the last "stuff" and scattering in rays and making the volume more reddish) or glow or emit light itself (red glow for each particle, laser light a bit dimmed so the effect of the emission is more visible). I'll come back to emission and scattering in a separate video. for now, our partices only absorb light. 

and here after they absorb the laser light, less of it makes the other end, how much? well that's why have a sensor, here it reads 50%, that means half the light made it through. now let me ask you a question, what if I put a second identical tank right next to this one? (we duplicate the same thing and bring it to the bottom) what would our sensor read now? pause and try to answer it if you want (the sensor reads ? instead of 50%, now you see two setups, above with 1 box and 50, below with 2 and ?)

It's natural to say 0% (sticky figure with 0% readout, the question one goes away), because 1 box took half the light , so two should take all of it away (slide tank to from the right and move laser and sensor outwards for it to fit). but that's not what happens here. our sensor reads 25%. add a third box, it's 12.5%. each box halfs the light entering it. that's exactly what exponential means. multiplication by a fixed fraction.

and this behaviour is described by this formula, you might've heard about the beer-lambert formula. let's see it in action (show the plot, while it's growing from left to write with a dot, the volume under it grows as well)

notice how the more light has to travel through our stuff (a dot and the the box growing and shrinking, ) the less of it makes the other end. and notice how when the stuff becomes more absorbtive it dims light quicker?

this absorbitvity is controlled by [whatever we chose to be in the exponent of e^..*x].  show stationary animamtion increasing and decreasing that value and seeing the stuff change look and the sensor read less

(remember everything on screen should serve a purpose, specially with 2 synced views where viewer can easily get confused)

It's easy to see that when that value is 0, we get a constant 1, that means no light is being absorbed. a.k.a there is no stuff, it's a vaccum. 

For those of you a little bit rusty with calculus and wondering why we have the number e here which is roughly 2 point ..., I'd have to say there is nothing special about it. you can have any base you want, 2^..*x, 3^...*x, .... (shown in a vertical stack) we just rewrite all these different exponential with a base of e (an arrow to the right, all bases change to e). the reason we choose e is that it makes it a little easierworking with integrals and differentual equations but you don't have to worry about them here.

Now you might still be asking. Ok, there is nothing special about e, but why do we have exponential behaviour here?
(aside with sticky figures everytime we play with "you  might be asking")

.... (I'll write the next parts soon)