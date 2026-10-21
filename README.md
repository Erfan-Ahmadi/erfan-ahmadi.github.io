# Erfan Ahmadi — blog

Source for [erfan-ahmadi.github.io](https://erfan-ahmadi.github.io): math, computer graphics and GPUs. Built with [Astro](https://astro.build) and deployed to GitHub Pages by GitHub Actions.

## Run it locally

You need [Node.js](https://nodejs.org) 22.22 or newer (24 LTS is a good pick).

```sh
npm install        # once
npm run dev        # http://localhost:4321, reloads on save, lists drafts too
```

`npm run dev -- --host` also serves it on your network, so you can check it on your phone.

To see exactly what will go live (drafts reachable only by their link):

```sh
npm run build      # builds into dist/ and checks every internal link
npm run preview    # serves dist/ at http://localhost:4321
```

## Write a post

```sh
npm run new -- "Bindless descriptors in Nabla"
```

This creates `src/content/posts/2026-10-20-bindless-descriptors-in-nabla/index.mdx` as a draft. Everything for the post lives in that folder: the text, its images, videos and demos. The URL is the folder name without the date: `/blog/bindless-descriptors-in-nabla/`.

Front matter:

| Field | |
| --- | --- |
| `title` | Required. |
| `description` | Required. One or two sentences for the card, search and link previews. |
| `date` | Required. Publish date, `YYYY-MM-DD`. Posts are sorted and filtered by it. |
| `updated` | Optional date of a meaningful update. |
| `cover`, `coverAlt` | Optional image in the folder, 16:10 works best (1280×800). Without one, the card gets a generated cover. |
| `thumbnail` | Optional image for the post's card instead of the cover, 16:10 (1280×800), e.g. a designed title card. It isn't shown in the post itself. |
| `socialImage` | Optional image for link previews on X, LinkedIn and others, 1200×630. Defaults to the thumbnail, then the cover. |
| `diagram` | `true` for line-art covers on a light background: they're inverted in dark mode. |
| `tags` | Shown on the cards, e.g. `[Vulkan, Math]`. |
| `series`, `part` | Groups posts, e.g. `series: Yugen Journal` and `part: 2`. Each part links to the others. |
| `youtube` | A video id to embed at the top of the post instead of the cover. |
| `toc` | `false` hides the "On this page" sidebar and centers the post, so figures can run wider than the text on both sides. |
| `draft` | `true`: live at its link with a "Draft" badge so you can share it for proofreading, but not listed or linked anywhere (home page, archive, RSS, sitemap, other posts) and hidden from search engines. `npm run dev` lists drafts so you can see them in place. Delete the line to publish. |
| `unlisted` | `true`: like a draft without the badge: live at its link, never listed. |

In the body:

- Math: `$e^{i\pi} + 1 = 0$` inline and `$$ ... $$` on its own lines. It's rendered at build time with KaTeX.
- Code: fenced blocks with a language (` ```cpp `, ` ```hlsl `, ` ```glsl `) get light and dark highlighting.
- Images: put them in the folder and write `![alt text](./diagram.png)`. They're resized and converted to WebP automatically.
- Videos: put `clip.mp4` in the folder and use `<video src="clip.mp4" autoplay loop muted playsinline></video>`. Prefer short videos to GIFs: they're about 10× smaller.
- YouTube (in `.mdx`): `<YouTube id="0G51uoZpU-U" />`.

## YouTube videos

A video is a post with `youtube: <video id>` in its front matter (the id is the part after `watch?v=`). It's listed in the grid with a YouTube badge, its page plays the video at the top, and when it's the newest post the home page features it as "Latest video" instead of "Latest post".

## Interactive demos and Claude artifacts

Any self-contained HTML page can be embedded in a post, like a demo Claude made for you:

1. Ask Claude for the demo as a single HTML file. The conventions it should follow are in [CLAUDE.md](CLAUDE.md).
2. Copy it into the post's folder: `npm run artifact -- ~/Downloads/demo.html` (it picks the post you edited last, or pass its slug as a second argument).
3. Paste the tag it prints into the post, for example `<Artifact src="demo.html" title="Squash the grid" height={480} caption="Drag the slider." />`.

The demo runs in a sandboxed frame, follows the site's light/dark theme through a `?theme=` parameter, and has an "Open full screen" link.

## Publish

Push a draft to `master` and send people its link (`https://erfan-ahmadi.github.io/blog/<slug>/`) to proofread it. When it's ready, remove `draft: true`, commit, and push to `master`. The [Build and deploy](.github/workflows/deploy.yml) workflow builds the site and publishes it in a minute or two. Pushes to other branches and pull requests are built and link-checked but not deployed.

## Where things are

| Path | |
| --- | --- |
| `src/content/posts/` | One folder per post. |
| `src/site.ts` | Name, tagline, social links, YouTube channel. |
| `src/pages/` | Home page, post pages, archive, RSS feed, sitemap, 404. |
| `src/layouts/`, `src/components/`, `src/styles/` | The design. |
| `src/redirects.mjs` | Old URLs that redirect to new ones. Add one if you ever rename a post. |
| `public/` | Files copied as-is: favicon, share image, robots.txt. |
