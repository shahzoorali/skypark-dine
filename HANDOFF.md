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
charcoal #2D2D2D, cream #F5F0E8). Two homepage variants exist and
Shahzoor has NOT YET PICKED ONE:
- `/` — menu-first grid layout
- `/v2` — Savoria-style single-dish showcase carousel
Ask him which to keep; the other should then be removed or demoted.

## THE OPEN BLOCKER — PetPooja live menu API

This is the thing actively being worked when this session ended.

**Restaurant IDs** (don't confuse these):
- `83305` — Skypark's ID in the PetPooja admin UI
- `f1d89o3ks2` — the actual `restID` the API wants (issued by PetPooja by
  email for third-party integration)
- `m5odcjr4` — mapping code PetPooja gave 2026-09-25 to confirm outlet
  83305 is linked to the third-party integration

**Endpoint — RESOLVED as of 2026-09-25.** Two candidate hosts existed:
- `onlineapipp.petpooja.com/thirdparty_fetch_dinein_menu` — the one
  PetPooja emailed. **Confirmed dead**: every request shape tried (7
  variants — JSON/form-encoded, credentials in body/headers, tableNo
  present/blank/omitted) got rejected at the API-Gateway level
  (`{"message":"Invalid request body"}`, no `success` field — not even a
  PetPooja-shaped response). Do not use this host again.
- `https://vv3hiv00yk.execute-api.ap-southeast-1.amazonaws.com/V1/thirdparty_fetch_dinein_qr_menu`
  — from the public docs at https://dineinapi.docs.apiary.io/. **This is
  the correct one.** It returns a real PetPooja response:
  `{"success":"0","errorCode":"GN_101","message":"Invalid client credentials."}`
  — HTTP 200, proper shape, request accepted at the gateway.

`lib/petpooja/client.ts` already points at this endpoint (commit
`37cf0c9`, 2026-09-25). **Do not revert it to the onlineapipp host.**

**Current status: credentials rejected (GN_101) on the correct endpoint.**
The app_key/app_secret/access_token PetPooja emailed (for restID
f1d89o3ks2) are being rejected there. Working theory: those credentials
were only ever mapped against the wrong host (onlineapipp.petpooja.com)
and need to be remapped/reconfirmed for the Apiary/API-Gateway endpoint —
possibly what the mapping code `m5odcjr4` is for, possibly needs a
separate confirmation email to PetPooja support.

**Next step:** email PetPooja support (they've been responsive) with:
> We're hitting https://vv3hiv00yk.execute-api.ap-southeast-1.amazonaws.com/V1/thirdparty_fetch_dinein_qr_menu
> (your public DineIn API docs) with the app_key/app_secret/access_token/restID
> you issued for f1d89o3ks2 and get HTTP 200, success:"0", errorCode:"GN_101",
> message:"Invalid client credentials." Is this the correct endpoint for
> outlet 83305 (mapping code m5odcjr4)? If so, can you confirm/remap the
> credentials against it — the ones you sent appear scoped to a different
> host (onlineapipp.petpooja.com), which rejects every request at the
> gateway level rather than returning this error format.

Once credentials are confirmed working, run (from a real machine, not a
sandboxed/bridged shell — see note below):
```
npm run validate:petpooja
```
This checks the live response against the structural assumptions baked
into `lib/petpooja/types.ts` and `lib/petpooja/normalize.ts` — especially
the GUESSED `item_attributeid` → veg/nonveg/egg mapping (1/2/24), which
has never been confirmed against real data. Fix any mismatches found.

`npm run probe:petpooja` (in `scripts/probe-petpooja.mjs`) has 9 request
variants total (7 against the old host, kept for the record; 2 against the
correct Apiary host) — useful if credentials still fail after a supposed
fix, to isolate exactly what's wrong.

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

1. Which homepage to keep: `/` vs `/v2`.
2. Phase 2 order flow: WhatsApp handoff vs. PetPooja `save_kot_qr_order`.
