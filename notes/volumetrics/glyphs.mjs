// Glyph outlines from KaTeX's TrueType fonts, so the page can draw formulas as paths and morph one
// formula's outlines into another's. Each glyph becomes an SVG path ("M x y l dx dy q … z") in font units, y up.
import fs from 'node:fs';

function parseTTF(buf) {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength), tables = {};
  const n = dv.getUint16(4);
  for (let i = 0; i < n; i++) {
    const o = 12 + 16 * i, tag = String.fromCharCode(...buf.subarray(o, o + 4));
    tables[tag] = { off: dv.getUint32(o + 8), len: dv.getUint32(o + 12) };
  }
  const head = tables.head.off, upm = dv.getUint16(head + 18), locFmt = dv.getInt16(head + 50);
  const numGlyphs = dv.getUint16(tables.maxp.off + 4);
  const loca = [];
  for (let i = 0; i <= numGlyphs; i++) loca.push(locFmt ? dv.getUint32(tables.loca.off + 4 * i) : dv.getUint16(tables.loca.off + 2 * i) * 2);
  // cmap: character → glyph index (formats 4 and 12)
  const cmap = new Map(), cm = tables.cmap.off, nSub = dv.getUint16(cm + 2);
  for (let i = 0; i < nSub; i++) {
    const sub = cm + dv.getUint32(cm + 4 + 8 * i + 4), fmt = dv.getUint16(sub);
    if (fmt === 4) {
      const segX2 = dv.getUint16(sub + 6), ends = sub + 14, starts = ends + segX2 + 2, deltas = starts + segX2, ranges = deltas + segX2;
      for (let s = 0; s < segX2 / 2; s++) {
        const end = dv.getUint16(ends + 2 * s), start = dv.getUint16(starts + 2 * s), delta = dv.getInt16(deltas + 2 * s), ro = dv.getUint16(ranges + 2 * s);
        for (let c = start; c <= end && c !== 0xffff; c++) {
          let g = 0;
          if (ro === 0) g = (c + delta) & 0xffff;
          else { const gi = dv.getUint16(ranges + 2 * s + ro + 2 * (c - start)); g = gi ? (gi + delta) & 0xffff : 0; }
          if (g && !cmap.has(c)) cmap.set(c, g);
        }
      }
    } else if (fmt === 12) {
      const groups = dv.getUint32(sub + 12);
      for (let k = 0; k < groups; k++) {
        const o = sub + 16 + 12 * k, a = dv.getUint32(o), b = dv.getUint32(o + 4), g0 = dv.getUint32(o + 8);
        for (let c = a; c <= b; c++) if (!cmap.has(c)) cmap.set(c, g0 + (c - a));
      }
    }
  }
  const glyf = tables.glyf.off;
  // contours of glyph g as arrays of {x, y, on}, following composite references
  function contours(g, depth = 0) {
    const start = loca[g], end = loca[g + 1];
    if (end <= start || depth > 8) return [];
    let p = glyf + start;
    const nc = dv.getInt16(p); p += 10;
    if (nc >= 0) {
      const endPts = []; for (let i = 0; i < nc; i++) { endPts.push(dv.getUint16(p)); p += 2; }
      const nPts = nc ? endPts[nc - 1] + 1 : 0;
      p += 2 + dv.getUint16(p);   // instructions
      const flags = [];
      while (flags.length < nPts) { const f = dv.getUint8(p++); flags.push(f); if (f & 8) { let r = dv.getUint8(p++); while (r--) flags.push(f); } }
      const xs = [], ys = [];
      let v = 0;
      for (const f of flags) { if (f & 2) { const d = dv.getUint8(p++); v += f & 16 ? d : -d; } else if (!(f & 16)) { v += dv.getInt16(p); p += 2; } xs.push(v); }
      v = 0;
      for (const f of flags) { if (f & 4) { const d = dv.getUint8(p++); v += f & 32 ? d : -d; } else if (!(f & 32)) { v += dv.getInt16(p); p += 2; } ys.push(v); }
      const out = []; let s = 0;
      for (const e of endPts) { const c = []; for (let i = s; i <= e; i++) c.push({ x: xs[i], y: ys[i], on: !!(flags[i] & 1) }); out.push(c); s = e + 1; }
      return out;
    }
    const out = [];
    for (let more = true; more;) {
      const f = dv.getUint16(p), gi = dv.getUint16(p + 2); p += 4;
      let dx, dy;
      if (f & 1) { dx = dv.getInt16(p); dy = dv.getInt16(p + 2); p += 4; } else { dx = dv.getInt8(p); dy = dv.getInt8(p + 1); p += 2; }
      let a = 1, b = 0, c = 0, d = 1;
      const f2 = (o) => dv.getInt16(o) / 16384;
      if (f & 8) { a = d = f2(p); p += 2; } else if (f & 0x40) { a = f2(p); d = f2(p + 2); p += 4; } else if (f & 0x80) { a = f2(p); b = f2(p + 2); c = f2(p + 4); d = f2(p + 6); p += 8; }
      if (!(f & 2)) { dx = 0; dy = 0; }   // point-matching offsets are not used by these fonts
      for (const ct of contours(gi, depth + 1)) out.push(ct.map((q) => ({ x: a * q.x + c * q.y + dx, y: b * q.x + d * q.y + dy, on: q.on })));
      more = !!(f & 0x20);
    }
    return out;
  }
  // Each contour starts with an absolute M; the rest is relative (l, q), which keeps the numbers short.
  const r = (v) => Math.round(v);
  const join = (ns) => ns.map((v, i) => (i && v >= 0 ? ' ' : '') + v).join('');
  function pathOf(g) {
    let s = '';
    for (const c of contours(g)) {
      if (c.length < 2) continue;
      // start on an on-curve point (or between two off-curve ones)
      let k = c.findIndex((q) => q.on), pts = c;
      if (k < 0) { const m = { x: (c[0].x + c[1].x) / 2, y: (c[0].y + c[1].y) / 2, on: true }; pts = [m, ...c.slice(1), c[0]]; k = 0; }
      else pts = c.slice(k).concat(c.slice(0, k));
      let cx = r(pts[0].x), cy = r(pts[0].y);
      s += `M${join([cx, cy])}`;
      for (let i = 1; i <= pts.length; i++) {
        const q = pts[i % pts.length];
        if (q.on) { const x = r(q.x), y = r(q.y); if (i < pts.length) s += `l${join([x - cx, y - cy])}`; cx = x; cy = y; continue; }
        const nx = pts[(i + 1) % pts.length], end = nx.on ? nx : { x: (q.x + nx.x) / 2, y: (q.y + nx.y) / 2 };
        const qx = r(q.x), qy = r(q.y), ex = r(end.x), ey = r(end.y);
        s += `q${join([qx - cx, qy - cy, ex - cx, ey - cy])}`; cx = ex; cy = ey;
        if (nx.on) i++;
      }
      s += 'z';
    }
    return s;
  }
  const glyphs = {};
  for (const [c, g] of cmap) { const d = pathOf(g); if (d) glyphs[c] = d; }
  return { u: upm, g: glyphs };
}

export function glyphOutlines(dir, names) {
  const out = {};
  for (const n of names) out[n] = parseTTF(fs.readFileSync(`${dir}/${n}.ttf`));
  return out;
}
