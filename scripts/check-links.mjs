// After `astro build`: fails if any page links to a file or page that isn't in dist/.
// External links are not checked (the network would make CI flaky).
import fs from 'node:fs';
import path from 'node:path';

const DIST = path.resolve('dist');
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)]));
const isFile = (p) => fs.existsSync(p) && fs.statSync(p).isFile();
const exists = (urlPath) => {
  const abs = path.join(DIST, decodeURIComponent(urlPath));
  return isFile(abs) || isFile(path.join(abs, 'index.html')) || isFile(`${abs}.html`);
};

const broken = [];
const pages = walk(DIST).filter((f) => f.endsWith('.html'));
for (const file of pages) {
  const html = fs.readFileSync(file, 'utf8');
  const pageUrl = `/${path.relative(DIST, file).split(path.sep).join('/')}`.replace(/index\.html$/, '');
  const refs = [
    ...[...html.matchAll(/\s(?:href|src)="([^"]*)"/g)].map((m) => m[1]),
    ...[...html.matchAll(/\ssrcset="([^"]*)"/g)].flatMap((m) => m[1].split(',').map((s) => s.trim().split(/\s+/)[0])),
  ];
  for (const ref of new Set(refs)) {
    if (!ref || /^(?:[a-z]+:|\/\/|#)/i.test(ref)) continue;
    const target = new URL(ref.replaceAll('&amp;', '&'), `https://site${pageUrl}`).pathname;
    if (!exists(target)) broken.push(`${pageUrl}  ->  ${ref}`);
  }
}

if (broken.length) {
  console.error(`Broken internal links (${broken.length}):\n  ${broken.join('\n  ')}`);
  process.exit(1);
}
console.log(`Link check: ${pages.length} pages, no broken internal links.`);
