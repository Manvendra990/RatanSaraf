# Verification — 2 November 2026 single store rate and history update

Executed on this source:

- Backend typecheck/build, Prisma 6.19.0 generation/validation, 15 backend tests: PASS.
- Mobile typecheck, 5 KYC state tests, 3 history tests: PASS. History covers newest-first buy/sell ordering, pending/approved/paid/rejected sells, Gold/Silver separation and historical SIP payments.
- React admin production build: PASS.
- Android and iOS Metro/Hermes exports: PASS. This is not a signed APK/IPA or physical-device test.
- Real isolated MySQL API integration: PASS. Shared Home/trading current rate, optional legacy sell input ignored, same rate used for payout/valuation, rapid same-timestamp publication order, no-store responses, superseded-rate rejection, historical accepted amounts retained, retired display-rate writes, pending/direct Gold sell rows returned, manual requests with payments disabled, Silver 5g buy / 2g sell / 3g remaining, independent Gold balance, KYC, roles, exact arithmetic, retry/concurrent approvals, duplicate allocations, oversell protection and payout/rejection transitions.
- Real forward Prisma migration on an isolated MySQL database: PASS. Existing users, gold balances, plans, payments, ledger, banners remain; Silver starts zero; current publication pointer is initialized from the previously selected rate. Repeated deploy is a safe no-op.
- Chromium admin browser smoke with mocked API: PASS. Current Store Rates form saves only one amount, separate Sell payout and Display Rates controls absent, metal filters, buy approve/reject, sale approval/payout, no visible UUIDs.

Not tested: your Windows MySQL, your physical phone/installed APK, real bank transfers/custody, external KYC verification or real customer records. The generated design preview is illustrative, not evidence of a running app.

Reproduce from the respective folders:

```
backend: npm run typecheck
backend: npm test
backend: npm run prisma:validate
admin: npm run build
mobile: npm run typecheck
mobile: npm run test:kyc
mobile: npm run test:trading
mobile: npx expo export --platform all
```

Database tests require NEW EMPTY isolated databases ending in _test, with TEST_DATABASE_URL / TEST_MIGRATION_DATABASE_URL. Run npm run test:mysql / npm run test:migration from backend. Never point tests at the customer database. Neither suite clears an existing database.
