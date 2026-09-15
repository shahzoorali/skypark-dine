import type { Menu, MenuItem } from '@/lib/menu';
import { slugify } from '@/lib/photos';
import { demoPhoto } from '@/lib/demo-photos';

export interface Featured {
  id: string;
  name: string;
  /** Display name split for the outlined/solid headline treatment. */
  lead: string;
  tail?: string;
  description: string;
  price: number;
  fromPrice: boolean;
  diet: MenuItem['diet'];
  photo?: string;
  category: string;
}

/**
 * The showcase carousel needs items that have a photograph — the whole layout
 * is one large image, so an item without one has nothing to show. Picks the
 * first few photographed items across categories.
 */
export function pickFeatured(menu: Menu, limit = 5): Featured[] {
  const out: Featured[] = [];

  for (const category of menu.categories) {
    for (const item of category.items) {
      if (out.length >= limit) return out;

      const slug = slugify(item.name);
      const photo = menu.source === 'mock' ? demoPhoto(slug) : item.imageUrl;
      if (!photo) continue;
      if (out.some(f => f.photo === photo)) continue; // no repeated stills

      const words = item.name.trim().split(/\s+/);
      out.push({
        id: item.id,
        name: item.name,
        lead: words.length > 1 ? words.slice(0, -1).join(' ') : item.name,
        tail: words.length > 1 ? words.at(-1) : undefined,
        description: item.description ?? `From our ${category.name.toLowerCase()}.`,
        price: item.price,
        fromPrice: item.fromPrice,
        diet: item.diet,
        photo,
        category: category.name,
      });
    }
  }

  return out;
}
