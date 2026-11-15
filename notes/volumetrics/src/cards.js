// ---------- presentation: the hook's question cards, their animations (beats 12b–14b) ----------
// Each card's place under its question (present.js's drawQCards) shows the animation that later answers it, looping
// from when the card lands: "why an integral in the exponent?", part 5's volume going through shapes with the same
// integral (as the ending has it); "inside another integral?", light given off all along the ray, each bit of it dimmed
// on its way to the sensor; "Why e?", part 4's slabs with their particles placed at random coming and going.
const QCV = { vk: 2.4 };   // how much smaller part 5's labels and readout are here than on their own
function qcVary(ctx, r, a) {
  const S = Object.assign(VARY_DEFAULTS(), { von: 1, vsect: 1, vax: 1, vpl: 1, vcont: 1, vchop: 1, vint: 1, vread: 1, vshLoop: 1, vshT0: PS.qc[0].t0 || 0 });
  const [w, h, cx, cy] = ENDBOX.vary, k = Math.min(r[2] / w, r[3] / h);
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(r[0] + r[2] / 2, r[1] + r[3] / 2); ctx.scale(k, k); ctx.translate(-cx, -cy); varyDraw(ctx, S, 'A', k * QCV.vk, 0); ctx.restore();
}
function qcExp(ctx, r, a) {
  const t0 = PS.qc[2].t0 || 0, n = reduced ? WDN.max : 1 + ((endN(TIME - t0) - 1) * (WDN.max - 1)) / (WHY.NLONG - 1);
  const c = WPC(WHY.NLONG), k = Math.min(r[2] / ENDBOX.exp[0], r[3] / ENDBOX.exp[1]);
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(r[0] + r[2] / 2, r[1] + r[3] / 2); ctx.scale(k, k); ctx.translate(-c[0], -c[1]); whyDenseDraw(ctx, 'A', n, WDN.max); ctx.restore();
}

