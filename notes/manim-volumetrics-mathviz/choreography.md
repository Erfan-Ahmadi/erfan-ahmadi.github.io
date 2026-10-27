# Intro choreography so far

What happens on screen during the intro, in order. The images in `stills/` and `items/` show what each piece looks like. This is what was built in Manim; it isn't fixed.

## The bar

Two stick figures, "me" on the left and "you" on the right, sketch themselves in at a bar. A fish tank full of beer appears on the counter between them.
→ `stills/01_bar_setup`, `items/bar`, `items/stick_figure`, `items/beer_tank`

**"A lot of fun…"**: a straw reaches from the tank to each figure, and they lean in and drink. **"…just not the kind you'd expect"**: the straws turn red and fade, and the figures hop back.
→ `stills/02_straw_gag`, `items/two_figures_drinking_through_straws`

## The laser and the sensor

The person on the left raises a laser and shines it through the tank. The person on the right holds out a sensor and catches the beam. The beam dims as it passes through the beer.
→ `items/laser_device`, `items/laser_with_beam`

A readout pops up above the sensor: 50%.
→ `stills/03_laser_sensor_reads_50`, `items/sensor_with_readout`, `items/setup_without_bar`

While the narration explains what that means, the readout's probe travels along the beam inside the tank, counting down from 100% to 50%, to show the light being taken out bit by bit.
→ `stills/04_readout_measures_along_tank`

## The question

The figures move apart and a second, identical tank appears next to the first. The beam stops inside the second tank and the readout turns into "??%".
→ `stills/05_second_tank_question`

**The tempting answer:** the sensor shows 0%, and a little sum is written at the top: 1 tank: 100% − 50% = 50%. It copies itself down into the line for two tanks: 100% − 50% − 50% = 0%.
→ `stills/06_tempting_zero`, `items/wrong_sums_minus_50`

**What really happens:** every "− 50%" becomes "× ½", the beam reaches the sensor again, and the reading becomes 25%. A third tank joins (12.5%) with a third line under the others, and then the extra tanks leave again.
→ `stills/07_actually_25`, `stills/08_three_tanks_12_5`, `items/halving_sums`

## The equation

It zooms in on the tank: the bar and the figures fall away, and the laser, the tank and the sensor are left, large. The halving sum morphs into the full radiative transfer equation. A brace grows under it and "Radiative Transfer Equation" is written beneath, then turns into a one-line caption: what happens to radiation along a ray as it travels *a certain distance* through *a volume of stuff*.
→ `stills/09_closeup_equation`, `items/rte_equation`, `items/rte_with_caption`, `items/closeup_laser_tank_sensor`

## Where it turns up

The close-up clears away and the equation stays at the top. Cards fade in one by one: astronomy, climate science, medical imaging. Each new card dims the one before it. Then the three shrink into a column on the left, and a big "computer graphics" card takes the space beside them.
→ `stills/10_usages_three_cards`, `stills/11_usages_graphics_big`, `items/usage_card_placeholder`

## My first encounter

The small cards go. A stick figure appears with a "WTF?" thought cloud: me, the first time I saw the equation.
→ `stills/12_first_encounter_wtf`, `items/confused_figure_thought_cloud`

**"…something you could have derived yourself"**: a copy of the figure moves to the right with an arrow growing behind it, and its thought becomes "I understand it now".
→ `stills/13_derived_yourself`

## The pieces and the questions

The confused figure shrinks into a corner, where it stays. Braces grow under the equation's terms: red for the ones that take light away (absorption, out-scattering), then green for the ones that add it (emission, in-scattering).
→ `stills/14_rte_effect_braces`, `items/rte_with_effect_braces`

The braces grey out. A yellow box goes round each part of the equation in question (the e, the integral in the exponent, the outer integral), and a card with each question fades in. For the last and biggest question, "Why does light behave exponentially here?", the three cards shrink into a row at the bottom and a big card takes the centre.
→ `stills/15_three_questions`, `stills/16_fourth_question`, `items/question_card_placeholder`

That's where the animated part ends. Everything after it is only in the transcript, the plan and the storyboards.
