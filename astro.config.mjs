import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { unified } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { redirects } from './src/redirects.mjs';
import postAssets from './src/integrations/post-assets.mjs';
import redirectHtml from './src/integrations/redirect-html.mjs';

export default defineConfig({
  site: 'https://erfan-ahmadi.github.io',
  trailingSlash: 'always',
  build: { format: 'directory' },
  redirects,
  devToolbar: { enabled: false },
  integrations: [mdx(), postAssets(), redirectHtml(redirects)],
  markdown: {
    // `$inline$` and `$$display$$` LaTeX, rendered to static HTML at build time.
    processor: unified({
      remarkPlugins: [remarkMath],
      rehypePlugins: [rehypeKatex],
    }),
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      defaultColor: false,
    },
  },
});
