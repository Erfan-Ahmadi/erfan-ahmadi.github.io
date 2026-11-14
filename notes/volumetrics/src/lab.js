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
// c boxes (fractional while one slides in from the right): the boxes stay centred, the laser and sensor move out. g, lg
// and sg: the gaps between the boxes and to the laser and the sensor (beat 26 closes them up).
function labLayout(c, g = LAB.G, lg = LAB.laserGap, sg = LAB.sensorGap) {
  const T = c * LAB.BW + (c - 1) * g, boxes = [];
  for (let k = 0; k < Math.max(1, Math.ceil(c - 1e-6)); k++) {
    const a = clamp(c - k, 0, 1);
    boxes.push({ x0: -T / 2 + k * (LAB.BW + g) + (1 - smooth(a)) * 1000, a });
  }
  return { laser: -T / 2 - lg, sensor: T / 2 + sg, boxes };
}
// The same, but a box coming in (the fraction of c) doesn't slide in from the right, across the sensor: the row first
// makes room for it (the boxes re-centring, the sensor moving out), and then it drops into its place from just above,
// fading in (the halving, 25e–25f).
function labLayoutDrop(c, g = LAB.G, lg = LAB.laserGap, sg = LAB.sensorGap) {
  const k = Math.floor(c + 1e-6), a = clamp(c - k, 0, 1), lp = smooth(clamp(a / 0.6, 0, 1)), ap = smooth(clamp((a - 0.45) / 0.55, 0, 1));
  const n = k + lp, T = n * LAB.BW + (n - 1) * g, boxes = [];
  for (let i = 0; i < k; i++) boxes.push({ x0: -T / 2 + i * (LAB.BW + g), a: 1 });
  if (a > 1e-6) boxes.push({ x0: -T / 2 + k * (LAB.BW + g), a: ap, dy: -70 * (1 - ap) });
  return { laser: -T / 2 - lg, sensor: T / 2 + sg, boxes };
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
// The sensor's readout: a box over the sensor, joined to it by a line, its text reshaping when it changes. pop: it
// grows into place as it comes in.
function drawLabReadout(ctx, xs, from, to, m, a, pop = false) {
  if (a <= 0.003) return;
  const bw = 210, bh = 92, by = -48 - 44 - bh, k = pop ? lerp(0.55, 1, a) : 1;
  ctx.save(); if (k !== 1) { ctx.translate(xs, -48); ctx.scale(k, k); ctx.translate(-xs, 48); }
  ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = COL.greyB; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(xs, -48); ctx.lineTo(xs, by + bh); ctx.stroke();
  ctx.fillStyle = BG; ctx.beginPath(); ctx.roundRect(xs - bw / 2, by, bw, bh, 12); ctx.fill(); ctx.stroke(); ctx.restore();
  ctx.save(); ctx.translate(xs, by + bh / 2 + 3); drawMorphText(ctx, from, to, m, a); ctx.restore();
  ctx.restore();
}
// Beat 21: what we leave out, shown on the box itself. Scattering (21b): the beam hits the specks in its path (pictures.js
// keeps them on it); from each, a ray of its light leaves in some direction, and every speck it meets on the way sends
// it off in a new one: a few bounces, each a little dimmer, until it leaves the box. Every second or so another ray
// leaves each of them, each its own way; the stuff around the beam turns faintly red. Emission (21c): every speck
// glows red on its own.
const hash1 = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const SCAT = { hitR: 16, maxB: 4, speed: 430, trail: 240, keep: 0.65 };   // hitR: how close a ray must pass a speck to hit it; keep: what a bounce keeps
const SCHIT = [...BEAMSPECK];
// A ray's path from beam speck h: indices of the specks it bounces off, then the way out. Worked out on the specks'
// resting places, so it is the same every frame; drawn through where they are now.
function scatterPath(B, h, seed) {
  const W = B.x1 - B.x0, H = B.bot - B.top, at = (i) => [B.x0 + 16 + BOXSPECKS[i][0] * (W - 32), B.top + 16 + BOXSPECKS[i][1] * (H - 32)];
  const side = hash1(seed + 1) < 0.5 ? -1 : 1, pts = [h];
  let th = side * (0.35 + hash1(seed + 2) * (Math.PI - 0.7)), cur = h, prev = -1, [px, py] = at(h);   // first: anywhere but along the beam
  for (let k = 0; ; k++) {
    const dx = Math.cos(th), dy = Math.sin(th);
    let best = -1, bt = Infinity;
    if (k < SCAT.maxB) for (let j = 0; j < BOXSPECKS.length; j++) {
      if (j === cur || j === prev) continue;
      const [qx, qy] = at(j), rx = qx - px, ry = qy - py, t = rx * dx + ry * dy;
      if (t > 24 && t < bt && Math.abs(rx * dy - ry * dx) < SCAT.hitR) { best = j; bt = t; }
    }
    if (best < 0) {   // nothing more in the way: out through the wall, and a little past it (the box clips it)
      const tx = dx > 1e-6 ? (B.x1 - px) / dx : dx < -1e-6 ? (B.x0 - px) / dx : Infinity, ty = dy > 1e-6 ? (B.bot - py) / dy : dy < -1e-6 ? (B.top - py) / dy : Infinity;
      return { pts, dx, dy, out: Math.min(tx, ty) + 40 };
    }
    pts.push(best); prev = cur; cur = best; [px, py] = at(best);
    th = 2 * Math.PI * hash1(seed + 11 + 7 * k);   // off again, any way at all
  }
}
const speckAt = (B, i) => { const [u, v, ph, jy] = BOXSPECKS[i]; return speckXY(B, u, v, ph, jy); };
function drawScatter(ctx, B, a) {
  if (a <= 0.003) return;
  // the red haze along the beam: light scattered out of it, lighting up the stuff around it
  const g = ctx.createLinearGradient(0, -160, 0, 160);
  g.addColorStop(0, 'rgba(255,59,48,0)'); g.addColorStop(0.5, `rgba(255,59,48,${(0.1 * a).toFixed(3)})`); g.addColorStop(1, 'rgba(255,59,48,0)');
  ctx.fillStyle = g; ctx.fillRect(B.x0, -160, B.x1 - B.x0, 320);
  const t = reduced ? 0 : TIME, red = (al) => `rgba(255,70,58,${clamp(al, 0, 1).toFixed(3)})`;
  ctx.save(); ctx.lineCap = 'round';
  SCHIT.forEach((h) => {
    const [hx, hy] = speckAt(B, h), R = 16, gg = ctx.createRadialGradient(hx, hy, 0, hx, hy, R);   // the speck lit where the beam hits it
    gg.addColorStop(0, red(0.6 * a)); gg.addColorStop(1, red(0));
    ctx.fillStyle = gg; ctx.fillRect(hx - R, hy - R, 2 * R, 2 * R);
    const P = 1.3 + 0.5 * hash1(h * 5 + 1), off = P * hash1(h * 5 + 2);
    for (const back of reduced ? [0] : [0, 1, 2]) {   // this ray, and the ones before it, which may still be on their way out
      const c = Math.floor((t + off) / P) - back, path = scatterPath(B, h, h * 7919 + c * 104729);
      const Q = path.pts.map((i) => speckAt(B, i)), [lx, ly] = Q[Q.length - 1];
      Q.push([lx + path.dx * path.out, ly + path.dy * path.out]);
      const S = [0]; for (let k = 1; k < Q.length; k++) S.push(S[k - 1] + Math.hypot(Q[k][0] - Q[k - 1][0], Q[k][1] - Q[k - 1][1]));
      // how far its front has come, and the stretch behind it that still shows (all of it, and evenly, if motion is reduced)
      const head = reduced ? S[S.length - 1] : SCAT.speed * (t + off - c * P), trail = reduced ? 1e6 : SCAT.trail, al = (s) => clamp((s - head + trail) / trail, 0, 1);
      if (head - trail > S[S.length - 1] || head <= 0) continue;
      for (let k = 0; k + 1 < Q.length; k++) {
        const lo = Math.max(S[k], head - trail), hi = Math.min(S[k + 1], head), L = S[k + 1] - S[k], b = a * 0.95 * Math.pow(SCAT.keep, k);
        if (k > 0 && head >= S[k]) {   // the speck it bounced off flashes as it's hit
          const f = 1 - (head - S[k]) / (0.45 * SCAT.speed), [fx, fy] = Q[k];
          if (f > 0 && !reduced) { const fg = ctx.createRadialGradient(fx, fy, 0, fx, fy, 14); fg.addColorStop(0, red(0.7 * b * f)); fg.addColorStop(1, red(0)); ctx.fillStyle = fg; ctx.fillRect(fx - 14, fy - 14, 28, 28); }
        }
        if (hi <= lo || L <= 0) continue;
        const [x0, y0] = Q[k], [x1, y1] = Q[k + 1], f0 = (lo - S[k]) / L, f1 = (hi - S[k]) / L;
        const ax = lerp(x0, x1, f0), ay = lerp(y0, y1, f0), bx = lerp(x0, x1, f1), by = lerp(y0, y1, f1), rg = ctx.createLinearGradient(ax, ay, bx, by);
        rg.addColorStop(0, red(b * al(lo))); rg.addColorStop(1, red(b * al(hi)));
        ctx.strokeStyle = rg; ctx.lineWidth = 3.2; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
      }
    }
  });
  ctx.restore();
}
function drawGlow(ctx, B, a) {
  if (a <= 0.003) return;
  for (const [u, v, ph, jy] of BOXSPECKS) {
    const [x, y] = speckXY(B, u, v, ph, jy), p = reduced ? 1 : 0.85 + 0.15 * Math.sin(2.2 * TIME + ph * 3), R = 26;
    const g = ctx.createRadialGradient(x, y, 0, x, y, R); g.addColorStop(0, `rgba(255,80,64,${(0.6 * a * p).toFixed(3)})`); g.addColorStop(1, 'rgba(255,80,64,0)');
    ctx.fillStyle = g; ctx.fillRect(x - R, y - R, 2 * R, 2 * R);
    dot(ctx, x, y, 4, '#FF5A4A', a * p);
  }
}
// The × ½ of the halving (beats 25d–25f), in the red of the wrong sum's − 50% in beat 24, the red of light taken away:
// minus a half becomes times a half. Amounts of light (100%, 50%, …) in lavender, a colour of their own: yellow is σ's,
// blue x's.
const AMTCOL = COL.lavender;
const LHALF = String.raw`\textcolor{${COL.red}}{\times \tfrac{1}{2}}`, LRES = (v) => String.raw`\textcolor{${AMTCOL}}{${v}\%}`;
// One row: laser, c boxes, sensor, in the transform X. o: c, the readout (from, to, m, a), the scattering and glow;
// myst hides what happens past the first box behind a row of "?" (the light past it is the question), and rev is how
// far the beam has come back past the first box once the answer is shown.
// From 21d the light past the stuff is drawn dimmer than it really is, and the readouts stay true: to the eye, half the
// light hardly looks dimmer, so the beam shows about its square instead (floor: a little left over, so it never quite
// goes out). PS.lie: how far that has come in.
const LIE = { floor: 0.05 };
const lieT = (T) => { const l = smooth(clamp(PS.lie || 0, 0, 1)); return l <= 0.001 ? T : (x) => { const t = T(x); return lerp(t, LIE.floor + (1 - LIE.floor) * t * t, l); }; };
function drawLabRow(ctx, X, o, alpha) {
  if (alpha <= 0.003) return;
  const L = (o.drop ? labLayoutDrop : labLayout)(o.c, o.g, o.lg, o.sg), ln2 = Math.LN2 / LAB.BW;
  ctx.save(); ctx.translate(X.ox, X.oy); ctx.scale(X.s, X.sy ?? X.s); ctx.globalAlpha *= alpha;
  const ga = ctx.globalAlpha;
  for (const b of L.boxes) {
    if (b.a <= 0.003) continue;
    const B = { x0: b.x0, x1: b.x0 + LAB.BW, top: LAB.top + (b.dy || 0), bot: LAB.bot + (b.dy || 0) };
    ctx.save(); ctx.globalAlpha = ga * b.a; ctx.beginPath(); ctx.roundRect(B.x0, B.top, LAB.BW, B.bot - B.top, 16); ctx.clip();
    BOXDRAW.stuff(ctx, B); drawScatter(ctx, B, o.scat || 0); drawGlow(ctx, B, o.glow || 0);
    ctx.restore();
  }
  // the beam: every box it crosses takes half of what enters it
  const T = (x) => { let tau = 0; for (const b of L.boxes) tau += b.a * ln2 * clamp(x - b.x0, 0, LAB.BW); return Math.exp(-tau); }, knots = [];
  for (const b of L.boxes) knots.push(b.x0, b.x0 + LAB.BW);
  // cut: where the second box begins (the first box's end and the gap after it), past which the light is the question
  const power = SH.I0 * (1 - 0.45 * (o.glow || 0)), cut = L.boxes[0].x0 + LAB.BW + LAB.G, end = L.sensor - 18, myst = clamp(o.myst || 0, 0, 1);
  const front = lerp(cut, end, clamp(o.rev ?? 1, 0, 1)), past = 1 - smooth(myst);
  drawBeam(ctx, L.laser, cut + 0.5, 0, SH.color, power, lieT(T), knots);   // through the first box, as we know it
  if (front > cut + 1 && past > 0.003) drawBeam(ctx, cut, front, 0, SH.color, power * past, lieT(T), knots);
  if (myst > 0.003) {   // past it, only questions, drifting a little
    const x0 = cut + 45, x1 = end - 30, n = Math.max(3, Math.round((x1 - x0) / 72));
    for (let i = 0; i <= n; i++) {
      const x = lerp(x0, x1, i / n), al = smooth(myst) * clamp(myst * (n + 2) - i * 0.7, 0, 1), dy = reduced ? 0 : 7 * Math.sin(2 * TIME + i * 1.3);
      if (al <= 0.003) continue;
      ctx.save(); ctx.translate(x, dy); drawSprites(ctx, labTxt('?', 34), { alpha: 0.8 * al, color: hexRgb(COL.greyB) }); ctx.restore();
    }
  }
  for (const b of L.boxes) {
    if (b.a <= 0.003) continue;
    ctx.save(); ctx.globalAlpha = ga * b.a; ctx.strokeStyle = COL.greyA; ctx.lineWidth = 4; ctx.beginPath(); ctx.roundRect(b.x0, LAB.top + (b.dy || 0), LAB.BW, LAB.bot - LAB.top, 16); ctx.stroke(); ctx.restore();
  }
  drawLaser(ctx, L.laser, 0, SH.color, 1);
  drawSensor(ctx, L.sensor, 0, SH.color, front >= end - 1 ? T(end) * SH.I0 * past : 0);
  drawLabReadout(ctx, L.sensor, o.from, o.to, o.m, o.read, o.pop);
  ctx.restore();
}
// Beats 26–29: e^{−σx} at the top; under it a plot of the light that gets through against the distance x, in box
// lengths up to three, so the curve passes 50%, 25% and 12.5% at one, two and three boxes, ending where the three
// boxes did; under the plot, the box, its left end at the plot's 0 and its right end under the dot, with the laser
// before it and the sensor after it.
const LP = { L: 520, R: 1440, T: 250, B: 560, top: 690, bot: 870, beam: 780, size: 100, y: 150 }, LPD = 3;   // LPD: the plot's length, in boxes
let LPA = null;
const lpAxes = () => LPA || (LPA = makeAxes({ L: LP.L, R: LP.R, T: LP.T, B: LP.B, xr: [0, LPD, 1], yr: [0, 1, 0.5], ext: 40, xl: 'x', yl: '', labSize: 54, numSize: 28 }));
// at 29, with σ gone to zero, σ itself turns into a 0, in its yellow (e^{−0x}), and then "= 1" comes after it
const PFML = String.raw`e^{-\htmlClass{t-sig}{\sigma}\,\htmlClass{t-ld}{x}}`, PFMLZ = String.raw`e^{-\htmlClass{t-sig}{0}\,\htmlClass{t-ld}{x}}\mathrel{\htmlClass{t-eq2}{=}}\mathord{\htmlClass{t-eq2}{1}}`;
let lpFml = null;
function lpFormula() {   // laid out once: e^{−σx} centred; e^{−0x} = 1 from the same e, so nothing moves but what changes
  if (lpFml) return lpFml;
  const has = (s, t) => s.a.terms.includes(t), first = (S) => S.reduce((m, s) => (s.x < m.x ? s : m));
  const main = place(tex(PFML), { x: 960 - (tex(PFML).w * LP.size) / 2, y: LP.y, size: LP.size, ax: 0 }), [l, r, t, b] = inkSpan(main), e = first(main);
  let zs = place(tex(PFMLZ), { x: 0, y: LP.y, size: LP.size, ax: 0 }); const ze = first(zs); zs = zs.map((s) => shifted(s, e.x - ze.x, e.base - ze.base));
  const col = (S) => S.map((s) => ({ ...s, color: has(s, 't-sig') ? hexRgb(COL.yellow) : has(s, 't-ld') ? hexRgb(LDCOL) : s.color }));   // as they look by then
  const zero = col(zs.filter((s) => !has(s, 't-eq2')));
  // c: the middle of e^{−σx}'s ink, for 29b; e: its e, the first thing in it; zero, zplan: e^{−0x}, and σ turning into its 0
  return (lpFml = { main, eq2: zs.filter((s) => has(s, 't-eq2')), zero, zplan: matchPlan(col(main), zero), c: [(l + r) / 2, (t + b) / 2], e });
}
const inkSpan = (S) => S.reduce(([l, r, t, b], s) => { const [q0, q1, q2, q3] = inkBox(s); return [Math.min(l, q0), Math.max(r, q1), Math.min(t, q2), Math.max(b, q3)]; }, [Infinity, -Infinity, Infinity, -Infinity]);
// 29b: everything but e^{−σx} goes (eOnly), the formula comes down to the middle of the stage (eMove, its ink's middle
// to x = 960, y = LE.y) and a box goes around its e (eBox), in the orange and the style of the hook's "Why e?" box (beat
// 14), the question this answers; the e grows a little in it and the exponent greys a little.
// With the box, the e grows a little (grow) and the exponent loses some of its colour (grey: how far toward grey).
const LE = { y: 500, grow: 0.25, grey: 0.5, shift: 10 };   // shift: how far the exponent moves over to make room
function drawLabE(ctx, F, a, eb) {
  const [l, r, t, b] = inkBox(F.e), cy = (t + b) / 2, ke = 1 + LE.grow * eb, L = r - (r - l) * ke, T = cy - (cy - t) * ke, B = cy + (b - cy) * ke, px = 9, py = 12;   // around the e as it grows; a little tighter across, clear of the exponent's minus
  ctx.save(); ctx.strokeStyle = hexA(COL.gold, a * eb); ctx.lineWidth = 3.5; ctx.beginPath(); ctx.roundRect(L - px, T - py, r - L + 2 * px, B - T + 2 * py, 10); ctx.stroke(); ctx.restore();
}
// the long box's stuff: a jittered grid, 40 across by 4 down, twice over (the second set comes in as σ passes its usual value)
const LPSPECKS = Array.from({ length: 320 }, (_, i) => { const k = i % 160, c = k % 40, r = Math.floor(k / 40); return [(c + 0.15 + 0.7 * hash1(i * 3 + 1)) / 40, (r + 0.15 + 0.7 * hash1(i * 3 + 2)) / 4, hash1(i * 3 + 3) * 2 * Math.PI]; });
function drawLabPlot(ctx, st) {
  const a = 1 - smooth(clamp(st.plotOut, 0, 1)); if (a <= 0.003 || st.fml <= 0.003) return;
  const A = lpAxes(), F = lpFormula(), sig = Math.max(0, st.sig) * Math.LN2, f = (x) => Math.exp(-sig * x), ax = smooth(clamp(st.axC, 0, 1)), Fo = labFocus(st);
  TERM_COL['t-sig'] = hexRgb(COL.yellow);
  const rest = a * (1 - smooth(clamp(st.eOnly || 0, 0, 1))), em = smooth(clamp(st.eMove || 0, 0, 1)), eb = smooth(clamp(st.eBox || 0, 0, 1));   // 29b: all but e^{−σx} goes (rest)
  ctx.save(); if (em > 0.001) ctx.translate((960 - F.c[0]) * em, (LE.y - F.c[1]) * em);
  drawLabFormula(ctx, F, st, a);
  if (st.eq2 > 0.003) drawSprites(ctx, F.eq2, { alpha: rest * smooth(clamp(st.eq2, 0, 1)) });   // 29: "= 1" (eq1: σ turning into 0, in drawLabFormula)
  if (eb > 0.003) drawLabE(ctx, F, a, eb);
  ctx.restore();
  const bw = clamp(st.blW || 0, 0, 1), bo = 1 - smooth(clamp(st.blOut || 0, 0, 1));   // 26b: its name, for a moment
  if (bw > 0.003 && bo > 0.003) drawTex(ctx, String.raw`\text{the Beer–Lambert law}`, inkSpan(F.main)[1] + 80, LP.y + 8, 54, { ax: 0, p: bw, alpha: rest * bo, color: COL.greyA });
  const bA = st.pbox != null ? smooth(clamp(st.pbox, 0, 1)) : ax;   // the box, the light and the sensor: with the axes (the bench), or from the joined boxes (beat 26)
  if ((ax <= 0.003 && bA <= 0.003) || rest <= 0.003) return;
  ctx.save(); ctx.globalAlpha = rest;
  if (ax > 0.003) {
    drawAxes(ctx, A, { c: ax, nums: 0, lab: ax, xlColor: Fo.cd > 0.003 ? mixRgb(WHITE_RGB, hexRgb(LDCOL), Fo.cd) : null });
    for (const [v, s] of [[1, '100%'], [0.5, '50%']]) drawTex(ctx, String.raw`\text{${s.replace('%', '\\%')}}`, A.ox - 22, A.Y(v), 28, { ax: 1, alpha: ax });
  }
  const d = clamp(st.dotD, 0, LPD), X0 = A.X(0), Xd = A.X(d), y = LP.beam, H = LP.bot - LP.top;
  if (ax > 0.003) drawCurve(ctx, A, f, { p: clamp(st.curveTo, 0, LPD) / LPD, from: 0, to: LPD, color: SH.color, width: 6 });
  // the box, as long as the dot is far; its stuff as dense as σ says, gone when σ is 0
  const ra = clamp(st.sig, 0, 1), rb = clamp(st.sig - 1, 0, 1), w = Xd - X0;
  if (w > 1 && bA > 0.003) {
    ctx.save(); ctx.globalAlpha = a * bA; ctx.beginPath(); ctx.roundRect(X0, LP.top, w, H, Math.min(12, w / 2)); ctx.clip();
    const g = ctx.createLinearGradient(0, LP.top, 0, LP.bot); g.addColorStop(0, `rgba(170,164,152,${(0.09 * Math.min(2, st.sig)).toFixed(3)})`); g.addColorStop(1, `rgba(170,164,152,${(0.15 * Math.min(2, st.sig)).toFixed(3)})`);
    ctx.fillStyle = g; ctx.fillRect(X0, LP.top, w, H);
    LPSPECKS.forEach(([u, v, ph], i) => {
      const al = i < 160 ? ra : rb; if (al <= 0.003) return;
      const x = X0 + 10 + u * (A.X(LPD) - X0 - 20) + (reduced ? 0 : 4 * Math.sin(TIME * 0.9 + ph)), yy = LP.top + 10 + v * (H - 20) + (reduced ? 0 : 4 * Math.cos(TIME * 0.7 + 1.3 * ph));
      dot(ctx, x, yy, 3, COL.yellow, Math.min(1, 0.62 * al * (1 + 0.45 * Fo.s)));
    });
    ctx.restore();
  }
  const T = (x) => Math.exp(-sig * (clamp(x, X0, Xd) - X0) / A.sx), xs = Xd + 46;
  ctx.save(); ctx.globalAlpha = rest * bA;
  drawBeam(ctx, X0 - 26, xs - 11, y, SH.color, SH.I0, lieT(T), [X0, Xd]);
  if (w > 1) { ctx.strokeStyle = COL.greyA; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(X0, LP.top, w, H, Math.min(12, w / 2)); ctx.stroke(); }
  if (Fo.c > 0.003 && w > 1 && (st.ind10 || 0) < 0.5) {   // option 1: a brace under the box, x in its blue, stretching with it; while σ changes, σ in the box instead, in its yellow (option 10 draws its own)
    const sF = clamp(st.sAct || 0, 0, 1), al = Fo.c * (0.7 + 0.3 * clamp(st.dAct || 0, 0, 1)) * (1 - sF), cx = X0 + w / 2;
    if (al > 0.003) { drawBrace(ctx, cx, LP.bot + 16, w, 24, 6, hexRgb(LDCOL), al); drawTex(ctx, 'x', cx, LP.bot + 84, 60, { alpha: al, color: LDCOL }); }
    if (Fo.s > 0.003) {   // in the upper half, over the specks, on a little shade so it reads among them
      const sy = LP.top + 46, sg = ctx.createRadialGradient(cx, sy, 0, cx, sy, 42);
      sg.addColorStop(0, `rgba(28,27,24,${(0.8 * Fo.s).toFixed(3)})`); sg.addColorStop(1, 'rgba(28,27,24,0)');
      ctx.fillStyle = sg; ctx.fillRect(cx - 42, sy - 42, 84, 84);
      drawTex(ctx, String.raw`\sigma`, cx, sy, 64, { alpha: Fo.s, color: COL.yellow });
    }
  }
  const n10 = smooth(clamp(st.ind10 || 0, 0, 1));
  if (n10 > 0.003 && w > 1) {   // option 10, as option 1 shows them but with their values: x = … on the brace under the box, which gives way, while σ changes, to σ = … in the box, on a little shade
    // sPin (beat 29): σ's value stays written in the box once it has stopped, σ = 0 in the emptied box
    const cx = X0 + w / 2, as = n10 * Math.max(clamp(st.sAct || 0, 0, 1), smooth(clamp(st.sPin || 0, 0, 1))), ad = n10 * (0.7 + 0.3 * clamp(st.dAct || 0, 0, 1)) * (1 - clamp(st.sAct || 0, 0, 1)), dcol = mixRgb(WHITE_RGB, hexRgb(LDCOL), Fo.c);
    if (ad > 0.003) {
      drawBrace(ctx, cx, LP.bot + 16, w, 24, 6, dcol, ad);
      const dc = smooth(clamp(st.dCont ?? 1, 0, 1)), dl = `x = ${d.toFixed(1)}`;   // beat 26: first the count, 3 boxes; 26b: it becomes x = 3.0
      if (dc >= 0.999) drawTex(ctx, dl, cx, LP.bot + 84, 56, { alpha: ad, color: dcol });
      else {
        const sp = (src) => place(tex(src), { x: cx, y: LP.bot + 84, size: 56 }).map((q) => ({ ...q, color: dcol })), A0 = sp(String.raw`${hvPct(d)}\text{ boxes}`);
        if (dc <= 0.001) drawSprites(ctx, A0, { alpha: ad }); else drawMorph(ctx, matchPlan(A0, sp(dl)), dc, ad);
      }
    }
    if (as > 0.003) {
      const sv = Math.max(0, st.sig) * Math.LN2, src = String.raw`\sigma = ${sv < 0.005 ? '0' : sv.toFixed(2)}`, sy = LP.top + 46, tw = tex(src).w * 50;
      ctx.fillStyle = `rgba(28,27,24,${(0.72 * as).toFixed(3)})`; ctx.beginPath(); ctx.roundRect(cx - tw / 2 - 12, sy - 30, tw + 24, 60, 10); ctx.fill();
      drawTex(ctx, src, cx, sy, 50, { alpha: as, color: COL.yellow });
    }
  }
  ctx.save(); ctx.translate(X0 - 26, y); ctx.scale(0.6, 0.6); drawLaser(ctx, 0, 0, SH.color, 1); ctx.restore();
  ctx.save(); ctx.translate(xs, y); ctx.scale(0.6, 0.6); drawSensor(ctx, 0, 0, SH.color, f(d) * SH.I0); ctx.restore();
  const v = f(d) * 100, rd = smooth(clamp(st.readDim || 0, 0, 1)), dec = Math.abs(v - Math.round(v)) < 0.05 ? 0 : 1;   // 50%, 25%, 12.5%
  drawNumber(ctx, v, xs + 30, y - 44, { size: 44, dec, suffix: '%', color: rd > 0.5 ? COL.grey : COL.white, alpha: rest * bA * (1 - 0.15 * rd) });   // greyed a little when readDim is on, so the numbers elsewhere stand out
  // the dot on the curve, once the curve has reached it, and a faint line down to the box's end: the same x in both
  if (ax > 0.003 && st.curveTo > 0.003 && st.curveTo >= d - 1e-3) {
    const px = A.X(d), py = A.Y(f(d));
    dashed(ctx, px, py + 12, px, LP.top - 4, COL.greyC, 0.8, 2);
    if (px - 12 > A.X(0) + 2) dashed(ctx, px - 12, py, A.X(0), py, COL.greyC, 0.8, 2);   // and across to the y-axis: how much gets through
    dot(ctx, px, py, 11, SH.color, 1);
  }
  ctx.restore();
  drawLabMarks(ctx, st, A, f, rest);
  ctx.restore();
}
// Beats 21b–21d: what we leave out, written over the box: "No Scattering" (21b), "No Emission" under it (21c), and then
// the two turn into one, "Just Absorption" (21d, manim's TransformMatchingTex: the letters they share move over). It
// goes when the setup is copied (23).
function drawLabNoLabels(ctx, st, X) {
  const a = 1 - smooth(clamp(st.lbOut || 0, 0, 1)), ns = clamp(st.lbNS || 0, 0, 1), ne = clamp(st.lbNE || 0, 0, 1), m = smooth(clamp(st.lbJA || 0, 0, 1));
  if (a <= 0.003 || ns + ne <= 0.003) return;
  const k = X.s / 1.2, top = X.oy + X.s * LAB.top, size = 56 * k, at = (src, y) => place(tex(String.raw`\text{${src}}`), { x: X.ox, y, size });
  const A1 = at('No Scattering', top - 140 * k), A2 = at('No Emission', top - 72 * k);
  if (m <= 0.001) { drawSprites(ctx, A1, { p: ns, alpha: a }); if (ne > 0.003) drawSprites(ctx, A2, { p: ne, alpha: a }); }
  else { const B = at('Just Absorption', top - 106 * k); if (m >= 0.999) drawSprites(ctx, B, { alpha: a }); else drawMorph(ctx, matchPlan([...A1, ...A2], B), m, a); }
}
// Beats 26–26b: the halving's amounts (100% where the light goes in, then 50%, 25% and 12.5% where each box ended),
// over the joined box at 0, 1, 2 and 3 box lengths; at 26b they rise along dashed lines to their places on the curve,
// each a dot there with its amount beside it. They go at 27.
function drawLabMarks(ctx, st, A, f, a) {
  if (st.pbox == null) return;
  const al = a * (smooth(clamp(st.pbox, 0, 1)) >= 0.5 ? 1 : 0) * (1 - smooth(clamp(st.marksOut || 0, 0, 1))), rise = clamp(st.rise || 0, 0, 1), k = 0.6;
  if (al <= 0.003) return;
  for (let i = 0; i <= LPD; i++) {
    const x = A.X(i), py = A.Y(f(i)), p = smooth(clamp((rise - 0.12 * i) / 0.64, 0, 1)), src = hvAmt(100 / Math.pow(2, i)), tw = tex(src).w * HV.size * k;
    if (p > 0.003) dashed(ctx, x, LP.top - 2, x, lerp(LP.top - 2, py + 9, p), COL.greyC, 0.8 * al, 2);
    if (p > 0.85) dot(ctx, x, py, 7, AMTCOL, al * smooth((p - 0.85) / 0.15));
    hvLabel(ctx, { src, a: al, pa: 1 - p }, lerp(x, x + 18 + tw / 2, p), lerp(LP.top - 66 * k, py - 24, p), LP.top - 10 * k, k, false);
  }
}
// Which of σ and x is changing (beats 27–29). The presentation shows it with options 1, 8 and 10 and the greyed readout
// (in its PS_DEFAULTS); the bench's "σ or x?" tab can try them with 3 and 9 too, alone or together.
// ind1, colour, brace and focus: x in blue (the blue the boxes were counted in at beat 24), on the formula, the axis and
// a brace under the box; σ in its yellow, the specks' colour; the one changing lit and a little bigger, the other dimmed;
// while σ changes, σ in the box instead of the brace. ind3, the numbers in place of the symbols. ind8, a box around the
// one changing. ind9, the formula itself goes down to the dot, turning into its numbers, rides it while they change,
// and goes back up as symbols once they settle (mv9: how far along that trip it is). ind10, as option 1 shows them but
// with their values (in place of its x and σ): x = … on the brace under the box, giving way while σ changes to σ = …
// in the box. readDim: the sensor's readout greyed a little. sAct and dAct (0 to 1): how much σ or x is changing now,
// worked out by labTrack from how they move.
const LDCOL = COL.blue;
// What's changing, σ or x, from how they move between frames, held half a second after they stop so the focus doesn't
// flicker; and option 9's trip, out to the dot while either is changing, back once both have settled. A rebuild of the
// presentation (a jump to a beat, not a change) isn't counted.
function labTrack(st, dt) {
  const gen = st === PS ? PRES.gen : 0, k = 1 - Math.exp(-Math.max(0, dt) / 0.12), on = (t) => (t != null && TIME - t < 0.5 ? 1 : 0);
  if (st.lgen !== gen) { st.lgen = gen; st.pS = st.sig; st.pD = st.dotD; }
  // rS, rD: when the current run of changes began; if both are changing, only the one that started last is in focus
  if (st.pS != null && Math.abs(st.sig - st.pS) > 1e-5) { if (!on(st.tS)) st.rS = TIME; st.tS = TIME; }
  if (st.pD != null && Math.abs(st.dotD - st.pD) > 1e-5) { if (!on(st.tD)) st.rD = TIME; st.tD = TIME; }
  st.pS = st.sig; st.pD = st.dotD;
  let wS = on(st.tS), wD = on(st.tD);
  if (wS && wD) { if ((st.rS ?? 0) >= (st.rD ?? 0)) wD = 0; else wS = 0; }
  st.sAct = (st.sAct || 0) + (wS - (st.sAct || 0)) * k; st.dAct = (st.dAct || 0) + (wD - (st.dAct || 0)) * k;
  st.mv9 = (st.mv9 || 0) + ((Math.max(st.sAct, st.dAct) > 0.5 ? 1 : 0) - (st.mv9 || 0)) * (1 - Math.exp(-Math.max(0, dt) / 0.44));
}
// cs and cd: how much σ and x are in their colours (the presentation colours each only once it means something: x at
// 26c, σ at 28 with sigHi; the bench has both on).
const labFocus = (st) => { const c = smooth(clamp(st.ind1 || 0, 0, 1)); return { c, s: c * clamp(st.sAct || 0, 0, 1), d: c * clamp(st.dAct || 0, 0, 1), cs: c * smooth(clamp(st.colS ?? 1, 0, 1)), cd: c * smooth(clamp(st.colD ?? 1, 0, 1)) }; };
function drawLabFormula(ctx, F, st, a) {
  const hiS = smooth(clamp(st.sigHi, 0, 1)), num = smooth(clamp(st.ind3 || 0, 0, 1)), Fo = labFocus(st), sym = a * (1 - num);
  const eb = smooth(clamp(st.eBox || 0, 0, 1));   // 29b: the e a little bigger, the exponent a little greyed
  const m9 = smooth(clamp(st.ind9 || 0, 0, 1) * clamp(st.mv9 || 0, 0, 1));
  if (m9 > 0.002 && sym > 0.003 && st.fml >= 1) {   // option 9: on its way to the dot, or riding it, as its numbers (manim's TransformMatchingTex)
    const A = lpAxes(), d = clamp(st.dotD, 0, LPD), px = A.X(d), py = A.Y(Math.exp(-Math.max(0, st.sig) * Math.LN2 * d));
    const N = place(tex(labNumSrc(st)), { x: px + 26, y: py - 46, size: 58, ax: 0 }), M = F.main.map((q) => ({ ...q, color: q.a.terms.includes('t-sig') ? mixRgb(WHITE_RGB, hexRgb(COL.yellow), Math.max(hiS, Fo.cs)) : q.a.terms.includes('t-ld') ? mixRgb(WHITE_RGB, hexRgb(LDCOL), Fo.cd) : q.color }));   // in the colours it has at the top, so nothing flashes white
    if (m9 >= 0.998) drawSprites(ctx, N, { alpha: sym }); else drawMorph(ctx, matchPlan(M, N), m9, sym);
    return;
  }
  const z = smooth(clamp(st.eq1 || 0, 0, 1)) * (1 - smooth(clamp(st.eOnly || 0, 0, 1)));   // 29: σ turns into a 0 (and back at 29b)
  if (z > 0.003 && sym > 0.003 && st.fml >= 1) { if (z >= 0.999) drawSprites(ctx, F.zero, { alpha: sym }); else drawMorph(ctx, F.zplan, z, sym); }
  else if (sym > 0.003) {
    TERM_COL['t-ld'] = hexRgb(LDCOL);   // while it writes in, already in the colours it keeps
    if (Fo.c <= 0.003 || st.fml < 1) drawSprites(ctx, F.main, { p: st.fml, alpha: sym, hi: { 't-sig': Math.max(hiS, Fo.cs), 't-ld': Fo.cd } });
    else for (const s of F.main) {
      const isS = s.a.terms.includes('t-sig'), isD = s.a.terms.includes('t-ld'), isE = s === F.e, base = ink(s.color);
      let col = isS ? mixRgb(base, hexRgb(COL.yellow), Math.max(hiS, Fo.cs)) : isD ? mixRgb(base, hexRgb(LDCOL), Fo.cd) : base;
      let al = s.alpha * sym * (isS ? 1 - 0.65 * Fo.d : isD ? 1 - 0.65 * Fo.s : 1 - 0.35 * Math.max(Fo.s, Fo.d));
      if (eb > 0.003 && !isE) { col = mixRgb(col, hexRgb(COL.grey), LE.grey * eb); al *= 1 - 0.2 * eb; }
      if (eb > 0.003 && isE) {   // grown from its right edge, so it keeps clear of the exponent
        const [, r, t, b] = inkBox(s), cy = (t + b) / 2, ke = 1 + LE.grow * eb;
        ctx.save(); ctx.translate(r, cy); ctx.scale(ke, ke); ctx.translate(-r, -cy); drawSprite(ctx, s, al, col); ctx.restore(); continue;
      }
      const k = 1 + 0.22 * (isS ? Fo.s : isD ? Fo.d : 0), dx = LE.shift * eb;   // 29b: the exponent moves over a little, making room for the e
      if (k < 1.001 && dx < 0.01) { drawSprite(ctx, s, al, col); continue; }
      const [l, r, t, b] = inkBox(s), cx = (l + r) / 2, cy = (t + b) / 2;
      ctx.save(); ctx.translate(dx, 0); ctx.translate(cx, cy); ctx.scale(k, k); ctx.translate(-cx, -cy); drawSprite(ctx, s, al, col); ctx.restore();
    }
  }
  const n8 = smooth(clamp(st.ind8 || 0, 0, 1));
  if (n8 > 0.003 && sym > 0.003 && st.fml >= 1) for (const [t, act, f] of [['t-sig', st.sAct, Fo.s], ['t-ld', st.dAct, Fo.d]]) {   // option 8: manim's SurroundingRectangle
    const al = n8 * sym * clamp(act || 0, 0, 1), S = F.main.filter((q) => q.a.terms.includes(t)); if (al <= 0.003 || !S.length) continue;
    let l = Infinity, r = -Infinity, tp = Infinity, b = -Infinity;
    for (const q of S) { const [q0, q1, q2, q3] = inkBox(q); l = Math.min(l, q0); r = Math.max(r, q1); tp = Math.min(tp, q2); b = Math.max(b, q3); }
    const k = 1 + 0.22 * f, cx = (l + r) / 2, cy = (tp + b) / 2, hw = ((r - l) / 2) * k + 12, hh = ((b - tp) / 2) * k + 12;   // around the symbol as option 1 grows it
    ctx.save(); ctx.strokeStyle = hexA(COL.greyA, al); ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(cx - hw, cy - hh, 2 * hw, 2 * hh, 8); ctx.stroke(); ctx.restore();
  }
  if (num > 0.003) drawLabNumbers(ctx, st, a * num);
}
// The formula with its numbers in, and nothing after it: σ per box (ln 2 ≈ 0.69 at the usual σ, the only value that
// gives the readings) and x in boxes, each in its symbol's colour. ind3 puts it in place of e^{−σx}, from a fixed left
// edge that centres its widest form, so nothing jitters as the numbers change; ind9 takes it to the dot.
const rgbHex = (c) => '#' + c.map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
function labNumSrc(st) {
  const sv = Math.max(0, st.sig) * Math.LN2, dv = clamp(st.dotD, 0, LPD), dc = rgbHex(mixRgb(WHITE_RGB, hexRgb(LDCOL), smooth(clamp(st.ind1 || 0, 0, 1))));
  return String.raw`e^{-\textcolor{${COL.yellow}}{${sv.toFixed(2)}}\times\textcolor{${dc}}{${dv.toFixed(1)}}}`;
}
let lnX = null;
function drawLabNumbers(ctx, st, a) {
  if (lnX == null) lnX = 960 - (tex(String.raw`e^{-0.69\times 2.0}`).w * LP.size) / 2;
  drawTex(ctx, labNumSrc(st), lnX, LP.y, LP.size, { ax: 0, alpha: a });
}
// Beats 30–30b: any base will do: 2, 3, 10, … (30), each equal to the same thing with base e (30b), the change of base a number in
// the exponent (ln 2, ln 3, ln 10, rounded); σ keeps its yellow and x its blue. Each row is set as one formula, so its =
// sits on the row's baseline with the usual space either side, and the rows line up on their = signs. A copy of the
// left side glides over and becomes the right side (the −, σ and x move, the base turns into e and the number comes
// in, as manim's TransformMatchingTex does it); the row's = writes in as the copy lands.
const LB = { rows: [330, 480, 630], size: 84, dots: 770, cx: 960 };
const LBS = String.raw`\textcolor{${COL.yellow}}{\sigma}`, LBD = String.raw`\textcolor{${LDCOL}}{x}`;   // σ in its yellow and x in its blue, as at beats 26–29
const LBROW = [['2', '0.69'], ['3', '1.10'], ['10', '2.30']].map(([b, k]) =>
  String.raw`\mathord{\htmlClass{t-bl}{${b}^{-${LBS} ${LBD}}}}\mathrel{\htmlClass{t-beq}{=}}\mathord{\htmlClass{t-br}{e^{-${k}\,${LBS} ${LBD}}}}`);
let lbSp = null;
function lbSprites() {
  if (lbSp) return lbSp;
  const at = (xs) => LBROW.map((src, i) => place(tex(src), { x: xs[i], y: LB.rows[i], size: LB.size, ax: 0 }));
  const part = (sp, t) => sp.filter((s) => s.a.terms.includes(t));
  const span = (S) => [Math.min(...S.map((s) => s.x)), Math.max(...S.map((s) => s.x + s.w))];
  const mid = (S) => { const [l, r] = span(S); return (l + r) / 2; };
  // every row's = on x = 0, then the whole block centred on the stage
  const r0 = at([0, 0, 0]), eq = r0.map((sp) => mid(part(sp, 't-beq')));
  const ends = r0.flatMap((sp, i) => span(sp).map((x) => x - eq[i])), dx = LB.cx - (Math.min(...ends) + Math.max(...ends)) / 2;
  const rows = at(eq.map((e) => dx - e));
  const L = rows.map((sp) => part(sp, 't-bl')), E = rows.map((sp) => part(sp, 't-beq')), R = rows.map((sp) => part(sp, 't-br'));
  return (lbSp = { L, E, R, lx: mid(L.flat()), rx: mid(R.flat()), plans: L.map((sp, i) => matchPlan(sp, R[i])) });
}
function drawLabBases(ctx, st) {
  const a = 1 - smooth(clamp(st.bOut || 0, 0, 1));   // they go at 32
  if (st.bStack <= 0.003 || a <= 0.003) return;
  const S = lbSprites();
  S.L.forEach((sp, i) => { const p = clamp((st.bStack - i * 0.25) / 0.5, 0, 1); if (p > 0.003) drawSprites(ctx, sp, { p, alpha: a }); });
  const dp = clamp((st.bStack - 0.75) / 0.25, 0, 1);
  if (dp > 0.003) drawTex(ctx, String.raw`\vdots`, S.lx, LB.dots, LB.size, { alpha: dp });
  S.plans.forEach((P, i) => {
    const m = clamp((st.bMorph - i * 0.25) / 0.5, 0, 1); if (m <= 0.001) return;
    if (m >= 0.999) drawSprites(ctx, S.R[i], { alpha: a }); else drawMorph(ctx, P, m, a);
    const q = clamp((st.bMorph - i * 0.25 - 0.42) / 0.18, 0, 1);
    if (q > 0.003) drawSprites(ctx, S.E[i], { p: q, alpha: a });
  });
  const dr = clamp((st.bMorph - 0.85) / 0.25, 0, 1);
  if (dr > 0.003) drawTex(ctx, String.raw`\vdots`, S.rx, LB.dots, LB.size, { alpha: dr });
}
// Beats 24 and 31: an aside, the way every aside with me goes (as in beat 2): what is on the stage shrinks into a card
// of its own colour, moved over to the left, and I come in on the right with a thought.
const LASIDE = [60, 110, 1120, 630];
// Beat 24's guess, worked out over my head: the same amount off for every box, what's taken off, its minus and all, in
// the red of light taken away. Beat 25: crossed out in red.
const LOFF = (v) => String.raw`\textcolor{${COL.red}}{-${v}\%}`;
const LWRONG = [String.raw`\textcolor{${COL.blue}}{1}\text{ box:}\quad 100\% ${LOFF('50')} = 50\%`,
  String.raw`\textcolor{${COL.blue}}{2}\text{ boxes:}\quad 100\% ${LOFF('100')} = 0\%`];   // the amounts in white here
const LW = { x: 1225, y: [170, 240], size: 40 };
function drawLabFigure(ctx, st) {
  const a = smooth(clamp(st.lfig, 0, 1)); if (a <= 0.003) return;
  const fx = 1500, fy = 840, fs = 1.24;
  drawFigure(ctx, fx, fy, fs, a);
  drawThinking(ctx, fx + 110, fy - 410, 1, 100, '', st.lthink, 1, st.lthinkP, a, figHead(fx, fy, fs));
  const w = clamp(st.wrong, 0, 2); if (w <= 0.003) return;   // a line per press: one box (24b), then two (24c)
  let x1 = 0;
  LWRONG.forEach((src, i) => { const sp = drawTex(ctx, src, LW.x, LW.y[i], LW.size, { ax: 0, p: clamp(w - i, 0, 1), alpha: a }); for (const q of sp) x1 = Math.max(x1, inkBox(q)[1]); });
  const c = clamp(st.cross, 0, 1); if (c <= 0.003) return;
  const X0 = LW.x - 16, X1 = x1 + 16, Y0 = LW.y[0] - 34, Y1 = LW.y[1] + 34, c1 = smooth(clamp(c * 2, 0, 1)), c2 = smooth(clamp(c * 2 - 1, 0, 1));
  ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = '#FF4B42'; ctx.lineWidth = 8; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(X0, Y0); ctx.lineTo(lerp(X0, X1, c1), lerp(Y0, Y1, c1)); ctx.stroke();
  if (c2 > 0.003) { ctx.beginPath(); ctx.moveTo(X0, Y1); ctx.lineTo(lerp(X0, X1, c2), lerp(Y1, Y0, c2)); ctx.stroke(); }
  ctx.restore();
}
function drawLab(ctx, dt, st) {
  const k = smooth(clamp(st.lside, 0, 1)), C = lerpRect([0, 0, W, H], LASIDE, k);
  if (k > 0.003) {   // the aside's card: its own ground and a frame, everything on the stage drawn into it
    ctx.save(); ctx.globalAlpha = k; ctx.fillStyle = '#26241F'; ctx.strokeStyle = COL.greyC; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.roundRect(C[0], C[1], C[2], C[3], 14 * k); ctx.fill(); ctx.stroke(); ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.roundRect(C[0], C[1], C[2], C[3], 14 * k); ctx.clip(); ctx.translate(C[0], C[1]); ctx.scale(C[2] / W, C[3] / H);
  }
  drawLabStage(ctx, dt, st);
  if (k > 0.003) ctx.restore();
  drawLabFigure(ctx, st);
}
function drawLabStage(ctx, dt, st) {
  if (st.labOn > 0.003) {
    const out = 1 - smooth(clamp(st.rowsOut, 0, 1)), x = smooth(clamp(st.labX, 0, 1)), sp = smooth(clamp(st.split, 0, 1));
    const X1 = mixXf(mixXf(labCardXf(st), LABXF.full, x), LABXF.top, sp);
    const tOut = 1 - smooth(clamp(st.topOut || 0, 0, 1));
    drawLabRow(ctx, X1, { c: 1, scat: st.scat, glow: st.glow, from: '', to: '50%', m: 1, read: smooth(clamp(st.read1, 0, 1)) }, out * tOut);
    const td = smooth(clamp(st.topDim || 0, 0, 1)) * tOut;   // from 25b: a touch less colour, so the eye goes to the row with the question
    if (td > 0.003) { const L1 = labLayout(1); greyOut(ctx, [X1.ox + X1.s * (L1.laser - 160), X1.oy - X1.s * 250, X1.s * (L1.sensor - L1.laser + 330), X1.s * 520], 0.3 * td, 0.08 * td); }   // slight, hardly noticed
    if (sp > 0.003) {
      let o = { c: st.c2, from: st.r2From, to: st.r2, m: st.r2M, read: smooth(clamp(st.read2, 0, 1)), pop: true, myst: st.myst, rev: st.rev }, al = out * (1 - smooth(clamp(st.rowFade, 0, 1)));
      if (st.hvOn) {   // 25d–25f: the halving, a box per press (drawHalveRow), as the Halving tab's labels at the boxes' ends with × ½
        const S = hvSchedule(HV_PRES), [b0, b1] = st.hvAuto ? [0, S.steps[S.n - 1][1]] : hvStepSpan(S, st.hvStep, true), Xb = mixXf(LABXF.full, LABXF.bot, sp), J = labJoinXf();
        const e = smooth(clamp(st.merge || 0, 0, 1)), pb = smooth(clamp(st.pbox || 0, 0, 1)), ha = out * smooth(clamp(st.hvA, 0, 1));
        // 26: closing up into the plot's box; once that is drawn by the plot (pbox), this fades and the plot keeps the labels
        const Xm = { ox: lerp(Xb.ox, J.ox, e), oy: lerp(Xb.oy, J.oy, e), s: lerp(Xb.s, J.s, e), sy: lerp(Xb.s, J.sy, e), lk: lerp(Xb.s, 0.6, e), e, lg: J.lg, sg: J.sg };
        drawHalveRow(ctx, Xm, S, HV_PRES, reduced ? b1 : clamp(b0 + (TIME - st.hvT0) * (st.hvAuto ? HVAUTO : 1), b0, b1), ha * (1 - pb), pb < 0.5 ? ha : 0);
      } else drawLabRow(ctx, mixXf(LABXF.full, LABXF.bot, sp), o, al);
    }
    drawLabNoLabels(ctx, st, X1);
    drawLabMagnifier(ctx, st, X1);
    const hi = smooth(clamp(st.r1Hi || 0, 0, 1));
    if (hi > 0.003) {   // 22: the reading brought forward a moment: everything else dims, the readout grows a little
      ctx.save(); ctx.fillStyle = `rgba(28,27,24,${(0.62 * hi).toFixed(3)})`; ctx.fillRect(0, 0, W, H); ctx.restore();
      const L1 = labLayout(1), cy = -138, k = 1 + 0.16 * hi;
      ctx.save(); ctx.translate(X1.ox, X1.oy); ctx.scale(X1.s, X1.s); ctx.translate(L1.sensor, cy); ctx.scale(k, k); ctx.translate(-L1.sensor, -cy);
      drawLabReadout(ctx, L1.sensor, '', '50%', 1, 1); ctx.restore();
    }
  }
  labLoops(st); labTrack(st, dt); drawLabPlot(ctx, st);
  drawLabBases(ctx, st);
  drawWhy(ctx, dt, st);   // part 4, from beat 32 (why.js)
  drawVary(ctx, dt, st);  // part 5, from beat 41 (vary.js)
  drawEnd(ctx, dt, st);  // part 6, the ending (end.js)
}

// 21e: a ring on the beam in the box and, up to the right, a lens on it: light hitting a particle and taken in, the
// particle warming (the absorption cell of beat 8, playing on). The lens grows out of the ring; two lines join them.
const AMAG = { at: 120, r0: 24, c: [1590, 235], r: 165, k: 0.8 };   // at: where on the beam, in the box's own units; r0: the ring; c, r: the lens; k: the cell's scale in it
function drawLabMagnifier(ctx, st, X) {
  const m = clamp(st.amag, 0, 1); if (m <= 0.003) return;
  const e = smooth(m), c1 = [X.ox + X.s * AMAG.at, X.oy], c2 = [lerp(c1[0], AMAG.c[0], e), lerp(c1[1], AMAG.c[1], e)], r = lerp(AMAG.r0, AMAG.r, e);
  ctx.save(); ctx.globalAlpha *= smooth(clamp(m * 3, 0, 1));
  ctx.strokeStyle = hexA(COL.white, 0.85); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(c1[0], c1[1], AMAG.r0, 0, Math.PI * 2); ctx.stroke();
  const dx = c2[0] - c1[0], dy = c2[1] - c1[1], D = Math.hypot(dx, dy);
  if (D > AMAG.r0 + r + 4) {   // the two outer tangents from the ring to the lens
    const ux = dx / D, uy = dy / D, ca = (AMAG.r0 - r) / D, sa = Math.sqrt(Math.max(0, 1 - ca * ca));
    ctx.strokeStyle = hexA(COL.greyA, 0.55); ctx.lineWidth = 2; ctx.beginPath();
    for (const sg of [1, -1]) { const nx = ca * ux - sg * sa * uy, ny = ca * uy + sg * sa * ux; ctx.moveTo(c1[0] + AMAG.r0 * nx, c1[1] + AMAG.r0 * ny); ctx.lineTo(c2[0] + r * nx, c2[1] + r * ny); }
    ctx.stroke();
  }
  ctx.save(); ctx.beginPath(); ctx.arc(c2[0], c2[1], r, 0, Math.PI * 2); ctx.clip();
  ctx.fillStyle = hexA(BG, 0.95); ctx.fill();
  const k = AMAG.k * (r / AMAG.r); ctx.translate(c2[0], c2[1]); ctx.scale(k, k); ctx.translate(-350, -165);
  drawIACell(ctx, 0, fxAge(st.amagT), fxP(), smooth(clamp((m - 0.4) / 0.6, 0, 1)), SI.look);
  ctx.restore();
  ctx.strokeStyle = COL.greyA; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(c2[0], c2[1], r, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}

// ---- the beats ----
// a sequence of steps that stops where it is if the presentation is rebuilt (a step back) in the middle of it
const labAlive = (g) => g === PRES.gen;
// 21: the field cards and the caption go, and the box grows out of its card to fill the stage
function labZoom() { ptw('usesOut', 1, 0.6); ptw('capOut', 1, 0.6); PS.labOn = 1; return ptw('labX', 1, 1.4, { delay: 0.2 }); }
// 21b: it scatters
function labScatter() { ptw('lbNS', 1, 0.8, { delay: 0.3, ease: linear }); return ptw('scat', 1, 1.0); }
// 21c: it stops scattering; every speck glows red, the beam a little dimmer so the glow shows
function labGlow() { ptw('scat', 0, 0.6); ptw('lbNE', 1, 0.8, { delay: 0.4, ease: linear }); return ptw('glow', 1, 1.0, { delay: 0.4 }); }
// 21d: the glow goes: only absorption
function labAbsorb() { ptw('lbJA', 1, 1.2, { delay: 0.2 }); ptw('lie', 1, 1.4, { delay: 0.5 }); return ptw('glow', 0, 0.9); }
// 21e: a magnifier on the beam in the box: in its lens, light hitting a particle and taken in, the particle warming
function labHeat() { PS.amagT = labLoopStart('amT', TIME + 0.6); return ptw('amag', 1, 1.1); }
// 21f: the lens shrinks back into its ring and goes: the setup as it was, the light dimmer past the box
function labHeatOut() { return ptw('amag', 0, 0.9); }
// 22: the reading comes in already brought forward (the rest dims, the readout a little bigger); 22b: back to normal
function labRead() { ptw('amag', 0, 0.5); ptw('r1Hi', 1, 0.6); return ptw('read1', 1, 0.8); }
function labReadDone() { return ptw('r1Hi', 0, 0.8); }
function labRead2(text, dur, delay = 0) { PS.r2From = PS.r2; PS.r2 = text; PS.r2M = 0; return ptw('r2M', 1, dur, { delay, ease: linear }); }
// 23: the whole setup is copied, without its readout, and the copy slides down. 23b: a second box slides in beside its
// first while the light past the first box gives way to a row of "?"; then a readout pops up on it: "?"
function labCopy() { PS.r2 = '?'; PS.r2From = ''; PS.r2M = 1; PS.read2 = 0; PS.myst = 0; PS.rev = 1; ptw('lbOut', 1, 0.5); return ptw('split', 1, 1.95); }
async function labSecond() {
  const g = PRES.gen;
  ptw('myst', 1, 1.2); await ptw('c2', 2, 1.4); if (!labAlive(g)) return;
  PS.rev = 0;
  await ptw('read2', 1, 0.45);
}
// 24: an aside: me, guessing zero
function labGuess() {
  PS.lthink = '0\\%'; PS.lthinkP = 0; PS.wrong = 0; PS.cross = 0; ptw('lside', 1, 1.4); ptw('lfig', 1, 1.0, { delay: 0.8 });
  return ptw('lthinkP', 1, 0.6, { delay: 1.7, ease: linear });
}
// 24b: over my head, how I got there: one box. 24c: two boxes, under it
function labWrong(k) { return ptw('wrong', k, 0.8, { ease: linear }); }
// 25: "But that's not what happens": the sum is crossed out. 25b: back from the aside, the light carries on and it reads
// twenty-five. 25c: a third box, twelve and a half.
function labCross() { return ptw('cross', 1, 0.8, { ease: linear }); }
function labReveal() {
  ptw('lfig', 0, 0.5); ptw('wrong', 0, 0.5); ptw('cross', 0, 0.5); ptw('lside', 0, 1.2, { delay: 0.2 });
  ptw('myst', 0, 0.5, { delay: 1.3 }); ptw('rev', 1, 1.0, { delay: 1.6, ease: linear }); ptw('topDim', 1, 0.8, { delay: 1.2 });
  return labRead2('25%', 0.9, 2.5);
}
function labThird() { labRead2('12.5%', 1.2); return ptw('c2', 3, 1.4); }   // the reading changes as the box slides in
// 25d: the bottom row fades and comes back as one box, 100% going in and, at its end, 100% × ½ turning into 50%;
// 25e and 25f: the next box slides in, and the same at its end. Each step plays from the clock, so a rebuild shows it done.
async function labHalve() {
  const g = PRES.gen;
  await ptw('rowFade', 1, 0.35); if (!labAlive(g)) return;
  PS.hvOn = 1; PS.hvA = 0; ptw('hvA', 1, 0.4); return labHalveStep(1);
}
function labHalveStep(k) { PS.hvStep = k; PS.hvT0 = instant ? -1e9 : TIME; return Promise.resolve(); }
// 25g: the bottom row starts over and plays the halving through by itself, box after box, a little quicker (HVAUTO)
const HVAUTO = 1.3;
async function labHalveAuto() {
  const g = PRES.gen;
  await ptw('hvA', 0, 0.35); if (!labAlive(g)) return;
  PS.hvAuto = 1; PS.hvT0 = instant ? -1e9 : TIME + 0.2;
  return ptw('hvA', 1, 0.35);
}
// 26, all of it back to back on one press: the one-box row goes and the bottom row's three boxes close up, end to end,
// where the plot's box will be, their amounts over the joins; e^{−σx} writes in, plain (σ and x take their colours only
// once we know what they are); the three boxes become one long box (its brace counting them: 3 boxes) and the plot
// sketches in above it, its dot at the end; the amounts rise to their places on the curve, 3 boxes becomes x = 3.0 and
// x takes its blue; and then the amounts go.
function labFormula() {
  PS.dotD = LPD; PS.curveTo = 0; PS.dCont = 0;
  ptw('topOut', 1, 0.6); ptw('merge', 1, 1.3, { delay: 0.2 }); ptw('fml', 1, 1.0, { delay: 0.8, ease: linear });
  ptw('pbox', 1, 0.5, { delay: 1.6 }); ptw('axC', 1, 0.9, { delay: 1.7 }); ptw('curveTo', LPD, 2.4, { delay: 2.3 });
  ptw('rise', 1, 1.8, { delay: 4.8 }); ptw('dCont', 1, 0.8, { delay: 6.0 }); ptw('colD', 1, 0.8, { delay: 6.0 });
  return ptw('marksOut', 1, 0.6, { delay: 7.2 });
}
// 26b: its name, "the Beer–Lambert law", writes in beside the formula for a moment and goes
function labName() { ptw('blW', 1, 1.0, { ease: linear }); return ptw('blOut', 1, 0.6, { delay: 2.8 }); }
// 27 and 28 play back and forth until the next press, never stopping on their own: a cycle worked out from the clock
// (as the halving's steps are), so a press stops it wherever it is and the next beat carries on from there. 27: the dot from three
// boxes down to 0.4 and back; 28: σ up to twice the usual and down to half (even steps in log2). Both 30% slower than
// the one-off moves they replace.
const LDL = { P: 5.2 }, LSL = { P: 6.8 };
const labDAt = (t0) => 1.7 + 1.3 * Math.cos((2 * Math.PI * Math.max(0, TIME - t0)) / LDL.P);
const labSAt = (t0) => Math.pow(2, Math.sin((2 * Math.PI * Math.max(0, TIME - t0)) / LSL.P));
function labLoops(st) {
  if (reduced) return;
  if (st.dLoop) st.dotD = labDAt(st.dLoopT0);
  if (st.sLoop) st.sig = labSAt(st.sLoopT0);
}
// A loop's start, kept outside the presentation's state: each press rebuilds the beats before it from scratch, and the
// loop must carry on from where it was, so the next beat can start from where the dot (or σ) is.
const labLoopStart = (key, t) => (instant && PRES[key] != null ? PRES[key] : (PRES[key] = t));
// 27: the dot runs back and forth along the curve, the box with it, until the next press (still at two boxes if motion is reduced)
function labDistance() { ptw('marksOut', 1, 0.6); PS.dLoop = 1; PS.dLoopT0 = labLoopStart('dT0', TIME); return reduced ? ptw('dotD', 2, 1.2) : Promise.resolve(); }
// 28: the dot stops, from wherever it is, and settles at 1.4 box lengths. 28b: σ goes up, to twice the usual (it takes its
// yellow as it starts, and its value stays written in the box from here on). 28c: σ goes down, to half the usual
const LFIX = 1.4;
function labFix() { if (PS.dLoop && !reduced) PS.dotD = labDAt(PS.dLoopT0); PS.dLoop = 0; return ptw('dotD', LFIX, 1.0); }
function labMore() { ptw('sigHi', 1, 0.5); PS.sPin = 1; return ptw('sig', 2, 1.8); }
function labLess() { return ptw('sig', 0.5, 2.2); }
// 29: σ to zero: a vacuum; as it gets there σ in the formula turns into a 0, in its yellow, and then "= 1"
function labVacuum() { PS.dLoop = 0; PS.sLoop = 0; PS.sPin = 1; ptw('eq1', 1, 0.8, { delay: 1.6 }); ptw('eq2', 1, 0.6, { delay: 2.5 }); return ptw('sig', 0, 1.8); }
// 29b: only e^{−σx}, in the middle of the stage, a box around its e
function labE() { ptw('eOnly', 1, 0.7); ptw('eMove', 1, 1.1, { delay: 0.35 }); return ptw('eBox', 1, 0.6, { delay: 1.4 }); }
// 30: it goes, and 2, 3, 10 … write in. 30b: each becomes the same thing with base e (bMorph runs past 1 so the last
// row's = finishes writing)
function labBases() { ptw('plotOut', 1, 0.7); return ptw('bStack', 1, 1.6, { delay: 0.6, ease: linear }); }
function labBasesE() { return ptw('bMorph', 1.1, 2.64, { ease: linear }); }
// 31: an aside: me again: but why exponential? With the plot back in the card.
// In the card, the bases make way for the plot again, as at 27: the formula, its curve and its dot, and the box with the
// laser and the sensor under it, σ back at its usual value (set while the plot is out of sight, and labTrack told, so it
// isn't taken for σ changing)
function labWhy() {
  Object.assign(PS, { sig: 1, pS: 1, sPin: 0, eq1: 0, eq2: 0, eOnly: 0, eMove: 0, eBox: 0 });
  ptw('bOut', 1, 0.6); ptw('plotOut', 0, 0.9, { delay: 0.5 });
  PS.lthink = 'but why exponential?'; PS.lthinkP = 0; ptw('lside', 1, 1.4); ptw('lfig', 1, 1.0, { delay: 0.8 });
  return ptw('lthinkP', 1, 1.0, { delay: 1.7, ease: linear });
}

// ---------- σ or x? (the bench) ----------
// Beats 26–29's formula, plot and box, to try the ways above of showing which of σ and x is changing, alone or
// together; on at the start, what the presentation uses. Which one is changing is worked out from how they move, so the
// buttons and the sliders under the stage both show it.
const SSD = defScene({
  id: 'sigd', tab: 'σ or x?',
  defaults: () => ({ fml: 1, axC: 1, curveTo: LPD, dotD: 2, sig: 1, sigHi: 1, eq1: 0, plotOut: 0, ind1: 1, ind3: 0, ind8: 1, ind9: 0, ind10: 1, readDim: 1, sAct: 0, dAct: 0, mv9: 0 }),
  actions: [
    { id: 'dist', label: 'Change x', primary: true, run: async (st, alive) => {
      await tween(st, 'dotD', 0.4, 1.3); if (!alive()) return; await tween(st, 'dotD', LPD, 2.6); if (!alive()) return; await tween(st, 'dotD', 2, 1.2);
    } },
    { id: 'more', label: 'More absorbing', run: (st) => tween(st, 'sig', 2, 1.6) },
    { id: 'less', label: 'Less absorbing', run: (st) => tween(st, 'sig', 0.5, 1.9) },
    { id: 'vacuum', label: 'Vacuum', run: (st) => tween(st, 'sig', 0, 1.8) },
    { id: 'usual', label: 'Usual σ', run: (st) => tween(st, 'sig', 1, 1.4) },
    RESET,
  ],
  params: [
    { type: 'check', key: 'ind1', label: '1 · Colour, brace and focus', set: (v) => tween(SSD, 'ind1', v ? 1 : 0, 0.5) },
    { type: 'check', key: 'ind3', label: '3 · Numbers in the formula', set: (v) => tween(SSD, 'ind3', v ? 1 : 0, 0.6) },
    { type: 'check', key: 'ind8', label: '8 · A box around the one changing', set: (v) => tween(SSD, 'ind8', v ? 1 : 0, 0.5) },
    { type: 'check', key: 'ind9', label: '9 · The formula goes to the dot as numbers, and back', set: (v) => tween(SSD, 'ind9', v ? 1 : 0, 0.5) },
    { type: 'check', key: 'ind10', label: '10 · x = … on the brace, σ = … in the box', set: (v) => tween(SSD, 'ind10', v ? 1 : 0, 0.5) },
    { type: 'check', key: 'readDim', label: 'Sensor readout greyed', set: (v) => tween(SSD, 'readDim', v ? 1 : 0, 0.5) },
    { type: 'range', key: 'sig', label: 'σ (× usual)', min: 0, max: 2, step: 0.01, fmt: (v) => v.toFixed(2), set: (v) => { untween(SSD, 'sig'); SSD.sig = v; } },
    { type: 'range', key: 'dotD', label: 'x (boxes)', min: 0.05, max: LPD, step: 0.01, fmt: (v) => v.toFixed(2), set: (v) => { untween(SSD, 'dotD'); SSD.dotD = v; } },
  ],
  draw: (ctx, dt, st) => { labTrack(st, dt); drawLabPlot(ctx, st); },
});

// ---------- Halving: ways to animate beats 25d–25f, a fixed fraction again and again ----------
// One row of laser, boxes and sensor, a box per press. mode: 'ends', a label where each box ends (the boxes all there,
// or coming in one by one); 'travel', one label riding along with the light from the laser to the sensor, halved by
// each box it crosses. how: 'step', the amount jumps to half where the box ends; 'times', "× ½" comes in beside it,
// then the two turn into the result; 'smooth', it drops through the box, half by its end (the exponential inside each
// box). start: a 100% first, where the light goes in. place (travel): the label above the boxes, or on the beam. Amounts
// in yellow, the × ½ in red; each label has the small pointer. The presentation (HV_PRES) uses labels at the ends, × ½,
// the start, boxes one by one and the readout; the bench's tab tries the rest.
const HV = { v: 300, size: 54 };
const HV_PRES = { mode: 'ends', how: 'times', start: 1, n: 3, oneBy: 1, place: 'above', readout: 1 };
const hvPct = (v) => String(+v.toFixed(2));
const hvAmt = (v) => LRES(hvPct(v));
const hvMul = (v) => `${hvAmt(v)} ${LHALF}`;
const hvOut = (k) => 100 / Math.pow(2, k + 1);   // what leaves box k (k = −1: what goes in)
const hvSpC = new Map(), hvPlC = new Map();
const hvSp = (src) => { if (!hvSpC.has(src)) hvSpC.set(src, place(tex(src), { x: 0, y: 0, size: HV.size })); return hvSpC.get(src); };
const hvPlan = (a, b, match) => { const k = (match ? 'm|' : 'r|') + a + '>' + b; if (!hvPlC.has(k)) hvPlC.set(k, match ? matchPlan(hvSp(a), hvSp(b)) : reshapePlan(hvSp(a), hvSp(b))); return hvPlC.get(k); };
// a row of n boxes, fitted to the stage (the bench)
function halveXf(n) { const T = n * LAB.BW + (n - 1) * LAB.G, s = Math.min(1.1, 1780 / (T + 640)); return { ox: 960 - 10 * s, oy: 600, s }; }
// The schedule for a set of options: when each thing happens, on one clock. Each box's part is one step.
function hvSchedule(o) {
  const n = Math.round(o.n), how = o.how;
  if (o.mode === 'travel') {
    const L = labLayout(n), xs = o.start ? L.laser + 150 : L.boxes[0].x0 - 46, segs = [], ev = [];
    let t = 0.5, x = xs;
    const move = (to) => { const d = Math.abs(to - x); segs.push({ t0: t, t1: t + d / HV.v, x0: x, x1: to }); t += d / HV.v; x = to; };
    for (let k = 0; k < n; k++) {
      const b = L.boxes[k], t0 = t; move(b.x0); const tin = t; move(b.x0 + LAB.BW);
      const e = { k, t0, tin, tout: t };
      if (how !== 'smooth') { e.morph = [t, t + 0.6]; segs.push({ t0: t, t1: t + 0.9, x0: x, x1: x }); t += 0.9; }
      if (k === n - 1) move(L.sensor);   // and on to the sensor after the last
      e.end = t; ev.push(e);
    }
    return { mode: 'travel', n, how, L, xs, segs, ev, arrive: ev[n - 1].end, startEnd: 0.5, steps: ev.map((e) => [e.t0, e.end]) };
  }
  // each box: it comes in (0.8 s, one by one) and the sensor's reading changes with it, at once; then, where the box
  // ends, its label fades in and (× ½) turns into the result
  const one = !!o.oneBy && n > 1, spans = []; let t = 0.3;
  const startAt = t; if (o.start) t += 0.5;
  const startEnd = t;
  for (let k = 0; k < n; k++) {
    const t0 = t; let slide = null; if (one && k > 0) { slide = [t, t + 0.8]; t += 0.6; }
    const readAt = k === 0 ? 0 : t0 + 0.3, lt = t, done = lt + (how === 'times' ? 1.3 : how === 'smooth' ? 1.0 : 0.35);   // the reading changes as the box appears
    t += how === 'times' ? 1.7 : how === 'smooth' ? 1.3 : 0.8;
    spans.push({ k, slide, t0, readAt, lt, done, end: t });
  }
  return { mode: 'ends', n, how, one, startAt, startEnd, spans, steps: spans.map((sp) => [sp.t0, sp.end]) };
}
// The clock's span for step k (0: only what goes in; k: up to and through box k). fromZero: step 1 plays from the very
// start, the 100% going in too (the presentation's 25d).
function hvStepSpan(S, k, fromZero) {
  if (k <= 0) return [0, S.startEnd];
  const [a, b] = S.steps[Math.min(k, S.n) - 1];
  return [k === 1 && fromZero ? 0 : a, b];
}
// One label centred at the stage point (x, y) at scale k, its pointer's tip at stage height tip (Lb.pa: how much of the
// pointer shows); shade: a little shade behind it (on the beam, among the specks).
function hvLabel(ctx, Lb, x, y, tip, k, shade) {
  if (Lb.a <= 0.003) return;
  const pa = Lb.a * (Lb.pa ?? 1);
  if (pa > 0.003) { ctx.save(); ctx.fillStyle = hexA(COL.greyB, pa); ctx.beginPath(); ctx.moveTo(x, tip); ctx.lineTo(x - 11 * k, tip - 20 * k); ctx.lineTo(x + 11 * k, tip - 20 * k); ctx.closePath(); ctx.fill(); ctx.restore(); }
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  if (shade) { ctx.fillStyle = `rgba(28,27,24,${(0.75 * Lb.a).toFixed(3)})`; ctx.beginPath(); ctx.roundRect(-110, -38, 220, 76, 12); ctx.fill(); }
  if (Lb.num != null) drawNumber(ctx, Lb.num, 0, 23, { size: 65, dec: Math.abs(Lb.num - Math.round(Lb.num)) < 0.05 ? 0 : 1, suffix: '%', color: AMTCOL, alpha: Lb.a, align: 'center' });
  else if (Lb.to && Lb.m > 0.001) { if (Lb.m >= 0.999) drawSprites(ctx, hvSp(Lb.to), { alpha: Lb.a }); else (Lb.match ? drawMorph : drawReshape)(ctx, hvPlan(Lb.src, Lb.to, Lb.match), Lb.m, Lb.a); }
  else drawSprites(ctx, hvSp(Lb.src), { p: Lb.p ?? 1, alpha: Lb.a });
  ctx.restore();
}
// The row at clock time u, in the transform X (X.sy: its own height scale; X.lk: the labels' scale; X.e, X.lg, X.sg:
// how far the boxes have closed up, and the laser's and sensor's gaps by then). labelAlpha: the labels' own alpha.
function drawHalveRow(ctx, X, S, o, u, alpha = 1, labelAlpha = alpha) {
  if (alpha <= 0.003 && labelAlpha <= 0.003) return;
  const e = X.e || 0, g = LAB.G * (1 - e), lg = lerp(LAB.laserGap, X.lg ?? LAB.laserGap, e), sg = lerp(LAB.sensorGap, X.sg ?? LAB.sensorGap, e);
  const labels = [], amt = (v, a) => (S.how === 'smooth' ? { num: v, a } : { src: hvAmt(v), a });
  let c = S.n, read = 0, rFrom = '', rTo = '', rM = 1, travel = null;
  if (S.mode === 'ends') {
    if (S.one) { c = 1; for (const sp of S.spans) if (sp.slide) c += clamp((u - sp.slide[0]) / (sp.slide[1] - sp.slide[0]), 0, 1); }
    const L = labLayoutDrop(c, g, lg, sg);
    if (o.start) { const w = smooth(clamp((u - S.startAt) / 0.4, 0, 1)); if (w > 0) labels.push({ x: L.boxes[0].x0 - g / 2, ...amt(100, w), lift: 1 - w }); }
    for (const sp of S.spans) {
      // the sensor reads what leaves this box as soon as the box comes in
      if (u >= sp.readAt) { rFrom = sp.k ? hvPct(hvOut(sp.k - 1)) + '%' : ''; rTo = hvPct(hvOut(sp.k)) + '%'; rM = smooth(clamp((u - sp.readAt) / 0.6, 0, 1)); read = 1; }
      const b = L.boxes[sp.k]; if (!b || u < sp.lt) continue;
      const w = u - sp.lt, f = smooth(clamp(w / 0.35, 0, 1)), vIn = hvOut(sp.k - 1), vOut = hvOut(sp.k), Lb = { x: b.x0 + LAB.BW + g / 2, a: b.a * f, lift: 1 - f };
      if (S.how === 'step') Object.assign(Lb, { src: hvAmt(vOut) });
      else if (S.how === 'times') Object.assign(Lb, w < 0.7 ? { src: hvMul(vIn) } : { src: hvMul(vIn), to: hvAmt(vOut), m: smooth(clamp((w - 0.7) / 0.6, 0, 1)) });
      else Object.assign(Lb, { num: vIn * Math.pow(2, -smooth(clamp(w / 1.0, 0, 1))) });
      labels.push(Lb);
    }
  } else {
    let x = S.xs; for (const sg2 of S.segs) if (u >= sg2.t0) x = u >= sg2.t1 ? sg2.x1 : lerp(sg2.x0, sg2.x1, (u - sg2.t0) / (sg2.t1 - sg2.t0));
    let Lb;
    if (S.how === 'smooth') {   // what's left after the stretch of stuff it has crossed
      let inside = 0; for (const bx of S.L.boxes) inside += clamp(x - bx.x0, 0, LAB.BW);
      Lb = { num: 100 * Math.pow(2, -inside / LAB.BW) };
    } else {
      Lb = { src: hvAmt(100) };
      for (const ev of S.ev) {
        const vIn = hvOut(ev.k - 1), vOut = hvOut(ev.k);
        if (u >= ev.morph[1]) Lb = { src: hvAmt(vOut) };
        else if (u >= ev.morph[0]) Lb = { src: S.how === 'times' ? hvMul(vIn) : hvAmt(vIn), to: hvAmt(vOut), m: smooth((u - ev.morph[0]) / 0.6) };
        else if (S.how === 'times' && u >= ev.tin) Lb = { src: hvAmt(vIn), to: hvMul(vIn), m: smooth(clamp((u - ev.tin) / 0.4, 0, 1)), match: true };
        else if (u >= ev.tin) Lb = { src: hvAmt(vIn) };
      }
    }
    travel = { ...Lb, x, a: clamp((u - 0.1) / 0.4, 0, 1) };
    if (u >= S.arrive - 0.4) { rTo = hvPct(hvOut(S.n - 1)) + '%'; read = clamp((u - S.arrive + 0.4) / 0.4, 0, 1); }
  }
  drawLabRow(ctx, X, { c, g, lg, sg, drop: S.mode === 'ends', from: rFrom, to: rTo, m: rM, read: o.readout ? read * (1 - e) : 0, pop: true }, alpha);
  // the labels in the stage's own space, so they keep their shape however the row is squeezed
  const sy = X.sy ?? X.s, k = X.lk ?? X.s, top = X.oy + sy * LAB.top, at = (xr) => X.ox + X.s * xr;
  for (const Lb of labels) { const dyl = 14 * k * (Lb.lift || 0); hvLabel(ctx, { ...Lb, a: Lb.a * labelAlpha }, at(Lb.x), top - 66 * k + dyl, top - 10 * k, k, false); }
  if (travel && travel.a > 0.003) {
    const tx = at(travel.x), ta = travel.a * labelAlpha, gl = ctx.createRadialGradient(tx, X.oy, 0, tx, X.oy, 30 * k);   // the light it rides with, on the beam
    gl.addColorStop(0, `rgba(255,96,72,${(0.55 * ta).toFixed(3)})`); gl.addColorStop(1, 'rgba(255,96,72,0)');
    ctx.fillStyle = gl; ctx.fillRect(tx - 30 * k, X.oy - 30 * k, 60 * k, 60 * k);
    if (o.place === 'beam') hvLabel(ctx, { ...travel, a: ta }, tx, X.oy - 78 * k, X.oy - 14 * k, k, true);
    else hvLabel(ctx, { ...travel, a: ta }, tx, top - 66 * k, top - 10 * k, k, false);
  }
}
// Beat 26: where the bottom row's three boxes go, closed up into one long box that is exactly the plot's box at three
// box lengths (from the plot's 0 to its 3, at its height), the laser and the sensor where the plot draws them.
function labJoinXf() {
  const A = lpAxes(), ox = (A.X(0) + A.X(LPD)) / 2, s = (A.X(LPD) - A.X(0)) / (LPD * LAB.BW), half = (LPD * LAB.BW) / 2;
  return { ox, oy: LP.beam, s, sy: (LP.bot - LP.top) / (LAB.bot - LAB.top), lg: (ox - (A.X(0) - 26)) / s - half, sg: (A.X(LPD) + 46 - ox) / s - half };
}
// The bench's tab: a box per press (Next box), the step playing once and staying; Back shows the step before, done.
const SHV = defScene({
  id: 'halve', tab: 'Halving',
  defaults: () => ({ mode: 'ends', how: 'times', start: 1, n: 3, oneBy: 1, place: 'above', readout: 1, step: 0, stepT0: 0 }),
  actions: [
    { id: 'next', label: 'Next box', primary: true, run: (st) => { const n = Math.round(st.n); if (st.step < n) { st.step++; st.stepT0 = TIME; } } },
    { id: 'back', label: 'Back', run: (st) => { st.step = Math.max(0, st.step - 1); st.stepT0 = -1e9; } },
    { id: 'again', label: 'From the start', run: (st) => { st.step = 0; st.stepT0 = TIME; } },
    RESET,
  ],
  params: [
    { type: 'select', key: 'mode', label: 'Style', options: [['ends', 'A label at each box’s end'], ['travel', 'One label travelling, halved by each box']], set: (v) => { SHV.mode = v; SHV.step = 0; SHV.stepT0 = TIME; } },
    { type: 'select', key: 'how', label: 'The halving', options: [['step', 'Jumps to half where the box ends'], ['times', '× ½, then the result'], ['smooth', 'Drops smoothly through the box']], set: (v) => { SHV.how = v; SHV.step = 0; SHV.stepT0 = TIME; } },
    { type: 'check', key: 'start', label: 'Start with 100% on the left', set: (v) => { SHV.start = v ? 1 : 0; SHV.step = 0; SHV.stepT0 = TIME; } },
    { type: 'range', key: 'n', label: 'Boxes', min: 1, max: 4, step: 1, fmt: (v) => String(v), set: (v) => { SHV.n = v; SHV.step = 0; SHV.stepT0 = TIME; } },
    { type: 'check', key: 'oneBy', label: 'Boxes come in one by one (labels at the ends)', set: (v) => { SHV.oneBy = v ? 1 : 0; SHV.step = 0; SHV.stepT0 = TIME; } },
    { type: 'select', key: 'place', label: 'Travelling label', options: [['above', 'Above the boxes'], ['beam', 'On the beam']] },
    { type: 'check', key: 'readout', label: 'Sensor readout', set: (v) => { SHV.readout = v ? 1 : 0; } },
  ],
  draw: (ctx, dt, st) => {
    const S = hvSchedule(st), [b0, b1] = hvStepSpan(S, st.step, false);
    drawHalveRow(ctx, halveXf(S.n), S, st, reduced ? b1 : clamp(b0 + TIME - st.stepT0, b0, b1));
  },
});
