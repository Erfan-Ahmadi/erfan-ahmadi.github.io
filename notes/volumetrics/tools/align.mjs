#!/usr/bin/env node
// Works out when each beat is pressed, from a recording of the narration: the words of script.md (with its press
// markers, like [42b]) are matched against a transcript that has a time for every word, and each marker gets the time
// of the word it stands before. The result is a timeline to tune by hand and to give to render.mjs.
//
//   node align.mjs --transcript words.json --out timeline.json [--lead 0.1] [--offset 0]
//
// Options:
//   --transcript <file>  words with times: Whisper's JSON (segments[].words[]), { "words": [{ "word", "start", "end" }] },
//                        a plain list of those, or an .srt / .vtt (times per line only: rougher)
//   --out <file>         the timeline to write
//   --html <file>        the page (its beats and its copy of script.md are read from it); default ../volumetrics-video.html
//   --lead <s>           press this long before the word; default 0.1
//   --offset <s>         added to every time (if the video will start before or after the sound)
// The transcript may cover only the start of the video (a test of the first minutes): beats past its end are left out.
// Beats it could not place by a word are placed by their neighbours and marked "check": true.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2), opt = {};
for (let i = 0; i < args.length; i++) { const a = args[i]; if (!a.startsWith('--')) throw new Error('unexpected argument: ' + a); opt[a.slice(2)] = args[++i]; }
if (!opt.transcript || !opt.out) { console.error('usage: node align.mjs --transcript words.json --out timeline.json [--lead 0.1] [--offset 0]'); process.exit(2); }
const lead = +(opt.lead ?? 0.1), offset = +(opt.offset ?? 0);

