import type { Menu } from '@/lib/menu';
import { fetchDineInMenu } from './client';
import { mockMenuResponse } from './mock';
import { normalizeMenu } from './normalize';

export { PetpoojaError } from './client';

type Source = Menu['source'];

function activeSource(): Source {
  return process.env.MENU_SOURCE === 'petpooja' ? 'petpooja' : 'mock';
}

/**
 * Cache key for the current menu window.
 *
 * PetPooja can schedule a category to a time range (Skypark plans a weekday
 * 12:00-18:00 add-on menu). A plain TTL cache would happily serve a stale
 * window across the boundary, so the key carries the window the request falls
 * in and the entry is dropped when the window changes.
 *
 * Windows are evaluated in IST because that is what the POS is configured in.
 */
export function menuWindowKey(now = new Date()): string {
  const ist = new Date(now.getTime() + (5 * 60 + 30) * 60 * 1000);
  const day = ist.getUTCDay(); // 0 = Sunday
  const hour = ist.getUTCHours();
  const weekday = day >= 1 && day <= 5;
  const bunkingHours = weekday && hour >= 12 && hour < 18;
  return `${ist.toISOString().slice(0, 10)}:${bunkingHours ? 'bunking' : 'standard'}`;
}

interface CacheEntry {
  key: string;
  expiresAt: number;
  menu: Menu;
}

let cache: CacheEntry | null = null;

const TTL_MS = Number(process.env.MENU_CACHE_TTL_MS ?? 5 * 60 * 1000);

export async function getMenu(
  options: { tableNo?: string; force?: boolean } = {},
): Promise<Menu> {
  const key = `${menuWindowKey()}:${options.tableNo ?? 'default'}`;
  const now = Date.now();

  if (!options.force && cache && cache.key === key && cache.expiresAt > now) {
    return cache.menu;
  }

  const source = activeSource();
  const raw =
    source === 'petpooja'
      ? await fetchDineInMenu(options.tableNo)
      : mockMenuResponse();

  const menu = normalizeMenu(raw, source);
  cache = { key, expiresAt: now + TTL_MS, menu };
  return menu;
}
