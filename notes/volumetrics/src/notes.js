// ---------- presentation: the notes window (N) ----------
// A second window that follows the presentation, for reading the narration while recording. It shows the narration of
// the current beat's heading in script.md: what to say now large and lit, what was said dimmed, what comes later in
// grey, and the press markers where they fall in it, the next one in orange: press there. Under it, what the press after
// that leads to; over it, the beat, where it is in the video, whether it's paused (Space), and the time (in all, and on
// this beat; T resets it). (The stage shows none of this: it's for recording.)
// It's written from here and updated on every beat, and keys pressed in it go to the presentation, so either window can
// have the focus. Its words come from script.md (SCRIPT_NOTES, put in by build.mjs), so it always reads the current
// script. N again, or closing it, closes it.
const NOTES = { win: null, beat: -1, paused: null, t0: 0, tb: 0, tick: 0 };
const notesOpen = () => !!(NOTES.win && !NOTES.win.closed);
let notesGroups = null;
function notesData() {   // each heading's beats as indices into BEATS, and its narration cut at the press markers
  if (notesGroups) return notesGroups;
  const idx = (n) => BEATS.findIndex((b) => b.n === n);
  notesGroups = SCRIPT_NOTES.map((g) => {
    const cut = g.lines.join('\n\n').split(/\[(\d+[a-z]?)\]/), segs = [{ n: g.start, text: cut[0] }];
    for (let i = 1; i < cut.length; i += 2) segs.push({ n: cut[i], text: cut[i + 1] || '' });
    return { ...g, i0: idx(g.start), i1: idx(g.end), segs: segs.map((s) => ({ ...s, i: idx(s.n) })) };
  });
  return notesGroups;
}
const notesGroupOf = (i) => notesData().find((g) => g.i0 >= 0 && g.i0 <= i && i <= (g.i1 >= 0 ? g.i1 : g.i0));
// script.md's text for reading: HTML-safe, its few bits of LaTeX as plain symbols, paragraphs kept
const notesText = (s) => s.trim().replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))
  .replace(/\$([^$]+)\$/g, (_, m) => m.replace(/\\sigma/g, 'σ').replace(/\\tau/g, 'τ').replace(/\\int/g, '∫').replace(/\\times/g, '×').replace(/\\[,;!]/g, ' ').replace(/\\[a-zA-Z]+/g, '').replace(/[{}]/g, ''))
  .replace(/\n\n/g, '<br><br>');
