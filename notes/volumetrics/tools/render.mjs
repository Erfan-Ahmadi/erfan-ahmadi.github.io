#!/usr/bin/env node
// Renders the presentation to a video file, frame by frame, from a timeline of when each beat is pressed.
// Every frame is exactly 1/fps long however slow the machine is, so nothing lags and nothing is captured live.
//
//   node render.mjs --timeline timeline.json --out video.mp4 [--from 0] [--to 120] [--audio voice.wav]
//
// Options:
//   --timeline <file>  the press times: { "fps": 60, "beats": [{ "n": "1", "t": 0 }, { "n": "2", "t": 3.4 }, …] } (align.mjs writes it)
//   --out <file>       the video to write (.mp4, H.264)
//   --html <file>      the page; default ../volumetrics-video.html
//   --from, --to <s>   only this stretch, in seconds (the frames before it are still stepped, so it starts in the right state)
//   --tail <s>         how long to go on after the last press when --to isn't given; default 8
//   --fps <n>          default: the timeline's, else 60
//   --scale <1|2>      1: 1920 × 1080 (default); 2: 3840 × 2160
//   --audio <file>     also put this sound on the video (for checking the sync; from --from on)
//   --headless         no window (a window is the default: it is what uses the graphics card on most machines)
//   --chrome           use the installed Google Chrome instead of Playwright's Chromium
//   --jpeg             pass frames as JPEG (faster, a little softer); default PNG
//   --crf <n>          H.264 quality, lower is better; default 14
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2), opt = {};
for (let i = 0; i < args.length; i++) {
  const a = args[i]; if (!a.startsWith('--')) throw new Error('unexpected argument: ' + a);
  const k = a.slice(2); opt[k] = ['headless', 'chrome', 'jpeg'].includes(k) ? true : args[++i];
}
if (!opt.timeline || !opt.out) { console.error('usage: node render.mjs --timeline timeline.json --out video.mp4 [--from s] [--to s] [--audio file]'); process.exit(2); }
const tl = JSON.parse(fs.readFileSync(opt.timeline, 'utf8'));
const fps = +(opt.fps || tl.fps || 60), scale = +(opt.scale || 1), from = +(opt.from || 0);
const lastPress = Math.max(...tl.beats.map((b) => +b.t)), to = opt.to != null ? +opt.to : lastPress + +(opt.tail || 8);
if (!(to > from)) throw new Error(`nothing to render: --from ${from} is not before the end, ${to}`);
const html = path.resolve(opt.html || path.join(here, '..', 'volumetrics-video.html'));
if (!fs.existsSync(html)) throw new Error('page not found: ' + html);

const browser = await chromium.launch({
  headless: !!opt.headless, channel: opt.chrome ? 'chrome' : undefined,
  args: ['--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--disable-features=CalculateNativeWinOcclusion'],
});
// the page draws at twice its CSS size, so a 960 × 540 window gives a 1920 × 1080 picture
const page = await browser.newPage({ viewport: { width: 960 * scale, height: 540 * scale }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.error('page error:', e.message));
await page.goto(pathToFileURL(html).href + '#present');
await page.waitForFunction(() => typeof PRES !== 'undefined' && PRES.on && typeof renderInit === 'function', null, { timeout: 120000 });
await page.evaluate(() => document.fonts.ready);
const info = await page.evaluate((t) => renderInit(t), { fps, beats: tl.beats });
const W = 1920 * scale, H = 1080 * scale;
if (info.width !== W || info.height !== H) throw new Error(`the page draws ${info.width} × ${info.height}, expected ${W} × ${H}`);
const gpu = await page.evaluate(() => { try { const g = document.createElement('canvas').getContext('webgl2'), x = g.getExtension('WEBGL_debug_renderer_info'); return x ? g.getParameter(x.UNMASKED_RENDERER_WEBGL) : 'unknown'; } catch (e) { return 'none'; } });
const f0 = Math.round(from * fps), f1 = Math.round(to * fps);
console.log(`${info.beats} beats, last press at ${info.last.toFixed(2)} s; rendering ${from.toFixed(2)}–${to.toFixed(2)} s (${f1 - f0} frames at ${fps} fps, ${W} × ${H})\ngraphics: ${gpu}`);

const ff = ['-y', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', opt.jpeg ? 'mjpeg' : 'png', '-i', '-'];
if (opt.audio) ff.push('-ss', String(from), '-i', path.resolve(opt.audio));
ff.push('-map', '0:v', '-c:v', 'libx264', '-preset', 'medium', '-crf', String(opt.crf || 14), '-pix_fmt', 'yuv420p',
  '-vf', 'scale=out_color_matrix=bt709:out_range=tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-movflags', '+faststart');
if (opt.audio) ff.push('-map', '1:a', '-c:a', 'aac', '-b:a', '256k', '-shortest');
ff.push(path.resolve(opt.out));
const enc = spawn('ffmpeg', ff, { stdio: ['pipe', 'ignore', 'pipe'] });
let encErr = ''; enc.stderr.on('data', (d) => { encErr = (encErr + d).slice(-4000); });
enc.on('error', (e) => { console.error('could not start ffmpeg (is it installed and on the PATH?):', e.message); process.exit(1); });
const done = once(enc, 'close');

const t0 = Date.now(), type = opt.jpeg ? 'image/jpeg' : 'image/png', q = opt.jpeg ? 0.97 : undefined;
let shown = 0, beat = '';
for (let f = 0; f < f1; f++) {
  const grab = f >= f0;
  const r = await page.evaluate(([g, ty, qu]) => renderFrame(g, ty, qu).then((u) => [u, BEATS[PRES.beat].n]), [grab, type, q]);
  if (grab) {
    const buf = Buffer.from(r[0].slice(r[0].indexOf(',') + 1), 'base64');
    if (!enc.stdin.write(buf)) await once(enc.stdin, 'drain');
  }
  if (Date.now() - shown > 2000 || r[1] !== beat || f === f1 - 1) {
    shown = Date.now(); beat = r[1];
    const n = f + 1, el = (Date.now() - t0) / 1000, eta = (el / n) * (f1 - n);
    process.stdout.write(`\r${(n / fps).toFixed(1).padStart(7)} s  beat ${String(beat).padEnd(4)}  ${(n / el).toFixed(1).padStart(5)} frames/s  about ${Math.ceil(eta / 60)} min left   `);
  }
}
enc.stdin.end();
const [code] = await done;
await browser.close();
if (code !== 0) { console.error('\nffmpeg failed:\n' + encErr); process.exit(1); }
console.log(`\nwrote ${opt.out} in ${((Date.now() - t0) / 60000).toFixed(1)} min`);
