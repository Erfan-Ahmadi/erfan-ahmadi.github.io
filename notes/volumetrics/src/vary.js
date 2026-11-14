// ---------- presentation, part 5: when the density changes along the path (beats 41–57c) ----------
// Where part 4 ends (why.js; its frame goes), but zoomed back out and with no particles, as the bench's "Optical depth
// is an area" has it: the laser, a volume of fog that is whiter where it is denser, the light dimming through it,
// the sensor, and over them the plot of σ along the path.
// 41: a cloud, denser here and thinner there, a spot of each circled. 42: the simple case: two sections, dense then
// thin, a dashed line between them, σ written in each and plotted on top. 43–47: the same setup again on the right with
// its sections swapped: in which does more light come out? They read the same.
// 48–50: why: under each section its factor, × e^{−σx}; the two become one, their exponents added, and a sum doesn't
// care about the order. 51–55: the same when σ changes continuously: the path chopped into tiny sections, a factor for
// each, their exponents adding up to a sum, and that sum an integral, written τ: the optical depth. 56–57: any shape
// with the same integral reads the same; and a uniform volume gives back e^{−σx}, the area under a flat line.
// Along the path u runs from 0 to 2: two sections. Every σ here has the same integral over it, 0.6 section lengths, and
// a section is x = 2 long, so the sensor reads e^{−1.2}, 30.1%, all the way through (long enough for the dimming to
// show along the beam); the reading is worked out from the σ that is drawn.
const VARY = { s1: 0.4, s2: 0.2, smax: 0.5, uni: 0.3, n: 10, tau: 0.6, x: 2, beam: 12 };   // n: the tiny sections of 53; beam: the beam's width
// One setup, in its own units: the volume from x = 0 to L along the beam, y = 0; its fog fades out toward ±R; arc: how
// far the two sections rise and dip as they change places. laser, sensor: the nozzle's tip and the sensor, drawn at
// dev of the bench's size. The plot over it: σ = 0 at plotB, σ = smax at plotT. c1, c2, cr: the two circles of 41, where
// along the path, and their radius. fy: where the factors are written, under the volume. cx, cy: its middle.
const VG = { L: 900, R: 150, arc: 62, laser: -70, sensor: 1010, dev: 0.75, plotB: -215, plotT: -395, ext: 30, c1: 0.385, c2: 0.655, cr: 100, fy: 206, cx: 441.5, cy: -110 };
// On the stage, [x, y, scale] of its middle: one setup, then A on the left and B on the right, each in the middle of its
// half with room on either side of the line between them (sep: its top and bottom); alone: how much bigger the picture
// is until the plot comes in over it; lab: where A and B are named. VHALF: each one's half of the stage, for greying it.
const VPOS = { one: [960, 538, 0.92], A: [476.5, 528, 0.58], B: [1436.5, 528, 0.58], alone: 1.18, sep: [305, 775], lab: { A: [104, 292], B: [1064, 292] } };
const VHALF = { A: [60, 210, 890, 670], B: [970, 210, 890, 670] };
// The fog: how opaque for a σ, and how it fades across the band (o: 0 on the beam, 1 at the band's edge)
const VFOG = { a: (s) => 1.3 * s, mask: (o) => 1 - smooth(clamp((o - 0.38) / 0.62, 0, 1)), rgb: '215,215,215' };
// 41's cloud: soft puffs [where along the path (0 to 1), how far off the beam, radius, thickness]: a middling clump, a
// big dense one, a thin wisp, a middling one again
const VCLOUD = [
  [0.06, 20, 95, 0.3], [0.13, -30, 115, 0.36], [0.2, 25, 100, 0.3],
  [0.3, -15, 130, 0.55], [0.36, 40, 140, 0.62], [0.41, -45, 150, 0.68], [0.47, 20, 125, 0.55], [0.385, 0, 95, 0.5],
  [0.57, -20, 110, 0.16], [0.655, 25, 125, 0.14], [0.73, -15, 110, 0.16],
  [0.81, 25, 115, 0.38], [0.87, -35, 135, 0.46], [0.93, 20, 105, 0.38], [0.97, -5, 80, 0.26],
];
const vPuff = (q) => Math.max(0, (Math.exp(-((1.9 * q) ** 2)) - Math.exp(-3.61)) / (1 - Math.exp(-3.61)));   // a puff's thickness, q of its radius from its middle
// σ along the beam through that cloud: the puffs' thickness where the beam crosses them, scaled to the same integral
const vCloudRaw = (u) => VCLOUD.reduce((s, [pu, y, r, w]) => s + w * vPuff(Math.hypot((u / 2 - pu) * VG.L, y) / r), 0);
let vCloudK = 0;
const vCloudSig = (u) => { if (!vCloudK) { let s = 0; for (let i = 0; i < 400; i++) s += vCloudRaw(((i + 0.5) / 400) * 2) * (2 / 400); vCloudK = VARY.tau / s; } return vCloudK * vCloudRaw(u); };
// The continuous shapes, each with the same integral: the hump of 51b, and those the volume goes through at 56
const vHump = (u) => 0.15 * Math.PI * Math.sin((Math.PI * u) / 2);
// (each between 0 and 0.5, its integral over the two sections 0.6: the hump, a ramp up, high then low, two bumps, a
// dip in the middle, a ramp down, three bumps, low then high)
const VSHAPES = [
  vHump, (u) => 0.1 + 0.2 * u, (u) => 0.3 + 0.2 * Math.sin(Math.PI * u), (u) => 0.3 - 0.15 * Math.cos(2 * Math.PI * u),
  (u) => 0.3 + 0.2 * Math.cos(Math.PI * u), (u) => 0.5 - 0.2 * u, (u) => 0.3 - 0.15 * Math.cos(3 * Math.PI * u), (u) => 0.3 - 0.2 * Math.sin(Math.PI * u),
];
const VSH = { hold: 0.84, move: 0.98 };   // seconds at rest on each shape, and changing to the next
const vLoopShape = (u, t) => {   // t: seconds since the loop started
  const n = VSHAPES.length, c = VSH.hold + VSH.move, k = Math.floor(t / c), f = smooth(clamp((t - k * c - VSH.hold) / VSH.move, 0, 1));
  return lerp(VSHAPES[k % n](u), VSHAPES[(k + 1) % n](u), f);
};
function VARY_DEFAULTS() { return {
  von: 0, vfr: 1, vc1: 0, vc2: 0, vsect: 0, vface: 0, vax: 0, vpl: 0, vs1: 0, vs2: 0, vdual: 0, vmute: 0, vswap: 0, vfA: 0, vfB: 0, vpA: 0, vpAa: 0,
  vq: 0, vread: 0, va1: 0, va2: 0, va3: 0, va4: 0, vb1: 0, vb3: 0, vb4: 0, vfoc: 0, vone: 0, vcont: 0, vchop: 0, vprod: 0, vsum: 0, vint: 0,
  vshLoop: 0, vshT0: 0, vshR: 0, vsame: 0, vuni: 0, vsx: 0, varea: 0, vtau: 0, vname: 0, vtauOut: 0, varL: 0,
}; }
// σ along the path for one of the two setups, as the state has it. band: the volume's own σ (two sections; B's swapped;
// then the hump, the shapes of 56, the uniform one); sig: what the light meets (41's cloud until the sections take over)
function varyProfile(st, side) {
  const se = smooth(clamp(st.vsect, 0, 1)), sw = side === 'B' ? smooth(clamp(st.vswap, 0, 1)) : 0, co = smooth(clamp(st.vcont, 0, 1)), un = smooth(clamp(st.vuni, 0, 1));
  const s1 = lerp(VARY.s1, VARY.s2, sw), s2 = lerp(VARY.s2, VARY.s1, sw), loop = st.vshLoop && !reduced, tl = loop ? Math.max(0, TIME - st.vshT0) : 0, sr = smooth(clamp(st.vshR || 0, 0, 1));
  const cont = (u) => (loop ? vLoopShape(u, tl) : sr > 0.001 ? lerp(vHump(u), VSHAPES[1](u), sr) : vHump(u));
  const band = (u) => { let v = u < 1 ? s1 : s2; if (co > 0.001) v = lerp(v, cont(u), co); return un > 0.001 ? lerp(v, VARY.uni, un) : v; };
  return { band, sig: (u) => (se >= 0.999 ? band(u) : lerp(vCloudSig(u), band(u), se)), se, sw, co, s1, s2 };
}
// ∫σ from 0 to u, on a grid whose cells end at the sections' ends (so two flat sections add up exactly)
function varyTau(sig) {
  const N = 240, du = 2 / N, tau = new Float64Array(N + 1);
  for (let i = 0; i < N; i++) tau[i + 1] = tau[i] + sig((i + 0.5) * du) * du;
  return (u) => { const f = clamp(u / 2, 0, 1) * N, i = Math.min(N - 1, Math.floor(f)); return lerp(tau[i], tau[i + 1], f - i); };
}
// A band of fog from x0 to x1 about y = yc, fading out toward ±R; along it (t from 0 to 1) as opaque as alphaAt says,
// with a sharp change at each of knots
const vfCv = document.createElement('canvas'), vfCx = vfCv.getContext('2d');
function varyBand(ctx, x0, x1, yc, R, alphaAt, knots = []) {
  const len = x1 - x0; if (len < 1) return;
  const pw = Math.max(1, Math.ceil(len * K)), ph = Math.max(1, Math.ceil(2 * R * K)), b = vfCx, ts = [];
  if (vfCv.width < pw || vfCv.height < ph) { vfCv.width = Math.max(vfCv.width, pw); vfCv.height = Math.max(vfCv.height, ph); }
  b.setTransform(K, 0, 0, K, 0, 0); b.globalCompositeOperation = 'source-over'; b.clearRect(0, 0, len + 2, 2 * R + 2);
  for (let i = 0; i <= 80; i++) ts.push(i / 80);
  for (const q of knots) ts.push(q - 1e-4, q + 1e-4);
  ts.sort((p, q) => p - q);
  const along = b.createLinearGradient(0, 0, len, 0);
  for (const t of ts) along.addColorStop(clamp(t, 0, 1), `rgba(${VFOG.rgb},${clamp(alphaAt(clamp(t, 0, 1)), 0, 1).toFixed(4)})`);
  b.fillStyle = along; b.fillRect(0, 0, len, 2 * R);
  b.globalCompositeOperation = 'destination-in';
  const across = b.createLinearGradient(0, 0, 0, 2 * R);
  for (let i = 0; i <= 24; i++) { const o = i / 24, a = VFOG.mask(o).toFixed(4); across.addColorStop(0.5 - o / 2, `rgba(0,0,0,${a})`); if (i) across.addColorStop(0.5 + o / 2, `rgba(0,0,0,${a})`); }
  b.fillStyle = across; b.fillRect(0, 0, len, 2 * R);
  ctx.drawImage(vfCv, 0, 0, pw, ph, x0, yc - R, len, 2 * R);
}
function varyCloud(ctx, a) {
  for (const [u, y, r, w] of VCLOUD) {
    const x = u * VG.L, g = ctx.createRadialGradient(x, y, 0, x, y, r);
    for (let i = 0; i <= 8; i++) g.addColorStop(i / 8, `rgba(${VFOG.rgb},${(a * w * vPuff(i / 8)).toFixed(4)})`);
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
  }
}
let VAX = null;
const varyAxes = () => VAX || (VAX = makeAxes({ L: 0, R: VG.L, T: VG.plotT, B: VG.plotB, xr: [0, 2, 1], yr: [0, VARY.smax, 0.2], ext: VG.ext, xl: '', yl: '', labSize: 50, numSize: 30 }));
// 55: on the way to the integral the tiny sections get thinner and thinner, twice as many at each step (VREF), and past
// the last step the bars' tops are the curve itself. r: how far along that is, 0 (VARY.n sections) to VREF.length.
const VREF = [1, 2, 4, 8].map((m) => m * VARY.n);
const vStepTop = (f, u, n) => { const w = 2 / n; return f((Math.min(n - 1, Math.floor(u / w + 1e-9)) + 0.5) * w); };
const varyTop = (f, u, r) => { const k = Math.min(VREF.length - 1, Math.floor(r)), q = smooth(clamp(r - k, 0, 1)); return lerp(vStepTop(f, u, VREF[k]), k + 1 < VREF.length ? vStepTop(f, u, VREF[k + 1]) : f(u), q); };
// The sections' ends at r, [u, how strongly drawn]: fainter the more of them there are, the next step's new ones coming
// in, and all of them going on the way from the last step to the curve
function varyEdges(r) {
  const k = Math.min(VREF.length - 1, Math.floor(r)), q = smooth(clamp(r - k, 0, 1)), last = k === VREF.length - 1, n = VREF[k], g = (m) => Math.sqrt(VREF[0] / m), out = [];
  for (let i = 0; i <= n; i++) out.push([(2 * i) / n, last ? g(n) * (1 - q) : lerp(g(n), g(2 * n), q)]);
  if (!last) for (let i = 1; i < 2 * n; i += 2) out.push([i / n, g(2 * n) * q]);
  return out;
}
// One setup, in its own units, drawn at k of its size (so that what is written in it keeps its size on the stage).
// du: how far the stage has gone from one setup to two.
function varyDraw(ctx, st, side, k, du) {
  const P = varyProfile(st, side), L = VG.L, tauAt = varyTau(P.sig), T = (x) => Math.exp(-VARY.x * tauAt((2 * x) / L)), px = (s) => s / k, f = P.band;
  const ch = smooth(clamp(st.vchop, 0, 1)), it = smooth(clamp(st.vint, 0, 1)), r = clamp(st.vint, 0, 1) * VREF.length, edges = ch > 0.003 ? varyEdges(r) : [], isB = side === 'B', swapping = isB && P.sw > 0.003 && P.sw < 0.997;
  const dxs = (L / 2) * P.sw, dys = VG.arc * Math.sin(Math.PI * P.sw);   // B's sections on their way past each other: the dense one over the top
  // 41's cloud, and the volume it is simplified to
  if (P.se < 0.997) varyCloud(ctx, 1 - P.se);
  if (P.se > 0.003) {
    if (swapping) { varyBand(ctx, dxs, dxs + L / 2, -dys, VG.R, () => VFOG.a(VARY.s1) * P.se); varyBand(ctx, L / 2 - dxs, L - dxs, dys, VG.R, () => VFOG.a(VARY.s2) * P.se); }
    else varyBand(ctx, 0, L, 0, VG.R, (t) => VFOG.a(f(2 * t)) * P.se, P.co < 0.997 ? [0.5] : []);
  }
  // 42: the dashed line between the two sections; 53–55: the tiny sections' ends, thin lines
  const fa = smooth(clamp(st.vface, 0, 1)) * (1 - P.co);
  if (fa > 0.003) dashed(ctx, L / 2, -VG.R * 0.94, L / 2, VG.R * 0.94, COL.greyA, 0.85 * fa, px(2.5));
  if (edges.length) { ctx.save(); ctx.lineWidth = px(1.6); for (const [u, a] of edges) { if (a * ch <= 0.01) continue; ctx.strokeStyle = hexA(COL.greyA, 0.5 * ch * a); ctx.beginPath(); ctx.moveTo((u / 2) * L, -VG.R * 0.72); ctx.lineTo((u / 2) * L, VG.R * 0.72); ctx.stroke(); } ctx.restore(); }
  // the light, the laser and the sensor
  const fr = clamp(st.vfr ?? 1, 0, 1), lit = smooth(clamp((fr - 0.97) / 0.03, 0, 1));   // vfr: how far the light has got (42, 42b: it travels the path again)
  if (fr > 0.001) drawBeam(ctx, VG.laser, lerp(VG.laser, VG.sensor - 11, fr), 0, SH.color, SH.I0, lieT(T), [0, L / 2, L], VARY.beam);   // (dimmer than it is, as in the lab: lab.js's lieT)
  ctx.save(); ctx.translate(VG.laser, 0); ctx.scale(VG.dev, VG.dev); drawLaser(ctx, 0, 0, SH.color, 1); ctx.restore();
  ctx.save(); ctx.translate(VG.sensor, 0); ctx.scale(VG.dev, VG.dev); drawSensor(ctx, 0, 0, SH.color, T(L) * SH.I0 * lit); ctx.restore();
  // the sensor's readout, over it; 56b: boxed, as the integral is
  const ra = smooth(clamp(st.vread, 0, 1));
  if (ra > 0.003) {
    const bw = px(lerp(164, 150, du)), bh = px(lerp(70, 62, du)), x = VG.sensor, top = -48 * VG.dev, by = top - px(26) - bh, pop = lerp(0.7, 1, ra), hi = smooth(clamp(st.vsame, 0, 1));
    ctx.save(); ctx.translate(x, by + bh / 2); ctx.scale(pop, pop); ctx.translate(-x, -by - bh / 2); ctx.globalAlpha *= ra;
    ctx.strokeStyle = COL.greyB; ctx.lineWidth = px(2.5); ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, by + bh); ctx.stroke();
    ctx.fillStyle = BG; ctx.beginPath(); ctx.roundRect(x - bw / 2, by, bw, bh, px(12)); ctx.fill(); ctx.stroke();
    if (hi > 0.003) { ctx.strokeStyle = hexA(COL.gold, hi); ctx.lineWidth = px(3.5); ctx.beginPath(); ctx.roundRect(x - bw / 2 - px(9), by - px(9), bw + px(18), bh + px(18), px(16)); ctx.stroke(); }
    drawNumber(ctx, 100 * Math.exp(-VARY.x * tauAt(2)), x, by + bh / 2 + px(lerp(16, 15, du)), { size: px(lerp(46, 42, du)), dec: 1, suffix: '%', align: 'center' });
    ctx.restore();
  }
  // 41b, 41c: a dense spot and a thin one, circled
  for (const [a, u] of [[st.vc1, VG.c1], [st.vc2, VG.c2]]) {
    const c = smooth(clamp(a || 0, 0, 1)); if (c <= 0.003) continue;
    ctx.save(); ctx.strokeStyle = hexA(COL.white, 0.9 * c); ctx.lineWidth = px(3.5); ctx.beginPath(); ctx.arc(u * L, 0, VG.cr * lerp(1.25, 1, c), 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  }
  // 42d, 42e: σ written in each section, in its yellow, on a little shade; B's go with their sections as they swap
  for (const [a, val, x, y] of [[st.vs1, VARY.s1, L / 4 + dxs, -dys], [st.vs2, VARY.s2, (3 * L) / 4 - dxs, dys]]) {
    const sg = smooth(clamp(a, 0, 1)) * (1 - P.co); if (sg <= 0.003) continue;
    const src = String.raw`\sigma = ${val}`, size = px(lerp(50, 40, du)), tw = tex(src).w * size, cy = y - 78;
    ctx.fillStyle = `rgba(28,27,24,${(0.62 * sg).toFixed(3)})`; ctx.beginPath(); ctx.roundRect(x - tw / 2 - px(10), cy - size * 0.62, tw + px(20), size * 1.24, px(10)); ctx.fill();
    drawTex(ctx, src, x, cy, size, { alpha: sg, color: COL.yellow });
  }
  // the plot of σ along the path, over the volume
  const ax = smooth(clamp(st.vax, 0, 1));
  if (ax <= 0.003) return;
  const A = varyAxes(), pa = isB ? 0 : smooth(clamp(st.vpAa, 0, 1)), mu = smooth(clamp(st.vmute, 0, 1)) * (1 - pa), col = mixRgb(hexRgb(COL.yellow), hexRgb(COL.greyB), mu), pl = clamp(st.vpl, 0, 1);
  // 53: its area, a bar over each tiny section; 55: thinner and thinner bars, then the area under the curve, in the
  // yellow the integral is written in
  const fillA = Math.max(ch, it) * lerp(0.3, 0.5, smooth(clamp(st.varea, 0, 1)));
  if (fillA > 0.003) {
    const k = Math.min(VREF.length - 1, Math.floor(r)), us = []; for (let i = 0; i <= 240; i++) us.push((2 * i) / 240);
    for (const m of [VREF[k], 2 * VREF[k]]) for (let i = 1; i < m; i++) us.push((2 * i) / m - 1e-6, (2 * i) / m);
    us.sort((p, q) => p - q);
    const top = (u) => varyTop(f, u, r), trace = () => { ctx.beginPath(); us.forEach((u, i) => { const x = A.X(Math.round(u * 1e4) / 1e4), y = A.Y(top(u)); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }); };
    ctx.save(); trace(); ctx.lineTo(A.X(2), A.Y(0)); ctx.lineTo(A.X(0), A.Y(0)); ctx.closePath(); ctx.fillStyle = hexA(COL.yellow, fillA * ax); ctx.fill();
    const oa = ch * (k === VREF.length - 1 ? 1 - smooth(clamp(r - k, 0, 1)) : 1);   // the bars' outlines, gone once they are the curve
    if (oa > 0.003) {
      ctx.strokeStyle = hexA(COL.yellow, 0.85 * oa * ax); ctx.lineWidth = px(2); ctx.lineJoin = 'round'; trace(); ctx.stroke();
      for (const [u, a] of edges) { if (a <= 0.01) continue; ctx.strokeStyle = hexA(COL.yellow, 0.85 * a * ch * ax); ctx.beginPath(); ctx.moveTo(A.X(u), A.Y(0)); ctx.lineTo(A.X(u), A.Y(Math.max(u > 0 ? top(u - 1e-6) : 0, u < 2 ? top(u) : 0))); ctx.stroke(); }
    }
    ctx.restore();
  }
  drawAxes(ctx, A, { c: ax, nums: 0, lab: 0 });
  for (const v of [0.2, 0.4]) drawTex(ctx, String(v), A.ox - px(16), A.Y(v), px(lerp(28, 24, du)), { ax: 1, alpha: ax * lerp(1, 0.7, mu) });
  drawTex(ctx, String.raw`\sigma`, A.ox - px(14), VG.plotT - VG.ext + px(2), px(lerp(46, 40, du)), { ax: 1, alpha: ax, color: col });
  drawTex(ctx, 'x', A.X(2) + VG.ext + px(14), A.oy, px(lerp(46, 40, du)), { ax: 0, alpha: ax, color: mixRgb(hexRgb(LDCOL), hexRgb(COL.greyB), mu) });
  // its line: while it is being drawn (42d, 42e), across the first section, down, across the second; after that, whatever σ is
  if (pl > 0.003) {
    ctx.save(); ctx.strokeStyle = rgba(col, ax); ctx.lineWidth = px(5); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.beginPath();
    if (pl < 0.999) {
      const pts = [[0, P.s1], [1, P.s1], [1, P.s2], [2, P.s2]], seg = [1, 0.25, 1]; let left = pl * 2.25;
      ctx.moveTo(A.X(0), A.Y(P.s1));
      for (let i = 0; i < 3 && left > 0; i++) { const q = Math.min(1, left / seg[i]); ctx.lineTo(A.X(lerp(pts[i][0], pts[i + 1][0], q)), A.Y(lerp(pts[i][1], pts[i + 1][1], q))); left -= seg[i]; }
    } else {
      const us = []; for (let i = 0; i <= 200; i++) us.push((2 * i) / 200);
      if (P.co < 0.997) us.push(1 - 1e-6);
      us.sort((p, q) => p - q);
      us.forEach((u, i) => { const x = A.X(Math.round(u * 1e4) / 1e4), y = A.Y(f(u)); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
    }
    ctx.stroke(); ctx.restore();
  }
  // 57b: inside the rectangle under the flat line, its area: σ high, x long
  const al = clamp(st.varL || 0, 0, 1);
  if (al > 0.003) drawTex(ctx, String.raw`\text{area} = \textcolor{${COL.yellow}}{\sigma} \times \textcolor{${LDCOL}}{x}`, A.X(1), A.Y(VARY.uni / 2), px(40), { p: al, alpha: ax });
  // 52: the synced point: on the plot, on the beam, and a dashed line between them
  if (pa > 0.003) {
    const u = clamp(st.vpA, 0, 2), jump = P.co < 0.997 && Math.abs(u - 1) < 0.03, x = A.X(u), y = A.Y(jump ? lerp(f(1 - 1e-6), f(1), smooth((u - 0.97) / 0.06)) : f(u));
    dashed(ctx, x, y + px(13), x, -px(9), COL.greyA, 0.85 * pa, px(2.5));
    dot(ctx, x, y, px(11), COL.white, pa); dot(ctx, x, 0, px(7.5), COL.white, pa);
  }
}
// ---- what is written under the volume (on the stage, at its own size) ----
const vNum = (v) => String.raw`{{\textcolor{${COL.yellow}}{${v}}}}`, vX = String.raw`\textcolor{${COL.blue}}{x}`, vFac = (e) => String.raw`\times\, e^{-${e}}`;
const vShift = (S, dx, dy) => S.map((s) => shifted(s, dx, dy));
const vBaseTo = (S, y) => { const e = S.find((s) => s.a.ch === 'e'); return e ? vShift(S, 0, y - e.base) : S; };   // its e's baseline to y
const vStage = ([X, Y, k], x, y) => [X + (x - VG.cx) * k, Y + (y - VG.cy) * k];   // a setup's own (x, y), on the stage
const VW = { size: 48, big: 56, psize: 44, pbig: 60, slots: [-75, 190, 455, 790], drop: 14 };   // sizes: a section's factor, the two as one; 53b's factors, and as one. slots: where those are written (the first two, the dots, the last); drop: how much lower the two sections' factors sit, clear of the fog
// 48–50: a factor under each section, × e^{−0.4x} and × e^{−0.2x}; the two as one, × e^{−(0.4+0.2)x}; and × e^{−0.6x}
const vpCache = new Map();
function varyPair(a, b, pos) {
  const key = a + '|' + b + '|' + pos.join(); if (vpCache.has(key)) return vpCache.get(key);
  const [x1, y0] = vStage(pos, VG.L / 4, VG.fy), [x2] = vStage(pos, (3 * VG.L) / 4, VG.fy), [xm] = vStage(pos, VG.L / 2, VG.fy), y = y0 + VW.drop, yb = y + 16;
  const at = (src, x, size) => vBaseTo(place(tex(src), { x, y, size }), yb);
  const f1 = at(vFac(vNum(a) + String.raw`\,` + vX), x1, VW.size), f2 = at(vFac(vNum(b) + String.raw`\,` + vX), x2, VW.size);
  const both = at(vFac(String.raw`\htmlClass{t-vsum}{(${vNum(a)}\htmlClass{t-vplus}{+}${vNum(b)})}\,` + vX), xm, VW.big);
  let done = at(vFac(vNum('0.6') + String.raw`\,` + vX), xm, VW.big);
  done = vShift(done, Math.min(...both.map((s) => s.x)) - Math.min(...done.map((s) => s.x)), 0);   // from the same left edge, so only the brackets change
  const F = { f1, f2, both, done, merge: matchPlan([...f1, ...f2], both), sum: matchPlan(both, done) };
  vpCache.set(key, F); return F;
}
// p1, p2: the two factors written in; m: the two become one; s: its brackets become their sum; foc (50): all of it
// dimmed but the addition in the exponent, in a box, its plus sign a little bigger
function drawVaryPair(ctx, F, p1, p2, m, s, foc, alpha) {
  if (alpha <= 0.003) return;
  const mm = clamp(m, 0, 1), ss = clamp(s, 0, 1), fo = smooth(clamp(foc, 0, 1)), has = (q, t) => q.a.terms.includes(t);
  if (mm <= 0.001) { if (p1 > 0.003) drawSprites(ctx, F.f1, { p: clamp(p1, 0, 1), alpha }); if (p2 > 0.003) drawSprites(ctx, F.f2, { p: clamp(p2, 0, 1), alpha }); return; }
  if (mm < 0.999) { drawMorph(ctx, F.merge, mm, alpha); return; }
  if (ss > 0.001 && ss < 0.999) { drawMorph(ctx, F.sum, ss, alpha); return; }
  if (ss >= 0.999) { drawSprites(ctx, F.done, { alpha }); return; }
  for (const q of F.both) {
    const sum = has(q, 't-vsum'), plus = has(q, 't-vplus'), al = q.alpha * alpha * (sum ? 1 : 1 - 0.7 * fo), col = plus ? mixRgb(ink(q.color), hexRgb(COL.gold), fo) : sum ? q.color : mixRgb(ink(q.color), hexRgb(COL.grey), fo);
    if (!plus || fo <= 0.003) { drawSprite(ctx, q, al, col); continue; }
    const [l, r, t, b] = inkBox(q), x = (l + r) / 2, y = (t + b) / 2, g = 1 + 0.3 * fo;
    ctx.save(); ctx.translate(x, y); ctx.scale(g, g); ctx.translate(-x, -y); drawSprite(ctx, q, al, col); ctx.restore();
  }
  if (fo > 0.003) varyBox(ctx, F.both.filter((q) => has(q, 't-vsum')), fo * alpha, 8);
}
// A box around some of a formula, in the orange and the style of the hook's question boxes
function varyBox(ctx, S, a, pad = 10) {
  if (a <= 0.003 || !S.length) return;
  const [l, r, t, b] = inkSpan(S);
  ctx.save(); ctx.strokeStyle = hexA(COL.gold, a); ctx.lineWidth = 3.5; ctx.beginPath(); ctx.roundRect(l - pad, t - pad, r - l + 2 * pad, b - t + 2 * pad, 10); ctx.stroke(); ctx.restore();
}
// 53b–57b: a factor for each tiny section, × e^{−σ₁Δx}, × e^{−σ₂Δx}, ⋯, × e^{−σₙΔx}; then all of them as
// one, their exponents added; that sum as an integral; and, for a uniform volume, × e^{−σx}
let vProd = null;
function varyProd() {
  if (vProd) return vProd;
  const pos = VPOS.one, [xm, y] = vStage(pos, VG.L / 2, VG.fy), yb = y + 16, sg = String.raw`\textcolor{${COL.yellow}}{\sigma}`;
  const term = (j) => String.raw`{{\textcolor{${COL.yellow}}{\sigma_{${j}}}\,\textcolor{${COL.blue}}{\Delta x}}}`, at = (src, x, size) => vBaseTo(place(tex(src), { x, y, size }), yb);
  const facs = ['1', '2', 'n'].map((j, i) => at(vFac(term(j)), vStage(pos, VW.slots[i < 2 ? i : 3], 0)[0], VW.psize));
  // the dots between them, level with the factors' multiplication signs
  let dots = place(tex(String.raw`\cdots`), { x: vStage(pos, VW.slots[2], 0)[0], y, size: VW.psize });
  const mid = (S) => { const [, , t, b] = inkSpan(S); return (t + b) / 2; };
  dots = vShift(dots, 0, mid(facs[0].filter((s) => s.a.ch === '×')) - mid(dots));
  const sum = at(vFac(String.raw`\htmlClass{t-vint}{(${term('1')}\,+\,${term('2')}\,+\,\cdots\,+\,${term('n')})}`), xm, VW.pbig);
  const int = at(vFac(String.raw`\htmlClass{t-vint}{\textcolor{${COL.yellow}}{\int \sigma(x)\,dx}}`), xm, VW.pbig);   // in the yellow of the area it is
  const uni = at(vFac(sg + String.raw`\,` + vX), xm, VW.pbig);
  const row = [...facs[0], ...facs[1], ...dots, ...facs[2]];
  return (vProd = { facs, dots, sum, int, uni, toSum: matchPlan(row, sum), toInt: matchPlan(sum, int), toUni: matchPlan(int, uni) });
}
function drawVaryProd(ctx, st, alpha) {
  const pr = clamp(st.vprod, 0, 1); if (pr <= 0.003 || alpha <= 0.003) return;
  const F = varyProd(), sm = clamp(st.vsum, 0, 1), im = clamp(st.vint, 0, 1), um = clamp(st.vsx, 0, 1), pos = VPOS.one, A = varyAxes(), P = varyProfile(st, 'A');
  if (sm <= 0.001) {
    // written in one after the other; from each, a dashed line to its tiny section: up through the volume to its bar in the plot
    [0, 1, 3].forEach((slot, i) => {
      const p = clamp(pr * 4 - slot, 0, 1); if (p <= 0.003) return;
      drawSprites(ctx, F.facs[i], { p, alpha });
      const sec = i < 2 ? i : VARY.n - 1, u = ((sec + 0.5) * 2) / VARY.n, [l, r, t] = inkSpan(F.facs[i]), [sx, sy0] = vStage(pos, (u / 2) * VG.L, VG.R * 0.9), [, sy1] = vStage(pos, 0, A.Y(P.band(u)));
      ctx.save(); ctx.setLineDash([10, 8]); ctx.strokeStyle = hexA(COL.white, 0.9 * smooth(p) * alpha); ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo((l + r) / 2, t - 10); ctx.lineTo(sx, sy0); ctx.lineTo(sx, sy1); ctx.stroke(); ctx.restore();
    });
    const pd = clamp(pr * 4 - 2, 0, 1); if (pd > 0.003) drawSprites(ctx, F.dots, { p: pd, alpha });
    return;
  }
  if (sm < 0.999) { drawMorph(ctx, F.toSum, sm, alpha); return; }
  if (im <= 0.001) { drawSprites(ctx, F.sum, { alpha }); return; }
  if (im < 0.999) { drawMorph(ctx, F.toInt, im, alpha); return; }
  if (um <= 0.001) { drawSprites(ctx, F.int, { alpha }); varyBox(ctx, F.int.filter((q) => q.a.terms.includes('t-vint')), smooth(clamp(st.vsame, 0, 1)) * alpha, 11); return; }
  if (um < 0.999) { drawMorph(ctx, F.toUni, um, alpha); return; }
  drawSprites(ctx, F.uni, { alpha });
}
// 55b: the integral has a name: a copy of it goes up beside the plot, τ = ∫σ(x)dx, and over it, "optical depth" (clear
// of the integral sign). 57b: both go
const VTAU = { x: 1640, y: 345, size: 50, ny: 250, nsize: 40 };
let vTau = null;
function drawVaryTau(ctx, st) {
  const m = clamp(st.vtau, 0, 1), nm = clamp(st.vname, 0, 1), ta = 1 - smooth(clamp(st.vtauOut || 0, 0, 1)); if (m <= 0.003 || ta <= 0.003) return;
  if (!vTau) {
    const to = place(tex(String.raw`\textcolor{${COL.yellow}}{\tau} = \textcolor{${COL.yellow}}{\int \sigma(x)\,dx}`), { x: VTAU.x, y: VTAU.y, size: VTAU.size });
    vTau = { to, plan: matchPlan(varyProd().int.filter((q) => q.a.terms.includes('t-vint')), to) };
  }
  if (m < 0.999) drawMorph(ctx, vTau.plan, m, ta); else drawSprites(ctx, vTau.to, { alpha: ta });
  if (nm > 0.003) drawTex(ctx, String.raw`\text{optical depth}`, VTAU.x, VTAU.ny, VTAU.nsize, { p: nm, alpha: ta });
}
function drawVary(ctx, dt, st) {
  const on = smooth(clamp((st.von - 0.35) / 0.65, 0, 1)) * (1 - smooth(clamp(st.endOut || 0, 0, 1))); if (on <= 0.003) return;   // (58: it all goes, for the ending, end.js)
  // 51: B fades where it is, and then A comes back to the middle (one: how far that has gone, for B and for A)
  const one = smooth(clamp(st.vone * 2.5, 0, 1)), back = smooth(clamp((st.vone - 0.3) / 0.7, 0, 1)), dual = smooth(clamp(st.vdual, 0, 1)), du = dual * (1 - back);
  const fo = smooth(clamp(st.vfoc, 0, 1)), plotIn = smooth(clamp(st.vax, 0, 1));
  // (until the plot comes in, the picture alone is in the middle, and bigger)
  const at = (to, d) => VPOS.one.map((v, i) => lerp(v, to[i], d)), lift = (1 - plotIn) * VG.cy;
  const sides = [{ name: 'A', at: at(VPOS.A, du), du, fade: st.vfA, a: 1 }, { name: 'B', at: at(VPOS.B, dual), du: dual, fade: st.vfB, a: 1 - one }];
  ctx.save(); ctx.globalAlpha *= on;
  for (const S of sides) {
    if (S.name === 'B' && (st.vdual <= 0.003 || S.a <= 0.003)) continue;   // (until it's copied, the second is right under the first)
    const [X, Y, k0] = S.at, k = k0 * lerp(VPOS.alone, 1, plotIn);
    ctx.save(); ctx.globalAlpha *= lerp(1, 0.4, smooth(clamp(S.fade, 0, 1))) * S.a;
    ctx.save(); ctx.translate(X, Y + lift * k); ctx.scale(k, k); ctx.translate(-VG.cx, -VG.cy); varyDraw(ctx, st, S.name, k, S.du); ctx.restore();
    if (S.du > 0.003) drawTex(ctx, String.raw`\text{${S.name}}`, VPOS.lab[S.name][0], VPOS.lab[S.name][1], 56, { alpha: S.du * (1 - one) });
    ctx.restore();
  }
  // 43–50: a line between the two, once the copy is nearly in place
  const sep = smooth(clamp((dual - 0.6) / 0.4, 0, 1)) * (1 - one);
  if (sep > 0.003) { ctx.save(); ctx.strokeStyle = hexA(COL.greyC, 0.9 * sep); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(960, VPOS.sep[0]); ctx.lineTo(960, VPOS.sep[1]); ctx.stroke(); ctx.restore(); }
  // 50: both pictures lose their colour and dim; only the additions, drawn after this, keep theirs
  if (fo * (1 - one) > 0.003) for (const S of sides) greyOut(ctx, VHALF[S.name], fo * (1 - one) * on, 0.3 * fo * (1 - one) * on);
  // 46: the question
  if (st.vq > 0.003) drawTex(ctx, String.raw`\text{A or B?}`, 960, 140, 64, { alpha: smooth(clamp(st.vq, 0, 1)) });
  // 48–50: under each section its factor; 51: they go
  const pa = 1 - one;
  if (pa > 0.003) {
    const b = clamp(st.vb1, 0, 1);
    drawVaryPair(ctx, varyPair(VARY.s1, VARY.s2, VPOS.A), st.va1, st.va2, st.va3, st.va4, fo, pa * lerp(1, 0.4, smooth(clamp(st.vfA, 0, 1))));
    drawVaryPair(ctx, varyPair(VARY.s2, VARY.s1, VPOS.B), b * 2, b * 2 - 1, st.vb3, st.vb4, fo, pa * lerp(1, 0.4, smooth(clamp(st.vfB, 0, 1))));
  }
  // 53b on: the tiny sections' factors; 55b: τ
  drawVaryProd(ctx, st, 1);
  drawVaryTau(ctx, st);
  ctx.restore();
  // 44–49: the one we aren't talking about loses its colour
  for (const S of sides) { const f = smooth(clamp(S.fade, 0, 1)) * on * (1 - one); if (f > 0.003) greyOut(ctx, VHALF[S.name], f, 0); }
}

// ---- the beats ----
// 41: the long frame's slabs and plot make way for a zoomed-out setup: the laser, a cloud that is denser here and
// thinner there, the sensor. 41b: a dense spot, circled. 41c: and a thin one
function varyStart() { return ptw('von', 1, 1.8); }
function varyDense() { return ptw('vc1', 1, 0.6); }
function varyThin() { ptw('vc1', 0, 0.5); return ptw('vc2', 1, 0.6); }   // (the dense spot's circle goes as this one comes)
// 42: the circles go, and the cloud becomes the simple case: two sections, dense then thin, a dashed line between them
// The light starts over from the laser once the sections are there, and travels as far as the middle (the dense half);
// 42b: then the rest of the way, through the thin half, to the sensor
const VMID = (VG.L / 2 - VG.laser) / (VG.sensor - 11 - VG.laser);
function varySections() { ptw('vc1', 0, 0.4); ptw('vc2', 0, 0.4); ptw('vface', 1, 0.7, { delay: 1.4 }); PS.vfr = 0; ptw('vfr', VMID, 1.8, { delay: 1.0, ease: linear }); return ptw('vsect', 1, 1.8, { delay: 0.2 }); }
function varyRest() { return ptw('vfr', 1, 1.6, { ease: linear }); }
// 42c: the picture moves down and the plot's axes come in over it. 42d: σ = 0.4 written in the first section, and the
// plot's line drawn across it. 42e: the line drops and goes on across the second, σ = 0.2 written there
function varyAxesIn() { return ptw('vax', 1, 1.2); }
function varyPlot1() { ptw('vs1', 1, 0.6); return ptw('vpl', 1 / 2.25, 1.6, { delay: 0.2, ease: linear }); }
function varyPlot2() { ptw('vs2', 1, 0.6, { delay: 0.5 }); return ptw('vpl', 1, 1.9, { ease: linear }); }
// 43: the plots lose their colour; the setup shrinks to the left, A, and its copy goes to the right, B, which is where the
// focus is: A fades as it goes. 43b: B's two sections change places
function varyCopy() { ptw('vmute', 1, 0.6); ptw('vfA', 1, 0.7, { delay: 0.6 }); return ptw('vdual', 1, 1.6); }
function varySwap() { return ptw('vswap', 1, 1.9); }
// 46: A comes back, both as they were, and the question (no walk through them first: by now the question is clear).
// 47: the answer: both sensors read the same
function varyAsk() { ptw('vfA', 0, 0.6); return ptw('vq', 1, 0.6, { delay: 0.3 }); }
function varyReveal() { ptw('vq', 0, 0.4); return ptw('vread', 1, 0.5, { delay: 0.4 }); }
// 48–48d: A's sections, B faded: × e^{−0.4x} under the first; × e^{−0.2x} under the second; the two become one,
// × e^{−(0.4+0.2)x}; its brackets become 0.6
function varyA1() { ptw('vfB', 1, 0.6); return ptw('va1', 1, 0.8, { delay: 0.2, ease: linear }); }
function varyA2() { return ptw('va2', 1, 0.8, { ease: linear }); }
function varyA3() { return ptw('va3', 1, 1.4, { ease: linear }); }
function varyA4() { return ptw('va4', 1, 1.0, { ease: linear }); }
// 49: the same for B, A faded: its two factors, which then become one. 49b: its brackets become 0.6 too; both as they were
async function varyB3() {
  const g = PRES.gen;
  ptw('vfB', 0, 0.6); ptw('vfA', 1, 0.6); await ptw('vb1', 1, 1.6, { delay: 0.3, ease: linear }); if (!labAlive(g)) return;
  await ptw('vb3', 1, 1.4, { delay: 0.3, ease: linear });
}
function varyB4() { ptw('vfA', 0, 0.6); return ptw('vb4', 1, 1.0, { ease: linear }); }
// 50: both sums go back into their brackets; then everything else loses its colour and dims, and each addition is boxed
function varyPlus() { ptw('va4', 0, 0.9, { ease: linear }); ptw('vb4', 0, 0.9, { ease: linear }); return ptw('vfoc', 1, 0.8, { delay: 1.0 }); }
// 51: B and what is written go; A comes to the middle, alone and in its colours again
function varyOne() { ptw('vfoc', 0, 0.5); ptw('vmute', 0, 0.8, { delay: 0.5 }); return ptw('vone', 1, 1.6); }
// 51b: σ now changes continuously: the two sections become one hump, on the plot and in the fog
function varyCont() { return ptw('vcont', 1, 2.0); }
// 52: the synced point climbs the hump. 52b: and comes down the other side, to zero
function varyRise() { PS.vpA = 0; ptw('vpAa', 1, 0.4); return ptw('vpA', 1, 2.6, { delay: 0.4, ease: linear }); }
function varyFall() { return ptw('vpA', 2, 2.6, { ease: linear }); }
// 53: the path chopped into tiny sections: dashed lines in the volume, a bar over each in the plot. 53b: a factor for
// each, written in turn, a dashed line from each to its tiny section
function varyChop() { ptw('vpAa', 0, 0.4); return ptw('vchop', 1, 1.2); }
function varyProduct() { return ptw('vprod', 1, 3.2, { ease: linear }); }
// 54: multiplied, they are one factor, their exponents added. 55: the sum becomes an integral while the bars get thinner
// and thinner and become the area under the curve. 55b: the integral is written τ: the optical depth
function varySum() { return ptw('vsum', 1, 1.7, { ease: linear }); }
function varyIntegral() { return ptw('vint', 1, 4.0, { ease: linear }); }
function varyTauName() { ptw('vtau', 1, 1.5); return ptw('vname', 1, 0.9, { delay: 1.3, ease: linear }); }
// 56: the volume goes through other shapes, each with the same integral. 56b: the integral and the reading, boxed
function varyShapes() { if (reduced) return ptw('vshR', 1, 1.6); PS.vshLoop = 1; PS.vshT0 = labLoopStart('vshT0', TIME); return Promise.resolve(); }
function varySame() { return ptw('vsame', 1, 0.6); }
// 57: a uniform volume. 57b: its integral is σ times x: the formula from before; τ and its name go, and "area = σ × x"
// writes in inside the rectangle under the flat line. 57c: that area brightens
function varyUniform() { ptw('vsame', 0, 0.5); return ptw('vuni', 1, 1.8); }
function varySigmaX() { ptw('vtauOut', 1, 0.8); ptw('vsx', 1, 1.5, { ease: linear }); return ptw('varL', 1, 1.0, { delay: 1.1, ease: linear }); }   // (τ and its name go; the area's label writes in)
function varyArea() { return ptw('varea', 1, 0.7); }
