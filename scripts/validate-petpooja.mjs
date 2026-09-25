#!/usr/bin/env node
/**
 * Hits the real PetPooja dine-in menu endpoint and reports whether the
 * response matches what lib/petpooja/types.ts and normalize.ts assume.
 *
 * Run this from a machine whose IP PetPooja has whitelisted — it will NOT
 * work from most cloud environments, including Claude's own container.
 *
 *   cp .env.example .env.local   # fill in the four PETPOOJA_* values
 *   node scripts/validate-petpooja.mjs
 *
 * Writes the raw response to petpooja-sample.json (gitignored) so you can
 * open it directly if you want to see everything yourself.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function loadEnvLocal() {
  const path = join(root, '.env.local');
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
loadEnvLocal();

const {
  PETPOOJA_APP_KEY,
  PETPOOJA_APP_SECRET,
  PETPOOJA_ACCESS_TOKEN,
  PETPOOJA_REST_ID,
  PETPOOJA_DEFAULT_TABLE_NO,
  PETPOOJA_MENU_ENDPOINT,
} = process.env;

const missing = [
  'PETPOOJA_APP_KEY', 'PETPOOJA_APP_SECRET', 'PETPOOJA_ACCESS_TOKEN', 'PETPOOJA_REST_ID',
].filter(k => !process.env[k]);

if (missing.length) {
  console.error(`\nMissing: ${missing.join(', ')}`);
  console.error('Copy .env.example to .env.local and fill in the PetPooja values.\n');
  process.exit(1);
}

const endpoint = PETPOOJA_MENU_ENDPOINT || 'https://onlineapipp.petpooja.com/thirdparty_fetch_dinein_menu';
const tableNo = PETPOOJA_DEFAULT_TABLE_NO ?? '';

console.log(`\nPOST ${endpoint}`);
console.log(`restID=${PETPOOJA_REST_ID}  tableNo=${tableNo ? tableNo : '(blank — areas/tables only)'}\n`);

let response, body;
try {
  response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_key: PETPOOJA_APP_KEY,
      app_secret: PETPOOJA_APP_SECRET,
      access_token: PETPOOJA_ACCESS_TOKEN,
      restID: PETPOOJA_REST_ID,
      tableNo,
    }),
  });
  body = await response.text();
} catch (error) {
  console.error(`Request failed before a response came back: ${error.message}`);
  console.error('Most likely cause: this machine\'s IP is not the one PetPooja whitelisted.\n');
  process.exit(1);
}

console.log(`HTTP ${response.status}\n`);

let json;
try {
  json = JSON.parse(body);
} catch {
  console.error('Response was not JSON. First 500 chars:\n');
  console.error(body.slice(0, 500));
  process.exit(1);
}

writeFileSync(join(root, 'petpooja-sample.json'), JSON.stringify(json, null, 2));
console.log('Full response written to petpooja-sample.json\n');

if (json.success !== '1') {
  console.error(`PetPooja reported an error: success=${json.success}  message=${json.message ?? '(none)'}`);
  process.exit(1);
}

// ── Sanity checks against what the app currently assumes ──────────────────
const notes = [];

if (!Array.isArray(json.categories)) notes.push('✗ no "categories" array — check the actual key name.');
if (!Array.isArray(json.items)) notes.push('✗ no "items" array — check the actual key name.');

if (Array.isArray(json.items) && json.items.length) {
  const sample = json.items[0];
  const expected = [
    'itemid', 'itemname', 'item_categoryid', 'price', 'item_attributeid',
    'itemallowvariation', 'in_stock', 'itemrank',
  ];
  for (const key of expected) {
    if (!(key in sample)) notes.push(`✗ items[0] has no "${key}" — normalize.ts assumes this exists.`);
  }

  const attrValues = [...new Set(json.items.map(i => i.item_attributeid))];
  console.log(`item_attributeid values seen: ${attrValues.join(', ')}`);
  console.log('  lib/petpooja/normalize.ts currently maps 1=veg, 2=nonveg, 24=egg — confirm this against PetPooja\'s actual meaning.\n');

  const withVariation = json.items.filter(i => i.itemallowvariation === '1');
  console.log(`${withVariation.length} of ${json.items.length} items have itemallowvariation=1`);
  if (withVariation.length && !Array.isArray(withVariation[0].variation)) {
    notes.push('✗ itemallowvariation=1 but no "variation" array on that item.');
  }
}

if (Array.isArray(json.categories) && json.categories.length) {
  const withTimings = json.categories.filter(c => c.categorytimings);
  console.log(`${withTimings.length} of ${json.categories.length} categories carry categorytimings (needed for the scheduled add-on menu).`);
  if (withTimings.length) {
    console.log(`  sample: ${JSON.stringify(withTimings[0].categorytimings)}`);
  } else {
    console.log('  none yet — expected until the Bunking Hours schedule is configured in PetPooja.');
  }
}

console.log('');
if (notes.length) {
  console.log('Mismatches against lib/petpooja/types.ts:');
  for (const n of notes) console.log('  ' + n);
  console.log('\nFix types.ts and normalize.ts to match, then re-run.\n');
  process.exit(1);
} else {
  console.log('No mismatches found against the current assumptions. Still worth reading petpooja-sample.json yourself once.\n');
}
