// ---------- L. millions of particles ----------
// "Shadows in a slab" is a window onto a beam far taller than the screen. Zoom out across the beam: the depth stays
// where it is, so the plot keeps its axis and the slab its optical depth, while more rays and more discs come into
// view. The discs shrink below a pixel and what is left of them is their shadows; the fraction of rays still going,
// counted from the rays in view, closes in on e^{−nσz}; and with a million discs in the beam, the medium is drawn as
// what it now looks like, a liquid in a tank. Zooming back in, the liquid comes apart into discs and lands on
// "Shadows in a slab". Only the middle of the beam is simulated, disc by disc and ray by ray, out to about a
// thousandfold zoom; past that, the curve and the beam are the limit they have closed in on.
const MBW = 4;   // bin width (px) along the slab, for the beam's picture and for the curve once many rays are in view
const MW = { key: '' };
function millionWorld() {
  const r = SA.r, N0 = Math.round(SA.n), k0 = SA.rays === 'sheet' ? Math.round(SL.bot - SL.top) : +SA.rays;
  const key = [N0, r, SA.seed, k0].join('|');
  if (MW.key === key) return MW;
  const { a, b, y0, y1 } = slabBox(SA), lin = N0 / (y1 - y0), D = (SL.bot - SL.top) / k0, yc = (SL.top + SL.bot) / 2;
  // how far out the simulation goes: a thousandfold zoom, or less if that would take over 100,000 discs or 300,000 rays
  const sSim = Math.max(30, Math.min(1000, 1e5 / (lin * 490), (3e5 * D) / 490));
  const J0 = Math.ceil((245 * sSim + r) / D), K = k0 + 2 * J0, Ytop = SL.top - J0 * D, Ybot = Ytop + K * D;
  const cx = new Float32Array(K).fill(Infinity), off = new Float32Array(K);
  // a disc stops every ray within r of its centre that no disc has stopped earlier: cx − off is where it meets it
  const hit = (px, py) => {
    const ja = Math.max(0, Math.ceil((py - r - Ytop) / D - 0.5)), jb = Math.min(K - 1, Math.floor((py + r - Ytop) / D - 0.5));
    for (let j = ja; j <= jb; j++) {
      const dy = Ytop + (j + 0.5) * D - py;
      if (dy > -r && dy < r) { const o = Math.sqrt(r * r - dy * dy); if (px - o < cx[j] - off[j]) { cx[j] = px; off[j] = o; } }
    }
  };
  // the discs near the middle are kept, to be drawn
  const NEAR = 260 * (r / 0.3) + 2 * r, near = [];
  const keep = (px, py, i) => { const d = Math.abs(py - yc); if (d <= NEAR) near.push([d, px, py, i]); };
  // the middle is exactly the shadows scene's discs (laid out at random); around it, the same density
  layoutDiscs({ ...SA, dist: 'random' }).forEach(([px, py], i) => { hit(px, py); keep(px, py, i); });
  const lo = Ytop - r, hA = y0 - lo, hB = Ybot + r - y1, M = Math.round(lin * (hA + hB)), rnd = rng32(SA.seed * 104729 + 7);
  for (let i = 0; i < M; i++) { const t = rnd() * (hA + hB), py = t < hA ? lo + t : y1 + (t - hA), px = lerp(a, b, rnd()); hit(px, py); keep(px, py, -1); }
  near.sort((p, q) => p[0] - q[0]);
  // where each ray stops, binned along the slab (the last bin: it never does)
  const NB = Math.ceil((SL.x1 - SL.x0) / MBW), bin = new Uint16Array(K);
  for (let j = 0; j < K; j++) bin[j] = cx[j] < Infinity ? clamp(Math.floor((cx[j] - off[j] - SL.x0) / MBW), 0, NB - 1) : NB;
  // the beam as drawn holds a million discs, so that the zoom ends on a laser beam through a tank
  return Object.assign(MW, { key, r, lin, D, yc, K, Ytop, Ybot, uSim: Math.log10(sSim), Hb: 1e6 / lin, cx, off, bin, NB,
    nD: Float64Array.from(near, (q) => q[0]), nX: Float64Array.from(near, (q) => q[1]), nY: Float64Array.from(near, (q) => q[2]), nI: Int32Array.from(near, (q) => q[3]) });
}
// How many discs have their centres within d of the middle: those kept, to draw; and in all, as the beam holds them.
function nearCount(Wd, d) {
  let lo = 0, hi = Wd.nD.length;
  while (lo < hi) { const m = (lo + hi) >> 1; if (Wd.nD[m] <= d) lo = m + 1; else hi = m; }
  return lo;
}
const millionCount = (Wd, d) => Math.min(1e6, Math.round(Wd.lin * 2 * d));
// The zoom runs on one number, p, from the slab (0) to the tank (1). This is how p maps to the zoom, in decades:
// slow while discs and rays change, quicker while only the count does, slower again while the beam narrows into the
// tank, and slowest as the tank itself comes into view.
const MZ = { key: '' };
function millionProfile(Wd) {
  const Hb = Wd.Hb, uEdge = Math.log10(Hb / 490), uEnd = Math.log10(Hb / Math.max(1, SH.beamW)), key = `${Wd.key}|${uEnd.toFixed(4)}`;
  if (MZ.key === key) return MZ;
  const w = (u) => lerp(lerp(lerp(2.8, 1, smooth(clamp((u - 1.5) / 0.5, 0, 1))), 1.7, smooth(clamp((u - uEdge + 0.1) / 0.4, 0, 1))), 3.4, smooth(clamp((u - uEnd + 0.5) / 0.3, 0, 1)));
  const n = 512, T = new Float64Array(n + 1);
  for (let i = 1; i <= n; i++) T[i] = T[i - 1] + w(((i - 0.5) / n) * uEnd) * (uEnd / n);
  return Object.assign(MZ, { key, n, T, uEnd });
}
function uOfP(Z, p) {
  const t = clamp(p, 0, 1) * Z.T[Z.n]; let lo = 0, hi = Z.n;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (Z.T[m] <= t) lo = m; else hi = m; }
  return ((lo + clamp((t - Z.T[lo]) / Math.max(1e-12, Z.T[hi] - Z.T[lo]), 0, 1)) / Z.n) * Z.uEnd;
}
// The view at p: the zoom across the beam (s), and the window the beam shows through, which opens a little at first.
function millionView(p) {
  const Wd = millionWorld(), Z = millionProfile(Wd), u = uOfP(Z, p), s = Math.pow(10, u), e = smooth(clamp(u / 0.4, 0, 1));
  const mTop = lerp(SL.top, 70, e), mBot = lerp(SL.bot, 560, e);
  return { Wd, Z, u, s, mTop, mBot, hw: (Wd.yc - mTop) * s };
}
const fmtInt = (v) => String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const SM = defScene({
  id: 'million', tab: 'Millions of particles', shared: true,
  defaults: () => ({ p: 0, zoomT: 10, land: 1, pred: 1, labels: 1, count: 1, shown: null }),
  actions: [
    { id: 'out', label: 'Zoom out', primary: true, run: (st) => { if (st.p > 0.999) st.p = 0; return tween(st, 'p', 1, Math.max(1, st.zoomT * (1 - st.p))); } },
    { id: 'in', label: 'Zoom in', run: async (st, alive) => {
      if (st.p < 0.001) st.p = 1;
      await tween(st, 'p', 0, Math.max(1, st.zoomT * st.p)); if (!alive() || st.p > 0.001) return;
      if (st.land && cur === scenes.million) landInShadows();
    } },
    RESET,
  ],
  params: [
    { type: 'range', key: 'p', label: 'Particles in view', min: 0, max: 1, step: 0.001, fmt: (v) => fmtInt(millionCount(millionWorld(), millionView(v).hw + SA.r)), set: (v) => { untween(SM, 'p'); SM.p = v; } },
    { type: 'range', key: 'zoomT', label: 'Zoom time (s)', min: 2, max: 30, step: 0.5, fmt: (v) => v.toFixed(1) },
    { type: 'check', key: 'land', label: 'Zooming all the way in lands in Shadows in a slab', set: (v) => { SM.land = v ? 1 : 0; } },
    { type: 'check', key: 'pred', label: 'Prediction e^(−nσz)', set: (v) => tween(SM, 'pred', v ? 1 : 0, 0.5) },
    { type: 'check', key: 'labels', label: 'Curve labels', set: (v) => tween(SM, 'labels', v ? 1 : 0, 0.4) },
    { type: 'check', key: 'count', label: 'Particle count', set: (v) => tween(SM, 'count', v ? 1 : 0, 0.4) },
    { type: 'note', html: 'The discs, the rays and the sensor are those of Shadows in a slab.' },
  ],
  draw: drawMillion, pointer: pointerMillion,
});
// Hand over to the shadows scene, which shows exactly what this one does when zoomed all the way in.
function landInShadows() {
  if (SA.dist !== 'random') { SA.dist = 'random'; placeDiscs(SA); }
  untween(SA, 'front'); SA.front = 1; SA.shown = SM.shown;
  setScene('shadows');
}
// The rays in view as a picture, one row per pixel of height: each row is as bright, along x, as the share of its
// rays still going there. With a ray to a row it is the rays themselves; with hundreds to a row it is a smooth beam.
const MIMG = { cv: document.createElement('canvas'), key: '', img: null, cnt: null };
MIMG.ctx = MIMG.cv.getContext('2d');
function millionImage(Wd, s, mTop, mBot, JA, JB, vh, base, color, stamp) {
  const rows = Math.max(1, Math.ceil(mBot - mTop - 1e-6)), NB = Wd.NB, cols = NB + 2, key = [Wd.key, s, mTop, rows, base, color, stamp].join('|');
  if (MIMG.key === key) return rows;
  MIMG.key = key;
  if (MIMG.cv.width !== cols || MIMG.cv.height !== rows) { MIMG.cv.width = cols; MIMG.cv.height = rows; MIMG.img = MIMG.ctx.createImageData(cols, rows); }
  const px = MIMG.img.data, [cr, cg, cb] = hexRgb(color), A255 = 255 * base, D = Wd.D, { cx, off } = Wd;
  const cnt = MIMG.cnt && MIMG.cnt.length === NB + 1 ? MIMG.cnt : (MIMG.cnt = new Uint32Array(NB + 1));
  px.fill(0);
  for (let row = 0; row < rows; row++) {
    const ya = Wd.yc + (mTop + row - Wd.yc) * s;
    const ja = Math.max(JA, Math.ceil((ya - Wd.Ytop) / D - 0.5)), jb = Math.min(JB, Math.ceil((ya + s - Wd.Ytop) / D - 0.5) - 1);
    if (jb < ja) continue;
    cnt.fill(0);
    for (let j = ja; j <= jb; j++) { const h = vh ? vh[j - JA] : cx[j] - off[j] / s; cnt[h < SL.x1 ? clamp(Math.floor((h - SL.x0) / MBW), 0, NB - 1) : NB]++; }
    const m = jb - ja + 1; let o = row * cols * 4, alive = m;
    px[o] = cr; px[o + 1] = cg; px[o + 2] = cb; px[o + 3] = A255;   // before the slab: every ray
    for (let q = 0; q < NB; q++) { o += 4; px[o] = cr; px[o + 1] = cg; px[o + 2] = cb; px[o + 3] = (A255 * (alive - cnt[q] / 2)) / m; alive -= cnt[q]; }
    o += 4; px[o] = cr; px[o + 1] = cg; px[o + 2] = cb; px[o + 3] = (A255 * alive) / m;   // past it: those that got through
  }
  MIMG.ctx.putImageData(MIMG.img, 0, 0);
  return rows;
}
// The tank's liquid and glass, which until the end of the zoom reach far past the picture: there they fade out
// toward its top and bottom, as the slab's dashed faces end.
const MFADE = [40, 50, 60, 70, 80, 550, 560, 570, 580, 590], mFade = (y) => smooth(clamp((y - 40) / 40, 0, 1)) * smooth(clamp((590 - y) / 40, 0, 1));
function millionLiquid(ctx, top, bot, L) {
  const lv = bot - FILL * (bot - top), ya = Math.max(lv, 40), yb = Math.min(bot, 590); if (yb <= ya) return;
  const c1 = hexRgb(L.c), c2 = hexRgb(L.c2), col = (y) => { const f = clamp((y - lv) / (bot - lv), 0, 1); return rgba(mixRgb(c1, c2, f), lerp(L.a, L.a2, f) * mFade(y)); };
  const cr = bot < 590 ? 16 : 0;
  ctx.save(); ctx.beginPath(); ctx.roundRect(SL.x0, ya - 2, SL.x1 - SL.x0, yb - ya + 2, [0, 0, cr, cr]); ctx.clip();
  const gr = ctx.createLinearGradient(0, ya, 0, yb);
  for (const y of [ya, ...MFADE.filter((v) => v > ya && v < yb), yb]) gr.addColorStop((y - ya) / (yb - ya), col(y));
  ctx.fillStyle = gr; ctx.fillRect(SL.x0, ya, SL.x1 - SL.x0, yb - ya);
  if (lv > 40 && lv < 590) { ctx.strokeStyle = hexA(L.surf, 0.85 * mFade(lv)); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(SL.x0, lv); ctx.lineTo(SL.x1, lv); ctx.stroke(); }
  ctx.restore();
}
function millionGlass(ctx, top, bot) {
  const r = 16, t = Math.max(top, 30), x0 = SL.x0, x1 = SL.x1, gr = ctx.createLinearGradient(0, 40, 0, 590);
  for (const y of MFADE) gr.addColorStop((y - 40) / 550, hexA(COL.greyA, mFade(y)));
  ctx.save(); ctx.strokeStyle = gr; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.beginPath();
  if (bot > 600) { ctx.moveTo(x0, t); ctx.lineTo(x0, 600); ctx.moveTo(x1, t); ctx.lineTo(x1, 600); }
  else { ctx.moveTo(x0, t); ctx.lineTo(x0, bot - r); ctx.quadraticCurveTo(x0, bot, x0 + r, bot); ctx.lineTo(x1 - r, bot); ctx.quadraticCurveTo(x1, bot, x1, bot - r); ctx.lineTo(x1, t); }
  ctx.stroke(); ctx.restore();
}
const MV = { vh: new Float64Array(6001), cnt: null, edge: null, plate: null };
function drawMillion(ctx, dt, st) {
  const V = millionView(st.p), { Wd, Z, u, s, mTop, mBot, hw } = V, r = Wd.r, D = Wd.D, yc = Wd.yc, NB = Wd.NB, { cx, off } = Wd;
  const color = SH.color, power = SH.I0, sx = sensorX6(SA), Y = (y) => yc + (y - yc) / s, Tp = (x) => predictedT(SA, x);
  // past the simulated middle of the beam (about a thousandfold zoom), the picture and the curve are their limit
  const f = smooth(clamp((u - (Wd.uSim - 0.3)) / 0.3, 0, 1)), sim = f < 0.999;
  // the rays in view, and the part of the beam on screen (its own edges come in near the end)
  const JA = sim ? Math.max(0, Math.ceil((yc - hw - Wd.Ytop) / D - 0.5)) : 0, JB = sim ? Math.min(Wd.K - 1, Math.ceil((yc + hw - Wd.Ytop) / D - 0.5) - 1) : -1, kv = Math.max(0, JB - JA + 1);
  const vb0 = Math.max(mTop, yc - Wd.Hb / 2 / s), vb1 = Math.min(mBot, yc + Wd.Hb / 2 / s);
  // how far along each change is: rays merge into a sheet, discs go below a pixel and the liquid comes in, the sheet
  // becomes the beam, and the sheet laser and the plate become the laser and the sensor of the tank
  const aR = D > 1.1 ? 1 - smooth(clamp((u - Math.log10(D / 2.4)) / Math.log10(2.4 / 1.1), 0, 1)) : 0;
  const uD0 = Math.log10(r / 1.4), uD1 = Math.log10(r / 0.35), aD = 1 - smooth(clamp((u - uD0) / (uD1 - uD0), 0, 1));
  const aT = smooth(clamp((u - uD0) / (uD1 + 0.3 - uD0), 0, 1)), aB = smooth(clamp((u - (Z.uEnd - 0.45)) / 0.4, 0, 1));
  const m2 = smooth(clamp((u - (Z.uEnd - 0.7)) / 0.6, 0, 1)), aI = sim ? (1 - aR) * (1 - f) * (1 - aB) : 0, aF = f * (1 - aB);
  const base = lerp(D > 1.1 ? 0.5 : 0.75, 0.95, m2);   // a merged sheet as bright, on average, as the rays it replaces
  const amp = reduced ? 0 : SA.jig * SA.jigAmp * (1 - smooth(clamp(u / 0.3, 0, 1)));
  // the discs in view; the shadows scene's own discs jiggle as they do there, until the zoom stills them
  const nv = aD > 0.003 || amp > 0.01 ? nearCount(Wd, hw + r) : 0, R = r / s, discs = [];
  for (let q = 0; q < nv; q++) {
    let x = Wd.nX[q], y = Wd.nY[q]; const i = Wd.nI[q];
    if (i >= 0 && amp > 0.01) { const [px, py, fx, fy] = jigOf(i); x += amp * Math.sin(TIME * fx * 6.283 + px); y += amp * Math.sin(TIME * fy * 6.283 + py); }
    discs.push([x, Y(y), i >= 0 ? 1 : clamp((hw + r - Wd.nD[q]) / (6 * s), 0, 1)]);
  }
  // while the discs jiggle, the rays in view are stopped by them where they are now, as in the shadows scene; after
  // that, where the simulation has them stop: on screen at the disc as drawn, on the plot where a ray meets a disc
  let vh = null;
  if (amp > 0.01 && kv <= 6000) { const ys = []; for (let j = JA; j <= JB; j++) ys.push(Y(Wd.Ytop + (j + 0.5) * D)); const h = firstHits(ys, discs, R); vh = MV.vh; for (let q = 0; q < kv; q++) vh[q] = h[q]; }
  const hitS = (q) => (vh ? vh[q] : cx[JA + q] - off[JA + q] / s), hitW = (q) => (vh ? vh[q] : cx[JA + q] - off[JA + q]);
  // how many rays in view have stopped by each bin along the slab, and the share still going at each bin's edge,
  // drawn toward the limit as the simulation gives way to it
  const cnt = MV.cnt && MV.cnt.length === NB + 1 ? MV.cnt : (MV.cnt = new Uint32Array(NB + 1)), edge = MV.edge && MV.edge.length === NB + 1 ? MV.edge : (MV.edge = new Float64Array(NB + 1));
  cnt.fill(0);
  if (vh) for (let q = 0; q < kv; q++) { const h = vh[q]; cnt[h < SL.x1 ? clamp(Math.floor((h - SL.x0) / MBW), 0, NB - 1) : NB]++; }
  else for (let j = JA; j <= JB; j++) cnt[Wd.bin[j]]++;
  { let alive = kv; edge[0] = 1; for (let q = 0; q < NB; q++) { alive -= cnt[q]; edge[q + 1] = lerp(kv ? alive / kv : 1, Tp(SL.x0 + (q + 1) * MBW), f); } }
  const Tm = (x) => { if (x <= SL.x0) return 1; const g = (x - SL.x0) / MBW; if (g >= NB) return edge[NB]; const i = Math.floor(g); return lerp(edge[i], edge[i + 1], g - i); };
  let reached = Tm(sx);
  if (kv && kv <= 6000) { let c = 0; for (let q = 0; q < kv; q++) if (hitW(q) > sx) c++; reached = lerp(c / kv, Tp(sx), f); }
  st.shown = st.shown == null || reduced ? reached : lerp(st.shown, reached, 1 - Math.exp(-dt * 6));
  // the tank's rim and floor on screen: far past the picture until the very end
  const tank = SH.container !== 'cloud', sE = Math.pow(10, Z.uEnd), tTop = yc + ((150 - yc) * sE) / s, tBot = yc + ((480 - yc) * sE) / s;
  const rows = aI > 0.003 ? millionImage(Wd, s, mTop, mBot, JA, JB, vh, base, color, vh ? TIME : 0) : 0;
  const yOf = (q) => Y(Wd.Ytop + (JA + q + 0.5) * D);
  // the limit: every row of the beam alike, as bright along x as e^{−nσz} says
  const limit = () => {
    const L = W + 10 - SL.ex, g = ctx.createLinearGradient(SL.ex, 0, W + 10, 0);
    g.addColorStop(0, hexA(color, base)); g.addColorStop((SL.x0 - SL.ex) / L, hexA(color, base));
    for (let i = 1; i <= 32; i++) { const x = SL.x0 + (i / 32) * (SL.x1 - SL.x0); g.addColorStop((x - SL.ex) / L, hexA(color, base * Tp(x))); }
    g.addColorStop(1, hexA(color, base * Tp(SL.x1)));
    ctx.fillStyle = g; ctx.fillRect(SL.ex, vb0, L, vb1 - vb0);
  };
  const layer = () => {
    if (aT > 0.003) {
      ctx.save(); ctx.globalAlpha *= aT;
      if (tank) millionLiquid(ctx, tTop, tBot, lookOf(SH));
      else { ctx.fillStyle = hexA(LOOKS.fog.c, 0.2); ctx.fillRect(SL.x0, mTop, SL.x1 - SL.x0, mBot - mTop); }
      ctx.restore();
    }
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    if (aR > 0.003 && kv) {
      const lw = clamp((0.55 * D) / s, 0.3, 1.8), rays = () => { ctx.beginPath(); for (let q = 0; q < kv; q++) { const xe = Math.min(hitS(q), W + 10); if (xe > SL.ex) { const y = yOf(q); ctx.moveTo(SL.ex, y); ctx.lineTo(xe, y); } } ctx.stroke(); };
      if (SH.beamLook === 'glow') { ctx.strokeStyle = hexA(color, 0.14 * power * aR); ctx.lineWidth = lw * 3.33; rays(); }
      ctx.strokeStyle = hexA(color, 0.95 * power * aR); ctx.lineWidth = lw; rays();
      if (SA.marks > 0.003) for (let q = 0; q < kv; q++) { const h = hitS(q); if (h < W) dot(ctx, h, yOf(q), 3.2 * clamp(1 / s, 0.35, 1), '#FFFFFF', 0.85 * SA.marks * aR); }
    }
    if (rows) {
      const c = MIMG.cv, ga = ctx.globalAlpha; ctx.globalAlpha = ga * aI * power; ctx.imageSmoothingEnabled = true;
      ctx.drawImage(c, 0, 0, 1, rows, SL.ex, mTop, SL.x0 - SL.ex, rows);
      ctx.drawImage(c, 1, 0, NB, rows, SL.x0, mTop, SL.x1 - SL.x0, rows);
      ctx.drawImage(c, NB + 1, 0, 1, rows, SL.x1, mTop, W + 10 - SL.x1, rows);
      ctx.globalAlpha = ga;
    }
    if (aF > 0.003) { const ga = ctx.globalAlpha; ctx.globalAlpha = ga * aF * power; limit(); ctx.globalAlpha = ga; }
    ctx.restore();
    if (aB > 0.003) drawBeam(ctx, SL.ex, W + 10, yc, color, power * aB, Tm, [SL.x0, SL.x1], Math.max(SH.beamW, vb1 - vb0));
    if (aD > 0.003 && discs.length) {
      ctx.save(); ctx.fillStyle = PART; ctx.strokeStyle = COL.greyB; ctx.lineWidth = Math.min(2.5, R * 0.3); ctx.globalAlpha *= aD;
      const rr = Math.max(0.5, R), ga = ctx.globalAlpha; ctx.beginPath();
      for (const [x, y, a] of discs) if (a >= 1) { ctx.moveTo(x + rr, y); ctx.arc(x, y, rr, 0, Math.PI * 2); }
      ctx.fill(); ctx.stroke();
      for (const [x, y, a] of discs) if (a > 0.003 && a < 1) { ctx.globalAlpha = ga * a; ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
      ctx.restore();
    }
  };
  // as in the shadows scene: everything right of the sensor is drawn too, faded
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, sx, H); ctx.clip(); layer(); ctx.restore();
  ctx.save(); ctx.beginPath(); ctx.rect(sx, 0, W - sx, H); ctx.clip(); ctx.globalAlpha = 0.22; layer(); ctx.restore();
  // the slab's dashed faces become the tank's glass walls
  const gA = tank ? aT : 0;
  for (const x of [SL.x0, SL.x1]) dashed(ctx, x, SL.top - 70, x, SL.bot + 70, COL.greyC, 1 - gA, 2);
  if (gA > 0.003) { ctx.save(); ctx.globalAlpha = gA; millionGlass(ctx, tTop, tBot); ctx.restore(); }
  // the sheet laser and the sensor plate span the beam on screen, then become the tank scene's laser and sensor
  const body = lerpRect([SL.ex - 214, vb0 - 30, 192, vb1 - vb0 + 60], [SL.ex - 232, yc - 42, 212, 84], m2);
  const noz = lerpRect([SL.ex - 22, vb0 - 10, 22, vb1 - vb0 + 20], [SL.ex - 22, yc - 19, 22, 38], m2);
  const plate = lerpRect([sx, vb0 - 30, 26, vb1 - vb0 + 60], [sx - 2, yc - 48, 30, 96], m2); MV.plate = plate;
  ctx.save(); ctx.lineWidth = 3; ctx.strokeStyle = COL.greyB; ctx.fillStyle = BODY; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.roundRect(body[0], body[1], body[2], body[3], 12); ctx.fill(); ctx.stroke();
  ctx.fillStyle = NOZZLE; ctx.beginPath(); ctx.roundRect(noz[0], noz[1], noz[2], noz[3], 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = hexA(color, 1); ctx.beginPath(); ctx.arc(lerp(SL.ex - 64, SL.ex - 68, m2), lerp(vb0 - 2, yc - 20, m2), 6, 0, Math.PI * 2); ctx.fill();
  if (m2 > 0.003) { const hx = sx + 13, hb = plate[1] + plate[3]; ctx.globalAlpha = m2; ctx.beginPath(); ctx.moveTo(hx, hb); ctx.lineTo(hx, hb + 202); ctx.moveTo(hx - 56, hb + 202); ctx.lineTo(hx + 56, hb + 202); ctx.stroke(); ctx.globalAlpha = 1; }
  ctx.fillStyle = BODY; ctx.beginPath(); ctx.roundRect(plate[0], plate[1], plate[2], plate[3], 6); ctx.fill(); ctx.stroke();
  // where rays arrive on it: ray by ray, then as the picture's column at the sensor, then as the limit, then as the tank sensor's light
  ctx.globalCompositeOperation = 'lighter';
  if (aR > 0.003 && kv) { ctx.fillStyle = hexA(color, 0.95 * power * aR); for (let q = 0; q < kv; q++) if (hitS(q) > sx) ctx.fillRect(sx - 3, yOf(q) - 1.4, 5, 2.8); }
  if (rows) { const col = sx >= SL.x1 ? NB + 1 : sx < SL.x0 ? 0 : 1 + Math.floor((sx - SL.x0) / MBW); ctx.globalAlpha = aI * power; ctx.drawImage(MIMG.cv, col, 0, 1, rows, sx - 3, mTop, 5, rows); ctx.globalAlpha = 1; }
  if (aF > 0.003) { ctx.fillStyle = hexA(color, base * Tp(sx) * power * aF); ctx.fillRect(sx - 3, vb0, 5, vb1 - vb0); }
  ctx.globalCompositeOperation = 'source-over';
  if (m2 > 0.003) { ctx.fillStyle = hexA(color, (0.16 + 0.84 * clamp(reached * power, 0, 1)) * m2); ctx.fillRect(sx - 5, yc - 28, 5, 56); }
  ctx.restore();
  if (st.shown != null) drawShadowsReadout(ctx, sx, st.shown, 1);
  drawMillionPlot(ctx, st, { hitW, kv, edge, NB, f, sx, reached, pb: plate[1] + plate[3] });
  // how many discs are in view
  const aC = st.count * smooth(clamp(u / 0.12, 0, 1));
  if (aC > 0.003) {
    ctx.save(); ctx.textAlign = 'center'; ctx.font = cm(56); ctx.fillStyle = hexA(COL.white, aC); ctx.fillText(fmtInt(millionCount(Wd, hw + r)), 1745, 735);
    ctx.font = cm(36); ctx.fillStyle = hexA(COL.greyB, aC); ctx.fillText('particles', 1745, 785); ctx.restore();
  }
}
// The shadows scene's plot, with the yellow curve counted from the rays in view: step by step while they are few,
// bin by bin once there are thousands, and onto the limit past the simulated middle of the beam.
function drawMillionPlot(ctx, st, M) {
  const R = SA.r, { a, b, y0, y1 } = slabBox(SA), ns = (Math.round(SA.n) / ((b - a) * (y1 - y0))) * 2 * R, tauMax = ns * (SL.x1 - SL.x0);
  const step = tauMax > 6 ? 2 : tauMax > 2.5 ? 1 : 0.5;
  const A = makeAxes({ L: SL.x0, R: SL.x1, T: 640, B: 975, xr: [0, tauMax, step], yr: [0, 1, 0.5], ext: 46, xl: String.raw`n\sigma z`, yl: 'T', labSize: 52, numSize: 30 });
  drawAxes(ctx, A, { c: 1, nums: 1, lab: 1 });
  if (st.pred > 0.003) drawCurve(ctx, A, (t) => predictedT(SA, SL.x0 + t / ns), { from: 0, to: tauMax, color: COL.blue, alpha: st.pred, width: 4 });
  const k = M.kv, path = new Path2D();
  path.moveTo(SL.x0, A.Y(1));
  if (k && k <= 4000 && M.f <= 0) {
    const sorted = []; for (let q = 0; q < k; q++) { const h = M.hitW(q); if (h <= SL.x1) sorted.push(h); }
    sorted.sort((p, q) => p - q);
    let alive = k;
    for (const h of sorted) { const hx = Math.max(SL.x0, h); path.lineTo(hx, A.Y(alive / k)); alive--; path.lineTo(hx, A.Y(alive / k)); }
    path.lineTo(SL.x1, A.Y(alive / k));
  } else for (let q = 1; q <= M.NB; q++) path.lineTo(Math.min(SL.x1, SL.x0 + q * MBW), A.Y(M.edge[q]));
  ctx.save(); ctx.strokeStyle = COL.yellow; ctx.lineWidth = 4; ctx.lineJoin = 'round';
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, M.sx, H); ctx.clip(); ctx.stroke(path); ctx.restore();
  ctx.save(); ctx.beginPath(); ctx.rect(M.sx, 0, W - M.sx, H); ctx.clip(); ctx.globalAlpha *= 0.25; ctx.stroke(path); ctx.restore();
  ctx.restore();
  if (M.sx >= SL.x0 && M.sx <= SL.x1) { dotted(ctx, M.sx, M.pb + 16, M.sx, A.Y(M.reached) - 16, COL.white, 0.6); dot(ctx, M.sx, A.Y(M.reached), 9, COL.yellow); }
  if (st.labels > 0.003) {
    drawTex(ctx, String.raw`\text{rays left}`, SL.x1, A.Y(1) + 4, 42, { ax: 1, color: COL.yellow, alpha: st.labels });
    if (st.pred > 0.003) drawTex(ctx, String.raw`e^{-n\sigma z}`, SL.x1, A.Y(1) + 62, 46, { ax: 1, color: COL.blue, alpha: st.labels * st.pred });
  }
}
function pointerMillion(type, x, y) {
  const sc = scenes.million, pl = MV.plate || [sensorX6(SA), SL.top - 30, 26, SL.bot - SL.top + 60];
  const over = x > pl[0] - 26 && x < pl[0] + pl[2] + 26 && y > pl[1] - 20 && y < pl[1] + pl[3] + 20;
  if (type === 'down') { sc.drag = over; return over; }
  if (type === 'up') { sc.drag = false; return false; }
  if (sc.drag) { SA.sensorX = clamp(x - 13, SL.x0 - 90, 1860); return true; }
  return over;
}
