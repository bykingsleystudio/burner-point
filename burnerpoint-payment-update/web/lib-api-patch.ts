/**
 * apps/web/src/lib/api.ts  — PATCH (paymentsApi section only)
 *
 * Find the existing `paymentsApi` object and replace it with this version.
 * The type union on `gateway` is updated to remove 'stripe'/'crypto'
 * and add 'paddle'/'nowpayments'. Everything else in this file stays identical.
 *
 * BEFORE (existing paymentsApi):
 *   export const paymentsApi = {
 *     packages: () => api.get('/payments/packages'),
 *     initialize: (data: { packageId: string; gateway: string }) =>
 *       api.post('/payments/initialize', data),
 *     history: () => api.get('/payments/history'),
 *   };
 *
 * AFTER (replace with):
 */

// Gateway type matches PaymentGateway enum in extended-entities.ts — EXACT ORDER
export type PaymentGatewayId =
  | 'flutterwave'    // 1 — Nigerian
  | 'paystack'       // 2 — Nigerian
  | 'squad'          // 3 — Nigerian
  | 'korapay'        // 4 — Nigerian
  | 'opay'           // 5 — Nigerian
  | 'paddle'         // 6 — International
  | 'nowpayments';   // 7 — Crypto

export interface InitPaymentParams {
  packageId: string;
  gateway: PaymentGatewayId;
}

export const paymentsApi = {
  /** Returns available credit packages sorted by sortOrder ASC */
  packages: () => api.get('/payments/packages'),

  /**
   * Initialize a payment session.
   * Returns: { reference, checkoutUrl, amountKobo, gateway }
   * Redirect user to checkoutUrl to complete payment.
   */
  initialize: (data: InitPaymentParams) =>
    api.post('/payments/initialize', data),

  /** Returns last 50 wallet transactions for the authenticated user */
  history: () => api.get('/payments/history'),
};

/*
 * NOTE: The full api.ts file is NOT replaced — only the paymentsApi export.
 * Keep all other exports (authApi, numbersApi, usersApi, developerApi) unchanged.
 *
 * Make sure the import for `api` (the axios instance) remains at the top of
 * your existing api.ts file — this patch assumes it exists there already.
 */
