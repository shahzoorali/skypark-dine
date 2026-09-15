/**
 * Photography slots.
 *
 * PetPooja may or may not carry an image for an item, and the ones it does
 * carry are whatever was uploaded for delivery listings. Skypark is shooting
 * its own, so a local photograph always wins.
 *
 * Naming: slugify the item name exactly as it appears in PetPooja and save
 * as `public/menu/<slug>.jpg`. `npm run shotlist` prints the full list of
 * slugs the current menu wants, and which ones are still missing.
 */

import type { Menu, MenuItem } from './menu';
import { demoPhoto } from './demo-photos';

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Local photographs present in the build, injected at module load.
 * Populated by `scripts/photo-manifest.mjs` into `public/menu/manifest.json`.
 */
import manifest from '@/public/menu/manifest.json';

const available = new Set<string>(manifest.slugs);

export function itemPhoto(
  item: MenuItem,
  source: Menu['source'],
): string | undefined {
  const slug = slugify(item.name);

  // A real Skypark shot of this dish always wins.
  if (available.has(slug)) return `/menu/${slug}.jpg`;

  // Demo imagery is matched by eye, so it is only ever shown over mock data.
  if (source === 'mock') {
    const demo = demoPhoto(slug);
    if (demo) return demo;
  }

  // PetPooja's own image is the last resort, not the preference.
  return item.imageUrl;
}

export const heroPhoto: string | undefined = manifest.hero
  ? '/menu/hero.jpg'
  : undefined;
