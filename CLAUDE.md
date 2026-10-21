# Blog conventions

Erfan Ahmadi's blog about math, computer graphics and GPUs. Astro 7 static site, deployed to GitHub Pages from `master` by `.github/workflows/deploy.yml`.

## Commands

- `npm run dev`: local server on http://localhost:4321 (lists drafts; in the built site drafts are live at their link but never listed or linked).
- `npm run build`: production build into `dist/`, then `scripts/check-links.mjs` fails on broken internal links. Run it before committing.
- `npm run new -- "Title"`: new draft post folder.
- `npm run artifact -- <file.html> [slug]`: copy an HTML demo into a post folder and print its `<Artifact>` tag.

## Posts

- One folder per post: `src/content/posts/YYYY-MM-DD-slug/index.md` or `index.mdx`. The URL is `/blog/<slug>/` (the folder name without the date).
- The schema is in `src/content.config.ts`; `title`, `description` and `date` are required.
- Images go in the post folder and are referenced with relative Markdown images (`![alt](./x.png)`) so Astro optimizes them. Videos, HTML demos and other files in the folder are served as-is at `/blog/<slug>/<file>` (`src/integrations/post-assets.mjs`).
- Never change the slug or date of a published post. If a slug must change, add the old URL to `src/redirects.mjs`; every URL in that file has to keep working.
- Math is LaTeX: `$...$` inline and `$$...$$` display (remark-math + KaTeX).
- `.mdx` posts can use `<Artifact />` and `<YouTube />` without importing them. Plain `.md` posts can't use components.
- Keep the author's wording when editing old posts; fix only formatting or clearly broken links unless asked.

## Artifacts (interactive demos embedded in posts)

When asked to make a demo for a post, produce one self-contained `.html` file that:

- Inlines its CSS and JS. External libraries only from `cdnjs.cloudflare.com`, `cdn.jsdelivr.net` or `unpkg.com`, pinned to exact versions.
- Reads the theme from `new URLSearchParams(location.search).get('theme')` (`light` or `dark`), falling back to `prefers-color-scheme`, and uses the site palette:
  - light: background `#FFFDF9`, text `#1B1A17`, muted `#6F6A60`, lines `#E2DDD2`, accent `#C4471F`
  - dark: background `#1C1B18`, text `#EEEAE2`, muted `#948E82`, lines `#2E2C27`, accent `#F0784F`
- Works inside a sandboxed iframe (`allow-scripts` only): no `localStorage`, `sessionStorage`, cookies or calls to other origins.
- Fits the embed: works from 320px to 720px wide at the chosen height (default 480px), without page scrollbars.
- Respects `prefers-reduced-motion` and pauses animation when the tab is hidden.
- Has a short `<title>`, which becomes the embed's label.

Embed it with `<Artifact src="demo.html" title="…" height={480} caption="…" />` in an `.mdx` post.
