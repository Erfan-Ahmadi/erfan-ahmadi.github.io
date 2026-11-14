// ---------- presentation, part 4: why exponential (beats 32–39) ----------
// We go into the box the way the bench's "Zoom into a slab" does: two fronts sweep in from its ends and meet at one thin
// slice of it, dimming what they pass; then everything but the slice fades away, and we zoom in there, across the beam
// far more than along it, until the beam is a sheet of light and the slice a slab with its particles in it, a shadow
// behind each one. The laser and the sensor come back on either side, the light running between them.
// Each slab takes 10% of the light that reaches it. Its particles are placed at random, and some of them land, at least
// partly, in the shadows of the ones before: each slab gets its fair share of what's left (whyPlace), so n of them leave
// exactly 0.9^n. Every reading is measured from the picture: the share of the sheet's height in no shadow.
// Then two thicker slabs, their particles placed with care, in rows, as in the bench's "Shadows in a slab" lattice: the
// second where the first lets light through (0%), or right behind it (50%); and two placed at random (25%).
const WHY = { yc: 540, hh: 240, f: 0.1, m: 5, w: 160, NMAX: 6, cx: 940, lf0: 560, sx0: 1320, gap: 150, sheet: 0.8 };
// yc, hh: the sheet's middle and half its height; f: what a slab takes; m: particles to a slab; w: a slab's thickness;
// NMAX: as many as fit at that thickness; cx: the middle of the slabs; lf0, sx0: the laser's face and the sensor while
// the slabs leave room; gap: the least room between them and the slabs.
const WSLH = (LAB.BW * Math.log(1 - WHY.f)) / Math.log(0.5) / 2;   // half the slice we go into, in the lab's units: as long as takes 10% (the box takes 50%)
const WX1 = { ox: 960, oy: 560, s: 1.2 };                           // the lab's row, as at beat 22
// The two thicker slabs (35–39), at scale 1: where they are, the laser's face and the sensor; three particles to a row,
// each row as tall as a tenth of the sheet; which tenths the first slab's rows close, and the second's (in the gaps).
const WST = { s1: [WHY.cx - 320, WHY.cx - 20], s2: [WHY.cx + 20, WHY.cx + 320], laserX: WHY.cx - 470, sensorX: WHY.cx + 470, xi: [0.2, 0.5, 0.8], D: 0.1 };
const WROW1 = [1, 3, 5, 7, 9], WROW2 = [0, 2, 4, 6, 8];
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
const WTINY = whyPlace(7, { D: WHY.f / WHY.m, k: WHY.m, lits: Array.from({ length: WHY.NMAX }, (_, n) => Math.pow(1 - WHY.f, n + 1)), T: WHY.w, H: 2 * WHY.hh, far: (WHY.f / WHY.m) * 2 * WHY.hh + 10, xr: [0.2, 0.8], edge: 0.06, sep: WHY.f / WHY.m });
const WRAND = whyPlace(11, { D: WST.D, k: 7, lits: [0.5, 0.25], T: 300, H: 2 * WHY.hh, far: 56, xr: [0.14, 0.86], edge: 0.02 });
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
// The zoom (32c): from the lab's row, one slice of the box, to the slab; far more across the beam than along it.
function whyZoomGeo(z) {
  const e = smooth(clamp(z, 0, 1)), sx = Math.exp(e * Math.log(WHY.w / (2 * WSLH * WX1.s))), sy = Math.exp(e * Math.log((2 * WHY.hh) / (SH.beamW * WX1.s)));
  const cx = lerp(WX1.ox, WHY.cx, e), cy = lerp(WX1.oy, WHY.yc, e);
  return { e, cx, cy, X: (x) => cx + x * WX1.s * sx, Y: (y) => cy + y * WX1.s * sy, hh: (SH.beamW / 2) * WX1.s * sy };
}
// ---- drawing ----
const whyDisc = (ctx, x, y, r, a) => {   // a particle, as the bench draws them
  if (a <= 0.003) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = PART; ctx.strokeStyle = COL.greyB; ctx.lineWidth = clamp(r * 0.16, 1.5, 3.2);
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore();
};
function whyLaser(ctx, xf, yc, hh, a) {   // the laser that sends out a sheet: its face, as tall as the sheet, at xf
  if (a <= 0.003) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.lineWidth = 3; ctx.strokeStyle = COL.greyB; ctx.lineJoin = 'round';
  ctx.fillStyle = BODY; ctx.beginPath(); ctx.roundRect(xf - 214, yc - hh - 30, 192, 2 * hh + 60, 14); ctx.fill(); ctx.stroke();
  ctx.fillStyle = NOZZLE; ctx.beginPath(); ctx.roundRect(xf - 22, yc - hh - 10, 22, 2 * hh + 20, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = SH.color; ctx.beginPath(); ctx.arc(xf - 66, yc - hh - 4, 7, 0, Math.PI * 2); ctx.fill();
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
// the sensor at sensorX (laserA, sensorA); the reading (readA).
function whyView(ctx, V) {
  const { yc, hh } = V, top = yc - hh, c = hexRgb(SH.color);
  if (V.xR > V.xL + 0.5) {
    ctx.save(); const A0 = ctx.globalAlpha;
    ctx.fillStyle = rgba(c, (V.sheet ?? WHY.sheet) * V.power); ctx.fillRect(V.xL, top, V.xR - V.xL, 2 * hh);
    ctx.fillStyle = BG;   // the shadows: no light behind a particle, all the way to the sensor
    for (const p of V.parts) { if (p.a <= 0.003 || p.x >= V.xR) continue; const r = (p.D / 2) * 2 * hh; ctx.globalAlpha = A0 * p.a; ctx.fillRect(p.x, top + p.v * 2 * hh - r, V.xR - p.x, 2 * r); }
    ctx.restore();
  }
  for (const s of V.slabs) if (s.a > 0.003) for (const x of [s.x0, s.x1]) dashed(ctx, x, top - 36, x, top + 2 * hh + 36, COL.greyC, s.a, 2);
  for (const p of V.parts) whyDisc(ctx, p.x, top + p.v * 2 * hh, (p.D / 2) * 2 * hh, p.a);
  whyLaser(ctx, V.laserX, yc, hh, V.laserA);
  whySensor(ctx, V.sensorX, yc, hh, V.sensorA);
  whyReadout(ctx, V.sensorX, yc, whyLit(V.parts), V.readA);
}
// The two thicker slabs' particles: the first's rows (s1: 0 to 1, a row at a time), the second's (s2), in the first's
// gaps or, as hide goes to 1, a tenth lower, right behind the first's
const whyRow = (p, r) => smooth(clamp((p - 0.2 - r * 0.12) / 0.32, 0, 1));
function whyPlacedParts(s1, s2, hide) {
  const out = [], { D, xi } = WST;
  WROW1.forEach((b, r) => { const a = whyRow(s1, r); for (const x of xi) out.push({ x: lerp(WST.s1[0], WST.s1[1], x), v: (b + 0.5) * D, D, a }); });
  WROW2.forEach((b, r) => { const a = whyRow(s2, r), m = smooth(clamp((hide - r * 0.12) / 0.52, 0, 1)); for (const x of xi) out.push({ x: lerp(WST.s2[0], WST.s2[1], x), v: (b + m + 0.5) * D, D, a }); });
  return out;
}
const whyRandParts = () => WRAND.flatMap((ps, j) => ps.map((p) => ({ x: lerp(...(j ? WST.s2 : WST.s1), p.xi), v: p.v, D: WST.D, a: 1 })));
const whyTwoSlabs = (a1, a2) => [{ x0: WST.s1[0], x1: WST.s1[1], a: a1 }, { x0: WST.s2[0], x1: WST.s2[1], a: a2 }];
const whyStructured = (parts, a1, a2) => ({ yc: WHY.yc, hh: WHY.hh, xL: WST.laserX, xR: WST.sensorX, power: 1, slabs: whyTwoSlabs(a1, a2), parts, laserX: WST.laserX, sensorX: WST.sensorX, laserA: 1, sensorA: 1, readA: 1 });
// Drawn moved, the picture's middle at (x, y), scaled by k
const whyAt = (ctx, [x, y, k], f) => { ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.translate(-WDC[0], -WDC[1]); f(); ctx.restore(); };
const WTK = 0.8;   // the tiny slabs' picture (32c–34d), a fifth smaller than the thicker slabs' (35 on)
const WPOS = { one: [WDC[0], WDC[1], 1], top: [960, 330, 0.68], bot: [960, 760, 0.68], rTop: [1440, 380, 0.58], rBot: [1440, 760, 0.58], left: [480, 570, 0.6] };
const lerpPos = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));
const WMUL = String.raw`\textcolor{${COL.red}}{\times\,0.9}`, WPOW = (n) => String.raw`0.9^{\textcolor{${COL.blue}}{${n}}}`;
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
  wst: 0, ws1: 0, ws2: 0, whide: 0, wrows: 0, wsplit: 0, wtitles: 0, wfig: 0, wstay: 0, bOut: 0,
}; }
// The lab's row, and on it the slice: the fronts sweep in from the box's ends and meet at its faces, dimming what they
// pass (32b); then all but the slice fades away; at the zoom (z > 0) the slice is drawn by whyZoomIn instead.
function whyBox(ctx, st, z) {
  const sel = smooth(clamp(st.wsel, 0, 1)), fade = smooth(clamp(st.wfade, 0, 1)), X = WX1, sx = (x) => X.ox + X.s * x, sy = (y) => X.oy + X.s * y;
  const lf = lerp(-LAB.BW / 2, -WSLH, sel), rf = lerp(LAB.BW / 2, WSLH, sel), xa = sx(-WSLH), xb = sx(WSLH), o = { c: 1, from: '', to: '50%', m: 1, read: 1 };
  ctx.save(); ctx.beginPath(); ctx.rect(-50, -50, W + 100, H + 100); ctx.rect(xa, -50, xb - xa, H + 100); ctx.clip('evenodd');
  drawLabRow(ctx, X, o, 1 - fade);
  if (sel > 0.003 && fade < 0.997) {   // what the fronts have passed, dimmed
    ctx.fillStyle = `rgba(28,27,24,${(0.6 * sel * (1 - fade)).toFixed(3)})`;
    ctx.fillRect(sx(-LAB.BW / 2) - 3, sy(LAB.top) - 3, sx(lf) - sx(-LAB.BW / 2) + 3, sy(LAB.bot) - sy(LAB.top) + 6);
    ctx.fillRect(sx(rf), sy(LAB.top) - 3, sx(LAB.BW / 2) - sx(rf) + 3, sy(LAB.bot) - sy(LAB.top) + 6);
  }
  ctx.restore();
  if (z <= 0.001) { ctx.save(); ctx.beginPath(); ctx.rect(xa, -50, xb - xa, H + 100); ctx.clip(); drawLabRow(ctx, X, o, 1); ctx.restore(); }
  const fa = 0.85 * sel * (1 - smooth(clamp(z * 2.5, 0, 1)));   // the fronts, which become the slab's faces
  if (fa > 0.003) { ctx.save(); ctx.strokeStyle = hexA(COL.white, fa); ctx.lineWidth = 2.5; ctx.beginPath(); for (const x of [lf, rf]) { ctx.moveTo(sx(x), sy(LAB.top)); ctx.lineTo(sx(x), sy(LAB.bot)); } ctx.stroke(); ctx.restore(); }
}
// On the way in: the box's stuff in the slice, the box's walls and its specks, going as the slab's particles come
function whyZoomIn(ctx, Z) {
  const a = 1 - smooth(clamp((Z.e - 0.25) / 0.4, 0, 1)); if (a <= 0.003) return;
  const x0 = Z.X(-WSLH), x1 = Z.X(WSLH), B = { x0: -LAB.BW / 2, x1: LAB.BW / 2, top: LAB.top, bot: LAB.bot };
  ctx.save(); ctx.beginPath(); ctx.rect(x0, -20, x1 - x0, H + 40); ctx.clip(); ctx.globalAlpha *= a;
  ctx.fillStyle = 'rgba(170,164,152,0.12)'; ctx.fillRect(x0, Z.Y(B.top), x1 - x0, Z.Y(B.bot) - Z.Y(B.top));
  ctx.strokeStyle = COL.greyA; ctx.lineWidth = 4.8; ctx.beginPath(); for (const y of [B.top, B.bot]) { ctx.moveTo(x0, Z.Y(y)); ctx.lineTo(x1, Z.Y(y)); } ctx.stroke();
  for (const [u, v, ph, jy] of BOXSPECKS) { const [x, y] = speckXY(B, u, v, ph, jy); if (x < -WSLH - 8 || x > WSLH + 8) continue; dot(ctx, Z.X(x), Z.Y(y), 3.6 * WX1.s * (1 + 2 * Z.e), COL.yellow, 0.62); }
  ctx.restore();
}
// The main picture, 32c–36: the tiny slabs, then (35) the two thicker ones, with the light, the laser and the sensor
function whyMain(st) {
  const z = clamp(st.wzoom, 0, 1), Z = whyZoomGeo(z), into = z < 1, ls = smooth(clamp(st.wls, 0, 1));
  const tinyA = 1 - smooth(clamp(st.wst / 0.4, 0, 1)), stx = smooth(clamp((st.wst - 0.25) / 0.6, 0, 1)), T = whyTiny(into ? 1 : st.wn);
  const yc = into ? Z.cy : WHY.yc, hh = into ? Z.hh : WHY.hh, slabs = [], parts = [];
  const tiny = into ? [{ x0: Z.X(-WSLH), x1: Z.X(WSLH), a: 1 }] : T.slabs, pa = into ? smooth(clamp((Z.e - 0.4) / 0.35, 0, 1)) : 1;
  if (tinyA > 0.003) tiny.forEach((s, k) => {
    slabs.push({ x0: s.x0, x1: s.x1, a: s.a * tinyA * (into ? Z.e : 1) });
    for (const p of WTINY[k]) parts.push({ x: lerp(s.x0, s.x1, p.xi), v: p.v, D: WHY.f / WHY.m, a: s.a * tinyA * pa });
  });
  const f1 = smooth(clamp(st.ws1 / 0.25, 0, 1)), f2 = smooth(clamp(st.ws2 / 0.25, 0, 1));
  if (st.ws1 > 0.003 || st.ws2 > 0.003) { slabs.push(...whyTwoSlabs(f1, f2)); parts.push(...whyPlacedParts(st.ws1, st.ws2, st.whide)); }
  const laserX = lerp(T.laserX, WST.laserX, stx), sensorX = lerp(T.sensorX, WST.sensorX, stx), s0 = tiny[0];
  return { yc, hh, slabs, parts, laserX, sensorX, laserA: ls, sensorA: ls, readA: smooth(clamp(st.wread, 0, 1)), power: clamp(st.wpow, 0, 1),
    xL: lerp(s0.x0, laserX, ls), xR: lerp(s0.x1, sensorX, ls), sheet: into ? lerp(0.7, WHY.sheet, Z.e) : WHY.sheet, Z, into, T, tinyA };
}
function drawWhy(ctx, dt, st) {
  const on = clamp(st.won, 0, 1); if (on <= 0.003) return;
  if (!reduced) { if (st.wpowLoop) st.wpow = whyPowAt(st.wpowT0); if (st.wnLoop) st.wn = whyNAt(st.wnT0); }
  const z = clamp(st.wzoom, 0, 1), rows = smooth(clamp(st.wrows, 0, 1)), split = smooth(clamp(st.wsplit, 0, 1)), fig = smooth(clamp(st.wfig, 0, 1));
  ctx.save(); ctx.globalAlpha *= on;
  if (z < 1) whyBox(ctx, st, z);
  if (z > 0) {
    // the tiny slabs' picture a fifth smaller: shrinking to it on the way in, back to full size as the thicker slabs come
    const V = whyMain(st), stx = smooth(clamp((st.wst - 0.25) / 0.6, 0, 1)), k1 = V.into ? lerp(1, WTK, V.Z.e) : lerp(WTK, 1, stx);
    const at = lerpPos(lerpPos([WDC[0], WDC[1], k1], WPOS.bot, rows), WPOS.rBot, split), s0 = V.into ? null : V.T.slabs[0];
    const la = smooth(clamp(st.wlab, 0, 1)) * V.tinyA, fm = clamp(st.wfm, 0, 1);
    ctx.save(); ctx.globalAlpha *= 1 - fig;
    whyAt(ctx, at, () => {
      if (V.into) whyZoomIn(ctx, V.Z);
      whyView(ctx, V);
      // Δd under the slab: a small piece of the distance d, in d's blue
      const br = smooth(clamp(st.wbr, 0, 1)) * V.tinyA;
      if (br > 0.003 && s0) { const cx = (s0.x0 + s0.x1) / 2, by = V.yc + V.hh + 44; drawBrace(ctx, cx, by, s0.x1 - s0.x0, 24, 6, hexRgb(LDCOL), br); drawTex(ctx, String.raw`\Delta d`, cx, by + 56, 50, { alpha: br, color: LDCOL }); }
      // 33b: what the slab says
      if (st.wsay > 0.003 && s0) drawThinking(ctx, (s0.x0 + s0.x1) / 2, 168, 1, 84, '', String.raw`whatever comes in, I take 10\%`, 1, st.wsayP, smooth(clamp(st.wsay, 0, 1)) * V.tinyA, [(s0.x0 + s0.x1) / 2, V.yc - V.hh - 42]);
      // 34–34c: × 0.9 over each slab
      if (la > 0.003 && !V.into && fm <= 0.001) V.T.slabs.forEach((s) => drawTex(ctx, WMUL, (s.x0 + s.x1) / 2, WF.ly, WF.lsize, { alpha: la * s.a }));
    });
    ctx.restore();
    // 34d: the three × 0.9 become 0.9^3 at the top, and the count follows the slabs from then on (the formula keeps its
    // size: the labels it comes from are where the smaller picture has them)
    if (la > 0.003 && !V.into && fm > 0.001) {
      if (fm < 0.999) {
        const [ax, ay, ak] = at, at3 = (k) => place(tex(WMUL), { x: ax + (WHY.cx + (k - 1) * WHY.w - WDC[0]) * ak, y: ay + (WF.ly - WDC[1]) * ak, size: WF.lsize * ak });
        if (!wfPlan || wfPlan.k !== ak) wfPlan = Object.assign(matchPlan([...at3(0), ...at3(1), ...at3(2)], place(tex(WPOW(3)), { x: whyFx(), y: WF.y, size: WF.size, ax: 0 })), { k: ak });
        drawMorph(ctx, wfPlan, fm, la);
      } else drawTex(ctx, WPOW(Math.round(st.wn)), whyFx(), WF.y, WF.size, { ax: 0, alpha: la });
    }
  }
  // 37: the other careful placement, above: the second slab in the first one's gaps (0%)
  if (rows > 0.003) { ctx.save(); ctx.globalAlpha *= rows * (1 - fig); whyAt(ctx, lerpPos(WPOS.top, WPOS.rTop, split), () => whyView(ctx, whyStructured(whyPlacedParts(1, 1, 0), 1, 1))); ctx.restore(); }
  // 37b: and on the left, two slabs placed at random (25%), a line down the middle
  if (split > 0.003) {
    ctx.save(); ctx.globalAlpha *= split; whyAt(ctx, WPOS.left, () => whyView(ctx, whyStructured(whyRandParts(), 1, 1))); ctx.restore();
    ctx.save(); ctx.strokeStyle = hexA(COL.greyD, split * on); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(960, 80); ctx.lineTo(960, 960); ctx.stroke(); ctx.restore();
  }
  // 38: their names; 38b: on the right, a place for the paper's figure; 39: the right greys out
  const ta = clamp(st.wtitles, 0, 1);
  if (ta > 0.003) { drawTex(ctx, String.raw`\text{exponential media}`, 480, 140, 46, { p: ta, alpha: on }); drawTex(ctx, String.raw`\text{non-exponential media}`, 1440, 140, 46, { p: ta, alpha: on }); }
  if (fig > 0.003) {
    const R = [1010, 220, 860, 720];
    ctx.save(); ctx.globalAlpha *= on; ctx.strokeStyle = hexA(COL.greyC, fig); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.roundRect(R[0], R[1], R[2], R[3], 14); ctx.stroke(); ctx.restore();
    drawTodo(ctx, [R[0] + 28, R[1] + 28, R[2] - 56, R[3] - 56], fig * on, { todo: ['the figure from the paper, with permission:', 'Jarabo, Aliaga and Gutierrez (2018),', 'A Radiative Transfer Framework', 'for Spatially-Correlated Materials'] }, 1.2);
  }
  ctx.restore();
  greyOut(ctx, [985, 70, 900, 900], smooth(clamp(st.wstay, 0, 1)) * on, 0.35 * smooth(clamp(st.wstay, 0, 1)) * on);
}

