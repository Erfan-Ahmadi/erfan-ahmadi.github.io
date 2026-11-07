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
// Beat 25d, "multiplying by a fixed fraction, again and again": the bottom row plays it over and over. One box,
// 100% × ½ = 50%; a second slides in, 50% × ½ = 25%, the reading halving as it comes; a third, 25% × ½ = 12.5%; a
// moment to look; then it jumps back to one box and goes again. Worked out from the time u into the loop, so stepping
// around the presentation can't leave it half done.
const LOOP = { P: 9.9 };
function labLoopAt(u) {
  const ss = (a, b) => smooth(clamp((u - a) / (b - a), 0, 1)), lin = (a, b) => clamp((u - a) / (b - a), 0, 1);
  const c = 1 + ss(2.0, 3.4) + ss(5.2, 6.6);
  // the reading halves as each box's multiplication turns into its result
  const [from, to, m] = u < 4.2 ? ['', '50%', 1] : u < 7.4 ? ['50%', '25%', lin(4.2, 5.0)] : ['25%', '12.5%', lin(7.4, 8.2)];
  return { c, from, to, m, mult: [lin(0.3, 0.8), lin(3.4, 3.9), lin(6.6, 7.1)], multM: [lin(1.1, 1.8), lin(4.2, 4.9), lin(7.4, 8.1)], fade: Math.min(clamp(u / 0.3, 0, 1), clamp((LOOP.P - u) / 0.3, 0, 1)) };
}
// In the loop, where each box of the bottom row ends, with a small pointer under it: what came in, times a half, which
// then turns into what comes out (the way manim transforms one formula into another). The × ½ is in the red of the
// wrong sum's − 50% in beat 24, the red of light taken away: minus a half becomes times a half.
const LHALF = String.raw`\textcolor{${COL.red}}{\times \tfrac{1}{2}}`, LRES = (v) => String.raw`\textcolor{${COL.yellow}}{${v}\%}`;
const LMULT = ['100', '50', '25'].map((a) => String.raw`${a}\% ${LHALF}`), LOUT = ['50', '25', '12.5'].map((v) => LRES(v));
let lmSp = null;
const lmSprites = () => lmSp || (lmSp = LMULT.map((src, k) => { const A = place(tex(src), { x: 0, y: 0, size: 50 }), B = place(tex(LOUT[k]), { x: 0, y: 0, size: 54 }); return { A, B, P: reshapePlan(A, B) }; }));
// One row: laser, c boxes, sensor, in the transform X. o: c, the readout (from, to, m, a), the scattering and glow;
// myst hides what happens past the first box behind a row of "?" (the light past it is the question), and rev is how
// far the beam has come back past the first box once the answer is shown.
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
  // cut: where the second box begins (the first box's end and the gap after it), past which the light is the question
  const power = SH.I0 * (1 - 0.45 * (o.glow || 0)), cut = L.boxes[0].x0 + LAB.BW + LAB.G, end = L.sensor - 18, myst = clamp(o.myst || 0, 0, 1);
  const front = lerp(cut, end, clamp(o.rev ?? 1, 0, 1)), past = 1 - smooth(myst);
  drawBeam(ctx, L.laser, cut + 0.5, 0, SH.color, power, T, knots);   // through the first box, as we know it
  if (front > cut + 1 && past > 0.003) drawBeam(ctx, cut, front, 0, SH.color, power * past, T, knots);
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
    ctx.save(); ctx.globalAlpha = ga * b.a; ctx.strokeStyle = COL.greyA; ctx.lineWidth = 4; ctx.beginPath(); ctx.roundRect(b.x0, LAB.top, LAB.BW, LAB.bot - LAB.top, 16); ctx.stroke(); ctx.restore();
  }
  drawLaser(ctx, L.laser, 0, SH.color, 1);
  drawSensor(ctx, L.sensor, 0, SH.color, front >= end - 1 ? T(end) * SH.I0 * past : 0);
  if (o.mult) L.boxes.forEach((b, k) => {   // what comes out of each box, where it ends: what came in, times a half, turning into the result
    const p = clamp(o.mult[k] || 0, 0, 1), m = clamp((o.multM && o.multM[k]) || 0, 0, 1), S = lmSprites()[k]; if (p <= 0.003 || b.a <= 0.003 || !S) return;
    ctx.save(); ctx.translate(b.x0 + LAB.BW + LAB.G / 2, LAB.top);
    ctx.fillStyle = hexA(COL.greyB, b.a * smooth(clamp(p * 2, 0, 1)));   // the pointer, its tip just over the box's end
    ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(-11, -30); ctx.lineTo(11, -30); ctx.closePath(); ctx.fill();
    ctx.translate(0, -66);
    if (m <= 0.001) drawSprites(ctx, S.A, { p, alpha: b.a }); else if (m >= 0.999) drawSprites(ctx, S.B, { alpha: b.a }); else drawReshape(ctx, S.P, m, b.a);
    ctx.restore();
  });
  drawLabReadout(ctx, L.sensor, o.from, o.to, o.m, o.read, o.pop);
  ctx.restore();
}
// Beats 26–29: e^{−σd} at the top; under it a plot of the light that gets through against the distance d, in box
// lengths up to three, so the curve passes 50%, 25% and 12.5% at one, two and three boxes, ending where the three
// boxes did; under the plot, the box, its left end at the plot's 0 and its right end under the dot, with the laser
// before it and the sensor after it.
const LP = { L: 520, R: 1440, T: 250, B: 560, top: 690, bot: 870, beam: 780, size: 100, y: 150 }, LPD = 3;   // LPD: the plot's length, in boxes
let LPA = null;
const lpAxes = () => LPA || (LPA = makeAxes({ L: LP.L, R: LP.R, T: LP.T, B: LP.B, xr: [0, LPD, 1], yr: [0, 1, 0.5], ext: 40, xl: 'd', yl: '', labSize: 54, numSize: 28 }));
const PFML = String.raw`e^{-\htmlClass{t-sig}{\sigma}\,\htmlClass{t-ld}{d}}`, PFML1 = PFML + String.raw`\mathrel{\htmlClass{t-eq1}{=}}\htmlClass{t-eq1}{1}`;
let lpFml = null;
function lpFormula() {   // laid out once: e^{−σd} centred, "= 1" after it, so it doesn't move when that comes in
  if (lpFml) return lpFml;
  const sp = place(tex(PFML1), { x: 960 - (tex(PFML).w * LP.size) / 2, y: LP.y, size: LP.size, ax: 0 });
  return (lpFml = { main: sp.filter((s) => !s.a.terms.includes('t-eq1')), eq1: sp.filter((s) => s.a.terms.includes('t-eq1')) });
}
// the long box's stuff: a jittered grid, 40 across by 4 down, twice over (the second set comes in as σ passes its usual value)
const LPSPECKS = Array.from({ length: 320 }, (_, i) => { const k = i % 160, c = k % 40, r = Math.floor(k / 40); return [(c + 0.15 + 0.7 * hash1(i * 3 + 1)) / 40, (r + 0.15 + 0.7 * hash1(i * 3 + 2)) / 4, hash1(i * 3 + 3) * 2 * Math.PI]; });
function drawLabPlot(ctx, st) {
  const a = 1 - smooth(clamp(st.plotOut, 0, 1)); if (a <= 0.003 || st.fml <= 0.003) return;
  const A = lpAxes(), F = lpFormula(), sig = Math.max(0, st.sig) * Math.LN2, f = (x) => Math.exp(-sig * x), ax = smooth(clamp(st.axC, 0, 1)), Fo = labFocus(st);
  TERM_COL['t-sig'] = hexRgb(COL.yellow);
  drawLabFormula(ctx, F, st, a);
  if (st.eq1 > 0.003) drawSprites(ctx, F.eq1, { alpha: a * smooth(clamp(st.eq1, 0, 1)) });
  if (ax <= 0.003) return;
  ctx.save(); ctx.globalAlpha = a;
  drawAxes(ctx, A, { c: ax, nums: 0, lab: ax, xlColor: Fo.c > 0.003 ? mixRgb(WHITE_RGB, hexRgb(LDCOL), Fo.c) : null });
  for (const [v, s] of [[1, '100%'], [0.5, '50%']]) drawTex(ctx, String.raw`\text{${s.replace('%', '\\%')}}`, A.ox - 22, A.Y(v), 28, { ax: 1, alpha: ax });
  const d = clamp(st.dotD, 0, LPD), X0 = A.X(0), Xd = A.X(d), y = LP.beam, H = LP.bot - LP.top;
  drawCurve(ctx, A, f, { p: clamp(st.curveTo, 0, LPD) / LPD, from: 0, to: LPD, color: SH.color, width: 6 });
  // the box, as long as the dot is far; its stuff as dense as σ says, gone when σ is 0
  const ra = clamp(st.sig, 0, 1), rb = clamp(st.sig - 1, 0, 1), w = Xd - X0;
  if (w > 1) {
    ctx.save(); ctx.globalAlpha = a * ax; ctx.beginPath(); ctx.roundRect(X0, LP.top, w, H, Math.min(12, w / 2)); ctx.clip();
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
  ctx.save(); ctx.globalAlpha = a * ax;
  drawBeam(ctx, X0 - 26, xs - 11, y, SH.color, SH.I0, T, [X0, Xd]);
  if (w > 1) { ctx.strokeStyle = COL.greyA; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(X0, LP.top, w, H, Math.min(12, w / 2)); ctx.stroke(); }
  if (Fo.c > 0.003 && w > 1 && (st.ind10 || 0) < 0.5) {   // option 1: a brace under the box, d in its blue, stretching with it; while σ changes, σ in the box instead, in its yellow (option 10 draws its own)
    const sF = clamp(st.sAct || 0, 0, 1), al = Fo.c * (0.7 + 0.3 * clamp(st.dAct || 0, 0, 1)) * (1 - sF), cx = X0 + w / 2;
    if (al > 0.003) { drawBrace(ctx, cx, LP.bot + 16, w, 24, 6, hexRgb(LDCOL), al); drawTex(ctx, 'd', cx, LP.bot + 84, 60, { alpha: al, color: LDCOL }); }
    if (Fo.s > 0.003) {   // in the upper half, over the specks, on a little shade so it reads among them
      const sy = LP.top + 46, sg = ctx.createRadialGradient(cx, sy, 0, cx, sy, 42);
      sg.addColorStop(0, `rgba(28,27,24,${(0.8 * Fo.s).toFixed(3)})`); sg.addColorStop(1, 'rgba(28,27,24,0)');
      ctx.fillStyle = sg; ctx.fillRect(cx - 42, sy - 42, 84, 84);
      drawTex(ctx, String.raw`\sigma`, cx, sy, 64, { alpha: Fo.s, color: COL.yellow });
    }
  }
  const n10 = smooth(clamp(st.ind10 || 0, 0, 1));
  if (n10 > 0.003 && w > 1) {   // option 10, as option 1 shows them but with their values: d = … on the brace under the box, which gives way, while σ changes, to σ = … in the box, on a little shade
    const cx = X0 + w / 2, as = n10 * clamp(st.sAct || 0, 0, 1), ad = n10 * (0.7 + 0.3 * clamp(st.dAct || 0, 0, 1)) * (1 - clamp(st.sAct || 0, 0, 1)), dcol = mixRgb(WHITE_RGB, hexRgb(LDCOL), Fo.c);
    if (ad > 0.003) { drawBrace(ctx, cx, LP.bot + 16, w, 24, 6, dcol, ad); drawTex(ctx, `d = ${d.toFixed(1)}`, cx, LP.bot + 84, 56, { alpha: ad, color: dcol }); }
    if (as > 0.003) {
      const src = String.raw`\sigma = ${(Math.max(0, st.sig) * Math.LN2).toFixed(2)}`, sy = LP.top + 46, tw = tex(src).w * 50;
      ctx.fillStyle = `rgba(28,27,24,${(0.72 * as).toFixed(3)})`; ctx.beginPath(); ctx.roundRect(cx - tw / 2 - 12, sy - 30, tw + 24, 60, 10); ctx.fill();
      drawTex(ctx, src, cx, sy, 50, { alpha: as, color: COL.yellow });
    }
  }
  ctx.save(); ctx.translate(X0 - 26, y); ctx.scale(0.6, 0.6); drawLaser(ctx, 0, 0, SH.color, 1); ctx.restore();
  ctx.save(); ctx.translate(xs, y); ctx.scale(0.6, 0.6); drawSensor(ctx, 0, 0, SH.color, f(d) * SH.I0); ctx.restore();
  const v = f(d) * 100, rd = smooth(clamp(st.readDim || 0, 0, 1)), dec = Math.abs(v - Math.round(v)) < 0.05 ? 0 : 1;   // 50%, 25%, 12.5%
  drawNumber(ctx, v, xs + 30, y - 44, { size: 44, dec, suffix: '%', color: rd > 0.5 ? COL.grey : COL.white, alpha: a * ax * (1 - 0.15 * rd) });   // greyed a little when readDim is on, so the numbers elsewhere stand out
  // the dot riding the curve, and a faint line down to the box's end: the same d in both
  if (st.curveTo > 0.003) {
    const px = A.X(d), py = A.Y(f(d));
    dashed(ctx, px, py + 12, px, LP.top - 4, COL.greyC, 0.8, 2);
    if (px - 12 > A.X(0) + 2) dashed(ctx, px - 12, py, A.X(0), py, COL.greyC, 0.8, 2);   // and across to the y-axis: how much gets through
    dot(ctx, px, py, 11, SH.color, 1);
  }
  ctx.restore();
  ctx.restore();
}
// Which of σ and d is changing (beats 27–29). The presentation shows it with options 1, 8 and 10 and the greyed readout
// (in its PS_DEFAULTS); the bench's "σ or d?" tab can try them with 3 and 9 too, alone or together.
// ind1, colour, brace and focus: d in blue (the blue the boxes were counted in at beat 24), on the formula, the axis and
// a brace under the box; σ in its yellow, the specks' colour; the one changing lit and a little bigger, the other dimmed;
// while σ changes, σ in the box instead of the brace. ind3, the numbers in place of the symbols. ind8, a box around the
// one changing. ind9, the formula itself goes down to the dot, turning into its numbers, rides it while they change,
// and goes back up as symbols once they settle (mv9: how far along that trip it is). ind10, as option 1 shows them but
// with their values (in place of its d and σ): d = … on the brace under the box, giving way while σ changes to σ = …
// in the box. readDim: the sensor's readout greyed a little. sAct and dAct (0 to 1): how much σ or d is changing now,
// worked out by labTrack from how they move.
const LDCOL = COL.blue;
// What's changing, σ or d, from how they move between frames, held half a second after they stop so the focus doesn't
// flicker; and option 9's trip, out to the dot while either is changing, back once both have settled. A rebuild of the
// presentation (a jump to a beat, not a change) isn't counted.
function labTrack(st, dt) {
  const gen = st === PS ? PRES.gen : 0, k = 1 - Math.exp(-Math.max(0, dt) / 0.12), on = (t) => (t != null && TIME - t < 0.5 ? 1 : 0);
  if (st.lgen !== gen) { st.lgen = gen; st.pS = st.sig; st.pD = st.dotD; }
  if (st.pS != null && Math.abs(st.sig - st.pS) > 1e-5) st.tS = TIME;
  if (st.pD != null && Math.abs(st.dotD - st.pD) > 1e-5) st.tD = TIME;
  st.pS = st.sig; st.pD = st.dotD;
  st.sAct = (st.sAct || 0) + (on(st.tS) - (st.sAct || 0)) * k; st.dAct = (st.dAct || 0) + (on(st.tD) - (st.dAct || 0)) * k;
  st.mv9 = (st.mv9 || 0) + ((Math.max(st.sAct, st.dAct) > 0.5 ? 1 : 0) - (st.mv9 || 0)) * (1 - Math.exp(-Math.max(0, dt) / 0.44));
}
const labFocus = (st) => { const c = smooth(clamp(st.ind1 || 0, 0, 1)); return { c, s: c * clamp(st.sAct || 0, 0, 1), d: c * clamp(st.dAct || 0, 0, 1) }; };
function drawLabFormula(ctx, F, st, a) {
  const hiS = smooth(clamp(st.sigHi, 0, 1)), num = smooth(clamp(st.ind3 || 0, 0, 1)), Fo = labFocus(st), sym = a * (1 - num);
  const m9 = smooth(clamp(st.ind9 || 0, 0, 1) * clamp(st.mv9 || 0, 0, 1));
  if (m9 > 0.002 && sym > 0.003 && st.fml >= 1) {   // option 9: on its way to the dot, or riding it, as its numbers (manim's TransformMatchingTex)
    const A = lpAxes(), d = clamp(st.dotD, 0, LPD), px = A.X(d), py = A.Y(Math.exp(-Math.max(0, st.sig) * Math.LN2 * d));
    const N = place(tex(labNumSrc(st)), { x: px + 26, y: py - 46, size: 58, ax: 0 }), M = F.main.map((q) => ({ ...q, color: q.a.terms.includes('t-sig') ? mixRgb(WHITE_RGB, hexRgb(COL.yellow), Math.max(hiS, Fo.c)) : q.a.terms.includes('t-ld') ? mixRgb(WHITE_RGB, hexRgb(LDCOL), Fo.c) : q.color }));   // in the colours it has at the top, so nothing flashes white
    if (m9 >= 0.998) drawSprites(ctx, N, { alpha: sym }); else drawMorph(ctx, matchPlan(M, N), m9, sym);
    return;
  }
  if (sym > 0.003) {
    TERM_COL['t-ld'] = hexRgb(LDCOL);   // while it writes in, already in the colours it keeps
    if (Fo.c <= 0.003 || st.fml < 1) drawSprites(ctx, F.main, { p: st.fml, alpha: sym, hi: { 't-sig': Math.max(hiS, Fo.c), 't-ld': Fo.c } });
    else for (const s of F.main) {
      const isS = s.a.terms.includes('t-sig'), isD = s.a.terms.includes('t-ld'), base = ink(s.color);
      const col = isS ? mixRgb(base, hexRgb(COL.yellow), Math.max(hiS, Fo.c)) : isD ? mixRgb(base, hexRgb(LDCOL), Fo.c) : base;
      const al = s.alpha * sym * (isS ? 1 - 0.65 * Fo.d : isD ? 1 - 0.65 * Fo.s : 1 - 0.35 * Math.max(Fo.s, Fo.d));
      const k = 1 + 0.22 * (isS ? Fo.s : isD ? Fo.d : 0);
      if (k < 1.001) { drawSprite(ctx, s, al, col); continue; }
      const [l, r, t, b] = inkBox(s), cx = (l + r) / 2, cy = (t + b) / 2;
      ctx.save(); ctx.translate(cx, cy); ctx.scale(k, k); ctx.translate(-cx, -cy); drawSprite(ctx, s, al, col); ctx.restore();
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
// gives the readings) and d in boxes, each in its symbol's colour. ind3 puts it in place of e^{−σd}, from a fixed left
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
// Beat 30: any base will do: 2, 3, 10, …, each equal to the same thing with base e, the change of base a number in
// the exponent (ln 2, ln 3, ln 10, rounded); σ keeps its yellow and d its blue. Each row is set as one formula, so its =
// sits on the row's baseline with the usual space either side, and the rows line up on their = signs. A copy of the
// left side glides over and becomes the right side (the −, σ and d move, the base turns into e and the number comes
// in, as manim's TransformMatchingTex does it); the row's = writes in as the copy lands.
const LB = { rows: [330, 480, 630], size: 84, dots: 770, cx: 960 };
const LBS = String.raw`\textcolor{${COL.yellow}}{\sigma}`, LBD = String.raw`\textcolor{${LDCOL}}{d}`;   // σ in its yellow and d in its blue, as at beats 26–29
const LBROW = [['2', '0.69'], ['3', '1.1'], ['10', '2.3']].map(([b, k]) =>
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
  if (st.bStack <= 0.003) return;
  const S = lbSprites(), a = 1;
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
const LWRONG = [String.raw`\textcolor{${COL.blue}}{1}\text{ box:}\quad 100\% ${LOFF('50')} = ${LRES('50')}`,
  String.raw`\textcolor{${COL.blue}}{2}\text{ boxes:}\quad 100\% ${LOFF('100')} = ${LRES('0')}`];
const LW = { x: 1225, y: [170, 240], size: 40 };
function drawLabFigure(ctx, st) {
  const a = smooth(clamp(st.lfig, 0, 1)); if (a <= 0.003) return;
  const fx = 1500, fy = 840, fs = 1.24;
  drawFigure(ctx, fx, fy, fs, a);
  drawThinking(ctx, fx + 110, fy - 410, 1, 100, '', st.lthink, 1, st.lthinkP, a, figHead(fx, fy, fs));
  const w = clamp(st.wrong, 0, 1); if (w <= 0.003) return;
  let x1 = 0;
  LWRONG.forEach((src, i) => { const sp = drawTex(ctx, src, LW.x, LW.y[i], LW.size, { ax: 0, p: clamp(w * 2 - i, 0, 1), alpha: a }); for (const q of sp) x1 = Math.max(x1, inkBox(q)[1]); });
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
    drawLabRow(ctx, X1, { c: 1, scat: st.scat, glow: st.glow, from: '', to: '50%', m: 1, read: smooth(clamp(st.read1, 0, 1)) }, out);
    if (sp > 0.003) {
      let o = { c: st.c2, from: st.r2From, to: st.r2, m: st.r2M, read: smooth(clamp(st.read2, 0, 1)), pop: true, myst: st.myst, rev: st.rev }, al = out * (1 - smooth(clamp(st.rowFade, 0, 1)));
      if (st.loopOn) { const Q = labLoopAt(reduced ? 6 : (((TIME - st.loopT0) % LOOP.P) + LOOP.P) % LOOP.P); o = { ...o, ...Q, read: 1, myst: 0, rev: 1 }; al *= Q.fade; }
      drawLabRow(ctx, mixXf(LABXF.full, LABXF.bot, sp), o, al);
    }
  }
  labLoops(st); labTrack(st, dt); drawLabPlot(ctx, st);
  drawLabBases(ctx, st);
}

// ---- the beats ----
// a sequence of steps that stops where it is if the presentation is rebuilt (a step back) in the middle of it
const labAlive = (g) => g === PRES.gen;
// 21: the field cards and the caption go, and the box grows out of its card to fill the stage
function labZoom() { ptw('usesOut', 1, 0.6); ptw('capOut', 1, 0.6); PS.labOn = 1; return ptw('labX', 1, 1.4, { delay: 0.2 }); }
// 21b: it scatters
function labScatter() { return ptw('scat', 1, 1.0); }
// 21c: it stops scattering; every speck glows red, the beam a little dimmer so the glow shows
function labGlow() { ptw('scat', 0, 0.6); return ptw('glow', 1, 1.0, { delay: 0.4 }); }
// 21d: the glow goes: only absorption
function labAbsorb() { return ptw('glow', 0, 0.9); }
// 22: the sensor's reading, for the first time
function labRead() { return ptw('read1', 1, 0.8); }
function labRead2(text, dur, delay = 0) { PS.r2From = PS.r2; PS.r2 = text; PS.r2M = 0; return ptw('r2M', 1, dur, { delay, ease: linear }); }
// 23: the whole setup is copied, without its readout, and the copy slides down. 23b: a second box slides in beside its
// first while the light past the first box gives way to a row of "?"; then a readout pops up on it: "?"
function labCopy() { PS.r2 = '?'; PS.r2From = ''; PS.r2M = 1; PS.read2 = 0; PS.myst = 0; PS.rev = 1; return ptw('split', 1, 1.95); }
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
// 24b: over my head, how I got there
function labWrong() { return ptw('wrong', 1, 1.6, { ease: linear }); }
// 25: "But that's not what happens": the sum is crossed out. 25b: back from the aside, the light carries on and it reads
// twenty-five. 25c: a third box, twelve and a half.
function labCross() { return ptw('cross', 1, 0.8, { ease: linear }); }
function labReveal() {
  ptw('lfig', 0, 0.5); ptw('wrong', 0, 0.5); ptw('cross', 0, 0.5); ptw('lside', 0, 1.2, { delay: 0.2 });
  ptw('myst', 0, 0.5, { delay: 1.3 }); ptw('rev', 1, 1.0, { delay: 1.6, ease: linear });
  return labRead2('25%', 0.9, 2.5);
}
function labThird() { labRead2('12.5%', 1.2); return ptw('c2', 3, 1.4); }   // the reading changes as the box slides in
// 25d: the bottom row fades, and the loop starts from one box
async function labLoop() {
  const g = PRES.gen;
  await ptw('rowFade', 1, 0.35); if (!labAlive(g)) return;
  PS.loopT0 = TIME; PS.loopOn = 1; PS.rowFade = 0;
}
// 26: the rows go; e^{−σd} writes in, the plot under it, and the curve draws with its dot, the box growing under it
async function labFormula() {
  ptw('rowsOut', 1, 0.7); ptw('fml', 1, 1.2, { delay: 0.5, ease: linear }); ptw('axC', 1, 1.0, { delay: 1.2 });
  PS.dotD = 0; PS.curveTo = 0;
  ptw('curveTo', LPD, 3.2, { delay: 2.2 }); await ptw('dotD', LPD, 3.2, { delay: 2.2 });
}
// 27: the dot runs back and forth along the curve, the box with it; it stops at two boxes
// 27 and 28 play back and forth until the next press, never stopping on their own: a cycle worked out from the clock
// (as 25d's loop is), so a press stops it wherever it is and the next beat carries on from there. 27: the dot from three
// boxes down to 0.4 and back; 28: σ up to twice the usual and down to half (even steps in log2). Both 30% slower than
// the one-off moves they replace.
const LDL = { P: 5.2 }, LSL = { P: 6.8 };
function labLoops(st) {
  if (reduced) return;
  if (st.dLoop) st.dotD = 1.7 + 1.3 * Math.cos((2 * Math.PI * Math.max(0, TIME - st.dLoopT0)) / LDL.P);
  if (st.sLoop) st.sig = Math.pow(2, Math.sin((2 * Math.PI * Math.max(0, TIME - st.sLoopT0)) / LSL.P));
}
// 27: the dot runs back and forth along the curve, the box with it, until the next press (still at two boxes if motion is reduced)
function labDistance() { PS.dLoop = 1; PS.dLoopT0 = TIME; return reduced ? ptw('dotD', 2, 1.2) : Promise.resolve(); }
// 28: the dot settles at two boxes, then σ goes up to twice the usual and down to half, over and over, until the next press
function labSigma() { PS.dLoop = 0; ptw('sigHi', 1, 0.5); PS.sLoop = 1; PS.sLoopT0 = TIME + 0.9; return ptw('dotD', 2, 0.9); }
// 29: σ to zero from wherever it is: a vacuum, and "= 1"
function labVacuum() { PS.dLoop = 0; PS.sLoop = 0; ptw('dotD', 2, 0.6); ptw('eq1', 1, 0.8, { delay: 1.4 }); return ptw('sig', 0, 1.8); }
// 30: the plot and the formula go; 2, 3, 10 … each equal to the same thing with base e (bMorph runs past 1 so the
// last row's = finishes writing)
function labBases() {
  ptw('plotOut', 1, 0.7);
  ptw('bStack', 1, 1.6, { delay: 0.6, ease: linear });
  return ptw('bMorph', 1.1, 2.64, { delay: 2.5, ease: linear });
}
// 31: an aside: me again: but why exponential?
function labWhy() {
  PS.lthink = 'but why exponential?'; PS.lthinkP = 0; ptw('lside', 1, 1.4); ptw('lfig', 1, 1.0, { delay: 0.8 });
  return ptw('lthinkP', 1, 1.0, { delay: 1.7, ease: linear });
}

// ---------- σ or d? (the bench) ----------
// Beats 26–29's formula, plot and box, to try the ways above of showing which of σ and d is changing, alone or
// together; on at the start, what the presentation uses. Which one is changing is worked out from how they move, so the
// buttons and the sliders under the stage both show it.
const SSD = defScene({
  id: 'sigd', tab: 'σ or d?',
  defaults: () => ({ fml: 1, axC: 1, curveTo: LPD, dotD: 2, sig: 1, sigHi: 1, eq1: 0, plotOut: 0, ind1: 1, ind3: 0, ind8: 1, ind9: 0, ind10: 1, readDim: 1, sAct: 0, dAct: 0, mv9: 0 }),
  actions: [
    { id: 'dist', label: 'Change d', primary: true, run: async (st, alive) => {
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
    { type: 'check', key: 'ind10', label: '10 · d = … on the brace, σ = … in the box', set: (v) => tween(SSD, 'ind10', v ? 1 : 0, 0.5) },
    { type: 'check', key: 'readDim', label: 'Sensor readout greyed', set: (v) => tween(SSD, 'readDim', v ? 1 : 0, 0.5) },
    { type: 'range', key: 'sig', label: 'σ (× usual)', min: 0, max: 2, step: 0.01, fmt: (v) => v.toFixed(2), set: (v) => { untween(SSD, 'sig'); SSD.sig = v; } },
    { type: 'range', key: 'dotD', label: 'd (boxes)', min: 0.05, max: LPD, step: 0.01, fmt: (v) => v.toFixed(2), set: (v) => { untween(SSD, 'dotD'); SSD.dotD = v; } },
  ],
  draw: (ctx, dt, st) => { labTrack(st, dt); drawLabPlot(ctx, st); },
});
