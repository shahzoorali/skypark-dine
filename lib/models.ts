/**
 * 3D models for the "View on your table" AR button. Same naming rule as
 * photos: public/models/<slug>.glb, added with `npm run model`.
 */

import type { MenuItem } from './menu';
import { slugify } from './photos';
import manifest from '@/public/models/manifest.json';

const available = new Set<string>(manifest.slugs);

const SAMPLE_MODEL = '/models/_sample-avocado.glb';

/**
 * `demo` (the `?ar=demo` URL flag) puts a public-domain sample model on every
 * dish without one, for testing AR on a phone. It must never be on by default:
 * guests would be shown an object that is not the dish they are ordering.
 */
export function itemModel(item: MenuItem, demo: boolean): string | undefined {
  const slug = slugify(item.name);
  if (available.has(slug)) return `/models/${slug}.glb`;
  return demo ? SAMPLE_MODEL : undefined;
}
