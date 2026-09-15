import type { PetpoojaCredentials, PetpoojaMenuResponse } from './types';

const MENU_ENDPOINT_STAGING =
  'https://vv3hiv00yk.execute-api.ap-southeast-1.amazonaws.com/V1/thirdparty_fetch_dinein_qr_menu';

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
 * MUST only ever be called server-side: these credentials are long-lived
 * secrets and must not reach the browser bundle.
 */
export async function fetchDineInMenu(
  tableNo?: string,
): Promise<PetpoojaMenuResponse> {
  const creds = credentials();
  const table = tableNo ?? process.env.PETPOOJA_DEFAULT_TABLE_NO ?? '';
  const endpoint = process.env.PETPOOJA_MENU_ENDPOINT ?? MENU_ENDPOINT_STAGING;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...creds, tableNo: table }),
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
