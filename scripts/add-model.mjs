#!/usr/bin/env node
/**
 * Adds a 3D scan of a dish so its card gets a "View on your table" button.
 *
 *   npm run model -- path/to/scan.glb "Chicken Alfredo Penne"
 *
 * The dish name must match PetPooja exactly — it is slugified the same way
 * photos are (lib/photos.ts). The scan is shrunk for phones (1024px
 * textures, Draco geometry — both readable by Android Scene Viewer and iOS
 * Quick Look), saved to public/models/<slug>.glb, and the manifest rebuilt.
 *
 *   npm run model -- --manifest    # only rebuild the manifest
 */
import { execFileSync } from 'node:child_process';
import { readdirSync, writeFileSync, statSync, mkdtempSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(root, 'public', 'models');
const cli = join(root, 'node_modules', '@gltf-transform', 'cli', 'bin', 'cli.js');

function slugify(name) {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function transform(...args) {
  execFileSync(process.execPath, [cli, ...args], { stdio: 'inherit' });
}

function rebuildManifest() {
  // Files starting with "_" are test assets, never attached to a real dish.
  const slugs = readdirSync(dir)
    .filter(f => f.endsWith('.glb') && !f.startsWith('_'))
    .map(f => f.slice(0, -4))
    .sort();
  writeFileSync(join(dir, 'manifest.json'), JSON.stringify({ slugs }, null, 2) + '\n');
  console.log(`model manifest: ${slugs.length} dish model(s)`);
}

const [input, dishName] = process.argv.slice(2);

if (input === '--manifest') {
  rebuildManifest();
  process.exit(0);
}

if (!input || !dishName) {
  console.error('Usage: npm run model -- <scan.glb|scan.gltf> "<Dish name as in PetPooja>"');
  process.exit(1);
}

const slug = slugify(dishName);
const out = join(dir, `${slug}.glb`);
const work = mkdtempSync(join(tmpdir(), 'skypark-model-'));

try {
  transform('resize', input, join(work, 'a.glb'), '--width', '1024', '--height', '1024');
  transform('draco', join(work, 'a.glb'), out);
} finally {
  rmSync(work, { recursive: true, force: true });
}

const mb = statSync(out).size / 1024 / 1024;
console.log(`\n${dishName} -> public/models/${slug}.glb (${mb.toFixed(2)} MB)`);
if (mb > 3) {
  console.warn('Over 3 MB — slow on café Wi-Fi. Re-export the scan with fewer polygons, or rerun at a smaller texture size.');
}

rebuildManifest();
