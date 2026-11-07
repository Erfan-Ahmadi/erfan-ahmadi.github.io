// ---------- presentation, part 3: only absorption, and the first formula (beats 21–31) ----------
// The lab: this video's box of stuff, grown out of its card to fill the stage, in rows of laser, boxes and sensor. In
// the box scene's own units (pictures.js's BOXG, shifted so one box is centred on 0): the beam runs along y = 0, a box
// is 580 × 400, and every box takes half of the light that enters it.
const LAB = { BW: 580, G: 26, laserGap: 180, sensorGap: 220, top: -200, bot: 200 };
// where the rows sit on the stage (stage = o + s · scene): the whole stage for one row, then two rows, one above the other
const LABXF = { full: { ox: 960, oy: 560, s: 1.2 }, top: { ox: 960, oy: 300, s: 0.66 }, bot: { ox: 960, oy: 770, s: 0.66 } };
const mixXf = (a, b, t) => ({ ox: lerp(a.ox, b.ox, t), oy: lerp(a.oy, b.oy, t), s: lerp(a.s, b.s, t) });
// The card's own transform in beat 20, so the lab starts exactly where the card's picture was.
function labCardXf(st) {
  const r = useRect(3, st), k = r[2] / 700, [ox, oy, s] = boxFit(r[3] / k);
  return { ox: r[0] + k * (ox + s * 470), oy: r[1] + k * oy, s: k * s };
}
// c boxes (fractional while one slides in from the right): the boxes stay centred, the laser and sensor move out
function labLayout(c) {
  const T = c * LAB.BW + (c - 1) * LAB.G, boxes = [];
  for (let k = 0; k < Math.max(1, Math.ceil(c - 1e-6)); k++) {
    const a = clamp(c - k, 0, 1);
    boxes.push({ x0: -T / 2 + k * (LAB.BW + LAB.G) + (1 - smooth(a)) * 1000, a });
  }
  return { laser: -T / 2 - LAB.laserGap, sensor: T / 2 + LAB.sensorGap, boxes };
}
// Text that reshapes into other text (the sensor's readout), as sprites around (0, 0).
const labTxtCache = new Map(), labPlanCache = new Map();
function labTxt(str, size = 50) {
  const key = str + '|' + size; let v = labTxtCache.get(key); if (v) return v;
  v = place(tex(String.raw`\text{${str.replace('%', '\\%')}}`), { x: 0, y: 0, size }); labTxtCache.set(key, v); return v;
}
function labPlan(a, b, size = 50) { const k = a + '|' + b + '|' + size; if (!labPlanCache.has(k)) labPlanCache.set(k, reshapePlan(labTxt(a, size), labTxt(b, size))); return labPlanCache.get(k); }
function drawMorphText(ctx, from, to, m, a, size = 50) {
  if (from && m < 0.999) { if (m <= 0.001) drawSprites(ctx, labTxt(from, size), { alpha: a }); else drawReshape(ctx, labPlan(from, to, size), m, a); }
  else if (to) drawSprites(ctx, labTxt(to, size), { alpha: a });
}
// The sensor's readout: a box over the sensor, joined to it by a line, its text reshaping when it changes.
function drawLabReadout(ctx, xs, from, to, m, a) {
  if (a <= 0.003) return;
  const bw = 210, bh = 92, by = -48 - 44 - bh;
  ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = COL.greyB; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(xs, -48); ctx.lineTo(xs, by + bh); ctx.stroke();
  ctx.fillStyle = BG; ctx.beginPath(); ctx.roundRect(xs - bw / 2, by, bw, bh, 12); ctx.fill(); ctx.stroke(); ctx.restore();
  ctx.save(); ctx.translate(xs, by + bh / 2 + 3); drawMorphText(ctx, from, to, m, a); ctx.restore();
}
// Beat 21: what we leave out, shown on the box itself. Scattering: rays break off the specks the beam passes, and the
// stuff around the beam turns faintly red. Beat 21b: emission: every speck glows red on its own.
const hash1 = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
function drawScatter(ctx, B, a) {
  if (a <= 0.003) return;
  const w = B.x1 - B.x0;
  for (let k = 0; k < 6; k++) {   // the red haze along the beam, strongest where the light comes in
    const x = B.x0 + (k / 6) * w, g = ctx.createLinearGradient(0, -150, 0, 150), al = 0.2 * a * Math.exp(-1.1 * (k / 6));
    g.addColorStop(0, 'rgba(255,59,48,0)'); g.addColorStop(0.5, `rgba(255,59,48,${al.toFixed(3)})`); g.addColorStop(1, 'rgba(255,59,48,0)');
    ctx.fillStyle = g; ctx.fillRect(x, -150, w / 6 + 1, 300);
  }
  const t = reduced ? 1.3 : TIME;
  BOXSPECKS.forEach(([u, v, ph], j) => {   // the specks near the beam send rays off it, one after another
    const by = B.top + 16 + v * (B.bot - B.top - 32); if (Math.abs(by) > 48) return;
    const [sx, sy] = speckXY(B, u, v, ph), P = 1.1 + 0.6 * hash1(j), q = t / P + hash1(j + 7), n = Math.floor(q), age = (q - n) * P;
    const th = 0.4 + hash1(j * 31 + n) * (2 * Math.PI - 0.8), S = pathSampler([[sx, sy], [sx + 700 * Math.cos(th), sy + 700 * Math.sin(th)]]);
    drawPhotonDot(ctx, S, 300 * age, SH.color, a * (1 - age / P), { r: 7, trail: 55 });
  });
}
function drawGlow(ctx, B, a) {
  if (a <= 0.003) return;
  for (const [u, v, ph] of BOXSPECKS) {
    const [x, y] = speckXY(B, u, v, ph), p = reduced ? 1 : 0.85 + 0.15 * Math.sin(2.2 * TIME + ph * 3), R = 26;
    const g = ctx.createRadialGradient(x, y, 0, x, y, R); g.addColorStop(0, `rgba(255,80,64,${(0.6 * a * p).toFixed(3)})`); g.addColorStop(1, 'rgba(255,80,64,0)');
    ctx.fillStyle = g; ctx.fillRect(x - R, y - R, 2 * R, 2 * R);
    dot(ctx, x, y, 4, '#FF5A4A', a * p);
  }
}
// One row: laser, c boxes, sensor, in the transform X. o: c, the readout (from, to, m, a), the scattering and glow.
function drawLabRow(ctx, X, o, alpha) {
  if (alpha <= 0.003) return;
  const L = labLayout(o.c), ln2 = Math.LN2 / LAB.BW;
  ctx.save(); ctx.translate(X.ox, X.oy); ctx.scale(X.s, X.s); ctx.globalAlpha *= alpha;
  const ga = ctx.globalAlpha;
  for (const b of L.boxes) {
    if (b.a <= 0.003) continue;
    const B = { x0: b.x0, x1: b.x0 + LAB.BW, top: LAB.top, bot: LAB.bot };
    ctx.save(); ctx.globalAlpha = ga * b.a; ctx.beginPath(); ctx.roundRect(B.x0, B.top, LAB.BW, B.bot - B.top, 16); ctx.clip();
    BOXDRAW.stuff(ctx, B); drawScatter(ctx, B, o.scat || 0); drawGlow(ctx, B, o.glow || 0);
    ctx.restore();
  }
  // the beam: every box it crosses takes half of what enters it
  const T = (x) => { let tau = 0; for (const b of L.boxes) tau += b.a * ln2 * clamp(x - b.x0, 0, LAB.BW); return Math.exp(-tau); }, knots = [];
  for (const b of L.boxes) knots.push(b.x0, b.x0 + LAB.BW);
  drawBeam(ctx, L.laser, L.sensor - 18, 0, SH.color, SH.I0 * (1 - 0.45 * (o.glow || 0)), T, knots);
  for (const b of L.boxes) {
    if (b.a <= 0.003) continue;
    ctx.save(); ctx.globalAlpha = ga * b.a; ctx.strokeStyle = COL.greyA; ctx.lineWidth = 4; ctx.beginPath(); ctx.roundRect(b.x0, LAB.top, LAB.BW, LAB.bot - LAB.top, 16); ctx.stroke(); ctx.restore();
  }
  drawLaser(ctx, L.laser, 0, SH.color, 1);
  drawSensor(ctx, L.sensor, 0, SH.color, T(L.sensor - 18) * SH.I0);
  drawLabReadout(ctx, L.sensor, o.from, o.to, o.m, o.read);
  ctx.restore();
}
// Beats 26–29: e^{−σd} at the top; under it a plot of the light that gets through against the distance d, in box
// lengths, so the curve passes 50%, 25% and 12.5% at one, two and three boxes; under the plot, the box, its left end
// at the plot's 0 and its right end under the dot, with the laser before it and the sensor after it.
const LP = { L: 520, R: 1440, T: 250, B: 560, top: 690, bot: 870, beam: 780, size: 100, y: 140 };
let LPA = null;
const lpAxes = () => LPA || (LPA = makeAxes({ L: LP.L, R: LP.R, T: LP.T, B: LP.B, xr: [0, 4, 1], yr: [0, 1, 0.5], ext: 40, xl: 'd', yl: '', labSize: 54, numSize: 28 }));
const PFML = String.raw`e^{-\htmlClass{t-sig}{\sigma}\,d}`, PFML1 = PFML + String.raw`\mathrel{\htmlClass{t-eq1}{=}}\htmlClass{t-eq1}{1}`;
let lpFml = null;
function lpFormula() {   // laid out once: e^{−σd} centred, "= 1" after it, so it doesn't move when that comes in
  if (lpFml) return lpFml;
  const sp = place(tex(PFML1), { x: 960 - (tex(PFML).w * LP.size) / 2, y: LP.y, size: LP.size, ax: 0 });
  return (lpFml = { main: sp.filter((s) => !s.a.terms.includes('t-eq1')), eq1: sp.filter((s) => s.a.terms.includes('t-eq1')) });
}
// the long box's stuff: a jittered grid, 48 across by 4 down, twice over (the second set comes in as σ passes its usual value)
const LPSPECKS = Array.from({ length: 384 }, (_, i) => { const k = i % 192, c = k % 48, r = Math.floor(k / 48); return [(c + 0.15 + 0.7 * hash1(i * 3 + 1)) / 48, (r + 0.15 + 0.7 * hash1(i * 3 + 2)) / 4, hash1(i * 3 + 3) * 2 * Math.PI]; });
function drawLabPlot(ctx, st) {
  const a = 1 - smooth(clamp(st.plotOut, 0, 1)); if (a <= 0.003 || st.fml <= 0.003) return;
  const A = lpAxes(), F = lpFormula(), sig = Math.max(0, st.sig) * Math.LN2, f = (x) => Math.exp(-sig * x), ax = smooth(clamp(st.axC, 0, 1));
  TERM_COL['t-sig'] = hexRgb(COL.yellow);
  drawSprites(ctx, F.main, { p: st.fml, alpha: a, hi: { 't-sig': smooth(clamp(st.sigHi, 0, 1)) } });
  if (st.eq1 > 0.003) drawSprites(ctx, F.eq1, { alpha: a * smooth(clamp(st.eq1, 0, 1)) });
  if (ax <= 0.003) return;
  ctx.save(); ctx.globalAlpha = a;
  drawAxes(ctx, A, { c: ax, nums: 0, lab: ax });
  for (const [v, s] of [[1, '100%'], [0.5, '50%']]) drawTex(ctx, String.raw`\text{${s.replace('%', '\\%')}}`, A.ox - 22, A.Y(v), 28, { ax: 1, alpha: ax });
  const d = clamp(st.dotD, 0, 4), X0 = A.X(0), Xd = A.X(d), y = LP.beam, H = LP.bot - LP.top;
  drawCurve(ctx, A, f, { p: clamp(st.curveTo, 0, 4) / 4, from: 0, to: 4, color: SH.color, width: 6 });
  // the box, as long as the dot is far; its stuff as dense as σ says, gone when σ is 0
  const ra = clamp(st.sig, 0, 1), rb = clamp(st.sig - 1, 0, 1), w = Xd - X0;
  if (w > 1) {
    ctx.save(); ctx.globalAlpha = a * ax; ctx.beginPath(); ctx.roundRect(X0, LP.top, w, H, Math.min(12, w / 2)); ctx.clip();
    const g = ctx.createLinearGradient(0, LP.top, 0, LP.bot); g.addColorStop(0, `rgba(170,164,152,${(0.09 * Math.min(2, st.sig)).toFixed(3)})`); g.addColorStop(1, `rgba(170,164,152,${(0.15 * Math.min(2, st.sig)).toFixed(3)})`);
    ctx.fillStyle = g; ctx.fillRect(X0, LP.top, w, H);
    LPSPECKS.forEach(([u, v, ph], i) => {
      const al = i < 192 ? ra : rb; if (al <= 0.003) return;
      const x = X0 + 10 + u * (A.X(4) - X0 - 20) + (reduced ? 0 : 4 * Math.sin(TIME * 0.9 + ph)), yy = LP.top + 10 + v * (H - 20) + (reduced ? 0 : 4 * Math.cos(TIME * 0.7 + 1.3 * ph));
      dot(ctx, x, yy, 3, COL.yellow, 0.62 * al);
    });
    ctx.restore();
  }
  const T = (x) => Math.exp(-sig * (clamp(x, X0, Xd) - X0) / A.sx), xs = Xd + 46;
  ctx.save(); ctx.globalAlpha = a * ax;
  drawBeam(ctx, X0 - 26, xs - 11, y, SH.color, SH.I0, T, [X0, Xd]);
  if (w > 1) { ctx.strokeStyle = COL.greyA; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(X0, LP.top, w, H, Math.min(12, w / 2)); ctx.stroke(); }
  ctx.save(); ctx.translate(X0 - 26, y); ctx.scale(0.6, 0.6); drawLaser(ctx, 0, 0, SH.color, 1); ctx.restore();
  ctx.save(); ctx.translate(xs, y); ctx.scale(0.6, 0.6); drawSensor(ctx, 0, 0, SH.color, f(d) * SH.I0); ctx.restore();
  const v = f(d) * 100; drawNumber(ctx, v, xs + 30, y - 44, { size: 44, dec: v < 9.95 && v > 0.05 ? 1 : 0, suffix: '%', alpha: a * ax });
  // the dot riding the curve, and a faint line down to the box's end: the same d in both
  if (st.curveTo > 0.003) {
    const px = A.X(d), py = A.Y(f(d));
    dashed(ctx, px, py + 12, px, LP.top - 4, COL.greyC, 0.8, 2);
    dot(ctx, px, py, 11, SH.color, 1);
  }
  ctx.restore();
  ctx.restore();
}
// Beat 30: any base will do: 2, 3, 10, …, each rewritten with base e (a different constant in the exponent).
const LB = { rows: [330, 480, 630], lx: 700, rx: 1240, size: 84, dots: 770 };
const LBL = [String.raw`2^{-a d}`, String.raw`3^{-b d}`, String.raw`10^{-c d}`], LBR = [String.raw`e^{-a' d}`, String.raw`e^{-b' d}`, String.raw`e^{-c' d}`];
let lbSp = null;
function lbSprites() {
  if (lbSp) return lbSp;
  const L = LBL.map((s, i) => place(tex(s), { x: LB.lx, y: LB.rows[i], size: LB.size })), R = LBR.map((s, i) => place(tex(s), { x: LB.rx, y: LB.rows[i], size: LB.size }));
  return (lbSp = { L, R, plans: L.map((sp, i) => reshapePlan(sp, R[i])) });
}
function drawLabBases(ctx, st) {
  if (st.bStack <= 0.003) return;
  const S = lbSprites(), a = 1;
  S.L.forEach((sp, i) => { const p = clamp((st.bStack - i * 0.25) / 0.5, 0, 1); if (p > 0.003) drawSprites(ctx, sp, { p, alpha: a }); });
  const dp = clamp((st.bStack - 0.75) / 0.25, 0, 1);
  if (dp > 0.003) drawTex(ctx, String.raw`\vdots`, LB.lx, LB.dots, LB.size, { alpha: dp });
  const ar = smooth(clamp(st.bArrow, 0, 1));
  if (ar > 0.003) {
    const x0 = 880, x1 = lerp(x0, 1070, ar), y = LB.rows[1];
    ctx.save(); ctx.strokeStyle = COL.greyB; ctx.fillStyle = COL.greyB; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1 - 16, y); ctx.stroke(); arrowTip(ctx, x1, y, 1, 0, 24, 11); ctx.restore();
  }
  S.plans.forEach((P, i) => {
    const m = clamp((st.bMorph - i * 0.25) / 0.5, 0, 1); if (m <= 0.001) return;
    if (m >= 0.999) drawSprites(ctx, S.R[i], { alpha: a }); else drawReshape(ctx, P, m, a);
  });
  const dr = clamp((st.bMorph - 0.75) / 0.25, 0, 1);
  if (dr > 0.003) drawTex(ctx, String.raw`\vdots`, LB.rx, LB.dots, LB.size, { alpha: dr });
}
// Beats 24 and 31: me again, in the corner, with a thought.
function drawLabFigure(ctx, st) {
  const a = smooth(clamp(st.lfig, 0, 1)); if (a <= 0.003) return;
  const fx = 150, fy = 965, fs = 0.85;
  drawFigure(ctx, fx, fy, fs, a);
  drawThinking(ctx, fx + 110, fy - 300, 0.75, 74, '', st.lthink, 1, st.lthinkP, a, figHead(fx, fy, fs));
}
function drawLab(ctx, dt, st) {
  if (st.labOn > 0.003) {
    const out = 1 - smooth(clamp(st.rowsOut, 0, 1)), x = smooth(clamp(st.labX, 0, 1)), sp = smooth(clamp(st.split, 0, 1));
    const X1 = mixXf(mixXf(labCardXf(st), LABXF.full, x), LABXF.top, sp);
    drawLabRow(ctx, X1, { c: 1, scat: st.scat, glow: st.glow, from: '', to: '50%', m: 1, read: smooth(clamp(st.read1, 0, 1)) }, out);
    if (sp > 0.003) drawLabRow(ctx, mixXf(LABXF.full, LABXF.bot, sp), { c: st.c2, from: st.r2From, to: st.r2, m: st.r2M, read: smooth(clamp(st.read1, 0, 1)) }, out);
  }
  drawLabPlot(ctx, st);
  drawLabBases(ctx, st);
  drawLabFigure(ctx, st);
}

