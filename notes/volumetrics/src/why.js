// ---------- presentation, part 4: why exponential (beats 32–40) ----------
// We go into the box the way the bench's "Zoom into a slab" does: two fronts sweep in from its ends and meet at one thin
// slice of it, dimming what they pass; then everything but the slice fades away, and we zoom in there, across the beam
// far more than along it, until the beam is a sheet of light and the slice a slab with its particles in it, a shadow
// behind each one. The laser and the sensor come back on either side, the light running between them.
// Each slab takes 10% of the light that reaches it. Its particles are placed at random, and some of them land, at least
// partly, in the shadows of the ones before: each slab gets its fair share of what's left (whyPlace), so n of them leave
// exactly 0.9^n. Every reading is measured from the picture: the share of the sheet's height in no shadow.
// Then (36) the picture moves up, its slabs lined up from the left, and under it a plot of what gets through against the
// number of slabs, its n axis lined up with them: the curve, and a dot for each slab as it comes in. And (37–38) the same
// slabs with their particles clumped at the top of the beam: the first slab takes 10%, the rest hardly anything.
// Last (39–40) the two side by side, each in a frame: placed at random on the left, exponential; clumped on the right,
// non-exponential, which greys out; and the exponential frame grows longer, across the stage, for what comes next.
const WHY = { yc: 540, hh: 240, f: 0.1, m: 5, w: 160, NMAX: 6, NLONG: 10, cx: 940, lf0: 560, sx0: 1320, gap: 150, sheet: 0.8 };
// yc, hh: the sheet's middle and half its height; f: what a slab takes; m: particles to a slab; w: a slab's thickness;
// NMAX: as many as fit at that thickness; NLONG: as many as the long frame holds (40); cx: the middle of the slabs;
// lf0, sx0: the laser's face and the sensor while the slabs leave room; gap: the least room between them and the slabs.
// The slice we go into (32b), in the lab's units: its middle, clear of the specks on the beam's line, and half its
// thickness: the landed slab's thickness over the zoom, so that the zoom is the same across the beam and along it.
const WSX = 40, whySH = () => (WHY.w * SH.beamW) / (4 * WHY.hh);
const WX1 = { ox: 960, oy: 560, s: 1.2 };                           // the lab's row, as at beat 22
const WTK = 0.8;              // the slabs' picture is drawn a fifth smaller
const WDC = [961, WHY.yc];   // the middle of the whole picture (laser to readout), for moving it about whole
// Particles at random, each D of the beam's height, k to a slab, so that the light left past each slab is exactly
// lits[s]: all but the last at random, then the last one moved up or down until it is so. Two in a slab at least far
// apart (px, for a slab T thick on a beam H tall), and at least sep apart across the beam (a thin slab's particles don't
// shade each other); xr: how deep in its slab one can be; edge: kept off the beam's edges.
const whyLitOf = (I) => { const s = I.map(([a, b]) => [Math.max(0, a), Math.min(1, b)]).sort((p, q) => p[0] - q[0]); let cov = 0, end = -1; for (const [a, b] of s) { if (b <= end) continue; cov += b - Math.max(a, end); end = b; } return 1 - cov; };
function whyPlace(seed, { D, k, lits, T, H, far, xr, edge, sep = 0 }) {
  const rnd = rng32(seed), slabs = [], all = [], lo = D / 2 + edge, hi = 1 - D / 2 - edge;
  const fits = (p, ps) => ps.every((q) => Math.hypot((p.xi - q.xi) * T, (p.v - q.v) * H) >= far && Math.abs(p.v - q.v) >= sep);
  for (const L of lits) {
    for (let tries = 0; ; tries++) {
      if (tries > 50000) throw new Error('whyPlace: no arrangement');
      const ps = []; let ok = true;
      for (let i = 0; i < k - 1 && ok; i++) { const p = { xi: lerp(xr[0], xr[1], rnd()), v: lerp(lo, hi, rnd()) }; ok = fits(p, ps); ps.push(p); }
      if (!ok) continue;
      const xi = lerp(xr[0], xr[1], rnd()), base = [...all, ...ps].map((p) => [p.v - D / 2, p.v + D / 2]);
      const g = (v) => whyLitOf([...base, [v - D / 2, v + D / 2]]) - L, N = 800, roots = [];
      let pv = lo, pg = g(lo);
      for (let i = 1; i <= N; i++) {
        const v = lerp(lo, hi, i / N), gv = g(v);
        if (Math.abs(gv) < 1e-12) roots.push(v);
        else if (pg * gv < 0 && Math.abs(pg) >= 1e-12) { let a = pv, b = v, ga = pg; for (let it = 0; it < 60; it++) { const c = (a + b) / 2, gc = g(c); if ((gc < 0) === (ga < 0)) { a = c; ga = gc; } else b = c; } roots.push((a + b) / 2); }
        pv = v; pg = gv;
      }
      const good = roots.filter((v) => fits({ xi, v }, ps));
      if (!good.length) continue;
      ps.push({ xi, v: good[Math.floor(rnd() * good.length)] }); all.push(...ps); slabs.push(ps); break;
    }
  }
  return slabs;
}
// the tiny slabs: five small particles each, a fiftieth of the sheet's height, side by side across it, so each slab
// covers exactly a tenth of it on its own
const WTINY = whyPlace(7, { D: WHY.f / WHY.m, k: WHY.m, lits: Array.from({ length: WHY.NLONG }, (_, n) => Math.pow(1 - WHY.f, n + 1)), T: WHY.w, H: 2 * WHY.hh, far: (WHY.f / WHY.m) * 2 * WHY.hh + 10, xr: [0.2, 0.8], edge: 0.06, sep: WHY.f / WHY.m });
// 37: the same particles clumped, each slab's five in a little zigzag column near the top of the beam, touching; each
// slab's a little lower than the one before, less and less, so the first takes 10% and the rest hardly anything
const WCLD = [0, 0.012, 0.018, 0.021, 0.022, 0.0225];
const WCLUMP = WTINY.map((ps, k) => {
  const rank = ps.map((p, i) => [p.v, i]).sort((a, b) => a[0] - b[0]).map(([, i]) => i), out = [];
  rank.forEach((i, j) => { out[i] = { xi: 0.5 + (j % 2 ? 0.07 : -0.07), v: 0.06 + WCLD[Math.min(k, WCLD.length - 1)] + (WHY.f / WHY.m) * (j + 0.5) }; });
  return out;
});
// what gets through past the first k slabs, placed at random (36) and clumped (38): the plot's dots
const whyDots = (A) => Array.from({ length: A.length + 1 }, (_, k) => whyLitOf(A.slice(0, k).flat().map((p) => [p.v - WHY.f / (2 * WHY.m), p.v + WHY.f / (2 * WHY.m)])));
const WDOTA = whyDots(WTINY), WDOTB = whyDots(WCLUMP);
// What's left of the light past these particles, 0 to 1: the share of the sheet's height in no shadow (a particle only
// partly there, a: partly a shadow).
function whyLit(parts) {
  const cuts = [0, 1];
  for (const p of parts) cuts.push(clamp(p.v - p.D / 2, 0, 1), clamp(p.v + p.D / 2, 0, 1));
  cuts.sort((p, q) => p - q);
  let lit = 0;
  for (let i = 0; i + 1 < cuts.length; i++) {
    const lo = cuts[i], hi = cuts[i + 1]; if (hi - lo < 1e-12) continue;
    const mid = (lo + hi) / 2; let t = 1;
    for (const p of parts) if (Math.abs(p.v - mid) < p.D / 2) { t *= 1 - p.a; if (t <= 0) break; }
    lit += t * (hi - lo);
  }
  return lit;
}
// n tiny slabs (fractional while one comes or goes), side by side and centred; the laser and the sensor moving out only
// once they need the room
function whyTiny(n) {
  const N = Math.max(1, Math.ceil(n - 1e-6)), cw = clamp(n, 1, WHY.NMAX) * WHY.w, x0 = WHY.cx - cw / 2, slabs = [];
  for (let k = 0; k < N; k++) slabs.push({ x0: x0 + k * WHY.w, x1: x0 + (k + 1) * WHY.w, a: smooth(clamp(n - k, 0, 1)) });
  return { slabs, laserX: Math.min(WHY.lf0, x0 - WHY.gap), sensorX: Math.max(WHY.sx0, x0 + cw + WHY.gap) };
}
// 36–38: the picture moves up (its middle at y), its slabs lined up from the left so that slab k ends where the plot under
// it has n = k: the plot's n = 0 at x0, a slab's width w on the stage, 100% at T and 0% at B, up to n slabs.
const WPL = { y: 345, n: 5, fy: 80, fs: 66 };   // and the formula's middle and size, then
const WPA = { x0: 960 - (WPL.n * WHY.w * WTK) / 2, w: WHY.w * WTK, T: 700, B: 930 };
const WXA = WDC[0] + (WPA.x0 - WDC[0]) / WTK;   // where the first slab begins, in the picture's own units
function whyAnch(n) {
  const N = Math.max(1, Math.ceil(n - 1e-6)), slabs = [];
  for (let k = 0; k < N; k++) slabs.push({ x0: WXA + k * WHY.w, x1: WXA + (k + 1) * WHY.w, a: smooth(clamp(n - k, 0, 1)) });
  return { slabs, laserX: WXA - WHY.gap, sensorX: WXA + clamp(n, 1, WHY.NLONG) * WHY.w + WHY.gap };
}
// the plot's axes, m slabs long (five; growing with the slabs in the long frame at 40)
let WPAX = null;
function whyAxes(m = WPL.n) {
  const make = () => makeAxes({ L: WPA.x0, R: WPA.x0 + m * WPA.w, T: WPA.T, B: WPA.B, xr: [0, m, 1], yr: [0, 1, 0.5], ext: 40, xl: 'x', yl: '', labSize: 54, numSize: 28 });
  return m === WPL.n ? WPAX || (WPAX = make()) : make();
}
// 39–40: the frames. The picture over its plot, with n slabs, has its middle at WPC(n) on the stage; in a frame it is
// drawn k as large, its middle at the frame's.
const WPC = (n) => [978.5 + 0.5 * WPA.w * (n - WPL.n), 541];
const WFRAME = { L: [50, 200, 890, 690], R: [980, 200, 890, 690], long: [50, 200, 1820, 690], k: 0.675, klong: 0.76, ty: 150, tsize: 44 };   // (klong: a little larger in the long frame)
// The discrete version: what gets through after each whole slab, level across a slab and dropping at its end, with a dot
// at each slab's reading, drawn as the slabs come in (n: how many there are). In the light's red: it is what the light
// does; the formula's own curve is white, like the formula.
function whySteps(ctx, A, T, n, a) {
  if (a <= 0.003) return;
  ctx.save(); ctx.strokeStyle = hexA(SH.color, a); ctx.lineWidth = 5; ctx.lineJoin = 'miter'; ctx.lineCap = 'butt'; ctx.beginPath(); ctx.moveTo(A.X(0), A.Y(T[0]));
  for (let k = 1; k < T.length; k++) {
    const p = clamp(n - (k - 1), 0, 1); if (p <= 0) break;
    ctx.lineTo(A.X(k - 1 + clamp(p / 0.7, 0, 1)), A.Y(T[k - 1]));
    if (p > 0.7) ctx.lineTo(A.X(k), A.Y(lerp(T[k - 1], T[k], (p - 0.7) / 0.3)));
    if (p < 1) break;
  }
  ctx.stroke(); ctx.restore();
  for (let k = 0; k < T.length && k <= n + 1e-6; k++) dot(ctx, A.X(k), A.Y(T[k]), 8, SH.color, a * (k === 0 ? 1 : smooth(clamp((n - (k - 0.12)) / 0.12, 0, 1))));
}
const WCURVE = String.raw`e^{-\textcolor{${COL.yellow}}{\sigma}\,\textcolor{${COL.blue}}{x}}`;   // the continuous version, in the formula's colours
// The zoom (32c), on the stage: from the lab's row, around the slice where it crosses the beam, the same in every
// direction, until the beam is the sheet of the (smaller) picture and the slice its slab. X, Y: a point in the lab's
// units, on the stage now.
function whyZoomGeo(z) {
  const e = smooth(clamp(z, 0, 1)), Z1 = (2 * WHY.hh * WTK) / (SH.beamW * WX1.s), S = Math.exp(e * Math.log(Z1));
  const x0 = WX1.ox + WX1.s * WSX, y0 = WX1.oy, x1 = WDC[0] + (WHY.cx - WDC[0]) * WTK, y1 = WDC[1] + (WHY.yc - WDC[1]) * WTK;
  const cx = lerp(x0, x1, e), cy = lerp(y0, y1, e);
  return { e, S, cx, cy, X: (x) => cx + WX1.s * (x - WSX) * S, Y: (y) => cy + WX1.s * y * S, hh: (SH.beamW / 2) * WX1.s * S };
}
// ---- drawing ----
const whyDisc = (ctx, x, y, r, a) => {   // a particle, as the bench draws them
  if (a <= 0.003) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = PART; ctx.strokeStyle = COL.greyB; ctx.lineWidth = clamp(r * 0.16, 1.5, 3.2);
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore();
};
function whyLaser(ctx, xf, yc, hh, a, on = 1, bw = 192) {   // the laser that sends out a sheet: its face, as tall as the sheet, at xf; its light on or off; its body bw wide
  if (a <= 0.003) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.lineWidth = 3; ctx.strokeStyle = COL.greyB; ctx.lineJoin = 'round';
  ctx.fillStyle = BODY; ctx.beginPath(); ctx.roundRect(xf - 22 - bw, yc - hh - 30, bw, 2 * hh + 60, 14); ctx.fill(); ctx.stroke();
  ctx.fillStyle = NOZZLE; ctx.beginPath(); ctx.roundRect(xf - 22, yc - hh - 10, 22, 2 * hh + 20, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#3E3B35'; ctx.beginPath(); ctx.arc(xf - 66, yc - hh - 4, 7, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha *= on; ctx.fillStyle = SH.color; ctx.fill();
  ctx.restore();
}
function whySensor(ctx, x, yc, hh, a) {
  if (a <= 0.003) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = BODY; ctx.strokeStyle = COL.greyB; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.roundRect(x, yc - hh - 14, 26, 2 * hh + 28, 5); ctx.fill(); ctx.stroke(); ctx.restore();
}
function whyReadout(ctx, x, yc, T, a) {   // beside the sensor, as in the bench: what gets through, measured from the picture
  if (a <= 0.003) return;
  const bx = x + 50, bw = 210, bh = 92, v = T * 100, pop = lerp(0.7, 1, a);
  ctx.save(); ctx.translate(bx, yc); ctx.scale(pop, pop); ctx.translate(-bx, -yc); ctx.globalAlpha *= a;
  ctx.strokeStyle = COL.greyB; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x + 26, yc); ctx.lineTo(bx, yc); ctx.stroke();
  ctx.fillStyle = BG; ctx.beginPath(); ctx.roundRect(bx, yc - bh / 2, bw, bh, 12); ctx.fill(); ctx.stroke();
  ctx.restore();
  drawNumber(ctx, v, bx + bw / 2, yc + 17, { size: 50, dec: Math.abs(v - Math.round(v)) < 0.05 ? 0 : 1, suffix: '%', align: 'center', alpha: a * ctx.globalAlpha });
}
// A picture from inside the beam. V: yc, hh; the light from xL to xR, as bright as power; slabs [{x0, x1, a}], their faces
// dashed; parts [{x, v, D, a}], each a disc with its shadow behind it up to the light's end; the laser's face at laserX and
// the sensor at sensorX (laserA, sensorA; laserW, the laser's body if it isn't the usual width); the reading (readA).
function whyView(ctx, V) {
  const { yc, hh } = V, top = yc - hh, c = hexRgb(SH.color);
  if (V.xR > V.xL + 0.5) {
    ctx.save(); const A0 = ctx.globalAlpha;
    ctx.fillStyle = rgba(c, (V.sheet ?? WHY.sheet) * V.power * (V.light ?? 1)); ctx.fillRect(V.xL, top, V.xR - V.xL, 2 * hh);
    ctx.fillStyle = BG;   // the shadows: no light behind a particle, all the way to the sensor
    for (const p of V.parts) { if (p.a <= 0.003 || p.x >= V.xR) continue; const r = (p.D / 2) * 2 * hh; ctx.globalAlpha = A0 * p.a; ctx.fillRect(p.x, top + p.v * 2 * hh - r, V.xR - p.x, 2 * r); }
    ctx.restore();
  }
  const fe = V.fext ?? 36;
  for (const s of V.slabs) if (s.a > 0.003) for (const x of [s.x0, s.x1]) dashed(ctx, x, top - fe, x, top + 2 * hh + fe, COL.greyC, s.a, 2);
  for (const p of V.parts) whyDisc(ctx, p.x, top + p.v * 2 * hh, (p.D / 2) * 2 * hh, p.a);
  whyLaser(ctx, V.laserX, yc, hh, V.laserA, V.light ?? 1, V.laserW);
  whySensor(ctx, V.sensorX, yc, hh, V.sensorA);
  whyReadout(ctx, V.sensorX, yc, whyLit(V.parts), V.readA * (V.light ?? 1));
}
// Drawn moved, the picture's middle at (x, y), scaled by k
const whyAt = (ctx, [x, y, k], f) => { ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.translate(-WDC[0], -WDC[1]); f(); ctx.restore(); };
const WMUL = String.raw`\textcolor{${COL.red}}{\times\,0.9}`, WPOW = (n) => String.raw`0.9^{\textcolor{${COL.blue}}{${n}}}`;
// 35: the same with base e: ln 0.9 = −0.105, in σ's yellow (it is what σ will be, per slab), and the distance in blue as
// the brace has it, nΔx (a slab is Δx, one unit, thick)
const WEXP = (n) => String.raw`e^{\textcolor{${COL.yellow}}{-0.105}\times\textcolor{${COL.blue}}{${n === 1 ? '' : n + String.raw`\,`}\Delta x}}`;   // the distance as the brace has it, nΔx
const wfePlans = new Map();
const WF = { y: 150, size: 86, ly: WHY.yc - WHY.hh - 58, lsize: 50 };
let wfX = null, wfPlan = null;
const whyFx = () => wfX ?? (wfX = 960 - (tex(WPOW(6)).w * WF.size) / 2);   // from a fixed left edge, so 0.9 stays put as the count changes
const whyPowAt = (t0) => 0.64 + 0.36 * Math.cos((2 * Math.PI * Math.max(0, TIME - t0)) / 4.6);   // 33: the light, brighter and dimmer
// 34d: slabs come and go, a handful, never more than fit: one step a second
const WNSEQ = [3, 4, 5, 6, 5, 4, 3, 2, 1, 2];
function whyNAt(t0) {
  const u = Math.max(0, TIME - t0), i = Math.floor(u), f = u - i, a = WNSEQ[i % WNSEQ.length], b = WNSEQ[(i + 1) % WNSEQ.length];
  return lerp(a, b, smooth(clamp((f - 0.45) / 0.55, 0, 1)));
}
function WHY_DEFAULTS() { return {
  won: 0, wsel: 0, wfade: 0, wzoom: 0, wls: 0, wread: 0, wbr: 0, wpow: 1, wpowLoop: 0, wpowT0: 0, wsay: 0, wsayP: 0, wlab: 0, wn: 1, wfm: 0, wnLoop: 0, wnT0: 0,
  wfe: 0, wpl: 0, wax: 0, wcur: 0, wdA: 0, wdB: 0, wlight: 1, wclump: 0, wfo: 0, wsp: 0, wnmL: 0, wnmR: 0, wgrey: 0, wlong: 0, wnL: 5, bOut: 0,
}; }
// 37: how far slab k's particles have moved into their clump: the first slab's first, then the others'
const whyClumpAt = (c, k) => smooth(clamp((c - (k === 0 ? 0 : 0.3 + 0.07 * (k - 1))) / 0.42, 0, 1));   // (the last done as c reaches 1)
// The lab's row, and on it the slice: the fronts sweep in from the box's ends and meet at its faces, dimming what they
// pass (32b); then all but the slice fades away; at the zoom (z > 0) the slice is drawn by whyZoomIn instead.
function whyBox(ctx, st, z) {
  const sel = smooth(clamp(st.wsel, 0, 1)), fade = smooth(clamp(st.wfade, 0, 1)), X = WX1, sx = (x) => X.ox + X.s * x, sy = (y) => X.oy + X.s * y;
  const h = whySH(), lf = lerp(-LAB.BW / 2, WSX - h, sel), rf = lerp(LAB.BW / 2, WSX + h, sel), xa = sx(WSX - h), xb = sx(WSX + h), o = { c: 1, from: '', to: '50%', m: 1, read: 1 };
  ctx.save(); ctx.beginPath(); ctx.rect(-50, -50, W + 100, H + 100); ctx.rect(xa, -50, xb - xa, H + 100); ctx.clip('evenodd');
  drawLabRow(ctx, X, o, 1 - fade);
  if (sel > 0.003 && fade < 0.997) {   // what the fronts have passed, dimmed
    ctx.fillStyle = `rgba(28,27,24,${(0.6 * sel * (1 - fade)).toFixed(3)})`;
    ctx.fillRect(sx(-LAB.BW / 2) - 3, sy(LAB.top) - 3, sx(lf) - sx(-LAB.BW / 2) + 3, sy(LAB.bot) - sy(LAB.top) + 6);
    ctx.fillRect(sx(rf), sy(LAB.top) - 3, sx(LAB.BW / 2) - sx(rf) + 3, sy(LAB.bot) - sy(LAB.top) + 6);
  }
  ctx.restore();
  if (z <= 0.001) { ctx.save(); ctx.beginPath(); ctx.rect(xa, -50, xb - xa, H + 100); ctx.clip(); drawLabRow(ctx, X, o, 1); ctx.restore(); }
  const fa = 0.85 * sel;   // the fronts, which become the slab's faces (on the way in, whyZoomIn draws them)
  if (fa > 0.003 && z <= 0.001) { ctx.save(); ctx.strokeStyle = hexA(COL.white, fa); ctx.lineWidth = 2; ctx.beginPath(); for (const x of [lf, rf]) { ctx.moveTo(sx(x), sy(LAB.top)); ctx.lineTo(sx(x), sy(LAB.bot)); } ctx.stroke(); ctx.restore(); }
}
// On the way in: the box's stuff in the slice (its haze, the box's walls, any speck drifting through: they don't grow,
// they go, as the slab's particles come), and the fronts, going as its dashed faces come
function whyZoomIn(ctx, Z) {
  const h = whySH(), x0 = Z.X(WSX - h), x1 = Z.X(WSX + h), B = { x0: -LAB.BW / 2, x1: LAB.BW / 2, top: LAB.top, bot: LAB.bot };
  const fa = 0.85 * (1 - smooth(clamp(Z.e / 0.45, 0, 1)));
  if (fa > 0.003) { ctx.save(); ctx.strokeStyle = hexA(COL.white, fa); ctx.lineWidth = 2; ctx.beginPath(); for (const x of [x0, x1]) { ctx.moveTo(x, Math.max(-10, Z.Y(B.top))); ctx.lineTo(x, Math.min(H + 10, Z.Y(B.bot))); } ctx.stroke(); ctx.restore(); }
  const a = 1 - smooth(clamp((Z.e - 0.15) / 0.4, 0, 1)); if (a <= 0.003) return;
  ctx.save(); ctx.beginPath(); ctx.rect(x0, -20, x1 - x0, H + 40); ctx.clip(); ctx.globalAlpha *= a;
  ctx.fillStyle = 'rgba(170,164,152,0.12)'; ctx.fillRect(x0, Z.Y(B.top), x1 - x0, Z.Y(B.bot) - Z.Y(B.top));
  ctx.strokeStyle = COL.greyA; ctx.lineWidth = 4.8; ctx.beginPath(); for (const y of [B.top, B.bot]) { ctx.moveTo(x0, Z.Y(y)); ctx.lineTo(x1, Z.Y(y)); } ctx.stroke();
  const sa = 1 - smooth(clamp(Z.e / 0.2, 0, 1));
  if (sa > 0.003) for (const [u, v, ph, jy] of BOXSPECKS) { const [x, y] = speckXY(B, u, v, ph, jy); if (Math.abs(x - WSX) > h + 6) continue; dot(ctx, Z.X(x), Z.Y(y), 3.6 * WX1.s, COL.yellow, 0.62 * sa); }
  ctx.restore();
}
// The main picture: the slabs, centred (32c–35) or lined up from the left over the plot (36 on, as pl goes to 1), their
// particles where they were placed or (37) clumped, with the light, the laser and the sensor
function whyMain(st) {
  const z = clamp(st.wzoom, 0, 1), Z = whyZoomGeo(z), into = z < 1, ls = smooth(clamp(st.wls, 0, 1)), pl = smooth(clamp(st.wpl, 0, 1));
  const C = whyTiny(into ? 1 : st.wn), A = whyAnch(into ? 1 : st.wn), T = { slabs: C.slabs.map((s, k) => ({ x0: lerp(s.x0, A.slabs[k].x0, pl), x1: lerp(s.x1, A.slabs[k].x1, pl), a: s.a })) };
  const yc = into ? Z.cy : WHY.yc, hh = into ? Z.hh : WHY.hh, slabs = [], parts = [], D = WHY.f / WHY.m;
  const tiny = into ? [{ x0: Z.X(WSX - whySH()), x1: Z.X(WSX + whySH()), a: 1 }] : T.slabs, pa = into ? smooth(clamp((Z.e - 0.35) / 0.35, 0, 1)) : 1;
  tiny.forEach((s, k) => {
    slabs.push({ x0: s.x0, x1: s.x1, a: s.a * (into ? Z.e : 1) });
    const c = into ? 0 : whyClumpAt(st.wclump, k);
    WTINY[k].forEach((p, i) => { const q = WCLUMP[k][i]; parts.push({ x: lerp(s.x0, s.x1, lerp(p.xi, q.xi, c)), v: lerp(p.v, q.v, c), D, a: s.a * pa }); });
  });
  const laserX = lerp(C.laserX, A.laserX, pl), sensorX = lerp(C.sensorX, A.sensorX, pl), s0 = tiny[0];
  // on the way in, everything is on the stage already (and the light only in the slice); once landed, in the picture's own
  // units, drawn smaller
  const l = into ? 0 : ls;
  return { yc, hh, slabs, parts, laserX, sensorX, laserA: l, sensorA: l, readA: smooth(clamp(st.wread, 0, 1)), power: clamp(st.wpow, 0, 1), light: clamp(st.wlight, 0, 1), fext: into ? 36 * WTK : 36,
    xL: lerp(s0.x0, laserX, l), xR: lerp(s0.x1, sensorX, l), sheet: into ? lerp(0.7, WHY.sheet, Z.e) : WHY.sheet, Z, into, T, pl };
}
// Δx under the slab: a small piece of the distance x, in x's blue; as slabs come and go it stretches under all of them,
// reading 2Δx, 3Δx, … (the count changing halfway through each slab's coming or going)
function whyBrace(ctx, V, n, br) {
  const s0 = V.T.slabs[0]; if (br <= 0.003 || !s0) return;
  const k = Math.round(n), by = V.yc + V.hh + 44, cx = s0.x0 + (n * WHY.w) / 2;
  drawBrace(ctx, cx, by, n * WHY.w, 24, 6, hexRgb(LDCOL), br);
  drawTex(ctx, k === 1 ? String.raw`\Delta x` : String.raw`${k}\,\Delta x`, cx, by + 56, 50, { alpha: br, color: LDCOL });
}
// 36 on: the plot under the picture, for a state S (the presentation's, or the left frame's own), its x axis m slabs long
// and lined up with the slabs (slab k ends over x = kΔx): the continuous version, white, labelled e^{−σx} in the
// formula's colours; the discrete version, the slabs' readings as red steps with a dot at each, drawn as each slab
// comes in (placed at random, or clumped); a faint dashed line from where the slabs end down to it
function whyPlot(ctx, S, V, n, m = WPL.n) {
  const ax = smooth(clamp(S.wax, 0, 1)); if (ax <= 0.003) return;
  const A = whyAxes(m), f = (x) => Math.pow(1 - WHY.f, x), cu = clamp(S.wcur, 0, 1);
  drawAxes(ctx, A, { c: ax, nums: 0, lab: ax, xlColor: hexRgb(LDCOL) });
  for (const [v, t] of [[1, '100%'], [0.5, '50%']]) drawTex(ctx, String.raw`\text{${t.replace('%', '\\%')}}`, A.ox - 22, A.Y(v), 28, { ax: 1, alpha: ax });
  if (cu > 0.003) {
    drawCurve(ctx, A, f, { p: cu, from: 0, to: m, color: COL.white, width: 4 });
    drawTex(ctx, WCURVE, A.X(m) + 22, A.Y(f(m)), 46, { ax: 0, alpha: ax * smooth(clamp((cu - 0.85) / 0.15, 0, 1)) });
  }
  whySteps(ctx, A, WDOTA, S.wn, ax * smooth(clamp(S.wdA, 0, 1)));
  whySteps(ctx, A, WDOTB, S.wn, ax * smooth(clamp(S.wdB, 0, 1)));
  const la2 = ax * clamp(S.wlight, 0, 1) * smooth(clamp(cu * 3, 0, 1));
  if (la2 > 0.003) { const px = A.X(n), yb = WPL.y + (WHY.hh + 36) * WTK; dashed(ctx, px, yb + 4, px, A.Y(whyLit(V.parts)) - 6, COL.greyC, 0.8 * la2, 2); }
}
function drawWhy(ctx, dt, st) {
  const on = clamp(st.won, 0, 1); if (on <= 0.003) return;
  if (!reduced) { if (st.wpowLoop) st.wpow = whyPowAt(st.wpowT0); if (st.wnLoop) st.wn = whyNAt(st.wnT0); }
  const z = clamp(st.wzoom, 0, 1), sp = smooth(clamp(st.wsp, 0, 1)), long = smooth(clamp(st.wlong, 0, 1)), grey = smooth(clamp(st.wgrey, 0, 1));
  ctx.save(); ctx.globalAlpha *= on;
  if (z < 1) whyBox(ctx, st, z);
  if (z > 0) {
    // the picture a fifth smaller (on the way in, it is on the stage already); from 36, moved up over the plot
    const V = whyMain(st), at = V.into ? [WDC[0], WDC[1], 1] : [WDC[0], lerp(WDC[1], WPL.y, V.pl), WTK], s0 = V.into ? null : V.T.slabs[0];
    const la = smooth(clamp(st.wlab, 0, 1)), fm = clamp(st.wfm, 0, 1), n = clamp(st.wn, 1, WHY.NLONG);
    // 39: all of it, the picture and its plot, moves into the frame on the right; 40: and goes
    const c5 = WPC(WPL.n), R = WFRAME.R, mk = lerp(1, WFRAME.k, sp);
    ctx.save(); ctx.globalAlpha *= 1 - long; ctx.translate(lerp(c5[0], R[0] + R[2] / 2, sp), lerp(c5[1], R[1] + R[3] / 2, sp)); ctx.scale(mk, mk); ctx.translate(-c5[0], -c5[1]);
    whyAt(ctx, at, () => {
      if (V.into) whyZoomIn(ctx, V.Z);
      whyView(ctx, V);
      if (!V.into) whyBrace(ctx, V, n, smooth(clamp(st.wbr, 0, 1)));
      // 33b: what the slab says
      if (st.wsay > 0.003 && s0) drawThinking(ctx, (s0.x0 + s0.x1) / 2, 168, 1, 84, '', String.raw`whatever comes in, I take 10\%`, 1, st.wsayP, smooth(clamp(st.wsay, 0, 1)), [(s0.x0 + s0.x1) / 2, V.yc - V.hh - 42]);
      // 34–34c: × 0.9 over each slab
      if (la > 0.003 && !V.into && fm <= 0.001) V.T.slabs.forEach((s) => drawTex(ctx, WMUL, (s.x0 + s.x1) / 2, WF.ly, WF.lsize, { alpha: la * s.a }));
    });
    // 34d: the three × 0.9 become 0.9^3 at the top, and the count follows the slabs from then on (the formula keeps its
    // size: the labels it comes from are where the smaller picture has them). 35: 0.9^n becomes e^{−0.105 n}. From 36 it
    // sits higher and a little smaller, over the picture.
    const lf = la * (1 - smooth(clamp(st.wfo, 0, 1)));   // (37: it goes: it doesn't hold for clumped particles)
    if (lf > 0.003 && !V.into && fm > 0.001) {
      const k = Math.round(n), fy = lerp(WF.y, WPL.fy, V.pl), fs = lerp(WF.size, WPL.fs, V.pl), fe = clamp(st.wfe, 0, 1);
      const ex = 960 - (tex(WEXP(6)).w * fs) / 2;
      if (fm < 0.999) {
        const [ax, ay, ak] = at, at3 = (j) => place(tex(WMUL), { x: ax + (WHY.cx + (j - 1) * WHY.w - WDC[0]) * ak, y: ay + (WF.ly - WDC[1]) * ak, size: WF.lsize * ak });
        if (!wfPlan || wfPlan.k !== ak) wfPlan = Object.assign(matchPlan([...at3(0), ...at3(1), ...at3(2)], place(tex(WPOW(3)), { x: whyFx(), y: WF.y, size: WF.size, ax: 0 })), { k: ak });
        drawMorph(ctx, wfPlan, fm, lf);
      } else if (fe <= 0.001) drawTex(ctx, WPOW(k), whyFx(), fy, fs, { ax: 0, alpha: lf });
      else if (fe >= 0.999) drawTex(ctx, WEXP(k), ex, fy, fs, { ax: 0, alpha: lf });
      else {
        const key = k + '|' + fy.toFixed(1) + '|' + fs.toFixed(1);
        if (!wfePlans.has(key)) wfePlans.set(key, matchPlan(place(tex(WPOW(k)), { x: whyFx(), y: fy, size: fs, ax: 0 }), place(tex(WEXP(k)), { x: ex, y: fy, size: fs, ax: 0 })));
        drawMorph(ctx, wfePlans.get(key), fe, lf);
      }
    }
    if (!V.into) whyPlot(ctx, st, V, n);
    ctx.restore();
  }
  // 39: in a frame on the left, the same slabs with their particles placed at random, their steps on the curve; the two
  // frames, and their names (39b, 39c). 40: the left frame grows longer, across the stage, and more slabs come in, the
  // brace, the plot's axis, its curve and its steps with them
  if (sp > 0.003) {
    const nL = clamp(st.wnL, 1, WHY.NLONG), S = Object.assign(WHY_DEFAULTS(), { wzoom: 1, wls: 1, wread: 1, wpl: 1, wax: 1, wcur: 1, wdA: 1, wn: nL }), V = whyMain(S);
    const F = lerpRect(WFRAME.L, WFRAME.long, long), c = WPC(nL), R = WFRAME.R, k = lerp(WFRAME.k, WFRAME.klong, long);
    const vo = 1 - smooth(clamp((st.von || 0) * 2.2, 0, 1));   // 41: its slabs, its plot and the frame itself make way for part 5 (vary.js)
    ctx.save(); ctx.globalAlpha *= sp * vo; ctx.translate(F[0] + F[2] / 2, F[1] + F[3] / 2); ctx.scale(k, k); ctx.translate(-c[0], -c[1]);
    whyAt(ctx, [WDC[0], WPL.y, WTK], () => { whyView(ctx, V); whyBrace(ctx, V, nL, 1); });
    whyPlot(ctx, S, V, nL, Math.max(WPL.n, nL));
    ctx.restore();
    const frame = (Q, a) => { if (a > 0.003) { ctx.save(); ctx.strokeStyle = hexA(COL.greyC, a); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.roundRect(Q[0], Q[1], Q[2], Q[3], 14); ctx.stroke(); ctx.restore(); } };
    frame(F, sp * vo); frame(R, sp * (1 - long));
    if (st.wnmL > 0.003) drawTex(ctx, String.raw`\text{exponential media}`, F[0] + F[2] / 2, WFRAME.ty, WFRAME.tsize, { p: clamp(st.wnmL, 0, 1), alpha: vo });
    if (st.wnmR > 0.003) drawTex(ctx, String.raw`\text{non-exponential media}`, R[0] + R[2] / 2, WFRAME.ty, WFRAME.tsize, { p: clamp(st.wnmR, 0, 1), alpha: 1 - long, color: mixRgb(WHITE_RGB, hexRgb(COL.greyC), grey) });
  }
  ctx.restore();
  // 39d: the right one greys out: not for now
  greyOut(ctx, WFRAME.R, grey * (1 - long) * on, 0.35 * grey * (1 - long) * on);
}

