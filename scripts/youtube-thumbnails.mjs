// Runs before `npm run dev` and `npm run build`: every YouTube video the posts use (`youtube:` in the
// front matter, <YouTube id="…" /> in the text) needs a thumbnail in src/assets/youtube/<id>.(jpg|png|webp),
// so the site serves its own copy and readers' browsers never ask YouTube for it. Put your own there, or
// this downloads YouTube's largest (1280×720, then 640×480); commit the new files. Never fails: a video
// without a thumbnail shows a plain dark poster.
import fs from 'node:fs';
import path from 'node:path';

const POSTS = path.resolve('src/content/posts');
const OUT = path.resolve('src/assets/youtube');
const SIZES = ['maxresdefault', 'sddefault', 'hqdefault'];

const ids = new Set();
for (const folder of fs.readdirSync(POSTS)) {
  for (const file of ['index.md', 'index.mdx']) {
    const post = path.join(POSTS, folder, file);
    if (!fs.existsSync(post)) continue;
    const text = fs.readFileSync(post, 'utf8');
    for (const m of text.matchAll(/^youtube:\s*['"]?([\w-]{11})/gm)) ids.add(m[1]);
    for (const m of text.matchAll(/<YouTube\b[^>]*\bid=["']([\w-]{11})["']/g)) ids.add(m[1]);
  }
}

fs.mkdirSync(OUT, { recursive: true });
for (const id of ids) {
  if (fs.readdirSync(OUT).some((file) => file.startsWith(`${id}.`))) continue;
  const dest = path.join(OUT, `${id}.jpg`);
  let saved = false;
  for (const size of SIZES) {
    try {
      const res = await fetch(`https://i.ytimg.com/vi/${id}/${size}.jpg`);
      if (!res.ok) continue;
      fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
      console.log(`youtube-thumbnails: saved ${path.relative(process.cwd(), dest)} (${size})`);
      saved = true;
      break;
    } catch (error) {
      console.warn(`youtube-thumbnails: ${id}: ${error.cause?.code ?? error.message}`);
      break;
    }
  }
  if (!saved) console.warn(`youtube-thumbnails: no thumbnail for ${id}; it gets a plain poster.`);
}
