#!/usr/bin/env node
/**
 * Rebuilds public/menu/manifest.json from whatever photographs are actually
 * in public/menu/, so the app never links a file that is not there.
 *
 * Run after dropping new shots in: `npm run photos`
 */
import { readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(root, 'public', 'menu');

const slugs = existsSync(dir)
  ? readdirSync(dir)
      .filter(f => /\.jpe?g$/i.test(f))
      .map(f => f.replace(/\.jpe?g$/i, ''))
      .filter(s => s !== 'hero')
      .sort()
  : [];

const hero = existsSync(join(dir, 'hero.jpg'));

writeFileSync(
  join(dir, 'manifest.json'),
  JSON.stringify({ hero, slugs }, null, 2) + '\n',
);

console.log(`photo manifest: ${slugs.length} item shots, hero ${hero ? 'present' : 'missing'}`);
