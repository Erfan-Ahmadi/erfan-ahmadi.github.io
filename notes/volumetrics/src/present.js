// ---------- presentation mode: the video, one key press per beat ----------
// V (or the Present button) hides the controls and plays the script's beats on the stage: → or Enter for the next
// beat, ← for the one before, Space pauses every animation, R replays the beat, Home and End jump, Esc leaves.
// Going to a beat rebuilds the ones before it instantly, so stepping back shows a beat the way it ends. Each beat
// has its number from script.md (#present-15b opens that one). The state of a presentation lives in PS; the scenes it
// borrows (the cloud) keep their own.
const PRES = { on: false, paused: false, beat: 0, toast: -99, epoch: 0, gen: 0, saved: null };   // gen: bumped on every rebuild
// The cloud as the hook shows it: a thin cloud the beam gets a quarter of the way through, no reading, the camera
// low behind the laser. It drifts to the right the whole time (PRES_DRIFT rad/s; negative drifts the other way).
const PRES_CLOUD = { readout: 0, dens: 0.04, sigA: 20, sigS: 10, beamY: 0, beamZ: -0.005, aim: 0, aimUp: 0, yaw: -1.2, pitch: 0.22, dist: 3.8, zoom: 0, eye: 0 };
const PRES_DRIFT = 0.03;
// The four effects' cells under the equation, in the order of the terms: absorption, out-scattering, emission, in-scattering.
const PCELLS = [[370, 370, 590, 278], [990, 370, 590, 278], [370, 680, 590, 278], [990, 680, 590, 278]];   // clear of the bottom, where a video player puts its controls and captions
const PFX = [['t-pabs', 'absorption', COL.red], ['t-pout', 'out-scattering', COL.red], ['t-pem', 'emission', COL.green], ['t-pin', 'in-scattering', COL.green]];
// their cells play photons back to back (the bench's "Timing" setting can make it one at a time again)
const fxP = () => (SI.stream === 'one' ? SI.loopT : IA_STREAM_P);
const fxAge = (t0) => (reduced ? -1 : Math.max(0, TIME - t0 + (SI.stream === 'one' ? fxP() * 64 : 0)));
// The three questions. Each one's highlight leaves the equation and becomes its own card, which keeps a place for the
// animation that answers it later in the video. They are TODO for now: give a card draw(ctx, rect, alpha) to fill it.
const QCARDS = [
  { term: 't-qexp', col: COL.yellow, name: 'why an integral in the exponent?', title: [String.raw`\text{why an integral}`, String.raw`\text{in the exponent?}`], todo: ['variable density'] },
  { term: 't-qouter', col: COL.blue, name: 'inside another integral?', title: [String.raw`\text{inside another integral?}`], todo: ['optical depth:', 'an integral inside an integral'] },
  { term: 't-qe', col: COL.gold, name: 'why e? why exponentials?', title: [String.raw`\text{Why }e\text{?}`, String.raw`\text{Why exponentials?}`], todo: ['the rays: the discrete version', 'on top of the continuous one'] },
];
// The first two cards come in side by side; at 14b they shrink and step aside, and "Why e?", the one that matters most,
// comes in between them, half as big again.
const QCRECT = [[380, 430, 480, 520], [890, 430, 480, 520]], QFINAL = [[380, 480, 400, 395], [1480, 480, 400, 395], [830, 380, 600, 570]];   // all ending by 950, clear of a player's controls
const qRect = (i, st) => (i < 2 ? lerpRect(QCRECT[i], QFINAL[i], smooth(clamp(st.qSide, 0, 1))) : QFINAL[i]);
// Beat 15: the spectrum from a physics lecture to a shader tutorial, and the arrow that walks along it. For the goals
// it shrinks into an aside (card); outside it, me now and me later along the bottom, and the goals on the right as
// bullet points (their wording is a placeholder). src is the part of the stage the aside shows.
const SPEC = { L: [302, 330, 235, 188], R: [1383, 330, 235, 188], y: 560, src: [270, 270, 1380, 400], card: [380, 50, 1160, 400] };
const GOALXY = [130, 560];   // the goals, under the aside on the left
const GOALS = ['the physics and math behind the intimidating look', 'derive it yourself', 'a model, not a law: its assumptions and limits'];
// me now and me later, side by side in the middle along the bottom while the goals are up
// (feet at 960 keeps them and their labels clear of the bottom of a YouTube frame)
const MIDFIG = 870, FUT = { x: 1460, y: 925 };   // me now sits one arm span clear of the goals' text
// Beat 16's caption, and beats 17–20: the fields that use the same equation, each a card with its picture, in a row of
// three, each fading in at its own place. The last, this video's laser and box of stuff, opens on the left and pushes
// the other three into a column on the right, where they grey out and stop. (A card with draw: null shows the 3D cloud
// instead.)
const PCAP = String.raw`\htmlClass{t-clight}{\text{light}}\text{, travelling some distance, through some }\htmlClass{t-cstuff}{\textcolor{${COL.yellow}}{\text{stuff}}}\text{.}`;
const USES = [
  { name: 'astronomy', label: 'astronomy', draw: drawUseStars },
  { name: 'climate science', label: 'climate science', draw: drawUseSky },
  { name: 'medical imaging', label: 'medical imaging', draw: drawUseXray },
  { name: 'a box of stuff', label: 'this video', draw: drawUseBox },
];
const UROW = { x: 960, y: 430, w: 470, h: 300, gap: 45 };   // centred on the stage (the figure has gone by now)
const rowX = (i, n) => UROW.x - (n * UROW.w + (n - 1) * UROW.gap) / 2 + i * (UROW.w + UROW.gap);
const UCOL = [[1330, 290, 380, 204], [1330, 518, 380, 204], [1330, 746, 380, 204]], UBIG = [210, 290, 1090, 660];   // ending at 950, clear of a player's controls
// Beat 20's push: the three first spread up and down into their places in the column (shrinking), then everything
// moves across, this video's card opening behind them so it never runs into them.
const pushXY = (g) => [smooth(clamp((g - 0.2) / 0.8, 0, 1)), smooth(clamp(g / 0.6, 0, 1))];
function useRect(i, st) {
  const [gx, gy] = pushXY(clamp(st.grow, 0, 1));
  if (i === 3) return [UBIG[0], lerp(UROW.y, UBIG[1], gy), UBIG[2] * gx, lerp(UROW.h, UBIG[3], gy)];
  const C = UCOL[i]; return [lerp(st.useX[i], C[0], gx), lerp(UROW.y, C[1], gy), lerp(UROW.w, C[2], gy), lerp(UROW.h, C[3], gy)];
}
const PS_DEFAULTS = () => ({
  orbit: 1, mag: 0, aside: 0, fig: 0, think: '', thinkFrom: '', thinkM: 1, writeP: 1, eq: 0, eqP: 0, corner: 0, braces: [], hi: {}, dim: 0,
  cells: [0, 0, 0, 0], cellT: [0, 0, 0, 0], grid: 1,
  qc: QCARDS.map(() => ({ box: 0, m: 0, title: 0, todo: 0 })), qcA: 1, qSide: 0,
  eqA: 1, eqTop: 0, spec: [0, 0], chalk: 0, code: 0, specT: 0, ptrX: 0, ptrA: 0, lineP: 0, wig: 0, wigT: 0, side: 0,
  goalsA: 0, figMid: 0, fut: 0, futW: 0, goals: [0, 0, 0], p15: 1, cap: 0,
  uses: [0, 0, 0, 0], useX: [0, 0, 0], useT: 0, grow: 0, usesOut: 0, capOut: 0, boxQ: 0, lines: 0,
  fx: { show: [0, 0, 0, 0], clock: [0, 0, 0, 0], run: [0, 0, 0, 0], dim: [0, 0, 0, 0], grey: [0, 0, 0, 0], big: 0 },
  // part 3, the lab (lab.js): the box on the stage, its scattering and glow, the readings, the second row and its
  // boxes, me guessing; then the formula and its plot; then the bases
  labOn: 0, labX: 0, scat: 0, glow: 0, read1: 0, read2: 0, split: 0, c2: 1, myst: 0, rev: 1, r2: '?', r2From: '', r2M: 1, lfig: 0, lthink: '', lthinkP: 1, lside: 0, wrong: 0, cross: 0, rowFade: 0,
  rowsOut: 0, fml: 0, axC: 0, dotD: 0, curveTo: 0, sig: 1, sigHi: 0, eq1: 0, plotOut: 0, bStack: 0, bMorph: 0, ind1: 1, ind8: 1, ind10: 1, readDim: 1, sAct: 0, dAct: 0, mv9: 0, dLoop: 0, dLoopT0: 0, sLoop: 0, sLoopT0: 0, hvOn: 0, hvA: 0, hvStep: 0, hvT0: 0, topDim: 0, topOut: 0, merge: 0, pbox: 0, rise: 0, marksOut: 0, dCont: 0, r1Hi: 0, colS: 0, colD: 0,
});
const PS = PS_DEFAULTS();
// The equation, with its terms named: the four effects for the braces, and the parts the questions point at.
const PRTE = String.raw`L(p,\omega) = \htmlClass{t-qouter}{\int_0^{d}} \htmlClass{t-qe}{e}^{\htmlClass{t-qexp}{\htmlClass{t-pabs}{-\int_0^{t}\sigma_a(p_s)\,ds}\htmlClass{t-pout}{-\int_0^{t}\sigma_s(p_s)\,ds}}}\left[\htmlClass{t-pem}{\sigma_a(p_t)\,L_e(p_t,\omega)} + \htmlClass{t-pin}{\sigma_s(p_t)\int_{4\pi} f_p(\omega,\omega')\,L(p_t,\omega')\,d\omega'}\right]dt`;
Object.assign(TERM_COL, { 't-pabs': hexRgb(COL.red), 't-pout': hexRgb(COL.red), 't-pem': hexRgb(COL.green), 't-pin': hexRgb(COL.green), 't-qe': WHITE_RGB, 't-qexp': WHITE_RGB, 't-qouter': WHITE_RGB });
// the questions' parts keep a light tint of their card's colour
for (const q of QCARDS) TERM_COL[q.term] = mixRgb(WHITE_RGB, hexRgb(q.col), 0.5);
const PEQ = { x: 960, y: 300, size: 76, fit: 1760 };
// Where the equation sits: big under the hook, small at the top from beat 16 on (it is away during beat 15).
// It is away during beat 15 and comes back small at the top in beat 16.
const EQPOSE = { home: [960, 190, 1], top: [960, 118, 0.6] };
const eqXf = (st) => { const b = smooth(clamp(st.eqTop, 0, 1)); return [0, 1, 2].map((j) => lerp(EQPOSE.home[j], EQPOSE.top[j], b)); };
let peqSprites = null;
const peq = () => peqSprites || (peqSprites = place(tex(PRTE), { ...PEQ, size: Math.min(PEQ.size, PEQ.fit / Math.max(tex(PRTE).w, 0.01)) }));
const ptw = (key, to, dur, o = {}) => tween(PS, key, to, dur, { tag: 'pres', ...o });
const ptwi = (obj, key, to, dur, o = {}) => tween(obj, key, to, dur, { tag: 'pres', ...o });
// The beats: their number in script.md, a name, and what happens when one is reached. Each returns when its
// animation is done.
const BEATS = [
  // the cloud and, already open, the panel on the section of the beam
  { n: '1', name: 'the cloud', run: () => { Object.assign(PS, PS_DEFAULTS()); PS.mag = 1; SK.zoom = 0; SK.eye = 0; SK.laser = 1; untween(SK, 'front'); SK.front = 1; } },
  { n: '2', name: 'aside: me', run: async () => {
    PS.think = THOUGHTS[0]; PS.thinkFrom = ''; PS.thinkM = 1; PS.writeP = 0;
    ptw('fig', 1, 1.2, { delay: 0.9 }); ptw('writeP', 1, 1.1, { ease: linear, delay: 1.7 });
    await ptw('aside', 1, 1.6);
  } },
  { n: '3', name: 'my goal now', run: () => presThink(THOUGHTS[1], 1.2) },
  { n: '7', name: 'the equation', run: async () => {
    PS.eq = 1; PS.eqP = 0;
    ptw('corner', 1, 1.4); ptw('aside', 2, 1.4);
    presThink(THOUGHTS[2], 0.9);   // as soon as the formula starts coming in
    await ptw('eqP', 1, 2, { ease: linear, delay: 0.5 });
  } },
  // all four effects in one press: the braces and the cells come in together, a little apart
  { n: '8', name: 'the four effects', run: () => Promise.all(PFX.map(([term, label, color], i) => {
    PS.cellT[i] = TIME + 0.4; return Promise.all([presBrace(term, label, color, 0.15 * i), ptwi(PS.cells, i, 1, 1.1, { delay: 0.15 * i })]);
  })) },
  ...QCARDS.flatMap((q, i) => [{ n: String(12 + i), name: q.name, run: () => presQuestion(i) }, { n: `${12 + i}b`, name: 'into its card', run: () => presToCard(i) }]),
  { n: '15', name: 'not a shader tutorial', run: presSpecShader },
  { n: '15b', name: 'not a physics lecture', run: presSpecLecture },
  { n: '15c', name: 'the part in between', run: presSpecMiddle },
  { n: '15d', name: 'by the end', run: presAside },
  { n: '15e', name: 'the physics and the math', run: () => presGoal(0) },
  { n: '15f', name: 'derive it yourself', run: () => presGoal(1) },
  { n: '15g', name: 'most importantly', run: () => presGoal(2) },
  { n: '16', name: 'some stuff', run: presDefine },
  ...USES.map((u, i) => ({ n: String(17 + i), name: u.name, run: () => presUse(i) })),
  // 20b–20h: one press per thing the box can hold, then back to plain stuff
  ...['fog', 'a cloud', 'smoke', 'tinted glass', 'coffee', 'a glass of beer', "it doesn't matter yet"].map((name, k) => ({ n: `20${'bcdefgh'[k]}`, name, run: () => ptw('boxQ', k + 1, 0.5) })),
  // part 3 (lab.js): what we leave out, shown on the box; the sensor; the two-box question; the formula and its plot
  { n: '21', name: 'the box', run: () => labZoom() },
  { n: '21b', name: "doesn't scatter", run: () => labScatter() },
  { n: '21c', name: "doesn't glow", run: () => labGlow() },
  { n: '21d', name: 'only absorbs', run: () => labAbsorb() },
  { n: '22', name: 'the sensor', run: () => labRead() },
  { n: '22b', name: 'the reading, back to normal', run: () => labReadDone() },
  { n: '23', name: 'the copy', run: () => labCopy() },
  { n: '23b', name: 'a second box', run: () => labSecond() },
  { n: '24', name: 'zero?', run: () => labGuess() },
  { n: '24b', name: 'how I got zero', run: () => labWrong() },
  { n: '25', name: "that's not what happens", run: () => labCross() },
  { n: '25b', name: 'twenty-five', run: () => labReveal() },
  { n: '25c', name: 'a third box', run: () => labThird() },
  { n: '25d', name: 'a fixed fraction, again and again', run: () => labHalve() },
  { n: '25e', name: 'again: a second box', run: () => labHalveStep(2) },
  { n: '25f', name: 'and again: a third', run: () => labHalveStep(3) },
  { n: '26', name: 'the formula', run: () => labFormula() },
  { n: '26b', name: 'the plot', run: () => labPlot() },
  { n: '26c', name: 'the boxes on the curve', run: () => labMarks() },
  { n: '27', name: 'distance', run: () => labDistance() },
  { n: '28', name: 'more or less absorbing', run: () => labSigma() },
  { n: '29', name: 'a vacuum', run: () => labVacuum() },
  { n: '30', name: 'any base', run: () => labBases() },
  { n: '31', name: 'but why exponential?', run: () => labWhy() },
];
// A beat by its number in the script; a number between two beats opens the next one.
function presIndex(label) {
  const i = BEATS.findIndex((b) => b.n === String(label).toLowerCase()); if (i >= 0) return i;
  const v = parseFloat(label), j = BEATS.findIndex((b) => parseFloat(b.n) >= v);
  return !Number.isFinite(v) ? 0 : j >= 0 ? j : BEATS.length - 1;
}
// A brace under a term of the equation, in the equation scene's style.
function presBrace(term, label, color, delay = 0) {
  const ss = peq().filter((s) => s.a.terms.includes(term)); if (!ss.length) return Promise.resolve();
  let x0 = Infinity, x1 = -Infinity, yb = -Infinity;
  for (const s of ss) { const [l, r, , b] = inkBox(s); x0 = Math.min(x0, l); x1 = Math.max(x1, r); yb = Math.max(yb, b); }
  const size = peq()[0].size, fpx = 1.21 * size, lsize = size * 0.6, LT = tex(String.raw`\text{${label}}`), cx = (x0 + x1) / 2, lw = LT.w * lsize, lh = LT.h * lsize;
  const b = { term, x0, x1, top: yb + fpx * 0.12, h: fpx * 0.3, th: Math.max(3, fpx * 0.055), color: hexRgb(color), g: 0, l: 0, a: 1 };
  let ly = b.top + b.h + fpx * 0.1 + lh / 2;
  for (let guard = 0; guard < 6 && PS.braces.some((o) => Math.abs(o.ly - ly) < lh * 0.9 && !(cx + lw / 2 + 24 < o.lx0 || cx - lw / 2 - 24 > o.lx1)); guard++) ly += lh * 1.05;
  Object.assign(b, { ly, lx0: cx - lw / 2, lx1: cx + lw / 2, lab: place(LT, { x: cx, y: ly, size: lsize }) });
  PS.braces.push(b);
  ptwi(PS.hi, term, 1, 0.5, { delay });
  return Promise.all([ptwi(b, 'g', 1, 0.75, { delay }), ptwi(b, 'l', 1, 0.5, { delay: 0.4 + delay })]);
}
// A question: the braces and the cells go, the named part keeps its colour and gets a box while the rest greys out;
// then the box, with a copy of the part, moves down into the question's card, where the question is written.
async function presQuestion(i) {
  const term = QCARDS[i].term, c = PS.qc[i];
  for (const k of Object.keys(PS.hi)) if (k.startsWith('t-p')) ptwi(PS.hi, k, 0, 0.5);   // the effects' colours go; earlier questions keep their tint
  for (const b of PS.braces) ptwi(b, 'a', 0, 0.5);
  ptw('grid', 0, 0.5);
  ptwi(PS.hi, term, 1, 0.6); ptw('dim', 1, 0.7);
  await ptwi(c, 'box', 1, 0.6);
}
// The next press: the box leaves the equation and becomes the question's card, its title written on top and most of
// it the place for the animation that answers it.
async function presToCard(i) {
  const c = PS.qc[i];
  if (i === 2) ptw('qSide', 1, 1.3);
  await ptwi(c, 'm', 1, 1.3);
  ptwi(c, 'todo', 1, 0.7, { delay: 0.3 });
  await ptwi(c, 'title', 1, 0.9, { ease: linear });
}
// Beat 15: the cards and the equation go; the shader tutorial comes in at the left end, its code typing, the arrow
// under it. 15b: the arrow walks to the other end, drawing the line behind it, and the physics lecture comes in. 15c: it
// walks back to the middle and sways back and forth there from then on, in the aside too.
async function presSpecShader() {
  ptw('qcA', 0, 0.6); ptw('dim', 0, 0.6); ptw('eqA', 0, 0.6);
  for (const k of Object.keys(PS.hi)) ptwi(PS.hi, k, 0, 0.6);
  PS.ptrX = SPEC.L[0] + SPEC.L[2] / 2; PS.specT = TIME + 1.3;
  ptwi(PS.spec, 0, 1, 0.8, { delay: 0.5 }); ptw('ptrA', 1, 0.6, { delay: 1 });
  await ptw('code', 1, 1.1, { ease: linear, delay: 0.9 });
}
async function presSpecLecture() {
  ptw('ptrX', SPEC.R[0] + SPEC.R[2] / 2, 1.6); ptw('lineP', 1, 1.6);
  await ptwi(PS.spec, 1, 1, 0.8, { delay: 1.1 });
}
async function presSpecMiddle() {
  await ptw('ptrX', 960, 1.3);
  PS.wigT = TIME; await ptw('wig', 1, 0.6);
}
// Beat 15d: all of it moves into an aside at the top, the arrow still swaying there for the rest of the section (the
// equation stays away: this part is about the goals, not the formula); under it "Goals:" comes in on the left, and I
// walk over to the right. 15e: the first goal. 15f: the second, while a copy of me walks out along a growing arrow,
// its "WTF?!" turning into "I understand it now" on the way. 15g: the third.
async function presAside() {
  ptw('side', 1, 1.5); ptw('figMid', 1, 1.4);
  await ptw('goalsA', 1, 0.8, { delay: 0.9 });
}
async function presGoal(i) {
  if (i === 1) { ptw('fut', 1, 2.2); ptw('futW', 1, 1.7, { ease: linear, delay: 0.35 }); }
  await ptwi(PS.goals, i, 1, 1.2, { ease: linear });
}
// The figure's thought reshapes into the next one, after delay.
function presThink(text, dur, delay = 0) {
  PS.thinkFrom = PS.think; PS.think = text; PS.thinkM = 0;
  return ptw('thinkM', 1, dur, { delay, ease: linear });
}
// Beat 16: the aside, the goals and both of me go, and the caption writes in, large at the top. No formula from here on:
// this part is about the physics, and the formula comes back only once it has been earned.
async function presDefine() {
  ptw('p15', 0, 0.6); ptw('fig', 0, 0.8);   // the goals and I go: from here on it is about the physics
  await ptw('cap', 1, 1.5, { ease: linear, delay: 0.5 });
}
// Beats 17–19: a card fades in at its place in the row. 20: this video's card opens on the left at once and pushes
// the other three into the column.
function presUse(i) {
  if (i === 3) { ptwi(PS.uses, 3, 1, 0.5); ptw('lines', 1, 0.8, { delay: 0.6 }); return ptw('grow', 1, 1.6); }
  if (i === 0) PS.useT = TIME;
  PS.useX[i] = rowX(i, 3);
  return ptwi(PS.uses, i, 1, 0.9);
}
// 21–21d: one effect per press. The first press also clears the cards and the caption. Each tile fades in playing, on
// its own clock, while the one before it pauses where it is and goes a little out of focus: less colour, dimmer.
// (Its term also takes its colour, for when the equation returns.)
const FX_STILL = 6.5;   // a tile paused before it has played (a step back) shows this moment, photons on their way
async function presFxName(i) {
  const F = PS.fx;
  if (i === 0) { ptw('usesOut', 1, 0.8); ptw('capOut', 1, 0.6); }
  for (let j = 0; j < i; j++) { F.clock[j] = Math.max(F.clock[j], FX_STILL); ptwi(F.run, j, 0, 0.35); ptwi(F.dim, j, 1, 0.6); }
  F.clock[i] = i === 0 ? -0.6 : 0; F.run[i] = 1; F.dim[i] = 0;
  ptwi(PS.hi, PFX[i][0], 1, 0.6);
  await ptwi(F.show, i, 1, 1.1, { delay: i === 0 ? 0.6 : 0 });
}
// 21e: all four in focus again, all playing.
function presFxAll() {
  const F = PS.fx; return Promise.all([0, 1, 2, 3].map((j) => Promise.all([ptwi(F.run, j, 1, 0.4), ptwi(F.dim, j, 0, 0.6)])));
}
// 21f: our stuff doesn't scatter: out- and in-scattering grey out and stop; 21g: nor does it emit.
function presFxGrey(list) { return Promise.all(list.map((j) => ptwi(PS.fx.grey, j, 1, 0.9))); }
// 21h: it only absorbs: absorption, still playing, grows over the other three.
function presFxOnly() { return ptwi(PS.fx, 'big', 1, 1.6); }
async function presGo(k, play) {
  k = clamp(k, 0, BEATS.length - 1);
  const e = ++PRES.epoch; PRES.toast = TIME;
  if (play && k === PRES.beat + 1 && PRES.beat >= 0) { PRES.beat = k; Promise.resolve(BEATS[k].run()).catch((err) => { if (e === PRES.epoch) console.error(err); }); return; }
  stopTweens('pres'); PRES.beat = k; PRES.gen++;
  Object.assign(PS, PS_DEFAULTS());
  instant++;
  try { for (let i = 0; i < (play ? k : k + 1); i++) await BEATS[i].run(); } catch (err) { console.error(err); } finally { instant--; }
  if (e !== PRES.epoch) return;
  if (play) Promise.resolve(BEATS[k].run()).catch((err) => { if (e === PRES.epoch) console.error(err); });
}
function setPresent(on, beat = 0) {
  PRES.on = on; PRES.paused = false;
  document.body.classList.toggle('presenting', on);
  setClean(on);
  if (on) {
    PRES.saved = {}; for (const k of Object.keys(PRES_CLOUD)) PRES.saved[k] = SK[k];
    Object.assign(SK, PRES_CLOUD);
    if (SK.quality !== 'high') { PRES.saved.quality = SK.quality; SK.quality = 'high'; }   // the camera moves, so the frames can't average: render finer instead
    try { document.fonts.load('500 18px "JetBrains Mono"'); } catch (e) { /* the code falls back to any monospace */ }
    PRES.beat = -1; presGo(beat, true);
  } else { stopTweens('pres'); if (PRES.saved) { Object.assign(SK, PRES.saved); PRES.saved = null; } }
}
function presKey(e) {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const k = e.key;
  if (k === ' ') PRES.paused = !PRES.paused;
  else if (['ArrowRight', 'ArrowDown', 'PageDown', 'Enter'].includes(k)) { if (PRES.beat < BEATS.length - 1) presGo(PRES.beat + 1, true); }
  else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(k)) presGo(PRES.beat - 1, false);
  else if (k === 'Home') presGo(0, false);
  else if (k === 'End') presGo(BEATS.length - 1, false);
  else if (k === 'r' || k === 'R') presGo(PRES.beat, true);
  else if (k === 'f' || k === 'F') toggleFull();
  else if (k === 'Escape') setPresent(false);
  else return;
  e.preventDefault();
}
// ---- drawing ----
// The stick figure: Erfan's own drawing (six pencil strokes, traced from his SVG, in its 346 × 848 box), drawn
// with round white strokes. (x, y) is where its feet stand; s scales it (1 is 230 px tall).
const FIGURE = [[[86,241],[84,238],[82,236],[81,234],[80,232],[79,230],[76,225],[74,223],[73,220],[71,218],[70,216],[68,214],[67,211],[66,208],[65,206],[64,203],[62,200],[61,197],[61,194],[60,191],[59,188],[58,185],[58,182],[57,178],[56,175],[56,172],[55,169],[54,165],[54,163],[53,158],[53,155],[53,152],[52,149],[52,146],[52,142],[52,138],[52,134],[52,130],[52,126],[52,122],[53,118],[53,114],[53,111],[54,109],[55,106],[56,103],[56,100],[58,97],[59,95],[60,93],[61,90],[62,88],[63,86],[66,82],[67,80],[69,77],[70,76],[72,73],[74,71],[76,69],[80,66],[82,65],[84,63],[87,61],[90,59],[92,57],[94,56],[96,55],[99,54],[102,53],[104,52],[107,51],[110,50],[113,50],[116,49],[119,48],[123,47],[126,46],[130,45],[132,45],[135,44],[139,43],[142,43],[145,42],[148,41],[151,40],[154,40],[157,39],[160,39],[163,39],[166,38],[169,38],[172,38],[175,38],[178,39],[180,40],[182,42],[184,44],[186,46],[188,48],[190,50],[192,52],[194,54],[195,56],[198,59],[199,60],[200,63],[201,66],[203,68],[204,70],[205,72],[207,75],[208,77],[209,79],[210,82],[211,85],[212,88],[213,90],[214,93],[215,95],[216,98],[217,101],[218,104],[218,108],[219,111],[220,114],[221,117],[221,120],[222,123],[222,126],[223,129],[223,133],[223,137],[223,141],[223,144],[223,147],[223,151],[223,154],[223,157],[223,161],[222,163],[221,166],[221,169],[220,171],[219,175],[218,178],[217,180],[216,183],[216,186],[214,188],[214,191],[213,193],[211,195],[210,197],[209,200],[207,202],[206,204],[204,206],[202,207],[200,209],[198,210],[196,212],[194,214],[192,215],[189,216],[187,218],[185,218],[182,219],[179,219],[176,220],[173,221],[170,221],[167,222],[164,222],[161,223],[157,224],[154,224],[151,225],[148,226],[145,227],[142,228],[140,228],[137,229],[134,229],[132,230],[129,230],[127,232],[125,232],[121,233],[118,233],[114,233],[111,233],[107,233],[104,233],[101,233],[98,233],[94,233],[91,233],[88,233],[85,234],[82,234],[80,234]],[[135,220],[135,224],[135,228],[135,232],[135,235],[136,238],[136,242],[137,245],[137,249],[138,252],[138,255],[139,258],[139,262],[139,265],[140,268],[140,272],[141,276],[141,280],[142,284],[142,288],[143,292],[144,295],[144,298],[145,303],[145,308],[146,313],[146,318],[147,324],[147,327],[147,330],[147,333],[148,336],[148,339],[149,342],[149,347],[149,350],[149,354],[150,360],[151,363],[151,366],[152,369],[152,375],[152,379],[153,383],[153,387],[153,391],[153,394],[153,398],[153,402],[154,406],[154,410],[154,414],[154,417],[155,420],[155,424],[155,427],[156,431],[156,435],[156,439],[157,443],[157,446],[157,449],[158,452],[158,456],[158,459],[159,463],[159,467],[159,472],[160,476],[160,479],[161,484],[161,487],[161,491],[162,494],[162,497],[163,499],[163,502],[164,505],[164,509],[165,512],[165,515],[166,520],[166,523],[167,528],[167,531],[168,535],[168,538],[169,541],[169,544],[170,547],[170,550],[170,553],[171,556],[171,559],[172,562],[172,564],[173,568],[173,574],[173,579],[174,582],[174,585],[175,590],[175,593],[175,597],[175,600],[175,603],[176,606],[176,609],[177,612],[178,617],[178,620],[178,623],[179,626],[179,630],[179,634],[180,637],[180,642],[181,647],[181,650],[181,656],[182,660],[182,666],[182,670],[183,674],[183,679],[183,683],[183,686],[184,691],[185,695],[185,698],[185,701],[186,703],[186,706],[187,709],[187,712],[187,708],[187,704],[187,700]],[[136,230],[134,231],[131,232],[128,234],[126,236],[123,239],[121,240],[120,242],[118,244],[116,246],[115,248],[113,252],[112,254],[110,258],[108,260],[106,264],[104,267],[102,269],[101,271],[100,273],[98,275],[96,279],[95,282],[93,284],[92,288],[90,290],[89,293],[87,295],[86,298],[84,301],[81,305],[78,309],[77,312],[76,314],[74,318],[71,321],[68,325],[65,328],[63,331],[62,333],[60,336],[59,338],[57,341],[56,343],[55,346],[54,348],[52,350],[50,353],[48,356],[46,359],[45,361],[43,364],[42,367],[40,369],[39,372],[38,374],[36,376],[35,379],[34,382],[33,384],[32,386],[31,388],[30,391],[30,392]],[[139,244],[143,244],[146,245],[150,247],[152,248],[154,250],[156,252],[158,253],[162,255],[165,257],[168,259],[170,261],[172,263],[174,265],[176,266],[178,268],[181,271],[184,273],[186,274],[188,276],[190,278],[192,281],[194,283],[196,286],[199,289],[202,293],[205,296],[208,299],[210,301],[212,304],[215,306],[217,309],[220,311],[222,314],[225,317],[228,320],[230,323],[232,325],[235,328],[237,330],[240,333],[242,335],[245,338],[248,340],[250,343],[252,345],[253,348],[255,350],[257,352],[259,354],[260,356],[262,358],[265,361],[266,362],[269,365],[272,368],[275,371],[277,374],[279,375],[281,377],[282,379],[285,381],[287,383],[288,384],[290,386]],[[184,715],[182,716],[180,717],[177,719],[175,721],[173,722],[172,724],[170,726],[168,727],[166,729],[164,730],[162,732],[159,734],[157,736],[154,738],[151,740],[149,742],[146,744],[144,746],[141,748],[137,751],[136,752],[134,754],[131,756],[129,759],[126,762],[124,764],[123,766],[121,768],[119,770],[118,772],[116,775],[114,777],[112,779],[111,781],[110,782],[108,784],[106,786],[105,788],[104,790],[102,792],[100,794],[98,796],[97,797]],[[185,710],[187,712],[189,714],[191,716],[193,718],[195,720],[198,722],[200,723],[201,725],[203,726],[205,728],[207,730],[209,731],[211,732],[213,734],[214,736],[217,737],[219,739],[221,740],[224,742],[226,744],[228,746],[231,747],[233,749],[236,751],[239,753],[241,755],[243,757],[245,759],[247,760],[249,762],[251,763],[254,765],[257,768],[260,770],[262,772],[264,775],[267,778],[270,780],[272,782],[274,784],[275,786],[277,788],[279,790],[281,792],[282,792]]];
// The figure's strokes as one path, for a picture to stroke its own way.
const figHead = (x, y, s) => { const k = (230 / 848) * s; return [x - 36 * k, y - 810 * k]; };
function traceFigure(ctx, x, y, s) {
  const k = (230 / 848) * s, ox = x - 173 * k, oy = y - 848 * k;
  ctx.beginPath();
  for (const stroke of FIGURE) stroke.forEach(([px, py], i) => (i ? ctx.lineTo(ox + px * k, oy + py * k) : ctx.moveTo(ox + px * k, oy + py * k)));
}
function drawFigure(ctx, x, y, s, a, ink = COL.white) {
  if (a <= 0.003) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = ink; ctx.lineWidth = Math.max(1.5, 14 * (230 / 848) * s * 0.8); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  traceFigure(ctx, x, y, s); ctx.stroke();
  ctx.restore();
}
// head: where the head's top is, for the dots to lead to.
function drawThought(ctx, x, y, w, h, text, p, a, head, ink = COL.white) {
  if (a <= 0.003) return;
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#2A3138'; ctx.strokeStyle = ink; ctx.lineWidth = 3.5;
  // the readout: a rounded box, and dots down to the head
  ctx.beginPath(); ctx.roundRect(x - w / 2, y - h / 2, w, h, Math.min(18, h * 0.22)); ctx.fill(); ctx.stroke();
  const k = clamp(h / 120, 0.6, 1.1), [hx, hy] = head, sx = clamp(hx, x - w / 2 + 26, x + w / 2 - 26), sy = y + h / 2;
  for (const [t, r] of [[0.22, 10 * k], [0.52, 7 * k], [0.8, 4.5 * k]]) { ctx.beginPath(); ctx.arc(lerp(sx, hx, t), lerp(sy, hy - 8, t), r, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
  if (text) {
    const shown = text.slice(0, Math.ceil(text.length * clamp(p, 0, 1)));
    ctx.font = cm(Math.min(48, (w * 1.6) / Math.max(1, text.length))); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = COL.white;
    ctx.fillText(shown, x, y + 2);
  }
  ctx.restore();
}
// What the figure thinks, as sprites around (0, 0), so the readout can move and shrink with the figure and one thought
// can reshape into the next (manim's Transform) instead of being written over.
const THOUGHTS = ['Woah, this is cool AF', 'This is my goal now', 'WTF?!', 'I understand it now'];
const THINK = { size: 40, pad: 30 };
const thinkCache = new Map(), thinkPlans = new Map();
function thinkSp(text) {
  let v = thinkCache.get(text); if (v) return v;
  const sp = place(tex(String.raw`\text{${text}}`), { x: 0, y: 0, size: THINK.size });
  let x0 = Infinity, x1 = -Infinity; for (const s of sp) { const [l, r] = inkBox(s); x0 = Math.min(x0, l); x1 = Math.max(x1, r); }
  v = { sp, w: x1 - x0 }; thinkCache.set(text, v); return v;
}
function thinkPlan(a, b) { const k = a + '|' + b; if (!thinkPlans.has(k)) thinkPlans.set(k, reshapePlan(thinkSp(a).sp, thinkSp(b).sp)); return thinkPlans.get(k); }
// (x, y) is the readout's centre, s its scale and h its height; from reshapes into to as m runs 0..1; p writes to in.
function drawThinking(ctx, x, y, s, h, from, to, m, p, a, head, ink = null) {
  if (a <= 0.003 || !to) return;
  const u = from ? smooth(clamp(m, 0, 1)) : 1, w = (lerp(from ? thinkSp(from).w : thinkSp(to).w, thinkSp(to).w, u) + 2 * THINK.pad) * s;
  drawThought(ctx, x, y, w, h, '', 1, a, head, ink ? hexOf(ink) : COL.white);
  ctx.save(); ctx.translate(x, y + 3 * s); ctx.scale(s, s);
  if (from && m < 0.999) { if (m <= 0.001) drawSprites(ctx, thinkSp(from).sp, { alpha: a }); else drawReshape(ctx, thinkPlan(from, to), m, a); }
  else drawSprites(ctx, thinkSp(to).sp, { p, alpha: a, color: ink });
  ctx.restore();
}
// The zoom panel over the beam: a ring on the beam marks the section, and a panel beside it shows that section the
// way the shadows scene draws it, particles wobbling and rays stopping at them, with its step plot of the rays left
// under them against e^{−nσz}: the discrete version of what the cloud does.
const PANEL = { x: 1330, y: 600, w: 540, h: 430 }, PSRC = { x: SL.x0 - 70, y: SL.top - 70, w: SL.x1 - SL.x0 + 260, h: 1010 - (SL.top - 70) };
function drawMagnifier(ctx, cam, B, m) {
  if (m <= 0.003) return;
  const e = smooth(m), q = cam.project(vAdd(B.b0, vMul(B.d, B.len * 0.52))) || [960, 560], r0 = 22;
  const R = lerpRect([q[0] - r0, q[1] - r0, 2 * r0, 2 * r0], [PANEL.x, PANEL.y, PANEL.w, PANEL.h], e);
  ctx.save(); ctx.globalAlpha = e;
  ctx.strokeStyle = hexA(COL.white, 0.8); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(q[0], q[1], r0, 0, Math.PI * 2); ctx.stroke();
  if (e > 0.1) {   // the section's ring to the panel's near corners
    ctx.setLineDash([6, 8]); ctx.beginPath();
    for (const [cx, cy] of [[R[0], R[1]], [R[0], R[1] + R[3]]]) { const a = Math.atan2(cy - q[1], cx - q[0]); ctx.moveTo(q[0] + r0 * Math.cos(a), q[1] + r0 * Math.sin(a)); ctx.lineTo(cx, cy); }
    ctx.stroke(); ctx.setLineDash([]);
  }
  ctx.save(); ctx.beginPath(); ctx.roundRect(R[0], R[1], R[2], R[3], 16 * e); ctx.clip();
  ctx.fillStyle = hexA(BG, 0.94); ctx.fill();
  const k = Math.min(R[2] / PSRC.w, R[3] / PSRC.h), ox = R[0] + (R[2] - PSRC.w * k) / 2 - PSRC.x * k, oy = R[1] + (R[3] - PSRC.h * k) / 2 - PSRC.y * k;
  ctx.translate(ox, oy); ctx.scale(k, k);
  // only the discrete version: no e^{−nσz} curve; the sensor stays outside the panel, and no reading
  const sa = { ...SA, rays: '40', pred: 0, labels: 1, sensorX: 1850, noReadout: true, noAxisLabels: true }, S = shadowsState(sa);
  drawShadowsPicture(ctx, 0, sa, S); drawShadowsPlot(ctx, sa, S, 1);
  ctx.restore();
  ctx.strokeStyle = COL.greyA; ctx.lineWidth = 4; ctx.beginPath(); ctx.roundRect(R[0], R[1], R[2], R[3], 16 * e); ctx.stroke();
  ctx.restore();
}
const presCv = document.createElement('canvas'), presCtx = presCv.getContext('2d');
// The cloud drawn offscreen, the whole stage, for a card to show part of.
function presCloudOffscreen(dt, withMag) {
  if (presCv.width !== cv.width || presCv.height !== cv.height) { presCv.width = cv.width; presCv.height = cv.height; }
  const c = presCtx; c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.fillStyle = BG; c.fillRect(0, 0, presCv.width, presCv.height);
  c.setTransform(K, 0, 0, K, 0, 0); c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.lineCap = 'butt'; c.setLineDash([]);
  drawCloud3D(c, dt, SK);
  if (withMag && PS.mag > 0.003) drawMagnifier(c, v3cam(SK), v3beam(SK), PS.mag);
}
// A question's card: the box around its part of the equation grows into the card, the part carried along to its top,
// then the question under it and a place for its animation.
function drawQCards(ctx, st) {
  const ga = st.qcA; if (ga <= 0.003) return;
  QCARDS.forEach((q, i) => {
    const c = st.qc[i]; if (c.box <= 0.003) return;
    const ss = peq().filter((s) => s.a.terms.includes(q.term)); if (!ss.length) return;
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const s of ss) { const [l, r, t, b] = inkBox(s); x0 = Math.min(x0, l); x1 = Math.max(x1, r); y0 = Math.min(y0, t); y1 = Math.max(y1, b); }
    // the highlight's box, which then turns into the card
    const pad = 12, m = smooth(clamp(c.m, 0, 1)), C = qRect(i, st), k = C[2] / 480, a = smooth(clamp(c.box, 0, 1)) * ga;
    const R = lerpRect([x0 - pad, y0 - pad, x1 - x0 + 2 * pad, y1 - y0 + 2 * pad], C, m);
    ctx.save(); ctx.strokeStyle = hexA(q.col, a * lerp(1, 0.8, m)); ctx.lineWidth = 3.5; ctx.beginPath(); ctx.roundRect(R[0], R[1], R[2], R[3], lerp(10, 16, m)); ctx.stroke(); ctx.restore();
    if (c.title > 0.003) q.title.forEach((src, j) => drawTex(ctx, src, C[0] + C[2] / 2, C[1] + (50 + j * 44) * k, 32 * k, { p: c.title, color: q.col, alpha: ga }));
    if (c.todo > 0.003) (q.draw || drawTodo)(ctx, [C[0] + 24 * k, C[1] + 136 * k, C[2] - 48 * k, C[3] - 160 * k], c.todo * ga, q, k);
  });
}
function drawTodo(ctx, r, a, q, k = 1) {
  ctx.save(); ctx.strokeStyle = hexA(COL.greyD, a); ctx.lineWidth = 2; ctx.setLineDash([9 * k, 9 * k]); ctx.beginPath(); ctx.roundRect(r[0], r[1], r[2], r[3], 10 * k); ctx.stroke(); ctx.restore();
  const cx = r[0] + r[2] / 2, n = q.todo.length, y = r[1] + r[3] / 2 - (n * 34 * k) / 2;
  drawTex(ctx, String.raw`\text{TODO}`, cx, y - 8 * k, 30 * k, { color: COL.grey, alpha: a });
  q.todo.forEach((line, j) => drawTex(ctx, String.raw`\text{${line}}`, cx, y + (40 + j * 34) * k, 25 * k, { color: COL.grey, alpha: a }));
}
// Beat 15: the spectrum. The lecture at one end and the shader at the other, named above them; the line between them,
// as far as the arrow under it has drawn it; the arrow, swaying back and forth once it is back in the middle. For the goals all of
// it shrinks into the aside, a card at the top left.
const specXf = (st) => {
  const a = smooth(clamp(st.side, 0, 1)), [sx, sy, sw, sh] = SPEC.src, [cx, cy, cw, ch] = SPEC.card, pad = 28;
  const s = Math.min((cw - 2 * pad) / sw, (ch - 2 * pad) / sh);
  return [lerp(0, cx + (cw - sw * s) / 2 - sx * s, a), lerp(0, cy + (ch - sh * s) / 2 - sy * s, a), lerp(1, s, a)];
};
function drawPointer(ctx, x, y, a, ang) {   // an arrow pointing up, its tip at (x, y), turned by ang about the tip
  if (a <= 0.003) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.globalAlpha *= a; ctx.fillStyle = COL.yellow; ctx.strokeStyle = COL.yellow; ctx.lineWidth = 6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, 22); ctx.lineTo(0, 66); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-15, 28); ctx.lineTo(15, 28); ctx.closePath(); ctx.fill();
  ctx.restore();
}
// The aside's card: a ground of its own, drawn under the equation that comes into it.
function drawAsideCard(ctx, st) {
  const ga = smooth(clamp(st.p15, 0, 1)), side = smooth(clamp(st.side, 0, 1)); if (ga <= 0.003) return;
  if (side > 0.003) {   // the aside: a card with a ground of its own
    const c = SPEC.card; ctx.save(); ctx.globalAlpha = side * ga; ctx.fillStyle = '#26241F'; ctx.strokeStyle = COL.greyC; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.roundRect(c[0], c[1], c[2], c[3], 14); ctx.fill(); ctx.stroke(); ctx.restore();
  }
}
function drawSpectrum(ctx, st) {
  const ga = smooth(clamp(st.p15, 0, 1)); if (ga <= 0.003) return;
  const [l, r] = st.spec.map((v) => smooth(clamp(v, 0, 1))), side = smooth(clamp(st.side, 0, 1));
  const [ox, oy, s] = specXf(st), y = SPEC.y, L = SPEC.L, R = SPEC.R, xa = L[0] + L[2] / 2, xb = R[0] + R[2] / 2;
  ctx.save(); ctx.translate(ox, oy); ctx.scale(s, s);
  // the line, as far as the arrow has drawn it, and its ends
  const lp = clamp(st.lineP, 0, 1), g = ctx.createLinearGradient(xa, 0, xb, 0); g.addColorStop(0, COL.blue); g.addColorStop(1, COL.gold);
  ctx.save(); ctx.strokeStyle = g; ctx.fillStyle = g; ctx.lineWidth = 4; ctx.lineCap = 'round';
  if (lp > 0.003) { ctx.globalAlpha = ga; ctx.beginPath(); ctx.moveTo(xa, y); ctx.lineTo(lerp(xa, xb, lp), y); ctx.stroke(); }
  if (l > 0.003) { ctx.globalAlpha = ga * l; ctx.beginPath(); ctx.arc(xa, y, 7, 0, Math.PI * 2); ctx.fill(); }
  if (lp > 0.98) { ctx.globalAlpha = ga; ctx.beginPath(); ctx.arc(xb, y, 7, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
  // the two ends, small, with their names over them: the shader tutorial at the left, the physics lecture at the right
  if (l > 0.003) drawTex(ctx, String.raw`\text{shader tutorial}`, xa, L[1] - 28, 28, { color: COL.blue, alpha: l * ga });
  if (r > 0.003) drawTex(ctx, String.raw`\text{physics lecture}`, xb, R[1] - 28, 28, { color: COL.gold, alpha: r * ga });
  const t = TIME - st.specT;
  drawRaymarch(ctx, [L[0], L[1], L[2], L[3] * 0.52], l * ga, t);
  drawCodePanel(ctx, [L[0], L[1] + L[3] * 0.56, L[2], L[3] * 0.44], l * ga, st.code, t);
  drawChalkboard(ctx, R, r * ga);
  // the arrow under the line
  const sway = reduced ? 0 : smooth(clamp(st.wig, 0, 1)) * 16 * Math.sin(2 * Math.PI * 0.8 * (TIME - st.wigT));
  drawPointer(ctx, st.ptrX + sway, y + 16, ga * smooth(clamp(st.ptrA, 0, 1)), 0);
  ctx.restore();
}
// Beat 15f: a copy of me, "WTF?!" and all, walks out to the right along a growing arrow; on the way its readout grows
// and the "WTF?!" reshapes into "I understand it now", the way manim transforms one formula into another. "Now" under
// me, "Then" under the copy.
const RO_Q = { dx: 110, dy: -330, s: 0.8, h: 84 }, RO_U = { dx: 40, dy: -345, s: 0.66, h: 90 };
// how far me now has faded into the past: from just after the copy sets off, until the aside goes in beat 16
const pastOf = (st) => smooth(clamp((st.fut - 0.1) / 0.6, 0, 1)) * smooth(clamp(st.p15, 0, 1));
function drawFuture(ctx, st) {
  const ga = smooth(clamp(st.p15, 0, 1)) * smooth(clamp(st.fut * 4, 0, 1)); if (ga <= 0.003) return;
  const g = smooth(clamp(st.fut, 0, 1)), fx = lerp(MIDFIG, FUT.x, g), x0 = MIDFIG + 82, x1 = fx - 92, y = FUT.y - 125;
  if (x1 > x0 + 20) {
    ctx.save(); ctx.globalAlpha = ga; ctx.strokeStyle = COL.greyB; ctx.fillStyle = COL.greyB; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1 - 18, y); ctx.stroke(); arrowTip(ctx, x1, y, 1, 0, 26, 12); ctx.restore();
  }
  drawFigure(ctx, fx, FUT.y, 1, ga);
  // the readout grows and its "WTF?!" reshapes into the sentence while the copy walks
  const w = clamp(st.futW, 0, 1), u = smooth(w);
  drawThinking(ctx, fx + lerp(RO_Q.dx, RO_U.dx, u), FUT.y + lerp(RO_Q.dy, RO_U.dy, u), lerp(RO_Q.s, RO_U.s, u), lerp(RO_Q.h, RO_U.h, u), THOUGHTS[2], THOUGHTS[3], w, 1, ga, figHead(fx, FUT.y, 1));
  drawTex(ctx, String.raw`\text{Now}`, MIDFIG - 10, FUT.y + 30, 32, { color: COL.greyA, alpha: ga * lerp(1, 0.6, pastOf(st)) });
  drawTex(ctx, String.raw`\text{Then}`, FUT.x - 10, FUT.y + 30, 32, { color: COL.greyA, alpha: ga * smooth(clamp((st.fut - 0.8) / 0.2, 0, 1)) });
}
// Beats 15d–f: the goals, as bullet points under a heading in an aside on the right, one per press. Both are laid
// out from the start, so the first doesn't move when the second comes in.
const wrapCache = new Map();
function wrapText(text, maxW, size) {   // lines of \text no wider than maxW; two lines are evened out
  const key = `${text}|${maxW}|${size}`; if (wrapCache.has(key)) return wrapCache.get(key);
  const words = text.split(' '), wid = (t) => tex(String.raw`\text{${t}}`).w * size;
  let lines = [], cur = '';
  for (const w of words) { const t = cur ? `${cur} ${w}` : w; if (cur && wid(t) > maxW) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur);
  if (lines.length === 2) {
    let best = null;
    for (let i = 1; i < words.length; i++) { const a = words.slice(0, i).join(' '), b = words.slice(i).join(' '), m = Math.max(wid(a), wid(b)); if (!best || m < best[0]) best = [m, [a, b]]; }
    if (best && best[0] <= maxW) lines = best[1];
  }
  wrapCache.set(key, lines); return lines;
}
function drawGoals(ctx, st) {
  const ga = smooth(clamp(st.p15, 0, 1)) * smooth(clamp(st.goalsA, 0, 1)); if (ga <= 0.003) return;
  const [x, y0] = GOALXY, size = 38, lh = 50, gap = 28;
  drawTex(ctx, String.raw`\text{Goals:}`, x, y0, 48, { ax: 0, color: COL.greyA, alpha: ga });
  const blocks = GOALS.map((g) => wrapText(g, 640, size));
  let y = y0 + 92;
  blocks.forEach((lines, i) => {
    const p = st.goals[i];
    if (p > 0.003) {
      dot(ctx, x + 12, y + 3, 7, COL.yellow, ga * smooth(clamp(p * 4, 0, 1)));
      lines.forEach((ln, j) => drawTex(ctx, String.raw`\text{${ln}}`, x + 42, y + j * lh, size, { ax: 0, p: clamp(p * lines.length - j, 0, 1), alpha: ga }));
    }
    y += lines.length * lh + gap;
  });
}
// Beats 17–20: the fields' cards. A card with no picture of its own shows the cloud, cropped to fill it. Once this
// video's card comes in, the other three lose their colour and their own clock slows to a stop: the focus has moved.
function drawUses(ctx, dt, st) {
  const calm = smooth(clamp(st.grow / 0.6, 0, 1)), sdt = dt * (1 - calm);
  st.useT += sdt;
  for (let i = 0; i < 4; i++) {
    const u = USES[i], side = i < 3 ? calm : 0, a = smooth(clamp(st.uses[i], 0, 1)) * (1 - smooth(clamp(st.usesOut, 0, 1))) * lerp(1, 0.8, side);
    if (a <= 0.003) { u.seen = false; continue; }
    const r = useRect(i, st), fresh = !u.seen, ls = clamp(r[2] / 590, 0.72, 1); u.seen = true;
    if (r[2] < 4 || r[3] < 4) continue;
    ctx.save(); ctx.globalAlpha = a; ctx.beginPath(); ctx.roundRect(r[0], r[1], r[2], r[3], 14); ctx.clip();
    if (u.draw && i < 3) {   // on the side cards' own clock
      const s = r[2] / 700, T0 = TIME; ctx.translate(r[0], r[1]); ctx.scale(s, s);
      TIME = st.useT; try { u.draw(ctx, sdt, r[3] / s, fresh); } finally { TIME = T0; }
    } else if (i === 3 && st.labOn > 0.003) { /* from beat 21 the lab draws this card's picture, grown out of it */ }
    else if (u.draw) { const s = r[2] / 700; ctx.translate(r[0], r[1]); ctx.scale(s, s); u.draw(ctx, dt, r[3] / s, fresh); }
    else {
      presCloudOffscreen(dt, false);
      const ar = r[2] / r[3], sw = Math.min(W, H * ar), sh = Math.min(H, W / ar);
      ctx.drawImage(presCv, ((W - sw) / 2) * K, ((H - sh) / 2) * K, sw * K, sh * K, r[0], r[1], r[2], r[3]);
    }
    ctx.restore();
    greyOut(ctx, r, side, 0.3 * side);
    // this video's card in a muted amber, the yellow of "stuff" held back: in focus without shouting; the others grey
    ctx.save(); ctx.strokeStyle = i === 3 ? hexA(COL.yellow, 0.55 * a) : hexA(COL.greyC, a); ctx.lineWidth = i === 3 ? 3 : 2.5; ctx.beginPath(); ctx.roundRect(r[0], r[1], r[2], r[3], 14); ctx.stroke(); ctx.restore();
    drawTex(ctx, String.raw`\text{${u.label}}`, r[0] + 22 * ls, r[1] + 18 * ls, 30 * ls, { ax: 0, ay: 0, color: COL.greyA, alpha: a * clamp(r[2] / 400, 0, 1) });
  }
}
// Takes the colour out of what is already drawn in a card (g: 0..1) and dims it by dim: one blended fill, where a
// canvas filter would redo every stroke and dot inside the card.
function greyOut(ctx, r, g, dim = 0) {   // dim: how much darker, 0..1
  if (g <= 0.003 && dim <= 0.003) return;
  ctx.save(); ctx.beginPath(); ctx.roundRect(r[0], r[1], r[2], r[3], 14); ctx.clip();
  // the background's own hue at each pixel's brightness: the stage's warm grey, and the background stays as it is
  ctx.globalCompositeOperation = 'color'; ctx.globalAlpha = 0.92 * g; ctx.fillStyle = BG; ctx.fillRect(r[0], r[1], r[2], r[3]);
  if (dim > 0.003) { ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = dim; ctx.fillStyle = BG; ctx.fillRect(r[0], r[1], r[2], r[3]); }
  ctx.restore();
}
// Beat 16's caption, large at the top. Its "light" takes the laser's colour as the laser comes in (beat 20).
function drawCaption(ctx, st) {
  if (st.cap <= 0.003) return;
  TERM_COL['t-clight'] = hexRgb(SH.color);
  drawTex2(ctx, PCAP, 960, 190, 52, { p: st.cap, alpha: 1 - smooth(clamp(st.capOut, 0, 1)), hi: { 't-clight': smooth(clamp(st.lines, 0, 1)) } });
}
function drawTex2(ctx, src, x, y, size, { p = 1, alpha = 1, hi = null } = {}) { drawSprites(ctx, place(tex(src), { x, y, size }), { p, alpha, hi }); }
// Beats 21–21h: the four effects again, filling the stage, in neutral frames and
// labels. Each is named in turn, the ones before it paused and out of focus; then all four play; then the scatterings
// grey out and stop, then emission, and absorption, still playing, grows over the rest.
const FXCELLS = [[220, 120, 690, 340], [1010, 120, 690, 340], [220, 540, 690, 340], [1010, 540, 690, 340]], FXBIG = [220, 120, 1480, 760];
const hexOf = (c) => '#' + c.map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
function drawFx(ctx, dt, st) {
  const F = st.fx; if (Math.max(...F.show) <= 0.003) return;
  const big = smooth(clamp(F.big, 0, 1)), P = fxP();
  for (let i = 0; i < 4; i++) F.clock[i] += dt * clamp(F.run[i], 0, 1);   // each tile's own clock, stopped while it is paused
  for (const i of [1, 2, 3, 0]) {   // absorption last, so it grows over the others
    const g = smooth(clamp(F.grey[i], 0, 1)), d = smooth(clamp(F.dim[i], 0, 1)), a = smooth(clamp(F.show[i], 0, 1)) * (i === 0 ? 1 : 1 - big);
    if (a <= 0.003) continue;
    const r = i === 0 ? lerpRect(FXCELLS[0], FXBIG, big) : FXCELLS[i], sc = r[2] / 700, ca = a * lerp(1, 0.5, g);
    const u = reduced ? -1 : Math.max(0, F.clock[i]);
    ctx.save(); ctx.beginPath(); ctx.roundRect(r[0], r[1], r[2], r[3], 14); ctx.clip();
    ctx.translate(r[0], r[1] + (r[3] - 330 * sc) / 2); ctx.scale(sc, sc);
    // greying out, it settles into its still and stops
    if (g < 0.997) drawIACell(ctx, i, u, P, ca * (1 - g), SI.look);
    if (g > 0.003) drawIACell(ctx, i, -1, P, ca * g, SI.look);
    ctx.restore();
    greyOut(ctx, r, Math.max(g, 0.8 * d), 0.28 * d);   // set aside: grey; out of focus: less colour, a little darker
    const ink = mixRgb(hexRgb(COL.greyA), hexRgb(COL.greyD), Math.max(0.5 * d, 0.6 * g));   // frames and names stay neutral
    ctx.save(); ctx.strokeStyle = rgba(ink, a); ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(r[0], r[1], r[2], r[3], 14); ctx.stroke(); ctx.restore();
    drawTex(ctx, String.raw`\text{${PFX[i][1]}}`, r[0] + 22, r[1] + 18, i === 0 ? lerp(34, 44, big) : 34, { ax: 0, ay: 0, color: hexOf(ink), alpha: a });
  }
}
function drawPresent(ctx, dt) {
  const st = PS;
  // the effects' terms take their colour, or grey once their effect is set aside (beats 21g–h)
  for (let i = 0; i < 4; i++) TERM_COL[PFX[i][0]] = mixRgb(hexRgb(PFX[i][2]), hexRgb(COL.greyC), smooth(clamp(st.fx.grey[i], 0, 1)));
  // the cloud, with the laser on and turning slowly; while it is the whole picture it draws straight onto the stage,
  // inside the aside it is drawn offscreen and shown in a card
  if (st.orbit && !reduced) SK.yaw += dt * PRES_DRIFT;
  const asideIn = smooth(clamp(st.aside, 0, 1)), asideOut = smooth(clamp(st.aside - 1, 0, 1)), cloudA = 1 - asideOut;
  if (cloudA > 0.003) {
    if (asideIn <= 0.003) { drawCloud3D(ctx, dt, SK); if (st.mag > 0.003) drawMagnifier(ctx, v3cam(SK), v3beam(SK), st.mag); }
    else {
      presCloudOffscreen(dt, true);
      const card = lerpRect([0, 0, W, H], [60, 110, 1120, 630], asideIn);
      ctx.save(); ctx.globalAlpha = cloudA; ctx.beginPath(); ctx.roundRect(card[0], card[1], card[2], card[3], 14 * asideIn); ctx.clip();
      ctx.drawImage(presCv, card[0], card[1], card[2], card[3]); ctx.restore();
      if (asideIn > 0.003) { ctx.save(); ctx.globalAlpha = cloudA * asideIn; ctx.strokeStyle = COL.greyC; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.roundRect(card[0], card[1], card[2], card[3], 14); ctx.stroke(); ctx.restore(); }
    }
  }
  // the figure and its thought: beside the card, then small in the corner once the equation takes the stage
  if (st.fig > 0.003) {
    const c = smooth(clamp(st.corner, 0, 1)), fm = smooth(clamp(st.figMid, 0, 1)), fx = lerp(lerp(1500, 150, c), MIDFIG, fm), fy = lerp(lerp(840, 960, c), FUT.y, fm), fs = lerp(1.24, 1, c), fa = smooth(clamp(st.fig, 0, 1));
    // once a copy of me sets off for later (beat 15f), this one fades into the past: greyer, fainter
    const past = pastOf(st), ink = mixRgb(hexRgb(COL.white), hexRgb(COL.greyC), 0.75 * past);
    drawFigure(ctx, fx, fy, fs, fa * lerp(1, 0.7, past), hexOf(ink));
    drawThinking(ctx, fx + 110, fy - lerp(410, 330, c), lerp(1, 0.8, c), lerp(100, 84, c), st.thinkFrom, st.think, st.thinkM, st.writeP, fa * lerp(1, 0.65, past), figHead(fx, fy, fs), past > 0.003 ? ink : null);
  }
  drawFuture(ctx, st);
  drawAsideCard(ctx, st);
  // the equation, wherever it is, with its braces; the effects' cells under it; the questions' cards
  if (st.eq) {
    const [ex, ey, ek] = eqXf(st);
    ctx.save(); ctx.translate(ex, ey); ctx.scale(ek, ek); ctx.translate(-PEQ.x, -PEQ.y);
    drawSprites(ctx, peq(), { p: st.eqP, alpha: st.eqA, hi: st.hi, dim: st.dim });
    for (const b of st.braces) {
      const ba = b.a * st.eqA; if (ba <= 0.003) continue;
      drawBrace(ctx, b.x0 + ((b.x1 - b.x0) * b.g) / 2, b.top, (b.x1 - b.x0) * b.g, b.h, b.th, b.color, Math.min(1, b.g * 4) * ba);
      if (b.l > 0.003) for (const s of b.lab) drawSprite(ctx, shifted(s, 0, (1 - b.l) * 14), s.alpha * b.l * ba, b.color);
    }
    ctx.restore();
    const ga = smooth(clamp(st.grid, 0, 1));
    if (ga > 0.003) for (let i = 0; i < 4; i++) {
      const show = st.cells[i]; if (show <= 0.003) continue;
      const r = PCELLS[i], sc = r[2] / 700, a = smooth(clamp(show, 0, 1)) * ga;
      ctx.save(); ctx.beginPath(); ctx.roundRect(r[0], r[1], r[2], r[3], 14); ctx.clip(); ctx.translate(r[0], r[1]); ctx.scale(sc, r[3] / 330);
      drawIACell(ctx, i, fxAge(st.cellT[i]), fxP(), a, SI.look);
      ctx.restore();
      ctx.save(); ctx.strokeStyle = hexA(PFX[i][2], 0.9 * a); ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(r[0], r[1], r[2], r[3], 14); ctx.stroke(); ctx.restore();
      drawTex(ctx, String.raw`\text{${PFX[i][1]}}`, r[0] + 22, r[1] + 18, 34, { ax: 0, ay: 0, color: PFX[i][2], alpha: a });
    }
    drawQCards(ctx, st);
  }
  drawSpectrum(ctx, st);
  drawGoals(ctx, st);
  drawUses(ctx, dt, st);
  drawCaption(ctx, st);
  drawLab(ctx, dt, st);
  drawFx(ctx, dt, st);
  // a small counter after each press, and a pause mark while paused
  const ta = PRES.paused ? 1 : clamp(1.8 - (TIME - PRES.toast), 0, 1);
  if (ta > 0.003) {
    const b = BEATS[PRES.beat];
    ctx.save(); ctx.globalAlpha = ta; ctx.font = '500 22px ' + 'Inter, system-ui, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = COL.grey;
    ctx.fillText(`${b.n} · ${b.name}${PRES.paused ? ' · paused' : ''}   (${PRES.beat + 1} / ${BEATS.length})`, 28, H - 26); ctx.restore();
  }
}
