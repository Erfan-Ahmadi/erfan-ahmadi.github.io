// Builds volumetrics-video.html, one self-contained page: src/shell.html with KaTeX's stylesheet (fonts
// inlined as data URIs), KaTeX's script and src/app.js put in place. Run: node notes/volumetrics/build.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { glyphOutlines } from './glyphs.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(here, '../../node_modules/katex/dist');
const pkg = JSON.parse(fs.readFileSync(path.join(dist, '../package.json'), 'utf8'));

// Only the faces the formulas use; the rest (Fraktur, Script, Typewriter, …) would add weight for nothing.
const keep = new Set(['KaTeX_Main-Regular', 'KaTeX_Main-Italic', 'KaTeX_Main-Bold', 'KaTeX_Math-Italic', 'KaTeX_Size1-Regular',
  'KaTeX_Size2-Regular', 'KaTeX_Size3-Regular', 'KaTeX_Size4-Regular', 'KaTeX_Caligraphic-Regular', 'KaTeX_AMS-Regular']);
const css = fs.readFileSync(path.join(dist, 'katex.min.css'), 'utf8').replace(/@font-face\{[^}]*\}/g, (block) => {
  const name = block.match(/fonts\/(KaTeX_[A-Za-z0-9-]+)\.woff2/)[1];
  if (!keep.has(name)) return '';
  const data = fs.readFileSync(path.join(dist, 'fonts', `${name}.woff2`)).toString('base64');
  return block.replace(/src:url\([^)]*\.woff2\) format\("woff2"\)(,url\([^)]*\) format\("[a-z]+"\))*/, `src:url(data:font/woff2;base64,${data}) format("woff2")`);
});
if (/url\(fonts\//.test(css)) throw new Error('a KaTeX font was left pointing at a file');

const js = fs.readFileSync(path.join(dist, 'katex.min.js'), 'utf8');
// The same faces' outlines, for drawing glyphs as paths and reshaping one formula into another.
const outlines = JSON.stringify(glyphOutlines(path.join(dist, 'fonts'), [...keep]));
// The 3D scenes (src/volume.js) go in where app.js marks the end of its scenes, so they register after the 2D ones.
const volume = fs.readFileSync(path.join(here, 'src/volume.js'), 'utf8');
const app = fs.readFileSync(path.join(here, 'src/app.js'), 'utf8').replace('//@@SCENES@@', () => volume + '\n//@@SCENES@@');
if (!app.includes('function g3render')) throw new Error('app.js is missing the //@@SCENES@@ marker');
const shell = fs.readFileSync(path.join(here, 'src/shell.html'), 'utf8');
for (const t of ['<!--KATEX_CSS-->', '<!--KATEX_JS-->', '<!--GLYPHS-->', '<!--APP_JS-->']) if (!shell.includes(t)) throw new Error(`shell.html is missing ${t}`);

// Function replacements, so a `$&` inside the inlined code is never read as a replacement pattern.
const out = shell
  .replace('<!--KATEX_CSS-->', () => `<!-- KaTeX ${pkg.version} stylesheet (MIT), fonts inlined. -->\n<style id="katex-css">\n${css}\n</style>`)
  .replace('<!--KATEX_JS-->', () => `<!-- KaTeX ${pkg.version} (MIT), inlined so the page loads nothing but Google Fonts. -->\n<script>\n${js}\n</script>`)
  .replace('<!--GLYPHS-->', () => `<!-- Glyph outlines of the same KaTeX fonts (OFL), extracted by glyphs.mjs. -->\n<script>\nconst GLYPHS = ${outlines};\n</script>`)
  .replace('<!--APP_JS-->', () => `<script>\n${app}\n</script>`);
fs.writeFileSync(path.join(here, 'volumetrics-video.html'), out);
console.log(`volumetrics-video.html: ${Math.round(out.length / 1024)} KB, KaTeX ${pkg.version}`);
