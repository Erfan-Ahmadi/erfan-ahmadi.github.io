// ---------- presentation, part 4: why exponential (beats 32–41) ----------
// The answer is in the beam itself, so we go in. From outside (the lab's row, lab.js) the beam is a thin red line that
// gets dimmer; from inside, magnified across its width until it fills the stage, it is a sheet of light, and each
// particle in its way is a dot with a shadow behind it, all the way to the sensor. Dimmer is just more shadows. Along
// the beam nothing is magnified more than a slab needs to show, so the two views share their places along it and one
// can turn into the other (win: how far inside we are; the sheet's height grows from the beam's own to WHY.hh).
//
// A thin slab is 1/69 of a box and holds one particle, as tall as 1% of the beam: 99% gets through, 0.99^n through n of
// them, and 69 of them are the box: 0.99^69 is 50%. The particles' heights are random (WHY.seed: an arrangement that
// follows 0.99^n closely), and the readout is always measured from the picture, shadows and all.
const WHY = { seed: 2089168, N: 69, D: 0.01, yc: 550, hh: 320, sheet: 0.52 };   // N: slabs to a box; D: a particle's height, of the beam's
const WDX = LAB.BW / WHY.N;                                                    // a slab's thickness, in the lab's units
const WX1 = { ox: 960, oy: WHY.yc, s: 1.2 }, WX2 = { ox: 1000, oy: WHY.yc, s: 0.93 };   // the lab's row from outside: one box, and two (fitted to the stage, the laser's body and the readout in)
// The particles: b, which box; k, which slab of it; xi, how far along the box (0 to 1); v, how high in the beam (0 to
// 1). Then where each goes when the particles are placed with care (cx, cv): five bands of the beam closed off, each by
// ten particles in a row, one a step lower than the last, and the other nineteen behind them, in their shadows: half
// the light, with nothing left to chance. rank: its place in its box from the top, 0 to 1, for moving them in turn.
const WPART = (() => {
  const r = rng32(WHY.seed), P = [];
  for (let i = 0; i < 2 * WHY.N; i++) { const u = r(), v = r(), k = i % WHY.N; P.push({ b: i < WHY.N ? 0 : 1, k, xi: (k + 0.2 + 0.6 * u) / WHY.N, v: WHY.D / 2 + (1 - WHY.D) * v }); }
  const rc = rng32(77), T = [];
  for (let j = 0; j < 5; j++) for (let m = 0; m < 10; m++) T.push([0.14 + 0.034 * m, 0.2 * j + WHY.D * (m + 0.5)]);
  for (let e = 0; e < WHY.N - 50; e++) T.push([0.56 + 0.36 * rc(), 0.2 * (e % 5) + 0.012 + 0.076 * rc()]);
  T.sort((p, q) => p[1] - q[1]);
  for (const b of [0, 1]) P.filter((p) => p.b === b).sort((p, q) => p.v - q.v).forEach((p, j) => { [p.cx, p.cv] = T[j]; p.rank = j / (WHY.N - 1); });
  return P;
})();
// Where the particles are on the stage, in geometry G, for an arrangement A: n, how many slabs there are; comb, the
// first box's particles moved to their careful places (0 to 1, from the top down); rig2, the second box's in theirs:
// the first box's own arrangement a band lower, where the first lets light through (shift 0), or not lowered at all,
// right behind the first's (shift 1); b2, how much of the second box's particles is there.
function whyParts(G, A) {
  const out = [], bw = WHY.N * G.w;
  for (const p of WPART) {
    let a = clamp(A.n - (p.b * WHY.N + p.k), 0, 1), xi = p.xi, v = p.v; if (a <= 0.003) continue;
    if (p.b === 0) { const e = smooth(clamp(A.comb * 1.5 - 0.5 * p.rank, 0, 1)); xi = lerp(xi, p.cx, e); v = lerp(v, p.cv, e); }
    else if (A.rig2 > 0.5) { xi = p.cx; v = p.cv + 0.1 * (1 - clamp(A.shift, 0, 1)); a *= clamp(A.b2 * 1.6 - 0.6 * p.rank, 0, 1); }
    else a *= clamp(A.b2, 0, 1);
    if (a > 0.003) out.push({ x: G.x0 + p.b * (bw + G.gap) + xi * bw, v, a });
  }
  return out;
}
// What's left of the light past those particles, 0 to 1: the share of the beam's height in no shadow (a particle that
// is only partly there, a: partly a shadow).
function whyLit(parts) {
  const h = WHY.D / 2, cuts = [0, 1];
  for (const p of parts) cuts.push(clamp(p.v - h, 0, 1), clamp(p.v + h, 0, 1));
  cuts.sort((p, q) => p - q);
  let lit = 0;
  for (let i = 0; i + 1 < cuts.length; i++) {
    const lo = cuts[i], hi = cuts[i + 1]; if (hi - lo < 1e-9) continue;
    const m = (lo + hi) / 2; let t = 1;
    for (const p of parts) if (Math.abs(p.v - m) < h) { t *= 1 - p.a; if (t <= 0) break; }
    lit += t * (hi - lo);
  }
  return lit;
}
// Geometry along the beam: x0, the first slab's first face; w, a slab's thickness on the stage; gap, between the boxes;
// xE and xS, the laser's face and the sensor's; s, the scale of the lab's row there. n slabs side by side: as wide as
// 200 each while they fit, then all of them in the width of the lab's box, which 69 fill exactly.
function whyCount(n) {
  const m = Math.max(n, 1), w = Math.min(200, (WX1.s * LAB.BW) / m), sx = w / WDX, x0 = 960 - (m * w) / 2;
  return { x0, w, gap: sx * LAB.G, xE: x0 - LAB.laserGap * sx, xS: Math.min(1590, x0 + m * w + LAB.sensorGap * sx), s: WX1.s };
}
const WG2 = (() => { const s = WX2.s, T = 2 * LAB.BW + LAB.G; return { x0: WX2.ox - (s * T) / 2, w: s * WDX, gap: s * LAB.G, xE: WX2.ox - s * (T / 2 + LAB.laserGap), xS: WX2.ox + s * (T / 2 + LAB.sensorGap), s }; })();
const mixGeo = (A, B, t) => { const o = {}; for (const k of Object.keys(A)) o[k] = lerp(A[k], B[k], t); return o; };
// The two boxes fitted into part of the stage, for the pictures side by side: from px, pw wide, the beam's middle at yc
// and half as tall as hh; rk and fk: the scale of the readout, and of the plates and lines.
const whyFit = (px, pw, yc, hh, rk, fk) => {
  const XA = WG2.xE - 26, f = pw / (WG2.xS + 118 - XA), at = (x) => px + (x - XA) * f;
  return { x0: at(WG2.x0), w: WG2.w * f, gap: WG2.gap * f, xE: at(WG2.xE), xS: at(WG2.xS), s: WG2.s, yc, hh, rk, fk };
};
const WROW = [whyFit(WG2.xE - 26, WG2.xS + 118 - WG2.xE + 26, 320, 120, 0.85, 1), whyFit(WG2.xE - 26, WG2.xS + 118 - WG2.xE + 26, 740, 120, 0.85, 1)];   // 39: one above the other
const WPAN = { L: whyFit(70, 850, 560, 180, 0.72, 0.7), T: whyFit(1000, 850, 375, 115, 0.7, 0.7), B: whyFit(1000, 850, 745, 115, 0.7, 0.7), fig: [1000, 180, 850, 720], right: [985, 60, 895, 850] };
// The beam from inside, in geometry G (with yc, hh, fk): the light a sheet from the laser's face (emit; or from the
// stage's edge) to the sensor's, each particle a dot with its shadow behind it, the stuff a haze between its faces.
// o: light, how much of the light, its shadows and the particles is there; power, the light's; sheet, how solid it is;
// regions [xa, xb] of stuff (stuff: how much there); faces [x, alpha, width]; faceH, half their height; plates, the
// laser's and sensor's faces, how much there (emit: the laser's; the light starts there, or at xL if that is given).
function drawBeamIn(ctx, G, parts, o) {
  const { yc, hh, xS } = G, fk = G.fk ?? 1, top = yc - hh, c = hexRgb(SH.color), xL = o.xL ?? lerp(-10, G.xE, o.emit), r = WHY.D * hh, ex = Math.min(0.3, 0.1 * r);
  ctx.save(); const A0 = ctx.globalAlpha;
  if (o.light > 0.003) {
    const g = ctx.createLinearGradient(0, top, 0, top + 2 * hh), al = o.sheet * o.power * o.light, e = Math.min(6, hh * 0.2) / (2 * hh);   // its edges a little soft, inside its height
    g.addColorStop(0, rgba(c, 0)); g.addColorStop(e, rgba(c, al)); g.addColorStop(1 - e, rgba(c, al)); g.addColorStop(1, rgba(c, 0));
    ctx.fillStyle = g; ctx.fillRect(xL, top, xS - xL, 2 * hh);
    ctx.fillStyle = BG;   // the shadows: no light behind a particle
    for (const p of parts) { ctx.globalAlpha = A0 * p.a * o.light; ctx.fillRect(p.x, top + p.v * 2 * hh - r - ex, xS - p.x + 1, 2 * (r + ex)); }
    ctx.globalAlpha = A0;
  }
  const fh = o.faceH ?? hh + 18 * fk;
  for (const [xa, xb] of o.regions) { ctx.fillStyle = `rgba(170,164,152,${(0.1 * o.stuff).toFixed(3)})`; ctx.fillRect(xa, yc - fh, xb - xa, 2 * fh); }
  for (const [x, fa, lw] of o.faces) { if (fa <= 0.003) continue; ctx.strokeStyle = hexA(COL.greyA, fa); ctx.lineWidth = lw * fk; ctx.beginPath(); ctx.moveTo(x, yc - fh); ctx.lineTo(x, yc + fh); ctx.stroke(); }
  const pa = clamp((r - 0.35) / 0.8, 0, 1) * o.light;   // the particles, once they are big enough to see
  if (pa > 0.003) for (const p of parts) dot(ctx, p.x, top + p.v * 2 * hh, Math.max(r, 1.1), COL.yellow, p.a * pa);
  if (o.plates > 0.003) {   // the sensor's face, and the laser's when it's in sight
    ctx.globalAlpha = A0 * o.plates; ctx.fillStyle = BODY; ctx.strokeStyle = COL.greyB; ctx.lineWidth = 2.5 * fk;
    ctx.beginPath(); ctx.roundRect(xS, top - 12 * fk, 26 * fk, 2 * hh + 24 * fk, 5 * fk); ctx.fill(); ctx.stroke();
    if (o.emit > 0.003) { ctx.globalAlpha = A0 * o.plates * o.emit; ctx.beginPath(); ctx.roundRect(G.xE - 26 * fk, top - 12 * fk, 26 * fk, 2 * hh + 24 * fk, 5 * fk); ctx.fill(); ctx.stroke(); }
  }
  ctx.restore();
}
// The sensor's readout: a box over the sensor, joined to it, with what the picture gives, in whole percents. q: how far
// inside we are (outside, it sits where the lab's readout does).
function drawWhyRead(ctx, G, q, T, a) {
  if (a <= 0.003) return;
  const fk = G.fk ?? 1, k = lerp(G.s, G.rk ?? 1, q), cx = G.xS + 13 * fk * q, y0 = G.yc - Math.max(G.hh + 12 * fk, 48 * G.s * (1 - q)), bw = 210 * k, bh = 92 * k, by = y0 - 44 * k - bh, pop = lerp(0.6, 1, a);
  ctx.save(); ctx.translate(cx, y0); ctx.scale(pop, pop); ctx.translate(-cx, -y0);
  ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = COL.greyB; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(cx, y0); ctx.lineTo(cx, by + bh); ctx.stroke();
  ctx.fillStyle = BG; ctx.beginPath(); ctx.roundRect(cx - bw / 2, by, bw, bh, 12 * k); ctx.fill(); ctx.stroke(); ctx.restore();
  drawNumber(ctx, Math.round(T * 100), cx, by + bh / 2 + 17 * k, { size: 50 * k, dec: 0, suffix: '%', align: 'center', alpha: a });
  ctx.restore();
}
// A pair of boxes from inside, in geometry G with arrangement A, and its reading.
function drawWhyPair(ctx, G, A, alpha) {
  if (alpha <= 0.003) return;
  const parts = whyParts(G, A), bw = WHY.N * G.w, regions = [0, 1].map((j) => [G.x0 + j * (bw + G.gap), G.x0 + j * (bw + G.gap) + bw]);
  ctx.save(); ctx.globalAlpha *= alpha;
  drawBeamIn(ctx, G, parts, { light: 1, power: 1, sheet: WHY.sheet, emit: 1, plates: 1, stuff: 1, regions, faces: regions.flatMap(([xa, xb]) => [[xa, 0.7, 3], [xb, 0.7, 3]]) });
  drawWhyRead(ctx, G, 1, whyLit(parts), 1); ctx.restore();
}
const WMUL = String.raw`\textcolor{${COL.red}}{\times\,0.99}`, WPOW = (n) => String.raw`0.99^{\textcolor{${COL.blue}}{${n}}}`;
const WF = { y: 105, size: 86, ly: 178, lsize: 50 };
let wfX = null, wfPlan = null;
const whyFx = () => wfX ?? (wfX = 960 - (tex(WPOW(69)).w * WF.size) / 2);   // from a fixed left edge, so the base stays put as the count changes
const whyPowAt = (t0) => 0.64 + 0.36 * Math.cos((2 * Math.PI * Math.max(0, TIME - t0)) / 4.6);        // 33: the light, brighter and dimmer
const whyNAt = (t0) => 3 + 18.5 * (1 - Math.cos((2 * Math.PI * Math.max(0, TIME - t0)) / 7.5));        // 34d: 3 slabs to 40 and back
function WHY_DEFAULTS() { return {
  won: 0, win: 0, wzoom: 0, wmark: 0, wlr: 1, wn: 1, wc: 1, wread: 0, wring: 0, wbr: 0, wpow: 1, wpowLoop: 0, wpowT0: 0, wsay: 0, wsayP: 0,
  wlab: 0, wfm: 0, wfmA: 1, wnLoop: 0, wnT0: 0, wring2: 0, wcomb: 0, wrig2: 0, wshift: 0, wb2: 1, wrows: 0, wsplit: 0, wtitles: 0, wfig: 0, wstay: 0, bOut: 0,
}; }
function drawWhy(ctx, dt, st) {
  const on = clamp(st.won, 0, 1); if (on <= 0.003) return;
  if (!reduced) { if (st.wpowLoop) st.wpow = whyPowAt(st.wpowT0); if (st.wnLoop) st.wn = whyNAt(st.wnT0); }
  const q = clamp(st.win, 0, 1), two = clamp(st.wc - 1, 0, 1), ez = clamp(st.wzoom, 0, 1), rows = clamp(st.wrows, 0, 1), split = clamp(st.wsplit, 0, 1), figA = clamp(st.wfig, 0, 1);
  // along the beam: on the way in (32b), from a slab in the middle of the lab's box to one as wide as it gets; then
  // however many slabs there are; then the lab's two boxes
  let G = whyCount(st.wn);
  if (ez < 1) { const w0 = WX1.s * WDX, w = Math.exp(lerp(Math.log(w0), Math.log(G.w), ez)); G = { x0: 960 - w / 2, w, gap: 0, xE: lerp(WX1.ox - WX1.s * (LAB.BW / 2 + LAB.laserGap), G.xE, ez), xS: lerp(WX1.ox + WX1.s * (LAB.BW / 2 + LAB.sensorGap), G.xS, ez), s: WX1.s }; }
  if (two > 0) G = mixGeo(whyCount(WHY.N), WG2, two);
  Object.assign(G, { yc: WHY.yc, hh: Math.exp(lerp(Math.log((SH.beamW / 2) * G.s), Math.log(WHY.hh), q)), rk: 1, fk: 1 });
  if (rows > 0) G = mixGeo(G, WROW[1], rows);
  if (split > 0) G = mixGeo(G, WPAN.B, split);
  const A = { n: st.wn, comb: st.wcomb, rig2: st.wrig2, shift: st.wshift, b2: st.wb2 }, parts = whyParts(G, A), T = whyLit(parts);
  ctx.save(); ctx.globalAlpha *= on;
  // from outside: the lab's row, one box or two, its own readout only before we first go in
  const aLab = 1 - smooth(clamp((q - 0.08) / 0.3, 0, 1));
  if (aLab > 0.003) drawLabRow(ctx, mixXf(WX1, WX2, two), { c: st.wc, drop: true, from: '', to: '50%', m: 1, read: clamp(st.wlr, 0, 1) }, aLab);
  if (st.wring2 > 0.003) { ctx.save(); ctx.strokeStyle = hexA(COL.white, 0.8 * clamp(st.wring2, 0, 1) * aLab); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(WX2.ox, WHY.yc, 24, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }   // 36: the light on its way into the second box
  // from inside
  const aIn = smooth(clamp(q / 0.12, 0, 1)), bw = WHY.N * G.w, boxes = two > 0.5 || rows > 0;
  const n = Math.max(st.wn, 1), boxness = boxes ? 1 : smooth(clamp((n - 55) / 14, 0, 1)), aF = smooth(clamp((q - 0.25) / 0.4, 0, 1)), mark = clamp(st.wmark, 0, 1) * (1 - ez);
  const regions = [], faces = [];
  if (boxes) for (const j of [0, 1]) { const xa = G.x0 + j * (bw + G.gap); regions.push([xa, xa + bw]); faces.push([xa, 0.7 * aF, 3], [xa + bw, 0.7 * aF, 3]); }
  else {
    const xb = G.x0 + n * G.w, fi = clamp((G.w - 4) / 40, 0.1, 0.6);
    regions.push([G.x0, xb]);
    for (let k = 0; k * G.w < xb - G.x0 - 0.5; k++) faces.push([G.x0 + k * G.w, Math.max(mark * 0.9, aF * (k === 0 ? lerp(0.6, 0.7, boxness) : fi)), k === 0 ? lerp(2, 3, boxness) : 2]);
    faces.push([xb, Math.max(mark * 0.9, aF * lerp(0.6, 0.7, boxness)), lerp(2, 3, boxness)]);
  }
  const faceH = ez < 1 ? Math.max(lerp(200 * WX1.s, WHY.hh + 18, ez), G.hh + 18) : G.hh + 18 * G.fk;   // 32b: the slice is marked the box's whole height
  // the laser's face is in sight once the slabs are nearly a box; on the way in, the light starts at the lab's laser
  // until the row has gone, then at the stage's edge
  const xL = ez < 1 ? lerp(WX1.ox - WX1.s * (LAB.BW / 2 + LAB.laserGap), -10, smooth(clamp((ez - 0.3) / 0.45, 0, 1))) : null;
  ctx.save(); ctx.globalAlpha *= 1 - figA;   // (40b: it makes way for the paper's figure)
  drawBeamIn(ctx, G, parts, { light: aIn, power: clamp(st.wpow, 0, 1), sheet: lerp(0.95, WHY.sheet, q), emit: ez < 1 ? 0 : boxness, xL: xL ?? undefined, plates: smooth(clamp((q - 0.25) / 0.3, 0, 1)), stuff: aF, regions, faces, faceH });
  if (mark > 0.003) { ctx.save(); ctx.strokeStyle = hexA(COL.greyA, 0.9 * mark); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(G.x0, G.yc - faceH); ctx.lineTo(G.x0 + G.w, G.yc - faceH); ctx.moveTo(G.x0, G.yc + faceH); ctx.lineTo(G.x0 + G.w, G.yc + faceH); ctx.stroke(); ctx.restore(); }
  // 32d: the particle and its shadow, pointed out
  const ring = clamp(st.wring, 0, 1) * aIn;
  if (ring > 0.003 && parts.length) {
    const p = parts[0], y = G.yc + (p.v * 2 - 1) * G.hh, r = WHY.D * G.hh;
    ctx.save(); ctx.strokeStyle = hexA(COL.white, 0.85 * ring); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(p.x, y, 24, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = hexA(COL.white, 0.5 * ring); ctx.lineWidth = 1.5; ctx.setLineDash([7, 9]); ctx.beginPath();
    for (const s of [-1, 1]) { ctx.moveTo(p.x + 30, y + s * (r + 5)); ctx.lineTo(G.xS - 4, y + s * (r + 5)); }
    ctx.stroke(); ctx.restore();
  }
  drawWhyRead(ctx, G, q, T, clamp(st.wread, 0, 1));
  ctx.restore();
  // Δd under the slab: a small piece of the distance d, in d's blue
  const br = clamp(st.wbr, 0, 1) * aIn;
  if (br > 0.003) { const cx = G.x0 + G.w / 2, by = G.yc + G.hh + 26; drawBrace(ctx, cx, by, G.w, 24, 6, hexRgb(LDCOL), br); drawTex(ctx, String.raw`\Delta d`, cx, by + 54, 48, { alpha: br, color: LDCOL }); }
  // 33b: what the slab says
  if (st.wsay > 0.003) drawThinking(ctx, 960, 98, 1, 84, '', String.raw`whatever comes in, I take 1\%`, 1, st.wsayP, smooth(clamp(st.wsay, 0, 1)), [G.x0 + G.w / 2, G.yc - G.hh - 22]);
  // 34–34c: × 0.99 over each slab; 34d: the three become 0.99^3, and the count follows the slabs from then on
  const la = clamp(st.wlab, 0, 1), fm = clamp(st.wfm, 0, 1), fa = clamp(st.wfmA, 0, 1) * (1 - rows);
  if (la > 0.003 && fa > 0.003) {
    const C3 = whyCount(3), at = (k) => place(tex(WMUL), { x: C3.x0 + (k + 0.5) * C3.w, y: WF.ly, size: WF.lsize });
    if (fm <= 0.001) for (let k = 0; k < 3; k++) drawSprites(ctx, place(tex(WMUL), { x: G.x0 + (k + 0.5) * G.w, y: WF.ly, size: WF.lsize }), { alpha: la * fa * smooth(clamp(st.wn - k, 0, 1)) });
    else if (fm < 0.999) drawMorph(ctx, wfPlan ?? (wfPlan = matchPlan([...at(0), ...at(1), ...at(2)], place(tex(WPOW(3)), { x: whyFx(), y: WF.y, size: WF.size, ax: 0 }))), fm, la * fa);
    else drawTex(ctx, WPOW(Math.round(st.wn)), whyFx(), WF.y, WF.size, { ax: 0, alpha: la * fa });
  }
  ctx.restore();
  // 39: the other careful placement, above: the second box's particles where the first lets light through
  const Gb = split > 0 ? mixGeo(WROW[0], WPAN.T, split) : WROW[0];
  ctx.save(); ctx.globalAlpha *= on;
  drawWhyPair(ctx, Gb, { n: 2 * WHY.N, comb: 1, rig2: 1, shift: 0, b2: 1 }, rows * (1 - figA));
  // 39b: and beside them, placed at random
  drawWhyPair(ctx, WPAN.L, { n: 2 * WHY.N, comb: 0, rig2: 0, shift: 0, b2: 1 }, split);
  if (split > 0.003) { ctx.strokeStyle = hexA(COL.greyD, split); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(960, 70); ctx.lineTo(960, 900); ctx.stroke(); }
  // 40: their names; 40b: on the right, a place for the paper's figure
  const ta = clamp(st.wtitles, 0, 1);
  if (ta > 0.003) { drawTex(ctx, String.raw`\text{exponential media}`, 495, 105, 46, { p: ta }); drawTex(ctx, String.raw`\text{non-exponential media}`, 1425, 105, 46, { p: ta }); }
  if (figA > 0.003) {
    const R = WPAN.fig;
    ctx.save(); ctx.strokeStyle = hexA(COL.greyC, figA); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.roundRect(R[0], R[1], R[2], R[3], 14); ctx.stroke(); ctx.restore();
    drawTodo(ctx, [R[0] + 28, R[1] + 28, R[2] - 56, R[3] - 56], figA, { todo: ['the figure from the paper, with permission:', 'Jarabo, Aliaga and Gutierrez (2018),', 'A Radiative Transfer Framework', 'for Spatially-Correlated Materials'] }, 1.2);
  }
  ctx.restore();
  greyOut(ctx, WPAN.right, clamp(st.wstay, 0, 1) * on, 0.35 * clamp(st.wstay, 0, 1) * on);   // 41: we stay on the left
}

// ---- the beats ----
// 32: back from the aside: the bases go, and the box is on the stage as at beat 22, reading 50%
function whyBox() { ptw('lfig', 0, 0.5); ptw('bOut', 1, 0.5); ptw('lside', 0, 1.2, { delay: 0.2 }); return ptw('won', 1, 0.9, { delay: 0.4 }); }
// 32b: one thin slice of it is marked, and we go into the beam there: the row goes, the slice opens into a slab, the
// beam into a sheet, the slab's one particle and its shadow come into sight; then Δd under it
function whySlab() {
  ptw('wmark', 1, 0.5); ptw('wzoom', 1, 2.2, { delay: 1.0 }); ptw('wlr', 0, 0.3, { delay: 1.6 }); ptw('wbr', 1, 0.6, { delay: 2.8 });
  return ptw('win', 1, 2.2, { delay: 1.0 });
}
// 32c: the sensor reads 99%. 32d: the particle and its shadow are pointed out
function whyRead() { return ptw('wread', 1, 0.45); }
function whyShadow() { return ptw('wring', 1, 0.5); }
// 33: the light goes brighter and dimmer, over and over, until the next press; the reading stays (dimmer once, if motion is reduced)
function whyBright() { ptw('wring', 0, 0.4); PS.wpowLoop = 1; PS.wpowT0 = labLoopStart('wpT0', TIME + 0.3); return reduced ? ptw('wpow', 0.45, 1.2) : Promise.resolve(); }
// 33b: what the slab says
function whySays() { PS.wsayP = 0; ptw('wsay', 1, 0.5); return ptw('wsayP', 1, 1.1, { delay: 0.3, ease: linear }); }
// 34: the light settles, the slab has said its piece: × 0.99 over it. 34b, 34c: another slab, and another
function whyTimes() {
  if (PS.wpowLoop && !reduced) PS.wpow = whyPowAt(PS.wpowT0);
  PS.wpowLoop = 0; ptw('wpow', 1, 0.6); ptw('wsay', 0, 0.4); return ptw('wlab', 1, 0.6, { delay: 0.3 });
}
function whyAdd(n) { return ptw('wn', n, 1.2); }
// 34d: the three × 0.99 become 0.99^3; then slabs come and go, 3 to 40 and back, the count with them, until the next
// press (once up to 12, if motion is reduced)
function whyPower() {
  ptw('wbr', 0, 0.4); PS.wnLoop = 1; PS.wnT0 = labLoopStart('wnT0', TIME + 1.6);
  if (reduced) ptw('wn', 12, 1.5, { delay: 1.4 });
  return ptw('wfm', 1, 1.3);
}
// 35: 69 slabs, from however many there are: 50%. 35b: out of the beam again: it is our box. 35c: a second box, 69 more
function whyBoxful() { if (PS.wnLoop && !reduced) PS.wn = whyNAt(PS.wnT0); PS.wnLoop = 0; return ptw('wn', WHY.N, 2.4); }
function whyOut() { return ptw('win', 0, 2.4); }
function whyTwo() { ptw('wn', 2 * WHY.N, 0.9, { delay: 0.75 }); return ptw('wc', 2, 1.6); }
// 36: the light between the boxes is marked. 36b: into the beam again: it has holes in it
function whyCatch() { return ptw('wring2', 1, 0.5); }
function whyHoles() { ptw('wring2', 0, 0.5); ptw('wfmA', 0, 0.5); return ptw('win', 1, 2.2); }
// 37: the first box's particles move to their careful places, and the second box's go: half the light. 37b: the second
// box's come back where the first lets light through: nothing is left
function whyCareful() { ptw('wb2', 0, 0.6); return ptw('wcomb', 1, 2.2); }
function whyGaps() { PS.wrig2 = 1; PS.wshift = 0; return ptw('wb2', 1, 1.8, { ease: linear }); }
// 38: an aside: or hide them; in the card, the second box's particles move up behind the first's: 50% again
function whyHide() {
  PS.lthink = 'or hide them?'; PS.lthinkP = 0; ptw('lside', 1, 1.4); ptw('lfig', 1, 1.0, { delay: 0.8 }); ptw('lthinkP', 1, 1.0, { delay: 1.7, ease: linear });
  return ptw('wshift', 1, 2.0, { delay: 3.0 });
}
// 39: back from the aside, both careful placements, one above the other. 39b: they move over to the right, and placed
// at random comes in on the left
function whyBoth() { ptw('lfig', 0, 0.5); ptw('lside', 0, 1.2, { delay: 0.2 }); return ptw('wrows', 1, 1.4, { delay: 1.0 }); }
function whySplit() { return ptw('wsplit', 1, 1.6); }
// 40: the names. 40b: a place for the paper's figure, on the right. 41: the right greys out: we stay on the left
function whyNames() { return ptw('wtitles', 1, 1.0, { ease: linear }); }
function whyFigure() { return ptw('wfig', 1, 0.9); }
function whyStay() { return ptw('wstay', 1, 0.9); }
