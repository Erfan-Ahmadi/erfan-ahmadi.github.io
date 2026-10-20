// Copies a self-contained HTML demo (for example a Claude artifact) into a
// post's folder and prints the <Artifact> tag to paste into the post.
// Usage: npm run artifact -- <file.html> [post-slug] [--name demo.html]
import fs from 'node:fs';
import path from 'node:path';

const POSTS = 'src/content/posts';
const args = process.argv.slice(2);
const nameFlag = args.indexOf('--name');
const name = nameFlag >= 0 ? args.splice(nameFlag, 2)[1] : undefined;
const [source, slugArg] = args;

if (!source || !fs.existsSync(source) || !/\.html?$/i.test(source)) {
  console.error('Usage: npm run artifact -- <file.html> [post-slug] [--name demo.html]');
  process.exit(1);
}

const folders = fs
  .readdirSync(POSTS, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => ({ folder: d.name, slug: d.name.replace(/^\d{4}-\d{2}-\d{2}-/, ''), mtime: fs.statSync(path.join(POSTS, d.name)).mtimeMs }));

// Default to the post you touched last.
const post = slugArg ? folders.find((f) => f.slug === slugArg) : folders.sort((a, b) => b.mtime - a.mtime)[0];
if (!post) {
  console.error(`No post with slug "${slugArg}". Available: ${folders.map((f) => f.slug).join(', ')}`);
  process.exit(1);
}

const file = (name ?? path.basename(source))
  .toLowerCase()
  .replace(/\.htm$/, '.html')
  .replace(/[^a-z0-9.]+/g, '-');
if (file === 'index.html') {
  console.error('Pick another name with --name: index.html is the post itself.');
  process.exit(1);
}

const dir = path.join(POSTS, post.folder);
fs.copyFileSync(source, path.join(dir, file));

const html = fs.readFileSync(source, 'utf8');
const title = /<title>([^<]*)<\/title>/i.exec(html)?.[1]?.trim() || 'Interactive demo';
const isMdx = fs.existsSync(path.join(dir, 'index.mdx'));

console.log(`Copied to ${path.join(dir, file)} (served at /blog/${post.slug}/${file})\n`);
console.log('Paste this where the demo should appear:\n');
console.log(`  <Artifact src="${file}" title=${JSON.stringify(title)} height={480} caption="" />\n`);
if (!isMdx) console.log('Note: this post is index.md. Rename it to index.mdx so it can use <Artifact>.');
if (/localStorage|sessionStorage|indexedDB/.test(html)) {
  console.log('Warning: the demo uses browser storage, which is blocked inside the sandboxed embed. Ask Claude to keep state in memory instead.');
}
