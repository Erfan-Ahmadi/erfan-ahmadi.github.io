export const SITE = {
  name: 'Erfan Ahmadi',
  url: 'https://erfan-ahmadi.github.io',
  eyebrow: 'Math, Computer Graphics and GPUs',
  description: 'I share my knowledge about computer graphics and math here, the best way I can.',
  repo: 'https://github.com/Erfan-Ahmadi/erfan-ahmadi.github.io',
  youtube: {
    channel: 'https://www.youtube.com/@ErFunRender',
    handle: '@ErFunRender',
  },
  // UTM tags tell DevSH's analytics the visit came from this blog (the YouTube channel uses utm_source=youtube).
  work: {
    label: 'Consulting & Training',
    href: 'https://www.devsh.eu/when-to-call-devsh?utm_source=blog&utm_medium=homepage&utm_campaign=erfan',
  },
  // Visitor analytics (src/components/Analytics.astro). The id is from Umami's website settings; '' turns it off.
  umami: {
    src: 'https://cloud.umami.is/script.js',
    websiteId: 'fe560ca8-d728-4d8e-8ba7-f23502c7ea8b',
  },
  socials: [
    { icon: 'github', label: 'Erfan-Ahmadi', title: 'GitHub', href: 'https://github.com/Erfan-Ahmadi' },
    { icon: 'youtube', label: '@ErFunRender', title: 'YouTube', href: 'https://www.youtube.com/@ErFunRender' },
    { icon: 'x', label: '@ahmadierfan999', title: 'X (Twitter)', href: 'https://x.com/ahmadierfan999' },
    { icon: 'linkedin', label: 'LinkedIn', title: 'LinkedIn', href: 'https://www.linkedin.com/in/erfan-ahmadi/' },
    { icon: 'rss', label: 'RSS', title: 'RSS feed', href: '/rss.xml', iconOnly: true },
  ],
} as const;