// ---- the beats ----
// 32: back from the aside: the bases go, and the box is on the stage again as at beat 22, reading 50%
function whyBox32() { ptw('lfig', 0, 0.5); ptw('bOut', 1, 0.5); ptw('lside', 0, 1.2, { delay: 0.2 }); return ptw('won', 1, 0.9, { delay: 0.4 }); }
// 32b: two fronts sweep in from the box's ends and meet at a thin slice of it; then all but the slice fades away
function whySelect() { ptw('wsel', 1, 1.4); return ptw('wfade', 1, 0.8, { delay: 1.8 }); }
// 32c: the zoom; once in, the light runs from the laser, which comes back, to the sensor; then Δd under the slab
function whyZoom() { ptw('wls', 1, 0.8, { delay: 2.3 }); ptw('wbr', 1, 0.6, { delay: 2.9 }); return ptw('wzoom', 1, 2.4); }
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
  ptw('wbr', 0, 0.4); PS.wnLoop = 1; PS.wnT0 = labLoopStart('wnT0', TIME + 1.6);
  if (reduced) ptw('wn', WHY.NMAX, 1.5, { delay: 1.4 });
  return ptw('wfm', 1, 1.3);
}
// 35: the tiny slabs go; two thicker ones, the first's particles placed with care, in rows: half the light. 35b: the
// second's, where the first lets light through, a row at a time: nothing is left
function whyCareful() {
  if (PS.wnLoop && !reduced) PS.wn = whyNAt(PS.wnT0);
  PS.wnLoop = 0; ptw('wst', 1, 1.5); return ptw('ws1', 1, 1.6, { delay: 1.2 });
}
function whyGaps() { return ptw('ws2', 1, 1.8); }
// 36: an aside: or hide them; in the card, the second slab's rows move down a tenth, right behind the first's: 50%
function whyHide() {
  PS.lthink = 'or hide them?'; PS.lthinkP = 0; ptw('lside', 1, 1.4); ptw('lfig', 1, 1.0, { delay: 0.8 }); ptw('lthinkP', 1, 1.0, { delay: 1.7, ease: linear });
  return ptw('whide', 1, 2.0, { delay: 3.0 });
}
// 37: back from the aside: both careful placements, one above the other. 37b: they move to the right, and two slabs
// placed at random come in on the left
function whyBoth() { ptw('lfig', 0, 0.5); ptw('lside', 0, 1.2, { delay: 0.2 }); return ptw('wrows', 1, 1.4, { delay: 1.0 }); }
function whySplit() { return ptw('wsplit', 1, 1.6); }
// 38: the names. 38b: a place for the paper's figure, on the right. 39: the right greys out: we stay on the left
function whyNames() { return ptw('wtitles', 1, 1.0, { ease: linear }); }
function whyFigure() { return ptw('wfig', 1, 0.9); }
function whyStay() { return ptw('wstay', 1, 0.9); }
