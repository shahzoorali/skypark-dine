# Handoff — Skypark dine-in menu

Read this first. Written 2026-09-25 to hand this project from a Cowork
session over to Claude Code (or any fresh session) with full context.

## What this is

A custom dine-in QR menu for BK Sky Park cafe (Banjara Hills, Hyderabad),
replacing the hosted PetPooja page at skyparkcafe.petpooja.com/menu.
Dine-in only. Next.js 16 (App Router, Turbopack) + React 19 + TypeScript,
no Tailwind. Target domain: dine.skyparkcafe.in (Vercel, not yet deployed).

- Phase 1 (current focus): view-only menu. Browse + call-a-waiter. No
  ordering, no table number.
- Phase 2 (not started): adds table numbers. Order-handoff approach is
  UNDECIDED — either a WhatsApp cart handoff (Shahzoor's original idea) or
  PetPooja's own `save_kot_qr_order` API pushing straight to the kitchen
  printer (recommended, not yet agreed).

Design: ~80-100% drawn from https://resturantweb-plum.vercel.app/ (Savoria
reference), grounded in Skypark's own brand tokens (`app/tokens.css`,
exported from a Claude Design canvas — orange #F37021, gold #D4A847,
charcoal #2D2D2D, cream #F5F0E8). Homepage is `/`, the menu-first grid
layout. A `/v2` single-dish showcase carousel was built and removed
2026-09-28 at Shahzoor's call (recoverable from git history).

## PetPooja live menu API — RESOLVED and VALIDATED 2026-09-26

Real Skypark Cafe data now fetches successfully: 256 items, 37 categories,
real restaurant details. Three separate bugs stacked on top of each other;
all three are fixed in code.

**Restaurant IDs** (don't confuse these):
- `83305` — Skypark's ID in the PetPooja admin UI
- `f1d89o3ks2` — PetPooja's **demo outlet** restID (issued by email
  2026-09-24 alongside the real credentials; do not use)
- `m5odcjr4` — the correct `restID` for Skypark's live outlet (83305),
  confirmed by PetPooja (Malvi Vaghela) 2026-09-26. Set in
  `.env.local`/`.env.example` as `PETPOOJA_REST_ID`.

