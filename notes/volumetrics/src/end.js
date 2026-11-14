// ---------- presentation, part 6: the ending (beats 58–58b) ----------
// Two of the hook's questions come back as cards (present.js's QCARDS), each with an arrow to its answer and, under the
// answer, the animation that showed it, which keeps playing until the video ends: "Why e? Why exponentials?" →
// particles placed at random (part 4's slabs coming in one by one and going again, their steps on the exponential);
// "why an integral in the exponent?" → σ changes along the ray (part 5's volume changing shape, the area under σ, the
// integral, and the reading, staying the same).
// rows: which card, and the row's middle. card: its left, width, height, title size and line spacing. arrow: where it
// starts and ends, its head. ans: the answer's left, its text's height and size, and the animation's box (top, width,
// height), each against the row's middle.
const END = {
  rows: [{ q: 2, cy: 330 }, { q: 0, cy: 772 }],
  card: { x: 70, w: 440, h: 150, size: 36, gap: 46 },
  arrow: { x0: 530, x1: 632, head: 20 },
  ans: { x: 668, ty: -215, size: 42, top: -185, w: 1190, h: 370 },
};
const ENDTXT = [String.raw`\text{particles placed at random}`, String.raw`\textcolor{${COL.yellow}}{\sigma}\text{ changes along the ray}`];
const ENDFML = String.raw`e^{-\textcolor{${COL.yellow}}{\int \sigma(x)\,dx}}`;
// the two animations' extents in their own units: part 4's long frame at ten slabs (its middle WPC(10)); part 5's setup,
// with its plot and readout (its middle)
const ENDBOX = { exp: [1800, 860], vary: [1420, 660, 462, -140] };
END.vk = 1.45;   // how much smaller part 5's labels and readout are here than on their own
function END_DEFAULTS() { return { eout: 0, eq1: 0, ea1: 0, et1: 0, en1: 0, eT1: 0, eq2: 0, ea2: 0, et2: 0, en2: 0, eT2: 0 }; }
// The slabs: one by one up to ten, a while at ten, back down to one, a while at one; again and again
function endN(t) {
  const P = 15, u = ((t % P) + P) % P;
  if (u < 8) { const s = u / 0.8, i = Math.floor(s); return Math.min(WHY.NLONG, 1 + i + smooth(clamp((s - i - 0.35) / 0.65, 0, 1))); }
  if (u < 10.5) return WHY.NLONG;
  if (u < 13) return lerp(WHY.NLONG, 1, smooth((u - 10.5) / 2.5));
  return 1;
}
// part 4's slabs, their particles placed at random, the brace, and the plot with its steps on the curve, fitted in r
function endExp(ctx, r, t0) {
  const n = reduced ? WHY.NLONG : endN(TIME - t0), S = Object.assign(WHY_DEFAULTS(), { wzoom: 1, wls: 1, wread: 1, wpl: 1, wax: 1, wcur: 1, wdA: 1, wn: n }), V = whyMain(S);
  const c = WPC(WHY.NLONG), k = Math.min(r[2] / ENDBOX.exp[0], r[3] / ENDBOX.exp[1]);
  ctx.save(); ctx.translate(r[0] + (ENDBOX.exp[0] * k) / 2, r[1] + r[3] / 2); ctx.scale(k, k); ctx.translate(-c[0], -c[1]);
  whyAt(ctx, [WDC[0], WPL.y, WTK], () => { whyView(ctx, V); whyBrace(ctx, V, n, 1); });
  whyPlot(ctx, S, V, n, WHY.NLONG);
  ctx.restore();
}
// part 5's setup, its σ going through shapes with the same area, fitted in r; to its right, the formula with the integral
function endVary(ctx, r, t0) {
  const S = Object.assign(VARY_DEFAULTS(), { von: 1, vsect: 1, vax: 1, vpl: 1, vcont: 1, vchop: 1, vint: 1, vread: 1, vshLoop: 1, vshT0: t0 });
  const [w, h, cx, cy] = ENDBOX.vary, k = Math.min(r[2] / w, r[3] / h);
  ctx.save(); ctx.translate(r[0] + (w * k) / 2, r[1] + r[3] / 2); ctx.scale(k, k); ctx.translate(-cx, -cy); varyDraw(ctx, S, 'A', k * END.vk, 0); ctx.restore();   // (its labels and readout smaller, to suit)
  drawTex(ctx, ENDFML, r[0] + w * k + (r[2] - w * k) / 2, r[1] + r[3] / 2 + 30, 62);
}
function endArrow(ctx, x0, x1, y, a) {
  const h = END.arrow.head, hd = clamp((x1 - x0) / h - 0.5, 0, 1);
  ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = COL.greyA; ctx.fillStyle = COL.greyA; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(Math.max(x0, x1 - h * 0.8 * hd), y); ctx.stroke();
  if (hd > 0.003) { ctx.globalAlpha *= hd; ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x1 - h, y - h * 0.55); ctx.lineTo(x1 - h, y + h * 0.55); ctx.closePath(); ctx.fill(); }
  ctx.restore();
}
function drawEnd(ctx, dt, st) {
  END.rows.forEach((R, i) => {
    const j = i + 1, qa = smooth(clamp(st['eq' + j], 0, 1)); if (qa <= 0.003) return;
    const q = QCARDS[R.q], C = END.card, mx = C.x + C.w / 2, pop = lerp(0.85, 1, qa), A = END.ans;
    // the card, as the hook left it: its colour, its question
    ctx.save(); ctx.globalAlpha *= qa; ctx.translate(mx, R.cy); ctx.scale(pop, pop); ctx.translate(-mx, -R.cy);
    ctx.strokeStyle = hexA(q.col, 0.8); ctx.lineWidth = 3.5; ctx.beginPath(); ctx.roundRect(C.x, R.cy - C.h / 2, C.w, C.h, 16); ctx.stroke();
    q.title.forEach((src, l) => drawTex(ctx, src, mx, R.cy + (l - (q.title.length - 1) / 2) * C.gap, C.size, { color: q.col }));
    ctx.restore();
    // the arrow to its answer, the answer, and under it the animation
    const aa = smooth(clamp(st['ea' + j], 0, 1)), ta = clamp(st['et' + j], 0, 1), na = smooth(clamp(st['en' + j], 0, 1));
    if (aa > 0.003) endArrow(ctx, END.arrow.x0, lerp(END.arrow.x0, END.arrow.x1, aa), R.cy, aa);
    if (ta > 0.003) drawTex(ctx, ENDTXT[i], A.x, R.cy + A.ty, A.size, { ax: 0, p: ta });
    if (na > 0.003) { ctx.save(); ctx.globalAlpha *= na; (i === 0 ? endExp : endVary)(ctx, [A.x, R.cy + A.top, A.w, A.h], st['eT' + j]); ctx.restore(); }
  });
}

// ---- the beats ----
// 58: part 5 goes; "Why e? Why exponentials?" comes back as a card, an arrow grows from it to its answer, "particles
// placed at random" writes in, and under it part 4's slabs come in, coming and going from then on
function endFirst() {
  ptw('eout', 1, 0.8); ptw('eq1', 1, 0.7, { delay: 0.6 }); ptw('ea1', 1, 0.6, { delay: 1.2 }); ptw('et1', 1, 0.9, { delay: 1.6, ease: linear });
  PS.eT1 = labLoopStart('eT1', TIME + 1.9); return ptw('en1', 1, 0.8, { delay: 1.9 });
}
// 58b: the same for "why an integral in the exponent?": "σ changes along the ray", and part 5's volume changing shape
function endSecond() {
  ptw('eq2', 1, 0.7); ptw('ea2', 1, 0.6, { delay: 0.6 }); ptw('et2', 1, 1.0, { delay: 1.0, ease: linear });
  PS.eT2 = labLoopStart('eT2', TIME + 1.3); return ptw('en2', 1, 0.8, { delay: 1.3 });
}
