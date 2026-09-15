/**
 * The view model the UI renders. Deliberately decoupled from PetPooja's
 * wire format so a change upstream touches only the normaliser.
 */

export type Diet = 'veg' | 'nonveg' | 'egg' | 'unknown';

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  /** Lowest price across variations, in rupees. */
  price: number;
  /** True when variations mean the real price starts at `price`. */
  fromPrice: boolean;
  diet: Diet;
  imageUrl?: string;
  categoryId: string;
  inStock: boolean;
  rank: number;
  tags: string[];
}

export interface MenuCategory {
  id: string;
  name: string;
  rank: number;
  /** Raw PetPooja timing string, when the category is schedule-limited. */
  timings?: string;
  items: MenuItem[];
}

export interface Menu {
  restaurantName: string;
  categories: MenuCategory[];
  /** When this snapshot was produced (ISO). */
  fetchedAt: string;
  /** Which driver produced it — surfaced so staging data is never mistaken for live. */
  source: 'petpooja' | 'mock';
}
