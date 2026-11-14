// ---------- presentation, part 5: when the density changes along the path (beats 41–50) ----------
// In the long frame that part 4 ends with (why.js), and in the same picture: the laser's sheet of light, the particles
// with their shadows, the sensor. First the volume as it is in practice, denser here and thinner there, a spot of each
// circled. Then the simple case: two sections, dense then thin, a dashed line between them, σ written in each, and the
// plot of σ along the path on top. Then the question: the same setup again on the right with its sections swapped: in
// which does more light come out? A synced point walks through each in turn, the other one faded. They read the same.
// Why: the two factors multiply, their exponents add, and a sum doesn't care about the order.
// The same thirty particles are in every picture, and their heights in the beam never change, only where along the path
// they are: so the same light gets through in both orders, by construction; the readout measures it from the picture.
const VARY = { D: 0.02, nd: 20, ns: 10, lit: 0.55, d: 1, len: 800, H: 480, far: 18, seed: 1 };
// D: a particle's height, of the beam's; nd, ns: how many in the dense section and the thin one; lit: what gets through
// them all (e^{−0.6d} for a section as long as d = 1); len, H: the volume's length and the beam's height, for keeping
// discs off each other (far); seed: where the search for an arrangement starts (it is the first that fits).
// The setup in its own units: the volume from x0 to x1, the laser's face and the sensor a gap from it, the laser's body
// lw wide; the plot over it, σ = 0 at plotB and σ = 0.4 at plotT; the readout over the sensor, rd: its box's width,
// height and top. cx, and cyPic or cyAll: its middle (the picture alone, or with the plot). c1, c2, cr: the two circles,
// where along the path and how far down the beam, and their radius.
const VG = { x0: 500, x1: 1300, gap: 110, lw: 120, plotB: 210, plotT: 60, cx: 878, cyPic: 540, cyAll: 395, c1: [0.3, 0.42], c2: [0.74, 0.56], cr: 100, rd: [170, 80, 62] };
// On the stage: alone (41–42b), then A on the left and B on the right (43 on): [x, y, scale] of its middle
const VPOS = { one: [960, 545, 0.78], A: [505, 501, 0.68], B: [1415, 501, 0.68], fy: 838, fsize: 52 };
// Thirty particles, each D of the beam's height: twenty for the dense stretch, ten for the thin one. Their heights are
// random; the last one's is moved until exactly lit gets through them all, and the dense twenty alone let about
// e^{−0.4} through, the thin ten about e^{−0.2}. Along the path (0 to 1) each has a place in the cloud (tc), where the
// density comes and goes: those of the dense ones that are at the right height crowd round one spot (c1), and none of
// the thin ones come near another (c2). And each has a place in the two sections, dense then thin (ts); swapped, that
// plus or minus a half. They keep their order along the path from the cloud to the sections.
function varyParts() {
  const { D, nd, ns, lit, len, H, far } = VARY, n = nd + ns, iv = (vs) => vs.map((v) => [v - D / 2, v + D / 2]), lo = D / 2 + 0.02, hi = 1 - D / 2 - 0.02;
  for (let seed = VARY.seed; seed < VARY.seed + 6000; seed++) {
    const r = rng32(seed * 7919), v = Array.from({ length: n - 1 }, () => lerp(lo, hi, r()));
    const g = (x) => whyLitOf(iv([...v, x])) - lit, roots = [];
    let px = lo, pg = g(lo);
    for (let i = 1; i <= 600; i++) {
      const x = lerp(lo, hi, i / 600), gx = g(x);
      if (pg * gx < 0) { let a = px, b = x, ga = pg; for (let k = 0; k < 60; k++) { const c = (a + b) / 2, gc = g(c); if ((gc < 0) === (ga < 0)) { a = c; ga = gc; } else b = c; } roots.push((a + b) / 2); }
      px = x; pg = gx;
    }
    if (!roots.length) continue;
    v.push(roots[Math.floor(r() * roots.length)]);
    if (Math.abs(whyLitOf(iv(v.slice(0, nd))) - Math.exp(-0.4 * VARY.d)) > 0.006 || Math.abs(whyLitOf(iv(v.slice(nd))) - Math.exp(-0.2 * VARY.d)) > 0.006) continue;
    // a place along the path for each of idx, drawn by pick(i), no two discs on top of each other
    const placed = [];
    const spread = (idx, pick, keep = () => true) => {
      const out = {};
      for (const i of idx) for (let k = 0; k < 600; k++) { const t = pick(i); if (k === 599 || (keep(t, v[i]) && placed.every(([pt, pv]) => Math.hypot((t - pt) * len, (v[i] - pv) * H) >= far))) { out[i] = t; placed.push([t, v[i]]); break; } }
      return out;
    };
    const dense = Array.from({ length: nd }, (_, i) => i), thin = Array.from({ length: ns }, (_, i) => nd + i);
    const crowd = dense.filter((i) => Math.abs(v[i] - VG.c1[1]) < 0.19), rest = dense.filter((i) => !crowd.includes(i));
    if (crowd.length < 7) continue;
    const off = (c, rad) => (t, vv) => Math.hypot((t - c[0]) * len, (vv - c[1]) * H) > rad;
    const tc = { ...spread(crowd, () => lerp(VG.c1[0] - 0.085, VG.c1[0] + 0.085, r())), ...spread(rest, () => lerp(0.03, 0.56, r()), off(VG.c1, VG.cr + 12)), ...spread(thin, () => lerp(0.5, 0.97, r()), off(VG.c2, VG.cr + 14)) };
    placed.length = 0;
    const inOrder = (idx, a, b) => { const ts = spread(idx, () => lerp(a, b, r())), by = idx.slice().sort((p, q) => tc[p] - tc[q]), sorted = idx.map((i) => ts[i]).sort((p, q) => p - q), o = {}; by.forEach((i, k) => { o[i] = sorted[k]; }); return o; };
    const ts = { ...inOrder(dense, 0.04, 0.46), ...inOrder(thin, 0.54, 0.96) };
    return Array.from({ length: n }, (_, i) => ({ v: v[i], dense: i < nd, tc: tc[i], ts: ts[i] }));
  }
  throw new Error('varyParts: no arrangement');
}
const VPART = varyParts();
function VARY_DEFAULTS() { return {
  von: 0, vc1: 0, vc2: 0, vsect: 0, vface: 0, vsig: 0, vax: 0, vpl: 0, vdual: 0, vswap: 0, vmute: 0, vfA: 0, vfB: 0, vswA: 0, vswAa: 0, vswB: 0, vswBa: 0,
  vq: 0, vread: 0, va1: 0, va2: 0, va3: 0, va4: 0, vb3: 0, vb4: 0, vfoc: 0,
}; }
// One setup, in its own units. o: sect, how far the particles have gone from the cloud into the two sections; swap, how
// far the sections have swapped; faces, the dashed lines; sig, σ written in each section; ax and pl, the plot's axes and
// how much of its line is drawn; mute, how much colour its line has lost; sweep, where the synced point is (0 to 2
// sections, or null); read, the sensor's readout; c1, c2, the circles on a dense spot and a thin one.
function varyDraw(ctx, o) {
  const L = VG.x1 - VG.x0, mid = (VG.x0 + VG.x1) / 2, se = smooth(clamp(o.sect, 0, 1)), sw = smooth(clamp(o.swap, 0, 1)), laserX = VG.x0 - VG.gap, sensorX = VG.x1 + VG.gap, top = WHY.yc - WHY.hh;
  const parts = VPART.map((p) => ({ x: VG.x0 + lerp(p.tc, p.ts + (p.dense ? 0.5 : -0.5) * sw, se) * L, v: p.v, D: VARY.D, a: 1 }));
  const fa = smooth(clamp(o.faces, 0, 1));
  whyView(ctx, { yc: WHY.yc, hh: WHY.hh, xL: laserX, xR: sensorX, power: 1, slabs: [{ x0: VG.x0, x1: mid, a: fa }, { x0: mid, x1: VG.x1, a: fa }], parts, laserX, sensorX, laserA: 1, sensorA: 1, laserW: VG.lw, readA: 0 });
  // the sensor's readout, over it (beside it, it would run into the other setup): what gets through, measured from the picture
  const ra = smooth(clamp(o.read, 0, 1));
  if (ra > 0.003) {
    const [bw, bh, by] = VG.rd, x = sensorX + 13, v = whyLit(parts) * 100, pop = lerp(0.7, 1, ra);
    ctx.save(); ctx.translate(x, by + bh / 2); ctx.scale(pop, pop); ctx.translate(-x, -by - bh / 2); ctx.globalAlpha *= ra;
    ctx.strokeStyle = COL.greyB; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x, top - 14); ctx.lineTo(x, by + bh); ctx.stroke();
    ctx.fillStyle = BG; ctx.beginPath(); ctx.roundRect(x - bw / 2, by, bw, bh, 12); ctx.fill(); ctx.stroke();
    ctx.restore();
    drawNumber(ctx, v, x, by + bh / 2 + 17, { size: 48, dec: Math.abs(v - Math.round(v)) < 0.05 ? 0 : 1, suffix: '%', align: 'center', alpha: ra * ctx.globalAlpha });
  }
  // 41b, 41c: a dense spot and a thin one, circled
  for (const [a, [t, v]] of [[o.c1, VG.c1], [o.c2, VG.c2]]) {
    const c = smooth(clamp(a || 0, 0, 1)); if (c <= 0.003) continue;
    ctx.save(); ctx.strokeStyle = hexA(COL.white, 0.9 * c); ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(VG.x0 + t * L, top + v * 2 * WHY.hh, VG.cr * lerp(1.25, 1, c), 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  }
  // 42b: σ written in each section, in its yellow, on a little shade
  const sg = smooth(clamp(o.sig, 0, 1));
  if (sg > 0.003) for (const [val, q] of [['0.4', lerp(0.25, 0.75, sw)], ['0.2', lerp(0.75, 0.25, sw)]]) {
    const x = VG.x0 + q * L, y = top + 64, src = String.raw`\sigma = ${val}`, tw = tex(src).w * 58;
    ctx.fillStyle = `rgba(28,27,24,${(0.78 * sg).toFixed(3)})`; ctx.beginPath(); ctx.roundRect(x - tw / 2 - 14, y - 36, tw + 28, 72, 12); ctx.fill();
    drawTex(ctx, src, x, y, 58, { alpha: sg, color: COL.yellow });
  }
  // the plot of σ along the path, over the volume: 0.4 then 0.2 (or, swapped, the other way round), drawn left to right
  const ax = smooth(clamp(o.ax, 0, 1));
  if (ax > 0.003) {
    const A = varyAxes(), s1 = lerp(0.4, 0.2, sw), s2 = lerp(0.2, 0.4, sw), mu = smooth(clamp(o.mute, 0, 1)), col = mixRgb(hexRgb(COL.yellow), hexRgb(COL.greyB), mu);
    drawAxes(ctx, A, { c: ax, nums: 0, lab: 0 });
    for (const v of [0.2, 0.4]) drawTex(ctx, String(v), A.ox - 20, A.Y(v), 34, { ax: 1, alpha: ax * lerp(1, 0.7, mu) });
    drawTex(ctx, String.raw`\sigma`, A.ox - 18, A.Y(0.4) - 62, 50, { ax: 1, alpha: ax, color: mixRgb(hexRgb(COL.yellow), hexRgb(COL.greyB), mu) });
    drawTex(ctx, 'd', A.X(2) + A.ext + 24, A.oy, 50, { ax: 0, alpha: ax, color: mixRgb(hexRgb(LDCOL), hexRgb(COL.greyB), mu) });
    // its line: across the first section, down (or up), across the second; as far as it has been drawn
    const pl = clamp(o.pl, 0, 1), pts = [[0, s1], [1, s1], [1, s2], [2, s2]], seg = [1, 0.25, 1], tot = 2.25;
    if (pl > 0.003) {
      ctx.save(); ctx.strokeStyle = rgba(col, ax); ctx.lineWidth = 6; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(A.X(0), A.Y(s1));
      let left = pl * tot;
      for (let k = 0; k < 3 && left > 0; k++) { const f = Math.min(1, left / seg[k]); ctx.lineTo(A.X(lerp(pts[k][0], pts[k + 1][0], f)), A.Y(lerp(pts[k][1], pts[k + 1][1], f))); left -= seg[k]; }
      ctx.stroke(); ctx.restore();
    }
    // 44, 45: the synced point: on the plot, and a dashed line from it down through the volume, at the same place
    const sa = smooth(clamp(o.sweepA || 0, 0, 1));
    if (sa > 0.003 && o.sweep != null) {
      const d = clamp(o.sweep, 0, 2), sv = lerp(s1, s2, smooth(clamp((d - 0.97) / 0.06, 0, 1))), x = A.X(d), y = A.Y(sv);
      dashed(ctx, x, y + 14, x, top + 2 * WHY.hh + 36, COL.greyA, 0.9 * sa, 3);
      dot(ctx, x, y, 13, COL.white, sa);
    }
  }
}
let VAX = null;
const varyAxes = () => VAX || (VAX = makeAxes({ L: VG.x0, R: VG.x1, T: VG.plotT, B: VG.plotB, xr: [0, 2, 1], yr: [0, 0.4, 0.2], ext: 36, xl: '', yl: '', labSize: 50, numSize: 30 }));
// Drawn on the stage: its middle (the picture's, or the picture's and the plot's, as cy says) at [x, y], scaled by k
const varyAt = (ctx, [x, y, k], cy, f) => { ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.translate(-VG.cx, -cy); f(); ctx.restore(); };
// The walk-through's formulas (48–50): e^{−0.4d} × e^{−0.2d} = e^{−(0.4+0.2)d}, and with the brackets gone, e^{−0.6d};
// σ's numbers in its yellow, d in its blue. Each is laid out once, from a fixed left edge, so nothing moves as its parts
// come in or as the brackets turn into their sum.
const vE = (x) => String.raw`e^{-${x}\,\textcolor{${COL.blue}}{d}}`, vN = (v) => String.raw`\textcolor{${COL.yellow}}{${v}}`;
const vLine = (a, b, sum) => String.raw`\mathord{\htmlClass{t-v1}{${vE(vN(a))}}}\mathbin{\htmlClass{t-v2}{\times}}\mathord{\htmlClass{t-v2}{${vE(vN(b))}}}\mathrel{\htmlClass{t-v3}{=}}\mathord{\htmlClass{t-v3}{${vE(sum ? vN('0.6') : String.raw`\htmlClass{t-vsum}{(${vN(a)}\htmlClass{t-vplus}{+}${vN(b)})}`)}}}`;
const vfCache = new Map();
function varyFormula(a, b, cx) {
  const key = a + '|' + b + '|' + cx; if (vfCache.has(key)) return vfCache.get(key);
  const x = cx - (tex(vLine(a, b, false)).w * VPOS.fsize) / 2, at = (sum) => place(tex(vLine(a, b, sum)), { x, y: VPOS.fy, size: VPOS.fsize, ax: 0 });
  const full = at(false), done = at(true), F = { full, done, plan: matchPlan(full, done) };
  vfCache.set(key, F); return F;
}
// One side's formula: its three parts written in (p1, p2, p3), the brackets turned into their sum (m), and (foc) all of
// it dimmed but the addition in the exponent, its plus sign a little bigger
function drawVaryFormula(ctx, F, p1, p2, p3, m, foc, alpha) {
  if (alpha <= 0.003) return;
  const has = (s, t) => s.a.terms.includes(t), mm = smooth(clamp(m, 0, 1)), fo = smooth(clamp(foc, 0, 1));
  if (mm > 0.001 && mm < 0.999) { drawMorph(ctx, F.plan, mm, alpha); return; }
  if (mm >= 0.999) { drawSprites(ctx, F.done, { alpha }); return; }
  for (const [t, p] of [['t-v1', p1], ['t-v2', p2], ['t-v3', p3]]) {
    if (p <= 0.003) continue;
    const S = F.full.filter((s) => has(s, t));
    if (p < 1 || fo <= 0.003) { drawSprites(ctx, S, { p, alpha }); continue; }
    for (const s of S) {
      const sum = has(s, 't-vsum'), plus = has(s, 't-vplus'), al = s.alpha * alpha * (sum ? 1 : 1 - 0.72 * fo), col = plus ? mixRgb(ink(s.color), hexRgb(COL.gold), fo) : s.color;
      if (!plus) { drawSprite(ctx, s, al, col); continue; }
      const [l, r, tp, b] = inkBox(s), x = (l + r) / 2, y = (tp + b) / 2, k = 1 + 0.35 * fo;
      ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.translate(-x, -y); drawSprite(ctx, s, al, col); ctx.restore();
    }
  }
}
function drawVary(ctx, dt, st) {
  const on = smooth(clamp((st.von - 0.35) / 0.65, 0, 1)); if (on <= 0.003) return;
  const du = smooth(clamp(st.vdual, 0, 1)), plotIn = smooth(clamp(st.vax, 0, 1)), cy = lerp(VG.cyPic, VG.cyAll, plotIn), fo = smooth(clamp(st.vfoc, 0, 1));
  const base = { sect: st.vsect, faces: st.vface, sig: st.vsig, ax: st.vax, pl: st.vpl, read: st.vread, c1: st.vc1, c2: st.vc2 };
  const sides = [
    { at: VPOS.one.map((v, i) => lerp(v, VPOS.A[i], du)), fade: st.vfA, o: { ...base, swap: 0, mute: st.vmute * (1 - clamp(st.vswAa, 0, 1)), sweep: st.vswA, sweepA: st.vswAa }, name: 'A', half: [60, 210, 890, 670] },
    { at: VPOS.one.map((v, i) => lerp(v, VPOS.B[i], du)), fade: st.vfB, o: { ...base, swap: st.vswap, mute: st.vmute * (1 - clamp(st.vswBa, 0, 1)), sweep: st.vswB, sweepA: st.vswBa }, name: 'B', half: [970, 210, 890, 670] },
  ];
  ctx.save(); ctx.globalAlpha *= on;
  sides.forEach((S, j) => {
    if (j === 1 && du <= 0.003) return;   // (until it's duplicated, the second is right under the first)
    const f = smooth(clamp(S.fade, 0, 1));
    ctx.save(); ctx.globalAlpha *= lerp(1, 0.4, f);
    varyAt(ctx, S.at, cy, () => varyDraw(ctx, S.o));
    if (du > 0.003) drawTex(ctx, String.raw`\text{${S.name}}`, S.half[0] + 44, S.half[1] + 44, 56, { alpha: du });
    ctx.restore();
  });
  // 46: the question
  if (st.vq > 0.003) drawTex(ctx, String.raw`\text{A or B?}`, 960, 140, 64, { alpha: smooth(clamp(st.vq, 0, 1)) });
  // 48–50: the two products
  const FA = varyFormula('0.4', '0.2', VPOS.A[0]), FB = varyFormula('0.2', '0.4', VPOS.B[0]);
  drawVaryFormula(ctx, FA, clamp(st.va1, 0, 1), clamp(st.va2, 0, 1), clamp(st.va3, 0, 1), st.va4, st.vfoc, lerp(1, 0.4, smooth(clamp(st.vfA, 0, 1))));
  const b = clamp(st.vb3, 0, 1);
  drawVaryFormula(ctx, FB, clamp(b * 3, 0, 1), clamp(b * 3 - 1, 0, 1), clamp(b * 3 - 2, 0, 1), st.vb4, st.vfoc, lerp(1, 0.4, smooth(clamp(st.vfB, 0, 1))));
  ctx.restore();
  // the one we aren't talking about loses its colour; at 50 both pictures do, and only the additions keep theirs
  sides.forEach((S) => { const f = smooth(clamp(S.fade, 0, 1)) * on; if (f > 0.003) greyOut(ctx, S.half, f, 0); });
  if (fo > 0.003) for (const S of sides) greyOut(ctx, [S.half[0], S.half[1], S.half[2], 585], fo * on, 0.3 * fo * on);
}

