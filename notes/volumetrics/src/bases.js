// ---------- O. same curve, any base ----------
// What is left after a distance x is a^x for some a below 1. Written with e it is e^{−kx} with k = −ln a; in base 2
// or 10 it is the same curve again, and only the number in front of x changes. What base e buys: there that number
// is the rate, the curve's slope over its height, the same at every point.
const SBA = defScene({
  id: 'bases', tab: 'Same curve, any base',
  defaults: () => ({ a: 0.5, k: 1, eA: 1, chain: 0, fam: 0, tie: 0, tan: 0, xt: 1.2, labels: 1 }),
  actions: [
    { id: 'match', label: 'Match', primary: true, run: async (st, alive) => {
      st.k = baseK(st); st.tie = 0; await tween(st, 'k', -Math.log(Math.max(1e-6, st.a)), 2.4); if (alive()) st.tie = 1;
    } },
    { id: 'unmatch', label: 'Unmatch', run: (st) => { st.k = baseK(st); st.tie = 0; return tween(st, 'k', 1, 1.6); } },
    { id: 'chain', label: 'Other bases', run: (st) => tween(st, 'chain', st.chain > 0.5 ? 0 : 1, 2.4, { ease: linear }) },
    { id: 'fam', label: 'Every a', run: (st) => tween(st, 'fam', st.fam > 0.5 ? 0 : 1, 1.4) },
    { id: 'one', label: 'a → 1', run: (st) => tween(st, 'a', 1, 2.4) },
    { id: 'half', label: 'a → 0.5', run: (st) => tween(st, 'a', 0.5, 1.6) },
    { id: 'rate', label: 'Slope over height', run: (st) => { tween(st, 'tan', 1, 0.6); st.xt = 0.15; return tween(st, 'xt', 3.6, 5); } },
    RESET,
  ],
  params: [
    { type: 'range', key: 'a', label: 'a', min: 0.02, max: 1, step: 0.01, fmt: (v) => v.toFixed(2), set: (v) => { untween(SBA, 'a'); SBA.a = v; } },
    { type: 'range', key: 'k', label: 'k', min: 0, max: 3, step: 0.001, fmt: (v) => v.toFixed(3), get: () => baseK(SBA), set: (v) => { untween(SBA, 'k'); SBA.tie = 0; SBA.k = v; } },
    { type: 'range', key: 'xt', label: 'Point at x', min: 0, max: 4, step: 0.01, fmt: (v) => v.toFixed(2), set: (v) => { untween(SBA, 'xt'); SBA.xt = v; if (SBA.tan < 1) tween(SBA, 'tan', 1, 0.4); } },
    { type: 'check', key: 'eA', label: 'Curve e^(−kx)', set: (v) => tween(SBA, 'eA', v ? 1 : 0, 0.6) },
    { type: 'check', key: 'tan', label: 'Slope over height', set: (v) => tween(SBA, 'tan', v ? 1 : 0, 0.5) },
    { type: 'check', key: 'labels', label: 'Formulas', set: (v) => tween(SBA, 'labels', v ? 1 : 0, 0.5) },
  ],
  draw: drawBases,
});
// k follows a once they have been matched
const baseK = (st) => (st.tie ? -Math.log(Math.max(1e-6, st.a)) : st.k);
// A number for a formula: as few decimals as it needs, up to dec.
const texNum = (v, dec) => String(+v.toFixed(dec));
function drawBases(ctx, dt, st) {
  const A = makeAxes({ L: 250, R: 1130, T: 230, B: 880, xr: [0, 4, 1], yr: [0, 1, 0.5], ext: 46, xl: 'x', yl: 'T', labSize: 56, numSize: 32 });
  drawAxes(ctx, A, { c: 1, nums: 1, lab: 1 });
  const a = clamp(st.a, 1e-6, 1), k = baseK(st), la = st.labels;
  // every a at once: all start at 1 (no distance, nothing taken), and a = 1 never falls
  if (st.fam > 0.003) for (const b of [0.1, 0.25, 0.4, 0.55, 0.7, 0.85, 1]) drawCurve(ctx, A, (x) => Math.pow(b, x), { color: COL.greyB, alpha: 0.35 * st.fam, width: 2.5 });
  // e^{−kx} wider, under a^x: once they match, the blue edges the yellow
  if (st.eA > 0.003) drawCurve(ctx, A, (x) => Math.exp(-k * x), { color: COL.blue, alpha: st.eA, width: 10 });
  drawCurve(ctx, A, (x) => Math.pow(a, x), { color: COL.yellow, width: 4 });
  dot(ctx, A.X(0), A.Y(1), 9, COL.white);
  // a point on a^x, its tangent, and the slope over the height, which is ln a wherever the point is
  if (st.tan > 0.003) {
    const ta = st.tan, x = clamp(st.xt, 0, 4), h = Math.pow(a, x), sl = Math.log(a) * h, X = A.X(x), Y = A.Y(h);
    ctx.save(); ctx.globalAlpha = ta; ctx.strokeStyle = COL.white; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath();
    const d = 0.75; ctx.moveTo(A.X(x - d), A.Y(h - sl * d)); ctx.lineTo(A.X(x + d), A.Y(h + sl * d)); ctx.stroke(); ctx.restore();
    dotted(ctx, X, Y + 14, X, A.oy - 4, COL.white, 0.55 * ta, 4);
    dashed(ctx, X, Y, A.X(x + 0.5), Y, COL.greyB, 0.8 * ta, 2.5);
    dashed(ctx, A.X(x + 0.5), Y, A.X(x + 0.5), A.Y(h + sl * 0.5), COL.greyB, 0.8 * ta, 2.5);
    dot(ctx, X, Y, 10, COL.yellow, ta);
    // in a fixed place, so the eye can follow the point while the number stays put
    const sp = drawTex(ctx, String.raw`\frac{\text{slope}}{\text{height}} =`, A.X(1.9), A.Y(0.9), 48, { ax: 0, ay: 0.5, alpha: ta }), eq = sp[sp.length - 1];
    if (eq) drawNumber(ctx, Math.log(a), eq.x + eq.w + 0.3 * eq.fpx, A.Y(0.9) + 16, { size: 48, dec: 3, color: COL.yellow, alpha: ta });
  }
  if (la <= 0.003) return;
  // the formulas: a^x, the same curve in other bases, and e^{−kx} as it stands
  const moving = tweens.some((w) => w.obj === st && w.key === 'k'), fx = 1250;
  drawTex(ctx, String.raw`T = ${texNum(a, 2)}^{x}`, fx, 300, 60, { ax: 0, color: COL.yellow, alpha: la });
  const term = (c) => (Math.abs(c - 1) < 5e-4 ? 'x' : `${texNum(c, 3)}\\,x`), lna = Math.log(a);
  const chain = [`= 2^{-${term(-lna / Math.LN2)}}`, `= e^{-${term(-lna)}}`, `= 10^{-${term(-lna / Math.LN10)}}`];
  chain.forEach((src, i) => { const p = smooth(clamp(st.chain * 3 - i, 0, 1)); if (p > 0.003) drawTex(ctx, src, fx + 60, 400 + 92 * i, 56, { ax: 0, alpha: la * p }); });
  if (st.eA > 0.003) drawTex(ctx, String.raw`T = e^{-${texNum(k, moving ? 2 : 3)}\,x}`, fx, 760, 60, { ax: 0, color: COL.blue, alpha: la * st.eA });
}
