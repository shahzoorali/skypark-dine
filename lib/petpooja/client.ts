import type { PetpoojaCredentials, PetpoojaMenuResponse } from './types';

/**
 * The host PetPooja emailed. Confirmed WORKING 2026-09-26 with real Skypark
 * Cafe data (256 items, 37 categories) once two things were fixed:
 *  1. restID must be m5odcjr4 (our live outlet), not f1d89o3ks2 (PetPooja's
 *     demo outlet — also emailed, easy to confuse with ours).
 *  2. Wire field names are hyphenated (app-key, app-secret, access-token),
 *     not the underscored names PetPooja's own emailed docs used — the
 *     gateway 400s with "Invalid request body" otherwise.
 *
 * The public DineIn API (Apiary docs: https://dineinapi.docs.apiary.io/,
 * host vv3hiv00yk.execute-api.ap-southeast-1.amazonaws.com) was tried as an
 * alternative when this host looked dead, but even with restID + hyphenated
 * fields fixed it still rejects with GN_101 "Invalid client credentials" —
 * do not switch to it without confirming with PetPooja first.
 */
const MENU_ENDPOINT_STAGING =
  'https://onlineapipp.petpooja.com/thirdparty_fetch_dinein_menu';

export class PetpoojaError extends Error {}

function credentials(): PetpoojaCredentials {
  const {
    PETPOOJA_APP_KEY,
    PETPOOJA_APP_SECRET,
    PETPOOJA_ACCESS_TOKEN,
    PETPOOJA_REST_ID,
  } = process.env;

  if (
    !PETPOOJA_APP_KEY ||
    !PETPOOJA_APP_SECRET ||
    !PETPOOJA_ACCESS_TOKEN ||
    !PETPOOJA_REST_ID
  ) {
    throw new PetpoojaError(
      'Missing PetPooja credentials. Set PETPOOJA_APP_KEY, PETPOOJA_APP_SECRET, ' +
        'PETPOOJA_ACCESS_TOKEN and PETPOOJA_REST_ID, or run with MENU_SOURCE=mock.',
    );
  }

  return {
    app_key: PETPOOJA_APP_KEY,
    app_secret: PETPOOJA_APP_SECRET,
    access_token: PETPOOJA_ACCESS_TOKEN,
    restID: PETPOOJA_REST_ID,
  };
}

/**
 * Fetch the dine-in menu.
 *
 * `tableNo` is documented as required. Passing it blank returns areas and
 * tables only — no menu. Skypark runs one menu across all three areas, so
 * PETPOOJA_DEFAULT_TABLE_NO is used as the menu-fetch key in phase 1 where
 * the customer has no table number yet.
 *
 * NOT YET VALIDATED against a live response — credentials and restID are
 * now believed correct (see note above). Run `npm run validate:petpooja`
 * from Shahzoor's own machine to confirm, and to check the response shape
 * against lib/petpooja/types.ts and normalize.ts before trusting this
 * against real data.
 *
 * PetPooja confirmed 2026-09-26 the wire field names are hyphenated
 * (app-key, app-secret, access-token), not the underscored names their own
 * emailed docs used — hence the JSON body is built by hand below rather
 * than spreading PetpoojaCredentials directly.
 *
 * MUST only ever be called server-side: these credentials are long-lived
 * secrets and must not reach the browser bundle.
 */
export async function fetchDineInMenu(
  tableNo?: string,
): Promise<PetpoojaMenuResponse> {
  const creds = credentials();
  const table = tableNo || process.env.PETPOOJA_DEFAULT_TABLE_NO || '';
  const endpoint = process.env.PETPOOJA_MENU_ENDPOINT || MENU_ENDPOINT_STAGING;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      'app-key': creds.app_key,
      'app-secret': creds.app_secret,
      'access-token': creds.access_token,
      restID: creds.restID,
      tableNo: table,
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new PetpoojaError(
      `PetPooja menu fetch failed: HTTP ${response.status}`,
    );
  }

  const payload = (await response.json()) as PetpoojaMenuResponse;

  if (payload.success !== '1') {
    throw new PetpoojaError(
      `PetPooja menu fetch rejected: ${payload.message ?? 'no message'}`,
    );
  }

  return payload;
}
