import type { Menu, MenuCategory, MenuItem, Diet } from '@/lib/menu';
import type { PetpoojaMenuResponse, PetpoojaItem } from './types';

/** PetPooja attribute ids: 1 = veg, 2 = non-veg, 24 = egg (per their catalog docs). */
function toDiet(attributeId?: string): Diet {
  switch (attributeId) {
    case '1': return 'veg';
    case '2': return 'nonveg';
    case '24': return 'egg';
    default: return 'unknown';
  }
}

function num(value: string | undefined, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeItem(raw: PetpoojaItem): MenuItem {
  const variations = (raw.variation ?? []).filter(v => v.active !== '0');
  const variationPrices = variations
    .map(v => num(v.price, NaN))
    .filter(Number.isFinite);

  const basePrice = num(raw.price);
  const hasVariations = raw.itemallowvariation === '1' && variationPrices.length > 0;
  const price = hasVariations ? Math.min(...variationPrices) : basePrice;

  return {
    id: raw.itemid,
    name: raw.itemname.trim(),
    description: raw.itemdescription?.trim() || undefined,
    price,
    fromPrice: hasVariations && variationPrices.length > 1,
    diet: toDiet(raw.item_attributeid),
    imageUrl: raw.item_image_url || undefined,
    categoryId: raw.item_categoryid,
    // PetPooja omits in_stock on the dine-in payload in some responses;
    // absence means available, not unavailable.
    inStock: raw.in_stock !== '0',
    rank: num(raw.itemrank, 9999),
    tags: raw.item_tags ?? [],
  };
}

export function normalizeMenu(
  response: PetpoojaMenuResponse,
  source: Menu['source'],
): Menu {
  const itemsByCategory = new Map<string, MenuItem[]>();

  for (const raw of response.items ?? []) {
    if (raw.active === '0') continue;
    const item = normalizeItem(raw);
    const bucket = itemsByCategory.get(item.categoryId);
    if (bucket) bucket.push(item);
    else itemsByCategory.set(item.categoryId, [item]);
  }

  const categories: MenuCategory[] = (response.categories ?? [])
    .filter(c => c.active !== '0')
    .map(c => ({
      id: c.categoryid,
      name: c.categoryname.trim(),
      rank: num(c.categoryrank, 9999),
      timings: c.categorytimings || undefined,
      items: (itemsByCategory.get(c.categoryid) ?? []).sort(
        (a, b) => a.rank - b.rank || a.name.localeCompare(b.name),
      ),
    }))
    // An empty category is noise on a phone screen.
    .filter(c => c.items.length > 0)
    .sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name));

  const details = response.restaurants?.[0]?.details as
    | Record<string, string>
    | undefined;

  return {
    restaurantName: details?.restaurantname?.trim() || 'SKYPARK CAFE',
    categories,
    fetchedAt: new Date().toISOString(),
    source,
  };
}
