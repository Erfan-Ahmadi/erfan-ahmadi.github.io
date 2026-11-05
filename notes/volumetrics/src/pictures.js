// ---------- pictures for the presentation ----------
// The two ends of beat 15's spectrum, a physics lecture's chalkboard and a raymarcher with its code, and the fields in
// beats 17–19 that use the same equation: starlight through dust, sunlight through the air, X-rays through a body.
// Each draws into a rectangle in stage units, in its own units inside it, and only multiplies the opacity it is given.

// ---- a physics lecture: a chalkboard of scribbles and sketches, nothing on it meant to be read ----
const CHALK = '#E4E1D8';
// Fake handwriting: loops along a line, in words of different lengths.
function chalkWriting(ctx, x, y, w, seed) {
  const rnd = rng32(seed);
  let t = 0;
  ctx.beginPath();
  while (t < w) {
    const len = lerp(18, 64, rnd()), amp = lerp(4, 7, rnd()), f = lerp(0.7, 1.05, rnd()), ph = rnd() * 6.28;
    for (let u = 0; u <= len; u += 1.5) {
      const px = x + t + u + 2.6 * Math.cos(u * f + ph), py = y - amp * Math.abs(Math.sin(u * f * 0.5 + ph)) * (0.7 + 0.3 * Math.sin(u * 0.21));
      u ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    t += len + lerp(10, 18, rnd());
  }
  ctx.stroke();
}
function drawChalkboard(ctx, r, a) {
  if (a <= 0.003) return;
  const s = r[2] / 470, h = r[3] / s;
  ctx.save(); ctx.translate(r[0], r[1]); ctx.scale(s, s); ctx.globalAlpha *= a;
  ctx.fillStyle = '#4A3828'; ctx.beginPath(); ctx.roundRect(-12, -12, 494, h + 24, 10); ctx.fill();   // the frame
  ctx.fillStyle = '#21302A'; ctx.beginPath(); ctx.roundRect(0, 0, 470, h, 3); ctx.fill();               // the slate
  ctx.fillStyle = 'rgba(255,255,255,0.04)';                                                             // old eraser swipes
  for (const [x, y, rx, ry, t] of [[150, 96, 130, 24, -0.06], [320, 240, 150, 28, 0.04], [110, 318, 95, 18, 0.08]]) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, t, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = '#3B2C20'; ctx.fillRect(-18, h + 12, 506, 10);
  ctx.fillStyle = CHALK; ctx.fillRect(376, h + 5, 34, 7);
  ctx.strokeStyle = hexA(CHALK, 0.85); ctx.fillStyle = hexA(CHALK, 0.85); ctx.lineWidth = 2.6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  // lines of "writing", some short beside the sketches
  [[28, 52, 400], [28, 98, 230], [28, 144, 250], [28, 190, 200], [28, 300, 260], [28, 344, 180]].forEach(([x, y, w], i) => chalkWriting(ctx, x, y, w, 71 + i * 13));
  // a ray meets a particle and leaves turned
  const cx = 360, cy = 118, t = -0.62, ux = Math.cos(t), uy = Math.sin(t);
  ctx.beginPath(); ctx.arc(cx, cy, 13, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - 80, cy); ctx.lineTo(cx - 18, cy); ctx.stroke(); arrowTip(ctx, cx - 40, cy, 1, 0, 12, 6);
  ctx.beginPath(); ctx.moveTo(cx + 16 * ux, cy + 16 * uy); ctx.lineTo(cx + 66 * ux, cy + 66 * uy); ctx.stroke(); arrowTip(ctx, cx + 70 * ux, cy + 70 * uy, ux, uy, 12, 6);
  ctx.beginPath(); ctx.arc(cx, cy, 40, t, 0); ctx.stroke();
  // a little plot of something falling off
  const gx = 300, gy = 300, gw = 140, gh = 80;
  ctx.beginPath(); ctx.moveTo(gx, gy - gh); ctx.lineTo(gx, gy); ctx.lineTo(gx + gw, gy); ctx.stroke();
  ctx.beginPath(); for (let u = 0; u <= 1.001; u += 0.05) { const px = gx + 6 + u * (gw - 10), py = gy - 6 - (gh - 14) * Math.exp(-3 * u); u ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.stroke();
  // a wave, and a boxed scribble, the way a lecturer rings the one that matters
  ctx.beginPath(); for (let u = 0; u <= 150; u += 2) { const px = 280 + u, py = 214 + 9 * Math.sin(u * 0.13); u ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.stroke();
  ctx.beginPath(); ctx.moveTo(22, 236); ctx.lineTo(236, 232); ctx.moveTo(232, 228); ctx.lineTo(236, 272); ctx.moveTo(240, 270); ctx.lineTo(20, 274); ctx.moveTo(24, 278); ctx.lineTo(22, 230); ctx.stroke();
  chalkWriting(ctx, 34, 260, 180, 211);
  ctx.restore();
}

// ---- a shader tutorial: a ray marched through a volume, and the loop that does it ----
// The eye's ray steps through a grid of voxels with a cloud in it; at each step the light that is left (T) is
// multiplied down, so the ray dims as it goes, and the current sample looks toward the light.
const RM = { x0: 150, dx: 29, n: 9, period: 0.9 };
const RM_BLOBS = [[235, 0.5, 46], [292, 0.36, 40], [318, 0.62, 52], [372, 0.45, 38], [262, 0.7, 30]];
const rmDensity = (x, y, h) => RM_BLOBS.reduce((s, [bx, by, br]) => s + Math.exp(-((x - bx) ** 2 + (y - by * h) ** 2) / (2 * (br * 0.6) ** 2)), 0);
function drawEyeIcon(ctx, x, y, dir, a) {   // the effect tiles' eye, looking along dir (+1 right, −1 left)
  ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = COL.greyB; ctx.lineWidth = 3; ctx.fillStyle = BG;
  ctx.beginPath(); ctx.moveTo(x - 37, y); ctx.quadraticCurveTo(x, y - 32, x + 37, y); ctx.quadraticCurveTo(x, y + 32, x - 37, y); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = COL.blue; ctx.beginPath(); ctx.arc(x + 7 * dir, y, 11, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(x + 9 * dir, y, 5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
function drawRaymarch(ctx, r, a, t) {
  if (a <= 0.003) return;
  const s = r[2] / 470, h = r[3] / s, cy = h / 2, { x0, dx, n } = RM, x1 = x0 + dx * n, y0 = 24, y1 = h - 24;
  ctx.save(); ctx.translate(r[0], r[1]); ctx.scale(s, s); ctx.globalAlpha *= a;
  ctx.fillStyle = '#141311'; ctx.strokeStyle = COL.greyD; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(0, 0, 470, h, 10); ctx.fill(); ctx.stroke();
  // the voxels, and the cloud in them
  ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, x1 - x0, y1 - y0); ctx.clip();
  for (const [bx, by, br] of RM_BLOBS) {
    const g = ctx.createRadialGradient(bx, by * h, 0, bx, by * h, br * 1.4);
    g.addColorStop(0, 'rgba(238,234,226,0.3)'); g.addColorStop(1, 'rgba(238,234,226,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(bx, by * h, br * 1.4, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  ctx.strokeStyle = hexA(COL.greyC, 0.45); ctx.lineWidth = 1; ctx.beginPath();
  for (let x = x0; x <= x1 + 0.5; x += dx) { ctx.moveTo(x, y0); ctx.lineTo(x, y1); }
  for (let k = 0, m = 6; k <= m; k++) { const y = lerp(y0, y1, k / m); ctx.moveTo(x0, y); ctx.lineTo(x1, y); }
  ctx.stroke();
  // the light, up and to the right
  const lx = 446, ly = 30, sg = ctx.createRadialGradient(lx, ly, 0, lx, ly, 26);
  sg.addColorStop(0, hexA(COL.yellow, 0.5)); sg.addColorStop(1, hexA(COL.yellow, 0));
  ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(lx, ly, 26, 0, Math.PI * 2); ctx.fill(); dot(ctx, lx, ly, 8, COL.yellow);
  // the ray, as bright as the light left along it
  const T = [1]; for (let i = 0; i < n; i++) T.push(T[i] * Math.exp(-0.5 * rmDensity(x0 + dx * (i + 0.5), cy, h)));
  const cur = reduced ? n - 1 : Math.floor(Math.max(0, t) / RM.period) % (n + 2);   // two beats of rest after the last sample
  ctx.lineCap = 'round'; ctx.lineWidth = 3;
  ctx.strokeStyle = hexA(COL.greyA, 0.9); ctx.beginPath(); ctx.moveTo(92, cy); ctx.lineTo(x0, cy); ctx.stroke();
  for (let i = 0; i < n; i++) { ctx.strokeStyle = hexA(COL.greyA, 0.9 * T[i + 1] + 0.08); ctx.beginPath(); ctx.moveTo(x0 + dx * i, cy); ctx.lineTo(x0 + dx * (i + 1), cy); ctx.stroke(); }
  ctx.fillStyle = hexA(COL.greyA, 0.9 * T[n] + 0.08); arrowTip(ctx, x1 + 22, cy, 1, 0, 14, 6);
  // the samples: done ones filled, the current one lit and looking toward the light
  for (let i = 0; i < n; i++) {
    const x = x0 + dx * (i + 0.5);
    if (i === cur) {
      ctx.save(); ctx.strokeStyle = hexA(COL.yellow, 0.7); ctx.lineWidth = 2; ctx.setLineDash([4, 6]); ctx.beginPath(); ctx.moveTo(x, cy); ctx.lineTo(lx, ly); ctx.stroke(); ctx.restore();
      dot(ctx, x, cy, 7, COL.yellow);
    } else if (i < cur) dot(ctx, x, cy, 4.5, COL.greyB);
    else { ctx.strokeStyle = hexA(COL.greyB, 0.7); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, cy, 4.5, 0, Math.PI * 2); ctx.stroke(); }
  }
  drawEyeIcon(ctx, 52, cy, 1, 1);
  ctx.restore();
}
// The loop, typed in as p goes 0 → 1, then with its body's lines lit one after another, in step with the samples.
const RM_CODE = ['float T = 1.0;', 'for (int i = 0; i < N; i++) {', '    vec3 p = ro + t * rd;', '    T *= exp(-sigma(p) * dt);', '    t += dt;', '}'];
const RM_TOK = /(\s+)|(\b(?:float|int|vec3|for)\b)|(\b(?:exp|sigma)\b)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_]\w*)|(.)/g;
function drawCodePanel(ctx, r, a, p, t) {
  if (a <= 0.003) return;
  const s = r[2] / 470, h = r[3] / s;
  ctx.save(); ctx.translate(r[0], r[1]); ctx.scale(s, s); ctx.globalAlpha *= a;
  ctx.fillStyle = '#141311'; ctx.strokeStyle = COL.greyD; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(0, 0, 470, h, 10); ctx.fill(); ctx.stroke();
  [COL.red, COL.yellow, COL.green].forEach((c, i) => dot(ctx, 22 + 18 * i, 20, 5, c, 0.7));
  const lh = 22.5, top = 46, left = 20, total = RM_CODE.reduce((s2, l) => s2 + l.length, 0);
  let left2 = Math.floor(clamp(p, 0, 1) * total + 1e-6);
  // the line being run
  const k = Math.floor(Math.max(0, t) / RM.period) % (RM.n + 2);
  if (p >= 1 && !reduced && k < RM.n) {
    const line = 2 + Math.min(2, Math.floor(((Math.max(0, t) % RM.period) / RM.period) * 3));
    ctx.fillStyle = hexA(COL.yellow, 0.13); ctx.fillRect(8, top + lh * line - lh * 0.72, 454, lh);
  }
  ctx.font = '500 18px "JetBrains Mono", ui-monospace, monospace'; ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
  const cw = ctx.measureText('m').width;
  RM_CODE.forEach((line, i) => {
    if (left2 <= 0) return;
    const shown = line.slice(0, left2); left2 -= line.length;
    let x = left, m;
    RM_TOK.lastIndex = 0;
    while ((m = RM_TOK.exec(shown))) {
      const c = m[1] ? null : m[2] ? COL.lavender : m[3] ? COL.blue : m[4] ? COL.gold : m[5] ? COL.greyA : COL.grey;
      if (c) { ctx.fillStyle = c; ctx.fillText(m[0], x, top + lh * i); }
      x += cw * m[0].length;
    }
  });
  ctx.restore();
}

// ---- the fields: photons crossing some stuff ----
// A handful of photons, each on a straight leg. In a step through the stuff one may be absorbed (it fades where it
// is) or scattered (it turns to a random direction and carries on); one that reaches a receiver stops there.
const newSpecks = (seed) => ({ list: [], acc: 0, rnd: rng32(seed) });
function stepSpecks(P, dt, o) {
  if (dt <= 0) return;
  P.acc += dt * o.rate;
  while (P.acc >= 1) { P.acc -= 1; const q = o.spawn(P.rnd); P.list.push(Object.assign({ s: 0, die: -1, scat: 0 }, q)); }
  for (const q of P.list) {
    if (q.die >= 0) { q.die += dt; continue; }
    const step = o.speed * dt, n = Math.max(1, Math.ceil(step / 3)), ds = step / n;
    for (let k = 0; k < n; k++) {
      q.x += q.dx * ds; q.y += q.dy * ds; q.s += ds;
      if (o.hit && o.hit(q)) { q.die = 0; q.hit = 1; if (o.onHit) o.onHit(q); break; }
      const [sa, ss] = o.ext(q.x, q.y, q);
      if (sa > 0 && P.rnd() < sa * ds) { q.die = 0; break; }
      if (ss > 0 && P.rnd() < ss * ds) { const t = P.rnd() * Math.PI * 2; q.dx = Math.cos(t); q.dy = Math.sin(t); q.s = 0; q.scat++; }
    }
  }
  const [x0, y0, x1, y1] = o.bounds;
  P.list = P.list.filter((q) => (q.die < 0 ? q.x > x0 && q.x < x1 && q.y > y0 && q.y < y1 : q.die < 0.45));
}
function drawSpecks(ctx, P, { r = 4, trail = 28 } = {}) {
  ctx.save(); ctx.lineCap = 'round';
  for (const q of P.list) {
    const f = q.die < 0 ? 1 : 1 - q.die / 0.45; if (f <= 0) continue;
    const L = Math.min(trail, q.s);
    if (L > 1 && q.die < 0) { ctx.strokeStyle = hexA(q.c, 0.32); ctx.lineWidth = r * 1.2; ctx.beginPath(); ctx.moveTo(q.x - q.dx * L, q.y - q.dy * L); ctx.lineTo(q.x, q.y); ctx.stroke(); }
    dot(ctx, q.x, q.y, r * (q.die < 0 ? 1 : 1 + 0.9 * (1 - f)), q.c, q.die < 0 ? 1 : 0.85 * f);
  }
  ctx.restore();
}
// The first frame a card shows, its photons are already on their way.
function warmSpecks(P, o, fresh) { if (fresh && !reduced) { P.list.length = 0; for (let k = 0; k < 40; k++) stepSpecks(P, 0.08, o); } }

// ---- astronomy: starlight through interstellar dust, to a telescope ----
const STARFIELD = (() => { const r = rng32(4242), out = []; for (let i = 0; i < 90; i++) out.push([r() * 700, r(), lerp(0.6, 1.9, r() ** 2), lerp(0.25, 0.85, r()), r() * 6.283]); return out; })();
const DUST = [[330, 0.48, 95, 0.9], [395, 0.36, 70, 0.7], [290, 0.64, 70, 0.6], [420, 0.62, 85, 0.75], [352, 0.27, 55, 0.5], [255, 0.4, 50, 0.45]];
const dustAt = (x, y, h) => DUST.reduce((s, [bx, by, br, w]) => s + w * Math.exp(-((x - bx) ** 2 + (y - by * h) ** 2) / (2 * (br * 0.55) ** 2)), 0);
const SPK_STARS = newSpecks(11);
function drawTelescope(ctx, x, y) {   // its aperture at (x, y), looking left
  ctx.save(); ctx.fillStyle = BODY; ctx.strokeStyle = COL.greyB; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x + 56, y + 14); ctx.lineTo(x + 30, y + 96); ctx.moveTo(x + 56, y + 14); ctx.lineTo(x + 58, y + 100); ctx.moveTo(x + 56, y + 14); ctx.lineTo(x + 86, y + 96); ctx.stroke();
  ctx.beginPath(); ctx.roundRect(x + 10, y - 14, 92, 28, 4); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.roundRect(x, y - 19, 18, 38, 3); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.roundRect(x + 102, y - 6, 16, 12, 2); ctx.fill(); ctx.stroke();
  ctx.restore();
}
function drawUseStars(ctx, dt, h, fresh) {
  const cy = h / 2, sx = 72, tx = 560;
  ctx.fillStyle = '#0F1015'; ctx.fillRect(0, 0, 700, h);
  for (const [x, y, rr, b, ph] of STARFIELD) dot(ctx, x, y * h, rr, '#DCE3EE', b * (reduced ? 0.85 : 0.72 + 0.28 * Math.sin(TIME * 1.6 + ph)));
  // the dust
  for (const [bx, by, br, w] of DUST) {
    const g = ctx.createRadialGradient(bx, by * h, 0, bx, by * h, br);
    g.addColorStop(0, `rgba(156,102,66,${0.62 * w})`); g.addColorStop(0.6, `rgba(124,80,54,${0.28 * w})`); g.addColorStop(1, 'rgba(124,80,54,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(bx, by * h, br, 0, Math.PI * 2); ctx.fill();
  }
  // the line of sight, dimmer past the dust
  ctx.save(); ctx.lineWidth = 2; ctx.lineCap = 'round';
  let tau = 0; const N = 60;
  for (let i = 0; i < N; i++) {
    const xa = lerp(sx + 14, tx, i / N), xb = lerp(sx + 14, tx, (i + 1) / N);
    tau += 0.0044 * dustAt((xa + xb) / 2, cy, h) * (xb - xa);
    ctx.strokeStyle = `rgba(255,241,208,${0.3 * Math.exp(-tau)})`; ctx.beginPath(); ctx.moveTo(xa, cy); ctx.lineTo(xb, cy); ctx.stroke();
  }
  ctx.restore();
  // the star
  const sg = ctx.createRadialGradient(sx, cy, 0, sx, cy, 70);
  sg.addColorStop(0, 'rgba(255,246,223,0.6)'); sg.addColorStop(1, 'rgba(255,246,223,0)');
  ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(sx, cy, 70, 0, Math.PI * 2); ctx.fill();
  ctx.save(); ctx.strokeStyle = 'rgba(255,246,223,0.55)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(sx - 38, cy); ctx.lineTo(sx + 38, cy); ctx.moveTo(sx, cy - 38); ctx.lineTo(sx, cy + 38); ctx.stroke(); ctx.restore();
  dot(ctx, sx, cy, 10, '#FFF6DF');
  // its light on the way
  const o = {
    rate: 7, speed: 210, bounds: [-20, -20, 720, h + 20],
    spawn: (rnd) => { const t = (rnd() - 0.5) * 0.05; return { x: sx + 14, y: cy + (rnd() - 0.5) * 8, dx: Math.cos(t), dy: Math.sin(t), c: '#FFF1D0' }; },
    ext: (x, y) => { const d = dustAt(x, y, h); return [0.002 * d, 0.0024 * d]; },
    hit: (q) => q.x >= tx && Math.abs(q.y - cy) <= 19,
  };
  warmSpecks(SPK_STARS, o, fresh); stepSpecks(SPK_STARS, dt, o);
  if (!reduced) drawSpecks(ctx, SPK_STARS, { r: 3.6, trail: 24 });
  drawTelescope(ctx, tx, cy);
}

// ---- climate science: sunlight through our atmosphere ----
// Bluer light scatters more in the air, so most of what turns away is blue; the rest reaches the ground.
const SPK_SKY = newSpecks(12);
function drawUseSky(ctx, dt, h, fresh) {
  const ex = 1000, ey = h * 0.6, R = 520, A = 64, sx = 66, sy = h * 0.6;
  ctx.fillStyle = '#0F1116'; ctx.fillRect(0, 0, 700, h);
  // the air: thickest at the ground, gone a little way up
  const g = ctx.createRadialGradient(ex, ey, R, ex, ey, R + A);
  g.addColorStop(0, 'rgba(116,166,234,0.5)'); g.addColorStop(0.45, 'rgba(116,166,234,0.17)'); g.addColorStop(1, 'rgba(116,166,234,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(ex, ey, R + A, 0, Math.PI * 2); ctx.fill();
  // the ground, lit from the sun's side
  const gg = ctx.createLinearGradient(ex - R, 0, 700, 0); gg.addColorStop(0, '#2C5677'); gg.addColorStop(1, '#14202B');
  ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(ex, ey, R, 0, Math.PI * 2); ctx.fill();
  ctx.save(); ctx.strokeStyle = 'rgba(170,205,240,0.55)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(ex, ey, R, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  // the sun
  const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, 130);
  sg.addColorStop(0, hexA(COL.yellow, 0.45)); sg.addColorStop(1, hexA(COL.yellow, 0));
  ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(sx, sy, 130, 0, Math.PI * 2); ctx.fill();
  dot(ctx, sx, sy, 38, '#FFD98A');
  // sunlight on the way: one photon in three bluish
  const dist = (q) => Math.hypot(q.x - ex, q.y - ey);
  const o = {
    rate: 10, speed: 230, bounds: [-20, -20, 720, h + 20],
    spawn: (rnd) => {
      const ty = lerp(0.12, 0.96, rnd()) * h, tx2 = ex - Math.sqrt(Math.max(0, (R + 20) ** 2 - (ty - ey) ** 2));
      const dx = tx2 - sx, dy = ty - sy, L = Math.hypot(dx, dy), blue = rnd() < 0.34;
      return { x: sx + (dx / L) * 44, y: sy + (dy / L) * 44, dx: dx / L, dy: dy / L, c: blue ? '#9EC3F2' : '#FFE7B0', blue };
    },
    ext: (x, y, q) => { const d = Math.hypot(x - ex, y - ey) - R; if (d > A || d < 0) return [0, 0]; const rho = Math.exp(-d / 22); return [0.0015 * rho, (q.blue ? 0.034 : 0.006) * rho]; },
    hit: (q) => dist(q) < R,
  };
  warmSpecks(SPK_SKY, o, fresh); stepSpecks(SPK_SKY, dt, o);
  if (!reduced) drawSpecks(ctx, SPK_SKY, { r: 3.6, trail: 24 });
}

// ---- medical imaging: X-rays through a body, onto a detector ----
// The body is me, the stick figure, standing in the X-rays, its strokes thickened into a body that absorbs them. The
// detector shows how much of each ray gets through, the line integral along it; photons that arrive flash where they
// land. It doesn't have to be exact.
const XR = { fx: 98, dx0: 604, half: 165, n: 66, me: [452, 112, 0.95], body: 16, sigma: 0.05 };   // me: x, feet below the centre line, scale
const XR_GRID = { h: 0 };
function xrayGrid(h) {   // the body drawn at half resolution, so asking how dense it is somewhere is one lookup
  if (XR_GRID.h === h) return XR_GRID;
  const w = 350, gh = Math.ceil(h / 2), c = document.createElement('canvas'); c.width = w; c.height = gh;
  const g = c.getContext('2d'), [mx, my, ms] = XR.me;
  g.scale(0.5, 0.5); g.lineWidth = XR.body; g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = '#fff';
  traceFigure(g, mx, h / 2 + my, ms); g.stroke();
  const d = g.getImageData(0, 0, w, gh).data, a = new Float32Array(w * gh);
  for (let i = 0; i < w * gh; i++) a[i] = d[4 * i + 3] / 255;
  return Object.assign(XR_GRID, { h, w, gh, a });
}
function xrayDensity(x, y, h) {
  const G = xrayGrid(h), i = Math.floor(x / 2), j = Math.floor(y / 2);
  return i < 0 || j < 0 || i >= G.w || j >= G.gh ? 0 : XR.sigma * G.a[j * G.w + i];
}
const XR_CACHE = { h: 0, T: null };
function xrayProfile(h) {
  if (XR_CACHE.h === h) return XR_CACHE.T;
  const cy = h / 2, T = new Float64Array(XR.n);
  for (let b = 0; b < XR.n; b++) {
    const y = cy - XR.half + ((b + 0.5) / XR.n) * 2 * XR.half, L = Math.hypot(XR.dx0 - XR.fx, y - cy), m = 400;
    let tau = 0; for (let k = 0; k < m; k++) { const u = (k + 0.5) / m; tau += xrayDensity(lerp(XR.fx, XR.dx0, u), lerp(cy, y, u), h) * (L / m); }
    T[b] = Math.exp(-tau);
  }
  return Object.assign(XR_CACHE, { h, T }).T;
}
const SPK_XRAY = newSpecks(13), XR_FLASH = [];
function drawUseXray(ctx, dt, h, fresh) {
  const cy = h / 2, { fx, dx0, half } = XR, [mx, my, ms] = XR.me;
  ctx.fillStyle = '#111317'; ctx.fillRect(0, 0, 700, h);
  // the fan of rays
  ctx.save(); ctx.fillStyle = 'rgba(170,200,255,0.05)'; ctx.beginPath(); ctx.moveTo(fx, cy); ctx.lineTo(dx0, cy - half); ctx.lineTo(dx0, cy + half); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(170,200,255,0.25)'; ctx.lineWidth = 1.5; ctx.setLineDash([6, 8]); ctx.beginPath(); ctx.moveTo(fx, cy); ctx.lineTo(dx0, cy - half); ctx.moveTo(fx, cy); ctx.lineTo(dx0, cy + half); ctx.stroke(); ctx.restore();
  // me, in the way: the body the X-rays cross, and my strokes over it
  ctx.save(); ctx.strokeStyle = 'rgba(214,170,150,0.24)'; ctx.lineWidth = XR.body; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  traceFigure(ctx, mx, cy + my, ms); ctx.stroke(); ctx.restore();
  drawFigure(ctx, mx, cy + my, ms, 1);
  // the tube
  ctx.save(); ctx.fillStyle = BODY; ctx.strokeStyle = COL.greyB; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.roundRect(24, cy - 38, 70, 76, 8); ctx.fill(); ctx.stroke();
  ctx.fillStyle = NOZZLE; ctx.beginPath(); ctx.roundRect(88, cy - 12, 12, 24, 3); ctx.fill(); ctx.stroke(); ctx.restore();
  // the X-rays on the way
  const o = {
    rate: 18, speed: 280, bounds: [-20, -20, 720, h + 20],
    spawn: (rnd) => { const t = (rnd() * 2 - 1) * Math.atan(half / (dx0 - fx)) * 0.98; return { x: fx + 4, y: cy, dx: Math.cos(t), dy: Math.sin(t), c: '#C4DAFF' }; },
    ext: (x, y) => [xrayDensity(x, y, h), 0],
    hit: (q) => q.x >= dx0,
    onHit: (q) => { if (!fresh) XR_FLASH.push([q.y, 0]); },
  };
  warmSpecks(SPK_XRAY, o, fresh); stepSpecks(SPK_XRAY, dt, o);
  if (!reduced) drawSpecks(ctx, SPK_XRAY, { r: 3.2, trail: 22 });
  // the detector: how much of each ray gets through
  const T = xrayProfile(h), bh = (2 * half) / XR.n;
  ctx.save(); ctx.fillStyle = BODY; ctx.strokeStyle = COL.greyB; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.roundRect(dx0, cy - half - 8, 34, 2 * half + 16, 4); ctx.fill(); ctx.stroke();
  for (let b = 0; b < XR.n; b++) { ctx.fillStyle = `rgba(225,236,255,${0.04 + 0.92 * T[b] ** 0.8})`; ctx.fillRect(dx0 + 4, cy - half + b * bh, 22, bh + 0.5); }
  for (let i = XR_FLASH.length - 1; i >= 0; i--) {
    const f = XR_FLASH[i]; f[1] += dt;
    if (f[1] > 0.5) { XR_FLASH.splice(i, 1); continue; }
    dot(ctx, dx0 + 15, f[0], 5 + 6 * f[1], '#E8F0FF', 0.8 * (1 - f[1] / 0.5));
  }
  ctx.restore();
}

// ---- this video: a laser, a box of stuff and a sensor, the bench's laser and tank with the box closed ----
// What is in the box: PS.boxQ runs through BOXSTUFF, one press each in beats 20b–20h (fog, a cloud, smoke, a block
// of tinted glass, coffee, beer) and back to plain stuff. The beam dims across the box by however much its contents
// take.
const BOXG = { x0: 180, x1: 760, top: -200, bot: 200, xs: 980, cx: 470 };
const BOXSTUFF = ['stuff', 'fog', 'cloud', 'smoke', 'glass', 'coffee', 'beer', 'stuff'];
const BOXSIG = { stuff: 0.0019, fog: 0.0024, cloud: 0.006, smoke: 0.003, glass: 0.0022, coffee: 0.005, beer: 0.0016 };
const BOXFILL = { coffee: 0.6, beer: 0.8 };
const BOXPUFFS = PUFFS.map(([dx, dy, r]) => [BOXG.cx + dx * 470, -10 + dy * 400, r * 430]);
const BOXSPECKS = Array.from({ length: 64 }, (_, i) => [(0.5 + i * 0.7548777) % 1, (0.5 + i * 0.5698403) % 1, (i * 2.399) % (2 * Math.PI)]);   // spread evenly (the R2 sequence)
const boxTank = { x0: BOXG.x0, x1: BOXG.x1, top: BOXG.top, bot: BOXG.bot, th: BOXG.bot - BOXG.top };
// the scene's own units into a card's (700 wide, h tall): [ox, oy, s]
function boxFit(h) {
  const x0 = -240, x1 = BOXG.xs + 60, y0 = BOXG.top - 10, y1 = BOXG.bot + 60, top = 64;
  const s = Math.min(640 / (x1 - x0), (h - top - 24) / (y1 - y0));
  return [350 - ((x0 + x1) / 2) * s, top + (h - top) / 2 - ((y0 + y1) / 2) * s, s];
}
function boxWeights(q) { const w = { stuff: 0, fog: 0, cloud: 0, smoke: 0, glass: 0, coffee: 0, beer: 0 }; BOXSTUFF.forEach((k, i) => { w[k] += clamp(1 - Math.abs(q - i), 0, 1); }); return w; }
let boxCloudCum = null;
function boxT(w) {   // transmittance from the laser to x
  if (!boxCloudCum) {   // the cloud's optical depth along the beam, 4 px at a time
    const n = Math.ceil((BOXG.x1 - BOXG.x0) / 4) + 1; boxCloudCum = new Float32Array(n);
    for (let i = 1; i < n; i++) boxCloudCum[i] = boxCloudCum[i - 1] + BOXSIG.cloud * 4 * cloudDensity(BOXG.x0 + i * 4, 0, BOXPUFFS, { cloud: 1 });
  }
  const flat = w.stuff * BOXSIG.stuff + w.fog * BOXSIG.fog + w.smoke * BOXSIG.smoke + w.glass * BOXSIG.glass + w.coffee * BOXSIG.coffee + w.beer * BOXSIG.beer;
  return (x) => {
    const d = clamp(x - BOXG.x0, 0, BOXG.x1 - BOXG.x0);
    return Math.exp(-(flat * d + w.cloud * boxCloudCum[Math.min(boxCloudCum.length - 1, Math.round(d / 4))]));
  };
}
// Soft ribbons rising from y0 to y1, for smoke and steam: each starts thin and nearly straight, then sways and curls
// more as it rises, widening and fading, the curls travelling up it. Each is a filled shape drawn three times, a wide
// faint halo to a narrow core, with its fade running up it. n of them across [xa, xb]; sway scales the curls, wide
// the width.
function drawWisps(ctx, xa, xb, y0, y1, n, rgb, alpha, sway, seed, wide = 1) {
  const H = y0 - y1, T = reduced ? 0 : TIME, N = 40, col = (a) => `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a.toFixed(3)})`;
  for (let w = 0; w < n; w++) {
    const ph = seed + w * 2.13, x0 = xa + ((w + 0.5) / n) * (xb - xa), C = [];
    for (let k = 0; k <= N; k++) {
      const t = k / N, amp = sway * (2 + 46 * t * t);
      C.push([x0 + amp * Math.sin(2 * Math.PI * (1.25 * t - 0.3 * T) + ph) + 0.45 * amp * Math.sin(2 * Math.PI * (2.6 * t - 0.5 * T) + 1.7 * ph) + sway * 22 * t * Math.sin(0.35 * T + ph), y0 - t * H]);
    }
    for (const [k, a] of [[3.4, 0.07], [1.7, 0.12], [0.55, 0.3]]) {
      const L = [], R = [];
      for (let q = 0; q <= N; q++) {
        const t = q / N, A = C[Math.max(0, q - 1)], B = C[Math.min(N, q + 1)], dx = B[0] - A[0], dy = B[1] - A[1], d = Math.hypot(dx, dy) || 1;
        const hw = wide * k * (1.2 + 15 * Math.pow(t, 1.4)), nx = -dy / d, ny = dx / d;
        L.push([C[q][0] + nx * hw, C[q][1] + ny * hw]); R.push([C[q][0] - nx * hw, C[q][1] - ny * hw]);
      }
      const g = ctx.createLinearGradient(0, y0, 0, y1);
      for (const t of [0, 0.08, 0.25, 0.5, 0.75, 1]) g.addColorStop(t, col(a * alpha * clamp(t / 0.08, 0, 1) * Math.pow(1 - t, 1.2)));
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(L[0][0], L[0][1]);
      for (const P of L) ctx.lineTo(P[0], P[1]);
      for (let q = N; q >= 0; q--) ctx.lineTo(R[q][0], R[q][1]);
      ctx.closePath(); ctx.fill();
    }
  }
}
const BOXDRAW = {
  stuff: (ctx, B) => {   // plain stuff: a haze, and specks of it drifting, in the yellow of the word "stuff"
    const g = ctx.createLinearGradient(0, B.top, 0, B.bot); g.addColorStop(0, 'rgba(170,164,152,0.09)'); g.addColorStop(1, 'rgba(170,164,152,0.15)');
    ctx.fillStyle = g; ctx.fillRect(B.x0, B.top, B.x1 - B.x0, B.bot - B.top);
    for (const [u, v, ph] of BOXSPECKS) {
      const x = B.x0 + 16 + u * (B.x1 - B.x0 - 32) + (reduced ? 0 : 6 * Math.sin(TIME * 0.9 + ph)), y = B.top + 16 + v * (B.bot - B.top - 32) + (reduced ? 0 : 6 * Math.cos(TIME * 0.7 + 1.3 * ph));
      dot(ctx, x, y, 3.6, COL.yellow, 0.62);
    }
  },
  fog: (ctx) => drawLiquid(ctx, boxTank, { fill: 1, look: 'fog' }),
  cloud: (ctx) => { drawCloud(ctx, BOXPUFFS, { cloud: 1 }); drawCloud(ctx, BOXPUFFS, { cloud: 0.8 }); },
  smoke: (ctx, B) => {   // cigarette smoke: bluish ribbons curling up, and what has risen gathering under the lid
    const g = ctx.createLinearGradient(0, B.top, 0, B.bot); g.addColorStop(0, 'rgba(176,188,204,0.16)'); g.addColorStop(0.6, 'rgba(176,188,204,0.05)'); g.addColorStop(1, 'rgba(176,188,204,0.02)');
    ctx.fillStyle = g; ctx.fillRect(B.x0, B.top, B.x1 - B.x0, B.bot - B.top);
    const w = B.x1 - B.x0;   // two thin streams, each two ribbons twisting round each other
    drawWisps(ctx, B.x0 + 0.33 * w - 8, B.x0 + 0.33 * w + 8, B.bot + 10, B.top + 14, 2, [200, 210, 224], 1, 0.9, 0.7);
    drawWisps(ctx, B.x0 + 0.66 * w - 8, B.x0 + 0.66 * w + 8, B.bot + 10, B.top + 14, 2, [200, 210, 224], 1, 0.75, 3.9);
  },
  glass: (ctx, B) => {   // a block of tinted glass filling the box, catching the light
    const g = ctx.createLinearGradient(B.x0, B.top, B.x1, B.bot); g.addColorStop(0, 'rgba(96,178,166,0.34)'); g.addColorStop(1, 'rgba(58,128,122,0.46)');
    ctx.fillStyle = g; ctx.fillRect(B.x0, B.top, B.x1 - B.x0, B.bot - B.top);
    drawGlassShine(ctx, B);
    ctx.strokeStyle = 'rgba(190,232,226,0.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(B.x0 + 9, B.top + 9, B.x1 - B.x0 - 18, B.bot - B.top - 18, 10); ctx.stroke();
  },
  coffee: (ctx, B) => {   // dark coffee, its crema on top
    const lv = B.bot - BOXFILL.coffee * (B.bot - B.top);
    const g = ctx.createLinearGradient(0, lv, 0, B.bot); g.addColorStop(0, 'rgba(96,58,32,0.95)'); g.addColorStop(1, 'rgba(44,25,13,0.97)');
    ctx.fillStyle = g; ctx.fillRect(B.x0, lv, B.x1 - B.x0, B.bot - lv);
    const c = ctx.createLinearGradient(0, lv - 2, 0, lv + 18); c.addColorStop(0, 'rgba(214,166,112,0.9)'); c.addColorStop(1, 'rgba(150,100,60,0)');
    ctx.fillStyle = c; ctx.fillRect(B.x0, lv - 2, B.x1 - B.x0, 20);
  },
  beer: (ctx, B) => {   // beer, and its head of foam
    drawLiquid(ctx, boxTank, { fill: BOXFILL.beer, look: 'beer' });
    const lv = B.bot - BOXFILL.beer * (B.bot - B.top);
    ctx.fillStyle = 'rgba(246,236,214,0.92)'; ctx.fillRect(B.x0, lv - 12, B.x1 - B.x0, 18);
    for (let x = B.x0 + 6, k = 0; x < B.x1; k++) {   // its top, a row of bubbles
      const r = 7 + 4 * Math.abs(Math.sin(k * 2.3)); ctx.beginPath(); ctx.arc(x + r * 0.6, lv - 12, r, 0, Math.PI * 2); ctx.fill(); x += r * 1.35;
    }
  },
};
// Glass catching the light: slanted bands across it, and a highlight down the inside of its left side.
function drawGlassShine(ctx, B) {
  const w = B.x1 - B.x0, h = B.bot - B.top;
  ctx.save(); ctx.beginPath(); ctx.roundRect(B.x0, B.top, w, h, 16); ctx.clip();
  ctx.save(); ctx.translate(B.x0 + 0.3 * w, B.top + h / 2); ctx.rotate(0.38);
  for (const [x, wid, a] of [[-150, 120, 0.11], [-8, 30, 0.09], [300, 70, 0.05]]) {
    const g = ctx.createLinearGradient(x, 0, x + wid, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, `rgba(255,255,255,${a})`); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(x, -h, wid, 2 * h);
  }
  ctx.restore();
  const e = ctx.createLinearGradient(0, B.top, 0, B.bot); e.addColorStop(0, 'rgba(255,255,255,0.28)'); e.addColorStop(0.5, 'rgba(255,255,255,0.05)'); e.addColorStop(1, 'rgba(255,255,255,0.18)');
  ctx.strokeStyle = e; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(B.x0 + 11, B.top + 22); ctx.lineTo(B.x0 + 11, B.bot - 22); ctx.stroke();
  ctx.restore();
}
function drawUseBox(ctx, dt, h) {
  const [ox, oy, s] = boxFit(h), B = BOXG, w = boxWeights(PS.boxQ), ga = ctx.globalAlpha;
  ctx.save(); ctx.translate(ox, oy); ctx.scale(s, s);
  ctx.save(); ctx.beginPath(); ctx.roundRect(B.x0, B.top, B.x1 - B.x0, B.bot - B.top, 16); ctx.clip();
  for (const k of ['stuff', 'fog', 'cloud', 'smoke', 'glass', 'coffee', 'beer']) { if (w[k] <= 0.003) continue; ctx.globalAlpha = ga * w[k]; BOXDRAW[k](ctx, B); }
  ctx.restore(); ctx.globalAlpha = ga;
  const T = boxT(w);
  drawBeam(ctx, 0, B.xs - 18, 0, SH.color, SH.I0, T, [B.x0, B.x1]);
  ctx.save(); ctx.strokeStyle = COL.greyA; ctx.lineWidth = 4; ctx.beginPath(); ctx.roundRect(B.x0, B.top, B.x1 - B.x0, B.bot - B.top, 16); ctx.stroke(); ctx.restore();
  drawLaser(ctx, 0, 0, SH.color, 1);
  drawSensor(ctx, B.xs, 0, SH.color, T(B.xs - 18) * SH.I0);
  ctx.restore();
}
