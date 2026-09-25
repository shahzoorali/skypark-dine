#!/usr/bin/env node
/**
 * "Invalid request body" from the real endpoint doesn't say what's wrong, so
 * this tries several plausible request shapes in sequence and reports which
 * one PetPooja actually accepts. Run this once to find the right shape, then
 * that shape goes into lib/petpooja/client.ts and this script is done.
 *
 * Rationale for what it tries: the billing endpoints in PetPooja's email are
 * old-style PHP-callback URLs, and "Invalid request body" on a JSON POST is
 * a classic symptom of an endpoint that actually wants
 * application/x-www-form-urlencoded. The email also wrote the credential
 * names with hyphens (app-key, app-secret, access-token) — that's normal
 * HTTP *header* naming convention, not JSON *field* naming convention, so
 * header-based auth is worth trying too.
 *
 *   node scripts/probe-petpooja.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
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
  PETPOOJA_APP_KEY: key,
  PETPOOJA_APP_SECRET: secret,
  PETPOOJA_ACCESS_TOKEN: token,
  PETPOOJA_REST_ID: restID,
  PETPOOJA_MENU_ENDPOINT,
} = process.env;

if (!key || !secret || !token || !restID) {
  console.error('\nMissing PETPOOJA_* values — fill in .env.local first.\n');
  process.exit(1);
}

const endpoint = PETPOOJA_MENU_ENDPOINT || 'https://onlineapipp.petpooja.com/thirdparty_fetch_dinein_menu';

const jsonBodyFull = { app_key: key, app_secret: secret, access_token: token, restID, tableNo: '' };
const jsonBodyNoTable = { app_key: key, app_secret: secret, access_token: token, restID };
const authHeaders = { 'app-key': key, 'app-secret': secret, 'access-token': token };

function toForm(obj) {
  return Object.entries(obj).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
}

const attempts = [
  {
    name: 'JSON body, snake_case keys, tableNo=""  (current client.ts)',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(jsonBodyFull),
  },
  {
    name: 'JSON body, snake_case keys, tableNo omitted entirely',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(jsonBodyNoTable),
  },
  {
    name: 'form-urlencoded body, tableNo=""',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: toForm(jsonBodyFull),
  },
  {
    name: 'form-urlencoded body, tableNo omitted',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: toForm(jsonBodyNoTable),
  },
  {
    name: 'auth as headers (app-key/app-secret/access-token) + JSON body {restID, tableNo:""}',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: JSON.stringify({ restID, tableNo: '' }),
  },
  {
    name: 'auth as headers + form-urlencoded body {restID, tableNo:""}',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...authHeaders },
    body: toForm({ restID, tableNo: '' }),
  },
  {
    name: 'auth as headers + JSON body {restID} only, no tableNo key',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: JSON.stringify({ restID }),
  },
];

const qrMenuEndpoint = 'https://vv3hiv00yk.execute-api.ap-southeast-1.amazonaws.com/V1/thirdparty_fetch_dinein_qr_menu';
const qrMenuAttempts = [
  {
    name: `[Apiary endpoint] Get Areas and Tables shape (tableNo="")`,
    endpoint: qrMenuEndpoint,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(jsonBodyFull),
  },
  {
    name: `[Apiary endpoint] Get DineIn Menu shape (tableNo="1")`,
    endpoint: qrMenuEndpoint,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...jsonBodyNoTable, tableNo: '1' }),
  },
];

console.log(`\nProbing ${endpoint}\n`);

const allAttempts = [
  ...attempts.map(a => ({ ...a, endpoint })),
  ...qrMenuAttempts,
];

for (const [i, attempt] of allAttempts.entries()) {
  process.stdout.write(`${i + 1}. ${attempt.name}\n   → `);
  let res, text;
  try {
    res = await fetch(attempt.endpoint, { method: 'POST', headers: attempt.headers, body: attempt.body });
    text = await res.text();
  } catch (error) {
    console.log(`network error: ${error.message}`);
    continue;
  }

  let json;
  try { json = JSON.parse(text); } catch { json = null; }

  if (res.status === 200 && json && json.success === '1') {
    console.log(`SUCCESS (HTTP 200, success:"1")\n`);
    console.log('This is the shape to use. Response keys:', Object.keys(json).join(', '));
    console.log('\nFull response:\n');
    console.log(JSON.stringify(json, null, 2));
    process.exit(0);
  }

  const shown = json ? JSON.stringify(json) : text.slice(0, 150);
  console.log(`HTTP ${res.status} — ${shown}`);
  await new Promise(r => setTimeout(r, 400));
}

console.log('\nNone of these worked. Send PetPooja the exact request body their docs expect for');
console.log('thirdparty_fetch_dinein_menu specifically — the doc we have describes a different');
console.log('path (thirdparty_fetch_dinein_qr_menu on a different host), and this "_menu"');
console.log('endpoint may take a genuinely different shape they have not documented publicly.\n');