**Endpoint:** `onlineapipp.petpooja.com/thirdparty_fetch_dinein_menu` — the
one PetPooja originally emailed — is correct and working. It had looked
dead (gateway-level "Invalid request body" on every shape tried) only
because of the field-name bug below. The Apiary/AWS host
(`vv3hiv00yk.execute-api.ap-southeast-1.amazonaws.com/.../thirdparty_fetch_dinein_qr_menu`,
from https://dineinapi.docs.apiary.io/) was tried as an alternative and
still returns `GN_101 "Invalid client credentials"` even with the restID
and field-name fixes — it is NOT used; don't switch to it without checking
with PetPooja first. `lib/petpooja/client.ts` defaults to the onlineapipp
host.

**Wire field names are hyphenated** (`app-key`, `app-secret`,
`access-token`), not the underscored names PetPooja's own emailed docs and
the Apiary docs both use. Malvi confirmed this by email 2026-09-26 after
sharing a working curl example. `lib/petpooja/client.ts` and
`scripts/validate-petpooja.mjs` build the JSON body by hand with the
correct hyphenated keys rather than spreading `PetpoojaCredentials`
directly (that type keeps underscored field names internally for
readability — only the wire format is hyphenated).

**Real payload shape differs from the docs** — `lib/petpooja/types.ts` and
`normalize.ts` are now fixed to match:
- Field is `instock`, not `in_stock`.
- `itemallowvariation` is a **number** (`0`/`1`), not a string.
- `item_attributeid` veg/nonveg/egg mapping (1/2/24) — confirmed correct,
  values `1`, `2`, `24` all seen in the real response.

**Still unconfirmed — needs Shahzoor:** `instock` only ever sends `"1"`
(16 items) or `"2"` (240 items) in the real response, never `"0"` as the
docs implied. Which value means "out of stock" is a guess right now
(`normalize.ts` treats `!== '0'` as in-stock, i.e. currently treats BOTH
values as in-stock — this is almost certainly wrong for the 16 `"1"`
items). To resolve: mark one specific item out-of-stock in the PetPooja
admin for outlet 83305, note its name, re-run
`PETPOOJA_DEFAULT_TABLE_NO=1 node scripts/validate-petpooja.mjs`, and check
whether that item's `instock` value is `1` or `2` in the fresh
`petpooja-sample.json`. Fix the `!== '0'` check in `normalize.ts`
accordingly once known.

`npm run probe:petpooja` (`scripts/probe-petpooja.mjs`) still has the older
underscore-field request variants kept for the historical record — not
updated, since the mismatch is now understood and documented above.

## "View in 3D" / AR on your table (added 2026-09-28)

A dish card shows a **View in 3D** badge only when a 3D model exists for it.
Tapping opens a 3D viewer (`components/ArView.tsx`, Google `<model-viewer>`,
lazy-loaded) with **Place it on my table**, which opens the phone camera and
puts the dish on the table at real size — Android via WebXR/Scene Viewer,
iPhone via AR Quick Look (USDZ generated on the fly from the GLB). No app.

- Add a model: `npm run model -- scan.glb "<Dish name exactly as in PetPooja>"`
  — shrinks it (1024px textures, Draco) into `public/models/<slug>.glb` and
  rebuilds `public/models/manifest.json`. Aim for under 3 MB.
- Capture: plate the dish, orbit it with a phone scanning app (Polycam, Luma,
  RealityScan), export GLB. Real-world scale matters — the dish must come out
  plate-sized on the table.
- Test on a phone without real scans: add `?ar=demo` to the URL — every dish
  gets a public-domain sample model (`public/models/_sample-avocado.glb`,
  CC0, Khronos). Never on by default: guests must not see a model that isn't
  their dish.
- Sold-out dishes never show the badge.

## Architecture notes

- `lib/petpooja/types.ts` — raw PetPooja wire types, modelled from docs
  only, unvalidated against a real response.
- `lib/petpooja/normalize.ts` — converts raw PetPooja JSON into the
  app-internal `Menu`/`MenuItem` view model (`lib/menu.ts`). Contains the
  unvalidated diet-attribute guess mentioned above.
- `lib/petpooja/client.ts` — the live HTTP call. Server-only; credentials
  read from env vars, never `NEXT_PUBLIC_`-prefixed.
- `lib/petpooja/mock.ts` — mock data driver seeded from Skypark's real
  (delivery-channel) menu content. Explicitly NOT authoritative for
  dine-in pricing — "exists to build against, never to serve to a guest."
- `lib/petpooja/index.ts` — `getMenu()` dispatches to mock or live driver
  based on `MENU_SOURCE` env var, with IST-based, window-aware caching to
  support PetPooja's scheduled "Bunking Hours" add-on menu (Mon-Fri
  12:00-18:00) without serving a stale window across its boundary.
- `lib/photos.ts` / `lib/demo-photos.ts` — HARD RULE: demo/matched-by-eye
  photography must never render over live PetPooja data. Local
  manifest-listed shots always win; demo photos only apply when
  `Menu.source === 'mock'`; PetPooja's own `imageUrl` is the last resort.
  This gating must survive any future refactor.
- `config/flags.ts` — Phase 2 features (ordering, table numbers) are
  built but inert behind `NEXT_PUBLIC_ENABLE_ORDERING` /
  `NEXT_PUBLIC_ENABLE_TABLE_NUMBERS`, both `false` for launch.

## Environment / workflow notes

- `.env.example` is currently **gitignored** (caught by a blanket `.env*`
  pattern in `.gitignore`) and so is NOT actually in the GitHub repo
  despite being a template file, not a secret. Worth adding an exception
  (`.env*` + `!.env.example`) — not yet done, flagged but not fixed.
- Do not run `npm run validate:petpooja` / `npm run probe:petpooja` from
  a sandboxed/bridged shell (e.g. a cloud agent's device-bridge VM) —
  its network is separately egress-restricted and can't reach PetPooja's
  hosts (confirmed: DNS resolution fails for the AWS Apiary host from
  there). These scripts only give real results run directly on Shahzoor's
  own machine, whose IP PetPooja has whitelisted.
- Photography: `public/menu/hero.jpg` is a real, production-safe Skypark
  photo. Everything under `public/demo/` is demo-only (matched "by eye,
  not by fact" to mock menu items) and must stay gated behind
  `source === 'mock'` per the rule above. Real dish photography for
  `public/menu/` has not happened yet; `npm run shotlist` / `npm run
  photos` tooling is ready for when it does.
- Deployment to Vercel + `dine.skyparkcafe.in` domain: not started. This
  needs Shahzoor's own Vercel account auth, not something a session can
  do on his behalf.

## Also still undecided (ask Shahzoor, don't assume)

1. Phase 2 order flow: WhatsApp handoff vs. PetPooja `save_kot_qr_order`.
