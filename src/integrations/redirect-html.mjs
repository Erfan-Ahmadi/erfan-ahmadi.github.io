// The old Jekyll site served some posts without a trailing slash
// (e.g. /blog/Nabla/fif was blog/Nabla/fif.html). Astro writes redirects as
// <path>/index.html; this also writes <path>.html so those exact URLs resolve
// directly on GitHub Pages.
//
// The redirect itself would hide where the visit came from (the next page's
// referrer is the redirect page), so each one first leaves the old path and the
// original referrer in sessionStorage for the analytics (src/components/Analytics.astro).
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const REMEMBER = `<script>try{sessionStorage.setItem('redirected-from',JSON.stringify({from:location.pathname,referrer:document.referrer}))}catch{}</script>`;

export default function redirectHtml(redirects) {
  return {
    name: 'redirect-html',
    hooks: {
      'astro:build:done': ({ dir, logger }) => {
        let written = 0;
        for (const from of Object.keys(redirects)) {
          const page = fileURLToPath(new URL(`.${from.replace(/\/$/, '')}/index.html`, dir));
          if (!fs.existsSync(page)) continue;
          const html = fs.readFileSync(page, 'utf8').replace('<meta http-equiv="refresh"', `${REMEMBER}$&`);
          if (!html.includes(REMEMBER)) logger.warn(`${from}: no meta refresh, its referrer isn't kept.`);
          fs.writeFileSync(page, html);
          if (from.endsWith('/')) continue;
          fs.writeFileSync(fileURLToPath(new URL(`.${from}.html`, dir)), html);
          written++;
        }
        logger.info(`Wrote ${written} extensionless redirect file(s).`);
      },
    },
  };
}
