# Verification — 4 November 2026

Executed on this uploaded-code update:

- Backend typecheck / build and **17 unit/HTTP tests**: PASS. Includes structured payout DTOs, leading zeroes, malformed/missing bank fields and gender vocabulary.
- Prisma 6.19.0 client generation and schema validation: PASS.
- Mobile typecheck, **5 KYC state tests + 3 transaction-history tests**: PASS.
- Android and iOS Metro/Hermes exports: PASS. This is a JavaScript/native bundle export, not a signed APK/IPA or a physical-device test.
- Current **Web** storefront/admin production build: PASS.
- Isolated MySQL 8.0.46 API integration: PASS. Bank mismatch/invalid IFSC rejected without changing reservations; encrypted bank storage; no full account/ciphertext in customer or admin list responses; admin-only audited bank reveal; gender saved to products/catalogue; legacy unclassified products preserved; social URLs saved and unsafe protocols rejected; durable price notifications, same-price deduplication, cursor validation and independent per-user read/all-read states. Existing Gold/Silver quote, buy approval, reservation, payout, exact-amount, retry, role, KYC and oversell regression scenarios also pass.
- Real forward Prisma migrations: PASS. Historical users, balances, SIP records, payments, ledger, archived banners, legacy product and old sale details remain unchanged; new gender/bank values default null and notification tables start empty. Repeated deploy is safe.
- Chromium admin browser smoke with mocked API: PASS for gender filter/edit/save, private bank dialog at desktop and 390px viewport, and social settings save.
- Home source comparison against supplied ZIP: PASS. Everything before its StyleSheet declaration is identical; all original style colour values are identical. Only card sizing/spacing/type scale was changed.

Not executed: your Windows database, physical Android/iOS UI, actual phone calls/social app handoff, real bank payout, signed APK/EAS/IPA, OS background push notifications or external KYC provider verification. The in-app bell/list is implemented; OS push is outside the approved scope.

Run from the respective folders:

```
backend: npm run typecheck
backend: npm test
backend: npm run prisma:validate
Web: npm run build
mobile: npm run typecheck
mobile: npm run test:kyc
mobile: npm run test:trading
mobile: npx expo export --platform all
```

The MySQL integration suites require NEW EMPTY databases ending in `_test`: configure TEST_DATABASE_URL / TEST_MIGRATION_DATABASE_URL, then run `npm run test:mysql` / `npm run test:migration` from backend. Never use the customer database for these tests. They do not reset existing tables.
