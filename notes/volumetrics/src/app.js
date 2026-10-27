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

// The palette of the GPU-driven rendering video (the blog's dark theme): a warm near-black stage, warm white
// and greys, and its accents in manim's roles (blue numbers, lavender fractions, amber and orange results).
const BG = '#1C1B18';
const COL = {
  white: '#EEEAE2', greyA: '#DCD7CC', greyB: '#C8C2B6', grey: '#948E82', greyC: '#6E675F', greyD: '#47443D', greyE: '#2E2C27',
  blue: '#74A6EA', blueE: '#34506A', green: '#6FC08E', yellow: '#EDB24E', gold: '#F0784F', goldE: '#C4471F', red: '#EE7F94', lavender: '#A396EA',
};
const AXIS = '#C8C2B6';
const BODY = '#2A2824', NOZZLE = '#151412', PART = '#2A2824';   // laser and sensor bodies, laser nozzles, particles
function hexRgb(h) { h = String(h).replace('#', ''); if (h.length === 3) h = [...h].map((c) => c + c).join(''); const n = parseInt(h, 16) || 0; return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
const rgba = (c, a = 1) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${clamp(a, 0, 1)})`;
const hexA = (h, a = 1) => rgba(hexRgb(h), a);
const mixRgb = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const isWhite = (c) => c[0] > 250 && c[1] > 250 && c[2] > 250;
// KaTeX lays formulas out in pure white; on the stage that white is the palette's warm white.
const WHITE_RGB = hexRgb(COL.white), ink = (c) => (isWhite(c) ? WHITE_RGB : c);

// manim's rate functions
const sigmoid = (x) => 1 / (1 + Math.exp(-x));
const SME = sigmoid(-5);
const smooth = (t) => clamp((sigmoid(10 * (t - 0.5)) - SME) / (1 - 2 * SME), 0, 1);
const linear = (t) => t;

// ---------- tweens ----------
// tween(obj, key, to, seconds) animates one number and resolves when it lands. A newer tween on the same
// number replaces the older one and starts from wherever that one got to. `instant` (used to rebuild a
// state) and reduced motion make every tween land at once.
let SPEED = 1, instant = 0;
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
      paths: ds.map((d) => new Path2D(d)), ds, color: col.c, ca: col.a, tag, terms, key: `${tag}|s|${el.closest('.sqrt') ? 'sqrt' : (ds[0] || '').slice(0, 12)}` });
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
  color = ink(color);
  const a = s.a; ctx.fillStyle = rgba(color, alpha);
  if (a.k === 'g') {
    const o = outlineOf(a);
    if (o) { const k = s.fpx / o.u; ctx.save(); ctx.transform(k, 0, 0, -k, s.x, s.base); ctx.fill(o.path); ctx.restore(); }
    else { ctx.font = fontStr(a.sty, a.wt, s.fpx, a.fam); ctx.fillText(a.ch, s.x, s.base); }
  }
  else if (a.k === 'r') ctx.fillRect(s.x, s.y, s.w, s.h);
  else if (a.k === 'p') { ctx.beginPath(); for (const c of s.contours) { c.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); } ctx.fill(); }
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
  color = ink(color);
  if (q >= 1) { drawSprite(ctx, s, alpha, color); return; }
  const a = s.a, border = Math.min(1, q * 2), fill = clamp(q * 2 - 1, 0, 1);
  const lw = Math.max(1.3, (s.fpx || s.size * 1.2) * 0.022);
  const o = a.k === 'g' ? outlineOf(a) : null;
  if (o) {   // trace the glyph's real outline, every contour at once, then fill it in
    if (!o.flat) o.flat = flatten(o.d);
    if (!o.len) o.len = Math.max(1, ...o.flat.map(polyLen));
    const k = s.fpx / o.u;
    ctx.save(); ctx.transform(k, 0, 0, -k, s.x, s.base);
    if (fill < 1) { ctx.setLineDash([border * o.len, o.len]); ctx.lineWidth = lw / k; ctx.strokeStyle = rgba(color, alpha * (1 - fill)); ctx.stroke(o.path); ctx.setLineDash([]); }
    if (fill > 0) { ctx.fillStyle = rgba(color, alpha * fill); ctx.fill(o.path); }
    ctx.restore();
  } else if (a.k === 'g') {
    ctx.font = fontStr(a.sty, a.wt, s.fpx, a.fam);
    if (fill < 1) { const L = s.fpx * 6; ctx.setLineDash([border * L, L]); ctx.lineWidth = lw; ctx.strokeStyle = rgba(color, alpha * (1 - fill)); ctx.strokeText(a.ch, s.x, s.base); ctx.setLineDash([]); }
    if (fill > 0) { ctx.fillStyle = rgba(color, alpha * fill); ctx.fillText(a.ch, s.x, s.base); }
  } else if (a.k === 'r') { ctx.fillStyle = rgba(color, alpha); ctx.fillRect(s.x, s.y, s.w * smooth(border), s.h); }
  else if (a.k === 'p') {
    const path = new Path2D(); for (const c of s.contours) { c.forEach(([x, y], i) => (i ? path.lineTo(x, y) : path.moveTo(x, y))); path.closePath(); }
    const L = Math.max(...s.contours.map(polyLen));
    if (fill < 1) { ctx.setLineDash([border * L, L]); ctx.lineWidth = lw; ctx.strokeStyle = rgba(color, alpha * (1 - fill)); ctx.stroke(path); ctx.setLineDash([]); }
    if (fill > 0) { ctx.fillStyle = rgba(color, alpha * fill); ctx.fill(path); }
  }
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

// ---------- glyph outlines (KaTeX's own fonts, extracted when the page is built) ----------
// Glyphs are drawn from their outlines, so Write traces the real outline and a reshape can move its points.
const fontFile = (fam, sty, wt) => {
  const f = String(fam).split(',')[0].trim().replace(/["']/g, ''), it = sty === 'italic' || sty === 'oblique', bold = +wt >= 600;
  return `${f}-${f === 'KaTeX_Math' ? (bold ? 'BoldItalic' : 'Italic') : bold ? (it ? 'BoldItalic' : 'Bold') : it ? 'Italic' : 'Regular'}`;
};
const outlineCache = new Map();
function outlineOf(a) {
  const key = `${a.fam}|${a.sty}|${a.wt}|${a.ch}`;
  if (outlineCache.has(key)) return outlineCache.get(key);
  const file = typeof GLYPHS === 'undefined' ? null : GLYPHS[fontFile(a.fam, a.sty, a.wt)], d = file && file.g[a.ch.codePointAt(0)];
  const o = d ? { u: file.u, d, path: new Path2D(d), flat: null, len: 0 } : null;
  outlineCache.set(key, o);
  return o;
}
// An outline's contours as polylines in font units, each quadratic piece cut into 8 straight ones.
function flatten(d) {
  const out = []; let c = null, x = 0, y = 0, m;
  const re = /([MlqzZ])([^MlqzZ]*)/g;
  while ((m = re.exec(d))) {
    const n = (m[2].match(/-?\d*\.?\d+/g) || []).map(Number);
    if (m[1] === 'M') { if (c && c.length > 2) out.push(c); x = n[0]; y = n[1]; c = [[x, y]]; }
    else if (m[1] === 'l') for (let i = 0; i + 1 < n.length; i += 2) { x += n[i]; y += n[i + 1]; c.push([x, y]); }
    else if (m[1] === 'q') for (let i = 0; i + 3 < n.length; i += 4) {
      const cx = x + n[i], cy = y + n[i + 1], ex = x + n[i + 2], ey = y + n[i + 3];
      for (let k = 1; k <= 8; k++) { const t = k / 8, mt = 1 - t; c.push([mt * mt * x + 2 * mt * t * cx + t * t * ex, mt * mt * y + 2 * mt * t * cy + t * t * ey]); }
      x = ex; y = ey;
    } else { if (c && c.length > 2) out.push(c); c = null; }
  }
  if (c && c.length > 2) out.push(c);
  return out;
}
const polyArea = (c) => { let a = 0; for (let i = 0, n = c.length; i < n; i++) { const p = c[i], q = c[(i + 1) % n]; a += p[0] * q[1] - q[0] * p[1]; } return a / 2; };
const polyLen = (c) => { let L = 0; for (let i = 0, n = c.length; i < n; i++) { const p = c[i], q = c[(i + 1) % n]; L += Math.hypot(q[0] - p[0], q[1] - p[1]); } return L; };
// K points spaced evenly along a closed polyline, flat as [x0, y0, x1, y1, …].
function resample(c, K) {
  const n = c.length, cum = new Float64Array(n + 1), out = new Float64Array(2 * K);
  for (let i = 0; i < n; i++) { const p = c[i], q = c[(i + 1) % n]; cum[i + 1] = cum[i] + Math.hypot(q[0] - p[0], q[1] - p[1]); }
  const L = cum[n] || 1;
  for (let k = 0, j = 0; k < K; k++) {
    const t = (k / K) * L; while (j < n - 1 && cum[j + 1] < t) j++;
    const p = c[j], q = c[(j + 1) % n], f = (t - cum[j]) / Math.max(1e-9, cum[j + 1] - cum[j]);
    out[2 * k] = p[0] + (q[0] - p[0]) * f; out[2 * k + 1] = p[1] + (q[1] - p[1]) * f;
  }
  return out;
}
const meanOf = (r) => { let x = 0, y = 0; const K = r.length / 2; for (let i = 0; i < K; i++) { x += r[2 * i]; y += r[2 * i + 1]; } return [x / K, y / K]; };
const pointRing = (K, x, y) => { const r = new Float64Array(2 * K); for (let i = 0; i < K; i++) { r[2 * i] = x; r[2 * i + 1] = y; } return r; };
// Start b where it lines up best with a (both centred), so the outline turns into the other without twisting.
function alignStart(a, b) {
  const K = a.length / 2, [ax, ay] = meanOf(a), [bx, by] = meanOf(b), step = Math.max(1, Math.floor(K / 48));
  let best = 0, bd = Infinity;
  for (let s = 0; s < K; s++) {
    let d = 0;
    for (let i = 0; i < K; i += step) { const j = (i + s) % K; d += (a[2 * i] - ax - (b[2 * j] - bx)) ** 2 + (a[2 * i + 1] - ay - (b[2 * j + 1] - by)) ** 2; }
    if (d < bd) { bd = d; best = s; }
  }
  if (!best) return b;
  const out = new Float64Array(2 * K);
  for (let i = 0; i < K; i++) { const j = (i + best) % K; out[2 * i] = b[2 * j]; out[2 * i + 1] = b[2 * j + 1]; }
  return out;
}
const svgProbe = (() => { const svg = document.createElementNS(SVGNS, 'svg'), p = document.createElementNS(SVGNS, 'path'); svg.setAttribute('width', '0'); svg.setAttribute('height', '0'); svg.appendChild(p); texHost.appendChild(svg); return p; })();
// Any piece as closed polylines on the stage: a glyph's outline, a rule's rectangle, an SVG piece sampled
// along its path (kept inside the box KaTeX clips it to), or a shape's own contours.
function contoursOf(s) {
  const a = s.a;
  if (a.k === 'g') {
    const o = outlineOf(a);
    if (!o) { const [l, r, t, b] = inkBox(s); return [[[l, t], [l, b], [r, b], [r, t]]]; }
    if (!o.flat) o.flat = flatten(o.d);
    const k = s.fpx / o.u;
    return o.flat.map((c) => c.map(([x, y]) => [s.x + x * k, s.base - y * k]));
  }
  if (a.k === 'r') return [[[s.x, s.y], [s.x, s.y + s.h], [s.x + s.w, s.y + s.h], [s.x + s.w, s.y]]];
  if (a.k === 'p') return s.contours;
  const [kx, ky, tx, ty] = svgXf(s), out = [];
  for (const d of a.ds || []) {
    svgProbe.setAttribute('d', d); const L = svgProbe.getTotalLength(); if (!(L > 0)) continue;
    const c = []; for (let i = 0; i < 200; i++) { const p = svgProbe.getPointAtLength((i / 200) * L); c.push([clamp(tx + p.x * kx, s.x, s.x + s.w), clamp(ty + p.y * ky, s.y, s.y + s.h)]); }
    out.push(c);
  }
  return out;
}

// ---------- reshaping one formula (or shape) into any other, like manim's Transform ----------
// Pieces are paired in reading order; when one side has more, pieces split or merge, as manim's do. Within a
// pair, outer contours pair with outer contours and holes with holes (biggest first); a contour with no
// partner shrinks to a point or grows from one. Every pair is resampled to the same number of points,
// started where they line up best, and the points glide straight across.
function reshapePlan(A, B) {
  const read = (S) => S.map((s) => {
    const cs = contoursOf(s).filter((c) => c.length > 2); if (!cs.length) return null;
    let big = cs[0], ba = -1, x = 0, y = 0, n = 0;
    for (const c of cs) { const ar = Math.abs(polyArea(c)); if (ar > ba) { ba = ar; big = c; } for (const p of c) { x += p[0]; y += p[1]; n++; } }
    return { s, cs, orient: Math.sign(polyArea(big)) || 1, cx: x / n, cy: y / n };
  }).filter(Boolean).sort((p, q) => p.cx - q.cx || p.cy - q.cy);
  const a = read(A), b = read(B), n = a.length, m = b.length, N = Math.max(n, m), groups = [];
  if (n && m) for (let i = 0; i < N; i++) groups.push(pairShapes(a[n === N ? i : Math.floor((i * n) / N)], b[m === N ? i : Math.floor((i * m) / N)]));
  return { groups };
}
function pairShapes(pa, pb) {
  const off = [pb.cx - pa.cx, pb.cy - pa.cy], flip = pa.orient !== pb.orient;
  // outer contours and holes, told apart by winding relative to the piece's biggest contour
  const split = (P, rev) => {
    const outer = [], holes = [];
    for (const c0 of P.cs) { const o = { c: rev ? c0.slice().reverse() : c0, ar: Math.abs(polyArea(c0)), L: polyLen(c0) }; (polyArea(c0) * P.orient >= 0 ? outer : holes).push(o); }
    outer.sort((p, q) => q.ar - p.ar); holes.sort((p, q) => q.ar - p.ar);
    return [outer, holes];
  };
  const [ao, ah] = split(pa, false), [bo, bh] = split(pb, flip), pairs = [];
  for (const [X, Y] of [[ao, bo], [ah, bh]]) {
    for (let i = 0, k = Math.max(X.length, Y.length); i < k; i++) {
      const x = X[i], y = Y[i], K = clamp(Math.round(Math.max(x ? x.L : 0, y ? y.L : 0) / 4), 24, 240);
      let ra = x ? resample(x.c, K) : null, rb = y ? resample(y.c, K) : null;
      if (!ra) { const [cx, cy] = meanOf(rb); ra = pointRing(K, cx - off[0], cy - off[1]); }
      else if (!rb) { const [cx, cy] = meanOf(ra); rb = pointRing(K, cx + off[0], cy + off[1]); }
      else rb = alignStart(ra, rb);
      pairs.push({ a: ra, b: rb, K });
    }
  }
  return { pairs, ca: pa.s.color, cb: pb.s.color, aa: pa.s.alpha, ab: pb.s.alpha };
}
function drawReshape(ctx, P, t, alpha = 1) {
  const u = smooth(t);
  for (const g of P.groups) {
    ctx.beginPath();
    for (const { a, b, K } of g.pairs) {
      for (let i = 0; i < K; i++) { const x = a[2 * i] + (b[2 * i] - a[2 * i]) * u, y = a[2 * i + 1] + (b[2 * i + 1] - a[2 * i + 1]) * u; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
      ctx.closePath();
    }
    ctx.fillStyle = rgba(mixRgb(ink(g.ca), ink(g.cb), u), lerp(g.aa, g.ab, u) * alpha); ctx.fill();
  }
}
// Plain shapes, to reshape a formula into something that is not a formula at all: @circle, @square, @triangle, @star.
function shapeSprites(name, pl) {
  const r = (pl.size ?? 84) * EQ.scale * 1.2, x = pl.ax === 0 ? (pl.x ?? 0) + r : pl.x ?? W / 2, y = pl.y ?? H / 2, c = [];
  const poly = (pts, per) => { for (let e = 0; e < pts.length; e++) { const p = pts[e], q = pts[(e + 1) % pts.length]; for (let i = 0; i < per; i++) c.push([x + r * lerp(p[0], q[0], i / per), y + r * lerp(p[1], q[1], i / per)]); } };
  if (name === 'square') poly([[-1, -1], [-1, 1], [1, 1], [1, -1]], 40);
  else if (name === 'triangle') poly([[0, -1.1], [-1.05, 0.75], [1.05, 0.75]], 50);
  else if (name === 'star') { const pts = []; for (let i = 0; i < 10; i++) { const ang = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? 0.45 : 1.1; pts.push([rr * Math.cos(ang), rr * Math.sin(ang)]); } poly(pts, 16); }
  else for (let i = 0; i < 160; i++) { const t = (i / 160) * 2 * Math.PI; c.push([x + r * Math.cos(t), y - r * Math.sin(t)]); }
  return [{ a: { k: 'p', terms: [], key: '@' + name }, key: '@' + name, contours: [c], x: x - r, y: y - r, w: 2 * r, h: 2 * r, color: hexRgb(COL.blue), alpha: 1, size: pl.size ?? 84 }];
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
  beer: { c: '#F0AC5F', c2: '#C78D46', a: 0.42, a2: 0.62, surf: '#F7C797' },
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
  if (st.plain) { /* no bubbles or wisps */ } else if (st.look === 'beer' && depth > 24) {
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
  ctx.restore();
}
function drawLaser(ctx, apX, y, color, on) {
  ctx.save(); ctx.lineWidth = 3; ctx.strokeStyle = COL.greyB; ctx.fillStyle = BODY;
  ctx.beginPath(); ctx.roundRect(apX - 232, y - 42, 212, 84, 12); ctx.fill(); ctx.stroke();
  ctx.fillStyle = NOZZLE; ctx.beginPath(); ctx.roundRect(apX - 22, y - 19, 22, 38, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = on > 0.5 ? hexA(color, 1) : '#3E3B35'; ctx.beginPath(); ctx.arc(apX - 68, y - 20, 6, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
function drawSensor(ctx, xs, y, color, lit) {
  ctx.save(); ctx.lineWidth = 3; ctx.strokeStyle = COL.greyB; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(xs, y + 48); ctx.lineTo(xs, y + 250); ctx.moveTo(xs - 56, y + 250); ctx.lineTo(xs + 56, y + 250); ctx.stroke();
  ctx.fillStyle = BODY; ctx.beginPath(); ctx.roundRect(xs - 15, y - 48, 30, 96, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = hexA(color, 0.16 + 0.84 * clamp(lit, 0, 1)); ctx.fillRect(xs - 18, y - 28, 5, 56);
  ctx.restore();
}
function drawReadout(ctx, xs, y, value, alpha) {
  if (alpha <= 0.01) return;
  const bw = 236, bh = 92, bx = clamp(xs - bw / 2, 20, W - bw - 20), by = y - 48 - 46 - bh;
  ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = COL.greyB; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(xs, y - 48); ctx.lineTo(xs, by + bh); ctx.stroke();
  ctx.fillStyle = BG; ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 12); ctx.fill(); ctx.stroke();
  ctx.restore();
  drawNumber(ctx, value * 100, bx + bw / 2, by + bh / 2 + 20, { size: 58, dec: 1, suffix: '%', align: 'center', alpha });
}
// The beam: its brightness along x is exactly power · T(x). Across it, one of three looks (shared
// settings): Solid, a flat band; Soft edge, a flat band with a short falloff; Glow, a bright core in a wide
// halo that is added on top of whatever is behind it.
const beamCv = document.createElement('canvas'), bctx = beamCv.getContext('2d');
function beamProfile(look, w) {
  const out = [];
  if (look === 'soft') {
    const e = Math.max(1.5, w * 0.3), R = w / 2 + 2.5 * e;
    for (let k = 0; k <= 24; k++) { const y = (k / 24) * R; out.push([y / (2 * R), y <= w / 2 ? 1 : Math.exp(-(((y - w / 2) / e) ** 2))]); }
    return [R, out];
  }
  const s = w / 8, R = 26 * s, f = (y) => 0.95 * Math.exp(-((y / (2.6 * s)) ** 2)) + 0.3 * Math.exp(-((y / (8 * s)) ** 2)) + 0.07 * Math.exp(-((y / (17 * s)) ** 2)), f0 = f(0);
  for (let k = 0; k <= 26; k++) { const y = (k / 26) * R; out.push([y / (2 * R), f(y) / f0]); }
  return [R, out];
}
function drawBeam(ctx, xa, xb, y, color, power, T, knots = [], w = SH.beamW) {
  const len = xb - xa; if (len < 1 || power <= 0.002) return;
  const c = hexRgb(color), xs = [], look = SH.beamLook;
  for (let i = 0; i <= 120; i++) xs.push(xa + (len * i) / 120);
  for (const k of knots) if (k > xa && k < xb) xs.push(k);
  xs.sort((p, q) => p - q);
  if (look === 'solid') {
    const along = ctx.createLinearGradient(xa, 0, xb, 0);
    for (const x of xs) along.addColorStop(clamp((x - xa) / len, 0, 1), rgba(c, clamp(T(x) * power, 0, 1)));
    ctx.fillStyle = along; ctx.fillRect(xa, y - w / 2, len, w);
    return;
  }
  const [R, prof] = beamProfile(look, w), pw = Math.max(1, Math.ceil(len * K)), ph = Math.max(1, Math.ceil(2 * R * K));
  if (beamCv.width < pw || beamCv.height < ph) { beamCv.width = Math.max(beamCv.width, pw); beamCv.height = Math.max(beamCv.height, ph); }
  bctx.setTransform(K, 0, 0, K, 0, 0); bctx.globalCompositeOperation = 'source-over'; bctx.clearRect(0, 0, len + 2, 2 * R + 2);
  const along = bctx.createLinearGradient(0, 0, len, 0);
  for (const x of xs) along.addColorStop(clamp((x - xa) / len, 0, 1), rgba(c, clamp(T(x) * power, 0, 1)));
  bctx.fillStyle = along; bctx.fillRect(0, 0, len, 2 * R);
  bctx.globalCompositeOperation = 'destination-in';
  const across = bctx.createLinearGradient(0, 0, 0, 2 * R);
  for (const [o, a] of prof) { across.addColorStop(0.5 - o, `rgba(0,0,0,${a})`); if (o > 0) across.addColorStop(0.5 + o, `rgba(0,0,0,${a})`); }
  bctx.fillStyle = across; bctx.fillRect(0, 0, len, 2 * R);
  ctx.save(); ctx.globalCompositeOperation = look === 'glow' ? 'lighter' : 'source-over'; ctx.drawImage(beamCv, 0, 0, pw, ph, xa, y - R, len, 2 * R); ctx.restore();
}
// A band with colour stops along x and a Gaussian falloff across it: a medium with no walls, like fog.
const bandCv = document.createElement('canvas'), bandCtx = bandCv.getContext('2d');
function softBand(ctx, x0, x1, yc, R, stops) {
  const len = x1 - x0; if (len < 1) return;
  const pw = Math.max(1, Math.ceil(len * K)), ph = Math.max(1, Math.ceil(2 * R * K)), b = bandCtx;
  if (bandCv.width < pw || bandCv.height < ph) { bandCv.width = Math.max(bandCv.width, pw); bandCv.height = Math.max(bandCv.height, ph); }
  b.setTransform(K, 0, 0, K, 0, 0); b.globalCompositeOperation = 'source-over'; b.clearRect(0, 0, len + 2, 2 * R + 2);
  const along = b.createLinearGradient(0, 0, len, 0); for (const [t, c] of stops) along.addColorStop(clamp(t, 0, 1), c);
  b.fillStyle = along; b.fillRect(0, 0, len, 2 * R);
  b.globalCompositeOperation = 'destination-in';
  const across = b.createLinearGradient(0, 0, 0, 2 * R);
  for (let k = 0; k <= 20; k++) { const o = k / 20, a = Math.exp(-((o * 2.2) ** 2)).toFixed(4); across.addColorStop(0.5 - o / 2, `rgba(0,0,0,${a})`); if (k) across.addColorStop(0.5 + o / 2, `rgba(0,0,0,${a})`); }
  b.fillStyle = across; b.fillRect(0, 0, len, 2 * R);
  ctx.drawImage(bandCv, 0, 0, pw, ph, x0, yc - R, len, 2 * R);
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

// ---------- shared: the laser and the medium, the same in every scene that shows them ----------
const SH = { __tag: 'shared', color: '#FF3B30', I0: 1, beamLook: 'solid', beamW: 8, container: 'tank', look: 'beer', custom: '#6FC08E' };
const SHARED = { id: 'shared', st: SH, params: [
  { type: 'chips', key: 'color', label: 'Laser colour', options: ['#FF3B30', '#35D36A', '#3B7BFF', '#FFFFFF'] },
  { type: 'range', key: 'I0', label: 'Intensity I₀', min: 0, max: 1, step: 0.01, fmt: (v) => `${Math.round(v * 100)} %` },
  { type: 'select', key: 'beamLook', label: 'Beam look', options: [['solid', 'Solid'], ['soft', 'Soft edge'], ['glow', 'Glow']] },
  { type: 'range', key: 'beamW', label: 'Beam width (px)', min: 1, max: 40, step: 0.5, fmt: (v) => v.toFixed(1) },
  { type: 'select', key: 'container', label: 'Medium', options: [['tank', 'Tank of liquid'], ['cloud', 'Cloud']] },
  { type: 'select', key: 'look', label: 'Liquid', options: [['beer', 'Beer'], ['fog', 'Fog'], ['ink', 'Ink'], ['water', 'Water'], ['custom', 'Custom']], visible: () => SH.container === 'tank' },
  { type: 'color', key: 'custom', label: 'Liquid colour', visible: () => SH.container === 'tank' && SH.look === 'custom' },
] };
const mediumOf = (fill) => ({ fill, look: SH.look, custom: SH.custom });

// ---------- 1. laser and tank ----------
const FILL = 0.82;
const S1 = defScene({
  id: 'laser', tab: 'Laser and tank', shared: true,
  defaults: () => ({ on: 1, front: 1, sigma: 0.05, d: 20, fill: FILL, cloud: 1, sensorX: 1700, readA: 1, shown: null, showI0: 0, showD: 0, shineT: 0.9, fillT: 3 }),
  actions: [
    { id: 'shine', label: 'Shine', primary: true, run: async (st, alive) => {
      st.on = 0; st.front = 0; st.readA = 0; st.shown = null;
      await sleep(0.3, 'laser'); if (!alive()) return;
      st.on = 1; await tween(st, 'front', 1, st.shineT, { ease: linear }); if (!alive()) return;
      await tween(st, 'readA', 1, 0.4);
    } },
    { id: 'fill', label: 'Fill', run: async (st) => {
      if (SH.container === 'cloud') { st.cloud = 0; await tween(st, 'cloud', 1, st.fillT); } else { st.fill = 0; await tween(st, 'fill', FILL, st.fillT); }
    } },
    { id: 'drain', label: 'Drain', run: (st) => (SH.container === 'cloud' ? tween(st, 'cloud', 0, st.fillT * 0.75) : tween(st, 'fill', 0, st.fillT * 0.8)) },
    { id: 'off', label: 'Laser off', run: async (st, alive) => { tween(st, 'readA', 0, 0.25); await tween(st, 'on', 0, 0.3); if (alive()) st.front = 0; } },
    RESET,
  ],
  params: [
    { type: 'range', key: 'sigma', label: 'Absorption σₐ (1/cm)', min: 0, max: 0.3, step: 0.005, fmt: (v) => v.toFixed(3) },
    { type: 'range', key: 'd', label: 'Distance d (cm)', min: 5, max: 30, step: 0.5, fmt: (v) => v.toFixed(1) },
    { type: 'range', key: 'fill', label: 'Fill level', min: 0, max: 1, step: 0.01, fmt: (v) => `${Math.round(v * 100)} %`, visible: () => SH.container === 'tank' },
    { type: 'range', key: 'cloud', label: 'Cloud density', min: 0, max: 1, step: 0.01, fmt: (v) => `${Math.round(v * 100)} %`, visible: () => SH.container === 'cloud' },
    { type: 'range', key: 'shineT', label: 'Shine time (s)', min: 0.2, max: 4, step: 0.1, fmt: (v) => v.toFixed(1) },
    { type: 'range', key: 'fillT', label: 'Fill time (s)', min: 0.5, max: 8, step: 0.1, fmt: (v) => v.toFixed(1) },
    { type: 'check', key: 'showI0', label: 'I₀ label', set: (v) => tween(S1, 'showI0', v ? 1 : 0, 0.9, { ease: linear }) },
    { type: 'check', key: 'showD', label: 'd label', set: (v) => tween(S1, 'showD', v ? 1 : 0, 1.3, { ease: linear }), visible: () => SH.container === 'tank' },
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
function cloudPuffs(g, st, sy = 1, sr = 1) { const k = (0.55 + 0.45 * st.cloud) * sr; return PUFFS.map(([dx, dy, r]) => [g.cx + dx * g.cw, g.y + dy * g.cw * sy, r * g.cw * k]); }
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
  const g = geo1(st), tank = SH.container === 'tank';
  let T;
  if (tank) { T = tankT(st, g); drawLiquid(ctx, g, mediumOf(st.fill)); }
  else { const puffs = cloudPuffs(g, st); buildCloudTau(st, g, puffs); T = cloudT; drawCloud(ctx, puffs, st); }
  const end = g.xs - 18;
  drawBeam(ctx, g.apX, lerp(g.apX, end, st.front), g.y, SH.color, st.on * SH.I0, T, tank ? [g.x0, g.x1] : []);
  if (tank) drawGlass(ctx, g);
  drawLaser(ctx, g.apX, g.y, SH.color, st.on);
  // The readout counts toward the sensor's value instead of jumping to it.
  const reading = st.on > 0.5 && st.front >= 0.999 && SH.I0 > 0 ? T(end) : null;
  st.shown = reading == null ? null : st.shown == null || reduced ? reading : lerp(st.shown, reading, 1 - Math.exp(-dt * 5));
  drawSensor(ctx, g.xs, g.y, SH.color, reading == null ? 0 : reading * SH.I0);
  if (st.shown != null) drawReadout(ctx, g.xs, g.y, st.shown, st.readA);
  if (st.showI0 > 0.003) drawTex(ctx, 'I_0', g.apX - 122, g.y - 96, 62, { p: st.showI0 });
  if (st.showD > 0.003 && tank) drawDimension(ctx, g.x0, g.x1, g.bot + 58, 'd', st.showD);
}
// A dimension line that stretches out from its centre, end ticks that grow once it reaches them, and a
// label written in under it. p runs 0..1; played backwards, it folds away the same way.
function drawDimension(ctx, x0, x1, y, label, p) {
  const g = smooth(clamp(p / 0.6, 0, 1)), tk = smooth(clamp((p - 0.45) / 0.25, 0, 1)), cx = (x0 + x1) / 2, hw = ((x1 - x0) / 2) * g;
  ctx.save(); ctx.strokeStyle = COL.greyB; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(cx - hw, y); ctx.lineTo(cx + hw, y);
  if (tk > 0) { ctx.moveTo(x0, y - 14 * tk); ctx.lineTo(x0, y + 14 * tk); ctx.moveTo(x1, y - 14 * tk); ctx.lineTo(x1, y + 14 * tk); }
  ctx.stroke(); ctx.restore();
  const lp = clamp((p - 0.55) / 0.45, 0, 1);
  if (lp > 0) drawTex(ctx, label, cx, y + 52, 62, { p: lp });
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
  defaults: () => ({ preset: 'reshape', style: 'shape', step: -1, morphDur: 1.4, writeMul: 1, scale: 1, subs: true,
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
    { type: 'select', key: 'preset', label: 'Sequence', options: [['reshape', 'Unrelated formulas, reshaped'], ['tanks', 'Tanks: copy and morph'], ['base', 'Any base works'], ['beer', 'Beer–Lambert grows an integral'], ['rte', 'RTE with braces'], ['custom', 'Your own']], set: (v) => { EQ.preset = v; eqGo(0, false); }, rebuild: true },
    { type: 'select', key: 'style', label: 'Morph style', options: [['shape', 'Reshape outlines (Transform)'], ['match', 'Match pieces (TransformMatchingTex)']], visible: () => EQ.preset !== 'reshape' && EQ.preset !== 'rte' },
    { type: 'range', key: 'morphDur', label: 'Morph time (s)', min: 0.4, max: 4, step: 0.1, fmt: (v) => v.toFixed(1) },
    { type: 'range', key: 'writeMul', label: 'Write time', min: 0.3, max: 3, step: 0.05, fmt: (v) => `${v.toFixed(2)}×` },
    { type: 'range', key: 'scale', label: 'Size', min: 0.6, max: 1.4, step: 0.05, fmt: (v) => `${v.toFixed(2)}×`, set: (v) => { EQ.scale = v; eqGo(EQ.step, false); } },
    { type: 'check', key: 'subs', label: 'Cross-fade mismatched pieces', visible: () => EQ.style === 'match' && EQ.preset !== 'reshape' && EQ.preset !== 'rte' },
    { type: 'text', key: 'from', label: 'From (TeX)', wide: true, visible: () => EQ.preset === 'custom', enter: () => eqGo(0, true) },
    { type: 'text', key: 'to', label: 'To (TeX)', wide: true, visible: () => EQ.preset === 'custom', enter: () => eqGo(1, true) },
    { type: 'note', html: 'Press Enter in a field to play it. Reshape turns any outline into any other; <code>@circle</code>, <code>@square</code>, <code>@triangle</code> and <code>@star</code> work as formulas too. With Match pieces, wrap a part in <code>{{ }}</code> in both formulas to pair it by hand, as in manim.', visible: () => EQ.preset === 'custom' },
  ],
  draw: draw2, next: () => eqGo(EQ.step + 1, true), prev: () => eqGo(EQ.step - 1, false),
  onReset: () => eqGo(0, false),
});

// Primitives a step is made of. eqEpoch guards against a step that was cut short by Back, Next or Reset.
let eqEpoch = 0;
function inst(src, pl) {
  if (src.trim().startsWith('@')) return { T: null, size: (pl.size ?? 84) * EQ.scale, sprites: shapeSprites(src.trim().slice(1), pl), alpha: 1, writeP: 1, visible: true, hi: {}, dim: 0 };
  const T = tex(src), want = (pl.size ?? 84) * EQ.scale, size = Math.min(want, (pl.fit ?? 1800) / Math.max(T.w, 0.01));
  return { T, size, sprites: place(T, { ...pl, size }), alpha: 1, writeP: 1, visible: true, hi: {}, dim: 0 };
}
async function eqWrite(id, src, pl, dur) {
  const I = inst(src, pl); I.writeP = 0; EQ.items.set(id, I);
  await tween(I, 'writeP', 1, (dur ?? (I.sprites.length < 15 ? 1 : 2)) * EQ.writeMul, { ease: linear, tag: 'morph' });
}
async function eqMorph(fromId, toId, src, pl, { copy = false, style = null } = {}) {
  const e = eqEpoch, A = EQ.items.get(fromId), B = inst(src, pl);
  if (!A || instant || reduced) { if (A && !copy && fromId !== toId) EQ.items.delete(fromId); EQ.items.set(toId, B); return; }
  const m = (style || EQ.style) === 'shape' ? { kind: 'shape', plan: reshapePlan(A.sprites, B.sprites), t: 0 } : { kind: 'match', plan: matchPlan(A.sprites, B.sprites, { subs: EQ.subs }), t: 0 };
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
  reshape: { steps: [
    { label: 'Write', run: () => eqWrite('f', String.raw`T(a+b) = T(a)\,T(b)`, MID) },
    { label: 'Into the exponential', run: () => eqMorph('f', 'f', String.raw`T(z) = e^{-\sigma z}`, MID, { style: 'shape' }) },
    { label: "Into Bernoulli's limit", run: () => eqMorph('f', 'f', String.raw`\lim_{N\to\infty}\left(1-\frac{\tau}{N}\right)^{N}`, MID, { style: 'shape' }) },
    { label: 'Into a circle', run: () => eqMorph('f', 'f', '@circle', MID, { style: 'shape' }) },
    { label: 'Into the transfer equation', run: () => eqMorph('f', 'f', RTE, { x: 960, y: 500, size: 80, fit: 1800 }, { style: 'shape' }) },
    { label: 'Back to Beer–Lambert', run: () => eqMorph('f', 'f', String.raw`I = I_0\, e^{-\sigma_a d}`, MID, { style: 'shape' }) },
  ] },
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
  instant++;
  try { for (let i = 0; i < (play ? k : k + 1); i++) await steps[i].run(); } catch (err) { console.error(err); } finally { instant--; }
  EQ.step = k;
  if (play && k >= 0) await steps[k].run();
}
function draw2(ctx, dt, st) {
  for (const I of st.items.values()) if (I.visible && I.alpha > 0.003) drawSprites(ctx, I.sprites, { p: I.writeP, alpha: I.alpha, hi: I.hi, dim: I.dim });
  for (const m of st.morphs) (m.kind === 'shape' ? drawReshape : drawMorph)(ctx, m.plan, m.t);
  for (const b of st.braces) {
    drawBrace(ctx, (b.x0 + b.x1) / 2, b.top, (b.x1 - b.x0) * b.g, b.h, b.th, b.color, Math.min(1, b.g * 4));
    if (b.l > 0.003) for (const s of b.lab) drawSprite(ctx, shifted(s, 0, (1 - b.l) * 14), s.alpha * b.l, b.color);
  }
}

// ---------- axes, the manim way ----------
// Lines through the origin (or the start of a range), tips past the last tick, a tick at every step,
// numbers in Computer Modern and TeX labels at the tips. st.c draws the lines in (manim's Create),
// numbers fade in as the lines pass them, st.lab writes the labels in.
function makeAxes(o) {
  const A = { ext: 50, numSize: 34, labSize: 64, ...o };
  A.sx = (A.R - A.L) / (A.xr[1] - A.xr[0]); A.sy = (A.B - A.T) / (A.yr[1] - A.yr[0]);
  A.X = (x) => A.L + (x - A.xr[0]) * A.sx; A.Y = (y) => A.B - (y - A.yr[0]) * A.sy;
  A.ox = A.X(clamp(0, A.xr[0], A.xr[1])); A.oy = A.Y(clamp(0, A.yr[0], A.yr[1]));
  return A;
}
const stops = (lo, hi, step) => { const v = []; for (let k = Math.ceil(lo / step - 1e-9); k * step <= hi + 1e-9; k++) v.push(Math.round(k * step * 1e6) / 1e6); return v; };
const numText = (v) => (v < 0 ? '−' : '') + String(Math.abs(v));
function arrowTip(ctx, x, y, dx, dy, len, half) {
  const bx = x - dx * len, by = y - dy * len;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(bx - dy * half, by + dx * half); ctx.lineTo(bx + dy * half, by - dx * half); ctx.closePath(); ctx.fill();
}
function drawAxes(ctx, A, st) {
  const c = st.c ?? 1; if (c <= 0.001) return;
  const lp = clamp(c / 0.85, 0, 1), tk = clamp((c - 0.82) / 0.18, 0, 1);
  const xa = A.X(A.xr[0]), xe = A.X(A.xr[1]) + A.ext, ya = A.Y(A.yr[0]), ye = A.Y(A.yr[1]) - A.ext;
  const rx = lerp(xa, xe, lp), ry = lerp(ya, ye, lp);
  const xs = stops(A.xr[0], A.xr[1], A.xr[2]), ys = stops(A.yr[0], A.yr[1], A.yr[2]);
  ctx.save();
  if ((st.grid ?? 0) > 0.003) {   // NumberPlane's faint blue lines
    ctx.strokeStyle = hexA(COL.blue, 0.24 * st.grid * lp); ctx.lineWidth = 1.5; ctx.beginPath();
    for (const v of xs) { const x = A.X(v); ctx.moveTo(x, A.Y(A.yr[1])); ctx.lineTo(x, A.Y(A.yr[0])); }
    for (const v of ys) { const y = A.Y(v); ctx.moveTo(A.X(A.xr[0]), y); ctx.lineTo(A.X(A.xr[1]), y); }
    ctx.stroke();
  }
  ctx.strokeStyle = AXIS; ctx.fillStyle = AXIS; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(xa, A.oy); ctx.lineTo(rx, A.oy); ctx.moveTo(A.ox, ya); ctx.lineTo(A.ox, ry); ctx.stroke();
  if (tk > 0) { arrowTip(ctx, xe, A.oy, 1, 0, 24 * tk, 10 * tk); arrowTip(ctx, A.ox, ye, 0, -1, 24 * tk, 10 * tk); }
  ctx.lineWidth = 2.5; ctx.beginPath();
  for (const v of xs) { const x = A.X(v); if (x <= rx + 0.5) { ctx.moveTo(x, A.oy - 10); ctx.lineTo(x, A.oy + 10); } }
  for (const v of ys) { const y = A.Y(v); if (y >= ry - 0.5) { ctx.moveTo(A.ox - 10, y); ctx.lineTo(A.ox + 10, y); } }
  ctx.stroke();
  const na = st.nums ?? 1;
  if (na > 0.003) {
    ctx.font = cm(A.numSize); ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'center';
    for (const v of xs) {
      if (A.skipX0 && v === 0) continue;
      const x = A.X(v), a = na * clamp((rx - x) / 70, 0, 1); if (a <= 0.003) continue;
      ctx.fillStyle = hexA(COL.white, a); ctx.fillText(numText(v), x, A.oy + 22 + 0.68 * A.numSize);
    }
    ctx.textAlign = 'right';
    for (const v of ys) {
      if (v === 0) continue;
      const y = A.Y(v), a = na * clamp((y - ry) / 70, 0, 1); if (a <= 0.003) continue;
      ctx.fillStyle = hexA(COL.white, a); ctx.fillText(numText(v), A.ox - 22, y + 0.34 * A.numSize);
    }
  }
  ctx.restore();
  const lab = st.lab ?? 1;
  if (lab > 0.003) {
    if (A.xl) drawTex(ctx, A.xl, xe + 22, A.oy, A.labSize, { ax: 0, ay: 0.5, p: lab });
    if (A.yl) drawTex(ctx, A.yl, A.ox + 26, ye + 14, A.labSize, { ax: 0, ay: 0.8, p: lab });
  }
}
// A curve drawn from `from` to `to` in x; p < 1 draws only its first part (manim's Create on a graph).
function drawCurve(ctx, A, f, { p = 1, from = A.xr[0], to = A.xr[1], color = COL.blue, width = 6, alpha = 1 } = {}) {
  if (p <= 0.0005 || alpha <= 0.003) return null;
  const q = clamp(p, 0, 1), xe = lerp(from, to, q), n = Math.max(2, Math.ceil(320 * q)), top = A.Y(A.yr[1]) - A.ext * 0.5;
  ctx.save(); ctx.beginPath(); ctx.rect(A.X(A.xr[0]) - 20, top, A.X(A.xr[1]) - A.X(A.xr[0]) + 40, A.Y(A.yr[0]) - top + 20); ctx.clip();
  ctx.beginPath();
  for (let i = 0; i <= n; i++) { const x = lerp(from, xe, i / n), px = A.X(x), py = A.Y(clamp(f(x), A.yr[0] - 50, A.yr[1] + 50)); if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
  ctx.strokeStyle = hexA(color, alpha); ctx.lineWidth = width; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke();
  ctx.restore();
  return [A.X(xe), A.Y(f(xe))];
}
function untween(obj, key) { for (let i = tweens.length - 1; i >= 0; i--) if (tweens[i].obj === obj && tweens[i].key === key) tweens.splice(i, 1)[0].resolve(); }

// ---------- 3. plot ----------
const S3 = defScene({
  id: 'plot', tab: 'Plot',
  defaults: () => ({ c: 1, nums: 1, lab: 1, p: 1, dotA: 0, sigma: 0.1, xmax: 20, fn: 'exp', grid: 0, xl: 'z', yl: 'T(z)', axesT: 1.6, plotT: 2.2 }),
  actions: [
    { id: 'axes', label: 'Create axes', run: async (st) => { st.p = 0; st.c = 0; st.lab = 0; tween(st, 'lab', 1, 1, { ease: linear, delay: st.axesT * 0.75 }); await tween(st, 'c', 1, st.axesT); } },
    { id: 'plot', label: 'Plot', primary: true, run: async (st) => { st.dotA = 0; st.p = 0; await tween(st, 'p', 1, st.plotT); } },
    { id: 'plotdot', label: 'Plot with a dot', run: async (st, alive) => { st.p = 0; st.dotA = 1; await tween(st, 'p', 1, st.plotT * 1.2); if (alive()) await tween(st, 'dotA', 0, 0.5); } },
    { id: 'both', label: 'Axes, then plot', run: async (st, alive) => {
      st.p = 0; st.c = 0; st.lab = 0; tween(st, 'lab', 1, 1, { ease: linear, delay: st.axesT * 0.75 });
      await tween(st, 'c', 1, st.axesT); if (!alive()) return; await sleep(0.6, 'plot'); if (!alive()) return; await tween(st, 'p', 1, st.plotT);
    } },
    { id: 'clear', label: 'Uncreate curve', run: (st) => tween(st, 'p', 0, 1.2) },
    RESET,
  ],
  params: [
    { type: 'select', key: 'fn', label: 'Curve', options: [['exp', 'e^(−σz)'], ['half', '2^(−z/h), h = ln2/σ: the same curve'], ['lin', '1 − σz, a straight line']] },
    { type: 'range', key: 'sigma', label: 'σ', min: 0.02, max: 0.4, step: 0.005, fmt: (v) => v.toFixed(3) },
    { type: 'range', key: 'xmax', label: 'z from 0 to', min: 5, max: 40, step: 5, fmt: (v) => String(v) },
    { type: 'range', key: 'axesT', label: 'Axes time (s)', min: 0.4, max: 5, step: 0.1, fmt: (v) => v.toFixed(1) },
    { type: 'range', key: 'plotT', label: 'Plot time (s)', min: 0.4, max: 6, step: 0.1, fmt: (v) => v.toFixed(1) },
    { type: 'check', key: 'grid', label: 'Grid', set: (v) => tween(S3, 'grid', v ? 1 : 0, 0.5) },
    { type: 'text', key: 'xl', label: 'x label (TeX)' },
    { type: 'text', key: 'yl', label: 'y label (TeX)' },
  ],
  draw: (ctx, dt, st) => {
    const step = st.xmax <= 10 ? 1 : st.xmax <= 25 ? 5 : 10;
    const A = makeAxes({ L: 300, R: 1560, T: 240, B: 880, xr: [0, st.xmax, step], yr: [0, 1, 0.25], xl: st.xl, yl: st.yl });
    drawAxes(ctx, A, st);
    const s = st.sigma, f = st.fn === 'lin' ? (z) => Math.max(0, 1 - s * z) : st.fn === 'half' ? (z) => Math.pow(2, -z / (Math.LN2 / s)) : (z) => Math.exp(-s * z);
    const end = drawCurve(ctx, A, f, { p: st.p });
    if (end) dot(ctx, end[0], end[1], 11, COL.yellow, st.dotA);
  },
});

// ---------- 4. beam and plot, the same x ----------
const S4 = defScene({
  id: 'sync', tab: 'Beam and plot', shared: true,
  defaults: () => ({ c: 1, nums: 1, lab: 1, p: 1, z: 7, probeA: 1, trace: 0, sigma: 0.06, d: 20, fmt: 'pct', guides: 1, hline: 0, sweepT: 3.6 }),
  actions: [
    { id: 'axes', label: 'Create axes', run: async (st) => { st.trace = 0; st.p = 0; st.c = 0; st.lab = 0; st.probeA = 0; tween(st, 'lab', 1, 0.9, { ease: linear, delay: 1.2 }); await tween(st, 'c', 1, 1.6); } },
    { id: 'plot', label: 'Plot', run: async (st) => { st.trace = 0; st.p = 0; await tween(st, 'p', 1, 2.2); } },
    { id: 'sweep', label: 'Sweep the point', primary: true, run: async (st, alive) => {
      st.trace = 0; tween(st, 'probeA', 1, 0.3); await tween(st, 'z', 0, 0.7); if (!alive()) return; await tween(st, 'z', zMax4(st), st.sweepT);
    } },
    { id: 'to6', label: 'Fade into shadows', run: () => fadeTo('shadows', 4) },
    { id: 'trace', label: 'Trace the curve', run: async (st, alive) => {
      st.trace = 1; st.p = 0; st.z = 0; tween(st, 'probeA', 1, 0.3); await tween(st, 'z', zMax4(st), st.sweepT); if (alive()) { st.trace = 0; st.p = 1; }
    } },
    RESET,
  ],
  params: [
    { type: 'range', key: 'sigma', label: 'Absorption σₐ (1/cm)', min: 0.01, max: 0.2, step: 0.005, fmt: (v) => v.toFixed(3) },
    { type: 'range', key: 'd', label: 'Distance d (cm)', min: 8, max: 28, step: 1, fmt: (v) => v.toFixed(0), set: (v) => { S4.d = v; S4.z = Math.min(S4.z, v); } },
    { type: 'range', key: 'sweepT', label: 'Sweep time (s)', min: 0.5, max: 10, step: 0.1, fmt: (v) => v.toFixed(1) },
    { type: 'range', key: 'z', label: 'Point at z (cm)', min: 0, max: 28, step: 0.1, fmt: (v) => v.toFixed(1), set: (v) => { untween(S4, 'z'); S4.z = Math.min(v, S4.d); } },
    { type: 'select', key: 'fmt', label: 'Readout', options: [['pct', 'Percent'], ['frac', 'Fraction'], ['none', 'None']] },
    { type: 'check', key: 'guides', label: 'Plot range from the medium', set: (v) => tween(S4, 'guides', v ? 1 : 0, 0.4) },
    { type: 'check', key: 'hline', label: 'Line to the y axis', set: (v) => tween(S4, 'hline', v ? 1 : 0, 0.4) },
  ],
  draw: draw4, pointer: pointer4,
});
// With a cloud as the volume, the plot spans the cloud, so z = 0 is where the beam first meets it.
function geo4(st) {
  const y = 240, apX = 340, pxcm = 34, cw = st.d * pxcm, g = { y, apX, pxcm, cx: 960, cw, x0: 960 - cw / 2, x1: 960 + cw / 2, top: 100, bot: 392, th: 292 };
  if (SH.container === 'cloud') {
    g.puffs = cloudPuffs(g, { cloud: 1 }, 0.55, 0.8);
    g.x0 = Math.max(apX + 30, Math.min(...g.puffs.map((q) => q[0] - q[2]))); g.x1 = Math.max(...g.puffs.map((q) => q[0] + q[2]));
  }
  return g;
}
const zMax4 = (st) => { const g = geo4(st); return (g.x1 - g.x0) / g.pxcm; };
function axes4(g) {
  const dz = (g.x1 - g.x0) / g.pxcm, step = dz <= 10 ? 2 : dz <= 24 ? 5 : 10;
  return makeAxes({ L: g.x0, R: g.x1, T: 640, B: 975, xr: [0, dz, step], yr: [0, 1, 0.5], ext: 46, xl: 'z', yl: String.raw`I/I_0`, labSize: 56, numSize: 32 });
}
function draw4(ctx, dt, st) {
  const g = geo4(st), A = axes4(g), cloud = SH.container === 'cloud', dz = (g.x1 - g.x0) / g.pxcm;
  let T;
  if (cloud) { buildCloudTau({ sigma: st.sigma, cloud: 1 }, g, g.puffs); T = cloudT; drawCloud(ctx, g.puffs, { cloud: 1 }); }
  else { T = (x) => Math.exp((-st.sigma * Math.max(0, Math.min(g.x1, x) - Math.max(g.x0, g.apX))) / g.pxcm); drawLiquid(ctx, g, mediumOf(0.86)); }
  drawBeam(ctx, g.apX, W + 2, g.y, SH.color, SH.I0, T, cloud ? [] : [g.x0, g.x1]);
  if (!cloud) drawGlass(ctx, g);
  drawLaser(ctx, g.apX, g.y, SH.color, 1);
  // the plot's range, carried down from where the medium starts and ends
  const ga = st.guides * st.c, gy = cloud ? g.y + 70 : g.bot + 14;
  dashed(ctx, g.x0, gy, g.x0, A.Y(A.yr[1]) - A.ext - 14, COL.greyC, ga, 2);
  dashed(ctx, g.x1, gy, g.x1, A.oy - 2, COL.greyC, ga, 2);
  drawAxes(ctx, A, st);
  drawCurve(ctx, A, (z) => T(A.X(z)), { p: st.trace ? clamp(st.z / dz, 0, 1) : st.p, from: 0, to: dz });
  if (st.probeA > 0.003) {
    const z = clamp(st.z, 0, dz), x = A.X(z), v = T(x), py = A.Y(v), a = st.probeA;
    dotted(ctx, x, g.y + 20, x, py - 18, COL.white, 0.7 * a);
    if (st.hline > 0.003) dotted(ctx, x - 18, py, A.ox + 14, py, COL.white, 0.55 * a * st.hline);
    dot(ctx, x, g.y, 11, COL.yellow, a); dot(ctx, x, py, 11, COL.yellow, a);
    if (st.fmt !== 'none') drawNumber(ctx, st.fmt === 'pct' ? v * 100 : v, x + 26, py - 28, { size: 50, dec: st.fmt === 'pct' ? 1 : 3, suffix: st.fmt === 'pct' ? '%' : '', color: COL.yellow, alpha: a });
  }
}
function pointer4(type, x, y) {
  const st = S4, g = geo4(st), A = axes4(g), sc = scenes.sync, dz = (g.x1 - g.x0) / g.pxcm;
  const over = x > g.x0 - 40 && x < g.x1 + 40 && (Math.abs(y - g.y) < 70 || (y > A.Y(1) - 40 && y < A.oy + 20));
  const setZ = () => { st.z = clamp((x - g.x0) / g.pxcm, 0, dz); };
  if (type === 'down') { sc.drag = over; if (over) { sc.epoch++; untween(st, 'z'); st.trace = 0; st.probeA = 1; setZ(); } return over; }
  if (type === 'up') { sc.drag = false; return false; }
  if (sc.drag) { setZ(); return true; }
  return over;
}

// ---------- 5. e^{ax} ----------
const aId = (v) => 'a' + String(v).replace('-', 'm').replace('.', 'p');
const S5 = defScene({
  id: 'eax', tab: 'e^-ax', tabHtml: 'e<sup>−ax</sup>',
  defaults: () => ({ c: 1, nums: 1, lab: 1, p: 1, a: 0.5, numA: 1, dot0: 0, dur: 1.2 }),
  actions: [
    { id: 'create', label: 'Create', run: async (st, alive) => {
      st.c = 0; st.lab = 0; st.p = 0; st.numA = 0;
      await tween(st, 'c', 1, 1.5); if (!alive()) return;
      tween(st, 'numA', 1, 0.5, { delay: 0.8 }); await tween(st, 'lab', 1, 1.2, { ease: linear }); if (!alive()) return;
      await tween(st, 'p', 1, 1.8);
    } },
    ...[2, 1, 0.5, 0, -0.5].map((v) => ({ id: aId(v), label: `a = ${fmtNum(v, Number.isInteger(v) ? 0 : 1)}`, run: (st) => tween(st, 'a', v, st.dur) })),
    { id: 'sweep', label: 'Sweep a', primary: true, run: async (st, alive) => {
      for (const v of [1.5, -0.4, 0.5]) { await tween(st, 'a', v, st.dur * 1.5); if (!alive()) return; await sleep(0.3, 'eax'); if (!alive()) return; }
    } },
    RESET,
  ],
  params: [
    { type: 'range', key: 'a', label: 'a', min: -2, max: 2, step: 0.01, fmt: (v) => fmtNum(v, 2), set: (v) => { untween(S5, 'a'); S5.a = v; } },
    { type: 'range', key: 'dur', label: 'Time per change (s)', min: 0.3, max: 3, step: 0.1, fmt: (v) => v.toFixed(1) },
    { type: 'check', key: 'dot0', label: 'Dot at (0, 1)', set: (v) => tween(S5, 'dot0', v ? 1 : 0, 0.4) },
  ],
  draw: (ctx, dt, st) => {
    const A = makeAxes({ L: 330, R: 1590, T: 330, B: 950, xr: [-3, 3, 1], yr: [0, 6, 1], xl: 'x', yl: 'y', skipX0: true });
    drawAxes(ctx, A, st);
    drawCurve(ctx, A, (x) => Math.exp(-st.a * x), { p: st.p });
    dot(ctx, A.X(0), A.Y(1), 10, COL.white, st.dot0);
    if (st.lab > 0.003) {
      drawTex(ctx, String.raw`y = e^{-${tc(COL.yellow, 'a')}x}`, 170, 150, 84, { ax: 0, p: st.lab });
      const sp = drawTex(ctx, `${tc(COL.yellow, 'a')} =`, 170, 262, 84, { ax: 0, p: st.lab }), eq = sp[sp.length - 1];
      if (eq) drawNumber(ctx, st.a, eq.x + eq.w + 0.3 * eq.fpx, eq.base, { size: eq.fpx, dec: 2, color: COL.yellow, alpha: st.numA * st.lab });
    }
  },
});

// ---------- A. shadows in a slab (Bohren and Huffman §3.4, their Fig. 3.8) ----------
// Parallel rays cross a slab of absorbing discs, and a ray stops at the first disc it meets. Yellow: the
// fraction of rays still going at each depth, counted from the rays on screen. Blue: what independent,
// uniformly random positions predict, e^{-nσz} with σ = 2r, the width of one disc's shadow. Arranging the
// same discs differently (a lattice, clumps) breaks the exponential: shadows overlap more, or less.
const SL = { ex: 250, x0: 400, x1: 1500, top: 110, bot: 520 };   // emitter, slab faces, top and bottom of the sheet of rays
let parts = [];   // each disc: where it comes from (fx, fy) and goes to (tx, ty) while st.mu runs 0 → 1
function rng32(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const gauss = (rnd) => { const u = Math.max(1e-9, rnd()), v = rnd(), m = Math.sqrt(-2 * Math.log(u)); return [m * Math.cos(2 * Math.PI * v), m * Math.sin(2 * Math.PI * v)]; };
// Centres live in [a, b] × [y0, y1]: inside the slab, and a radius past the sheet's edges, so every ray
// sees the same number density.
const slabBox = (st) => ({ a: SL.x0 + st.r, b: SL.x1 - st.r, y0: SL.top - st.r, y1: SL.bot + st.r });
function layoutDiscs(st) {
  const { a, b, y0, y1 } = slabBox(st), N = Math.round(st.n), rnd = rng32(st.seed * 7919 + 17), out = [];
  if (st.dist === 'random') for (let i = 0; i < N; i++) out.push([lerp(a, b, rnd()), lerp(y0, y1, rnd())]);
  else if (st.dist === 'clumped') {
    const k = Math.max(2, Math.round(N / 8)), cs = [];
    for (let i = 0; i < k; i++) cs.push([lerp(a, b, rnd()), lerp(y0, y1, rnd())]);
    for (let i = 0; i < N; i++) { const c = cs[Math.floor(rnd() * k)], g = gauss(rnd); out.push([clamp(c[0] + g[0] * st.clump, a, b), clamp(c[1] + g[1] * st.clump, y0, y1)]); }
  } else {
    // a grid of cells: jittered puts one disc anywhere in each cell; the lattice puts it in the middle, and
    // tilt slides each column down a little more than the last (wrapping round), so rows stop lining up
    const nr = Math.max(1, Math.round(Math.sqrt((N * (y1 - y0)) / (b - a)))), nc = Math.ceil(N / nr), sx = (b - a) / nc, sy = (y1 - y0) / nr;
    const shift = sx * Math.tan((st.tilt * Math.PI) / 180);
    for (let i = 0; i < N; i++) {
      const col = i % nc, row = Math.floor(i / nc);
      if (st.dist === 'jitter') out.push([a + (col + rnd()) * sx, y0 + (row + rnd()) * sy]);
      else { const y = y0 + (row + 0.5) * sy + col * shift, h = y1 - y0; out.push([a + (col + 0.5) * sx, y0 + ((((y - y0) % h) + h) % h)]); }
    }
  }
  return out;
}
const discBase = (st) => parts.map((p) => [lerp(p.fx, p.tx, st.mu), lerp(p.fy, p.ty, st.mu)]);
// Jiggle: each disc drifts around its place on its own slow loop, so the medium looks alive while the
// arrangement, on average, stays the same.
const JIG = [];
const jigOf = (i) => JIG[i] || (JIG[i] = (() => { const r = rng32(i * 2654435761 + 7); return [r() * 6.283, r() * 6.283, 0.25 + 0.4 * r(), 0.25 + 0.4 * r()]; })());
const discPos = (st) => {
  const amp = reduced ? 0 : st.jig * st.jigAmp;
  return parts.map((p, i) => {
    let x = lerp(p.fx, p.tx, st.mu), y = lerp(p.fy, p.ty, st.mu);
    if (amp > 0.01) { const [px, py, fx, fy] = jigOf(i); x += amp * Math.sin(TIME * fx * 6.283 + px); y += amp * Math.sin(TIME * fy * 6.283 + py); }
    return [x, y];
  });
};
function placeDiscs(st) { parts = layoutDiscs(st).map(([x, y]) => ({ fx: x, fy: y, tx: x, ty: y })); st.mu = 1; }
// Move the discs to a new arrangement. Each new spot takes the nearest disc still free, so paths stay short.
function moveDiscs(st, dur = 1.5) {
  const from = discBase(st), to = layoutDiscs(st);
  if (from.length !== to.length) { placeDiscs(st); return Promise.resolve(); }
  const used = new Uint8Array(from.length), rnd = rng32(st.seed + 99), order = to.map((_, i) => i).sort(() => rnd() - 0.5);
  const next = new Array(to.length);
  for (const j of order) {
    let best = -1, bd = Infinity;
    for (let i = 0; i < from.length; i++) if (!used[i]) { const d = (from[i][0] - to[j][0]) ** 2 + (from[i][1] - to[j][1]) ** 2; if (d < bd) { bd = d; best = i; } }
    used[best] = 1; next[j] = { fx: from[best][0], fy: from[best][1], tx: to[j][0], ty: to[j][1] };
  }
  parts = next; st.mu = 0;
  return tween(st, 'mu', 1, dur);
}
const rayYs = (st) => { const k = st.rays === 'sheet' ? Math.round(SL.bot - SL.top) : +st.rays, ys = []; for (let i = 0; i < k; i++) ys.push(SL.top + ((i + 0.5) * (SL.bot - SL.top)) / k); return ys; };
// Where each ray meets its first disc (Infinity if it never does).
function firstHits(ys, pos, R) {
  const hits = new Float64Array(ys.length);
  for (let i = 0; i < ys.length; i++) {
    let h = Infinity; const y = ys[i];
    for (const [x, py] of pos) { const dy = y - py; if (dy > -R && dy < R) { const xh = x - Math.sqrt(R * R - dy * dy); if (xh < h) h = xh; } }
    hits[i] = h;
  }
  return hits;
}
// Independent random centres: a ray is still going at x when no centre lies in the strip it has swept, so
// T(x) = exp(−n · area of that strip). Past the first radius the area grows by 2r per unit of x: e^{−nσz}.
function predictedT(st, x) {
  const { a, b, y0, y1 } = slabBox(st), R = st.r, n = Math.round(st.n) / ((b - a) * (y1 - y0));
  let A = 0; const k = 32;
  for (let i = 0; i < k; i++) { const u = -R + ((i + 0.5) * 2 * R) / k; A += clamp(x + Math.sqrt(R * R - u * u) - a, 0, b - a); }
  return Math.exp(-n * A * ((2 * R) / k));
}
const SA = defScene({
  id: 'shadows', tab: 'Shadows in a slab', shared: true,
  defaults: () => ({ n: 70, r: 8, dist: 'random', clump: 22, tilt: 0, rays: '120', seed: 1, mu: 1, front: 1, pred: 1, marks: 1, labels: 1, shineT: 2.6,
    jig: 1, jigAmp: 6, sensorX: 1600, shown: null }),
  init: () => placeDiscs(SA),
  onReset: () => placeDiscs(SA),
  actions: [
    { id: 'shine', label: 'Shine', primary: true, run: (st) => { st.front = 0; st.shown = null; return tween(st, 'front', 1, st.shineT, { ease: linear }); } },
    { id: 'random', label: 'Uniform', run: (st) => { st.dist = 'random'; return moveDiscs(st); } },
    { id: 'jitter', label: 'Jittered', run: (st) => { st.dist = 'jitter'; return moveDiscs(st); } },
    { id: 'lattice', label: 'Lattice', run: (st) => { st.dist = 'lattice'; return moveDiscs(st); } },
    { id: 'clumped', label: 'Clumped', run: (st) => { st.dist = 'clumped'; return moveDiscs(st); } },
    { id: 'jiggle', label: 'Jiggle on / off', run: (st) => tween(st, 'jig', st.jig > 0.5 ? 0 : 1, 0.8) },
    { id: 'resample', label: 'Resample', run: (st) => { st.seed += 1; return moveDiscs(st, 1.2); } },
    { id: 'zoomout', label: 'Zoom out to the tank', run: () => { Object.assign(SZ, { hl: 1, zoom: 1, parts: 1 }); setScene('zoom'); runAction(scenes.zoom, { run: (st) => tween(st, 'zoom', 0, st.zoomT * 0.85) }); } },
    RESET,
  ],
  params: [
    { type: 'range', key: 'n', label: 'Discs', min: 5, max: 400, step: 1, fmt: (v) => String(v), set: (v) => { SA.n = v; placeDiscs(SA); } },
    { type: 'range', key: 'r', label: 'Disc radius', min: 3, max: 30, step: 0.5, fmt: (v) => v.toFixed(1), set: (v) => { SA.r = v; placeDiscs(SA); } },
    { type: 'select', key: 'rays', label: 'Rays', options: [['30', '30 rays'], ['120', '120 rays'], ['sheet', 'A sheet (every row)']] },
    { type: 'range', key: 'jigAmp', label: 'Jiggle size (px)', min: 0, max: 40, step: 1, fmt: (v) => String(v) },
    { type: 'range', key: 'clump', label: 'Clump size', min: 4, max: 80, step: 1, fmt: (v) => String(v), set: (v) => { SA.clump = v; placeDiscs(SA); }, visible: (st) => st.dist === 'clumped' },
    { type: 'range', key: 'tilt', label: 'Lattice tilt (°)', min: -30, max: 30, step: 0.5, fmt: (v) => v.toFixed(1), set: (v) => { SA.tilt = v; placeDiscs(SA); }, visible: (st) => st.dist === 'lattice' },
    { type: 'range', key: 'shineT', label: 'Shine time (s)', min: 0.5, max: 8, step: 0.1, fmt: (v) => v.toFixed(1) },
    { type: 'check', key: 'pred', label: 'Prediction e^(−nσz)', set: (v) => tween(SA, 'pred', v ? 1 : 0, 0.5) },
    { type: 'check', key: 'marks', label: 'Where rays stop', set: (v) => tween(SA, 'marks', v ? 1 : 0, 0.4) },
    { type: 'check', key: 'labels', label: 'Curve labels', set: (v) => tween(SA, 'labels', v ? 1 : 0, 0.4) },
  ],
  draw: drawShadows, pointer: pointerShadows,
});
// A laser that emits a sheet as tall as the slab.
function drawSheetLaser(ctx, x, top, bot, color) {
  ctx.save(); ctx.lineWidth = 3; ctx.strokeStyle = COL.greyB; ctx.fillStyle = BODY;
  ctx.beginPath(); ctx.roundRect(x - 214, top - 30, 192, bot - top + 60, 12); ctx.fill(); ctx.stroke();
  ctx.fillStyle = NOZZLE; ctx.beginPath(); ctx.roundRect(x - 22, top - 10, 22, bot - top + 20, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = hexA(color, 1); ctx.beginPath(); ctx.arc(x - 64, top - 2, 6, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
const sensorX6 = (st) => clamp(st.sensorX, SL.x0 - 90, 1860);
function shadowsState(st) {
  const R = st.r, pos = discPos(st), ys = rayYs(st);
  return { R, pos, ys, hits: firstHits(ys, pos, R), k: ys.length, xf: lerp(SL.ex, W + 10, st.front), sx: sensorX6(st) };
}
function drawShadows(ctx, dt, st) { const S = shadowsState(st); drawShadowsPicture(ctx, dt, st, S); drawShadowsPlot(ctx, st, S, 1); }
function drawShadowsPicture(ctx, dt, st, S) {
  const { R, pos, ys, hits, k, xf, sx } = S, color = SH.color, sheet = st.rays === 'sheet', power = SH.I0, glow = SH.beamLook === 'glow';
  dashed(ctx, SL.x0, SL.top - 70, SL.x0, SL.bot + 70, COL.greyC, 1, 2);
  dashed(ctx, SL.x1, SL.top - 70, SL.x1, SL.bot + 70, COL.greyC, 1, 2);
  // rays and discs; right of the sensor they are still drawn, faded: the sensor is a probe, not a wall
  const layer = () => {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const rays = () => { ctx.beginPath(); for (let i = 0; i < k; i++) { const xe = Math.min(hits[i], xf); if (xe > SL.ex) { ctx.moveTo(SL.ex, ys[i]); ctx.lineTo(xe, ys[i]); } } ctx.stroke(); };
    if (sheet) { ctx.strokeStyle = hexA(color, 0.75 * power); ctx.lineWidth = 1.2; rays(); }
    else { if (glow) { ctx.strokeStyle = hexA(color, 0.14 * power); ctx.lineWidth = 6; rays(); } ctx.strokeStyle = hexA(color, 0.95 * power); ctx.lineWidth = 1.8; rays(); }
    if (st.marks > 0.003 && !sheet) for (let i = 0; i < k; i++) if (hits[i] < xf) dot(ctx, hits[i], ys[i], 3.2, '#FFFFFF', 0.85 * st.marks);
    ctx.restore();
    ctx.fillStyle = PART; ctx.strokeStyle = COL.greyB; ctx.lineWidth = Math.min(2.5, R * 0.3);
    ctx.beginPath(); for (const [x, y] of pos) { ctx.moveTo(x + R, y); ctx.arc(x, y, R, 0, Math.PI * 2); } ctx.fill(); ctx.stroke();
  };
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, sx, H); ctx.clip(); layer(); ctx.restore();
  ctx.save(); ctx.beginPath(); ctx.rect(sx, 0, W - sx, H); ctx.clip(); ctx.globalAlpha = 0.22; layer(); ctx.restore();
  drawSheetLaser(ctx, SL.ex, SL.top, SL.bot, color);
  // the sensor: lit where rays arrive, with the fraction that arrived beside it (counting as it changes)
  let reached = null;   // the fraction of rays that reach the sensor
  if (xf >= sx) { let c = 0; for (const h of hits) if (h > sx) c++; reached = c / k; }
  st.shown = reached == null ? null : st.shown == null || reduced ? reached : lerp(st.shown, reached, 1 - Math.exp(-dt * 6));
  ctx.save(); ctx.lineWidth = 3; ctx.strokeStyle = COL.greyB; ctx.fillStyle = BODY;
  ctx.beginPath(); ctx.roundRect(sx, SL.top - 30, 26, SL.bot - SL.top + 60, 6); ctx.fill(); ctx.stroke();
  if (reached != null) { ctx.fillStyle = hexA(color, 0.95 * power); for (let i = 0; i < k; i++) if (hits[i] > sx) ctx.fillRect(sx - 3, ys[i] - (sheet ? 0.6 : 1.4), 5, sheet ? 1.2 : 2.8); }
  ctx.restore();
  if (st.shown != null) drawShadowsReadout(ctx, sx, st.shown, 1);
}
function drawShadowsReadout(ctx, sx, v, alpha) {
  const bw = 210, bh = 84, right = sx + 26 + 24 + bw < W - 10, bx = right ? sx + 26 + 24 : sx - 24 - bw, by = (SL.top + SL.bot) / 2 - bh / 2;
  ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = BG; ctx.strokeStyle = COL.greyB; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 12); ctx.fill(); ctx.stroke(); ctx.restore();
  drawNumber(ctx, v * 100, bx + bw / 2, by + bh / 2 + 18, { size: 52, dec: 1, suffix: '%', align: 'center', alpha });
}
// The plot under the slab, on the slab's x: depth in mean free paths 1/(nσ), so the prediction is e^{-x}.
function drawShadowsPlot(ctx, st, S, alpha) {
  if (alpha <= 0.003) return;
  const { R, hits, k, xf, sx } = S;
  let reached = null;
  if (xf >= sx) { let c = 0; for (const h of hits) if (h > sx) c++; reached = c / k; }
  ctx.save(); ctx.globalAlpha = alpha;
  const { a, b, y0, y1 } = slabBox(st), n = Math.round(st.n) / ((b - a) * (y1 - y0)), ns = n * 2 * R, tauMax = ns * (SL.x1 - SL.x0);
  const step = tauMax > 6 ? 2 : tauMax > 2.5 ? 1 : 0.5;
  const A = makeAxes({ L: SL.x0, R: SL.x1, T: 640, B: 975, xr: [0, tauMax, step], yr: [0, 1, 0.5], ext: 46, xl: String.raw`n\sigma z`, yl: 'T', labSize: 52, numSize: 30 });
  drawAxes(ctx, A, { c: 1, nums: 1, lab: 1 });
  const xr = Math.min(xf, SL.x1);
  if (st.pred > 0.003) drawCurve(ctx, A, (t) => predictedT(st, SL.x0 + t / ns), { from: 0, to: tauMax, color: COL.blue, alpha: st.pred, width: 4 });
  if (xr > SL.x0) {
    const sorted = Array.from(hits).filter((h) => h <= xr).sort((p, q) => p - q), path = new Path2D();
    let alive = k; path.moveTo(SL.x0, A.Y(1));
    for (const h of sorted) { const hx = Math.max(SL.x0, h); path.lineTo(hx, A.Y(alive / k)); alive--; path.lineTo(hx, A.Y(alive / k)); }
    path.lineTo(xr, A.Y(alive / k));
    ctx.save(); ctx.strokeStyle = COL.yellow; ctx.lineWidth = 4; ctx.lineJoin = 'round';
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, sx, H); ctx.clip(); ctx.stroke(path); ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.rect(sx, 0, W - sx, H); ctx.clip(); ctx.globalAlpha *= 0.25; ctx.stroke(path); ctx.restore();
    ctx.restore();
  }
  // the same x on the plot: a dotted line down from the sensor to its value
  if (reached != null && sx >= SL.x0 && sx <= SL.x1) { dotted(ctx, sx, SL.bot + 46, sx, A.Y(reached) - 16, COL.white, 0.6); dot(ctx, sx, A.Y(reached), 9, COL.yellow); }
  // a two-line key in the plot's top right corner, which both curves have left by then
  if (st.labels > 0.003) {
    drawTex(ctx, String.raw`\text{rays left}`, SL.x1, A.Y(1) + 4, 42, { ax: 1, color: COL.yellow, alpha: st.labels });
    if (st.pred > 0.003) drawTex(ctx, String.raw`e^{-n\sigma z}`, SL.x1, A.Y(1) + 62, 46, { ax: 1, color: COL.blue, alpha: st.labels * st.pred });
  }
  ctx.restore();
}
function pointerShadows(type, x, y) {
  const st = SA, sx = sensorX6(st), sc = scenes.shadows;
  const over = x > sx - 26 && x < sx + 52 && y > SL.top - 50 && y < SL.bot + 50;
  if (type === 'down') { sc.drag = over; return over; }
  if (type === 'up') { sc.drag = false; return false; }
  if (sc.drag) { st.sensorX = clamp(x - 13, SL.x0 - 90, 1860); return true; }
  return over;
}

// ---------- B. slice the slab: (1 − τ/N)^N → e^{−τ} ----------
// A thin slab removes light in proportion to its thickness: the linear law, which only holds when the slab
// is thin. Cut a slab of optical depth τ into N equal slabs and give each the linear law: each lets
// 1 − τ/N through, so together they let (1 − τ/N)^N through. Doubling N, the chain of straight pieces
// closes in on e^{−τz/d}. This is Bernoulli's compound interest, as Maor tells it in "e: The Story of a Number".
const SBG = { x0: 420, x1: 1500, top: 150, bot: 430, y: 290, apX: 330 };
const sliceF = (tau, n) => Math.max(0, 1 - tau / n);
// The light left at depth z (0..1) with n slabs: straight within each slab, multiplied slab after slab.
function chainT(tau, n, z) { const f = sliceF(tau, n), k = Math.min(n, Math.floor(z * n)), fr = z * n - k; return Math.pow(f, k) * (k >= n ? 1 : 1 - (1 - f) * fr); }
const SB = defScene({
  id: 'slices', tab: 'Slice the slab', shared: true,
  defaults: () => ({ N: 4, M: 4, u: 1, tau: 1, expA: 1, dotsA: 1, morphT: 1.2 }),
  actions: [
    { id: 'double', label: 'Double N', primary: true, run: (st) => sliceTo(st, Math.min(256, st.M * 2)) },
    { id: 'halve', label: 'Halve N', run: (st) => sliceTo(st, Math.max(1, st.M / 2)) },
    { id: 'keep', label: 'Keep doubling', run: async (st, alive) => {
      if (st.M >= 64) { await sliceTo(st, 1); if (!alive()) return; await sleep(0.4, 'slices'); }
      while (alive() && st.M < 64) { await sliceTo(st, st.M * 2); if (!alive()) return; await sleep(0.45, 'slices'); }
    } },
    { id: 'one', label: 'One slab', run: (st) => sliceTo(st, 1) },
    RESET,
  ],
  params: [
    { type: 'range', key: 'tau', label: 'Optical depth τ', min: 0.25, max: 4, step: 0.05, fmt: (v) => v.toFixed(2) },
    { type: 'range', key: 'morphT', label: 'Time per doubling (s)', min: 0.3, max: 4, step: 0.1, fmt: (v) => v.toFixed(1) },
    { type: 'check', key: 'expA', label: 'Curve e^(−τz/d)', set: (v) => tween(SB, 'expA', v ? 1 : 0, 0.5) },
    { type: 'check', key: 'dotsA', label: 'Dots at slab faces', set: (v) => tween(SB, 'dotsA', v ? 1 : 0, 0.4) },
  ],
  draw: drawSlices,
});
function sliceTo(st, m) {
  st.N = st.M; st.M = m; st.u = 0;
  return tween(st, 'u', 1, st.morphT).then(() => { if (st.u >= 1) st.N = st.M; });
}
function drawSlices(ctx, dt, st) {
  const g = SBG, L = g.x1 - g.x0, u = st.u, T = (z) => lerp(chainT(st.tau, st.N, z), chainT(st.tau, st.M, z), u);
  // the slabs: one band, with the faces between them; faces that are new grow from the middle, old ones shrink away
  const look = SH.container === 'cloud' ? LOOKS.fog : lookOf(SH);
  ctx.save(); ctx.fillStyle = hexA(look.c, clamp(look.a, 0.2, 0.75)); ctx.fillRect(g.x0, g.top, L, g.bot - g.top);
  ctx.strokeStyle = COL.greyA; ctx.lineWidth = 3; ctx.strokeRect(g.x0, g.top, L, g.bot - g.top);
  const faces = new Map();
  for (let k = 1; k < st.N; k++) faces.set(Math.round((k / st.N) * 1e6), [k / st.N, 1 - u]);
  for (let k = 1; k < st.M; k++) { const key = Math.round((k / st.M) * 1e6), had = faces.get(key); faces.set(key, [k / st.M, had ? 1 : u]); }
  ctx.strokeStyle = hexA(COL.greyA, 0.75); ctx.lineWidth = 2; ctx.beginPath();
  for (const [z, s] of faces.values()) { if (s <= 0.003) continue; const x = g.x0 + z * L, h = ((g.bot - g.top) / 2) * smooth(s), cy = (g.top + g.bot) / 2; ctx.moveTo(x, cy - h); ctx.lineTo(x, cy + h); }
  ctx.stroke(); ctx.restore();
  // the beam, losing light slab by slab
  const knots = []; for (let k = 0; k <= Math.max(st.N, st.M); k++) knots.push(g.x0 + (k / Math.max(st.N, st.M)) * L);
  drawBeam(ctx, g.apX, g.x1 + 90, g.y, SH.color, SH.I0, (x) => T(clamp((x - g.x0) / L, 0, 1)), knots);
  drawLaser(ctx, g.apX, g.y, SH.color, 1);
  // N, above the slabs
  const sp = drawTex(ctx, 'N =', 900, 82, 64, { ax: 0.5 }), eq = sp[sp.length - 1];
  if (eq) { const shownN = u < 0.5 ? st.N : st.M; drawNumber(ctx, shownN, eq.x + eq.w + 0.3 * eq.fpx, eq.base, { size: eq.fpx, dec: 0, alpha: Math.abs(2 * u - 1) }); }
  // the plot, on the same x as the slab
  const A = makeAxes({ L: g.x0, R: g.x1, T: 600, B: 960, xr: [0, 1, 0.25], yr: [0, 1, 0.5], ext: 46, xl: 'z/d', yl: 'T', labSize: 52, numSize: 30 });
  drawAxes(ctx, A, { c: 1, nums: 1, lab: 1 });
  if (st.expA > 0.003) drawCurve(ctx, A, (z) => Math.exp(-st.tau * z), { color: COL.blue, alpha: st.expA, width: 4 });
  drawCurve(ctx, A, T, { color: COL.yellow, width: 4 });
  const dn = st.dotsA * clamp((48 - Math.max(st.N, st.M)) / 24, 0, 1);
  if (dn > 0.003) for (const [n, a] of [[st.N, 1 - u], [st.M, u]]) for (let k = 0; k <= n; k++) dot(ctx, A.X(k / n), A.Y(chainT(st.tau, n, k / n)), 7, COL.yellow, dn * a);
  // what comes out, against e^{-τ}
  const out = lerp(Math.pow(sliceF(st.tau, st.N), st.N), Math.pow(sliceF(st.tau, st.M), st.M), u);
  drawTex(ctx, String.raw`\left(1-\frac{\tau}{N}\right)^{N}`, 1570, 650, 54, { ax: 0, color: COL.yellow });
  const e1 = drawTex(ctx, '=', 1570, 755, 54, { ax: 0, color: COL.yellow }).pop();
  if (e1) drawNumber(ctx, out, e1.x + e1.w + 0.3 * e1.fpx, e1.base, { size: e1.fpx, dec: 3, color: COL.yellow });
  const e2 = drawTex(ctx, String.raw`e^{-\tau} =`, 1570, 850, 54, { ax: 0, color: COL.blue, alpha: Math.max(0.35, st.expA) }).pop();
  if (e2) drawNumber(ctx, Math.exp(-st.tau), e2.x + e2.w + 0.3 * e2.fpx, e2.base, { size: e2.fpx, dec: 3, color: COL.blue, alpha: Math.max(0.35, st.expA) });
}

// ---------- Z. zoom into a slab ----------
// Two fronts sweep in from the ends of the medium and meet at the faces of one thin slab, dimming what
// they pass. Then the camera flies into the slab. The slab is cut so that, zoomed in, it is exactly the
// "Shadows in a slab" scene: the beam's width becomes the sheet of rays, the medium's particles become its
// discs, and the laser and sensor slide in to their places there. When the camera lands, that scene takes over.
const SZ = defScene({
  id: 'zoom', tab: 'Zoom into a slab', shared: true,
  defaults: () => ({ hl: 0, zoom: 0, parts: 1, zs: 0.45, zoomT: 3.5, sigma: 0.05, d: 20, sensorX: 1700 }),
  actions: [
    { id: 'hl', label: 'Highlight slab', run: (st) => tween(st, 'hl', 1, 1.4) },
    { id: 'in', label: 'Zoom in', primary: true, run: async (st, alive) => {
      if (st.hl < 1) { await tween(st, 'hl', 1, 1.2); if (!alive()) return; await sleep(0.35, 'zoom'); if (!alive()) return; }
      await tween(st, 'zoom', 1, st.zoomT); if (!alive()) return;
      if (st.parts > 0.5 && cur === scenes.zoom) setScene('shadows');
    } },
    { id: 'out', label: 'Zoom out', run: (st) => tween(st, 'zoom', 0, st.zoomT * 0.8) },
    { id: 'unhl', label: 'Clear highlight', run: (st) => tween(st, 'hl', 0, 0.9) },
    { id: 'parts', label: 'Particles on / off', run: (st) => tween(st, 'parts', st.parts > 0.5 ? 0 : 1, 0.8) },
    RESET,
  ],
  params: [
    { type: 'range', key: 'zs', label: 'Slab position', min: 0, max: 1, step: 0.01, fmt: (v) => `${Math.round(v * 100)} %` },
    { type: 'range', key: 'zoomT', label: 'Zoom time (s)', min: 0.5, max: 10, step: 0.1, fmt: (v) => v.toFixed(1) },
    { type: 'check', key: 'parts', label: 'Particles (then the zoom lands in Shadows in a slab)', set: (v) => tween(SZ, 'parts', v ? 1 : 0, 0.6) },
  ],
  draw: drawZoom,
});
// The camera. The zoom at landing is the sheet's height over the beam's width; the slab is as thick as
// the shadows scene's slab divided by that zoom, so the two pictures line up exactly.
function zoomCam(st) {
  const g = geo1(st), w = SH.beamW, Z1 = (SL.bot - SL.top) / w, dz = (SL.x1 - SL.x0) / Z1;
  const xs = g.x0 + st.zs * (g.cw - dz), xe = xs + dz, fx = (xs + xe) / 2, fy = g.y;
  const cx1 = (SL.x0 + SL.x1) / 2, cy1 = (SL.top + SL.bot) / 2, s = st.zoom, Z = Math.exp(Math.log(Z1) * s);
  const tx = lerp(fx, cx1, s), ty = lerp(fy, cy1, s);
  return { g, w, Z1, dz, xs, xe, fx, fy, cx1, cy1, s, Z, tx, ty, SX: (x) => (x - fx) * Z + tx, SY: (y) => (y - fy) * Z + ty, WX: (X) => (X - tx) / Z + fx };
}
const lerpRect = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));
// More particles away from the beam, at the shadows scene's density, so the slab looks full on the way in.
let fillerCache = { key: '', list: [] };
function zoomFiller(c, top, bot) {
  const rw = SA.r / c.Z1, band = c.w / 2 + rw, key = [SA.n, SA.r, SA.seed, c.xs.toFixed(3), c.dz.toFixed(3), top, bot, c.w].join('|');
  if (fillerCache.key === key) return fillerCache.list;
  const { a, b, y0, y1 } = slabBox(SA), nw = (Math.round(SA.n) / ((b - a) * (y1 - y0))) * c.Z1 * c.Z1, rnd = rng32(SA.seed * 31 + 3), list = [];
  const area = c.dz * Math.max(0, bot - top - 2 * band), cnt = Math.min(2500, Math.round(nw * area));
  for (let i = 0; i < cnt; i++) {
    let y = lerp(top, bot - 2 * band, rnd()); if (y > c.fy - band) y += 2 * band;
    list.push([lerp(c.xs + rw, c.xe - rw, rnd()), y]);
  }
  fillerCache = { key, list };
  return list;
}
function drawZoom(ctx, dt, st) {
  const c = zoomCam(st), { g, s, Z, SX, SY } = c, cloud = SH.container === 'cloud', hl = smooth(clamp(st.hl, 0, 1)), color = SH.color;
  const mL = cloud ? g.cx - 0.56 * g.cw : g.x0, mR = cloud ? g.cx + 0.56 * g.cw : g.x1;
  const top = cloud ? g.y - 0.45 * g.cw : g.bot - FILL * g.th, bot = cloud ? g.y + 0.45 * g.cw : g.bot;
  const lf = lerp(mL - 2, c.xs, hl), rf = lerp(mR + 2, c.xe, hl);   // the two fronts
  const fadeRest = 1 - smooth(clamp(s * 1.6, 0, 1)), slabA = 1 - smooth(clamp((s - 0.45) / 0.45, 0, 1));
  const puffs = cloud ? cloudPuffs(g, { cloud: 1 }) : null;
  let T;
  if (cloud) { buildCloudTau({ sigma: st.sigma, cloud: 1 }, g, puffs); T = cloudT; }
  else T = (x) => Math.exp((-st.sigma * Math.max(0, Math.min(g.x1, x) - Math.max(g.x0, g.apX))) / g.pxcm);
  // the medium under the camera: dimmer where the fronts have passed, the slab whole until it gives way to black.
  // Neighbouring bands of equal opacity merge, and every edge snaps to a device pixel, so no seam shows where two meet.
  const medium = () => (cloud ? drawCloud(ctx, puffs, { cloud: 1 }) : drawLiquid(ctx, g, { ...mediumOf(FILL), plain: true }));
  const m = ctx.getTransform(), snap = (X) => (Math.round(m.a * clamp(X, -20, W + 20) + m.e) - m.e) / m.a, bands = [];
  for (const [x0, x1, a] of [[-1e5, lf, 0.4 * fadeRest], [lf, c.xs, fadeRest], [c.xs, c.xe, slabA], [c.xe, rf, fadeRest], [rf, 1e5, 0.4 * fadeRest]]) {
    const X0 = snap(SX(x0)), X1 = snap(SX(x1)), p = bands[bands.length - 1];
    if (X1 <= X0) continue;
    if (p && p[1] === X0 && Math.abs(p[2] - a) < 1e-3) p[1] = X1; else bands.push([X0, X1, a]);
  }
  for (const [X0, X1, a] of bands) {
    if (a <= 0.003) continue;
    ctx.save(); ctx.beginPath(); ctx.rect(X0, -20, X1 - X0, H + 40); ctx.clip();
    ctx.translate(c.tx, c.ty); ctx.scale(Z, Z); ctx.translate(-c.fx, -c.fy); ctx.globalAlpha = a; medium(); ctx.restore();
  }
  // the glass in screen space, so its walls keep their width as the camera closes in
  if (fadeRest > 0.003 && !cloud) { ctx.save(); ctx.globalAlpha = fadeRest; drawGlass(ctx, { x0: SX(g.x0), x1: SX(g.x1), top: SY(g.top), bot: SY(g.bot), th: (g.bot - g.top) * Z }); ctx.restore(); }
  // the fronts, which end up as the slab's faces, and then as the shadows scene's dashed faces
  const fa = (st.hl > 0.003 ? 0.8 : 0) * (1 - smooth(clamp(s * 2, 0, 1)));
  if (fa > 0.003) {
    ctx.save(); ctx.strokeStyle = hexA(COL.white, fa); ctx.lineWidth = 2.5; ctx.beginPath();
    for (const x of [lf, rf]) { ctx.moveTo(SX(x), Math.max(-10, SY(top))); ctx.lineTo(SX(x), Math.min(H + 10, SY(bot))); }
    ctx.stroke(); ctx.restore();
  }
  if (s > 0.003) for (const x of [c.xs, c.xe]) dashed(ctx, SX(x), lerp(SY(top), SL.top - 70, s), SX(x), lerp(SY(bot), SL.bot + 70, s), COL.greyC, s, 2);
  // the laser slides in and stretches into the sheet laser; the sensor does the same into the plate
  const body = lerpRect([g.apX - 232, g.y - 42, 212, 84], [SL.ex - 214, SL.top - 30, 192, SL.bot - SL.top + 60], s);
  const noz = lerpRect([g.apX - 22, g.y - 19, 22, 38], [SL.ex - 22, SL.top - 10, 22, SL.bot - SL.top + 20], s);
  const head = lerpRect([g.xs - 15, g.y - 48, 30, 96], [sensorX6(SA), SL.top - 30, 26, SL.bot - SL.top + 60], s);
  const apX = noz[0] + noz[2], px = head[0];
  // the beam: the continuous one at first, then the shadows scene's rays, stopped by the slab's discs
  const sr = st.parts * smooth(clamp((s - 0.15) / 0.45, 0, 1)), da = st.parts * smooth(clamp((s - 0.25) / 0.4, 0, 1));
  if (1 - sr > 0.003) drawBeam(ctx, apX, px, SY(g.y), color, SH.I0 * (1 - sr), (X) => T(c.WX(X)), [SX(g.x0), SX(g.x1)], c.w * Z);
  const rs = (SA.r * Z) / c.Z1, rw = SA.r / c.Z1;
  const posS = discPos(SA).map(([x, y]) => [SX((x - c.cx1) / c.Z1 + c.fx), SY((y - c.cy1) / c.Z1 + c.fy)]);
  const k = SA.rays === 'sheet' ? Math.round(SL.bot - SL.top) : +SA.rays, sheet = SA.rays === 'sheet', ys = [];
  for (let i = 0; i < k; i++) ys.push(SY(g.y - c.w / 2 + ((i + 0.5) * c.w) / k));
  const hits = sr > 0.003 ? firstHits(ys, posS, rs) : null, lw = clamp(Math.abs(ys[1] - ys[0] || 1) * 0.55, 0.3, sheet ? 1.2 : 1.8);
  const fl = st.parts * smooth(clamp((s - 0.2) / 0.3, 0, 1)) * (1 - smooth(clamp((s - 0.6) / 0.3, 0, 1)));
  // as in the shadows scene: everything right of the sensor is drawn too, faded
  const layer = () => {
    if (hits) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const rays = () => { ctx.beginPath(); for (let i = 0; i < k; i++) { const xe = Math.min(hits[i], W + 10); if (xe > apX) { ctx.moveTo(apX, ys[i]); ctx.lineTo(xe, ys[i]); } } ctx.stroke(); };
      const a = sr * SH.I0;
      if (sheet) { ctx.strokeStyle = hexA(color, 0.75 * a); ctx.lineWidth = lw; rays(); }
      else { if (SH.beamLook === 'glow') { ctx.strokeStyle = hexA(color, 0.14 * a); ctx.lineWidth = lw * 3.3; rays(); } ctx.strokeStyle = hexA(color, 0.95 * a); ctx.lineWidth = lw; rays(); }
      if (SA.marks > 0.003 && !sheet) for (let i = 0; i < k; i++) if (hits[i] < W) dot(ctx, hits[i], ys[i], Math.max(0.6, 3.2 * (Z / c.Z1)), '#FFFFFF', 0.85 * SA.marks * da);
      ctx.restore();
    }
    if (da <= 0.003 && fl <= 0.003) return;
    ctx.save(); ctx.fillStyle = PART; ctx.strokeStyle = COL.greyB; ctx.lineWidth = Math.min(2.5, rs * 0.3);
    if (fl > 0.003) {
      ctx.globalAlpha *= fl; ctx.beginPath();
      for (const [x, y] of zoomFiller(c, top, bot)) { const X = SX(x), Y = SY(y); if (X < -rs || X > W + rs || Y < -rs || Y > H + rs) continue; ctx.moveTo(X + Math.max(0.5, rw * Z), Y); ctx.arc(X, Y, Math.max(0.5, rw * Z), 0, Math.PI * 2); }
      ctx.fill(); ctx.stroke(); ctx.globalAlpha /= fl;
    }
    if (da > 0.003) { ctx.globalAlpha *= da; ctx.beginPath(); for (const [X, Y] of posS) { ctx.moveTo(X + Math.max(0.5, rs), Y); ctx.arc(X, Y, Math.max(0.5, rs), 0, Math.PI * 2); } ctx.fill(); ctx.stroke(); }
    ctx.restore();
  };
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, px, H); ctx.clip(); layer(); ctx.restore();
  ctx.save(); ctx.beginPath(); ctx.rect(px, 0, W - px, H); ctx.clip(); ctx.globalAlpha = lerp(1, 0.22, s); layer(); ctx.restore();
  // laser and sensor, on top
  ctx.save(); ctx.lineWidth = 3; ctx.strokeStyle = COL.greyB; ctx.fillStyle = BODY;
  ctx.beginPath(); ctx.roundRect(body[0], body[1], body[2], body[3], 12); ctx.fill(); ctx.stroke();
  ctx.fillStyle = NOZZLE; ctx.beginPath(); ctx.roundRect(noz[0], noz[1], noz[2], noz[3], 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = hexA(color, 1); ctx.beginPath(); ctx.arc(lerp(g.apX - 68, SL.ex - 64, s), lerp(g.y - 20, SL.top - 2, s), 6, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1 - s; ctx.beginPath();   // the sensor's stand goes; the plate stays
  const hx = head[0] + head[2] / 2, hb = head[1] + head[3];
  ctx.moveTo(hx, hb); ctx.lineTo(hx, hb + 202); ctx.moveTo(hx - 56, hb + 202); ctx.lineTo(hx + 56, hb + 202); ctx.stroke();
  ctx.globalAlpha = 1; ctx.fillStyle = BODY; ctx.beginPath(); ctx.roundRect(head[0], head[1], head[2], head[3], 6); ctx.fill(); ctx.stroke();
  if (hits) { ctx.fillStyle = hexA(color, 0.95 * sr * SH.I0); for (let i = 0; i < k; i++) if (hits[i] > px) ctx.fillRect(px - 3, ys[i] - (sheet ? 0.6 : 1.4) * Math.min(1, Z / c.Z1 * 3), 5, (sheet ? 1.2 : 2.8) * Math.min(1, Z / c.Z1 * 3)); }
  ctx.restore();
  if (fadeRest > 0.003) drawReadout(ctx, hx, head[1] + 48, T(g.xs - 18), fadeRest);
  // landing: the shadows scene's readout and plot fade in where they will be; then that scene takes over
  const land = st.parts * smooth(clamp((s - 0.7) / 0.3, 0, 1));
  if (land > 0.003) {
    const S6 = shadowsState(SA);
    let reach = 0; for (const h of S6.hits) if (h > S6.sx) reach++;
    drawShadowsReadout(ctx, S6.sx, reach / S6.k, land);
    drawShadowsPlot(ctx, SA, S6, land);
  }
}

// ---------- C. optical depth is an area ----------
// The exponent of Beer–Lambert is the area under the density along the path: τ(z) = ∫₀^z σₐ(s) ds. Create the
// medium and its density fills in above it; shine the laser and what gets through, T(z) = e^{−τ(z)}, is traced
// below it as the light goes. A dashed marker (drag it) splits the area into the part the light has crossed and
// the part still ahead. Paint a density on its plot. Mirror the profile: the curve changes, but the light that
// gets out does not, because the area is the same. (PBRT's transmittance chapter; the Production Volume
// Rendering course notes.)
const AZ = { n: 200, d: 20, x0: 480, x1: 1440, smax: 0.25, y: 540, top: 420, bot: 660, apX: 400, xs: 1610 };
const azX = (z) => AZ.x0 + (z / AZ.d) * (AZ.x1 - AZ.x0);
const azZ = (x) => ((x - AZ.x0) / (AZ.x1 - AZ.x0)) * AZ.d;
const azShapes = {
  uniform: () => 0.1,
  ramp: (z) => (0.2 * z) / AZ.d,
  bump: (z) => 0.02 + 0.2 * Math.exp(-(((z - 10) / 3) ** 2)),
  slabs: (z) => ((z > 3 && z < 7) || (z > 12 && z < 16) ? 0.16 : 0.01),
  uneven: (z) => clamp(0.11 + 0.06 * Math.sin(z * 0.9 + 1) + 0.04 * Math.sin(z * 2.3 + 2) + 0.03 * Math.sin(z * 5.1), 0.01, 0.24),
};
const azSample = (f) => { const a = new Float64Array(AZ.n + 1); for (let i = 0; i <= AZ.n; i++) a[i] = f((i / AZ.n) * AZ.d); return a; };
function azMorph(st, target, dur = 1.2) { st.from = st.prof.slice(); st.to = target; st.mu = 0; return tween(st, 'mu', 1, dur); }
const SC = defScene({
  id: 'area', tab: 'Optical depth is an area', shared: true,
  defaults: () => ({ prof: azSample(azShapes.bump), from: null, to: null, mu: 1, zs: AZ.d, sweepT: 4.5, shown: null, sensorA: 1,
    build: 1, front: 1, marker: 0, buildT: 3, shineT: 2.6, eA: 1 }),
  actions: [
    { id: 'create', label: 'Create the medium', run: (st) => { untween(st, 'front'); st.front = 0; st.shown = null; st.build = 0; return tween(st, 'build', 1, st.buildT, { ease: linear }); } },
    { id: 'shine', label: 'Shine', primary: true, run: (st) => { st.front = 0; st.shown = null; return tween(st, 'front', 1, st.shineT, { ease: linear }); } },
    { id: 'sweep', label: 'Sweep the marker', run: async (st, alive) => { tween(st, 'marker', 1, 0.4); untween(st, 'zs'); st.zs = 0; await sleep(0.3, 'area'); if (alive()) await tween(st, 'zs', AZ.d, st.sweepT, { ease: linear }); } },
    ...[['uniform', 'Uniform'], ['ramp', 'Ramp'], ['bump', 'Bump'], ['slabs', 'Two slabs'], ['uneven', 'Uneven']].map(([id, label]) => ({ id, label, run: (st) => azMorph(st, azSample(azShapes[id])) })),
    { id: 'mirror', label: 'Mirror', run: (st) => azMorph(st, st.prof.slice().reverse()) },
    RESET,
  ],
  params: [
    { type: 'range', key: 'buildT', label: 'Create time (s)', min: 0.5, max: 10, step: 0.1, fmt: (v) => v.toFixed(1) },
    { type: 'range', key: 'shineT', label: 'Shine time (s)', min: 0.5, max: 10, step: 0.1, fmt: (v) => v.toFixed(1) },
    { type: 'range', key: 'sweepT', label: 'Sweep time (s)', min: 0.5, max: 12, step: 0.1, fmt: (v) => v.toFixed(1) },
    { type: 'check', key: 'marker', label: 'Marker (drag it)', set: (v) => tween(SC, 'marker', v ? 1 : 0, 0.4) },
    { type: 'check', key: 'sensorA', label: 'Sensor readout', set: (v) => tween(SC, 'sensorA', v ? 1 : 0, 0.4) },
    { type: 'note', html: 'Drag on the density plot to paint σ<sub>a</sub>(z); with the marker on, drag the dashed line. Mirror keeps the area, so the light that gets out stays the same while the curve changes.' },
  ],
  draw: drawArea, pointer: pointerArea,
});
const azAxes = () => [
  makeAxes({ L: AZ.x0, R: AZ.x1, T: 110, B: 320, xr: [0, AZ.d, 5], yr: [0, AZ.smax, 0.1], ext: 40, xl: 'z', yl: String.raw`\sigma_a(z)`, labSize: 50, numSize: 28 }),
  makeAxes({ L: AZ.x0, R: AZ.x1, T: 775, B: 985, xr: [0, AZ.d, 5], yr: [0, 1, 0.5], ext: 40, xl: 'z', yl: 'T(z)', labSize: 50, numSize: 28 }),
];
const azTank = () => ({ x0: AZ.x0, x1: AZ.x1, top: AZ.top, bot: AZ.bot, th: AZ.bot - AZ.top });
// The medium, darker where it is denser: liquid in the glass tank, or a band of fog with soft edges.
function drawAreaMedium(ctx, P) {
  const n = AZ.n, k = (i) => clamp(P[i] / AZ.smax, 0, 1);
  if (SH.container === 'cloud') {
    const stops = []; for (let i = 0; i <= n; i += 2) stops.push([i / n, `rgba(215,215,215,${(0.5 * k(i)).toFixed(4)})`]);
    softBand(ctx, AZ.x0, AZ.x1, AZ.y, 150, stops);
    return;
  }
  const g = azTank(), L = lookOf(SH), lv = g.bot - 0.86 * g.th, lc = hexRgb(L.c), sc = hexRgb(L.surf);
  ctx.save(); ctx.beginPath(); ctx.roundRect(g.x0, g.top - 10, g.x1 - g.x0, g.th + 10, [0, 0, 16, 16]); ctx.clip();
  const body = ctx.createLinearGradient(g.x0, 0, g.x1, 0), surf = ctx.createLinearGradient(g.x0, 0, g.x1, 0);
  for (let i = 0; i <= n; i += 2) { body.addColorStop(i / n, rgba(lc, lerp(0.06, 0.9, k(i)))); surf.addColorStop(i / n, rgba(sc, lerp(0.3, 0.9, k(i)))); }
  ctx.fillStyle = body; ctx.fillRect(g.x0, lv, g.x1 - g.x0, g.bot - lv);
  ctx.strokeStyle = surf; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(g.x0, lv); ctx.lineTo(g.x1, lv); ctx.stroke();
  ctx.restore();
}
// The area under f on axes A between a and b.
function areaFill(ctx, A, f, a, b, fill) {
  if (b - a < 1e-6) return;
  ctx.save(); ctx.beginPath(); ctx.moveTo(A.X(a), A.Y(0));
  for (let i = 0, n = Math.max(2, Math.ceil((b - a) * 20)); i <= n; i++) { const z = lerp(a, b, i / n); ctx.lineTo(A.X(z), A.Y(f(z))); }
  ctx.lineTo(A.X(b), A.Y(0)); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); ctx.restore();
}
function drawArea(ctx, dt, st) {
  if (st.from) { for (let i = 0; i <= AZ.n; i++) st.prof[i] = lerp(st.from[i], st.to[i], st.mu); if (st.mu >= 1) st.from = null; }
  const P = st.prof, n = AZ.n, dz = AZ.d / n, tau = new Float64Array(n + 1);
  for (let i = 1; i <= n; i++) tau[i] = tau[i - 1] + ((P[i - 1] + P[i]) / 2) * dz;
  const at = (arr, z) => { const f = clamp(z / AZ.d, 0, 1) * n, i = Math.min(n - 1, Math.floor(f)); return lerp(arr[i], arr[i + 1], f - i); };
  // Only the part of the medium created so far absorbs, and the light has only got as far as its front.
  const zb = clamp(st.build, 0, 1) * AZ.d, sig = (z) => at(P, z), tauAt = (z) => at(tau, Math.min(clamp(z, 0, AZ.d), zb)), T = (z) => Math.exp(-tauAt(z));
  const lit = st.front > 0.0005, xF = lerp(AZ.apX, AZ.xs - 18, st.front), zF = clamp(azZ(xF), 0, AZ.d), zT = lit ? zF : 0;
  // the z the density and the readouts use: the marker when it is on, else all of the medium created so far.
  // Shining does not move it; the light only traces what gets through, on the plot below.
  const mk = st.marker > 0.5, zm = clamp(st.zs, 0, AZ.d), zc = mk ? zm : zb;
  const creating = st.build > 0 && st.build < 1, shining = st.front > 0 && st.front < 1;
  // τ as shown, to two places: every percentage on screen is worked out from it, so they all agree on a calculator
  const tauShown = (z) => Math.round(tauAt(z) * 100) / 100;
  // the laser, the medium and the sensor, as in the other scenes; the tank is created from left to right
  const cloud = SH.container === 'cloud', xb = azX(zb);
  if (zb > 0) { ctx.save(); ctx.beginPath(); ctx.rect(0, 0, xb, H); ctx.clip(); drawAreaMedium(ctx, P); ctx.restore(); }
  if (lit) drawBeam(ctx, AZ.apX, xF, AZ.y, SH.color, SH.I0, (x) => T(clamp(azZ(x), 0, AZ.d)), cloud ? [] : [AZ.x0, AZ.x1]);
  if (!cloud && st.build > 0) { ctx.save(); ctx.beginPath(); ctx.rect(0, 0, lerp(AZ.x0 - 8, AZ.x1 + 8, clamp(st.build, 0, 1)), H); ctx.clip(); drawGlass(ctx, azTank()); ctx.restore(); }
  drawLaser(ctx, AZ.apX, AZ.y, SH.color, lit ? 1 : 0);
  const reading = st.front >= 0.999 && SH.I0 > 0 ? Math.exp(-tauShown(AZ.d)) : null;   // the sensor counts toward its value
  st.shown = reading == null ? null : st.shown == null || reduced ? reading : lerp(st.shown, reading, 1 - Math.exp(-dt * 6));
  drawSensor(ctx, AZ.xs, AZ.y, SH.color, reading == null ? 0 : reading * SH.I0);
  if (st.shown != null) drawReadout(ctx, AZ.xs, AZ.y, st.shown, st.sensorA);
  // the density, filled in as the medium is created: highlighted up to the current z, greyed past it
  const [A1, A2] = azAxes(), zh = Math.min(zc, zb);
  drawAxes(ctx, A1, { c: 1, nums: 1, lab: 1 });
  areaFill(ctx, A1, sig, 0, zh, hexA(COL.green, 0.32)); areaFill(ctx, A1, sig, zh, zb, hexA(COL.grey, 0.12));
  if (zh > 1e-6) drawCurve(ctx, A1, sig, { from: 0, to: zh, color: COL.green, width: 5 });
  if (zb - zh > 1e-6) drawCurve(ctx, A1, sig, { from: zh, to: zb, color: COL.grey, width: 5, alpha: 0.75 });
  // what gets through, traced as the light goes: blue, or with the marker on, blue up to it and greyed past it
  drawAxes(ctx, A2, { c: 1, nums: 1, lab: 1 });
  const zl = mk ? Math.min(zm, zT) : zT;
  if (zl > 1e-6) drawCurve(ctx, A2, T, { from: 0, to: zl, color: COL.blue });
  if (zT - zl > 1e-6) drawCurve(ctx, A2, T, { from: zl, to: zT, color: COL.grey, alpha: 0.75 });
  // the marker: one z through the density, the medium and the light
  if (st.marker > 0.003) dashed(ctx, azX(st.zs), A1.Y(AZ.smax) - 14, azX(st.zs), A2.oy, COL.white, 0.5 * st.marker, 2);
  const reached = lit && xF >= azX(zc) - 0.5;
  st.eA = reduced ? +reached : lerp(st.eA, +reached, 1 - Math.exp(-dt * 10));
  // dots at the marker; without it, at the head of whatever is being drawn
  if (mk) {
    if (zm <= zb + 1e-6) dot(ctx, A1.X(zm), A1.Y(sig(zm)), 9, COL.green);
    if (reached) dot(ctx, A2.X(zm), A2.Y(T(zm)), 9, COL.blue);
  } else {
    if (creating) dot(ctx, A1.X(zb), A1.Y(sig(zb)), 9, COL.green);
    if (shining && xF >= AZ.x0) dot(ctx, A2.X(zT), A2.Y(T(zT)), 9, COL.blue);
  }
  const tz = tauShown(zc);
  const e1 = drawTex(ctx, String.raw`\tau =`, 1505, (A1.T + A1.B) / 2, 60, { ax: 0, color: COL.green }).pop();
  if (e1) drawNumber(ctx, tz, e1.x + e1.w + 0.3 * e1.fpx, e1.base, { size: e1.fpx, dec: 2, color: COL.green });
  if (st.eA > 0.01) {
    const e2 = drawTex(ctx, String.raw`e^{-\tau} =`, 1505, 880, 60, { ax: 0, color: COL.blue, alpha: st.eA }).pop();
    if (e2) drawNumber(ctx, Math.exp(-tz) * 100, e2.x + e2.w + 0.3 * e2.fpx, e2.base, { size: e2.fpx, dec: 1, suffix: '%', color: COL.blue, alpha: st.eA });
  }
}
// Dragging: the marker, anywhere in its column when it is on (on the density plot, only near the line);
// elsewhere on the density plot, a soft brush pulls σ toward the pointer.
function pointerArea(type, x, y) {
  const st = SC, sc = scenes.area, [A1, A2] = azAxes();
  const inPlot = x > AZ.x0 - 12 && x < AZ.x1 + 12 && y > A1.T - 24 && y < A1.B + 20;
  const inColumn = x > AZ.x0 - 24 && x < AZ.x1 + 24 && y > A1.T - 30 && y < A2.B + 30;
  const onMarker = st.marker > 0.5 && inColumn && (!inPlot || Math.abs(x - azX(st.zs)) < 22);
  const setZ = () => { st.zs = clamp(azZ(x), 0, AZ.d); };
  const paint = () => {
    const z = clamp(azZ(x), 0, AZ.d), s = clamp(((A1.B - y) / (A1.B - A1.T)) * AZ.smax, 0, AZ.smax), dz = AZ.d / AZ.n;
    for (let i = 0; i <= AZ.n; i++) { const w = Math.exp(-(((i * dz - z) / 0.7) ** 2)); if (w > 0.001) st.prof[i] = lerp(st.prof[i], s, w); }
  };
  if (type === 'down') {
    sc.drag = onMarker ? 'marker' : inPlot ? 'paint' : null;
    if (!sc.drag) return false;
    sc.epoch++;
    if (sc.drag === 'marker') { untween(st, 'zs'); setZ(); }
    else { untween(st, 'mu'); st.from = null; if (st.build < 1) { untween(st, 'build'); st.build = 1; } paint(); }
    return true;
  }
  if (type === 'up') { sc.drag = null; return false; }
  if (sc.drag === 'marker') { setZ(); return true; }
  if (sc.drag === 'paint') { paint(); return true; }
  return onMarker || inPlot;
}

// ---------- D. what light can do at a particle ----------
// The storyboard's first row: one photon meets one particle. Absorption: the photon stops at the particle's
// surface and is gone, and the particle warms a little. Out-scattering: it bounces off and leaves the beam's
// direction. Emission: a warm particle sends one out along the beam. In-scattering: one coming from another
// direction bounces off into the beam's. These are the four terms of the transfer equation, coloured as its
// braces are: blue takes light out of the beam, green puts light in. Then the other three fade, and absorption,
// the one this video is about, fills the stage. Photons are particles by default (wave packets are an option),
// and a bounce is a mirror bounce off the particle's surface.
const IA = {
  cells: [[225, 110, 700, 330], [995, 110, 700, 330], [225, 560, 700, 330], [995, 560, 700, 330]],
  full: [120, 70, 1680, 792],
  names: ['absorption', 'out-scattering', 'emission', 'in-scattering'],
  cols: [COL.blue, COL.blue, COL.green, COL.green],
  R: 34, pr: 9, L: 120, trail: 70,
};
// Each photon's path in a cell's own units (700 × 330): straight lines that turn where the photon touches the
// particle, its centre one photon radius off the surface.
function iaPaths(look) {
  const Rc = IA.R + (look === 'wave' ? 3 : IA.pr), cx = 350, cy = 165, rad = Math.PI / 180;
  const absorb = [[-150, cy], [cx - Rc, cy]];
  const ti = 65 * rad, hit1 = [cx - Rc * Math.cos(ti), cy - Rc * Math.sin(ti)], out = [Math.cos(-50 * rad), Math.sin(-50 * rad)];
  const outScatter = [[-150, hit1[1]], hit1, [hit1[0] + 420 * out[0], hit1[1] + 420 * out[1]]];   // in at 65° to the surface, out at 50° to the beam
  const emit = [[cx + Rc, cy], [950, cy]];
  const din = [Math.cos(-40 * rad), Math.sin(-40 * rad)], nx = 1 - din[0], ny = -din[1], nl = Math.hypot(nx, ny);
  const hit3 = [cx + (Rc * nx) / nl, cy + (Rc * ny) / nl];   // the surface normal halves the turn from 40° up to along the beam
  const inScatter = [[hit3[0] - 420 * din[0], hit3[1] - 420 * din[1]], hit3, [950, hit3[1]]];
  return [absorb, outScatter, emit, inScatter];
}
function pathSampler(path) {
  const cum = [0];
  for (let i = 1; i < path.length; i++) cum.push(cum[i - 1] + Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]));
  const total = cum[cum.length - 1];
  const at = (s) => {
    s = clamp(s, 0, total); let j = 1; while (j < path.length - 1 && cum[j] < s) j++;
    const p = path[j - 1], q = path[j], seg = cum[j] - cum[j - 1] || 1, t = (s - cum[j - 1]) / seg;
    return [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, (q[0] - p[0]) / seg, (q[1] - p[1]) / seg];
  };
  return { total, cum, at };
}
// A photon as a particle: a small bright ball with a short trail that fades behind it along its path.
function drawPhotonDot(ctx, S, sHead, color, alpha, { r = 9, trail = 70, scale = 1 } = {}) {
  if (alpha <= 0.003 || scale <= 0.003 || sHead < 0) return;
  const c = hexRgb(color), left = [], right = [];
  for (let k = 0, n = 20; k <= n; k++) {   // the tail: one tapered shape, fading from nothing to the ball
    const t = k / n, [x, y, tx, ty] = S.at(sHead - trail * (1 - t)), w = r * 0.8 * t * scale;
    left.push([x - ty * w, y + tx * w]); right.push([x + ty * w, y - tx * w]);
  }
  const [tx0, ty0] = S.at(sHead - trail), [hx, hy] = S.at(sHead), tg = ctx.createLinearGradient(tx0, ty0, hx, hy);
  tg.addColorStop(0, rgba(c, 0)); tg.addColorStop(1, rgba(c, 0.55 * alpha));
  ctx.fillStyle = tg; ctx.beginPath(); ctx.moveTo(left[0][0], left[0][1]);
  for (const q of left) ctx.lineTo(q[0], q[1]);
  for (let k = right.length - 1; k >= 0; k--) ctx.lineTo(right[k][0], right[k][1]);
  ctx.closePath(); ctx.fill();
  const [x, y] = S.at(sHead), g = ctx.createRadialGradient(x, y, 0, x, y, r * 2.8 * scale);
  g.addColorStop(0, rgba(c, 0.4 * alpha)); g.addColorStop(1, rgba(c, 0));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 2.8 * scale, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = rgba(c, alpha); ctx.beginPath(); ctx.arc(x, y, r * scale, 0, Math.PI * 2); ctx.fill();
}
// A photon as a short wave packet riding along its path, head at arc length sHead, with an arrowhead. The wave
// is fixed to the packet, so it travels with it without shimmering; past the path's end it is cut off there.
function drawPacket(ctx, S, sHead, color, alpha, { L = 120, lam = 24, amp = 11, w = 4 } = {}) {
  if (alpha <= 0.003) return;
  const s0 = Math.max(0, sHead - L), s1 = Math.min(S.total, sHead); if (s1 <= s0) return;
  ctx.save(); ctx.strokeStyle = hexA(color, alpha); ctx.fillStyle = hexA(color, alpha); ctx.lineWidth = w; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.beginPath();
  for (let k = 0, n = 64; k <= n; k++) {
    const s = lerp(s0, s1, k / n), q = clamp((sHead - s) / L, 0, 1), env = Math.pow(Math.sin(Math.PI * q), 0.7);
    const [x, y, tx, ty] = S.at(s), off = amp * env * Math.sin((2 * Math.PI * (sHead - s)) / lam);
    if (k) ctx.lineTo(x - ty * off, y + tx * off); else ctx.moveTo(x - ty * off, y + tx * off);
  }
  ctx.stroke();
  if (sHead <= S.total) { const [x, y, tx, ty] = S.at(s1); arrowTip(ctx, x + tx * 14, y + ty * 14, tx, ty, 18, 9); }
  ctx.restore();
}
// A particle, warmer (gold) for a while after it takes in a photon, or before it sends one out.
function drawParticle(ctx, x, y, r, warm, alpha) {
  if (alpha <= 0.003) return;
  if (warm > 0.003) {
    const rg = ctx.createRadialGradient(x, y, r * 0.8, x, y, r * 2.5);
    rg.addColorStop(0, hexA(COL.gold, 0.42 * warm * alpha)); rg.addColorStop(1, hexA(COL.gold, 0));
    ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(x, y, r * 2.5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = rgba(mixRgb(hexRgb(PART), hexRgb(COL.gold), 0.55 * clamp(warm, 0, 1)), alpha); ctx.strokeStyle = hexA(COL.greyB, alpha); ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
}
const SI = defScene({
  id: 'interact', tab: 'What light can do', shared: true,
  defaults: () => ({ show: [1, 1, 1, 1], lab: [1, 1, 1, 1], focus: 0, loopT: 3.2, t0: [0, 0.8, 1.6, 2.4], axis: 0, look: 'dot' }),
  actions: [
    { id: 'play', label: 'Play', primary: true, run: async (st, alive) => {
      for (let i = 0; i < 4; i++) { untween(st.show, i); untween(st.lab, i); st.show[i] = 0; st.lab[i] = 0; }
      untween(st, 'focus'); st.focus = 0;
      for (let i = 0; i < 4; i++) {
        st.t0[i] = TIME + 0.35;
        tween(st.show, i, 1, 0.9, { tag: 'interact' }); tween(st.lab, i, 1, 0.9, { ease: linear, delay: 0.5, tag: 'interact' });
        await sleep(i === 0 ? 3.2 : 2.4, 'interact'); if (!alive()) return;
      }
      await sleep(0.6, 'interact'); if (!alive()) return;
      await tween(st, 'focus', 1, 1.8);
    } },
    { id: 'four', label: 'All four', run: (st) => Promise.all([tween(st, 'focus', 0, 1.4), ...[0, 1, 2, 3].flatMap((i) => [tween(st.show, i, 1, 0.8, { tag: 'interact' }), tween(st.lab, i, 1, 0.8, { tag: 'interact' })])]) },
    { id: 'focus', label: 'Only absorption', run: (st) => tween(st, 'focus', 1, 1.8) },
    RESET,
  ],
  params: [
    { type: 'select', key: 'look', label: 'Photons', options: [['dot', 'Particles'], ['wave', 'Wave packets']] },
    { type: 'range', key: 'loopT', label: 'Time per photon (s)', min: 1.5, max: 8, step: 0.1, fmt: (v) => v.toFixed(1) },
    { type: 'check', key: 'axis', label: "The beam's direction", set: (v) => tween(SI, 'axis', v ? 1 : 0, 0.4) },
  ],
  draw: drawInteract,
});
// One cell's picture, in the cell's own units; u is the time into this cell's loop (u < 0: a still, for reduced motion).
function drawIACell(ctx, i, u, P, alpha, axis, look) {
  const paths = iaPaths(look), S = pathSampler(paths[i]), v = 1080 / (0.85 * P);
  if (u < 0) u = [(S.total - 50) / v, (S.cum[1] + 130) / v, 0.5 + 160 / v, (S.cum[1] + 140) / v][i];
  // the beam's direction: the line the photon travels along the beam
  if (axis > 0.003) { const y = i === 3 ? paths[3][1][1] : paths[i][0][1]; dashed(ctx, 0, y, 700, y, COL.greyC, 0.8 * axis * alpha, 2); }
  let s = v * u, warm = 0, scale = 1;
  if (i === 0) {   // stops at the surface and is taken in; the particle warms
    const tc = S.total / v;
    scale = 1 - clamp((u - tc) / 0.18, 0, 1);
    warm = u < tc ? 0 : u < tc + 0.25 ? smooth((u - tc) / 0.25) : Math.exp(-(u - tc - 0.25) / 0.7);
  } else if (i === 2) {   // the particle warms, then a photon leaves its surface
    s = v * (u - 0.5); scale = clamp((u - 0.5) / 0.15, 0, 1);
    warm = u < 0.55 ? smooth(u / 0.55) : Math.exp(-(u - 0.55) / 0.6);
  }
  drawParticle(ctx, 350, 165, IA.R, warm, alpha);
  if (look === 'wave') drawPacket(ctx, S, s, SH.color, alpha, { L: IA.L });
  else drawPhotonDot(ctx, S, s, SH.color, alpha, { r: IA.pr, trail: IA.trail, scale });
}
function drawInteract(ctx, dt, st) {
  const f = smooth(clamp(st.focus, 0, 1)), P = st.loopT;
  for (const i of [1, 2, 3, 0]) {
    const show = st.show[i], a = i === 0 ? 1 : 1 - f;
    if (show <= 0.003 || a <= 0.003) continue;
    const r = i === 0 ? lerpRect(IA.cells[0], IA.full, f) : IA.cells[i], s = r[2] / 700;
    const op = clamp(show / 0.6, 0, 1), ca = clamp((show - 0.4) / 0.6, 0, 1) * a;
    if (ca > 0.003) {
      ctx.save(); ctx.beginPath(); ctx.roundRect(r[0], r[1], r[2], r[3], 14); ctx.clip();
      ctx.translate(r[0], r[1]); ctx.scale(s, s);
      drawIACell(ctx, i, reduced ? -1 : (((TIME - st.t0[i]) % P) + P) % P, P, ca, st.axis, st.look);
      ctx.restore();
    }
    // the frame, drawn in as manim's Create draws a rectangle
    const per = 2 * (r[2] + r[3]);
    ctx.save(); ctx.strokeStyle = hexA(COL.greyB, a); ctx.lineWidth = 3; if (op < 1) ctx.setLineDash([op * per, per]);
    ctx.beginPath(); ctx.roundRect(r[0], r[1], r[2], r[3], 14); ctx.stroke(); ctx.restore();
    const lp = st.lab[i];
    if (lp > 0.003) { const size = i === 0 ? lerp(52, 66, f) : 52; drawTex(ctx, String.raw`\text{${IA.names[i]}}`, r[0] + r[2] / 2, r[1] + r[3] + 0.95 * size, size, { p: lp, alpha: a, color: IA.cols[i] }); }
  }
}

// ---------- E. sparse and dense ----------
// The storyboard's second row: how much of the light gets through? Two slabs of the same kind of particles, one
// with a few and one with many, each with its own sheet of rays and its own sensor. More particles, more rays
// stopped, less light. As a count grows, particles pop in one at a time.
const SD = { ex: 330, x0: 560, x1: 1300, sx: 1440, rows: [[150, 390], [650, 890]], nMax: 400 };
function sdDiscs(st, row) {
  const [top, bot] = SD.rows[row], r = st.r, rnd = rng32(st.seed * 7919 + 101 * (row + 1)), out = [], n = row ? st.nB : st.nA, amp = reduced ? 0 : st.jig * 5;
  for (let k = 0; k < SD.nMax; k++) {
    let x = lerp(SD.x0 + r, SD.x1 - r, rnd()), y = lerp(top - r, bot + r, rnd());
    const g = clamp(n - k, 0, 1); if (g <= 0) continue;
    if (amp > 0.01) { const [px, py, fx, fy] = jigOf(k + 1000 * (row + 1)); x += amp * Math.sin(TIME * fx * 6.283 + px); y += amp * Math.sin(TIME * fy * 6.283 + py); }
    out.push([x, y, r * smooth(g)]);
  }
  return out;
}
// Where each ray meets its first disc, for discs of their own sizes.
function firstHitsR(ys, discs) {
  const hits = new Float64Array(ys.length);
  for (let i = 0; i < ys.length; i++) {
    let h = Infinity; const y = ys[i];
    for (const [x, py, R] of discs) { const dy = y - py; if (dy > -R && dy < R) { const xh = x - Math.sqrt(R * R - dy * dy); if (xh < h) h = xh; } }
    hits[i] = h;
  }
  return hits;
}
function readoutBox(ctx, x, yc, v, alpha) {
  if (alpha <= 0.01) return;
  const bw = 210, bh = 84, by = yc - bh / 2;
  ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = BG; ctx.strokeStyle = COL.greyB; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.roundRect(x, by, bw, bh, 12); ctx.fill(); ctx.stroke(); ctx.restore();
  drawNumber(ctx, v * 100, x + bw / 2, by + bh / 2 + 18, { size: 52, dec: 1, suffix: '%', align: 'center', alpha });
}
const SE = defScene({
  id: 'density', tab: 'Sparse and dense', shared: true,
  defaults: () => ({ nA: 4, nB: 35, r: 5, rays: '120', seed: 3, jig: 1, front: 1, shineT: 2.4, shown: [null, null] }),
  actions: [
    { id: 'shine', label: 'Shine', primary: true, run: (st) => { st.front = 0; st.shown = [null, null]; return tween(st, 'front', 1, st.shineT, { ease: linear }); } },
    { id: 'more', label: 'More particles', run: (st) => tween(st, 'nB', Math.min(SD.nMax, Math.round(st.nB) + 40), 2.6, { ease: linear }) },
    { id: 'fewer', label: 'Fewer particles', run: (st) => tween(st, 'nB', Math.max(0, Math.round(st.nB) - 40), 2.6, { ease: linear }) },
    { id: 'same', label: 'Same as the top', run: (st) => tween(st, 'nB', st.nA, 2.2, { ease: linear }) },
    { id: 'resample', label: 'Resample', run: (st) => { st.seed += 1; } },
    RESET,
  ],
  params: [
    { type: 'range', key: 'nA', label: 'Particles, top', min: 0, max: 400, step: 1, fmt: (v) => String(Math.round(v)), set: (v) => { untween(SE, 'nA'); SE.nA = v; } },
    { type: 'range', key: 'nB', label: 'Particles, bottom', min: 0, max: 400, step: 1, fmt: (v) => String(Math.round(v)), set: (v) => { untween(SE, 'nB'); SE.nB = v; } },
    { type: 'range', key: 'r', label: 'Particle radius', min: 2, max: 20, step: 0.5, fmt: (v) => v.toFixed(1) },
    { type: 'select', key: 'rays', label: 'Rays', options: [['30', '30 rays'], ['120', '120 rays'], ['sheet', 'A sheet (every row)']] },
    { type: 'range', key: 'shineT', label: 'Shine time (s)', min: 0.5, max: 8, step: 0.1, fmt: (v) => v.toFixed(1) },
    { type: 'check', key: 'jig', label: 'Jiggle', set: (v) => tween(SE, 'jig', v ? 1 : 0, 0.6) },
  ],
  draw: drawDensity,
});
function drawDensity(ctx, dt, st) {
  const color = SH.color, power = SH.I0, sheet = st.rays === 'sheet', glow = SH.beamLook === 'glow', xf = lerp(SD.ex, SD.sx, st.front);
  for (let row = 0; row < 2; row++) {
    const [top, bot] = SD.rows[row], k = sheet ? Math.round(bot - top) : +st.rays, ys = [];
    for (let i = 0; i < k; i++) ys.push(top + ((i + 0.5) * (bot - top)) / k);
    const discs = sdDiscs(st, row), hits = firstHitsR(ys, discs);
    dashed(ctx, SD.x0, top - 50, SD.x0, bot + 50, COL.greyC, 1, 2);
    dashed(ctx, SD.x1, top - 50, SD.x1, bot + 50, COL.greyC, 1, 2);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const rays = () => { ctx.beginPath(); for (let i = 0; i < k; i++) { const xe = Math.min(hits[i], xf, SD.sx); if (xe > SD.ex) { ctx.moveTo(SD.ex, ys[i]); ctx.lineTo(xe, ys[i]); } } ctx.stroke(); };
    if (sheet) { ctx.strokeStyle = hexA(color, 0.75 * power); ctx.lineWidth = 1.2; rays(); }
    else { if (glow) { ctx.strokeStyle = hexA(color, 0.14 * power); ctx.lineWidth = 6; rays(); } ctx.strokeStyle = hexA(color, 0.95 * power); ctx.lineWidth = 1.8; rays(); }
    if (!sheet) for (let i = 0; i < k; i++) if (hits[i] < xf && hits[i] < SD.sx) dot(ctx, hits[i], ys[i], 3, '#FFFFFF', 0.85);
    ctx.restore();
    ctx.fillStyle = PART; ctx.strokeStyle = COL.greyB; ctx.lineWidth = Math.min(2.5, st.r * 0.3);
    ctx.beginPath(); for (const [x, y, R] of discs) { if (R < 0.3) continue; ctx.moveTo(x + R, y); ctx.arc(x, y, R, 0, Math.PI * 2); } ctx.fill(); ctx.stroke();
    drawSheetLaser(ctx, SD.ex, top, bot, color);
    // the sensor plate, lit where rays arrive, and the fraction that arrived (counting toward it as it changes)
    let reached = null;
    if (xf >= SD.sx - 0.5) { let c = 0; for (const h of hits) if (h > SD.sx) c++; reached = c / k; }
    st.shown[row] = reached == null ? null : st.shown[row] == null || reduced ? reached : lerp(st.shown[row], reached, 1 - Math.exp(-dt * 6));
    ctx.save(); ctx.lineWidth = 3; ctx.strokeStyle = COL.greyB; ctx.fillStyle = BODY;
    ctx.beginPath(); ctx.roundRect(SD.sx, top - 30, 26, bot - top + 60, 6); ctx.fill(); ctx.stroke();
    if (reached != null) { ctx.fillStyle = hexA(color, 0.95 * power); for (let i = 0; i < k; i++) if (hits[i] > SD.sx) ctx.fillRect(SD.sx - 3, ys[i] - (sheet ? 0.6 : 1.4), 5, sheet ? 1.2 : 2.8); }
    ctx.restore();
    if (st.shown[row] != null) readoutBox(ctx, SD.sx + 50, (top + bot) / 2, st.shown[row], 1);
  }
}

// ---------- formulas inside any scene ----------
// A scene keeps its formulas in st.F (name → placed sprites, with write progress p and opacity a) and the
// morphs running between them in st.M. A morph that finishes after the scene was reset (st.F replaced) drops out.
function fPlaced(src, pl) { const T = tex(src), size = Math.min(pl.size ?? 64, (pl.fit ?? 1800) / Math.max(T.w, 0.01)); return place(T, { ...pl, size }); }
async function fWrite(st, name, src, pl, dur = 1) {
  const f = { sprites: fPlaced(src, pl), p: 0, a: 1 }; st.F[name] = f;
  await tween(f, 'p', 1, dur, { ease: linear, tag: st.__tag });
}
// from: a name, or several names whose pieces morph together into one formula. copy keeps the source.
async function fMorph(st, name, src, pl, { style = 'match', dur = 1.3, from = name, copy = false } = {}) {
  const F0 = st.F, names = [].concat(from), srcs = names.map((k) => F0[k]).filter(Boolean), B = { sprites: fPlaced(src, pl), p: 1, a: 1 };
  if (!copy) for (const k of names) delete F0[k];
  if (!srcs.length || instant || reduced) { F0[name] = B; return; }
  const A = srcs.flatMap((f) => f.sprites.map((s) => ({ ...s, alpha: s.alpha * f.a })));
  const m = { plan: style === 'shape' ? reshapePlan(A, B.sprites) : matchPlan(A, B.sprites), style, t: 0 };
  st.M.push(m);
  await tween(m, 't', 1, dur, { ease: linear, tag: st.__tag });
  if (st.F !== F0) return;
  const i = st.M.indexOf(m); if (i >= 0) st.M.splice(i, 1);
  F0[name] = B;
}
async function fFade(st, name, dur = 0.6) {
  const F0 = st.F, f = F0[name]; if (!f) return;
  await tween(f, 'a', 0, dur, { tag: st.__tag });
  if (st.F === F0 && F0[name] === f) delete F0[name];
}
function drawFormulas(ctx, st) {
  for (const f of Object.values(st.F)) if (f.a > 0.003) drawSprites(ctx, f.sprites, { p: f.p, alpha: f.a });
  for (const m of st.M) (m.style === 'shape' ? drawReshape : drawMorph)(ctx, m.plan, m.t);
}

// ---------- step scenes: Next and Back through a list of steps, as in the equation scene ----------
// Going to step k rebuilds the steps before it at once, then plays step k. Parameters survive the rebuild.
// Each rebuild starts from a fresh state object, so a step still finishing from before writes into the old one.
async function stepGo(sc, k, play) {
  stopTweens(sc.id);
  const keep = {};
  for (const p of sc.params) if (p.key) keep[p.key] = sc.st[p.key];
  const st = (sc.st = Object.assign(sc.defaults(), keep, { __tag: sc.id }));
  if (cur === sc) buildDock();
  k = clamp(k, play ? 0 : -1, sc.steps.length - 1);
  instant++;
  try { for (let i = 0; i < (play ? k : k + 1); i++) await sc.steps[i].run(st); } catch (err) { console.error(err); } finally { instant--; }
  st.step = k;
  if (play && k >= 0) await sc.steps[k].run(st);
}
const stepActions = () => [
  { id: 'restart', label: 'Restart', run: (st, alive, sc) => stepGo(sc, 0, true) },
  { id: 'back', label: '◀ Back', run: (st, alive, sc) => stepGo(sc, sc.st.step - 1, false) },
  { id: 'next', label: 'Next ▶', primary: true, run: (st, alive, sc) => stepGo(sc, sc.st.step + 1, true) },
  { id: 'replay', label: 'Replay step', run: (st, alive, sc) => stepGo(sc, sc.st.step, true) },
];
function stepScene(def) {
  const st = defScene({ ...def, actions: stepActions(), onReset: () => stepGo(scenes[def.id], 0, false),
    next: () => stepGo(scenes[def.id], scenes[def.id].st.step + 1, true), prev: () => stepGo(scenes[def.id], scenes[def.id].st.step - 1, false),
    init: () => stepGo(scenes[def.id], 0, false),
    extra: () => {
      const sc = scenes[def.id], s = mk('span', 'stepinfo');
      live.push(() => { const k = sc.st.step, txt = `${k + 1} / ${sc.steps.length}${k >= 0 ? ' · ' + sc.steps[k].label : ''}`; if (s.textContent !== txt) s.textContent = txt; });
      return s;
    } });
  return st;
}

// ---------- F. why e? ----------
// The storyboard's "why e?": every exponential bˣ has a slope proportional to its height, slope = (ln b)·height,
// so bˣ = e^{x ln b} is e in disguise. The slope triangle sits under the tangent with a run of 1, so its rise is
// the slope: for b = 2 the rise is shorter than the height, for b = 3 it is longer, and for b = e it is exactly the
// height, wherever the point is. That is d/dx eˣ = eˣ, the simplest differential equation there is. (3Blue1Brown,
// "What's so special about Euler's number e?", Essence of Calculus, chapter 5.)
const WE = { L: 170, R: 1170, T: 150, B: 930 };
const weAxes = () => makeAxes({ L: WE.L, R: WE.R, T: WE.T, B: WE.B, xr: [-2, 2, 1], yr: [0, 8, 2], xl: 'x', yl: 'y', skipX0: true });
const SF = defScene({
  id: 'whye', tab: 'Why e?',
  defaults: () => ({ b: 2, x: 0.8, c: 1, nums: 1, lab: 1, p: 1, ptA: 1, tri: 1, lnb: 0, deq: 0, dur: 1.6 }),
  actions: [
    { id: 'create', label: 'Create', run: async (st, alive) => {
      st.c = 0; st.lab = 0; st.p = 0; st.ptA = 0; st.deq = 0;
      tween(st, 'lab', 1, 1, { ease: linear, delay: 1.1 }); await tween(st, 'c', 1, 1.5); if (!alive()) return;
      await tween(st, 'p', 1, 1.8); if (!alive()) return;
      await tween(st, 'ptA', 1, 0.8);
    } },
    { id: 'move', label: 'Move the point', primary: true, run: async (st, alive) => {
      await tween(st, 'x', -0.9, 1.2); if (!alive()) return; await tween(st, 'x', 1.5, 3.4); if (!alive()) return; await tween(st, 'x', 0.8, 1.4);
    } },
    ...[[2, 'b = 2'], [3, 'b = 3']].map(([v, label]) => ({ id: 'b' + v, label, run: (st) => { tween(st, 'deq', 0, 0.4); return tween(st, 'b', v, st.dur); } })),
    { id: 'be', label: 'b = e', run: async (st, alive) => { st.deq = 0; await tween(st, 'b', Math.E, st.dur * 1.5); if (alive()) await tween(st, 'deq', 1, 1.4, { ease: linear }); } },
    RESET,
  ],
  params: [
    { type: 'range', key: 'b', label: 'Base b', min: 1.3, max: 3.2, step: 0.001, fmt: (v) => v.toFixed(3), set: (v) => { untween(SF, 'b'); SF.b = v; } },
    { type: 'range', key: 'x', label: 'Point at x', min: -0.9, max: 1.5, step: 0.01, fmt: (v) => v.toFixed(2), set: (v) => { untween(SF, 'x'); SF.x = v; } },
    { type: 'range', key: 'dur', label: 'Time per change (s)', min: 0.3, max: 4, step: 0.1, fmt: (v) => v.toFixed(1) },
    { type: 'check', key: 'tri', label: 'Slope triangle', set: (v) => tween(SF, 'tri', v ? 1 : 0, 0.5) },
    { type: 'check', key: 'lnb', label: 'ln b', set: (v) => tween(SF, 'lnb', v ? 1 : 0, 0.5) },
    { type: 'note', html: 'Drag on the plot to move the point.' },
  ],
  draw: drawWhyE, pointer: pointerWhyE,
});
function drawWhyE(ctx, dt, st) {
  const A = weAxes(), b = st.b, k = Math.log(b), f = (x) => Math.pow(b, x);
  drawAxes(ctx, A, st);
  drawCurve(ctx, A, f, { p: st.p });
  const a = st.ptA;
  if (a > 0.003) {
    const x = st.x, y = f(x), s = k * y, X = A.X(x), Y = A.Y(y), yq = y - s, LY = A.Y(yq), ta = a * st.tri;
    ctx.save(); ctx.lineCap = 'round';
    if (ta > 0.003) {
      // the tangent through the point, from one unit back; the run of 1 under it; the rise, which is the slope
      ctx.strokeStyle = hexA(COL.white, 0.8 * ta); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(A.X(x - 1), LY); ctx.lineTo(A.X(x + 0.4), A.Y(y + 0.4 * s)); ctx.stroke();
      ctx.strokeStyle = hexA(COL.greyB, ta); ctx.beginPath(); ctx.moveTo(A.X(x - 1), LY); ctx.lineTo(X + 6, LY); ctx.stroke();
      ctx.strokeStyle = hexA(COL.green, ta); ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(X + 6, LY); ctx.lineTo(X + 6, Y); ctx.stroke();
    }
    // the height, from the axis up to the curve
    ctx.strokeStyle = hexA(COL.yellow, a); ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(X - 6, A.oy); ctx.lineTo(X - 6, Y); ctx.stroke();
    ctx.restore();
    // the run's 1: under the run where there is room, else inside the triangle, else left out
    if (ta > 0.003) {
      const mx = A.X(x - 0.5), room = (s / 2) * A.sy;
      const ly = LY <= A.oy - 64 || LY > A.oy + 4 ? LY + 36 : room >= 56 ? LY - 28 : null;
      if (ly != null && ly < H - 12) drawTex(ctx, '1', mx, ly, 46, { alpha: ta });
    }
    dot(ctx, X, Y, 10, COL.white, a);
  }
  // the numbers: the base, and slope over height, which is the same all along the curve
  const cx = 1290, la = st.lab;
  if (la > 0.003) {
    drawTex(ctx, 'y = b^x', cx, 210, 90, { ax: 0, p: la });
    const e1 = drawTex(ctx, 'b =', cx, 335, 72, { ax: 0, p: la }).pop();
    if (e1) drawNumber(ctx, b, e1.x + e1.w + 0.3 * e1.fpx, e1.base, { size: e1.fpx, dec: 3, color: COL.blue, alpha: la });
    const e2 = drawTex(ctx, String.raw`\dfrac{${tc(COL.green, String.raw`\text{slope}`)}}{${tc(COL.yellow, String.raw`\text{height}`)}} =`, cx, 500, 62, { ax: 0, p: la, alpha: Math.max(a, 0.001) }).pop();
    if (e2) drawNumber(ctx, k, e2.x + e2.w + 0.3 * e2.fpx, e2.base, { size: e2.fpx, dec: 3, color: COL.gold, alpha: la * a });
  }
  if (st.lnb > 0.003) { const e3 = drawTex(ctx, String.raw`\ln b =`, cx, 640, 62, { ax: 0, p: st.lnb }).pop(); if (e3) drawNumber(ctx, k, e3.x + e3.w + 0.3 * e3.fpx, e3.base, { size: e3.fpx, dec: 3, color: COL.gold, alpha: st.lnb }); }
  const close = clamp(1 - Math.abs(b - Math.E) / 0.02, 0, 1);
  if (st.deq > 0.003 && close > 0.003) drawTex(ctx, String.raw`\frac{d}{dx}\,e^{x} = e^{x}`, cx, 830, 84, { ax: 0, p: st.deq, alpha: close });
}
function pointerWhyE(type, x, y) {
  const st = SF, sc = scenes.whye, A = weAxes(), over = x > A.L - 10 && x < A.R + 10 && y > A.T - 40 && y < A.B + 60;
  const setX = () => { st.x = clamp(-2 + ((x - A.L) / (A.R - A.L)) * 4, -0.9, 1.5); };
  if (type === 'down') { sc.drag = over; if (over) { sc.epoch++; untween(st, 'x'); setX(); } return over; }
  if (type === 'up') { sc.drag = false; return false; }
  if (sc.drag) { setX(); return true; }
  return over;
}

// ---------- G. slice by slice ----------
// The storyboard's "why exponential?": identical thin slices, each keeping the same fraction of whatever reaches
// it. With 90%: after one slice 90% is left, after two 81%, then 72.9%: the same fraction of less and less, so
// each slice takes less than the one before. What is left after n slices is 0.9ⁿ = e^{−αn} with α = ln(1/0.9),
// and the bars are its samples. Per unit length the loss is proportional to what is there: dI/dz = −αI.
const SS = { apX: 330, y: 290, x0: 480, x1: 1440, top: 170, bot: 410, xs: 1580, nMax: 12 };
const ssW = (SS.x1 - SS.x0) / SS.nMax;
const SG = defScene({
  id: 'compound', tab: 'Slice by slice', shared: true,
  defaults: () => ({ n: 2, f: 0.9, vals: 1, curveP: 0, parts: 1, shown: null, addT: 0.9, F: {}, M: [] }),
  actions: [
    { id: 'add', label: 'Add a slice', primary: true, run: (st) => tween(st, 'n', Math.min(SS.nMax, Math.round(st.n) + 1), st.addT) },
    { id: 'fill', label: 'Fill up', run: async (st, alive) => {
      while (alive() && Math.round(st.n) < SS.nMax) { await tween(st, 'n', Math.round(st.n) + 1, st.addT * 0.7); if (!alive()) return; await sleep(0.25, 'compound'); }
    } },
    { id: 'remove', label: 'Remove a slice', run: (st) => tween(st, 'n', Math.max(0, Math.round(st.n) - 1), st.addT) },
    { id: 'empty', label: 'Empty', run: (st) => tween(st, 'n', 0, st.addT * 1.5) },
    { id: 'curve', label: 'Draw the curve', run: (st) => { st.curveP = 0; return tween(st, 'curveP', 1, 2); } },
    { id: 'eq', label: 'Equation', run: async (st, alive) => {
      const pl = { x: 960, y: 84, size: 56 }, pct = Math.round((1 - st.f) * 100);
      st.F = {}; st.M = [];
      await fWrite(st, 'eq', String.raw`\Delta I = -${pct}\%\; I`, pl, 1.2); if (!alive()) return;
      await sleep(1.2, 'compound'); if (!alive()) return;
      await fMorph(st, 'eq', String.raw`\frac{dI}{dz} = -\alpha\, I`, pl, { style: 'shape' }); if (!alive()) return;
      await sleep(1.2, 'compound'); if (!alive()) return;
      await fMorph(st, 'eq', String.raw`I = I_0\, e^{-\alpha z}`, pl, { style: 'shape' });
    } },
    RESET,
  ],
  params: [
    { type: 'range', key: 'f', label: 'Kept by each slice', min: 0.5, max: 0.99, step: 0.01, fmt: (v) => `${Math.round(v * 100)} %` },
    { type: 'range', key: 'addT', label: 'Time per slice (s)', min: 0.2, max: 3, step: 0.1, fmt: (v) => v.toFixed(1) },
    { type: 'check', key: 'vals', label: 'Values on the bars', set: (v) => tween(SG, 'vals', v ? 1 : 0, 0.4) },
    { type: 'check', key: 'parts', label: 'Particles in the slices', set: (v) => tween(SG, 'parts', v ? 1 : 0, 0.4) },
  ],
  draw: drawCompound,
});
function drawCompound(ctx, dt, st) {
  const f = st.f, w = ssW, pres = (k) => clamp(st.n - (k - 1), 0, 1);   // how far slice k (from 1) has arrived
  // the light left at x: each slice multiplies by f, part of a slice by part of f (a slice still arriving, by less)
  const T = (x) => {
    let t = 1;
    for (let k = 1; k <= SS.nMax; k++) {
      const a = pres(k), fr = clamp((x - (SS.x0 + (k - 1) * w)) / w, 0, 1); if (a <= 0 || fr <= 0) break;
      t *= Math.pow(f, a * fr);
    }
    return t;
  };
  // the slices, dropping into place as they arrive, darker the more each one takes
  const look = SH.container === 'cloud' ? LOOKS.fog : lookOf(SH), dens = clamp(-Math.log(f) / 0.7, 0, 1), np = clamp(Math.round(-Math.log(f) * 45), 1, 30);
  for (let k = 1; k <= SS.nMax; k++) {
    const a = pres(k); if (a <= 0.003) continue;
    const e = smooth(a), x = SS.x0 + (k - 1) * w + 3, y = SS.top - (1 - e) * 70, ww = w - 6, hh = SS.bot - SS.top;
    ctx.save(); ctx.globalAlpha = e;
    ctx.fillStyle = hexA(look.c, lerp(0.12, 0.7, dens)); ctx.strokeStyle = COL.greyA; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.roundRect(x, y, ww, hh, 6); ctx.fill(); ctx.stroke();
    if (st.parts > 0.003) {
      const rnd = rng32(k * 977 + 13); ctx.globalAlpha = e * st.parts; ctx.fillStyle = PART; ctx.strokeStyle = COL.greyB; ctx.lineWidth = 1.5; ctx.beginPath();
      for (let i = 0; i < np; i++) { const px = lerp(x + 9, x + ww - 9, rnd()), py = lerp(y + 12, y + hh - 12, rnd()); ctx.moveTo(px + 5, py); ctx.arc(px, py, 5, 0, Math.PI * 2); }
      ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  }
  const knots = []; for (let k = 0; k <= SS.nMax; k++) knots.push(SS.x0 + k * w);
  drawBeam(ctx, SS.apX, SS.xs - 18, SS.y, SH.color, SH.I0, T, knots);
  drawLaser(ctx, SS.apX, SS.y, SH.color, 1);
  const reading = SH.I0 > 0 ? T(SS.xs) : null;
  st.shown = reading == null ? null : st.shown == null || reduced ? reading : lerp(st.shown, reading, 1 - Math.exp(-dt * 6));
  drawSensor(ctx, SS.xs, SS.y, SH.color, reading == null ? 0 : reading * SH.I0);
  if (st.shown != null) drawReadout(ctx, SS.xs, SS.y, st.shown, 1);
  // what is left after each slice: a bar per slice, at the slice's far face, and e^{-αn} through their tops
  const A = makeAxes({ L: SS.x0, R: SS.x1, T: 640, B: 960, xr: [0, SS.nMax, 1], yr: [0, 1, 0.25], ext: 46, xl: 'n', yl: String.raw`I/I_0`, labSize: 52, numSize: 30 });
  drawAxes(ctx, A, { c: 1, nums: 1, lab: 1 });
  if (st.curveP > 0.003) {
    drawCurve(ctx, A, (m) => Math.pow(f, m), { p: st.curveP, color: COL.blue, width: 4 });
    drawTex(ctx, String.raw`e^{-\alpha n}`, A.X(SS.nMax), A.Y(1), 52, { ax: 1, color: COL.blue, alpha: smooth(clamp(st.curveP * 2 - 1, 0, 1)) });
  }
  for (let k = 0; k <= SS.nMax; k++) {
    const a = k === 0 ? 1 : pres(k); if (a <= 0.003) continue;
    const e = smooth(a), v = Math.pow(f, k), X = A.X(k), Yt = lerp(A.oy, A.Y(v), e);
    ctx.save(); ctx.strokeStyle = COL.yellow; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(X, A.oy); ctx.lineTo(X, Yt); ctx.stroke(); ctx.restore();
    dot(ctx, X, Yt, 9, COL.yellow, e);
    if (st.vals > 0.003 && k > 0) drawNumber(ctx, v * 100, X, Yt - 22, { size: 28, dec: 1, suffix: '%', align: 'center', alpha: e * st.vals });
  }
  drawFormulas(ctx, st);
}

// ---------- H. one photon at a time ----------
// The storyboard's "why a fraction?": light is photons, and each one either meets a particle on its way or does
// not. Fire them one at a time: each stops where it first touches a particle (which warms a little), or reaches
// the sensor. Count enough of them and the fraction that gets through settles: it is a probability, P(X ≥ d),
// where X is how far a photon gets before it is absorbed. Where they stop builds P(X ≥ x), which follows e^{−μx};
// its complement P(X < x) = 1 − e^{−μx} is the chance of being absorbed before x. A dim stream and a bright one
// settle on the same fraction: only the count changes.
const PH = { ex: 330, x0: 560, x1: 1320, top: 130, bot: 410, sx: 1440, pxcm: 38, d: 20 };
function phDiscs(st) {
  const key = `${Math.round(st.n)}|${st.r}|${st.seed}`;
  if (st.discKey !== key) {
    const r = st.r, rnd = rng32(st.seed * 7919 + 555), list = [];
    for (let i = 0; i < Math.round(st.n); i++) list.push({ x: lerp(PH.x0 + r, PH.x1 - r, rnd()), y: lerp(PH.top - r, PH.bot + r, rnd()), warm: 0 });
    st.discs = list; st.discKey = key;
  }
  return st.discs;
}
function phClear(st) { st.photons = []; st.depths = []; st.through = 0; st.total = 0; st.marks = []; st.flashes = []; st.ticks = []; st.queue = 0; st.acc = 0; }
const phRecord = (st, depth) => {
  st.total++;
  if (depth === Infinity) { st.through++; return; }
  const a = st.depths; let lo = 0, hi = a.length; while (lo < hi) { const m = (lo + hi) >> 1; if (a[m] < depth) lo = m + 1; else hi = m; } a.splice(lo, 0, depth);
};
function phSpawn(st) {
  const discs = phDiscs(st), y = lerp(PH.top, PH.bot, Math.random()), R = st.r;
  let hit = Infinity, hi = -1;
  for (let i = 0; i < discs.length; i++) { const dy = y - discs[i].y; if (dy > -R && dy < R) { const xh = discs[i].x - Math.sqrt(R * R - dy * dy); if (xh < hit) { hit = xh; hi = i; } } }
  const p = { x: PH.ex, y, hit, hi };
  if (reduced) phLand(st, p); else st.photons.push(p);
}
function phLand(st, p) {
  if (p.hit < Infinity) {
    phRecord(st, Math.max(0, (p.hit - PH.x0) / PH.pxcm));
    st.marks.push([p.hit, p.y]); if (st.marks.length > 600) st.marks.shift();
    st.flashes.push([p.hit, p.y, TIME]); if (p.hi >= 0) st.discs[p.hi].warm = 1;
  } else { phRecord(st, Infinity); st.ticks.push([p.y, TIME]); }
}
// What independent, uniformly placed particles predict: still going at x when no centre lies in the strip swept so far.
function phPred(st, xcm) {
  const r = st.r, a = PH.x0 + r, b = PH.x1 - r, n = Math.round(st.n) / ((b - a) * (PH.bot - PH.top + 2 * r)), x = PH.x0 + xcm * PH.pxcm;
  let A = 0; const k = 24;
  for (let i = 0; i < k; i++) { const u = -r + ((i + 0.5) * 2 * r) / k; A += clamp(x + Math.sqrt(r * r - u * u) - a, 0, b - a); }
  return Math.exp(-n * A * ((2 * r) / k));
}
const SH8 = defScene({
  id: 'photons', tab: 'One photon at a time', shared: true,
  defaults: () => ({ n: 30, r: 6, seed: 1, speed: 1000, rate: 40, stream: false, lr: Math.log(2), pred: 1, cdf: 0,
    discs: [], discKey: '', photons: [], depths: [], through: 0, total: 0, marks: [], flashes: [], ticks: [], queue: 0, acc: 0 }),
  actions: [
    { id: 'one', label: 'Fire one', run: (st) => { phSpawn(st); } },
    { id: 'ten', label: 'Fire ten', run: (st) => { st.lr = Math.log(6); st.queue += 10; } },
    { id: 'many', label: 'Fire many', primary: true, run: async (st) => { st.queue += 1500; st.lr = Math.log(2); await tween(st, 'lr', Math.log(220), 7, { ease: linear }); } },
    { id: 'stream', label: 'Stream on / off', run: (st) => { st.stream = !st.stream; } },
    { id: 'clear', label: 'Clear', run: (st) => phClear(st) },
    { id: 'resample', label: 'Resample', run: (st) => { st.seed += 1; phClear(st); } },
    RESET,
  ],
  params: [
    { type: 'range', key: 'n', label: 'Particles', min: 0, max: 150, step: 1, fmt: (v) => String(Math.round(v)), set: (v) => { SH8.n = v; phClear(SH8); } },
    { type: 'range', key: 'r', label: 'Particle radius', min: 2, max: 16, step: 0.5, fmt: (v) => v.toFixed(1), set: (v) => { SH8.r = v; phClear(SH8); } },
    { type: 'range', key: 'rate', label: 'Stream (photons/s)', min: 1, max: 300, step: 1, fmt: (v) => String(v) },
    { type: 'range', key: 'speed', label: 'Photon speed (px/s)', min: 200, max: 3000, step: 50, fmt: (v) => String(v) },
    { type: 'check', key: 'pred', label: 'Prediction e^(−μx)', set: (v) => tween(SH8, 'pred', v ? 1 : 0, 0.5) },
    { type: 'check', key: 'cdf', label: 'P(X < x) too', set: (v) => tween(SH8, 'cdf', v ? 1 : 0, 0.5) },
  ],
  draw: drawPhotons,
});
function drawPhotons(ctx, dt, st) {
  const discs = phDiscs(st), color = SH.color, R = st.r;
  // fire, fly, land
  if (st.queue > 0 || st.stream) {
    st.acc += dt * (st.queue > 0 ? Math.exp(st.lr) : st.rate);
    while (st.acc >= 1) { st.acc -= 1; if (st.queue > 0) st.queue--; else if (!st.stream) { st.acc = 0; break; } phSpawn(st); }
  } else st.acc = 0;
  for (let i = st.photons.length - 1; i >= 0; i--) {
    const p = st.photons[i]; p.x += st.speed * dt;
    if (p.x >= Math.min(p.hit, PH.sx)) { phLand(st, p); st.photons.splice(i, 1); }
  }
  const k = Math.exp(-dt / 0.5); for (const d of discs) d.warm *= k;
  st.flashes = st.flashes.filter((f) => TIME - f[2] < 0.35); st.ticks = st.ticks.filter((t) => TIME - t[1] < 0.5);
  // the slab: where photons stopped, the particles, the photons in flight
  dashed(ctx, PH.x0, PH.top - 50, PH.x0, PH.bot + 50, COL.greyC, 1, 2);
  dashed(ctx, PH.x1, PH.top - 50, PH.x1, PH.bot + 50, COL.greyC, 1, 2);
  if (st.marks.length) { ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); for (const [x, y] of st.marks) { ctx.moveTo(x + 2.6, y); ctx.arc(x, y, 2.6, 0, Math.PI * 2); } ctx.fill(); }
  ctx.save(); ctx.strokeStyle = COL.greyB; ctx.lineWidth = Math.min(2.5, R * 0.3);
  for (const d of discs) { ctx.fillStyle = rgba(mixRgb(hexRgb(PART), hexRgb(COL.gold), 0.6 * d.warm), 1); ctx.beginPath(); ctx.arc(d.x, d.y, R, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
  ctx.restore();
  if (st.photons.length) {
    const c = hexRgb(color);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    ctx.strokeStyle = rgba(c, 0.35); ctx.lineWidth = 4; ctx.beginPath();
    for (const p of st.photons) { ctx.moveTo(Math.max(PH.ex, p.x - 26), p.y); ctx.lineTo(p.x, p.y); } ctx.stroke();
    ctx.fillStyle = rgba(c, 1); ctx.beginPath(); for (const p of st.photons) { ctx.moveTo(p.x + 4.5, p.y); ctx.arc(p.x, p.y, 4.5, 0, Math.PI * 2); } ctx.fill();
    ctx.restore();
  }
  for (const [x, y, t0] of st.flashes) { const u = (TIME - t0) / 0.35; ctx.strokeStyle = hexA(COL.white, 0.9 * (1 - u)); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 4 + 16 * u, 0, Math.PI * 2); ctx.stroke(); }
  drawSheetLaser(ctx, PH.ex, PH.top, PH.bot, color);
  // the sensor, flashing where photons arrive, and the fraction of all photons that got here
  ctx.save(); ctx.lineWidth = 3; ctx.strokeStyle = COL.greyB; ctx.fillStyle = BODY;
  ctx.beginPath(); ctx.roundRect(PH.sx, PH.top - 30, 26, PH.bot - PH.top + 60, 6); ctx.fill(); ctx.stroke();
  for (const [y, t0] of st.ticks) { ctx.fillStyle = hexA(color, 1 - (TIME - t0) / 0.5); ctx.fillRect(PH.sx - 3, y - 2, 6, 4); }
  ctx.restore();
  if (st.total > 0) readoutBox(ctx, PH.sx + 50, (PH.top + PH.bot) / 2, st.through / st.total, 1);
  const e0 = drawTex(ctx, String.raw`\text{photons} =`, 820, 62, 52, { ax: 0 }).pop();
  if (e0) drawNumber(ctx, st.total, e0.x + e0.w + 0.3 * e0.fpx, e0.base, { size: e0.fpx, dec: 0, color: COL.blue });
  // where they stopped: the fraction still going at each depth, P(X ≥ x), against e^{-μx}
  const A = makeAxes({ L: PH.x0, R: PH.x1, T: 600, B: 960, xr: [0, PH.d, 5], yr: [0, 1, 0.5], ext: 46, xl: 'x', labSize: 52, numSize: 30 });
  drawAxes(ctx, A, { c: 1, nums: 1, lab: 1 });
  if (st.pred > 0.003) {
    drawCurve(ctx, A, (x) => phPred(st, x), { color: COL.blue, alpha: 0.85 * st.pred, width: 3.5 });
    if (st.cdf > 0.003) drawCurve(ctx, A, (x) => 1 - phPred(st, x), { color: COL.blue, alpha: 0.85 * st.pred * st.cdf, width: 3.5 });
  }
  const N = st.total;
  if (N > 0) {
    const stairs = (flip) => {
      const path = new Path2D(), Yv = (s) => A.Y(flip ? 1 - s : s); let alive = N;
      path.moveTo(A.X(0), Yv(1));
      for (const d of st.depths) { const x = A.X(Math.min(d, PH.d)); path.lineTo(x, Yv(alive / N)); alive--; path.lineTo(x, Yv(alive / N)); }
      path.lineTo(A.X(PH.d), Yv(alive / N));
      return path;
    };
    ctx.save(); ctx.lineWidth = 4; ctx.lineJoin = 'round';
    ctx.strokeStyle = COL.yellow; ctx.stroke(stairs(false));
    if (st.cdf > 0.003) { ctx.globalAlpha = st.cdf; ctx.strokeStyle = COL.red; ctx.stroke(stairs(true)); }
    ctx.restore();
    // the two ends' values, kept off the axis and apart from each other
    const s = st.through / N, top = A.oy - 22;
    let yS = Math.min(A.Y(s) + 12, top), yA = Math.min(A.Y(1 - s) + 12, top);
    if (st.cdf > 0.003 && Math.abs(yS - yA) < 40) { const m = (yS + yA) / 2, up = s >= 0.5 ? -1 : 1; yS = Math.min(m + up * 20, top); yA = Math.min(m - up * 20, top); if (Math.abs(yS - yA) < 40) (s >= 0.5 ? (yS = yA - 40) : (yA = yS - 40)); }
    drawNumber(ctx, s * 100, A.X(PH.d) + 16, yS, { size: 36, dec: 1, suffix: '%', color: COL.yellow });
    if (st.cdf > 0.003) drawNumber(ctx, (1 - s) * 100, A.X(PH.d) + 16, yA, { size: 36, dec: 1, suffix: '%', color: COL.red, alpha: st.cdf });
  }
  drawTex(ctx, String.raw`P(X \ge x)`, A.X(PH.d), A.Y(1) + 6, 44, { ax: 1, color: COL.yellow });
  if (st.pred > 0.003) drawTex(ctx, String.raw`e^{-\mu x}`, A.X(PH.d), A.Y(1) + 64, 46, { ax: 1, color: COL.blue, alpha: st.pred });
  if (st.cdf > 0.003) drawTex(ctx, String.raw`P(X < x)`, A.X(PH.d), A.Y(0.13), 44, { ax: 1, color: COL.red, alpha: st.cdf });
}

// ---------- I. A or B? ----------
// The storyboard's last board: two slabs made of the same two halves, a dense one and a sparse one, in opposite
// orders. Which lets more light through? Each half lets its own fraction through, e^{−σ₁Δx} and e^{−σ₂Δx}, and
// what gets out is their product. A product does not care about order, so A = B: either way the exponents add
// up to σ₁ + σ₂.
const ABG = { apX: 400, x0: 560, x1: 1240, sx: 1400, rows: [250, 640], h: 180 };
const AB_S1 = `{{${tc(COL.yellow, String.raw`\sigma_1`)}}}`, AB_S2 = `{{${tc(COL.blue, String.raw`\sigma_2`)}}}`, AB_DX = String.raw`{{\Delta x}}`;
const abSig = (k) => (k === 1 ? AB_S1 : AB_S2);
const abFac = (k) => String.raw`e^{-${abSig(k)}\,${AB_DX}}`;
const abSum = (a, b) => String.raw`e^{-(${abSig(a)} + ${abSig(b)})\,${AB_DX}}`;
const abPl = (r, x = 900) => ({ x, y: ABG.rows[r] + 150, size: 56 });
const SAB = stepScene({
  id: 'order', tab: 'A or B?', shared: true,
  defaults: () => ({ t1: 0.9, t2: 0.3, shineT: 2.2, mk: 0, labA: 0, quiz: [0, 0, 0], quizA: 1, quizHi: 0, front: 0, F: {}, M: [], step: -1 }),
  params: [
    { type: 'range', key: 't1', label: 'Dense half, σ₁Δx', min: 0.1, max: 2, step: 0.05, fmt: (v) => v.toFixed(2) },
    { type: 'range', key: 't2', label: 'Sparse half, σ₂Δx', min: 0, max: 1, step: 0.05, fmt: (v) => v.toFixed(2) },
    { type: 'range', key: 'shineT', label: 'Shine time (s)', min: 0.5, max: 6, step: 0.1, fmt: (v) => v.toFixed(1) },
  ],
  steps: [
    { label: 'Two slabs', run: async (st) => { tween(st, 'labA', 1, 0.8, { ease: linear, delay: 0.9 }); await tween(st, 'mk', 1, 1.6); } },
    { label: 'Which lets more through?', run: async (st) => {
      for (let i = 0; i < 3; i++) { tween(st.quiz, i, 1, 0.8, { ease: linear, tag: 'order' }); await sleep(0.45, 'order'); }
      await sleep(0.4, 'order');
    } },
    { label: 'Shine', run: async (st) => { await tween(st, 'front', 1, st.shineT, { ease: linear }); await sleep(0.5, 'order'); await tween(st, 'quizHi', 1, 0.6); } },
    { label: 'Each half lets its share through', run: async (st) => {
      tween(st, 'quizA', 0, 0.5);
      await Promise.all([0, 1].flatMap((r) => {
        const [a, b] = r ? [2, 1] : [1, 2];
        return [fWrite(st, `f${r}a`, abFac(a), abPl(r, 730), 0.9), fWrite(st, `x${r}`, String.raw`\times`, abPl(r, 900), 0.5), fWrite(st, `f${r}b`, abFac(b), abPl(r, 1070), 0.9)];
      }));
    } },
    { label: 'Multiply: the exponents add', run: (st) => Promise.all([0, 1].map((r) => fMorph(st, `c${r}`, r ? abSum(2, 1) : abSum(1, 2), abPl(r), { from: [`f${r}a`, `x${r}`, `f${r}b`] }))) },
    { label: 'The order does not matter', run: (st) => fMorph(st, 'c1', abSum(1, 2), abPl(1)) },
  ],
  draw: drawOrder,
});
function drawOrder(ctx, dt, st) {
  const color = SH.color, look = SH.container === 'cloud' ? LOOKS.fog : lookOf(SH), lc = hexRgb(look.c), xm = (ABG.x0 + ABG.x1) / 2, hw = xm - ABG.x0;
  const mk = st.mk, ol = clamp(mk / 0.6, 0, 1), fa = clamp((mk - 0.3) / 0.4, 0, 1), ga = clamp(mk / 0.5, 0, 1), lit = st.front > 0.0005;
  for (let r = 0; r < 2; r++) {
    const y = ABG.rows[r], top = y - ABG.h / 2, bot = y + ABG.h / 2, kinds = r ? [2, 1] : [1, 2], taus = kinds.map((k) => (k === 1 ? st.t1 : st.t2));
    // the two halves: denser colour and more particles where σΔx is bigger; the same dense half in both slabs
    for (let h = 0; h < 2; h++) {
      const hx = ABG.x0 + h * hw, k = kinds[h], tau = taus[h], n = Math.round(tau * 30), rnd = rng32(k * 1013 + 7);
      if (fa > 0.003) { ctx.fillStyle = rgba(lc, fa * lerp(0.06, 0.55, clamp(tau / 1.5, 0, 1))); ctx.fillRect(hx, top, hw, ABG.h); }
      ctx.fillStyle = PART; ctx.strokeStyle = COL.greyB; ctx.lineWidth = 2;
      for (let j = 0; j < 60; j++) {
        const px = lerp(hx + 12, hx + hw - 12, rnd()), py = lerp(top + 12, bot - 12, rnd()); if (j >= n) continue;
        const g = smooth(clamp((mk - 0.4 - 0.5 * (j / Math.max(1, n))) / 0.12, 0, 1)); if (g <= 0.003) continue;
        ctx.beginPath(); ctx.arc(px, py, 7 * g, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }
    }
    const per = 2 * (ABG.x1 - ABG.x0 + ABG.h);
    if (ol > 0.003) { ctx.save(); ctx.strokeStyle = COL.greyA; ctx.lineWidth = 3; if (ol < 1) ctx.setLineDash([ol * per, per]); ctx.strokeRect(ABG.x0, top, ABG.x1 - ABG.x0, ABG.h); ctx.restore(); }
    if (fa > 0.003) dashed(ctx, xm, top + 4, xm, bot - 4, COL.greyA, 0.7 * fa, 2);
    // the beam, losing light at its own rate in each half
    const T = (x) => { const u = clamp((x - ABG.x0) / hw, 0, 2); return Math.exp(-(taus[0] * Math.min(u, 1) + taus[1] * Math.max(0, u - 1))); };
    if (lit) drawBeam(ctx, ABG.apX, lerp(ABG.apX, ABG.sx - 18, st.front), y, color, SH.I0, T, [ABG.x0, xm, ABG.x1]);
    ctx.save(); ctx.globalAlpha = ga;
    drawLaser(ctx, ABG.apX, y, color, lit ? 1 : 0);
    const reached = st.front >= 0.999;
    ctx.lineWidth = 3; ctx.strokeStyle = COL.greyB; ctx.fillStyle = BODY;
    ctx.beginPath(); ctx.roundRect(ABG.sx - 15, y - 48, 30, 96, 6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = hexA(color, 0.16 + 0.84 * (reached ? T(ABG.x1) * SH.I0 : 0)); ctx.fillRect(ABG.sx - 18, y - 28, 5, 56);
    ctx.restore();
    if (reached) readoutBox(ctx, ABG.sx + 46, y, T(ABG.x1), 1);
    if (st.labA > 0.003) drawTex(ctx, r ? 'B' : 'A', 120, y, 84, { p: st.labA });
  }
  // the question, between the two slabs
  const Q = [String.raw`A > B\,?`, String.raw`B > A\,?`, String.raw`A = B\,?`], qx = [500, 900, 1300];
  for (let i = 0; i < 3; i++) {
    const p = st.quiz[i], hi = i === 2 ? st.quizHi : 0, a = st.quizA * (i === 2 ? 1 : 1 - 0.65 * st.quizHi);
    if (p > 0.003 && a > 0.003) drawSprites(ctx, place(tex(Q[i]), { x: qx[i], y: 445, size: 64 }), { p, alpha: a, color: mixRgb(WHITE_RGB, hexRgb(COL.yellow), hi) });
  }
  drawFormulas(ctx, st);
}

// ---------- J. from a product to an integral ----------
// The rest of that board: one slab cut into slices. Each slice lets e^{−σᵢΔz} through and what gets out is the
// product, so the exponents add: e^{−(σ₁+σ₂+⋯)Δz} = e^{−Σσᵢ Δz}, and the bars of σᵢ have that sum as their area.
// Cut thinner and the bars close in on the density curve, the sum on the area under it: ∫σ(z)dz, the exponent
// of Beer–Lambert. Last, the density takes other shapes with the same area (a dense blob, a long thin cloud, two
// bumps), the particles slide to match, and the light that gets out does not change: only the total counts.
const PIG = { apX: 400, x0: 480, x1: 1440, y: 600, top: 525, bot: 675, xs: 1610, d: 20, smax: 0.35, n: 400 };
const piSig0 = (z) => 0.02 + 0.16 * Math.exp(-(((z - 9) / 3.5) ** 2));
const piSample = (f) => { const a = new Float64Array(PIG.n + 1); for (let i = 0; i <= PIG.n; i++) a[i] = f((i / PIG.n) * PIG.d); return a; };
const piArea = (P) => { let s = 0; for (let i = 1; i <= PIG.n; i++) s += ((P[i - 1] + P[i]) / 2) * (PIG.d / PIG.n); return s; };
const PI_A0 = piArea(piSample(piSig0));
const piShape = (g) => { const P = piSample(g), k = PI_A0 / piArea(P); return P.map((v) => v * k); };
const PI_SHAPES = [(z) => 0.03 + Math.exp(-(((z - 12) / 2.2) ** 2)), (z) => sigmoid((z - 1) * 3) * sigmoid((19 - z) * 3), (z) => Math.exp(-(((z - 5) / 2) ** 2)) + Math.exp(-(((z - 15) / 2) ** 2)), piSig0];
const PI_FPL = { x: 960, y: 905, size: 64, fit: 1400 };
const piS = (sub) => tc(COL.green, String.raw`\sigma_{${sub}}`);
const piProd = (k) => (k === 2 ? String.raw`T = e^{-${piS(1)}\Delta z}\; e^{-${piS(2)}\Delta z}` : String.raw`T = e^{-${piS(1)}\Delta z}\, e^{-${piS(2)}\Delta z} \cdots e^{-${piS(k)}\Delta z}`);
const piSumOpen = (k) => String.raw`T = e^{-(${piS(1)} + ${piS(2)} + \cdots + ${piS(k)})\,\Delta z}`;
const piSigma = (k) => String.raw`T = e^{-\sum_{i=1}^{${k}} ${piS('i')}\,\Delta z}`;
const PI_INT = String.raw`T = e^{-\int_0^{d} ${tc(COL.green, String.raw`\sigma(z)`)}\,dz}`;
function piDouble(st) { st.N0 = st.N; st.N = st.N * 2; st.u = 0; return tween(st, 'u', 1, st.dblT); }
function piMorph(st, target, dur) { st.from = st.prof.slice(); st.to = target; st.mu = 0; return tween(st, 'mu', 1, dur); }
const SPI = stepScene({
  id: 'integral', tab: 'Product to integral', shared: true,
  defaults: () => ({ prof: piSample(piSig0), from: null, to: null, mu: 1, N: 2, N0: 2, u: 1, mk: 0, front: 0, curveA: 0, int: 0, barHi: 0, labN: 0,
    dblT: 0.9, shown: null, F: {}, M: [], step: -1 }),
  params: [
    { type: 'range', key: 'dblT', label: 'Time per doubling (s)', min: 0.3, max: 3, step: 0.1, fmt: (v) => v.toFixed(1) },
  ],
  steps: [
    { label: 'Two slices', run: async (st) => { await tween(st, 'mk', 1, 1.4); await tween(st, 'front', 1, 1.6, { ease: linear }); await fWrite(st, 'T', piProd(2), PI_FPL, 1.2); } },
    { label: 'Eight slices', run: async (st) => { tween(st, 'labN', 1, 0.5); await piDouble(st); await piDouble(st); await fMorph(st, 'T', piProd(8), PI_FPL); } },
    { label: 'The exponents add', run: (st) => fMorph(st, 'T', piSumOpen(8), PI_FPL) },
    { label: 'A sum: the area of the bars', run: async (st) => { await fMorph(st, 'T', piSigma(8), PI_FPL, { style: 'shape' }); await tween(st, 'barHi', 1, 0.6); } },
    { label: 'Thinner and thinner', run: async (st) => {
      tween(st, 'barHi', 0, 0.4); tween(st, 'curveA', 1, 0.8);
      await fMorph(st, 'T', piSigma('N'), PI_FPL, { style: 'shape' });
      for (let i = 0; i < 3; i++) { await piDouble(st); await sleep(0.3, 'integral'); }
    } },
    { label: 'An integral', run: async (st) => { tween(st, 'int', 1, 1.4); tween(st, 'labN', 0, 0.8); await fMorph(st, 'T', PI_INT, PI_FPL, { style: 'shape', dur: 1.6 }); } },
    { label: 'Only the total counts', run: async (st) => { for (const g of PI_SHAPES) { await piMorph(st, piShape(g), 1.6); await sleep(0.7, 'integral'); } } },
  ],
  draw: drawIntegral,
});
function drawIntegral(ctx, dt, st) {
  if (st.from) { for (let i = 0; i <= PIG.n; i++) st.prof[i] = lerp(st.from[i], st.to[i], st.mu); if (st.mu >= 1) st.from = null; }
  const P = st.prof, n = PIG.n, dz = PIG.d / n, cum = new Float64Array(n + 1);
  for (let i = 1; i <= n; i++) cum[i] = cum[i - 1] + ((P[i - 1] + P[i]) / 2) * dz;
  const at = (z) => { const f = clamp(z / PIG.d, 0, 1) * n, i = Math.min(n - 1, Math.floor(f)); return lerp(P[i], P[i + 1], f - i); };
  const xOf = (z) => PIG.x0 + (z / PIG.d) * (PIG.x1 - PIG.x0);
  // the slices: midpoint heights; while doubling, each new bar grows out of its parent's height
  const Nf = st.N, Nc = st.N0, uu = Nf > Nc ? smooth(clamp(st.u, 0, 1)) : 1, wz = PIG.d / Nf, hts = new Float64Array(Nf), pre = new Float64Array(Nf + 1);
  for (let j = 0; j < Nf; j++) { const own = at((j + 0.5) * wz), par = Nf > Nc ? at((Math.floor((j * Nc) / Nf) + 0.5) * (PIG.d / Nc)) : own; hts[j] = lerp(par, own, uu); pre[j + 1] = pre[j] + hts[j] * wz; }
  const tauBars = (z) => { const k = Math.min(Nf - 1, Math.floor(z / wz)); return pre[k] + hts[k] * clamp(z - k * wz, 0, wz); };
  const tauCurve = (z) => { const f = clamp(z / PIG.d, 0, 1) * n, i = Math.min(n - 1, Math.floor(f)); return lerp(cum[i], cum[i + 1], f - i); };
  const tau = (z) => lerp(tauBars(clamp(z, 0, PIG.d)), tauCurve(z), st.int);
  // the slab: slices coloured by their σᵢ, blending into the smooth density once the sum is an integral
  const mk = st.mk, ol = clamp(mk / 0.6, 0, 1), fa = clamp((mk - 0.3) / 0.5, 0, 1), look = SH.container === 'cloud' ? LOOKS.fog : lookOf(SH), lc = hexRgb(look.c);
  const fillA = (s) => fa * lerp(0.06, 0.85, clamp(s / PIG.smax, 0, 1));
  if (fa > 0.003) {
    if (st.int < 0.999) {
      const g = ctx.createLinearGradient(PIG.x0, 0, PIG.x1, 0);
      for (let j = 0; j < Nf; j++) { const c = rgba(lc, fillA(hts[j])); g.addColorStop(j / Nf, c); g.addColorStop((j + 1) / Nf, c); }
      ctx.save(); ctx.globalAlpha = 1 - st.int; ctx.fillStyle = g; ctx.fillRect(PIG.x0, PIG.top, PIG.x1 - PIG.x0, PIG.bot - PIG.top); ctx.restore();
    }
    if (st.int > 0.001) {
      const g = ctx.createLinearGradient(PIG.x0, 0, PIG.x1, 0);
      for (let i = 0; i <= n; i += 4) g.addColorStop(i / n, rgba(lc, fillA(P[i])));
      ctx.save(); ctx.globalAlpha = st.int; ctx.fillStyle = g; ctx.fillRect(PIG.x0, PIG.top, PIG.x1 - PIG.x0, PIG.bot - PIG.top); ctx.restore();
    }
  }
  // the particles follow the density itself: each keeps its share of the total, so equal areas keep them all
  const area = cum[n], cnt = Math.round(PI_A0 * 60), rnd = rng32(4242);
  if (fa > 0.003 && area > 1e-6) {
    ctx.save(); ctx.globalAlpha = fa; ctx.fillStyle = PART; ctx.strokeStyle = COL.greyB; ctx.lineWidth = 1.5; ctx.beginPath();
    for (let i = 0; i < cnt; i++) {
      const q = ((i + rnd()) / cnt) * area, v = rnd();
      let lo = 1, hi = n; while (lo < hi) { const m = (lo + hi) >> 1; if (cum[m] < q) lo = m + 1; else hi = m; }
      const f = (q - cum[lo - 1]) / Math.max(1e-12, cum[lo] - cum[lo - 1]), x = xOf(((lo - 1 + clamp(f, 0, 1)) / n) * PIG.d), y = lerp(PIG.top + 12, PIG.bot - 12, v);
      ctx.moveTo(x + 5, y); ctx.arc(x, y, 5, 0, Math.PI * 2);
    }
    ctx.fill(); ctx.stroke(); ctx.restore();
  }
  // the faces between slices: old ones stay, new ones grow from the middle; they go once it is an integral
  const faceA = (1 - st.int) * fa;
  if (faceA > 0.003) {
    ctx.save(); ctx.strokeStyle = hexA(COL.greyA, 0.7 * faceA); ctx.lineWidth = 2; ctx.beginPath();
    for (let j = 1; j < Nf; j++) {
      const old = Number.isInteger((j * Nc) / Nf), s = old ? 1 : uu, h = ((PIG.bot - PIG.top) / 2) * smooth(s), x = xOf(j * wz), cy = (PIG.top + PIG.bot) / 2;
      if (s > 0.003) { ctx.moveTo(x, cy - h); ctx.lineTo(x, cy + h); }
    }
    ctx.stroke(); ctx.restore();
  }
  if (ol > 0.003) { const per = 2 * (PIG.x1 - PIG.x0 + PIG.bot - PIG.top); ctx.save(); ctx.strokeStyle = COL.greyA; ctx.lineWidth = 3; if (ol < 1) ctx.setLineDash([ol * per, per]); ctx.strokeRect(PIG.x0, PIG.top, PIG.x1 - PIG.x0, PIG.bot - PIG.top); ctx.restore(); }
  // the laser and the sensor, as in the other scenes
  const lit = st.front > 0.0005, T = (x) => Math.exp(-tau(((x - PIG.x0) / (PIG.x1 - PIG.x0)) * PIG.d)), knots = [];
  if (st.int < 1) for (let j = 0; j <= Nf; j++) knots.push(xOf(j * wz));
  if (lit) drawBeam(ctx, PIG.apX, lerp(PIG.apX, PIG.xs - 18, st.front), PIG.y, SH.color, SH.I0, (x) => (x < PIG.x0 ? 1 : T(Math.min(x, PIG.x1))), knots);
  ctx.save(); ctx.globalAlpha = clamp(mk / 0.5, 0, 1); drawLaser(ctx, PIG.apX, PIG.y, SH.color, lit ? 1 : 0); ctx.restore();
  const reading = st.front >= 0.999 && SH.I0 > 0 ? T(PIG.x1) : null;
  st.shown = reading == null ? null : st.shown == null || reduced ? reading : lerp(st.shown, reading, 1 - Math.exp(-dt * 6));
  ctx.save(); ctx.globalAlpha = clamp(mk / 0.5, 0, 1); drawSensor(ctx, PIG.xs, PIG.y, SH.color, reading == null ? 0 : reading * SH.I0); ctx.restore();
  if (st.shown != null) drawReadout(ctx, PIG.xs, PIG.y, st.shown, 1);
  // the density: bars of σᵢ, then the curve they close in on, then the area under it
  const A = makeAxes({ L: PIG.x0, R: PIG.x1, T: 120, B: 390, xr: [0, PIG.d, 5], yr: [0, PIG.smax, 0.1], ext: 40, xl: 'z', yl: String.raw`\sigma(z)`, labSize: 50, numSize: 28 });
  drawAxes(ctx, A, { c: clamp(mk / 0.7, 0, 1), nums: 1, lab: clamp(mk / 0.7, 0, 1) });
  const ba = (1 - st.int) * clamp((mk - 0.2) / 0.6, 0, 1);
  if (ba > 0.003) {
    ctx.save(); ctx.fillStyle = hexA(COL.green, ba * (0.3 + 0.3 * st.barHi)); ctx.strokeStyle = hexA(COL.green, ba); ctx.lineWidth = Nf > 32 ? 1.2 : 2;
    for (let j = 0; j < Nf; j++) { const x0 = A.X(j * wz), x1 = A.X((j + 1) * wz), y = A.Y(hts[j] * clamp((mk - 0.2) / 0.6, 0, 1)); ctx.fillRect(x0, y, x1 - x0, A.oy - y); ctx.strokeRect(x0, y, x1 - x0, A.oy - y); }
    ctx.restore();
  }
  if (st.int > 0.003) areaFill(ctx, A, at, 0, PIG.d, hexA(COL.green, 0.32 * st.int));
  if (st.curveA > 0.003) drawCurve(ctx, A, at, { color: COL.green, width: 4, alpha: st.curveA });
  if (st.labN > 0.003) {
    const e = drawTex(ctx, 'N =', PIG.x0, 470, 48, { ax: 0, alpha: st.labN }).pop();
    if (e) drawNumber(ctx, uu < 0.5 && Nf > Nc ? Nc : Nf, e.x + e.w + 0.3 * e.fpx, e.base, { size: e.fpx, dec: 0, color: COL.blue, alpha: st.labN });
  }
  drawFormulas(ctx, st);
}

//@@SCENES@@

// ---------- the stage ----------
const stageEl = $('stage'), cv = $('cv'), ctx = cv.getContext('2d');
let K = 1, cssW = 0, cssH = 0, DPR = 0;
function fitCanvas() {
  // At least 2× the CSS size (3× on dense screens), so curves and edges stay smooth when the stage is small.
  const w = stageEl.clientWidth, h = stageEl.clientHeight, dpr = Math.min(3, Math.max(2, window.devicePixelRatio || 1));
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
const anims = $('anims'), params = $('params'), sharedEl = $('sharedParams'), tabsEl = $('tabs');
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
// Which parameters are showing: when an animation or a menu changes it, the dock is rebuilt.
let dockSig = '';
const visSig = () => cur.params.concat(cur.shared ? SHARED.params : []).map((p) => (!p.visible || p.visible(cur.st) ? 1 : 0)).join('');
function buildDock() {
  live.length = 0; anims.textContent = ''; params.textContent = ''; dockSig = visSig();
  for (const a of cur.actions) {
    const b = mk('button', 'btn' + (a.primary ? ' primary' : '')); b.type = 'button'; b.id = `a-${cur.id}-${a.id}`; b.textContent = a.label;
    b.addEventListener('click', () => runAction(cur, a)); anims.appendChild(b);
  }
  if (cur.extra) anims.appendChild(cur.extra());
  for (const p of cur.params) if (!p.visible || p.visible(cur.st)) params.appendChild(control(cur, p));
  sharedEl.textContent = ''; sharedEl.hidden = !cur.shared;
  if (cur.shared) {
    const h = mk('span', 'grp'); h.textContent = 'Laser and medium · shared by every scene'; sharedEl.appendChild(h);
    for (const p of SHARED.params) if (!p.visible || p.visible(SH)) sharedEl.appendChild(control(SHARED, p));
  }
}
function buildTabs() {
  tabsEl.textContent = ''; $('lastKey').textContent = String(ORDER.length);
  const fs = $('fadeSel'); fs.length = 1; ORDER.forEach((id, i) => fs.add(new Option(`${i + 1} · ${scenes[id].tab}`, id)));
  ORDER.forEach((id, i) => {
    const b = mk('button', 'tab'); b.type = 'button'; b.setAttribute('role', 'tab'); b.dataset.scene = id;
    b.innerHTML = `<span class="n">${i + 1}</span>${scenes[id].tabHtml || ''}`; if (!scenes[id].tabHtml) b.append(scenes[id].tab);
    b.addEventListener('click', () => setScene(id)); tabsEl.appendChild(b);
  });
}
function setScene(id) {
  if (!scenes[id]) id = ORDER[0];
  cur = scenes[id];
  for (const b of tabsEl.children) { const on = b.dataset.scene === id; b.setAttribute('aria-selected', String(on)); if (on && tabsEl.scrollWidth > tabsEl.clientWidth) b.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
  buildDock();
  try { if (location.hash !== '#' + id) history.replaceState(null, '', '#' + id); } catch (e) { /* the viewer may not allow it */ }
}
addEventListener('hashchange', () => { const id = location.hash.slice(1); if (scenes[id] && cur !== scenes[id]) setScene(id); });
$('fadeSel').addEventListener('change', (e) => { const id = e.target.value; e.target.value = ''; if (id) fadeTo(id, 3.5); });
$('speed').addEventListener('input', (e) => { SPEED = +e.target.value; $('speedOut').textContent = `${SPEED.toFixed(2)}×`; });
const setClean = (on) => { document.body.classList.toggle('clean', on); $('showBtn').hidden = !on; };
$('hideBtn').addEventListener('click', () => setClean(true));
$('showBtn').addEventListener('click', () => setClean(false));
function toggleFull() {
  if (document.fullscreenElement) { document.exitFullscreen().catch(() => {}); return; }
  const p = document.documentElement.requestFullscreen?.(); if (p) p.then(() => setClean(true)).catch(() => {});
}
document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement) setClean(false); });
$('fsBtn').addEventListener('click', toggleFull);
let digitBuf = null, digitT = 0;
addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const t = e.target, k = e.key;
  if (t.matches && t.matches('input, select, textarea')) { if (k === 'Escape') t.blur(); return; }
  const onButton = t.matches && t.matches('button');
  if (/^[0-9]$/.test(k)) {
    // a second digit typed soon after the first picks a two-digit scene: 1 then 2 is scene 12
    const now = performance.now(), d = +k, two = digitBuf != null && now - digitT < 700 ? digitBuf * 10 + d : null;
    const n = two != null && two <= ORDER.length ? two : d;
    digitBuf = two != null && two <= ORDER.length ? null : d; digitT = now;
    if (n >= 1 && ORDER[n - 1]) { setScene(ORDER[n - 1]); e.preventDefault(); }
  }
  else if (k === '[' || k === ']') { const i = ORDER.indexOf(cur.id) + (k === ']' ? 1 : -1); setScene(ORDER[(i + ORDER.length) % ORDER.length]); e.preventDefault(); }
  else if (k === ' ' && !onButton) { const a = cur.actions.find((x) => x.primary) || cur.actions[0]; runAction(cur, a); e.preventDefault(); }
  else if (k === 'r' || k === 'R') { const a = cur.actions.find((x) => x.id === 'reset'); if (a) runAction(cur, a); else if (cur.onReset) cur.onReset(); }
  else if (k === 'ArrowRight' && cur.next) { cur.next(); e.preventDefault(); }
  else if (k === 'ArrowLeft' && cur.prev) { cur.prev(); e.preventDefault(); }
  else if (k === 'h' || k === 'H') setClean(!document.body.classList.contains('clean'));
  else if (k === 'f' || k === 'F') toggleFull();
  else if (k === 'Escape' && document.body.classList.contains('clean') && !document.fullscreenElement) setClean(false);
});

// ---------- running it ----------
// A slow crossfade from one scene into another: each is drawn on its own canvas, then the two are blended.
let fade = null;
const fadeCv = [document.createElement('canvas'), document.createElement('canvas')], fadeCtx = fadeCv.map((c) => c.getContext('2d'));
function fadeTo(id, dur = 3.5) {
  if (!scenes[id] || cur === scenes[id]) return;
  const f = { from: cur, t: 0 }; fade = f; setScene(id);
  tween(f, 't', 1, dur, { tag: 'fade' }).then(() => { if (fade === f) fade = null; });
}
function drawInto(i, sc, dt) {
  const c = fadeCv[i], x = fadeCtx[i];
  if (c.width !== cv.width || c.height !== cv.height) { c.width = cv.width; c.height = cv.height; }
  x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, c.width, c.height);
  x.setTransform(K, 0, 0, K, 0, 0); x.textAlign = 'left'; x.textBaseline = 'alphabetic'; x.lineCap = 'butt'; x.setLineDash([]);
  sc.draw(x, dt, sc.st);
  return c;
}
let raf = 0, last = 0;
function frame(now) {
  raf = requestAnimationFrame(frame);
  const dt = Math.min(0.1, Math.max(0, (now - last) / 1000)) * SPEED; last = now;
  tick(dt); TIME += dt;
  fitCanvas();
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  ctx.fillStyle = BG; ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.setTransform(K, 0, 0, K, 0, 0); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.lineCap = 'butt'; ctx.setLineDash([]);
  try {
    if (fade) {
      const a = drawInto(0, fade.from, dt), b = drawInto(1, cur, dt), u = fade.t;
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1 - u; ctx.drawImage(a, 0, 0); ctx.globalAlpha = u; ctx.drawImage(b, 0, 0); ctx.globalAlpha = 1;
    } else cur.draw(ctx, dt, cur.st);
  } catch (err) { console.error(err); }
  for (const f of live) f();
  if (visSig() !== dockSig) buildDock();
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) cancelAnimationFrame(raf);
  else { last = performance.now(); raf = requestAnimationFrame(frame); }
});
async function boot() {
  const faces = ['400 40px KaTeX_Main', 'italic 400 40px KaTeX_Main', '700 40px KaTeX_Main', 'italic 400 40px KaTeX_Math', '400 40px KaTeX_Size1', '400 40px KaTeX_Size2', '400 40px KaTeX_Size3', '400 40px KaTeX_Size4', '400 40px KaTeX_AMS', '400 40px KaTeX_Caligraphic'];
  try { await Promise.all(faces.map((f) => document.fonts.load(f))); } catch (e) { /* fall back to whatever loaded */ }
  ascCache.clear(); texCache.clear();
  for (const id of ORDER) if (scenes[id].init) await scenes[id].init();
  await eqGo(0, false);
  buildTabs(); setScene(location.hash.slice(1));
  last = performance.now(); raf = requestAnimationFrame(frame);
}
if (document.readyState === 'complete') boot(); else addEventListener('load', boot);
