'use strict';
// Volumetrics video: a test bench for the video's animations, drawn the way manim draws.
// The stage is one canvas in 1080p units. TeX is laid out by KaTeX off screen and drawn glyph by glyph,
// so formulas can be written in and morphed piece by piece, like manim's Write and TransformMatchingTex.

// ---------- basics ----------
const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const SVGNS = 'http://www.w3.org/2000/svg';
const W = 1920, H = 1080;

// manim's colors
const COL = {
  white: '#FFFFFF', greyA: '#DDDDDD', greyB: '#BBBBBB', grey: '#888888', greyC: '#666666', greyD: '#444444', greyE: '#222222',
  blue: '#58C4DD', blueE: '#236B8E', green: '#83C167', yellow: '#F4D06F', gold: '#F0AC5F', goldE: '#C78D46', red: '#FC6255', lavender: '#C7C8F2',
};
const AXIS = '#C8C8C8';
function hexRgb(h) { h = String(h).replace('#', ''); if (h.length === 3) h = [...h].map((c) => c + c).join(''); const n = parseInt(h, 16) || 0; return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
const rgba = (c, a = 1) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${clamp(a, 0, 1)})`;
const hexA = (h, a = 1) => rgba(hexRgb(h), a);
const mixRgb = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const isWhite = (c) => c[0] > 250 && c[1] > 250 && c[2] > 250;

// manim's rate functions
const sigmoid = (x) => 1 / (1 + Math.exp(-x));
const SME = sigmoid(-5);
const smooth = (t) => clamp((sigmoid(10 * (t - 0.5)) - SME) / (1 - 2 * SME), 0, 1);
const linear = (t) => t;

// ---------- tweens ----------
// tween(obj, key, to, seconds) animates one number and resolves when it lands. A newer tween on the same
// number replaces the older one and starts from wherever that one got to. `instant` (used to rebuild a
// state) and reduced motion make every tween land at once.
let SPEED = 1, instant = false;
const tweens = [];
function tween(obj, key, to, dur = 1, { ease = smooth, delay = 0, tag = obj.__tag } = {}) {
  for (let i = tweens.length - 1; i >= 0; i--) if (tweens[i].obj === obj && tweens[i].key === key) tweens.splice(i, 1)[0].resolve();
  return new Promise((resolve) => {
    if (instant || reduced || (dur <= 0 && delay <= 0)) { obj[key] = to; resolve(); return; }
    tweens.push({ obj, key, from: null, to, t: -delay, dur: Math.max(1e-4, dur), ease, tag, resolve });
  });
}
const sleep = (s, tag) => tween({ v: 0 }, 'v', 1, s, { ease: linear, tag });
function stopTweens(tag) { for (let i = tweens.length - 1; i >= 0; i--) if (tweens[i].tag === tag) tweens.splice(i, 1)[0].resolve(); }
function tick(dt) {
  for (let i = 0; i < tweens.length; i++) {
    const w = tweens[i]; w.t += dt; if (w.t < 0) continue;
    if (w.from === null) w.from = w.obj[w.key] ?? 0;
    const k = Math.min(1, w.t / w.dur);
    w.obj[w.key] = lerp(w.from, w.to, w.ease(k));
    if (k >= 1) { tweens.splice(i, 1); i--; w.resolve(); }
  }
}

// ---------- Computer Modern numbers ----------
const FMAIN = 'KaTeX_Main, "Times New Roman", serif';
const cm = (px) => `400 ${px}px ${FMAIN}`;
const fmtNum = (v, dec) => { const s = Math.abs(v).toFixed(dec); return (v < 0 && Number(s) !== 0 ? '−' : '') + s; };
function drawNumber(ctx, v, x, y, { size = 48, dec = 1, suffix = '', color = COL.white, alpha = 1, align = 'left' } = {}) {
  if (alpha <= 0.003) return;
  ctx.save(); ctx.font = cm(size); ctx.textAlign = align; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = hexA(color, alpha);
  ctx.fillText(fmtNum(v, dec) + suffix, x, y); ctx.restore();
}

// ---------- TeX: KaTeX lays a formula out off screen, the canvas draws it glyph by glyph ----------
// A formula becomes a list of atoms: glyphs (a character in a KaTeX font), rules (fraction bars) and SVG
// pieces (roots, tall delimiters), in units of a 100px host font. Each atom has a key, and morphs pair
// atoms by key. {{…}} in the source (or \htmlClass{m-…}) pins a piece to the same piece in the other
// formula; \htmlClass{t-…}{…} names a term for highlights and braces.
const REF = 100;
const texHost = $('texHost');
const rng = document.createRange();
const mc = document.createElement('canvas').getContext('2d');
const ascCache = new Map(), texCache = new Map();
const fontStr = (sty, wt, px, fam) => `${sty} ${wt} ${px}px ${fam}`;
function ascentOf(sty, wt, fam) {
  const k = `${sty}|${wt}|${fam}`; let v = ascCache.get(k);
  if (v === undefined) { mc.font = fontStr(sty, wt, 100, fam); const m = mc.measureText('x'); v = (m.fontBoundingBoxAscent ?? 80) / 100; ascCache.set(k, v); }
  return v;
}
function cssColor(s) { const m = String(s).match(/[\d.]+/g) || ['255', '255', '255']; return { c: [+m[0], +m[1], +m[2]], a: m.length > 3 ? +m[3] : 1 }; }
function hash36(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); }
function prepTex(src) {
  let out = '';
  for (let i = 0; i < src.length;) {
    if (src.startsWith('{{', i)) {
      let d = 0, j = i + 2;
      for (; j < src.length; j++) { const c = src[j]; if (c === '\\') { j++; continue; } if (c === '{') d++; else if (c === '}') { if (d === 0) break; d--; } }
      if (src[j] === '}' && src[j + 1] === '}') { const inner = src.slice(i + 2, j); out += `\\htmlClass{m-${hash36(inner.trim())}}{${prepTex(inner)}}`; i = j + 2; continue; }
    }
    out += src[i++];
  }
  return out;
}
function tex(src, inline = false) {
  const key = (inline ? 'i|' : 'd|') + src; const hit = texCache.get(key); if (hit) return hit;
  const box = document.createElement('div'); box.className = 'texbox'; texHost.appendChild(box);
  try { katex.render(prepTex(src), box, { displayMode: !inline, output: 'html', throwOnError: false, strict: 'ignore', trust: (c) => c.command === '\\htmlClass' }); }
  catch (err) { box.textContent = src; }
  const atoms = [];
  const glyphs = (node, tag, terms) => {
    const s = node.nodeValue; if (!s) return;
    const cs = getComputedStyle(node.parentElement), col = cssColor(cs.color); if (col.a <= 0) return;
    const fam = cs.fontFamily, sty = cs.fontStyle, wt = cs.fontWeight, fs = parseFloat(cs.fontSize), asc = ascentOf(sty, wt, fam);
    mc.font = fontStr(sty, wt, fs, fam);
    for (let i = 0; i < s.length;) {
      const cp = s.codePointAt(i), n = cp > 0xffff ? 2 : 1, ch = s.slice(i, i + n);
      rng.setStart(node, i); rng.setEnd(node, i + n); i += n;
      if (cp === 0x200b || cp === 0xa0 || /\s/.test(ch)) continue;
      const r = rng.getBoundingClientRect(); if (r.width <= 0 && r.height <= 0) continue;
      const m = mc.measureText(ch), base = r.top + asc * fs;
      atoms.push({ k: 'g', ch, fam, sty, wt, fs, x: r.left, y: r.top, w: r.width, h: r.height, base,
        iL: r.left - m.actualBoundingBoxLeft, iR: r.left + m.actualBoundingBoxRight, iT: base - m.actualBoundingBoxAscent, iB: base + m.actualBoundingBoxDescent,
        color: col.c, ca: col.a, tag, terms, key: `${tag}|g|${fam}|${sty}|${wt}|${ch}` });
    }
  };
  const rule = (el, tag, terms) => {
    const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    const bb = parseFloat(cs.borderBottomWidth) || 0, bt = parseFloat(cs.borderTopWidth) || 0;
    let y = r.top, h = r.height;
    if (bb > 0) { y = r.bottom - bb; h = bb; } else if (bt > 0) h = bt;
    if (r.width <= 0 || h <= 0) return;
    const col = cssColor(bb > 0 ? cs.borderBottomColor : cs.color);
    atoms.push({ k: 'r', x: r.left, y, w: r.width, h, color: col.c, ca: col.a, tag, terms, key: `${tag}|r` });
  };
  const svg = (el, tag, terms) => {
    const r = el.getBoundingClientRect(); if (r.width <= 0 || r.height <= 0) return;
    let l = r.left, t = r.top, rr = r.right, b = r.bottom;   // KaTeX clips long SVGs with overflow: hidden
    for (let p = el.parentElement; p && p !== box; p = p.parentElement) {
      if (getComputedStyle(p).overflow === 'visible') continue;
      const q = p.getBoundingClientRect(); l = Math.max(l, q.left); t = Math.max(t, q.top); rr = Math.min(rr, q.right); b = Math.min(b, q.bottom);
    }
    if (rr <= l || b <= t) return;
    const vb = el.viewBox.baseVal, par = el.preserveAspectRatio.baseVal, col = cssColor(getComputedStyle(el).color);
    const ds = [...el.querySelectorAll('path')].map((p) => p.getAttribute('d') || '');
    atoms.push({ k: 's', x: l, y: t, w: rr - l, h: b - t, sx: r.left, sy: r.top, sw: r.width, sh: r.height,
      vb: vb && vb.width ? [vb.x, vb.y, vb.width, vb.height] : [0, 0, r.width, r.height], al: par ? par.align : 6, sl: par ? par.meetOrSlice === 2 : false,
      paths: ds.map((d) => new Path2D(d)), color: col.c, ca: col.a, tag, terms, key: `${tag}|s|${el.closest('.sqrt') ? 'sqrt' : (ds[0] || '').slice(0, 12)}` });
  };
  const walk = (el, tag, terms) => {
    for (const n of el.childNodes) {
      if (n.nodeType === 3) { glyphs(n, tag, terms); continue; }
      if (n.nodeType !== 1) continue;
      if (n.namespaceURI === SVGNS) { if (n.localName === 'svg') svg(n, tag, terms); continue; }
      let t = tag, tm = terms;
      for (const c of n.classList) { if (c.startsWith('m-')) t = c; else if (c.startsWith('t-')) tm = tm.concat(c); }
      if (n.matches('.frac-line, .overline-line, .underline-line, .hline, .hdashline, .rule')) rule(n, t, tm);
      walk(n, t, tm);
    }
  };
  walk(box, '', []);
  let L = Infinity, T = Infinity, R = -Infinity, B = -Infinity;
  for (const b of box.querySelectorAll('.base')) { const r = b.getBoundingClientRect(); if (r.width <= 0) continue; L = Math.min(L, r.left); T = Math.min(T, r.top); R = Math.max(R, r.right); B = Math.max(B, r.bottom); }
  if (!(R > L)) for (const a of atoms) { L = Math.min(L, a.x); T = Math.min(T, a.y); R = Math.max(R, a.x + a.w); B = Math.max(B, a.y + a.h); }
  if (!(R > L)) { L = T = 0; R = B = 1; }
  for (const a of atoms) {
    a.x = (a.x - L) / REF; a.y = (a.y - T) / REF; a.w /= REF; a.h /= REF;
    if (a.k === 'g') { a.base = (a.base - T) / REF; a.fs /= REF; a.iL = (a.iL - L) / REF; a.iR = (a.iR - L) / REF; a.iT = (a.iT - T) / REF; a.iB = (a.iB - T) / REF; }
    else if (a.k === 's') { a.sx = (a.sx - L) / REF; a.sy = (a.sy - T) / REF; a.sw /= REF; a.sh /= REF; }
  }
  box.remove();
  const out = { atoms, w: (R - L) / REF, h: (B - T) / REF };
  texCache.set(key, out);
  return out;
}

// Sprites: a formula's atoms placed on the stage. size is the host font in px (glyphs are KaTeX's 1.21×).
function place(T, { x = W / 2, y = H / 2, size = 80, ax = 0.5, ay = 0.5 } = {}) {
  const ox = x - T.w * size * ax, oy = y - T.h * size * ay;
  return T.atoms.map((a) => {
    const s = { a, key: a.key, x: ox + a.x * size, y: oy + a.y * size, w: a.w * size, h: a.h * size, color: a.color, alpha: a.ca, size };
    if (a.k === 'g') { s.base = oy + a.base * size; s.fpx = a.fs * size; s.iL = ox + a.iL * size; s.iR = ox + a.iR * size; s.iT = oy + a.iT * size; s.iB = oy + a.iB * size; }
    else if (a.k === 's') { s.sx = ox + a.sx * size; s.sy = oy + a.sy * size; s.sw = a.sw * size; s.sh = a.sh * size; }
    return s;
  });
}
const inkBox = (s) => (s.a.k === 'g' ? [s.iL, s.iR, s.iT, s.iB] : [s.x, s.x + s.w, s.y, s.y + s.h]);
const ALX = [0, 0, 0, 0.5, 1, 0, 0.5, 1, 0, 0.5, 1], ALY = [0, 0, 0, 0, 0, 0.5, 0.5, 0.5, 1, 1, 1];
function svgXf(s) {
  const a = s.a, [vx, vy, vw, vh] = a.vb;
  let kx = s.sw / vw, ky = s.sh / vh;
  if (a.al !== 1) { const k = a.sl ? Math.max(kx, ky) : Math.min(kx, ky); kx = ky = k; }
  const fx = a.al === 1 ? 0 : ALX[a.al] || 0, fy = a.al === 1 ? 0 : ALY[a.al] || 0;
  return [kx, ky, s.sx + (s.sw - vw * kx) * fx - vx * kx, s.sy + (s.sh - vh * ky) * fy - vy * ky];
}
function drawSprite(ctx, s, alpha = s.alpha, color = s.color) {
  if (alpha <= 0.003) return;
  const a = s.a; ctx.fillStyle = rgba(color, alpha);
  if (a.k === 'g') { ctx.font = fontStr(a.sty, a.wt, s.fpx, a.fam); ctx.fillText(a.ch, s.x, s.base); }
  else if (a.k === 'r') ctx.fillRect(s.x, s.y, s.w, s.h);
  else {
    const [kx, ky, tx, ty] = svgXf(s);
    ctx.save(); ctx.beginPath(); ctx.rect(s.x, s.y, s.w, s.h); ctx.clip(); ctx.transform(kx, 0, 0, ky, tx, ty);
    for (const p of a.paths) ctx.fill(p);
    ctx.restore();
  }
}
// manim's Write on one piece: q in 0..1. The first half draws the outline, the second fills it in.
function drawWriting(ctx, s, q, alpha, color) {
  if (q <= 0) return;
  if (q >= 1) { drawSprite(ctx, s, alpha, color); return; }
  const a = s.a, border = Math.min(1, q * 2), fill = clamp(q * 2 - 1, 0, 1);
  const lw = Math.max(1.3, (s.fpx || s.size * 1.2) * 0.022);
  if (a.k === 'g') {
    ctx.font = fontStr(a.sty, a.wt, s.fpx, a.fam);
    if (fill < 1) { const L = s.fpx * 6; ctx.setLineDash([border * L, L]); ctx.lineWidth = lw; ctx.strokeStyle = rgba(color, alpha * (1 - fill)); ctx.strokeText(a.ch, s.x, s.base); ctx.setLineDash([]); }
    if (fill > 0) { ctx.fillStyle = rgba(color, alpha * fill); ctx.fillText(a.ch, s.x, s.base); }
  } else if (a.k === 'r') { ctx.fillStyle = rgba(color, alpha); ctx.fillRect(s.x, s.y, s.w * smooth(border), s.h); }
  else {
    const [kx, ky, tx, ty] = svgXf(s);
    ctx.save(); ctx.beginPath(); ctx.rect(s.x, s.y, s.w, s.h); ctx.clip(); ctx.transform(kx, 0, 0, ky, tx, ty);
    if (fill < 1) { const L = (s.w + s.h) * 3 / kx; ctx.setLineDash([border * L, L]); ctx.lineWidth = lw / kx; ctx.strokeStyle = rgba(color, alpha * (1 - fill)); for (const p of a.paths) ctx.stroke(p); }
    if (fill > 0) { ctx.fillStyle = rgba(color, alpha * fill); for (const p of a.paths) ctx.fill(p); }
    ctx.restore();
  }
}
// Draw a placed formula. p < 1 writes it in, piece after piece (manim's lag ratio). hi colours named terms
// (by weight), dim fades everything that is not highlighted, color replaces the default white.
const TERM_COL = {};
function drawSprites(ctx, sprites, { p = 1, alpha = 1, color = null, hi = null, dim = 0 } = {}) {
  const n = sprites.length, lag = Math.min(4 / Math.max(1, n), 0.2), full = (n - 1) * lag + 1;
  for (let i = 0; i < n; i++) {
    const s = sprites[i];
    let h = 0, hc = null;
    if (hi) for (const t of s.a.terms) { const v = hi[t] || 0; if (v > h) { h = v; hc = TERM_COL[t]; } }
    const base = color && isWhite(s.color) ? color : s.color;
    const c = hc ? mixRgb(base, hc, h) : base;
    const al = s.alpha * alpha * (1 - dim * 0.75 * (1 - h));
    if (p >= 1) drawSprite(ctx, s, al, c);
    else drawWriting(ctx, s, clamp(p * full - i * lag, 0, 1), al, c);
  }
}
function drawTex(ctx, src, x, y, size, { ax = 0.5, ay = 0.5, p = 1, alpha = 1, color = null } = {}) {
  const sp = place(tex(src), { x, y, size, ax, ay });
  drawSprites(ctx, sp, { p, alpha, color: color ? hexRgb(color) : null });
  return sp;
}

// ---------- morphing one formula into another, like TransformMatchingTex ----------
// Pieces with the same key move to their new place (a longest common subsequence keeps reading order,
// then same-shaped leftovers pair by distance). Optionally, leftovers between the same anchors cross-fade
// into each other (manim's FadeTransform). Everything else fades, drifting with its nearest moving piece.
function matchPlan(A, B, { subs = true } = {}) {
  const n = A.length, m = B.length;
  const dp = []; for (let i = 0; i <= n; i++) dp.push(new Int32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = A[i].key === B[j].key ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const ma = new Int32Array(n).fill(-1), mb = new Int32Array(m).fill(-1), lcs = [];
  for (let i = 0, j = 0; i < n && j < m;) {
    if (A[i].key === B[j].key) { ma[i] = j; mb[j] = i; lcs.push([i, j]); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) i++; else j++;
  }
  const pairs = lcs.slice();
  for (let i = 0; i < n; i++) {
    if (ma[i] >= 0) continue;
    let best = -1, bd = Infinity;
    for (let j = 0; j < m; j++) if (mb[j] < 0 && B[j].key === A[i].key) { const d = Math.hypot(B[j].x - A[i].x, B[j].y - A[i].y); if (d < bd) { bd = d; best = j; } }
    if (best >= 0) { ma[i] = best; mb[best] = i; pairs.push([i, best]); }
  }
  const swaps = [];
  if (subs) {
    const anchors = [[-1, -1], ...lcs, [n, m]];
    for (let k = 0; k + 1 < anchors.length; k++) {
      const ga = [], gb = [];
      for (let i = anchors[k][0] + 1; i < anchors[k + 1][0]; i++) if (ma[i] < 0 && A[i].a.k === 'g') ga.push(i);
      for (let j = anchors[k][1] + 1; j < anchors[k + 1][1]; j++) if (mb[j] < 0 && B[j].a.k === 'g') gb.push(j);
      for (let q = 0; q < Math.min(ga.length, gb.length); q++) { ma[ga[q]] = gb[q]; mb[gb[q]] = ga[q]; swaps.push([ga[q], gb[q]]); }
    }
  }
  const moved = pairs.concat(swaps);
  const centre = (S) => { let x = 0, y = 0; for (const s of S) { x += s.x + s.w / 2; y += s.y + s.h / 2; } return S.length ? [x / S.length, y / S.length] : [W / 2, H / 2]; };
  const [cax, cay] = centre(A), [cbx, cby] = centre(B);
  const drift = (s, side) => {
    if (!moved.length) return [cbx - cax, cby - cay];
    let best = null, bd = Infinity;
    for (const [i, j] of moved) { const r = side === 'a' ? A[i] : B[j]; const d = Math.abs(r.x - s.x) + 0.6 * Math.abs(r.y - s.y); if (d < bd) { bd = d; best = [B[j].x - A[i].x, B[j].y - A[i].y]; } }
    return best;
  };
  const outs = [], ins = [];
  for (let i = 0; i < n; i++) if (ma[i] < 0) { const [dx, dy] = drift(A[i], 'a'); outs.push({ i, dx, dy }); }
  for (let j = 0; j < m; j++) if (mb[j] < 0) { const [dx, dy] = drift(B[j], 'b'); ins.push({ j, dx, dy }); }
  return { A, B, pairs, swaps, outs, ins };
}
function lerpSprite(a, b, u) {
  const s = { a: b.a, x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), w: lerp(a.w, b.w, u), h: lerp(a.h, b.h, u), color: mixRgb(a.color, b.color, u), alpha: lerp(a.alpha, b.alpha, u), size: lerp(a.size, b.size, u) };
  if (a.base != null && b.base != null) { s.base = lerp(a.base, b.base, u); s.fpx = lerp(a.fpx, b.fpx, u); }
  if (a.sx != null && b.sx != null) { s.sx = lerp(a.sx, b.sx, u); s.sy = lerp(a.sy, b.sy, u); s.sw = lerp(a.sw, b.sw, u); s.sh = lerp(a.sh, b.sh, u); }
  return s;
}
function shifted(s, dx, dy) {
  const o = { ...s, x: s.x + dx, y: s.y + dy };
  if (s.base != null) o.base = s.base + dy;
  if (s.sx != null) { o.sx = s.sx + dx; o.sy = s.sy + dy; }
  return o;
}
function drawMorph(ctx, P, t, alpha = 1) {
  const u = smooth(t);
  for (const [i, j] of P.pairs) { const s = lerpSprite(P.A[i], P.B[j], u); drawSprite(ctx, s, s.alpha * alpha, s.color); }
  for (const [i, j] of P.swaps) {
    const s = lerpSprite(P.A[i], P.B[j], u);
    s.a = P.A[i].a; drawSprite(ctx, s, s.alpha * (1 - u) * alpha, s.color);
    s.a = P.B[j].a; drawSprite(ctx, s, s.alpha * u * alpha, s.color);
  }
  const ko = smooth(clamp(t / 0.6, 0, 1)), ki = smooth(clamp((t - 0.4) / 0.6, 0, 1));
  for (const o of P.outs) { const s = P.A[o.i]; drawSprite(ctx, shifted(s, o.dx * u, o.dy * u), s.alpha * (1 - ko) * alpha, s.color); }
  for (const o of P.ins) { const s = P.B[o.j]; drawSprite(ctx, shifted(s, -o.dx * (1 - u), -o.dy * (1 - u)), s.alpha * ki * alpha, s.color); }
}

// ---------- braces: a LaTeX-like underbrace that stretches from its centre ----------
// Each half is filled as a stroke whose thickness tapers at the hooked end and at the tip.
function braceHalf(ctx, cx, top, w2, h, th, dir) {
  const r = Math.min(h * 0.5, w2 * 0.45), P = [];
  const q = (p0, c, p1, n, from = 0) => { for (let i = from; i <= n; i++) { const t = i / n, mt = 1 - t; P.push([mt * mt * p0[0] + 2 * mt * t * c[0] + t * t * p1[0], mt * mt * p0[1] + 2 * mt * t * c[1] + t * t * p1[1]]); } };
  const mid = top + h / 2;
  q([cx + dir * w2, top], [cx + dir * w2, mid], [cx + dir * (w2 - r), mid], 12);
  const s1 = P[P.length - 1], s2 = [cx + dir * r, mid];
  for (let i = 1; i <= 4; i++) P.push([lerp(s1[0], s2[0], i / 4), mid]);
  q(s2, [cx, mid], [cx, top + h], 12, 1);
  const len = [0]; for (let i = 1; i < P.length; i++) len.push(len[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
  const L = len[len.length - 1] || 1, ra = Math.max(1, r * 1.1);
  const thk = (s) => th * (s < ra ? lerp(0.45, 1, s / ra) : s > L - ra * 1.3 ? lerp(1, 0.15, (s - (L - ra * 1.3)) / (ra * 1.3)) : 1);
  const left = [], right = [];
  for (let i = 0; i < P.length; i++) {
    const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)];
    let tx = b[0] - a[0], ty = b[1] - a[1]; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
    const w = thk(len[i]) / 2;
    left.push([P[i][0] - ty * w, P[i][1] + tx * w]); right.push([P[i][0] + ty * w, P[i][1] - tx * w]);
  }
  ctx.beginPath(); ctx.moveTo(left[0][0], left[0][1]);
  for (const p of left) ctx.lineTo(p[0], p[1]);
  for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(right[i][0], right[i][1]);
  ctx.closePath(); ctx.fill();
}
function drawBrace(ctx, cx, top, width, h, th, color, alpha = 1) {
  if (width < 1 || alpha <= 0.003) return;
  ctx.fillStyle = rgba(color, alpha);
  braceHalf(ctx, cx, top, width / 2, h, th, -1); braceHalf(ctx, cx, top, width / 2, h, th, 1);
}

// ---------- shared pieces: laser, beam, tank, sensor ----------
let TIME = 0;   // stage clock in seconds; stops while the tab is hidden
const LOOKS = {
  beer: { c: COL.gold, c2: COL.goldE, a: 0.42, a2: 0.62, surf: '#F7C797' },
  fog: { c: '#BBBBBB', c2: '#888888', a: 0.15, a2: 0.24, surf: '#DDDDDD' },
  ink: { c: '#236B8E', c2: '#16465E', a: 0.72, a2: 0.86, surf: '#58C4DD' },
  water: { c: '#58C4DD', c2: '#29ABCA', a: 0.15, a2: 0.24, surf: '#9CDCEB' },
};
const lookOf = (st) => (st.look === 'custom' ? { c: st.custom, c2: st.custom, a: 0.4, a2: 0.58, surf: st.custom } : LOOKS[st.look] || LOOKS.beer);
function drawLiquid(ctx, g, st) {
  if (st.fill <= 0.002) return;
  const L = lookOf(st), lv = g.bot - st.fill * g.th;
  ctx.save(); ctx.beginPath(); ctx.roundRect(g.x0, g.top - 10, g.x1 - g.x0, g.th + 10, [0, 0, 16, 16]); ctx.clip();
  const gr = ctx.createLinearGradient(0, lv, 0, g.bot); gr.addColorStop(0, hexA(L.c, L.a)); gr.addColorStop(1, hexA(L.c2, L.a2));
  ctx.fillStyle = gr; ctx.fillRect(g.x0, lv, g.x1 - g.x0, g.bot - lv);
  ctx.strokeStyle = hexA(L.surf, 0.85); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(g.x0, lv); ctx.lineTo(g.x1, lv); ctx.stroke();
  const depth = g.bot - lv;
  if (st.look === 'beer' && depth > 24) {
    ctx.strokeStyle = 'rgba(255,255,255,0.32)'; ctx.lineWidth = 1.6;
    for (let i = 0; i < 16; i++) {
      const ph = (i * 0.618) % 1, sp = 0.05 + 0.035 * (((i * 7) % 5) / 4), t = reduced ? ph : (TIME * sp + ph) % 1;
      const x = g.x0 + (0.06 + 0.88 * ((i * 0.377 + 0.13) % 1)) * (g.x1 - g.x0) + Math.sin(TIME * 1.7 + i) * 3;
      ctx.beginPath(); ctx.arc(x, g.bot - 12 - t * (depth - 20), 2.4 + (i % 3) * 1.5, 0, Math.PI * 2); ctx.stroke();
    }
  } else if (st.look === 'fog' && depth > 24) {
    for (let i = 0; i < 9; i++) {
      const ph = (i * 0.618) % 1, sp = 0.018 + 0.012 * (i % 3), t = reduced ? ph : (TIME * sp + ph) % 1;
      const x = g.x0 + t * (g.x1 - g.x0), y = lv + (0.15 + 0.7 * ((i * 0.41) % 1)) * depth, R = 70 + 40 * (i % 4);
      const rg = ctx.createRadialGradient(x, y, 0, x, y, R); rg.addColorStop(0, 'rgba(255,255,255,0.10)'); rg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = rg; ctx.fillRect(x - R, y - R, 2 * R, 2 * R);
    }
  }
  ctx.restore();
}
function drawGlass(ctx, g) {
  const r = 16;
  ctx.save(); ctx.strokeStyle = COL.greyA; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(g.x0, g.top); ctx.lineTo(g.x0, g.bot - r); ctx.quadraticCurveTo(g.x0, g.bot, g.x0 + r, g.bot);
  ctx.lineTo(g.x1 - r, g.bot); ctx.quadraticCurveTo(g.x1, g.bot, g.x1, g.bot - r); ctx.lineTo(g.x1, g.top); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.13)'; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(g.x0 + 22, g.top + 0.12 * g.th); ctx.lineTo(g.x0 + 22, g.bot - 0.22 * g.th); ctx.stroke();
  ctx.restore();
}
function drawLaser(ctx, apX, y, color, on) {
  ctx.save(); ctx.lineWidth = 3; ctx.strokeStyle = COL.greyB; ctx.fillStyle = '#2C2C2C';
  ctx.beginPath(); ctx.roundRect(apX - 232, y - 42, 212, 84, 12); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#161616'; ctx.beginPath(); ctx.roundRect(apX - 22, y - 19, 22, 38, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = on > 0.5 ? hexA(color, 1) : '#3A3A3A'; ctx.beginPath(); ctx.arc(apX - 68, y - 20, 6, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
function drawSensor(ctx, xs, y, color, lit) {
  ctx.save(); ctx.lineWidth = 3; ctx.strokeStyle = COL.greyB; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(xs, y + 48); ctx.lineTo(xs, y + 250); ctx.moveTo(xs - 56, y + 250); ctx.lineTo(xs + 56, y + 250); ctx.stroke();
  ctx.fillStyle = '#2C2C2C'; ctx.beginPath(); ctx.roundRect(xs - 15, y - 48, 30, 96, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = hexA(color, 0.16 + 0.84 * clamp(lit, 0, 1)); ctx.fillRect(xs - 18, y - 28, 5, 56);
  ctx.restore();
}
function drawReadout(ctx, xs, y, value, alpha) {
  if (alpha <= 0.01) return;
  const bw = 236, bh = 92, bx = clamp(xs - bw / 2, 20, W - bw - 20), by = y - 48 - 46 - bh;
  ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = COL.greyB; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(xs, y - 48); ctx.lineTo(xs, by + bh); ctx.stroke();
  ctx.fillStyle = '#000'; ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 12); ctx.fill(); ctx.stroke();
  ctx.restore();
  drawNumber(ctx, value * 100, bx + bw / 2, by + bh / 2 + 20, { size: 58, dec: 1, suffix: '%', align: 'center', alpha });
}
// The beam: brightness along x is exactly power · T(x); across it, one smooth glow with a bright core.
// Built on its own canvas (colour along the beam, then the cross-section as a mask) and added on top.
const beamCv = document.createElement('canvas'), bctx = beamCv.getContext('2d');
const BEAM_R = 26;
const BEAM_PROFILE = (() => {
  const f = (y) => 0.95 * Math.exp(-((y / 2.6) ** 2)) + 0.3 * Math.exp(-((y / 8) ** 2)) + 0.07 * Math.exp(-((y / 17) ** 2)), f0 = f(0), out = [];
  for (let k = 0; k <= 26; k++) { const y = (k / 26) * BEAM_R; out.push([y / (2 * BEAM_R), f(y) / f0]); }
  return out;
})();
function drawBeam(ctx, xa, xb, y, color, power, T, knots = []) {
  const len = xb - xa; if (len < 1 || power <= 0.002) return;
  const pw = Math.max(1, Math.ceil(len * K)), ph = Math.max(1, Math.ceil(2 * BEAM_R * K));
  if (beamCv.width < pw || beamCv.height < ph) { beamCv.width = Math.max(beamCv.width, pw); beamCv.height = Math.max(beamCv.height, ph); }
  bctx.setTransform(K, 0, 0, K, 0, 0); bctx.globalCompositeOperation = 'source-over'; bctx.clearRect(0, 0, len + 2, 2 * BEAM_R + 2);
  const c = hexRgb(color), xs = [];
  for (let i = 0; i <= 120; i++) xs.push(xa + (len * i) / 120);
  for (const k of knots) if (k > xa && k < xb) xs.push(k);
  xs.sort((p, q) => p - q);
  const along = bctx.createLinearGradient(0, 0, len, 0);
  for (const x of xs) along.addColorStop(clamp((x - xa) / len, 0, 1), rgba(c, clamp(T(x) * power, 0, 1)));
  bctx.fillStyle = along; bctx.fillRect(0, 0, len, 2 * BEAM_R);
  bctx.globalCompositeOperation = 'destination-in';
  const across = bctx.createLinearGradient(0, 0, 0, 2 * BEAM_R);
  for (const [o, a] of BEAM_PROFILE) { across.addColorStop(0.5 - o, `rgba(0,0,0,${a})`); if (o > 0) across.addColorStop(0.5 + o, `rgba(0,0,0,${a})`); }
  bctx.fillStyle = across; bctx.fillRect(0, 0, len, 2 * BEAM_R);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(beamCv, 0, 0, pw, ph, xa, y - BEAM_R, len, 2 * BEAM_R); ctx.restore();
}
function dot(ctx, x, y, r, color, a = 1) { if (a <= 0.003) return; ctx.fillStyle = hexA(color, a); ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
function dotted(ctx, x1, y1, x2, y2, color, a = 1, w = 4, gap = 13) {
  if (a <= 0.003) return;
  ctx.save(); ctx.setLineDash([0, gap]); ctx.lineCap = 'round'; ctx.strokeStyle = hexA(color, a); ctx.lineWidth = w;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore();
}
function dashed(ctx, x1, y1, x2, y2, color, a = 1, w = 2.5) {
  if (a <= 0.003) return;
  ctx.save(); ctx.setLineDash([10, 9]); ctx.strokeStyle = hexA(color, a); ctx.lineWidth = w;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore();
}

// ---------- scenes ----------
// A scene: state (st, with defaults), a draw function, animations (buttons) and parameters (controls).
// Animations bump the scene's epoch; a sequence stops at its next step when the epoch has moved on.
const scenes = {}, ORDER = [];
function defScene(def) {
  def.epoch = 0; def.st = def.defaults(); def.st.__tag = def.id;
  scenes[def.id] = def; ORDER.push(def.id);
  return def.st;
}
function resetScene(sc) {
  stopTweens(sc.id); sc.epoch++;
  const st = sc.st; for (const k of Object.keys(st)) delete st[k];
  Object.assign(st, sc.defaults(), { __tag: sc.id });
  if (sc.onReset) sc.onReset();
}
function runAction(sc, a) {
  const e = ++sc.epoch;
  Promise.resolve(a.run(sc.st, () => e === sc.epoch, sc)).catch((err) => console.error(err));
}
const RESET = { id: 'reset', label: 'Reset', run: (st, alive, sc) => resetScene(sc) };

// ---------- 1. laser and tank ----------
const FILL = 0.82;
const S1 = defScene({
  id: 'laser', tab: 'Laser and tank',
  defaults: () => ({ on: 1, front: 1, color: '#FF3B30', I0: 1, sigma: 0.05, d: 20, fill: FILL, container: 'tank', look: 'beer', custom: '#83C167', cloud: 1, sensorX: 1700, readA: 1, shown: null, showI0: 0, showD: 0 }),
  actions: [
    { id: 'shine', label: 'Shine', primary: true, run: async (st, alive) => {
      st.on = 0; st.front = 0; st.readA = 0; st.shown = null;
      await sleep(0.3, 'laser'); if (!alive()) return;
      st.on = 1; await tween(st, 'front', 1, 0.9, { ease: linear }); if (!alive()) return;
      await tween(st, 'readA', 1, 0.4);
    } },
    { id: 'fill', label: 'Fill', run: async (st) => {
      if (st.container === 'cloud') { st.cloud = 0; await tween(st, 'cloud', 1, 3); } else { st.fill = 0; await tween(st, 'fill', FILL, 3); }
    } },
    { id: 'drain', label: 'Drain', run: (st) => (st.container === 'cloud' ? tween(st, 'cloud', 0, 2.2) : tween(st, 'fill', 0, 2.4)) },
    { id: 'off', label: 'Laser off', run: async (st, alive) => { tween(st, 'readA', 0, 0.25); await tween(st, 'on', 0, 0.3); if (alive()) st.front = 0; } },
    RESET,
  ],
  params: [
    { type: 'chips', key: 'color', label: 'Laser colour', options: ['#FF3B30', '#35D36A', '#3B7BFF', '#FFFFFF'] },
    { type: 'range', key: 'I0', label: 'Intensity I₀', min: 0, max: 1, step: 0.01, fmt: (v) => `${Math.round(v * 100)} %` },
    { type: 'select', key: 'container', label: 'Medium', options: [['tank', 'Tank'], ['cloud', 'Cloud']], rebuild: true },
    { type: 'select', key: 'look', label: 'Look', options: [['beer', 'Beer'], ['fog', 'Fog'], ['ink', 'Ink'], ['water', 'Water'], ['custom', 'Custom']], rebuild: true, visible: (st) => st.container === 'tank' },
    { type: 'color', key: 'custom', label: 'Liquid colour', visible: (st) => st.container === 'tank' && st.look === 'custom' },
    { type: 'range', key: 'sigma', label: 'Absorption σₐ (1/cm)', min: 0, max: 0.3, step: 0.005, fmt: (v) => v.toFixed(3) },
    { type: 'range', key: 'd', label: 'Thickness d (cm)', min: 5, max: 30, step: 0.5, fmt: (v) => v.toFixed(1) },
    { type: 'range', key: 'fill', label: 'Fill level', min: 0, max: 1, step: 0.01, fmt: (v) => `${Math.round(v * 100)} %`, visible: (st) => st.container === 'tank' },
    { type: 'range', key: 'cloud', label: 'Cloud density', min: 0, max: 1, step: 0.01, fmt: (v) => `${Math.round(v * 100)} %`, visible: (st) => st.container === 'cloud' },
    { type: 'check', key: 'showI0', label: 'I₀ label', set: (v) => tween(S1, 'showI0', v ? 1 : 0, 0.4) },
    { type: 'check', key: 'showD', label: 'd label', set: (v) => tween(S1, 'showD', v ? 1 : 0, 0.4), visible: (st) => st.container === 'tank' },
  ],
  draw: draw1, pointer: pointer1,
});
function geo1(st) {
  const y = 520, apX = 340, pxcm = 34, cw = st.d * pxcm;
  return { y, apX, pxcm, cx: 960, cw, x0: 960 - cw / 2, x1: 960 + cw / 2, top: 270, bot: 790, th: 520, xs: clamp(st.sensorX, apX + 120, 1830) };
}
// Transmittance from the laser to x: the beam only loses light where it runs through liquid.
function tankT(st, g) {
  const lv = g.bot - st.fill * g.th, cover = clamp((g.y + 3 - lv) / 6, 0, 1);
  return (x) => Math.exp(-st.sigma * Math.max(0, Math.min(g.x1, x) - Math.max(g.x0, g.apX)) / g.pxcm * cover);
}
// The cloud: soft puffs whose density adds up; optical depth is integrated along the beam, 2px at a time.
const PUFFS = [[-0.36, 0.02, 0.2], [-0.16, -0.1, 0.27], [0.08, -0.07, 0.3], [0.33, 0.03, 0.21], [0, 0.12, 0.25], [-0.27, 0.15, 0.17], [0.23, 0.17, 0.18]];
let cloudTau = new Float32Array(1), cloudN = 1, cloudX0 = 0;
function cloudPuffs(g, st) { const k = 0.55 + 0.45 * st.cloud; return PUFFS.map(([dx, dy, r]) => [g.cx + dx * g.cw, g.y + dy * g.cw, r * g.cw * k]); }
function cloudDensity(x, y, puffs, st) {
  let s = 0;
  for (const [px, py, R] of puffs) { const t = clamp((R - Math.hypot(x - px, y - py)) / (R * 0.6), 0, 1); s += t * t * (3 - 2 * t); }
  return Math.min(1, s) * st.cloud;
}
function buildCloudTau(st, g, puffs) {
  cloudN = Math.ceil((W - g.apX) / 2) + 2; if (cloudTau.length < cloudN) cloudTau = new Float32Array(cloudN);
  cloudX0 = g.apX; let acc = 0; cloudTau[0] = 0;
  for (let i = 1; i < cloudN; i++) { acc += (st.sigma * cloudDensity(g.apX + i * 2, g.y, puffs, st) * 2) / g.pxcm; cloudTau[i] = acc; }
}
const cloudT = (x) => Math.exp(-cloudTau[clamp(Math.round((x - cloudX0) / 2), 0, cloudN - 1)]);
function drawCloud(ctx, puffs, st) {
  if (st.cloud <= 0.002) return;
  for (const [x, y, R] of puffs) {
    const rg = ctx.createRadialGradient(x, y, 0, x, y, R);
    rg.addColorStop(0, `rgba(225,225,225,${0.3 * st.cloud})`); rg.addColorStop(0.6, `rgba(200,200,200,${0.17 * st.cloud})`); rg.addColorStop(1, 'rgba(200,200,200,0)');
    ctx.fillStyle = rg; ctx.fillRect(x - R, y - R, 2 * R, 2 * R);
  }
}
function draw1(ctx, dt, st) {
  const g = geo1(st), tank = st.container === 'tank';
  let T;
  if (tank) { T = tankT(st, g); drawLiquid(ctx, g, st); }
  else { const puffs = cloudPuffs(g, st); buildCloudTau(st, g, puffs); T = cloudT; drawCloud(ctx, puffs, st); }
  const end = g.xs - 18;
  drawBeam(ctx, g.apX, lerp(g.apX, end, st.front), g.y, st.color, st.on * st.I0, T, tank ? [g.x0, g.x1] : []);
  if (tank) drawGlass(ctx, g);
  drawLaser(ctx, g.apX, g.y, st.color, st.on);
  // The readout counts toward the sensor's value instead of jumping to it.
  const reading = st.on > 0.5 && st.front >= 0.999 && st.I0 > 0 ? T(end) : null;
  st.shown = reading == null ? null : st.shown == null || reduced ? reading : lerp(st.shown, reading, 1 - Math.exp(-dt * 5));
  drawSensor(ctx, g.xs, g.y, st.color, reading == null ? 0 : reading * st.I0);
  if (st.shown != null) drawReadout(ctx, g.xs, g.y, st.shown, st.readA);
  if (st.showI0 > 0.003) drawTex(ctx, 'I_0', g.apX - 122, g.y - 96, 62, { alpha: st.showI0 });
  if (st.showD > 0.003 && tank) {
    const y = g.bot + 58;
    ctx.save(); ctx.globalAlpha = st.showD; ctx.strokeStyle = COL.greyB; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(g.x0, y); ctx.lineTo(g.x1, y); ctx.moveTo(g.x0, y - 14); ctx.lineTo(g.x0, y + 14); ctx.moveTo(g.x1, y - 14); ctx.lineTo(g.x1, y + 14); ctx.stroke();
    ctx.restore();
    drawTex(ctx, 'd', g.cx, y + 52, 62, { alpha: st.showD });
  }
}
function pointer1(type, x, y) {
  const st = S1, g = geo1(st);
  const over = Math.abs(x - g.xs) < 56 && y > g.y - 90 && y < g.y + 262;
  if (type === 'down') { scenes.laser.drag = over; return over; }
  if (type === 'up') { scenes.laser.drag = false; return false; }
  if (scenes.laser.drag) { st.sensorX = clamp(x, g.apX + 120, 1830); return true; }
  return over;
}

// ---------- 2. equation morph ----------
const tc = (c, s) => `\\textcolor{${c}}{${s}}`;
const HALF = tc(COL.lavender, String.raw`\tfrac{1}{2}`);
const tankLabel = (n) => tc(COL.blue, n) + String.raw`\text{ tank${n === 1 ? '' : 's'}:}`;
const tankExpr = (k, res) => String.raw`100\% ` + Array(k).fill(String.raw`\times ` + HALF).join(' ') + ' = ' + tc(COL.yellow, res);
const NN = `{{${tc(COL.blue, 'n')}}}`, SIG = String.raw`{{\sigma_a}}`, DD = '{{d}}';
const RTE = String.raw`L(p,\omega) = \int_0^{d} e^{\htmlClass{t-abs}{-\int_0^{t}\sigma_a(p_s)\,ds}\htmlClass{t-out}{-\int_0^{t}\sigma_s(p_s)\,ds}}\left[\htmlClass{t-em}{\sigma_a(p_t)\,L_e(p_t,\omega)} + \htmlClass{t-in}{\sigma_s(p_t)\int_{4\pi} f_p(\omega,\omega')\,L(p_t,\omega')\,d\omega'}\right]dt`;
Object.assign(TERM_COL, { 't-abs': hexRgb(COL.blue), 't-out': hexRgb(COL.blue), 't-em': hexRgb(COL.green), 't-in': hexRgb(COL.green) });
const LX = 200, EX = 640, ROWS = [300, 520, 740], MID = { x: 960, y: 540, size: 110 };

const EQ = defScene({
  id: 'morph', tab: 'Equation morph',
  defaults: () => ({ preset: 'tanks', step: -1, morphDur: 1.2, scale: 1, subs: true,
    from: String.raw`I = I_0\, e^{-{{\sigma_a}}\, {{d}}}`, to: String.raw`I = I_0\, e^{-\int_0^{ {{d}} } {{\sigma_a}}(s)\, ds}`,
    items: new Map(), morphs: [], braces: [] }),
  actions: [
    { id: 'restart', label: 'Restart', run: () => eqGo(0, true) },
    { id: 'back', label: '◀ Back', run: () => eqGo(EQ.step - 1, false) },
    { id: 'next', label: 'Next ▶', primary: true, run: () => eqGo(EQ.step + 1, true) },
    { id: 'replay', label: 'Replay step', run: () => eqGo(EQ.step, true) },
  ],
  extra: () => {
    const s = document.createElement('span'); s.className = 'stepinfo';
    live.push(() => { const P = PRESETS[EQ.preset], k = EQ.step, txt = `${k + 1} / ${P.steps.length}${k >= 0 ? ' · ' + P.steps[k].label : ''}`; if (s.textContent !== txt) s.textContent = txt; });
    return s;
  },
  params: [
    { type: 'select', key: 'preset', label: 'Sequence', options: [['tanks', 'Tanks: copy and morph'], ['base', 'Any base works'], ['beer', 'Beer–Lambert grows an integral'], ['rte', 'RTE with braces'], ['custom', 'Your own']], set: (v) => { EQ.preset = v; eqGo(0, false); }, rebuild: true },
    { type: 'range', key: 'morphDur', label: 'Morph time (s)', min: 0.4, max: 3, step: 0.1, fmt: (v) => v.toFixed(1) },
    { type: 'range', key: 'scale', label: 'Size', min: 0.6, max: 1.4, step: 0.05, fmt: (v) => `${v.toFixed(2)}×`, set: (v) => { EQ.scale = v; eqGo(EQ.step, false); } },
    { type: 'check', key: 'subs', label: 'Cross-fade mismatched pieces' },
    { type: 'text', key: 'from', label: 'From (TeX)', wide: true, visible: () => EQ.preset === 'custom', enter: () => eqGo(0, true) },
    { type: 'text', key: 'to', label: 'To (TeX)', wide: true, visible: () => EQ.preset === 'custom', enter: () => eqGo(1, true) },
    { type: 'note', html: 'Press Enter in a field to play it. Pieces with the same shape glide to their new place. Wrap a part in <code>{{ }}</code> in both formulas to pair it by hand, as in manim.', visible: () => EQ.preset === 'custom' },
  ],
  draw: draw2, next: () => eqGo(EQ.step + 1, true), prev: () => eqGo(EQ.step - 1, false),
  onReset: () => eqGo(0, false),
});

// Primitives a step is made of. eqEpoch guards against a step that was cut short by Back, Next or Reset.
let eqEpoch = 0;
function inst(src, pl) {
  const T = tex(src), want = (pl.size ?? 84) * EQ.scale, size = Math.min(want, (pl.fit ?? 1800) / Math.max(T.w, 0.01));
  return { T, size, sprites: place(T, { ...pl, size }), alpha: 1, writeP: 1, visible: true, hi: {}, dim: 0 };
}
async function eqWrite(id, src, pl, dur) {
  const I = inst(src, pl); I.writeP = 0; EQ.items.set(id, I);
  await tween(I, 'writeP', 1, dur ?? (I.sprites.length < 15 ? 1 : 2), { ease: linear, tag: 'morph' });
}
async function eqMorph(fromId, toId, src, pl, { copy = false } = {}) {
  const e = eqEpoch, A = EQ.items.get(fromId), B = inst(src, pl);
  if (!A) { EQ.items.set(toId, B); return; }
  const m = { plan: matchPlan(A.sprites, B.sprites, { subs: EQ.subs }), t: 0 };
  if (!copy) A.visible = false;
  EQ.morphs.push(m);
  await tween(m, 't', 1, EQ.morphDur, { ease: linear, tag: 'morph' });
  if (e !== eqEpoch) return;
  EQ.morphs.splice(EQ.morphs.indexOf(m), 1);
  if (!copy && fromId !== toId) EQ.items.delete(fromId);
  EQ.items.set(toId, B);
}
async function eqFade(id, dur = 0.6) {
  const e = eqEpoch, I = EQ.items.get(id); if (!I) return;
  await tween(I, 'alpha', 0, dur, { tag: 'morph' });
  if (e === eqEpoch && EQ.items.get(id) === I) EQ.items.delete(id);
}
// A brace under a named term: it stretches out from its centre, then its label fades in under it.
async function eqBrace(id, term, label, color) {
  const I = EQ.items.get(id); if (!I) return;
  const ss = I.sprites.filter((s) => s.a.terms.includes(term)); if (!ss.length) return;
  let x0 = Infinity, x1 = -Infinity, yb = -Infinity;
  for (const s of ss) { const [l, r, , b] = inkBox(s); x0 = Math.min(x0, l); x1 = Math.max(x1, r); yb = Math.max(yb, b); }
  const fpx = 1.21 * I.size, lsize = I.size * 0.62, LT = tex(String.raw`\text{${label}}`);
  const b = { term, x0, x1, top: yb + fpx * 0.1, h: fpx * 0.3, th: Math.max(3, fpx * 0.055), color: hexRgb(color), g: 0, l: 0 };
  const cx = (x0 + x1) / 2, lw = LT.w * lsize, lh = LT.h * lsize;
  let ly = b.top + b.h + fpx * 0.1 + lh / 2;
  for (let guard = 0; guard < 6 && EQ.braces.some((o) => Math.abs(o.ly - ly) < lh * 0.9 && !(cx + lw / 2 + 24 < o.lx0 || cx - lw / 2 - 24 > o.lx1)); guard++) ly += lh * 1.05;
  Object.assign(b, { ly, lx0: cx - lw / 2, lx1: cx + lw / 2, lab: place(LT, { x: cx, y: ly, size: lsize }) });
  EQ.braces.push(b);
  tween(I.hi, term, 1, 0.5, { tag: 'morph' });
  await Promise.all([tween(b, 'g', 1, 0.75, { tag: 'morph' }), tween(b, 'l', 1, 0.5, { delay: 0.4, tag: 'morph' })]);
}
async function braceStep(term, label, color) { const I = EQ.items.get('rte'); if (I) tween(I, 'dim', 0.5, 0.5, { tag: 'morph' }); await eqBrace('rte', term, label, color); }
async function focusTerm(term) {
  const e = eqEpoch, I = EQ.items.get('rte'); if (!I) return;
  const others = EQ.braces.filter((b) => b.term !== term);
  for (const k of Object.keys(I.hi)) if (k !== term) tween(I.hi, k, 0, 0.6, { tag: 'morph' });
  await Promise.all([tween(I, 'dim', 1, 0.8, { tag: 'morph' }), ...others.flatMap((b) => [tween(b, 'g', 0, 0.6, { tag: 'morph' }), tween(b, 'l', 0, 0.35, { tag: 'morph' })])]);
  if (e === eqEpoch) EQ.braces = EQ.braces.filter((b) => b.term === term);
}
const PRESETS = {
  tanks: { steps: [
    { label: 'Write the first line', run: () => Promise.all([eqWrite('L1', tankLabel(1), { x: LX, y: ROWS[0], ax: 0 }), eqWrite('E1', tankExpr(1, '50\\%'), { x: EX, y: ROWS[0], ax: 0 })]) },
    { label: 'Copy it down and morph', run: () => Promise.all([eqMorph('L1', 'L2', tankLabel(2), { x: LX, y: ROWS[1], ax: 0 }, { copy: true }), eqMorph('E1', 'E2', tankExpr(2, '25\\%'), { x: EX, y: ROWS[1], ax: 0 }, { copy: true })]) },
    { label: 'Once more', run: () => Promise.all([eqMorph('L2', 'L3', tankLabel(3), { x: LX, y: ROWS[2], ax: 0 }, { copy: true }), eqMorph('E2', 'E3', tankExpr(3, '12.5\\%'), { x: EX, y: ROWS[2], ax: 0 }, { copy: true })]) },
    { label: 'Collapse into a power', run: () => { for (const id of ['L1', 'E1', 'L2', 'E2']) eqFade(id); return Promise.all([eqMorph('L3', 'L3', tankLabel('n'), { x: LX, y: 540, ax: 0 }), eqMorph('E3', 'E3', String.raw`100\% \times \left(` + HALF + String.raw`\right)^{${tc(COL.blue, 'n')}}`, { x: EX, y: 540, ax: 0 })]); } },
  ] },
  base: { steps: [
    { label: 'Write', run: () => eqWrite('f', String.raw`T = \left(\tfrac{1}{2}\right)^{ ${NN} }`, MID) },
    { label: 'A power of 2', run: () => eqMorph('f', 'f', String.raw`T = 2^{-${NN}}`, MID) },
    { label: 'A power of e', run: () => eqMorph('f', 'f', String.raw`T = e^{-${NN} \ln 2}`, MID) },
    { label: 'A power of 10', run: () => eqMorph('f', 'f', String.raw`T = 10^{-${NN} \log_{10} 2}`, MID) },
  ] },
  beer: { steps: [
    { label: 'Write', run: () => eqWrite('f', String.raw`I = I_0\, e^{-${SIG}\, ${DD}}`, MID) },
    { label: 'Thickness becomes an integral', run: () => eqMorph('f', 'f', String.raw`I = I_0\, e^{-\int_0^{ ${DD} } ${SIG}\, ds}`, MID) },
    { label: 'σₐ varies along the path', run: () => eqMorph('f', 'f', String.raw`I = I_0\, e^{-\int_0^{ ${DD} } ${SIG}(s)\, ds}`, MID) },
  ] },
  rte: { steps: [
    { label: 'Write', run: () => eqWrite('rte', RTE, { x: 960, y: 430, size: 80, fit: 1800 }, 2.4) },
    { label: 'Absorption', run: () => braceStep('t-abs', 'absorption', COL.blue) },
    { label: 'Out-scattering', run: () => braceStep('t-out', 'out-scattering', COL.blue) },
    { label: 'Emission', run: () => braceStep('t-em', 'emission', COL.green) },
    { label: 'In-scattering', run: () => braceStep('t-in', 'in-scattering', COL.green) },
    { label: 'Only absorption', run: () => focusTerm('t-abs') },
  ] },
  custom: { steps: [
    { label: 'Write From', run: () => eqWrite('f', EQ.from, MID) },
    { label: 'Morph to To', run: () => eqMorph('f', 'f', EQ.to, MID) },
  ] },
};
// Go to step k: rebuild the steps before it instantly, then play step k (or show it finished).
async function eqGo(k, play) {
  const sc = scenes.morph; sc.epoch++; eqEpoch++;
  stopTweens('morph');
  EQ.items.clear(); EQ.morphs.length = 0; EQ.braces = [];
  const steps = PRESETS[EQ.preset].steps;
  k = clamp(k, play ? 0 : -1, steps.length - 1);
  instant = true;
  try { for (let i = 0; i < (play ? k : k + 1); i++) await steps[i].run(); } catch (err) { console.error(err); } finally { instant = false; }
  EQ.step = k;
  if (play && k >= 0) await steps[k].run();
}
function draw2(ctx, dt, st) {
  for (const I of st.items.values()) if (I.visible && I.alpha > 0.003) drawSprites(ctx, I.sprites, { p: I.writeP, alpha: I.alpha, hi: I.hi, dim: I.dim });
  for (const m of st.morphs) drawMorph(ctx, m.plan, m.t);
  for (const b of st.braces) {
    drawBrace(ctx, (b.x0 + b.x1) / 2, b.top, (b.x1 - b.x0) * b.g, b.h, b.th, b.color, Math.min(1, b.g * 4));
    if (b.l > 0.003) for (const s of b.lab) drawSprite(ctx, shifted(s, 0, (1 - b.l) * 14), s.alpha * b.l, b.color);
  }
}

//@@SCENES@@

// ---------- the stage ----------
const stageEl = $('stage'), cv = $('cv'), ctx = cv.getContext('2d');
let K = 1, cssW = 0, cssH = 0, DPR = 0;
function fitCanvas() {
  const w = stageEl.clientWidth, h = stageEl.clientHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
  if (w === cssW && h === cssH && dpr === DPR) return;
  cssW = w; cssH = h; DPR = dpr;
  cv.width = Math.max(1, Math.round(w * dpr)); cv.height = Math.max(1, Math.round(h * dpr));
  K = cv.width / W;
}
function toStage(e) { const r = cv.getBoundingClientRect(); return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H]; }
cv.addEventListener('pointerdown', (e) => { const [x, y] = toStage(e); if (cur.pointer && cur.pointer('down', x, y)) { cv.setPointerCapture(e.pointerId); stageEl.classList.add('grabbing'); } });
cv.addEventListener('pointermove', (e) => { const [x, y] = toStage(e); stageEl.classList.toggle('grab', !!(cur.pointer && cur.pointer('move', x, y))); });
const pointerUp = () => { if (cur.pointer) cur.pointer('up', 0, 0); stageEl.classList.remove('grabbing'); };
cv.addEventListener('pointerup', pointerUp); cv.addEventListener('pointercancel', pointerUp);

// ---------- controls under the stage ----------
const anims = $('anims'), params = $('params'), tabsEl = $('tabs');
let cur = null;
const live = [];   // small callbacks that keep controls in step with animated values, run every frame
const mk = (tag, cls) => { const e = document.createElement(tag); if (cls) e.className = cls; return e; };
const truthy = (v) => v === true || (typeof v === 'number' && v > 0.5);
function control(sc, p) {
  const st = sc.st, get = p.get || (() => st[p.key]), set = p.set || ((v) => { st[p.key] = v; });
  const id = `p-${sc.id}-${p.key || p.type}`, after = () => { if (p.rebuild) buildDock(); };
  const name = () => { const s = mk('span'); s.textContent = p.label; return s; };
  if (p.type === 'range') {
    const lab = mk('label', 'rng'), out = mk('output'), inp = mk('input');
    Object.assign(inp, { type: 'range', id, min: p.min, max: p.max, step: p.step });
    inp.value = get();
    const show = () => { out.textContent = p.fmt ? p.fmt(+inp.value) : inp.value; };
    inp.addEventListener('input', () => { set(+inp.value); show(); });
    show(); lab.append(name(), out, inp);
    live.push(() => { if (document.activeElement === inp) return; const v = get(); if (Math.abs(+inp.value - v) > p.step / 2) { inp.value = v; show(); } });
    return lab;
  }
  if (p.type === 'select') {
    const lab = mk('label', 'sel'), s = mk('select'); s.id = id;
    for (const [v, t] of p.options) s.add(new Option(t, v));
    s.value = get(); s.addEventListener('change', () => { set(s.value); after(); });
    lab.append(name(), s);
    live.push(() => { if (document.activeElement !== s && s.value !== get()) s.value = get(); });
    return lab;
  }
  if (p.type === 'check') {
    const lab = mk('label', 'chk'), inp = mk('input'); inp.type = 'checkbox'; inp.id = id; inp.checked = truthy(get());
    inp.addEventListener('change', () => { set(inp.checked); after(); });
    lab.append(inp, document.createTextNode(p.label));
    return lab;
  }
  if (p.type === 'text') {
    const lab = mk('label', 'txt' + (p.wide ? ' wide' : '')), inp = mk('input');
    Object.assign(inp, { type: 'text', id, spellcheck: false, autocomplete: 'off' }); inp.value = get();
    inp.addEventListener('input', () => set(inp.value));
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter' && p.enter) { e.preventDefault(); p.enter(); } });
    lab.append(name(), inp);
    return lab;
  }
  if (p.type === 'chips' || p.type === 'color') {
    const lab = mk('div', 'sel'), row = mk('span', 'chips'), pick = mk('input');
    for (const c of p.options || []) {
      const b = mk('button', 'chip'); b.type = 'button'; b.style.background = c; b.title = c; b.setAttribute('aria-label', c);
      b.addEventListener('click', () => set(c)); row.appendChild(b);
    }
    pick.type = 'color'; pick.id = id; pick.value = get(); pick.title = 'Any colour';
    pick.addEventListener('input', () => set(pick.value.toUpperCase()));
    row.appendChild(pick); lab.append(name(), row);
    live.push(() => {
      const v = String(get()).toUpperCase();
      for (const b of row.querySelectorAll('.chip')) b.setAttribute('aria-pressed', String(b.title.toUpperCase() === v));
      if (document.activeElement !== pick && pick.value.toUpperCase() !== v) pick.value = v;
    });
    return lab;
  }
  if (p.type === 'note') { const n = mk('p', 'note'); n.innerHTML = p.html; return n; }
  return mk('span');
}
function buildDock() {
  live.length = 0; anims.textContent = ''; params.textContent = '';
  for (const a of cur.actions) {
    const b = mk('button', 'btn' + (a.primary ? ' primary' : '')); b.type = 'button'; b.id = `a-${cur.id}-${a.id}`; b.textContent = a.label;
    b.addEventListener('click', () => runAction(cur, a)); anims.appendChild(b);
  }
  if (cur.extra) anims.appendChild(cur.extra());
  for (const p of cur.params) if (!p.visible || p.visible(cur.st)) params.appendChild(control(cur, p));
}
function buildTabs() {
  tabsEl.textContent = '';
  ORDER.forEach((id, i) => {
    const b = mk('button', 'tab'); b.type = 'button'; b.setAttribute('role', 'tab'); b.dataset.scene = id;
    b.innerHTML = `<span class="n">${i + 1}</span>${scenes[id].tabHtml || ''}`; if (!scenes[id].tabHtml) b.append(scenes[id].tab);
    b.addEventListener('click', () => setScene(id)); tabsEl.appendChild(b);
  });
}
function setScene(id) {
  if (!scenes[id]) id = ORDER[0];
  cur = scenes[id];
  for (const b of tabsEl.children) b.setAttribute('aria-selected', String(b.dataset.scene === id));
  buildDock();
  try { if (location.hash !== '#' + id) history.replaceState(null, '', '#' + id); } catch (e) { /* the viewer may not allow it */ }
}
addEventListener('hashchange', () => { const id = location.hash.slice(1); if (scenes[id] && cur !== scenes[id]) setScene(id); });
$('speed').addEventListener('change', (e) => { SPEED = +e.target.value; });
const setClean = (on) => { document.body.classList.toggle('clean', on); $('showBtn').hidden = !on; };
$('hideBtn').addEventListener('click', () => setClean(true));
$('showBtn').addEventListener('click', () => setClean(false));
function toggleFull() {
  if (document.fullscreenElement) { document.exitFullscreen().catch(() => {}); return; }
  const p = document.documentElement.requestFullscreen?.(); if (p) p.then(() => setClean(true)).catch(() => {});
}
document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement) setClean(false); });
$('fsBtn').addEventListener('click', toggleFull);
addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const t = e.target, k = e.key;
  if (t.matches && t.matches('input, select, textarea')) { if (k === 'Escape') t.blur(); return; }
  const onButton = t.matches && t.matches('button');
  if (/^[1-9]$/.test(k) && ORDER[+k - 1]) { setScene(ORDER[+k - 1]); e.preventDefault(); }
  else if (k === ' ' && !onButton) { const a = cur.actions.find((x) => x.primary) || cur.actions[0]; runAction(cur, a); e.preventDefault(); }
  else if (k === 'r' || k === 'R') { const a = cur.actions.find((x) => x.id === 'reset'); if (a) runAction(cur, a); else if (cur.onReset) cur.onReset(); }
  else if (k === 'ArrowRight' && cur.next) { cur.next(); e.preventDefault(); }
  else if (k === 'ArrowLeft' && cur.prev) { cur.prev(); e.preventDefault(); }
  else if (k === 'h' || k === 'H') setClean(!document.body.classList.contains('clean'));
  else if (k === 'f' || k === 'F') toggleFull();
  else if (k === 'Escape' && document.body.classList.contains('clean') && !document.fullscreenElement) setClean(false);
});

