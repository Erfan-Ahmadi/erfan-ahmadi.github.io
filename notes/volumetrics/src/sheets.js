// ---------- N. where the shadows fall ----------
// Slabs as transparencies. Seen down the beam, the beam is a grid of rays and each slab a sheet with particles on
// some of them; a ray gets through if no sheet has a particle on it. A slab that blocks a fraction c of the rays on
// its own blocks less in a stack, because some of its particles land on rays already blocked. If the slabs don't
// care where earlier shadows fell, each blocks c of what is left: (1 − c)^n. If they filled the gaps they would
// block c of what came in, the tempting 1 − cn, and 1/c of them would make a wall; if they lined up behind each
// other, what the first lets through would get through them all. Clumps sit in between.
const SWN = 10, swZ = (k) => 1.1 + k * 0.92, SWZS = swZ(SWN - 1) + 1.3, SWZC = (SWZS - 0.7) / 2;   // slab and sensor depths, and the middle of it all
let sheetVer = 0;   // bumped whenever the slabs change
const SW = defScene({
  id: 'sheets', tab: 'Where the shadows fall', shared: true,
  defaults: () => ({ c: 0.1, G: 20, mode: 'random', rho: 0.6, land: 1, v: 0, logy: 0, pred: 1, labels: 1, seed: 1, stepT: 1.1, shown: null, slabs: [] }),
  onReset: () => { sheetVer++; },
  actions: [
    { id: 'add', label: 'Add a slab', primary: true, run: (st) => sheetAdd(st, Math.max(1.8, st.stepT)) },
    { id: 'ten', label: 'Ten slabs', run: (st, alive) => sheetRun(st, alive) },
    { id: 'random', label: "Doesn't care", run: (st, alive) => { st.mode = 'random'; return sheetRun(st, alive); } },
    { id: 'gaps', label: 'Fills the gaps', run: (st, alive) => { st.mode = 'gaps'; return sheetRun(st, alive); } },
    { id: 'stack', label: 'Lines up', run: (st, alive) => { st.mode = 'stack'; return sheetRun(st, alive); } },
    { id: 'clump', label: 'Clumps', run: (st, alive) => { st.mode = 'clump'; return sheetRun(st, alive); } },
    { id: 'half', label: 'Half and half', run: async (st, alive) => {
      st.c = 0.5; sheetClear(st); await sleep(0.3, 'sheets'); if (!alive()) return;
      await sheetAdd(st, 1.8); if (!alive()) return; await sleep(0.7, 'sheets'); if (!alive()) return; await sheetAdd(st, 2.4);
    } },
    { id: 'view', label: 'Down the beam / from the side', run: (st) => tween(st, 'v', st.v > 0.5 ? 0 : 1, 2.2) },
    { id: 'log', label: 'Log scale on / off', run: (st) => tween(st, 'logy', st.logy > 0.5 ? 0 : 1, 1.4) },
    { id: 'remove', label: 'Remove a slab', run: (st) => { untween(st, 'land'); st.slabs.pop(); st.land = 1; sheetVer++; } },
    RESET,
  ],
  params: [
    { type: 'range', key: 'c', label: 'Each slab blocks', min: 0.05, max: 0.5, step: 0.05, fmt: (v) => `${Math.round(v * 100)} %`, set: (v) => sheetParam(() => { SW.c = v; }) },
    { type: 'select', key: 'G', label: 'Rays', options: [['10', '10 × 10'], ['20', '20 × 20'], ['30', '30 × 30']], get: () => String(SW.G), set: (v) => sheetParam(() => { SW.G = +v; }) },
    { type: 'range', key: 'rho', label: 'How much they clump', min: 0, max: 1, step: 0.05, fmt: (v) => `${Math.round(v * 100)} %`, visible: (st) => st.mode === 'clump', set: (v) => sheetParam(() => { SW.rho = v; }) },
    { type: 'range', key: 'v', label: 'View', min: 0, max: 1, step: 0.01, fmt: (v) => (v < 0.02 ? 'from the side' : v > 0.98 ? 'down the beam' : `${Math.round(v * 100)} %`), set: (v) => { untween(SW, 'v'); SW.v = v; } },
    { type: 'range', key: 'stepT', label: 'Time per slab (s)', min: 0.4, max: 4, step: 0.1, fmt: (v) => v.toFixed(1) },
    { type: 'check', key: 'pred', label: 'Curves', set: (v) => tween(SW, 'pred', v ? 1 : 0, 0.5) },
    { type: 'check', key: 'labels', label: 'Curve labels', set: (v) => tween(SW, 'labels', v ? 1 : 0, 0.4) },
  ],
  draw: drawSheets,
});
function sheetClear(st) { untween(st, 'land'); st.slabs = []; st.land = 1; st.shown = null; sheetVer++; }
function sheetParam(f) { scenes.sheets.epoch++; f(); sheetClear(SW); }
// The cells (rays) slab k puts particles on: m = c·G² of them, never two on one ray.
function sheetSlab(st, k) {
  const N = st.G * st.G, m = Math.round(st.c * N), salt = { random: 1, gaps: 2, stack: 3, clump: 4 }[st.mode] || 0;
  const rnd = rng32(st.seed * 7907 + k * 104729 + salt * 15485863 + st.G * 31 + Math.round(st.c * 100) * 977);
  const dark = new Uint8Array(N); for (const s of st.slabs) for (const i of s) dark[i] = 1;
  const pick = (pool, cnt, out = []) => {
    const a = pool.slice();
    for (let i = 0; i < Math.min(cnt, a.length); i++) { const j = i + Math.floor(rnd() * (a.length - i)), t = a[i]; a[i] = a[j]; a[j] = t; out.push(a[i]); }
    return out;
  };
  const all = Array.from({ length: N }, (_, i) => i), lit = all.filter((i) => !dark[i]), shade = all.filter((i) => dark[i]);
  if (k === 0 || st.mode === 'random') return pick(all, m);   // without looking at where the shadows are
  if (st.mode === 'stack') return st.slabs[0].slice();          // right behind the first slab's particles
  if (st.mode === 'gaps') { const out = pick(lit, m); return out.length < m ? pick(shade, m - out.length, out) : out; }
  // clumps: a particle settles right behind an earlier one with chance rho, anywhere otherwise
  const out = new Set(); let guard = 0;
  while (out.size < m && guard++ < 60 * m) out.add(rnd() < st.rho && shade.length ? shade[Math.floor(rnd() * shade.length)] : Math.floor(rnd() * N));
  return [...out];
}
function sheetAdd(st, dur) {
  if (st.slabs.length >= SWN) return Promise.resolve();
  st.slabs.push(sheetSlab(st, st.slabs.length)); st.land = 0; sheetVer++;
  return tween(st, 'land', 1, dur, { ease: linear });
}
async function sheetRun(st, alive) {
  sheetClear(st); await sleep(0.35, 'sheets'); if (!alive()) return;
  for (let k = 0; k < SWN; k++) { await sheetAdd(st, st.stepT); if (!alive()) return; }
}
// For every ray, the first slab with a particle on it; and the share of rays still going after each slab.
const SWC = { ver: -1 };
function sheetState(st) {
  if (SWC.ver === sheetVer && SWC.G === st.G) return SWC;
  const N = st.G * st.G, first = new Int16Array(N).fill(SWN + 1);
  st.slabs.forEach((s, k) => { for (const i of s) if (first[i] > k) first[i] = k; });
  const alive = [];
  for (let k = 0; k <= st.slabs.length; k++) { let c = 0; for (let i = 0; i < N; i++) if (first[i] >= k) c++; alive.push(c / N); }
  return Object.assign(SWC, { ver: sheetVer, G: st.G, N, first, alive });
}
function drawSheets(ctx, dt, st) {
  const S = sheetState(st), G = st.G, N = S.N, n = st.slabs.length, first = S.first, color = SH.color, power = SH.I0;
  // an orthographic camera that turns from beside the beam to looking down it, from the laser's side
  const v = clamp(st.v, 0, 1), th = (lerp(52, 0, v) * Math.PI) / 180, ph = (lerp(15, 0, v) * Math.PI) / 180;
  const F = [-Math.sin(th) * Math.cos(ph), -Math.sin(ph), Math.cos(th) * Math.cos(ph)], rl = Math.hypot(F[2], F[0]);
  const R = [F[2] / rl, 0, -F[0] / rl], U = [F[1] * R[2] - F[2] * R[1], F[2] * R[0] - F[0] * R[2], F[0] * R[1] - F[1] * R[0]];
  // as large as fits: the whole stack within the left part of the stage while it turns, the face at most 500 px
  const s = Math.min(250, 1050 / ((SWZS + 0.7) * R[2] + 2.2 * R[0])), cx = 560, cy = lerp(470, 575, v);
  const P = (x, y, z) => [cx + s * (x * R[0] + (z - SWZC) * R[2]), cy - s * (x * U[0] + y * U[1] + (z - SWZC) * U[2])];
  const onPlate = (z, f) => { ctx.save(); ctx.transform(s * R[0], -s * U[0], 0, -s * U[1], cx + s * (z - SWZC) * R[2], cy - s * (z - SWZC) * U[2]); f(); ctx.restore(); };
  const cs = 2 / G, lx = (i) => -1 + ((i % G) + 0.5) * cs, ly = (i) => 1 - (Math.floor(i / G) + 0.5) * cs, pr = 0.4 * cs;
  // the newest slab lands particle by particle; each ray it newly blocks goes dark when its particle lands, and a
  // particle that lands on a ray an earlier slab already blocked flashes: it blocks nothing new
  const k1 = n - 1, anim = n > 0 && st.land < 1, land = st.land, m1 = n ? st.slabs[k1].length : 0;
  const order = new Int32Array(N).fill(-1); if (n) st.slabs[k1].forEach((i, q) => { order[i] = q; });
  const tq = (q, d) => (land - (0.25 * q) / Math.max(1, m1) - d);
  const cut = (i) => (first[i] === k1 && anim ? smooth(clamp(tq(order[i], 0.2) / 0.25, 0, 1)) : 1);
  let lit = 0; for (let i = 0; i < N; i++) lit += first[i] >= n ? 1 : first[i] === k1 ? 1 - cut(i) : 0;
  lit /= N;
  st.shown = st.shown == null || reduced ? lit : lerp(st.shown, lit, 1 - Math.exp(-dt * 9));
  // the rays: lines from the laser to wherever they stop, which shrink to points as the view turns down the beam
  const rayA = 0.25 * Math.min(1, 20 / G) * power * (1 - smooth(clamp((v - 0.72) / 0.25, 0, 1)));
  if (rayA > 0.003) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = hexA(color, rayA); ctx.lineWidth = Math.max(0.8, s * 0.011); ctx.beginPath();
    for (let i = 0; i < N; i++) {
      const f = first[i], ze = f >= n ? SWZS : lerp(SWZS, swZ(f), cut(i)), a = P(lx(i), ly(i), 0), b = P(lx(i), ly(i), ze);
      ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
    }
    ctx.stroke(); ctx.restore();
  }
  // the sensor, farthest away: lit where rays still arrive
  onPlate(SWZS, () => {
    ctx.fillStyle = BODY; ctx.strokeStyle = COL.greyB; ctx.lineWidth = 0.02;
    ctx.beginPath(); ctx.roundRect(-1.1, -1.1, 2.2, 2.2, 0.06); ctx.fill(); ctx.stroke();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < N; i++) {
      const a = (first[i] >= n ? 1 : first[i] === k1 ? 1 - cut(i) : 0) * power; if (a <= 0.01) continue;
      ctx.fillStyle = hexA(color, 0.2 * a); ctx.beginPath(); ctx.arc(lx(i), ly(i), 0.48 * cs, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = hexA(color, 0.95 * a); ctx.beginPath(); ctx.arc(lx(i), ly(i), 0.24 * cs, 0, Math.PI * 2); ctx.fill();
    }
  });
  // the slabs, far to near; the one landing goes on top, so its particles show even looking down the beam
  const slab = (k) => onPlate(swZ(k), () => {
    ctx.fillStyle = hexA(COL.white, 0.035 * (1 - 0.85 * v)); ctx.strokeStyle = hexA(COL.greyC, 0.9); ctx.lineWidth = 0.012;
    ctx.beginPath(); ctx.rect(-1.06, -1.06, 2.12, 2.12); ctx.fill(); ctx.stroke();
    ctx.fillStyle = PART; ctx.strokeStyle = COL.greyB; ctx.lineWidth = 0.008;
    const landing = k === k1 && anim;
    if (!landing) { ctx.beginPath(); for (const i of st.slabs[k]) { ctx.moveTo(lx(i) + pr, ly(i)); ctx.arc(lx(i), ly(i), pr, 0, Math.PI * 2); } ctx.fill(); ctx.stroke(); return; }
    st.slabs[k].forEach((i, q) => {
      const d = smooth(clamp(tq(q, 0) / 0.25, 0, 1)); if (d <= 0.003) return;
      ctx.globalAlpha = d; ctx.beginPath(); ctx.arc(lx(i), ly(i), pr * lerp(1.8, 1, d), 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      if (first[i] < k) {   // wasted: this ray was already dark
        const t = tq(q, 0.2) / 0.5, fl = t <= 0 || t >= 1 ? 0 : smooth(clamp(t / 0.2, 0, 1)) * (1 - smooth(clamp((t - 0.65) / 0.35, 0, 1)));
        if (fl > 0.003) { ctx.save(); ctx.globalAlpha = fl; ctx.strokeStyle = COL.yellow; ctx.lineWidth = 0.022; ctx.beginPath(); ctx.arc(lx(i), ly(i), pr * 1.4, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
      }
    });
    ctx.globalAlpha = 1;
  });
  for (let k = n - 1; k >= 0; k--) if (!(k === k1 && anim)) slab(k);
  if (anim) slab(k1);
  // the laser, nearest: a box whose front face emits every ray; it fades as the view turns to look past it
  const la = 1 - smooth(clamp(v / 0.75, 0, 1));
  if (la > 0.003) {
    ctx.save(); ctx.globalAlpha = la; ctx.fillStyle = BODY; ctx.strokeStyle = COL.greyB; ctx.lineWidth = Math.max(1, s * 0.02); ctx.lineJoin = 'round';
    const c = [[-1.1, -1.1], [1.1, -1.1], [1.1, 1.1], [-1.1, 1.1]], back = c.map(([x, y]) => P(x, y, -0.7)), front = c.map(([x, y]) => P(x, y, 0));
    const poly = (pts) => { ctx.beginPath(); pts.forEach((p, j) => (j ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); ctx.fill(); ctx.stroke(); };
    poly(back); for (let j = 0; j < 4; j++) poly([back[j], back[(j + 1) % 4], front[(j + 1) % 4], front[j]]);
    ctx.restore();
    onPlate(0, () => {
      ctx.globalAlpha = la; ctx.fillStyle = NOZZLE; ctx.strokeStyle = COL.greyB; ctx.lineWidth = 0.02;
      ctx.beginPath(); ctx.rect(-1.1, -1.1, 2.2, 2.2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = hexA(color, 0.9 * power); ctx.beginPath();
      for (let i = 0; i < N; i++) { ctx.moveTo(lx(i) + 0.2 * cs, ly(i)); ctx.arc(lx(i), ly(i), 0.2 * cs, 0, Math.PI * 2); }
      ctx.fill();
    });
  }
  // the reading, over the sensor
  const tp = P(0, 1.1, SWZS), bw = 210, bh = 84, bx = tp[0] - bw / 2, by = tp[1] - 26 - bh;
  ctx.save(); ctx.fillStyle = BG; ctx.strokeStyle = COL.greyB; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 12); ctx.fill(); ctx.stroke(); ctx.restore();
  drawNumber(ctx, st.shown * 100, bx + bw / 2, by + bh / 2 + 18, { size: 52, dec: 1, suffix: '%', align: 'center' });
  drawSheetsPlot(ctx, st, S, n, anim ? lit : null);
}
// What gets through against the number of slabs, with the three ways slabs could share out their shadows.
function drawSheetsPlot(ctx, st, S, n, litNow) {
  const A = makeAxes({ L: 1210, R: 1600, T: 330, B: 820, xr: [0, SWN, 2], yr: [0, 1, 1], ext: 46, xl: 'n', yl: 'T', labSize: 52, numSize: 30 });
  const lg = st.logy, ym = (t) => lerp(t, 1 + Math.log10(Math.max(t, 1e-3)) / 3, lg), c = st.c, q = 1 - c;
  drawAxes(ctx, A, { c: 1, nums: 1, lab: 1 });
  ctx.save(); ctx.font = cm(30); ctx.textAlign = 'right'; ctx.lineWidth = 2.5;
  for (const [t, a] of [[0.5, 1 - lg], [0.1, lg], [0.01, lg]]) {
    if (a <= 0.003) continue;
    const y = A.Y(ym(t)); ctx.strokeStyle = hexA(AXIS, a); ctx.beginPath(); ctx.moveTo(A.ox - 10, y); ctx.lineTo(A.ox + 10, y); ctx.stroke();
    ctx.fillStyle = hexA(COL.white, a); ctx.fillText(String(t), A.ox - 22, y + 0.34 * 30);
  }
  ctx.restore();
  const pa = st.pred;
  if (pa > 0.003) {
    ctx.save(); ctx.setLineDash([2, 9]); ctx.lineCap = 'round'; drawCurve(ctx, A, (x) => ym(x < 1 ? 1 - c * x : q), { color: COL.grey, alpha: pa, width: 4 }); ctx.restore();
    ctx.save(); ctx.setLineDash([12, 10]); drawCurve(ctx, A, (x) => ym(Math.max(0, 1 - c * x)), { color: COL.grey, alpha: pa, width: 3 }); ctx.restore();
    drawCurve(ctx, A, (x) => ym(Math.pow(q, x)), { color: COL.blue, alpha: pa, width: 4 });
  }
  // the share of rays still going, slab by slab; the last point slides over as its slab lands
  const pts = []; for (let k = 0; k <= n; k++) pts.push([k, S.alive[k]]);
  if (litNow != null && n > 0) { const f = (S.alive[n - 1] - litNow) / Math.max(1e-9, S.alive[n - 1] - S.alive[n]); pts[n] = [n - 1 + clamp(f, 0, 1), litNow]; }
  ctx.save(); ctx.strokeStyle = COL.yellow; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.beginPath();
  pts.forEach(([x, t], j) => (j ? ctx.lineTo(A.X(x), A.Y(ym(t))) : ctx.moveTo(A.X(x), A.Y(ym(t))))); ctx.stroke(); ctx.restore();
  for (const [x, t] of pts) dot(ctx, A.X(x), A.Y(ym(t)), 7, COL.yellow);
  // a key beside the plot: the count, and what each way of sharing out shadows gives
  const la = st.labels; if (la <= 0.003) return;
  const fmt = (v) => String(+v.toFixed(2)), items = [
    [String.raw`\text{rays left}`, COL.yellow, null], [`${fmt(q)}^{n}`, COL.blue, []], [String.raw`1-${fmt(c)}\,n`, COL.grey, [12, 10]], [fmt(q), COL.grey, [2, 9]]];
  items.forEach(([src, col, dash], j) => {
    const x = 1660, y = 360 + 58 * j, a = la * (dash ? pa : 1);
    ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = col; ctx.lineWidth = dash && dash[0] === 2 ? 4 : 3.5; ctx.lineCap = 'round';
    if (dash) { ctx.setLineDash(dash); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 40, y); ctx.stroke(); } else { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x + 20, y, 7, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
    drawTex(ctx, src, x + 56, y, 38, { ax: 0, ay: 0.5, color: col, alpha: a });
  });
}
