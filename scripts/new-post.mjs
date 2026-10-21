// Creates a new draft post: src/content/posts/YYYY-MM-DD-slug/index.mdx
// Usage: npm run new -- "My post title" [--md]
import fs from 'node:fs';
import path from 'node:path';

const POSTS = 'src/content/posts';
const args = process.argv.slice(2);
const markdownOnly = args.includes('--md');
const title = args.filter((a) => !a.startsWith('--')).join(' ').trim();

if (!title) {
  console.error('Usage: npm run new -- "My post title" [--md]');
  process.exit(1);
}

const slug = title
  .toLowerCase()
  .normalize('NFKD')
  .replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');
const now = new Date();
const pad = (n) => String(n).padStart(2, '0');
const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

const taken = fs.readdirSync(POSTS).map((f) => f.replace(/^\d{4}-\d{2}-\d{2}-/, ''));
if (!slug || taken.includes(slug)) {
  console.error(`A post with the URL /blog/${slug}/ already exists. Pick a different title.`);
  process.exit(1);
}

const dir = path.join(POSTS, `${date}-${slug}`);
const file = path.join(dir, markdownOnly ? 'index.md' : 'index.mdx');
const comment = (text) => (markdownOnly ? `<!-- ${text} -->` : `{/* ${text} */}`);

fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(file, `---
title: ${JSON.stringify(title)}
description: "One or two sentences. Shown on the card, in search and in link previews."
date: ${date}
# cover: ./cover.jpg        # 16:10 works best. Leave out for a generated cover.
# coverAlt: ""
# diagram: true             # Line-art cover on a light background: inverted in dark mode.
tags: []
draft: true                 # Live at its link for proofreading, but not listed anywhere. Delete this line to publish.
---

Start writing here. Markdown, $\\LaTeX$ math and fenced code blocks all work.

${comment('Images: put them in this folder and use ![alt text](./image.png)')}
${markdownOnly ? comment('Need an <Artifact> demo? Rename this file to index.mdx.') : comment('Demos: npm run artifact -- ~/Downloads/demo.html, then paste the tag it prints')}
`);

console.log(`Created ${file}`);
console.log(`Run \`npm run dev\` and open http://localhost:4321/blog/${slug}/`);