// ---------- running it ----------
let raf = 0, last = 0;
function frame(now) {
  raf = requestAnimationFrame(frame);
  const dt = Math.min(0.1, Math.max(0, (now - last) / 1000)) * SPEED; last = now;
  tick(dt); TIME += dt;
  fitCanvas();
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.setTransform(K, 0, 0, K, 0, 0); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.lineCap = 'butt'; ctx.setLineDash([]);
  try { cur.draw(ctx, dt, cur.st); } catch (err) { console.error(err); }
  for (const f of live) f();
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) cancelAnimationFrame(raf);
  else { last = performance.now(); raf = requestAnimationFrame(frame); }
});
async function boot() {
  const faces = ['400 40px KaTeX_Main', 'italic 400 40px KaTeX_Main', '700 40px KaTeX_Main', 'italic 400 40px KaTeX_Math', '400 40px KaTeX_Size1', '400 40px KaTeX_Size2', '400 40px KaTeX_Size3', '400 40px KaTeX_Size4', '400 40px KaTeX_AMS', '400 40px KaTeX_Caligraphic'];
  try { await Promise.all(faces.map((f) => document.fonts.load(f))); } catch (e) { /* fall back to whatever loaded */ }
  ascCache.clear(); texCache.clear();
  for (const id of ORDER) if (scenes[id].init) scenes[id].init();
  await eqGo(0, false);
  buildTabs(); setScene(location.hash.slice(1));
  last = performance.now(); raf = requestAnimationFrame(frame);
}
if (document.readyState === 'complete') boot(); else addEventListener('load', boot);