const notesShort = (s, n) => { const t = s.trim(); return t.length <= n ? t : t.slice(0, n).replace(/\s+\S*$/, '') + ' …'; };   // a preview, cut at a word
const notesTime = (ms) => { const s = Math.max(0, Math.floor(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const NOTES_HTML = `<!doctype html><html><head><meta charset="utf-8"><title>Notes</title><style>
html,body{margin:0;background:#1C1B18;color:#EEEAE2;font:400 26px/1.5 Inter,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
header{position:sticky;top:0;display:flex;align-items:center;justify-content:space-between;gap:24px;padding:14px 32px;background:#1C1B18;border-bottom:1px solid #2E2C27}
#beat b{font-size:42px;color:#F0784F;margin-right:14px;font-variant-numeric:tabular-nums}#beat span{color:#DCD7CC;font-size:22px}
#beat i{display:block;font-style:normal;color:#6F6A60;font-size:15px}
#count{color:#948E82;font-size:20px;font-variant-numeric:tabular-nums}#count b{margin-left:12px;padding:4px 12px;border-radius:999px;background:#F0784F;color:#1C1B18;font-size:17px;font-weight:600}
#clock{text-align:right;font-variant-numeric:tabular-nums}#clock b{font-size:30px;font-weight:500}#clock span{display:block;color:#948E82;font-size:15px}
main{padding:30px 40px 36px;max-width:1150px}
.past{color:#A59F94}.later{color:#CFC9BD}
.now{color:#FFFDF9;font-size:34px;background:rgba(240,120,79,.11);border-radius:6px;padding:2px 5px;-webkit-box-decoration-break:clone;box-decoration-break:clone}
.mark{display:inline-block;font-size:15px;line-height:1;padding:5px 9px;margin:0 6px;border-radius:999px;border:1px solid #47443D;color:#948E82;vertical-align:middle;font-variant-numeric:tabular-nums}
.mark.next{background:#F0784F;border-color:#F0784F;color:#1C1B18;font-weight:600}
.note{color:#A59F94;font-style:italic;font-size:21px;margin:0 0 18px}
footer{margin:0 40px;padding:16px 0 10px;border-top:1px solid #2E2C27;color:#A59F94;font-size:22px;max-width:1150px}footer b{color:#CFC9BD;font-weight:500}
.keys{color:#47443D;font-size:14px;padding:6px 40px 18px}
</style></head><body><header><div id="beat"></div><div id="count"></div><div id="clock"></div></header><main id="words"></main><footer id="next"></footer>
<div class="keys">→ ← step &nbsp;·&nbsp; Space pause &nbsp;·&nbsp; T reset the time &nbsp;·&nbsp; N close</div></body></html>`;
function notesToggle() {
  if (notesOpen()) { NOTES.win.close(); NOTES.win = null; return; }
  const w = window.open('', 'volnotes', 'popup,width=1040,height=700');
  if (!w) { console.warn('The notes window was blocked: allow pop-ups for this page.'); return; }
  NOTES.win = w; NOTES.t0 = performance.now(); NOTES.beat = -1;
  w.document.open(); w.document.write(NOTES_HTML); w.document.close();
  w.document.addEventListener('keydown', (e) => presKey(e));   // its keys drive the presentation
  notesTick(true);
  try { window.focus(); } catch (e) { /* the browser may keep the focus on the new window: its keys work too */ }
}
function notesResetTimer() { NOTES.t0 = NOTES.tb = performance.now(); notesTick(true); }
function notesTick(force = false) {
  if (!NOTES.win) return;
  if (NOTES.win.closed) { NOTES.win = null; return; }
  const now = performance.now();
  if (PRES.beat !== NOTES.beat) { NOTES.beat = PRES.beat; NOTES.tb = now; notesRender(NOTES.win.document); }
  if (PRES.paused !== NOTES.paused) notesCount(NOTES.win.document);
  if (force || now - NOTES.tick > 250) {
    NOTES.tick = now; const c = NOTES.win.document.getElementById('clock');
    if (c) c.innerHTML = `<b>${notesTime(now - NOTES.t0)}</b><span>this beat ${notesTime(now - NOTES.tb)}</span>`;
  }
}
function notesCount(d) {   // where it is in the video, and a mark while it's paused
  const c = d.getElementById('count'); NOTES.paused = PRES.paused;
  if (c) c.innerHTML = `${clamp(PRES.beat, 0, BEATS.length - 1) + 1} / ${BEATS.length}${PRES.paused ? '<b>paused</b>' : ''}`;
}
function notesRender(d) {
  const i = clamp(PRES.beat, 0, BEATS.length - 1), B = BEATS[i], G = notesGroupOf(i), N = BEATS[i + 1], el = (id) => d.getElementById(id);
  if (!el('words')) return;
  el('beat').innerHTML = `<i>${notesText(G ? G.part : '')}</i><b>${B.n}</b><span>${notesText(B.name)}</span>`;
  notesCount(d);
  let html = '';
  if (!G) html = `<p class="note">This beat has no heading in script.md.</p>`;
  else {
    // what to say now: this beat's words; if the script has no marker for it, the words it falls in (the latest before it)
    const marked = G.segs.some((s) => s.n === B.n), now = G.segs.find((s) => s.n === B.n && s.text.trim()) || (marked ? null : [...G.segs].reverse().find((s) => s.i >= 0 && s.i <= i && s.text.trim()));
    if (!marked) html += `<p class="note">The script has no marker for this press: it falls somewhere in the lit words.</p>`;
    else if (!now) html += `<p class="note">No words for this press: press again when it has played.</p>`;
    const nextMark = G.segs.find((s) => s.i > i);
    html += '<p>';
    G.segs.forEach((s, k) => {
      if (k > 0) html += `<span class="mark${s === nextMark ? ' next' : ''}">${s === nextMark ? '▶ ' : ''}${s.n}</span>`;
      if (s.text.trim()) html += `<span class="${s === now ? 'now' : s.i >= 0 && s.i < i ? 'past' : 'later'}"${s === now ? ' id="now"' : ''}>${notesText(s.text)}</span> `;
    });
    if (!nextMark && N) html += `<span class="mark next">▶ ${N.n}</span>`;   // the next press is after the last words here
    html += '</p>';
  }
  el('words').innerHTML = html;
  const NG = N && notesGroupOf(i + 1);
  el('next').innerHTML = !N ? '<b>The end.</b>' : NG && NG !== G
    ? `<b>Then ${N.n} · ${notesText(N.name)}:</b> ${notesText(notesShort((NG.segs.find((s) => s.n === N.n) || NG.segs[0]).text, 240))}`
    : `<b>Next press: ${N.n} · ${notesText(N.name)}</b>`;
  const now = d.getElementById('now'); if (now) now.scrollIntoView({ block: 'center' });
}
// For checking the script against the beats: beats with no words of their own, markers naming no beat, headings whose
// beats aren't in the presentation
function notesProblems() {
  const out = [], seen = new Set();
  for (const g of notesData()) {
    if (g.i0 < 0 || g.i1 < 0) out.push(`heading ${g.start}–${g.end}: not in the presentation`);
    for (const s of g.segs) { if (s.i < 0) out.push(`marker [${s.n}] in ${g.start}: no such beat`); if (s.text.trim()) seen.add(s.n); }
  }
  for (const b of BEATS) if (!seen.has(b.n)) out.push(`beat ${b.n}: no lines of its own`);
  return out;
}
