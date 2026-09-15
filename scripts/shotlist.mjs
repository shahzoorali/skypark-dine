#!/usr/bin/env node
/**
 * Prints the photography shot list for the current menu: every item, the
 * filename its photograph must take, and whether that file is already in
 * public/menu/.
 *
 * Reads the app's own /api/menu so the list always matches what the site
 * renders. Start the app first:
 *
 *   npm run dev                       # mock data
 *   MENU_SOURCE=petpooja npm run dev  # the real menu
 *   npm run shotlist
 *
 * Point elsewhere with MENU_URL=https://dine.skyparkcafe.in/api/menu
 */
import { readdirSync, existsSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const photoDir = join(root, 'public', 'menu');
const url = process.env.MENU_URL ?? 'http://localhost:3000/api/menu';

const have = new Set(
  existsSync(photoDir)
    ? readdirSync(photoDir)
        .filter(f => /\.jpe?g$/i.test(f))
        .map(f => f.replace(/\.jpe?g$/i, ''))
    : [],
);

const slugify = name =>
  name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

let menu;
try {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  menu = await response.json();
} catch (error) {
  console.error(`\nCould not read ${url} — is the app running? (npm run dev)`);
  console.error(`  ${error.message}\n`);
  process.exit(1);
}

const rows = [];
let missing = 0;
let total = 0;

console.log(`\nSKYPARK shot list — source: ${menu.source}\n`);

for (const category of menu.categories) {
  console.log(category.name);
  for (const item of category.items) {
    total += 1;
    const slug = slugify(item.name);
    const got = have.has(slug);
    if (!got) missing += 1;
    rows.push({ category: category.name, item: item.name, file: `${slug}.jpg`, shot: got });
    console.log(`  ${got ? '[x]' : '[ ]'} ${slug}.jpg   ${item.name}`);
  }
  console.log('');
}

console.log(`${total - missing} of ${total} shot. ${missing} remaining.`);
console.log(`Hero: ${have.has('hero') ? 'shot' : 'missing (public/menu/hero.jpg)'}\n`);

if (process.argv.includes('--csv')) {
  const csv = [
    'Category,Item,Filename,Shot',
    ...rows.map(r => `"${r.category}","${r.item}",${r.file},${r.shot ? 'yes' : 'no'}`),
  ].join('\n');
  writeFileSync(join(root, 'shotlist.csv'), csv + '\n');
  console.log('Wrote shotlist.csv\n');
}
