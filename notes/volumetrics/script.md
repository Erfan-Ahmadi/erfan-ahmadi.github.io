# Volumetrics video: script

Each numbered beat is one key press in presentation mode (press <kbd>V</kbd> or the Present button on the test bench; <kbd>→</kbd> next, <kbd>←</kbd> back, <kbd>Space</kbd> pauses every animation, <kbd>R</kbd> replays the beat, <kbd>Esc</kbd> leaves). Animations inside a beat play on their own. Stepping back shows a beat the way it ends.
The working script below has light edits; the original drafts, word for word, are in script-drafts.md.

## Part 1: the hook

**1.** [The cloud in 3D, lit by the sun, the camera still. The laser is already shining through it onto the sensor; no reading is shown.]
> Not long after I started making things with computers, I found out that people could simulate the look of clouds with actual physics. I got very excited about that.

**2.** [A panel opens from a section of the beam inside the cloud: the discrete version. The cloud is particles, wobbling, the rays stop at them, and under them the step plot of how many rays are left: bare axes, no formula, no smooth curve yet.]
> Rendering clouds became one of the biggest goals of my career. It's a big part of why I kept going in computer graphics.

**3.** [The picture shrinks into a card on the left and keeps playing. A stick figure, me, appears on the right with an empty thought cloud.]
> And then, ironically, I put off learning how it actually works. For years. Until very recently.

**4.–6.** [One thought per press writes into the cloud: "clouds… from physics?!", "one day", "later. definitely later." Placeholders: replace them with what you were actually thinking.]
> Maybe it was too important to me.

**7.** [The card goes. The figure shrinks into the bottom-left corner and stays there. The equation writes in, large; the thought cloud becomes "?".]
> But more likely, it was because the first thing I ran into was a formula that looked like this. And it made me feel… not smart.

**8.–11.** [One press per effect: a brace grows from the left under its term and its cell fades into its place in a 2 × 2 grid under the equation, its name in its corner, the photon and the particle playing in it. Every cell shows the paths in a neutral grey with arrows, the beam's line through the particle toward an eye at the right, all on the centre line. Absorption and out-scattering in red, emission and in-scattering in green. Nothing already on screen changes.]
> So this time I tried once more, and it made a little more sense. Each term is a different way light and the medium interact. [absorption] Some take light away. [out-scattering] [emission] Some add light. [in-scattering] Don't worry about which is which yet, we'll come back to all four in a minute.

**12.** [The braces and the grid fade. A box goes around the integral in the exponent, and everything outside it greys out. Under the equation: "why an integral in the exponent?" The question drops into a card that stays.]
> But nobody explained to me why there is an integral inside an exponent…

**13.** [The box moves to the outer integral sign, from 0 to $d$. A second card.]
> …inside another integral.

**14.** [The box moves to the $e$. A third card: "most importantly: why $e$?" The three cards sit in a row under the equation: the video's map.]
> And most importantly: why $e$? Why exponentials at all? And honestly, the answers turned out to be simpler, and more interesting, than I expected.

## Part 2: what this is, and what we keep

**15.** [The equation and the three cards stay. The figure's thought cloud: "?" becomes "!".]
> This video isn't a physics lecture, and it isn't a shader tutorial. It's the part in between. By the end, I want this equation to feel less like something handed to you, and more like something you could have derived yourself. And along the way, we'll run into some surprisingly beautiful physics hiding behind a formula most of us skim over, or just copy and paste into code. So, forget the symbols for a minute.

**16.** [The equation shrinks to the top. Under it, the caption: "light, travelling some distance, through some stuff."]
> In plain words, this equation describes one thing: what happens to light as it travels some distance through some stuff.

**17.–20.** [One press per field: a card with a picture placeholder. Astronomy, climate, medical imaging, then the cloud with the laser, which grows to take the space of the other three.]
> And "stuff" really can be anything. In astronomy, it's the dust between the stars, and the light is starlight on its way to a telescope. In climate science, it's our own atmosphere. In medical imaging, it's your body, and the light is an X-ray. And for me, it's a cloud, and the light is a laser. Different stuff, same equation. Because whatever the stuff is, there are only four things it can do to the light passing through. We saw them a minute ago.

**21.** [The four tiles return under the equation, playing. Absorption's tile brightens; the others dim a little while it is named.]
> Absorption: the photon hits a particle and is swallowed. Its energy doesn't vanish, it becomes a little heat.

**21b.** [Out-scattering.]
> Out-scattering: it bounces off and leaves in some other direction, so it never reaches the eye.

**21c.** [Emission.]
> Emission: the particle gives off light of its own, and some of it heads our way.

**21d.** [In-scattering.]
> In-scattering: light from somewhere else bounces off a particle, right into our line of sight.

**21e.** [Out-scattering, emission and in-scattering grey out and stop. Absorption keeps playing and grows.]
> Two take light away. Two add it. And for the rest of this video I'm going to be slightly dishonest: our stuff doesn't scatter, and it doesn't emit. It only absorbs. The other three I'll come back for in the next videos. So let's see what absorption alone does to our light.

## Part 3: the quiz (the body starts here)

**22.** [The laser, the cloud as a slab, the sensor. The beam goes in at full brightness and comes out dimmer. The sensor settles on 50%.]
> So with absorption alone, here's what happens to our light. It goes in, some of it gets swallowed on the way, and your sensor reads fifty percent. Half made it through.

**23.** [A second, identical slab slides in behind the first. The sensor shows "??%".]
> Now, quick question. I put a second cloud, same as the first, right behind it. What does your sensor read?

**24.** [The sum writes at the top: 100% − 50% − 50% = 0%. The sensor shows 0%.]
> It's tempting to say zero. One cloud takes half the light, so two should take all of it.

**25.** [Every "− 50%" becomes "× ½". The sensor settles on 25%. A third slab: 12.5%.]
> But that's not what happens. It reads 25%. A third: 12.5%. Each cloud halves whatever reaches it. Why half of what's left, and not the same amount again? That question is the whole video.

(Beats 15–25 are narration only so far; their visuals are not built yet.)

## Why this order

Confusion → goal → definition: each block answers the question the one before it raises ("this is confusing" → "I'll fix that" → "fix what, exactly?"). The goal lands about 90 seconds in, after the questions, so it sounds like a response, not an announcement. The four effects appear twice, first as "some made sense", then as "we keep only this one", and are only named the second time. "What this video is not" is one sentence inside the goal, not a section. The quiz is the first beat of the body: by then they know what the equation describes, what the goal is and what's been cut, so a question is a change of gear rather than a pop quiz.

## Open

- The three thoughts in beats 4–6 are placeholders.
- Whether the question captions in beats 12–14 stay as cards (as written), or the spoken question is enough.
- Beats 15–25: visuals to build: the cards that stay, the four field cards with picture placeholders, the three cells greying out, the slabs quiz.