// ---- words, the same way on both sides ----
const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
function intWords(n) {
  if (n < 20) return [ONES[n]];
  if (n < 100) return n % 10 ? [TENS[Math.floor(n / 10)], ONES[n % 10]] : [TENS[n / 10]];
  if (n < 1000) return [ONES[Math.floor(n / 100)], 'hundred', ...(n % 100 ? intWords(n % 100) : [])];
  return String(n).split('').map((d) => ONES[+d]);
}
function numWords(s) {   // "0.4" → zero point four; "90" → ninety
  const [a, b] = s.split('.');
  return [...intWords(parseInt(a || '0', 10)), ...(b ? ['point', ...b.split('').map((d) => ONES[+d])] : [])];
}
function norm(text) {
  let s = text.replace(/\$([^$]*)\$/g, (_, m) => ' ' + m.replace(/\\sigma/g, ' sigma ').replace(/\\tau/g, ' tau ').replace(/\\int/g, ' integral ').replace(/\\times/g, ' times ').replace(/\\[a-zA-Z]+/g, ' ').replace(/[{}^_]/g, ' ') + ' ');
  s = s.toLowerCase().replace(/σ/g, ' sigma ').replace(/τ/g, ' tau ').replace(/%/g, ' percent ').replace(/[’‘]/g, "'").replace(/(\d),(\d{3})/g, '$1$2');
  const out = [];
  for (const raw of s.split(/[^a-z0-9.']+/)) {
    const w = raw.replace(/^[.']+|[.']+$/g, ''); if (!w) continue;
    if (/^\d+(\.\d+)?$/.test(w)) out.push(...numWords(w));
    else for (const p of w.split('.')) { const q = p.replace(/'/g, ''); if (q) out.push(q); }
  }
  return out;
}
const close = (a, b) => a === b ? 2 : (a.length >= 4 && b.length >= 4 && (a.startsWith(b) || b.startsWith(a) || a.slice(0, -1) === b.slice(0, -1))) ? 1 : 0;

// ---- the transcript ----
function readTranscript(file) {
  const raw = fs.readFileSync(file, 'utf8');
  if (/\.(srt|vtt)$/i.test(file)) {
    const ts = (x) => { const m = x.trim().replace(',', '.').split(':').map(Number); return m.length === 3 ? m[0] * 3600 + m[1] * 60 + m[2] : m[0] * 60 + m[1]; };
    const words = [];
    for (const block of raw.replace(/\r/g, '').split(/\n\n+/)) {
      const lines = block.split('\n'), k = lines.findIndex((l) => l.includes('-->')); if (k < 0) continue;
      const [a, b] = lines[k].split('-->').map((x) => ts(x.trim().split(' ')[0])), ws = lines.slice(k + 1).join(' ').replace(/<[^>]+>/g, '').split(/\s+/).filter(Boolean);
      ws.forEach((w, i) => words.push({ word: w, start: a + ((b - a) * i) / ws.length, end: a + ((b - a) * (i + 1)) / ws.length }));
    }
    return words;
  }
  const j = JSON.parse(raw), list = Array.isArray(j) ? j : j.words || (j.segments || []).flatMap((s) => s.words || []);
  if (!list.length) throw new Error('no words with times in ' + file + ' (Whisper needs word timestamps turned on)');
  return list.map((w) => ({ word: String(w.word ?? w.text ?? ''), start: +w.start, end: +(w.end ?? w.start) }));
}
const spoken = [];   // one entry per normalised word: its time, and the word as it was said
for (const w of readTranscript(opt.transcript)) for (const t of norm(w.word)) spoken.push({ t, start: w.start, end: w.end, word: w.word.trim() });
const heardUntil = spoken.length ? spoken[spoken.length - 1].end : 0;

// ---- the script and the beats, from the page ----
const html = path.resolve(opt.html || path.join(here, '..', 'volumetrics-video.html'));
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(pathToFileURL(html).href);
await page.waitForFunction(() => typeof BEATS !== 'undefined' && typeof SCRIPT_NOTES !== 'undefined', null, { timeout: 120000 });
const { beats, groups } = await page.evaluate(() => ({ beats: BEATS.map((b) => ({ n: b.n, name: b.name })), groups: SCRIPT_NOTES }));
await browser.close();

const script = [], segs = [];   // script: the script's words in order; segs: each press and the words said from it on
for (const g of groups) {
  const cut = g.lines.join(' \n ').split(/\[(\d+[a-z]?)\]/);
  for (let i = 0; i < cut.length; i += 2) {
    const n = i ? cut[i - 1] : g.start, text = cut[i].replace(/\[[^\]]*\]/g, ' '), ws = norm(text);
    segs.push({ n, w0: script.length, count: ws.length, text: text.replace(/\s+/g, ' ').trim() });
    script.push(...ws);
  }
}

// ---- match the two word lists (the script may run on past the end of the transcript, and the other way round) ----
const N = script.length, M = spoken.length, GAP = -1, MIS = -1;
const dir = new Uint8Array((N + 1) * (M + 1));   // 1: both step (a match or a swap), 2: a script word nobody said, 3: a said word not in the script
let prev = new Int32Array(M + 1), cur = new Int32Array(M + 1);
for (let j = 1; j <= M; j++) { prev[j] = j * GAP; dir[j] = 3; }
let best = { s: -Infinity, i: 0, j: 0 };
for (let i = 1; i <= N; i++) {
  cur[0] = i * GAP; dir[i * (M + 1)] = 2;
  const a = script[i - 1], row = i * (M + 1);
  for (let j = 1; j <= M; j++) {
    const c = close(a, spoken[j - 1].t), d = prev[j - 1] + (c || MIS), u = prev[j] + GAP, l = cur[j - 1] + GAP;
    if (d >= u && d >= l) { cur[j] = d; dir[row + j] = 1; } else if (u >= l) { cur[j] = u; dir[row + j] = 2; } else { cur[j] = l; dir[row + j] = 3; }
  }
  if (cur[M] > best.s) best = { s: cur[M], i, j: M };
  [prev, cur] = [cur, prev];
}
for (let j = 0; j <= M; j++) if (prev[j] > best.s) best = { s: prev[j], i: N, j };
const at = new Int32Array(N).fill(-1);   // for each script word, the said word it matched
for (let i = best.i, j = best.j; i > 0 && j > 0;) {
  const d = dir[i * (M + 1) + j];
  if (d === 1) { if (close(script[i - 1], spoken[j - 1].t)) at[i - 1] = j - 1; i--; j--; } else if (d === 2) i--; else j--;
}
const reach = best.i;   // the script's words from here on were not said in this transcript

// ---- a time for each press ----
const timed = new Map();
for (const s of segs) {
  if (s.w0 >= reach && !(s.count === 0 && s.w0 === reach)) continue;
  let hit = -1;
  for (let k = s.w0; k < Math.min(s.w0 + s.count, s.w0 + 6, reach); k++) if (at[k] >= 0) { hit = k; break; }
  let before = -1;
  for (let k = s.w0 - 1; k >= 0 && k >= s.w0 - 12; k--) if (at[k] >= 0) { before = k; break; }
  if (hit === s.w0) timed.set(s.n, { t: spoken[at[hit]].start - lead, said: s.text, check: false });
  else if (hit > s.w0 && before >= 0) {   // its first words weren't found: between the last word before it and the first found after
    const a = spoken[at[before]].end, b = spoken[at[hit]].start;
    timed.set(s.n, { t: Math.max(a, b - 0.4 * (hit - s.w0)) - lead, said: s.text, check: true });
  } else if (hit > s.w0) timed.set(s.n, { t: spoken[at[hit]].start - 0.4 * (hit - s.w0) - lead, said: s.text, check: true });
  else if (before >= 0) timed.set(s.n, { t: spoken[at[before]].end + 0.15, said: s.text, check: s.count > 0 });   // no words of its own: after the words before it
}
// the beats, in the presentation's order: the ones with no marker in the script go between their neighbours
const out = [];
let lastTimed = -1;
beats.forEach((b, i) => { if (timed.has(b.n)) lastTimed = i; });
for (let i = 0; i <= lastTimed; i++) {
  const b = beats[i], t = timed.get(b.n);
  out.push({ n: b.n, t: t ? t.t + offset : null, name: b.name, said: t ? t.said.slice(0, 70) : '', check: t ? t.check : true });
}
if (out.length) { out[0].t = 0; out[0].check = false; }
for (let i = 0; i < out.length; i++) {
  if (out[i].t != null) continue;
  let a = i - 1, b = i; while (b < out.length && out[b].t == null) b++;
  const ta = out[a].t, tb = b < out.length ? out[b].t : ta + (b - a) * 2;
  for (let k = i; k < b; k++) out[k].t = ta + ((tb - ta) * (k - a)) / (b - a);
  i = b - 1;
}
for (let i = 1; i < out.length; i++) out[i].t = Math.max(out[i].t, out[i - 1].t + 0.05);
for (const b of out) b.t = Math.round(b.t * 100) / 100;

const body = out.map((b) => '    ' + JSON.stringify(b)).join(',\n');
fs.writeFileSync(opt.out, `{\n  "fps": 60,\n  "transcript": ${JSON.stringify(path.basename(opt.transcript))},\n  "beats": [\n${body}\n  ]\n}\n`);
const matched = at.slice(0, reach).filter((x) => x >= 0).length, checks = out.filter((b) => b.check);
console.log(`transcript: ${M} words, to ${heardUntil.toFixed(1)} s; ${matched} of the script's first ${reach} words found in it (${reach ? Math.round((100 * matched) / reach) : 0}%)`);
console.log(`${out.length} of ${beats.length} beats placed, the last at ${out.length ? out[out.length - 1].t.toFixed(2) : 0} s (${out.length ? out[out.length - 1].n : '-'})`);
console.log(checks.length ? `${checks.length} placed by guess, marked "check": ${checks.map((b) => b.n).join(' ')}` : 'none placed by guess');
console.log('wrote ' + opt.out);
