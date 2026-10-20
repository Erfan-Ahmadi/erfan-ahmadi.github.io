// The old Jekyll site served some posts without a trailing slash
// (e.g. /blog/Nabla/fif was blog/Nabla/fif.html). Astro writes redirects as
// <path>/index.html; this also writes <path>.html so those exact URLs resolve
// directly on GitHub Pages.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

export default function redirectHtml(redirects) {
  return {
    name: 'redirect-html',
    hooks: {
      'astro:build:done': ({ dir, logger }) => {
        let written = 0;
        for (const from of Object.keys(redirects)) {
          if (from.endsWith('/')) continue;
          const page = fileURLToPath(new URL(`.${from}/index.html`, dir));
          if (!fs.existsSync(page)) continue;
          fs.copyFileSync(page, fileURLToPath(new URL(`.${from}.html`, dir)));
          written++;
        }
        logger.info(`Wrote ${written} extensionless redirect file(s).`);
      },
    },
  };
}
