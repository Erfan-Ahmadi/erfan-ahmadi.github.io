// Files that shouldn't go through Astro's image pipeline (videos, HTML demos such
// as Claude artifacts, models, data) live next to the post's index.md and are
// served at /blog/<slug>/<file>, both by `npm run dev` and in the built site.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.bin': 'application/octet-stream',
  '.wasm': 'application/wasm',
  '.json': 'application/json',
  '.csv': 'text/csv; charset=utf-8',
  '.pdf': 'application/pdf',
  '.zip': 'application/zip',
};

const slugOf = (folder) => folder.replace(/^\d{4}-\d{2}-\d{2}-/, '');

function isDraft(dir) {
  const index = ['index.md', 'index.mdx'].map((f) => path.join(dir, f)).find((f) => fs.existsSync(f));
  if (!index) return true;
  const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(fs.readFileSync(index, 'utf8'));
  return Boolean(frontmatter && /^draft:\s*true\b/m.test(frontmatter[1]));
}

function findAssets(postsDir, { includeDrafts }) {
  if (!fs.existsSync(postsDir)) return [];
  const found = [];
  for (const entry of fs.readdirSync(postsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dir = path.join(postsDir, entry.name);
    if (!includeDrafts && isDraft(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      const ext = path.extname(file).toLowerCase();
      if (TYPES[ext] && file !== 'index.html') found.push({ slug: slugOf(entry.name), file, abs: path.join(dir, file), type: TYPES[ext] });
    }
  }
  return found;
}

function serve(asset, req, res) {
  const { size } = fs.statSync(asset.abs);
  const headers = { 'Content-Type': asset.type, 'Accept-Ranges': 'bytes', 'Access-Control-Allow-Origin': '*' };
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? '');
  if (range && (range[1] || range[2])) {
    const start = range[1] ? Number(range[1]) : size - Number(range[2]);
    const end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    res.writeHead(206, { ...headers, 'Content-Range': `bytes ${start}-${end}/${size}`, 'Content-Length': end - start + 1 });
    fs.createReadStream(asset.abs, { start, end }).pipe(res);
  } else {
    res.writeHead(200, { ...headers, 'Content-Length': size });
    fs.createReadStream(asset.abs).pipe(res);
  }
}

export default function postAssets() {
  let postsDir;
  return {
    name: 'post-assets',
    hooks: {
      'astro:config:setup': ({ config, updateConfig }) => {
        postsDir = fileURLToPath(new URL('src/content/posts/', config.root));
        updateConfig({
          vite: {
            plugins: [{
              name: 'post-assets:dev',
              enforce: 'pre',
              configureServer(server) {
                server.middlewares.use((req, res, next) => {
                  const match = /^\/blog\/([^/]+)\/([^/]+)$/.exec(decodeURIComponent((req.url ?? '').split('?')[0]));
                  if (!match) return next();
                  const asset = findAssets(postsDir, { includeDrafts: true }).find((a) => a.slug === match[1] && a.file === match[2]);
                  if (!asset) return next();
                  serve(asset, req, res);
                });
              },
            }],
          },
        });
      },
      'astro:build:done': ({ dir, logger }) => {
        const outDir = fileURLToPath(dir);
        const assets = findAssets(postsDir, { includeDrafts: false });
        for (const asset of assets) {
          const dest = path.join(outDir, 'blog', asset.slug, asset.file);
          fs.mkdirSync(path.dirname(dest), { recursive: true });
          fs.copyFileSync(asset.abs, dest);
        }
        logger.info(`Copied ${assets.length} post asset(s) (videos, demos) next to their posts.`);
      },
    },
  };
}
