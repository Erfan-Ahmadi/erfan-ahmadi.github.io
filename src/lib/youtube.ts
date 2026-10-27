import type { ImageMetadata } from 'astro';

// Video thumbnails live in src/assets/youtube/<video id>.(jpg|png|webp), so readers' browsers never load
// them from YouTube. Put your own there, or scripts/youtube-thumbnails.mjs downloads YouTube's.
const thumbnails = import.meta.glob<ImageMetadata>('../assets/youtube/*.{jpg,jpeg,png,webp}', { eager: true, import: 'default' });
const byId = new Map(Object.entries(thumbnails).map(([file, image]) => [file.replace(/^.*\/|\.\w+$/g, ''), image]));

/** The thumbnail of a YouTube video, if there is one in src/assets/youtube/. */
export const youtubeThumbnail = (id: string): ImageMetadata | undefined => byId.get(id);
