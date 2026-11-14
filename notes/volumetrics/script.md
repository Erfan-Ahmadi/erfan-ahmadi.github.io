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

**7.** [The card goes. The figure shrinks into the bottom-left corner and stays there; as soon as it starts moving, its readout reshapes into "WTF?!". The equation writes in, large, in about two seconds. The readout won't sit still: its marks pop in one at a time, "?!", "?!!", "?!!?", "?!!?!", bobbing, and start over, until the next press, when it settles back to "WTF?!".]
> Mainly because the first thing I ran into was a formula that looked like this. And that was intimidating, and every resource I found just handed it to me and wanted me to accept it.

**8.** [One press for all four effects: the four braces grow under their terms together, a moment apart; then a copy of each brace leaves the equation, its name with it, and turns into its effect's cell, the brace flattening into the cell's top edge and the name moving into its corner, the four cells making a 2 × 2 grid under the equation, each with its name in its corner, the particle and photons playing in it, back to back, a little over a second apart, the first already most of the way to the particle. Every cell shows the paths in a neutral grey with arrows, the beam's line through the particle toward an eye at the right, all on the centre line. Absorption and out-scattering in red, emission and in-scattering in green. In emission, light leaves the particle every way at once, and only the photon heading for the eye has colour. Nothing already on screen changes.]
> Parts of it made sense: like how each term is a different way light and the stuff interact.

**12.–12b.** [The braces and the grid fade. A yellow box goes around the integral in the exponent, and everything outside it greys out; the part keeps a light yellow tint. Next press: the box leaves the equation and turns into a card that stays, the question writing in as its title on the way, so it's done as the card lands, "why an integral in the exponent?", and most of the card a place for the animation that answers it later (TODO: variable density).]
> But nobody explained to me why there's an integral inside an exponent…

**13.–13b.** [A blue box goes around the outer integral sign, from 0 to $x$; next press, it turns into the second card: "inside another integral?" (TODO: optical depth, an integral inside an integral).]
> …inside another integral.

**14.–14b.** [An orange box goes around the $e$; next press, the first two cards shrink and step aside, one to each side, while the box grows into the third card between them, half as big again: "Why $e$? Why exponentials?" (TODO: the rays, the discrete version on top of the continuous one). The three parts keep their tints, and the three cards sit in a row under the equation, the most important one in the middle: the video's map.]
> And most importantly: why $e$? Why exponentials at all? And the answers turned out to be simpler, and more interesting, than I expected.

## Part 2: what this is, and what we keep

**15.–15g.** [Seven presses, at "This video isn't a shader tutorial", "and it isn't a physics lecture", "It's the part in between", "By the end of this series", "the physics and the math", "derive it yourself" and "And most importantly". The cards and the equation go, and the equation stays away from here until it has been earned, late in the series. A small raymarcher with its shader code fades in at the left end, an arrow under it. The arrow walks to the right, drawing a line behind it, and a small physics lecture's chalkboard, scribbles and sketches with nothing readable, comes in at that end. The arrow walks back to the middle and sways back and forth there from then on. Then the whole spectrum moves into an aside at the top, still swaying, and the equation comes back into the aside, small, between the two ends and over the arrow: what sits in between is about it; under the aside, "Goals:" comes in on the left, and the figure walks over to the right. Then one bullet per press: "the physics and math behind the intimidating look"; "derive it yourself", while a copy of the figure, "WTF?!" and all, walks out to the right along a growing arrow, its readout widening and the "WTF?!" reshaping into "I understand it now" on the way, "Now" under the first, "Then" under the copy. As soon as the copy sets off, the first figure, its "WTF?!" and its "Now" fade to grey: the past; "a model, not a law: its assumptions and limits".]
> This video isn't a shader tutorial, [15b] and it isn't a physics lecture either. [15c] It's the part in between. [15d] By the end of this series, I want [15e] the physics and the math to feel so intuitive that you could [15f] derive it yourself. [15g] And most importantly, I want you to see that this isn't a law of nature to accept blindly. It's a simplified model of the real world, with its own assumptions and limits. So let's forget about the symbols for a minute.

**16.** [The aside, the goals and both figures go; the figure isn't needed from here on, and what follows sits in the middle of the stage. No formula: the caption alone writes in, large at the top: "light, travelling some distance, through some stuff."]
> In plain words, all of this is about one thing: what happens to light as it travels some distance through some stuff.

**17.–20.** [One press per field, each a playing card fading in at its own place in a row of three: astronomy (starlight through dust on its way to a telescope), climate science (sunlight through the atmosphere, the bluer light scattering away), medical imaging (X-rays through the stick figure onto a detector). Each card's light switches on as the card comes in: it leaves its source as a front, drawing its rays as it goes, about half a second across, and what receives it (the telescope, the ground, the detector) lights up as the front gets there. From then on the rays stay, as light does, each dimmer along its length by whatever it has crossed. Light scattered out of a ray shows as a soft glow where it leaves and a few faint rays off to the side: the dust glows faintly blue, the air glows blue (the sky), and the body glows faintly where the X-rays cross it. Since the blue is what gets scattered, the starlight comes out of the dust a little redder and the sunlight reaches the ground a little warmer. Then this video, at once: a laser, a closed box with plain stuff in it (a haze with specks drifting in it, in the yellow of the caption's "stuff"), and a sensor with no reading on it yet (nothing on screen before it is introduced), the beam dimmer past the box, drawn like the bench's laser and tank. It opens on the left and pushes the other three into a column on the right, where they lose their colour and slow to a stop: the focus has moved. The caption's "light" takes the laser's red.]
> And "stuff" really can be anything. In astronomy, it's the dust between the stars. In climate science, it's our own atmosphere. In medical imaging, it's your body. And for us, here, it's a box of… stuff.


**20b.–20h.** [One press per thing the box holds, the beam dimming more or less across it: fog; a cloud; smoke, thin streams curling up like a cigarette's and gathering under the lid; a block of tinted glass, catching the light; coffee; beer, with a head of foam; then, at "It doesn't matter yet", plain stuff again.]
> Fog, [20c] a cloud, [20d] smoke, [20e] tinted glass, [20f] a cup of coffee, [20g] a glass of beer. [20h] It doesn't matter here. Different stuff, same story.

## Part 3: only absorption, and the first formula

**21.–21b.** [The three field cards and the caption go, and the box grows out of its card until the laser, the box of plain stuff and the sensor fill the stage. Next press, the dishonesty, shown on this very box: the few specks right in the beam's path light up where it hits them, and from each, every second or so, a thin red ray of its light leaves in some direction; every speck a ray meets on its way sends it off in a new one, flashing as it's hit, a few bounces, each a little dimmer, until the ray leaves the box; the stuff around the beam glows a faint red: scattering. Over the box, "No Scattering" writes in.]
> And, For the rest of this video I'm going to be slightly dishonest. [21b] I'll assume our stuff doesn't scatter light,

**21c.** [The scattering stops. Each speck glows red on its own, and the beam dims a little so the glow shows: emission. Under "No Scattering", "No Emission" writes in.]
> and that it doesn't glow, or give off any light of its own. I'll get to them in a later video.

**21d.–21e.** [The glow goes: plain stuff again. The two lines turn into one, the letters they share moving over: "Just Absorption" (it goes when the setup is copied, at 23); and the light past the box goes dimmer than it really is: from here on the beam is drawn about as bright as the square of what gets through, with a little left over, so the drop shows to the eye (half the light hardly looks dimmer), while the readouts stay true. Next press, a ring on the beam in the box, and up to the right a lens grows out of it, two lines joining them: in the lens, light hits a particle and is taken in, the particle warming, over and over (beat 8's absorption cell).]
> For now, our particles only absorb light: [21e] whenever light hits one particle, it's is taken in and turned into heat.

**22.–22b.** [The lens and its ring go. The sensor's reading appears for the first time, 50%, already brought forward: everything else dims and the readout is a little bigger. Next press, everything goes back as it was.]
> So they take some of the laser's light, and less of it makes it to the other end. How much less? That's what the sensor is for. Here it reads fifty percent: half the light made it through. [22b]

**23.–23b.** [The whole setup is copied, without its readout, and the copy slides down, slowly, to the bottom half of the stage. Next press, in the copy, a second identical box slides in from the right beside the first, the laser and the sensor moving outward to make room, and the light past the first box gives way to a row of "?" drifting through the second box to the sensor, which goes dark: nothing gives the answer away. Then a readout pops up on the copy's sensor: "?". So: above, one box and 50%; below, two boxes and "?".]
> Now, I've got a question for you. [23b] What if I put a second, identical box right next to this one? What does the sensor read now? if you want you can pause and try to answer it .

**24.–24c.** [An aside, as every aside with the stick figure goes (as in beat 2): both setups shrink into a card of their own colour, moved over to the left, and the figure comes in on the right, its readout "0%". Next press, over its head, the guess worked out, the same amount off for every box: "1 box: 100% − 50% = 50%"; the press after, under it, "2 boxes: 100% − 100% = 0%" (the count in blue; what's taken off, its minus sign and all, in red, the colour of light taken away; the rest in white).]
> For a lot of us It's natural to say zero. [24b] One box took half the light, [24c] so two should take all of it.

**25.–25f.** [At "But that's not what happens", a red cross strikes out the wrong sum. Next press, the figure, its readout and the sum go, and the card grows back to fill the stage. The question marks clear, the light carries on through the second box to the sensor, and the reading reshapes from "?" into 25%; from here the top row has a touch less colour, hardly noticed, so the eye stays on the bottom one, where the question is. Next press, a third box slides in the same way, and as soon as it starts sliding the reading reshapes into 12.5%. Next press, at "multiplying by a fixed fraction", the bottom row fades and comes back as one box, "100%" over a small pointer where the light goes in and, where the box ends, "100% × ½", which turns into "50%": what comes out of it; the reading shows 50%. Next press, the row makes room and a second box drops into its place from just above; the reading halves as it appears, and then at its end "50% × ½" fades in and turns into "25%". Next press, a third the same way: the reading to 12.5%, and "25% × ½" into "12.5%". The amounts are in lavender and the "× ½" in the red of the wrong sum's "− 50%": minus a half has become times a half. (Other ways to animate this, such as one label riding along with the light and halved by each box, are in the bench's Halving tab.)]
> But that's not what happens. [25b] The sensor reads twenty-five percent. [25c] Add a third box: twelve and a half. Each box halves the light that enters it. That's exactly what exponential means: [25d] multiplying by a fixed fraction, [25e] again [25f] and again.

**25g.** [The bottom row starts over and plays the halving through by itself, box after box, a little quicker, with no press: 100% going in, then at each box's end × ½ turning into the next amount.]
> (No narration yet.)

**26.** [One press, all of it back to back. The one-box row goes, and the bottom row's three boxes close up, end to end, keeping their amounts over the joins: 100% where the light goes in, 50%, 25% and 12.5% where each box ended. The formula writes in above them, just $e^{-\sigma x}$, plain, no colours yet: we don't know what its letters stand for (the symbol in the exponent is still to be chosen; the full form with $I_0$ waits for the very end of the video). The three boxes become one long box, three box lengths, a brace in blue under it counting them, "3 boxes", and a plot sketches in between the formula and the box: the light that gets through, 100% at the top, against the distance $x$, in box lengths up to three, its 0 and its 3 exactly over the long box's ends. The curve, in the laser's red, draws from left to right, its dot appearing at the end, over the box's end, a faint dashed line joining the two and another from the dot across to the y-axis; the laser before the box, the sensor after it, reading what the curve says, its readout greyed a little so the eye stays on the curve and the formula. The amounts rise along dashed lines from the box to their places on the curve, each a dot there with its amount beside it: 100% at 0, 50% at one box, 25% at two, 12.5% at three; the brace's "3 boxes" turns into $x = 3.0$, the count becoming a distance, and with it the $x$ in the formula and on the axis takes the blue the boxes were counted in. Then the amounts and their lines go. $\sigma$ takes the specks' yellow at 28b, once it's named. From here to beat 29, whichever of the two is changing is lit in the formula, a thin box around it.]
> This behaviour can be described with an exponential.

**26b.** [Beside the formula, "the Beer–Lambert law" writes in, stays a moment, and goes.]
> You might have already seen this formula as the Beer–Lambert law.

**27.** [The dot runs back and forth along the curve, from three boxes down to almost nothing and back, over and over until the next press, never stopping on its own; the box grows and shrinks with it, and the sensor reads what the curve says. It's $x$ that's changing, so $x$ is the one lit in the formula, a thin box around it, and the brace under the box counts.]
> It's obvious how changing the distance travelled affects the light making it through.

**28.–28c.** [The dot stops, from wherever it was, and settles at 1.4 box lengths: $x = 1.4$, the sensor reading 37.9%. Next press, the constant in the exponent takes the specks' yellow and goes up to twice what it was, and stays there: the stuff looks denser, the curve drops faster, the sensor reads 14.4%; its value is written in the box, among the specks, $\sigma = 1.39$, and stays written there from here on. Next press, it goes down to half the usual: the stuff thins out, the curve flattens, $\sigma = 0.35$, 61.6%. The box stays still for this; only the stuff and the curve change.]
> And notice: [28b] the more absorbing the stuff is, the more it takes from the light, [28c] and the less absorbing the stuff, the less it takes.

Here add a new thing (with focus on sigma): That is controlled by our absorbtion coefficient displayed by the letter sigma. 

**29.** [The constant goes to zero and stays written in the box, now empty: $\sigma = 0$. The curve flattens into a line at 100%, the box empties and the sensor reads 100%; after the formula comes "$= e^0$", then "$= 1$".]
> when this coefficient is zero, we get a constant 1: everything gets through. Nothing is absorbed. There is no stuff: it's a vacuum.

**29b.–30b.** [Everything but $e^{-\sigma x}$ goes: the plot, the box, the laser and the sensor, and "$= e^0 = 1$". The formula comes down to the middle of the stage and a box goes around its $e$, in the orange of the hook's "Why $e$?" box. Next press, it goes, and a vertical stack writes in: $2^{-\sigma x}$, $3^{-\sigma x}$, $10^{-\sigma x}$, ⋮, with $\sigma$ in its yellow and $x$ in its blue. The press after, a copy of each glides to the right and turns into the same thing with base $e$, the change of base a rough number multiplying $\sigma$ (that's $\ln 2$, $\ln 3$, $\ln 10$), and an equals sign writes in between the two as it lands: $2^{-\sigma x} = e^{-0.69\,\sigma x}$, $3^{-\sigma x} = e^{-1.10\,\sigma x}$, $10^{-\sigma x} = e^{-2.30\,\sigma x}$, ⋮, the rows lined up on their equals signs. The $-$, $\sigma$ and $x$ glide across, the base turns into $e$ and the number comes in.]
> If you're a little rusty on calculus and wondering why the number $e$ shows up here, I have to say: there's nothing special about it. [30] You could use any base: two, three, ten. [30b] We just rewrite them all with base $e$, because $e$ makes integrals and differential equations easier to work with. You don't have to worry about that here.

**31.** [An aside, the device for every "you might be asking": the stage shrinks into a card of its own colour, moved over to the left, and in it the stack of bases gives way to the plot again, as at 27: $e^{-\sigma x}$ at the top, the curve with its dot, and the box with the laser and the sensor under it ($\sigma$ back at its usual value). The stick figure comes in on the right, its readout "but why exponential?".]
> Now, you might still be asking: fine, there's nothing special about $e$. But why do we get exponential behaviour here at all?

## Part 4: why exponential

**32.–32d.** [Back from the aside: the figure and the plot go, and the box is on the stage again as at beat 22, laser, box and sensor, reading 50%. Next press, as in the bench's "Zoom into a slab", two fronts sweep in from the ends of the box and meet at the faces of one very thin slice of it, dimming what they pass; then everything but the slice fades away. Next press, we zoom in there, the same in every direction (the slice is as thin as the slab will be wide, over the zoom), until the beam is a sheet of light (no rays) and the slice a slab with dashed faces: the box's specks go, and the slab's particles come into sight, five small ones, each with its shadow behind it. The laser comes back on the left and the sensor on the right, the sheet running between them, the whole picture a little smaller than the stage (it grows back to full size for the thicker slabs at 35), and a small brace goes under the slab, $\Delta x$ in $x$'s blue: a small piece of the distance. Next press, the sensor's readout pops up beside it: 90%.]
> To answer that, we need to look much closer: [32b] at one very thin slice of our box. [32c] A tiny slab. [32d] Most of the light goes straight through: here, ninety percent. The other ten percent hits the particles and is absorbed, and behind each of those particles is a shadow. Those shadows are why the light is dimmer on the other side.

**33.–33b.** [The light goes brighter and dimmer, over and over, until the next press; the readout stays at 90%. Next press, the slab says its piece, in a readout over it like the figure's thoughts: "whatever comes in, I take 10%" (the light keeps changing under it).]
> And notice: it doesn't matter how bright the light is. Turn it up, turn it down: the particles still stop ten percent of it, and ninety percent still gets through. [33b] In other words, this slab is saying: "I don't care where you've been, or how bright you are. I'm taking ten percent."

**34.–34d.** [The light settles and the slab's readout goes. Over the slab, "× 0.9", in the red of the boxes' "× ½". Next press, a second slab comes in beside the first with its own five particles and its own "× 0.9", the slabs staying centred (the laser and the sensor move out once they need the room), and the brace stretches under both: $2\,\Delta x$. The sensor reads 81%. Some of its particles sit partly in the first slab's shadows: the light there is already gone, so the slab takes ten percent of what is left. Next press, a third: $3\,\Delta x$, 72.9%. Next press, the three "× 0.9" come together into $0.9^{3}$ at the top (the count in blue), and slabs come and go, a handful, as many as fit without shrinking them (one to six), the count, the brace ($n\,\Delta x$) and the readout following, until the next press. Each slab's particles are placed at random, never shading each other within a slab, but so that the slab takes exactly ten percent of the light that reaches it; the readout is measured from the picture: the share of the sheet's height in no shadow.]
> So going through this slab is just a multiplication: times ninety percent. [34b] Add another slab: times 0.9 again. [34c] And another: again. [34d] So what reaches the sensor is ninety percent, to the power of however many slabs there are.

**35.** [The formula $0.9^{n}$ turns into $e^{-0.105 \times n\,\Delta x}$, the same thing with base $e$ ($\ln 0.9 \approx -0.105$, in $\sigma$'s yellow; the distance in blue, $n\,\Delta x$, as the brace under the slabs has it, a slab being $\Delta x$, one unit, thick), while the slabs keep coming and going, the count following them.]
> And of course, now we know we can write the same exponential with $e$ as its base.

**36.** [The slabs settle at one and the picture moves up, its slabs now lined up from the left, the formula smaller over it. Under it a plot comes in: what gets through against the distance $x$, its axis lined up with the slabs so that slab $k$ ends right over $x = k\,\Delta x$. The continuous version draws, a white curve, and its label writes in at its end: $e^{-\sigma x}$, in the formula's colours. Then the slabs come in one at a time, up to five, and the discrete version draws with them in the light's red (the formula's curve is white, like the formula): a step for each slab, level across it and dropping at its end, with a dot at each slab's reading, right on the curve. A faint dashed line runs from where the slabs end down to the steps.]
> And, as expected it follows the exponential curve.

**37.** [The formula at the top goes: it doesn't hold here. The light goes off. The particles move: in the first slab they clump up, all five in a little column near the top of the beam, touching; then the same happens in the rest of the slabs.]
> Now, I know some of you still aren't satisfied: what if the particles are placed in a certain way? For example, like this.

**38.** [The same as before: the steps go, the slabs go back to one, the light comes back on, and the slabs come in one at a time up to five, the steps drawing with them. The first slab takes ten percent, but the rest barely take anything, their clumps sitting in the first one's shadows: the steps level off just under 90% and stay there, far from the exponential curve, which stays where it was.]
> Same as before. Here the first slab takes away some light, but the rest of them barely take anything. After a point it stays constant, and it doesn't follow any exponential.

**39.–39d.** [The clumped picture and its plot shrink and move over to the right half of the stage, into a frame, and in a frame on the left the same slabs with their particles placed at random come in, their steps on the curve. Next press, the left one's name writes in over it: "exponential media". Next press, the right one's: "non-exponential media". Next press, the right frame greys out, its name with it.]
> This is exactly what I've been meaning to show you: the placement of the particles matters. [39b] You get exponentials only when your particles are placed randomly. [39c] As soon as you place them with some specific structure, you get what's called a non-exponential medium, [39d] which is a rabbit hole we won't go down here.

**40.** [The greyed frame goes, and the exponential frame grows longer, across the stage: more slabs come in, up to ten, and the brace, the plot's axis, its curve and its steps grow with them. This is where the next part starts.]
> My point is that the formulas where you see exponentials have a hidden assumption behind them: that the particles are placed randomly. And that's the assumption we'll make from here on. It's one we can live with: in computer graphics, and in areas like astronomy, it's still what's used in practice.

## Part 5: when the density changes along the path

**41.–41c.** [The long frame and what is in it make way for a zoomed-out setup with no particles in it, as in the bench's "Optical depth is an area": the laser, the sensor, and between them a cloud, soft shapes of different densities along the laser's light, whiter where it is denser. The light dims as it goes through, most where the cloud is thickest. Next press, a circle on a dense part. Next press, a circle on a thin part.]
> But we're still far from what happens in practice, where the volume changes shape and density across our path. [41b] For example, our cloud might have a higher density here, [41c] but a lower density here.

**42.–42d.** [The circles go, and the cloud turns into the simple case: one band of fog in two sections, a dense one and then a thin one, a dashed line between them. Next press, the picture moves down a little and a plot's axes come in over it: $\sigma$ against the distance $x$, lined up with the volume. Next press, "$\sigma = 0.4$" is written in the first section, and the plot's line draws across it, in $\sigma$'s yellow. Next press, the line drops and goes on across the second section, and "$\sigma = 0.2$" is written there.]
> But let's keep it simple, and assume our volume starts at a high density and then suddenly switches to a low one midway. [42b] Actually, let me plot the absorption coefficient for you: [42c] it starts at 0.4, [42d] and then suddenly switches to 0.2.

**43.–43b.** [The plots lose their colour: the sections are what matters now. The setup shrinks into the left half of the stage, named A, and a copy of it slides into the right half, B; a thin line comes in between the two, and A fades as the copy lands, so the eye is on B. Next press, B's two sections change places, the dense one going over the top, and its plot follows: 0.2, then 0.4.]
> Now, here is a question for you. [43b] I take these two sections and swap them. In which of the two cases does the light come out brighter on the other end?

**44.–45b.** [A comes back, and B fades and loses its colour. A's plot takes its yellow back, and a point walks through A's first section: a dot on the plot, a dot on the beam, a dashed line between them. Next press, it goes on through the second. Next press, the same for B, with A faded: through its first section; next press, its second.]
> In the first one, our light gets absorbed more, and faster, [44b] but then it gets absorbed less. [45] In the second one, our light doesn't get absorbed as much in the first half, [45b] but it gets absorbed more later.

**46.** [Both as they were, and over the frame: "A or B?"]
> Pause here if you want.

**47.** [The question goes, and a readout comes in over each sensor: 30.1%, and 30.1%.]
> OK, that was a trick question: both end up with the same amount of light on the other end, and the sensor reads the same value.

**48.–48d.** [B fades. Directly under A's first section: "$\times\, e^{-0.4\,x}$", the 0.4 in $\sigma$'s yellow and $x$ in its blue. Next press, under its second section: "$\times\, e^{-0.2\,x}$". Next press, the two come together under the middle of the volume and become one: "$\times\, e^{-(0.4+0.2)\,x}$". Next press, the brackets turn into their sum: "$\times\, e^{-0.6\,x}$".]
> Let's walk through the first one. The first section's effect is to multiply by $e^{-0.4x}$. [48b] The second section's effect is to multiply by $e^{-0.2x}$. [48c] And from basic calculus we know the exponents get added, and you end up with $e^{-(0.4+0.2)x}$. [48d]

**49.–49b.** [A fades and B comes back. Under B's sections: "$\times\, e^{-0.2\,x}$" and "$\times\, e^{-0.4\,x}$", which then become one, "$\times\, e^{-(0.2+0.4)\,x}$". Next press, its brackets turn into 0.6 too, and A comes back: both say "$\times\, e^{-0.6\,x}$".]
> If you do the same thing on the other one, [49b] you end up with the same value.

**50.** [Both sums go back into their brackets. Then everything else loses its colour and dims, and on both sides only the addition keeps its colour, in a box of the hook's orange, its plus sign in that orange and a little bigger.]
> What I want you to pay attention to here is the addition.

**51.–51b.** [B goes, and so does what is written under the two; A comes to the middle of the frame, bigger, in its colours again. Next press, its two sections become one smooth hump: the plot's line and the fog change together, and the $\sigma$ labels and the dashed line go. The readout doesn't change.]
> You could apply the same thinking [51b] when your absorption changes continuously.

**52.–52b.** [The synced point climbs the hump, from zero up to its top, on the plot and on the beam. Next press, it comes down the other side, to zero.]
> For example, here the absorption starts to pick up, and gets higher and higher, [52b] and then it begins decreasing smoothly, until it reaches zero.

**53.–53b.** [The point goes. The path is chopped into ten tiny sections: thin lines through the volume, and over each a bar in the plot, as tall as $\sigma$ is there. Next press, under the volume a factor for each is written in, "$\times\, e^{-\sigma_1 \Delta x}$", "$\times\, e^{-\sigma_2 \Delta x}$", "$\cdots$", "$\times\, e^{-\sigma_n \Delta x}$", and from each a dashed line runs to its tiny section: up through the volume to its bar in the plot.]
> Doing the same thing here: we chop it up into tiny sections, [53b] and each one multiplies the light by its own factor.

**54.** [The dashed lines go, and the factors come together into one: "$\times\, e^{-(\sigma_1 \Delta x\,+\,\sigma_2 \Delta x\,+\,\cdots\,+\,\sigma_n \Delta x)}$".]
> And when you multiply all of these, it becomes a summation over all the different absorption coefficients, in tiny distances.

**55.** [The sum turns into an integral, "$\times\, e^{-\int \sigma(x)\,dx}$", the integral in the same yellow as the area, while the tiny sections get thinner and thinner, twice as many at each step, 20, 40, 80, in the plot and in the volume, until the bars are the area under the curve and the lines in the volume are gone.]
> You've probably noticed by now that this is the exact definition of an integral.

**55b.** [A copy of the integral goes up beside the plot and grows: "$\tau = \int \sigma(x)\,dx$", and under it, "optical depth". It stays there to the end of the part.]
> This integral has its own name: it's written $\tau$, and it's called the optical depth.

**56.–56b.** [The volume goes through other shapes, one after another until the next press (a ramp up, two bumps, a ramp down, the hump again): the plot, the fog and the dimming along the beam change together. Each has the same area under it, and the readout never changes. Next press, a box goes around the integral, and another around the readout.]
> Your volume can change density and absorption all it wants, [56b] but as long as the integral remains the same, the sensor on the other end reads the same value.

**57.–57c.** [The boxes go, and the shape settles into a flat line: the volume is the same all the way through. Next press, the integral turns into "$\times\, e^{-\sigma x}$". Next press, the area under the flat line, a rectangle $\sigma$ high and $x$ long, brightens.]
> As a sanity check, look how it's consistent when our volume is uniform all across. [57b] It's the same formula we had before, sigma times $x$: [57c] that's the area under the curve.

## Part 6: the ending

**58.** [Everything goes. Two of the hook's question cards come back, in their colours, one above the other on the left. First the top one, "Why $e$? Why exponentials?": an arrow grows from it to the right, to its answer, "particles placed at random", and under the answer part 4's picture comes back, the slabs with their particles placed at random coming in one by one up to ten, the brace and the steps on the exponential curve following them, then going back down to one, over and over.]
> By now I hope you've understood that the reason exponentials show up is our assumption that the particles are placed at random,

**58b.** [The bottom card, "why an integral in the exponent?", its arrow, its answer, "$\sigma$ changes along the ray", and under it part 5's volume, its $\sigma$ going through one shape after another, the area under it, and the reading, staying the same; to its right, $e^{-\int \sigma(x)\,dx}$, the integral in the area's yellow. Both animations keep playing until the video ends.]
> and that the reason you see integrals in the exponent is that the absorption coefficient changes along a ray. See you in the next video, where we'll cover emission and scattering, and the nuances we've skipped in this one.

## Open

- The cards in beats 12–14 hold TODO placeholders for the animations that answer them.
- What the box holds once the body starts, the example the rest of the video keeps, is open. For now it is plain stuff.
- The symbol for the constant in the exponent (beat 26 on) is to be chosen.
- The formula stays $e^{-\sigma x}$ throughout. The full form, and how it turns into the version with emission, comes at the very end of the video, as the lead into the next one.
- The quiz's three readings aren't marked on the curve in beat 26. They could be: dots at one, two and three boxes, at 50%, 25% and 12.5%.
- The distance is $x$ everywhere now, but the hook's formula (beats 7–14) still writes the path's length as $d$, in $\int_0^{d}$. Should it change too?
- 55b's narration is mine; the draft only asks for $\tau$ and "optical depth" on screen. So are the ending's on-screen answers, "particles placed at random" and "$\sigma$ changes along the ray".
- The hook's third card, "inside another integral?", doesn't come back at the end: this video doesn't answer it.
- The integral at beat 55 is written without limits, $\int \sigma(x)\,dx$, so that $x$ can stay the distance and the uniform case reads $\sigma x$.
- In part 5 each section is drawn two long, so the readouts say 30.1%, which is $e^{-0.6 \times 2}$. With sections one long they would say 54.9%, and the dimming along the beam would be hard to see.
- 48c's narration says "from basic calculus"; adding the exponents of multiplied powers is algebra. The draft's exponents had no minus signs; the animation and the script have them.
- 26–29 follow Erfan's second draft for them (in script-drafts.md), lightly edited: "its name" for "it's name", "changing the distance travelled affects" for "the changing the distance travelled effect".
