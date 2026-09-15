# skypark-dine

The dine-in QR menu for Skypark Cafe, Banjara Hills. Replaces the hosted
PetPooja menu at `skyparkcafe.petpooja.com`.

Deployed to **dine.skyparkcafe.in**.

## Phases

**Phase 1 (current)** — view only. Guest scans a QR at the table, browses the
menu, calls a waiter. No cart, no table number.

**Phase 2** — table numbers in the QR URL, cart, and the order pushed into the
POS as a KOT. Both are behind flags in `config/flags.ts`; the components ship
inert rather than being added later.

## Menu data

Menu comes from PetPooja's Dine-in QR API
([docs](https://dineinapi.docs.apiary.io/)), restaurant ID 83305.

Two things to know:

1. **`tableNo` is required** on `thirdparty_fetch_dinein_qr_menu`. Sending it
   blank returns areas and tables only, not a menu. Skypark runs one menu
   across all three areas, so `PETPOOJA_DEFAULT_TABLE_NO` is used as the fetch
   key in phase 1.
2. **Credentials are server-only.** They are long-lived secrets and the billing
   endpoints are plain HTTP, so nothing talks to PetPooja from the browser.
   Everything goes through `app/api/menu` and `lib/petpooja`.

### Drivers

`MENU_SOURCE` selects the driver:

- `mock` (default) — `lib/petpooja/mock.ts`, shaped like the documented
  response and seeded from Skypark's public menu. Prices are the **delivery**
  list and are not authoritative for dine-in. Build against it; never serve it.
- `petpooja` — the live call.

The type definitions in `lib/petpooja/types.ts` are modelled from the published
docs and have **not** been validated against a live response. Diff a real
staging payload against them before trusting them.

### Caching and scheduled menus

PetPooja can schedule a category to a time range — Skypark plans a weekday
12:00–18:00 add-on menu. A plain TTL cache would serve the wrong window across
a boundary, so the cache key carries the window (`menuWindowKey`, evaluated in
IST). Adjust that function if the schedule changes.

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Runs on mock data with no credentials. `/api/menu` returns the normalised menu.

## Layout

```
app/api/menu/    server route — holds credentials, serves clean JSON
lib/petpooja/    client, mock, normaliser, cache. The only code that knows
                 PetPooja's wire format.
lib/menu.ts      the view model everything else renders
components/      ported from the Skypark design system cafe-ordering kit
app/tokens.css   brand tokens, copied verbatim from the design system export
config/flags.ts  phase gates
```

`app/tokens.css` is a copy. When the design system changes, re-copy it rather
than editing it here.

## Photography

The design leans on food photography — without it the cards fall back to a
gradient and the page reads as a wireframe. Shots live in `public/menu/`, named
by slugified item name, and a local shot always beats whatever PetPooja has.

```bash
npm run dev          # in one terminal
npm run shotlist     # what to shoot, and what's already done
npm run shotlist -- --csv   # same as a CSV for the shoot
npm run photos       # after dropping new files in public/menu/
```

Run `shotlist` against live data to get the real list:

```bash
MENU_SOURCE=petpooja npm run dev
npm run shotlist
```

Two files matter beyond the items:

- `public/menu/hero.jpg` — the hero. Landscape, shot dark; the scrim runs
  bottom-up over it, so keep the subject in the upper two-thirds.
- `public/menu/<slug>.jpg` — item cards, 4:3, cropped tight.

`npm run photos` rewrites `public/menu/manifest.json` from whatever is actually
on disk, so the app can never link a photograph that isn't there. Run it before
committing new shots.

## Deploy

Vercel, project root at the repo root, framework preset Next.js — no build
configuration needed.

Environment variables to set in the Vercel project (Production and Preview):

| Variable | Value |
| --- | --- |
| `MENU_SOURCE` | `petpooja` once credentials exist, `mock` until then |
| `PETPOOJA_APP_KEY` | from PetPooja |
| `PETPOOJA_APP_SECRET` | from PetPooja |
| `PETPOOJA_ACCESS_TOKEN` | from PetPooja |
| `PETPOOJA_REST_ID` | `83305` |
| `PETPOOJA_DEFAULT_TABLE_NO` | any live table number |

Then point `dine.skyparkcafe.in` at the project in Vercel's domain settings and
add the CNAME your DNS provider asks for.

Leave `MENU_SOURCE` unset on the first deploy. The footer says "Sample data —
not live" whenever the mock driver is serving, so a preview can never be
mistaken for the real menu.
