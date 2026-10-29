## Manual-review alternative

See ../MANUAL_KYC_SETUP.md. Shop-admin personal-details/PAN review is now a separate route and can unlock SIP after approval. Provider verification is still separate; the generic provider documentation below describes only that provider route.

# External integrations and boundaries

## Aadhaar KYC
No provider was supplied. No Aadhaar number, OTP, document upload or fake verification is implemented in the app. Until a real provider adapter is connected, /kyc/start returns 503 on that provider route. A separately approved manual review can satisfy the configured app eligibility check.

The supplied adapter is a contract, not a claim of compatibility with any vendor. Implement your selected provider's actual API protocol, signature scheme and verification mapping in src/routes.ts (kyc and webhook methods) before enabling it. Test the provider's sandbox first. Configure its consent/privacy terms and your privacy URL. Check onboarding eligibility and applicable Aadhaar permissions with the provider.

Current adapter contract:
- Backend POSTs to KYC_API_URL using Bearer KYC_API_KEY.
- JSON: {reference: internal UUID, customer: {name,email,phone}, callbackUrl}.
- Expected response: {providerRef: unique string, redirectUrl: HTTPS hosted verification page}.
- Provider must not return raw Aadhaar data to this app.
- Webhook POST /api/kyc/webhook with JSON {reference,providerRef,status:"VERIFIED"|"REJECTED"}.
- x-kyc-timestamp: Unix seconds; age limit 5 minutes.
- x-kyc-signature: lowercase hex HMAC-SHA256 of `${timestamp}.` + exact raw request body, using KYC_WEBHOOK_SECRET.
- Signed verified results are accepted only for a previously created request and matching provider reference. Terminal results are idempotent and cannot be overwritten.
- Admin views status only. No admin KYC bypass or mock endpoint exists.
- A deployment with multiple staff should agree on KYC retention, access and account recovery procedures with its provider.

## Gold ownership and allocation
This is a shop-managed gold ledger. It is not connected to a vault, bullion custody API, exchange or digital-gold provider. Crediting requires the admin to verify bank receipt and enter an actual gold allocation reference. The software records that declaration; it cannot independently prove physical backing. The shop must arrange custody, reconciliations, customer terms and actual fulfilment before using real funds.

## Manual payments and payouts
No auto debit, bank-account verification or bank statement integration is supplied. PAYMENTS_ENABLED defaults to false. Configure real merchant payment instructions, clear customer terms and fresh store trade quotes before enabling payment submissions. Screenshot/reference entry alone does not confirm payment. Admin verifies external bank records.

All store trade prices are final INR/gram values entered by admin: buy = all-in customer cost; sell = net customer payout. This version does not calculate a separate tax/fee breakdown. If your business requires one, implement the approved breakdown and receipts before real transactions. Unit arithmetic uses paisa and micrograms; gold credits and payouts round down. Accepted quotes are stored by immutable rate ID. A buy submission requires a quote under 15 minutes old, a sale under 5 minutes old. Pending approved records honour that submitted quote; choose this policy only if the store can honour it.

## Existing market-rate features
The supplied OroPocket and goldprice.dev modules have been preserved. They are external market/reference displays and are NOT used to allocate customer gold. Their availability, history plan access, licensing and data accuracy were not verified in this build. No API keys were added to the app. Store trade quotes are published independently by admin.

## Product photos
Admin accepts image URLs or uploads JPEG/PNG/WebP (5 MB max). Uploaded media is public product imagery only; never upload identity documents, bank proofs or private data here. Back up backend/uploads with the database. PUBLIC_API_URL must be reachable from customer devices for uploaded images to render. Production uses HTTPS.