// ---- the beats ----
// a sequence of steps that stops where it is if the presentation is rebuilt (a step back) in the middle of it
const labAlive = (g) => g === PRES.gen;
// 21: the field cards and the caption go, the box grows out of its card to fill the stage, and it scatters
function labScatter() {
  ptw('usesOut', 1, 0.6); ptw('capOut', 1, 0.6); PS.labOn = 1;
  ptw('labX', 1, 1.4, { delay: 0.2 });
  return ptw('scat', 1, 1.0, { delay: 1.4 });
}
// 21b: it stops scattering; every speck glows red, the beam a little dimmer so the glow shows
function labGlow() { ptw('scat', 0, 0.6); return ptw('glow', 1, 1.0, { delay: 0.4 }); }
// 21c: the glow goes: only absorption
function labAbsorb() { return ptw('glow', 0, 0.9); }
// 22: the sensor's reading, for the first time
function labRead() { return ptw('read1', 1, 0.8); }
function labRead2(text, dur, delay = 0) { PS.r2From = PS.r2; PS.r2 = text; PS.r2M = 0; return ptw('r2M', 1, dur, { delay, ease: linear }); }
// 23: the whole setup is copied, the copy slides down, a second box slides in beside its first, and its reading turns into "?"
async function labSecond() {
  const g = PRES.gen; PS.r2 = '50%'; PS.r2From = ''; PS.r2M = 1;
  await ptw('split', 1, 1.3); if (!labAlive(g)) return;
  await ptw('c2', 2, 1.4); if (!labAlive(g)) return;
  await labRead2('?', 0.8);
}
// 24: me, guessing zero
function labGuess() { PS.lthink = '0\\%'; PS.lthinkP = 0; ptw('lfig', 1, 0.8); return ptw('lthinkP', 1, 0.6, { delay: 0.7, ease: linear }); }
// 25: no: twenty-five; 25b: a third box, twelve and a half
function labReveal() { ptw('lfig', 0, 0.6); return labRead2('25%', 0.9, 0.3); }
async function labThird() { const g = PRES.gen; await ptw('c2', 3, 1.4); if (labAlive(g)) await labRead2('12.5%', 0.9); }
// 26: the rows go; e^{−σd} writes in, the plot under it, and the curve draws with its dot, the box growing under it
async function labFormula() {
  ptw('rowsOut', 1, 0.7); ptw('fml', 1, 1.2, { delay: 0.5, ease: linear }); ptw('axC', 1, 1.0, { delay: 1.2 });
  PS.dotD = 0; PS.curveTo = 0;
  ptw('curveTo', 4, 3.2, { delay: 2.2 }); await ptw('dotD', 4, 3.2, { delay: 2.2 });
}
// 27: the dot runs back and forth along the curve, the box with it; it stops at two boxes
async function labDistance() {
  const g = PRES.gen;
  for (const [d, t] of [[0.5, 1.7], [3.4, 1.9], [2, 1.1]]) { await ptw('dotD', d, t); if (!labAlive(g)) return; }
}
// 28: σ lights up and goes up: denser stuff, a steeper curve; 28b: down; 29: to zero, and "= 1"
function labSigmaUp() { ptw('sigHi', 1, 0.5); return ptw('sig', 2, 1.6, { delay: 0.5 }); }
function labSigmaDown() { return ptw('sig', 0.5, 1.9); }
function labVacuum() { ptw('eq1', 1, 0.8, { delay: 1.4 }); return ptw('sig', 0, 1.8); }
// 30: the plot and the formula go; 2, 3, 10 … each rewritten with base e
function labBases() {
  ptw('plotOut', 1, 0.7);
  ptw('bStack', 1, 1.6, { delay: 0.6, ease: linear }); ptw('bArrow', 1, 0.7, { delay: 2.3 });
  return ptw('bMorph', 1, 2.4, { delay: 2.8, ease: linear });
}
// 31: me again: but why exponential?
function labWhy() { PS.lthink = 'but why exponential?'; PS.lthinkP = 0; ptw('lfig', 1, 0.8); return ptw('lthinkP', 1, 1.0, { delay: 0.7, ease: linear }); }
