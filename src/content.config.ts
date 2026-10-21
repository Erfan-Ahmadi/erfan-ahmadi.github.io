import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// One folder per post: src/content/posts/YYYY-MM-DD-slug/index.md(x).
// The URL is /blog/<slug>/ — the folder name without its date prefix.
const posts = defineCollection({
  loader: glob({
    pattern: '*/index.{md,mdx}',
    base: './src/content/posts',
    generateId: ({ entry }) => entry.split('/')[0].replace(/^\d{4}-\d{2}-\d{2}-/, ''),
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      // One or two sentences: shown on cards, in search results and link previews.
      description: z.string(),
      date: z.coerce.date(),
      updated: z.coerce.date().optional(),
      cover: image().optional(),
      coverAlt: z.string().default(''),
      // Card image in place of the cover (16:10), e.g. a designed title card. Not shown in the post.
      thumbnail: image().optional(),
      // Link preview image (1200×630). Defaults to the thumbnail, then the cover.
      socialImage: image().optional(),
      // Line-art covers (diagrams on a light background) are inverted in dark mode.
      diagram: z.boolean().default(false),
      tags: z.array(z.string()).default([]),
      series: z.string().optional(),
      part: z.number().int().positive().optional(),
      // YouTube video id: embedded at the top of the post.
      youtube: z.string().optional(),
      // Show "On this page" beside the post (when it has 3+ headings). Turn off for posts with wide figures.
      toc: z.boolean().default(true),
      // Only visible in `npm run dev`; never built into the live site.
      draft: z.boolean().default(false),
      // Built and reachable by its link, but not listed anywhere.
      unlisted: z.boolean().default(false),
    }),
});

export const collections = { posts };
