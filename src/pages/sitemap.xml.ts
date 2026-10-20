import type { APIContext } from 'astro';
import { getListedPosts, postUrl } from '../lib/posts';

export async function GET(context: APIContext) {
  const posts = await getListedPosts();
  const url = (path: string) => new URL(path, context.site).href;
  const day = (d: Date) => d.toISOString().slice(0, 10);
  const entries = [
    `<url><loc>${url('/')}</loc>${posts[0] ? `<lastmod>${day(posts[0].data.date)}</lastmod>` : ''}</url>`,
    `<url><loc>${url('/blog/')}</loc></url>`,
    ...posts.map((p) => `<url><loc>${url(postUrl(p))}</loc><lastmod>${day(p.data.updated ?? p.data.date)}</lastmod></url>`),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
