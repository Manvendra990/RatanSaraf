# 4 November mobile extension

- POST /api/gold/sales now requires rateId, grams, bankName, accountHolderName, accountNumber, confirmAccountNumber and ifsc. Account strings are 9–18 digits; confirmation must match; IFSC is uppercase `[A-Z]{4}0[A-Z0-9]{6}`. Confirm is never stored. The account is AES-GCM encrypted using existing KYC_ENCRYPTION_KEY. New customer/list responses exclude accountEncrypted and contain accountLast4. GET /api/admin/sales/:id/bank is admin-only and audited; it reveals the decrypted account for actual payout review. Older website `/api/sip/sales` retains its old payoutDetails contract for compatibility.
- ProductDto accepts optional gender: Men, Women, Unisex, Children. Older null classifications remain visible in All. Admin Add/Edit requires an explicit choice.
- GET /api/notifications returns {items,unreadCount,nextCursor}; use ?before=cursor for older events. POST /api/notifications/:id/read and /api/notifications/read-all modify only the authenticated user's read state. Events are shared store publications with per-user read rows. Same-price republishes do not create duplicate events; rate + notification commit atomically.
- StoreSettings adds optional facebook, instagram, youtube and googleMaps HTTP(S) URLs.
- This is in-app notification delivery (15-second foreground refresh), not an OS/background push service.

# Current single-rate contract (2 November 2026)

Admin publishes `POST /api/admin/rates` with `{metal,buy,source}`. `buy` is the one current store rate per gram. A legacy optional `sell` input is accepted for wire compatibility but ignored; new rows store buyPaise=sellPaise. No separate sell spread or fee is calculated.

`rate_publications` is the authoritative per-metal pointer, updated in the same transaction as a new immutable quote. `GET /api/gold/rates`, `/sip/rates` and Home use this publication. Rate payloads include `pricingPolicy: SINGLE_STORE_RATE` and equivalent buy/sell values for old clients. New sales use the accepted current buyPaise; current account valuation uses that same price. Superseded rate IDs cannot create new trades. Old submitted sales/payments retain their original amounts and are never rewritten by a new publication.

Legacy display-rate writes are retired with HTTP 410. Historical display-rate data is preserved. The old separate payout policy described below is historical only; use START_HERE.md for current behaviour.

# Gold / Silver manual request update

The current workflow is documented in ../START_HERE.md. Manual purchase requests are accepted even with PAYMENTS_ENABLED=false. reference is a client-generated idempotency key, not proof of payment. Metal is derived server-side from rateId. The latest published rate for that metal must match at submission; accepted amounts are retained. Dashboard holdings.Gold and holdings.Silver contain independent balance/reserved/available values; legacy top-level balances remain Gold for compatibility. Admin overview accepts ?metal=Gold or ?metal=Silver. Ledger rows contain metal, with historical rows defaulting Gold. No online bank transfer is performed by these endpoints.

# Current direct-gold contract

See ../START_HERE.md. POST /api/gold/purchases accepts {rateId, grams: whole-number, reference}. It computes the amount server-side, preserves the accepted quote and awaits admin verification. GET /api/gold/dashboard includes purchases plus historical payments; GET /api/gold/rates supplies store trade quotes. Admin GET /api/admin/purchases includes direct and legacy requests; POST /api/admin/purchases/:id/decision accepts APPROVE/REJECT, note and an allocation reference for approval. Historical pending payments use the existing /api/admin/payments/:id/decision route. POST /api/gold/sales uses existing reservation/payout logic. New /sip/subscriptions and /sip/payments submissions return 410. Banner management is absent; historical tables are retained.

## Manual-review alternative

See ../MANUAL_KYC_SETUP.md. Shop-admin personal-details/PAN review is now a separate route and can unlock direct Gold / Silver Buy & Sell after approval. Provider verification is still separate; the generic provider documentation below describes only that provider route.

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
No auto debit, bank-account verification or bank statement integration is supplied. PAYMENTS_ENABLED defaults to false. Manual request submission does not require enabling online payments. Configure merchant details, customer terms and current store trade rates before use. Screenshot/reference entry alone does not confirm payment. Admin verifies external bank records.

All store trade prices are final INR/gram values entered by admin: buy = all-in customer cost; sell = net customer payout. This version does not calculate a separate tax/fee breakdown. If your business requires one, implement the approved breakdown and receipts before real transactions. Unit arithmetic uses paisa and micrograms; gold credits and payouts round down. Accepted quotes are stored by immutable rate ID. A new buy or sell must use the latest published rate for its metal. Pending approved records honour that submitted quote; choose this policy only if the store can honour it.

## Existing market-rate features
The supplied OroPocket and goldprice.dev modules have been preserved. They are external market/reference displays and are NOT used to allocate customer gold. Their availability, history plan access, licensing and data accuracy were not verified in this build. No API keys were added to the app. Store trade quotes are published independently by admin.

## Product photos
Admin accepts image URLs or uploads JPEG/PNG/WebP (5 MB max). Uploaded media is public product imagery only; never upload identity documents, bank proofs or private data here. Back up backend/uploads with the database. PUBLIC_API_URL must be reachable from customer devices for uploaded images to render. Production uses HTTPS.
