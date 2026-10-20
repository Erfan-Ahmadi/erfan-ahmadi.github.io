export const SITE = {
  name: 'Erfan Ahmadi',
  url: 'https://erfan-ahmadi.github.io',
  eyebrow: 'Math, Computer Graphics and GPUs',
  description: 'I share my knowledge about computer graphics and math here, the best way I can.',
  repo: 'https://github.com/Erfan-Ahmadi/erfan-ahmadi.github.io',
  youtube: {
    channel: 'https://www.youtube.com/@ErFunRender',
    handle: '@ErFunRender',
    // The video featured on the home page. Swap the id to feature another one.
    latestVideo: '0G51uoZpU-U',
  },
  socials: [
    { icon: 'github', label: 'Erfan-Ahmadi', title: 'GitHub', href: 'https://github.com/Erfan-Ahmadi' },
    { icon: 'youtube', label: '@ErFunRender', title: 'YouTube', href: 'https://www.youtube.com/@ErFunRender' },
    { icon: 'x', label: '@ahmadierfan999', title: 'X (Twitter)', href: 'https://x.com/ahmadierfan999' },
    { icon: 'linkedin', label: 'LinkedIn', title: 'LinkedIn', href: 'https://www.linkedin.com/in/erfan-ahmadi/' },
    { icon: 'rss', label: 'RSS', title: 'RSS feed', href: '/rss.xml', iconOnly: true },
  ],
} as const;
