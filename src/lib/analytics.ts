// Custom events for Umami (loaded by src/components/Analytics.astro). Clicks don't need this: mark the
// element with data-track="event-name" (and data-track-<property>="value"). Use it for anything else.

type EventData = Record<string, string | number>;

declare global {
  interface Window {
    umami?: { track(name: string, data?: EventData): Promise<void> };
  }
}

/** Sends an event. A no-op in `npm run dev` and when the tracker is blocked; waits for it during page load. */
export function track(name: string, data?: EventData) {
  if (import.meta.env.DEV) console.debug('[analytics]', name, data ?? {});
  if (window.umami) window.umami.track(name, data);
  else if (document.readyState !== 'complete') addEventListener('load', () => window.umami?.track(name, data), { once: true });
}
