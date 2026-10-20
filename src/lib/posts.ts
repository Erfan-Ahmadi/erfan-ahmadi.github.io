import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;

/** Every post that gets a page: drafts only exist in `npm run dev`. */
export async function getAllPosts(): Promise<Post[]> {
  const posts = await getCollection('posts', ({ data }) => import.meta.env.DEV || !data.draft);
  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

/** Posts that appear in lists, feeds and the sitemap (newest first). */
export async function getListedPosts(): Promise<Post[]> {
  return (await getAllPosts()).filter((p) => !p.data.unlisted);
}

export const postUrl = (post: Post) => `/blog/${post.id}/`;

export function readingMinutes(post: Post): number {
  const words = (post.body ?? '').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 230));
}

export function formatDate(date: Date, style: 'short' | 'long' = 'short'): string {
  return date.toLocaleDateString('en-US', {
    month: style === 'long' ? 'long' : 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export const yearOf = (post: Post) => post.data.date.getUTCFullYear();

/** The other parts of a post's series, in reading order. */
export function seriesParts(posts: Post[], post: Post): Post[] {
  if (!post.data.series) return [];
  return posts
    .filter((p) => p.data.series === post.data.series)
    .sort((a, b) => (a.data.part ?? 0) - (b.data.part ?? 0) || a.data.date.valueOf() - b.data.date.valueOf());
}
