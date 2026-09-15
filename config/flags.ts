/**
 * Phase gates.
 *
 * Phase 1 is a view-only QR menu: browse, then call a waiter. The cart and
 * ordering components are built and shipped but inert, so phase 2 is a flag
 * flip plus the KOT wiring rather than a rebuild.
 */
export const flags = {
  /** Show Add buttons, cart bar and cart sheet. */
  ordering: process.env.NEXT_PUBLIC_ENABLE_ORDERING === 'true',
  /** Read the table number from the QR URL and show the table chip. */
  tableNumbers: process.env.NEXT_PUBLIC_ENABLE_TABLE_NUMBERS === 'true',
} as const;