// "inside another integral?": a volume whose particles glow, so light is given off all along the ray. One bit at a time:
// where it is given off, it pulses; from there to the sensor a synced point scans the integral (on the plot, the area
// under σ from that point on; on the ray, that bit of light, dimming as it goes); then a little further along, again.
// In its own units, w by h: the plot's axis from x0 to x1 at py, σ = 0.5 at ph over it; the volume about by, bR either
// side; the sensor at sx. n: emission points along the ray; pulse, hold: seconds; speed: seconds per section scanned.
const QCE = { w: 700, h: 440, x0: 70, x1: 590, py: 170, ph: 120, by: 318, bR: 62, sx: 640, n: 8, pulse: 0.35, speed: 0.7, hold: 0.5, glow: 70, seed: 9173 };
const QCE_END = 2 + ((QCE.sx - 15 * 0.45 - QCE.x1) / (QCE.x1 - QCE.x0)) * 2;   // the sensor's face, in the same units as u (past 2: no volume)
const qceSig = (u) => 0.22 + 0.2 * Math.exp(-(((u - 0.55) / 0.3) ** 2)) + 0.12 * Math.exp(-(((u - 1.5) / 0.32) ** 2));   // σ along the ray, u from 0 to 2
let qceTab = null;
function qceTables() {
  if (qceTab) return qceTab;
  const N = 400, F = new Float64Array(N + 1);   // ∫σ from 0, on a grid
  for (let i = 0; i < N; i++) F[i + 1] = F[i] + qceSig(((i + 0.5) / N) * 2) * (2 / N);
  const at = (u) => { const f = clamp(u / 2, 0, 1) * N, i = Math.min(N - 1, Math.floor(f)); return lerp(F[i], F[i + 1], f - i); };
  const rnd = rng32(QCE.seed), dots = [];   // the glowing particles, more of them where σ is higher
  while (dots.length < QCE.glow) { const u = rnd() * 2; if (rnd() * 0.45 < qceSig(u)) dots.push({ u, y: (rnd() * 2 - 1) * 0.78 * QCE.bR, r: 2.4 + 2 * rnd(), ph: rnd() * 6.283, w: 1.1 + 1.4 * rnd() }); }
  const steps = []; let t0 = 0;   // when each emission point's pulse, scan and hold begin
  for (let k = 0; k < QCE.n; k++) { const t = (2 * k) / QCE.n, d = QCE.pulse + QCE.speed * (QCE_END - t) + QCE.hold; steps.push({ t, s: t0, d }); t0 += d; }
  return (qceTab = { at, dots, steps, P: t0 });
}
// Where the loop is at time s (null: the still one, for reduced motion): the emission point t, how far the scan has got
// (u), and how far into the pulse and the hold
function qceAt(s) {
  const T = qceTables();
  if (s == null) return { t: 0.75, u: QCE_END, pulse: 1, hold: 0 };   // (the fourth point, its scan done)
  const m = ((s % T.P) + T.P) % T.P, S = T.steps.find((q) => m < q.s + q.d) || T.steps[T.steps.length - 1], e = m - S.s;
  const scan = clamp((e - QCE.pulse) / (QCE.speed * (QCE_END - S.t)), 0, 1);
  return { t: S.t, u: lerp(S.t, QCE_END, scan), pulse: clamp(e / QCE.pulse, 0, 1), hold: clamp((e - QCE.pulse - QCE.speed * (QCE_END - S.t)) / QCE.hold, 0, 1) };
}
function qcEmit(ctx, r, a) {
  const E = QCE, T = qceTables(), k = Math.min(r[2] / E.w, r[3] / E.h), X = (u) => E.x0 + (u / 2) * (E.x1 - E.x0), Y = (s) => E.py - (s / 0.5) * E.ph;
  const P = qceAt(reduced ? null : TIME - (PS.qc[1].t0 || 0)), fade = 1 - smooth(P.hold), Tr = (u) => Math.exp(-2 * (T.at(u) - T.at(P.t)));   // Tr: what is left of the bit of light by u
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(r[0] + (r[2] - E.w * k) / 2, r[1] + (r[3] - E.h * k) / 2); ctx.scale(k, k);
  // the plot: σ along the ray, the area under it faint, and brighter from the emission point to where the scan is
  const area = (u0, u1, alpha) => {
    if (u1 - u0 < 1e-3 || alpha <= 0.003) return;
    ctx.beginPath(); ctx.moveTo(X(u0), E.py);
    for (let i = 0; i <= 60; i++) { const u = lerp(u0, u1, i / 60); ctx.lineTo(X(u), Y(qceSig(u))); }
    ctx.lineTo(X(u1), E.py); ctx.closePath(); ctx.fillStyle = hexA(COL.yellow, alpha); ctx.fill();
  };
  const up = Math.min(P.u, 2);   // (the scan of the integral ends with the volume; the light goes on to the sensor)
  area(0, 2, 0.16); area(P.t, up, 0.5 * fade);
  ctx.save(); ctx.strokeStyle = COL.greyB; ctx.fillStyle = COL.greyB; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(E.x0, E.py - E.ph - 18); ctx.lineTo(E.x0, E.py); ctx.lineTo(E.x1 + 22, E.py); ctx.stroke();
  for (const [x, y, dx, dy] of [[E.x0, E.py - E.ph - 30, 0, 1], [E.x1 + 34, E.py, -1, 0]]) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 14 * dx - 7 * dy, y + 14 * dy - 7 * dx); ctx.lineTo(x + 14 * dx + 7 * dy, y + 14 * dy + 7 * dx); ctx.closePath(); ctx.fill(); }
  ctx.restore();
  ctx.save(); ctx.strokeStyle = COL.yellow; ctx.lineWidth = 3.5; ctx.lineJoin = 'round'; ctx.beginPath();
  for (let i = 0; i <= 120; i++) { const u = (2 * i) / 120; if (i) ctx.lineTo(X(u), Y(qceSig(u))); else ctx.moveTo(X(u), Y(qceSig(u))); }
  ctx.stroke(); ctx.restore();
  drawTex(ctx, String.raw`\sigma`, E.x0 - 24, E.py - E.ph - 22, 34, { color: COL.yellow });
  drawTex(ctx, 'x', E.x1 + 56, E.py, 34, { color: LDCOL });
  // the volume, the ray through it, and its particles, glowing
  varyBand(ctx, X(0), X(2), E.by, E.bR, (q) => 0.8 * VFOG.a(qceSig(2 * q)));
  ctx.save(); ctx.strokeStyle = hexA(COL.greyC, 0.6); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X(0) - 20, E.by); ctx.lineTo(E.sx - 8, E.by); ctx.stroke(); ctx.restore();
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const d of T.dots) {
    const b = reduced ? 0.8 : 0.55 + 0.45 * Math.sin(TIME * d.w + d.ph), x = X(d.u), y = E.by + d.y;
    const g = ctx.createRadialGradient(x, y, 0, x, y, d.r * 4); g.addColorStop(0, hexA(SH.color, 0.32 * b)); g.addColorStop(1, hexA(SH.color, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, d.r * 4, 0, Math.PI * 2); ctx.fill();
    dot(ctx, x, y, d.r * 0.6, '#D8FFE4', 0.6 * b);
  }
  ctx.restore();
  // the bit of light given off at t: it pulses, then goes to the sensor, dimming as it goes; the synced point over it
  const xt = X(P.t), xu = X(P.u);
  if (P.pulse < 1) { ctx.save(); ctx.strokeStyle = hexA(SH.color, 1 - P.pulse); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(xt, E.by, 8 + 28 * P.pulse, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
  if (P.u > P.t + 1e-3 && fade > 0.003) {
    const g = ctx.createLinearGradient(xt, 0, xu, 0);
    for (let i = 0; i <= 8; i++) g.addColorStop(i / 8, hexA(SH.color, 0.9 * fade * Tr(lerp(P.t, P.u, i / 8))));
    ctx.save(); ctx.strokeStyle = g; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(xt, E.by); ctx.lineTo(xu, E.by); ctx.stroke(); ctx.restore();
  }
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const glowAt = (x, b, rr) => { const g = ctx.createRadialGradient(x, E.by, 0, x, E.by, rr); g.addColorStop(0, hexA(SH.color, b)); g.addColorStop(1, hexA(SH.color, 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, E.by, rr, 0, Math.PI * 2); ctx.fill(); };
  glowAt(xt, 0.9 * fade, 30); if (P.u > P.t + 1e-3) glowAt(xu, fade * Tr(P.u), 30);
  ctx.restore();
  dot(ctx, xt, E.by, 6, '#EFFFF3', fade);
  if (P.u > P.t + 1e-3 && fade > 0.003) {
    const sy = Y(qceSig(up)), xp = X(up);
    if (P.u <= 2) dashed(ctx, xp, sy + 11, xp, E.by - 12, COL.greyA, 0.85 * fade, 2.5);
    dot(ctx, xp, sy, 7.5, COL.white, fade);
  }
  // the sensor: lit by the bit of light as it arrives, as much as is left of it
  ctx.save(); ctx.translate(E.sx, E.by); ctx.scale(0.45, 0.45); drawSensor(ctx, 0, 0, SH.color, P.u >= QCE_END - 1e-3 ? Tr(2) * fade : 0); ctx.restore();
  ctx.restore();
}
QCARDS[0].draw = qcVary;
QCARDS[1].draw = qcEmit;
QCARDS[2].draw = qcExp;