// ---- the beats ----
// 32: back from the aside: the plot goes, and the box is on the stage again as at beat 22, reading 50%
function whyBox32() { ptw('lfig', 0, 0.5); ptw('bOut', 1, 0.5); ptw('plotOut', 1, 0.5); ptw('lside', 0, 1.2, { delay: 0.2 }); return ptw('won', 1, 0.9, { delay: 0.4 }); }
// 32b: two fronts sweep in from the box's ends and meet at a thin slice of it; then all but the slice fades away
function whySelect() { ptw('wsel', 1, 1.4); return ptw('wfade', 1, 0.8, { delay: 1.8 }); }
// 32c: the zoom; once in, the light runs from the laser, which comes back, to the sensor; then Δx under the slab
function whyZoom() { ptw('wls', 1, 0.8, { delay: 2.5 }); ptw('wbr', 1, 0.6, { delay: 3.0 }); return ptw('wzoom', 1, 2.4); }
// 32d: the sensor reads 90%
function whyRead() { return ptw('wread', 1, 0.45); }
// 33: the light goes brighter and dimmer, over and over, until the next press; the reading stays (dimmer once, if motion is reduced)
function whyBright() { PS.wpowLoop = 1; PS.wpowT0 = labLoopStart('wpT0', TIME + 0.2); return reduced ? ptw('wpow', 0.45, 1.2) : Promise.resolve(); }
// 33b: what the slab says
function whySays() { PS.wsayP = 0; ptw('wsay', 1, 0.5); return ptw('wsayP', 1, 1.1, { delay: 0.3, ease: linear }); }
// 34: the light settles and the slab has said its piece: × 0.9 over it. 34b, 34c: another slab, and another
function whyTimes() {
  if (PS.wpowLoop && !reduced) PS.wpow = whyPowAt(PS.wpowT0);
  PS.wpowLoop = 0; ptw('wpow', 1, 0.6); ptw('wsay', 0, 0.4); return ptw('wlab', 1, 0.6, { delay: 0.3 });
}
function whyAdd(n) { return ptw('wn', n, 1.2); }
// 34d: the three × 0.9 become 0.9^3; then slabs come and go, the count with them, until the next press (once up to six,
// if motion is reduced)
function whyPower() {
  PS.wnLoop = 1; PS.wnT0 = labLoopStart('wnT0', TIME + 1.6);
  if (reduced) ptw('wn', WHY.NMAX, 1.5, { delay: 1.4 });
  return ptw('wfm', 1, 1.3);
}
// 35: 0.9^n with base e, e^{−0.105 n}; the slabs keep coming and going
function whyE() { return ptw('wfe', 1, 1.4); }
// Slabs come in one at a time, from however many there are up to five, a moment after each
async function whyUpTo5(g) {
  for (let k = Math.floor(PS.wn + 1e-6) + 1; k <= WPL.n; k++) {
    await ptw('wn', k, 0.8); if (!labAlive(g)) return;
    await sleep(0.3, 'pres'); if (!labAlive(g)) return;
  }
}
// 36: the slabs settle at one, the picture moves up, its slabs lined up from the left, and the plot comes in under it;
// the curve draws, and then the slabs come in one at a time up to five, each one's reading a dot on the plot
async function whyCurve() {
  const g = PRES.gen;
  if (PS.wnLoop && !reduced) PS.wn = whyNAt(PS.wnT0);
  PS.wnLoop = 0; ptw('wn', 1, 0.9); ptw('wpl', 1, 1.4); ptw('wax', 1, 1.0, { delay: 1.2 }); ptw('wdA', 1, 0.4, { delay: 2.2 });
  await ptw('wcur', 1, 1.6, { delay: 2.2, ease: linear }); if (!labAlive(g)) return;
  await whyUpTo5(g);
}
// 37: the formula goes, the light goes off, and the particles move into a clump at the top of the beam: the first slab's,
// then the others'
function whyClump() { ptw('wfo', 1, 0.6); ptw('wlight', 0, 0.6); return ptw('wclump', 1, 2.6, { delay: 0.7 }); }
// 38: the same again: the dots go, back to one slab, the light on, and the slabs come in one at a time up to five, each
// one's reading a dot: the first takes 10%, the rest hardly anything
async function whyFlat() {
  const g = PRES.gen;
  ptw('wdA', 0, 0.5); await ptw('wn', 1, 0.9); if (!labAlive(g)) return;
  ptw('wdB', 1, 0.4); await ptw('wlight', 1, 0.6); if (!labAlive(g)) return;
  await sleep(0.3, 'pres'); if (!labAlive(g)) return;
  await whyUpTo5(g);
}
// 39: the clumped picture and its plot move into a frame on the right, and the same slabs placed at random come in, in a
// frame on the left. 39b, 39c: their names. 39d: the right one greys out
function whyVersus() { return ptw('wsp', 1, 1.6); }
function whyNameL() { return ptw('wnmL', 1, 0.8, { ease: linear }); }
function whyNameR() { return ptw('wnmR', 1, 0.9, { ease: linear }); }
function whyGrey() { return ptw('wgrey', 1, 0.9); }
// 40: the greyed frame goes and the exponential one grows longer, across the stage; more slabs come in, up to ten
function whyLong() { ptw('wlong', 1, 1.6); return ptw('wnL', WHY.NLONG, 2.6, { delay: 0.9, ease: linear }); }
