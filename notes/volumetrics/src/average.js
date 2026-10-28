// ---------- P. average, then exponentiate? ----------
// Rays through a clumpy medium each see their own optical depth τ, and the sensor reads the average of e^{−τ}.
// Smear the clumps into the same amount of medium spread evenly, as a coarser level of detail would, and every ray
// sees the average τ: the sensor reads e^{−τ̄}, which is less. On the curve e^{−τ} the average of points lies above
// the curve (Jensen's inequality): a clumpy medium lets more light through than its average density says.
const SAV = { x0: 420, x1: 1400, top: 110, bot: 500, ex: 280, sx: 1500, NX: 240 };
const SV = defScene({
  id: 'average', tab: 'Average, then exponentiate?', shared: true,
  defaults: () => ({ u: 0, K: 20, blobs: 3, clump: 0.92, tau: 1.6, seed: 3, labels: 1, shown: null }),
  actions: [
    { id: 'smear', label: 'Smear the clumps', primary: true, run: (st) => tween(st, 'u', 1, 3.2) },
    { id: 'back', label: 'Bring them back', run: (st) => tween(st, 'u', 0, 2.4) },
    { id: 'new', label: 'New clumps', run: (st) => { st.seed += 1; } },
    RESET,
  ],
  params: [
    { type: 'range', key: 'u', label: 'Smeared', min: 0, max: 1, step: 0.01, fmt: (v) => `${Math.round(v * 100)} %`, set: (v) => { untween(SV, 'u'); SV.u = v; } },
    { type: 'range', key: 'tau', label: 'Average optical depth', min: 0.2, max: 4, step: 0.05, fmt: (v) => v.toFixed(2) },
    { type: 'range', key: 'clump', label: 'Share in clumps', min: 0, max: 1, step: 0.05, fmt: (v) => `${Math.round(v * 100)} %` },
    { type: 'range', key: 'blobs', label: 'Clumps', min: 1, max: 12, step: 1, fmt: (v) => String(v) },
    { type: 'range', key: 'K', label: 'Rays', min: 4, max: 40, step: 1, fmt: (v) => String(v) },
    { type: 'check', key: 'labels', label: 'Labels', set: (v) => tween(SV, 'labels', v ? 1 : 0, 0.4) },
  ],
  draw: drawAverage,
});
// The medium: a little even background and some clumps, scaled so the rays' optical depths average st.tau. For each
// ray, its optical depth up to every x along the slab.
const AVC = { key: '' };
function averageMedium(st) {
  const K = Math.round(st.K), B = Math.round(st.blobs), key = [K, B, st.clump, st.tau, st.seed].join('|');
  if (AVC.key === key) return AVC;
  const { x0, x1, top, bot, NX } = SAV, L = x1 - x0, rnd = rng32(st.seed * 6151 + 11), blobs = [];
  for (let j = 0; j < B; j++) blobs.push([lerp(x0 + 80, x1 - 80, rnd()), lerp(top + 40, bot - 40, rnd()), lerp(16, 32, rnd()), lerp(0.6, 1.4, rnd())]);
  const C = (x, y) => { let s = 0; for (const [bx, by, r, w] of blobs) s += w * Math.exp(-((x - bx) ** 2 + (y - by) ** 2) / (2 * r * r)); return s; };
  const ys = [], cum = [];
  for (let i = 0; i < K; i++) {
    const y = top + ((i + 0.5) * (bot - top)) / K, c = new Float64Array(NX + 1); let acc = 0;
    for (let k = 1; k <= NX; k++) { acc += C(x0 + ((k - 0.5) / NX) * L, y) * (L / NX); c[k] = acc; }
    ys.push(y); cum.push(c);
  }
  const cbar = Math.max(1e-9, cum.reduce((s, c) => s + c[NX], 0) / K / L);   // the clumps' density, averaged along the rays
  const rho = (x, y) => (st.tau / L) * (1 - st.clump + (st.clump * C(x, y)) / cbar);
  // τ of ray i up to sample k
  const tauAt = cum.map((c) => Float64Array.from(c, (v, k) => (st.tau / L) * ((1 - st.clump) * (k / NX) * L + (st.clump * v) / cbar)));
  const tmax = clamp(Math.ceil(Math.max(...tauAt.map((t) => t[NX])) + 0.3), 3, 8);
  return Object.assign(AVC, { key, K, ys, tauAt, rho, tmax, img: null, imgU: -1 });
}
function drawAverage(ctx, dt, st) {
  const M = averageMedium(st), { x0, x1, top, bot, ex, sx, NX } = SAV, L = x1 - x0, u = clamp(st.u, 0, 1), color = SH.color, power = SH.I0;
  // each ray's optical depth up to x, smeared toward the even medium as u goes to 1
  const tauOf = (i, x) => { const f = clamp((x - x0) / L, 0, 1) * NX, k = Math.floor(f), t = M.tauAt[i], c = k >= NX ? t[NX] : lerp(t[k], t[k + 1], f - k); return lerp(c, st.tau * clamp((x - x0) / L, 0, 1), u); };
  // the medium: how opaque it looks is 1 − e^{−κρ}, as if seen through a fixed depth, so even the picture obeys Jensen
  if (!M.img || M.imgU !== u || M.imgC !== SH.look + SH.custom) {
    const gw = 245, gh = 98, cv = M.cv || (M.cv = document.createElement('canvas')); cv.width = gw; cv.height = gh;
    const g = cv.getContext('2d'), im = g.createImageData(gw, gh), [r, gg, b] = hexRgb(lookOf(SH).c), kap = 150, even = st.tau / L;
    for (let py = 0; py < gh; py++) for (let px = 0; px < gw; px++) {
      const rho = lerp(M.rho(x0 + ((px + 0.5) / gw) * L, top + ((py + 0.5) / gh) * (bot - top)), even, u), o = (py * gw + px) * 4;
      im.data[o] = r; im.data[o + 1] = gg; im.data[o + 2] = b; im.data[o + 3] = 255 * (1 - Math.exp(-kap * rho));
    }
    g.putImageData(im, 0, 0); M.img = cv; M.imgU = u; M.imgC = SH.look + SH.custom;
  }
  ctx.save(); ctx.imageSmoothingEnabled = true; ctx.drawImage(M.img, x0, top, L, bot - top); ctx.restore();
  dashed(ctx, x0, top - 70, x0, bot + 70, COL.greyC, 1, 2); dashed(ctx, x1, top - 70, x1, bot + 70, COL.greyC, 1, 2);
  // the rays, each as bright along x as e^{−τ} says, and what each brings to the sensor
  const K = M.K, w = clamp((0.22 * (bot - top)) / K, 2, 6), Ts = [];
  for (let i = 0; i < K; i++) {
    const T = (x) => Math.exp(-tauOf(i, x)); Ts.push(T(x1));
    drawBeam(ctx, ex, sx, M.ys[i], color, power, T, [x0, x1], w);
  }
  drawSheetLaser(ctx, ex, top, bot, color);
  ctx.save(); ctx.lineWidth = 3; ctx.strokeStyle = COL.greyB; ctx.fillStyle = BODY;
  ctx.beginPath(); ctx.roundRect(sx, top - 30, 26, bot - top + 60, 6); ctx.fill(); ctx.stroke();
  for (let i = 0; i < K; i++) { ctx.fillStyle = hexA(color, 0.95 * power * Ts[i]); ctx.fillRect(sx - 3, M.ys[i] - w / 2, 5, w); }
  ctx.restore();
  const mean = Ts.reduce((s, t) => s + t, 0) / K;
  st.shown = st.shown == null || reduced ? mean : lerp(st.shown, mean, 1 - Math.exp(-dt * 6));
  drawShadowsReadout(ctx, sx, st.shown, 1);
  // the curve e^{−τ}, each ray on it, and their average above it; e^{−τ̄} on the curve below
  const A = makeAxes({ L: x0, R: x1, T: 640, B: 990, xr: [0, M.tmax, 1], yr: [0, 1, 0.5], ext: 40, xl: String.raw`\tau`, yl: 'T', labSize: 52, numSize: 28 });
  drawAxes(ctx, A, { c: 1, nums: 1, lab: 1 });
  drawCurve(ctx, A, (t) => Math.exp(-t), { color: COL.blue, width: 4 });
  for (let i = 0; i < K; i++) dot(ctx, A.X(Math.min(M.tmax, tauOf(i, x1))), A.Y(Ts[i]), 6, COL.yellow, 0.85);
  const tb = st.tau, mx = A.X(tb), my = A.Y(mean), cy = A.Y(Math.exp(-tb));
  if (my < cy - 18) dashed(ctx, mx, my + 14, mx, cy - 12, COL.white, 0.7, 2.5);
  dot(ctx, mx, cy, 10, COL.blue);
  ctx.save(); ctx.strokeStyle = COL.yellow; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(mx, my, 12, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  if (st.labels > 0.003) {
    const la = st.labels;
    drawTex(ctx, String.raw`\overline{e^{-\tau}}`, mx + 26, my - 8, 46, { ax: 0, ay: 1, color: COL.yellow, alpha: la });
    drawTex(ctx, String.raw`e^{-\overline{\tau}}`, mx - 22, cy + 10, 46, { ax: 1, ay: 0, color: COL.blue, alpha: la });   // below the curve, clear of the rays' points
  }
}