// ---- the beats ----
// 41: the long frame's slabs and plot make way for the volume as it is in practice: denser here, thinner there
function varyStart() { return ptw('von', 1, 1.8); }
// 41b: a dense spot, circled. 41c: and a thin one
function varyDense() { return ptw('vc1', 1, 0.6); }
function varyThin() { return ptw('vc2', 1, 0.6); }
// 42: the circles go, and the particles move into two sections, dense then thin, dashed lines at their ends and between
function varySections() { ptw('vc1', 0, 0.4); ptw('vc2', 0, 0.4); ptw('vface', 1, 0.8, { delay: 1.1 }); return ptw('vsect', 1, 1.9); }
// 42b: σ written in each; the picture moves down and the plot of σ comes in over it, its line drawn left to right
function varySigma() { ptw('vsig', 1, 0.6); ptw('vax', 1, 1.1, { delay: 0.5 }); return ptw('vpl', 1, 2.8, { delay: 1.5, ease: linear }); }
// 43: the plots lose their colour; the setup shrinks to the left, A, and its copy goes to the right, B, where the two
// sections then swap places
async function varySwap() {
  const g = PRES.gen;
  ptw('vmute', 1, 0.6); await ptw('vdual', 1, 1.6); if (!labAlive(g)) return;
  await ptw('vswap', 1, 1.9);
}
// 44: B fades, and a point walks through A, on its plot and in its volume. 45: the same for B, A faded
function varyWalkA() { ptw('vfB', 1, 0.6); PS.vswA = 0; ptw('vswAa', 1, 0.4); return ptw('vswA', 2, 3.8, { delay: 0.5, ease: linear }); }
function varyWalkB() { ptw('vfB', 0, 0.6); ptw('vfA', 1, 0.6); ptw('vswAa', 0, 0.4); PS.vswB = 0; ptw('vswBa', 1, 0.4); return ptw('vswB', 2, 3.8, { delay: 0.5, ease: linear }); }
// 46: both as they were, and the question. 47: the answer: both sensors read the same
function varyAsk() { ptw('vfA', 0, 0.6); ptw('vswBa', 0, 0.4); return ptw('vq', 1, 0.6, { delay: 0.3 }); }
function varyReveal() { ptw('vq', 0, 0.4); return ptw('vread', 1, 0.5, { delay: 0.4 }); }
// 48–48d: A's product, a part per press, B faded: e^{−0.4d}; × e^{−0.2d}; = e^{−(0.4+0.2)d}; the brackets become 0.6
function varyA1() { ptw('vfB', 1, 0.6); return ptw('va1', 1, 0.8, { ease: linear }); }
function varyA2() { return ptw('va2', 1, 0.9, { ease: linear }); }
function varyA3() { return ptw('va3', 1, 1.1, { ease: linear }); }
function varyA4() { return ptw('va4', 1, 1.0); }
// 49: the same for B, A faded, written through to its brackets. 49b: they become 0.6 too; both as they were
function varyB3() { ptw('vfB', 0, 0.6); ptw('vfA', 1, 0.6); return ptw('vb3', 1, 2.2, { delay: 0.3, ease: linear }); }
function varyB4() { ptw('vfA', 0, 0.6); return ptw('vb4', 1, 1.0); }
// 50: both sums go back into their brackets; then everything else loses its colour and dims, and the additions stay
function varyPlus() { ptw('va4', 0, 0.9); ptw('vb4', 0, 0.9); return ptw('vfoc', 1, 0.8, { delay: 1.0 }); }
