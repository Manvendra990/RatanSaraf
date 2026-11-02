# Ratan Lal Saraf — Gold & Silver manual requests (2 November 2026)

## Existing installation

Keep your current database. Back it up in Workbench. Extract the ZIP into a new folder; keep the previous project until this update works.

Copy your old backend/.env, admin/.env and mobile/.env to the new matching folders. Copy backend/uploads as well. Preserve the SAME KYC_ENCRYPTION_KEY so existing PAN documents remain readable.

Backend — run one command at a time:

```powershell
npm ci
npm run db:upgrade
npm run dev
```

Admin — a second terminal in admin:

```powershell
npm ci
npm run dev
```

Mobile — a third terminal in mobile:

```powershell
npm ci
npx expo start -c
```

No database reset or reseed is required. Do not run schema.sql against an existing database. The additive Prisma migration preserves Gold balances/history, adds separate Silver balances/reservations and labels historical ledger records Gold.

Physical phone: EXPO_PUBLIC_API_URL in mobile/.env must use your PC's current LAN IP, e.g. http://192.168.1.66:3004/api only if that is still your IP. Keep phone and PC on the same Wi-Fi, backend HOST=0.0.0.0 and allow its port through Windows Firewall. ADMIN_ORIGIN remains your actual admin browser origin. Keep backend PUBLIC_API_URL reachable by the phone for product photos.

## Current store rate — one place to update

Admin → **Current Store Rates** → choose Gold or Silver → enter **Current store rate ₹ / gram (buy & sell)** and a source/reference → Save.

There is no separate sell-payout input and no Display Rates tab. Home, the Gold Rate screen and the Gold/Silver trading account all use the same current publication per metal. The live external market feed is explicitly separate and cannot change store transaction amounts. Existing calculator inputs remain manual.

The latest store publication is tracked transactionally, so rapid updates in the same timestamp cannot leave an older random-ID quote selected. The backend returns Cache-Control: no-store. Active mobile screens poll every 10 seconds and refresh on screen focus / app foreground. Refresh is also available manually. Before submitting a request, the app checks the latest publication again and asks the user to review if it changed. A slow/unreachable network can delay refresh; the app shows errors and disables requests when rate refresh fails.

## Buy / sell / KYC

- Gold and Silver have independent holdings and histories. KYC pending stays amber, approved green, rejected red with correction notes.
- Both buy and sell now use the **same current store rate**. Example: rate ₹1,000/g → buy 5g costs ₹5,000, sell 2g estimates ₹2,000. No fixed ₹800 sell rate is used.
- Request a whole-gram buy (1–10000) directly to admin. PAYMENTS_ENABLED=false does not block manual requests. Online bank transfer is not performed by the app.
- Buy requests stay PENDING with no balance credit. Admin verifies and approves with an allocation reference + review note. Approval credits grams once.
- Sell requests use available grams, reserve them and immediately appear in Sell History. Admin approves, then confirms actual payout with its reference. Only payout completion deducts the holding; rejection releases the reservation.
- Overview: remaining grams, available/reserved grams, total bought/sold, and current value = remaining grams × current store rate.
- History is one newest-first list with **All / Buy / Sell** filters. It includes pending, approved, rejected and paid records. After sale submission, Sell History opens automatically. Earlier SIP buys remain labelled.
- Compact Gold/Silver selector, horizontal account navigation, single rate card, labelled inputs, status badges and clearer totals replace the crowded layout. The maroon/gold/ivory theme is retained. Centre navigation remains Gold Rate.
- Internal IDs / generated request keys are not displayed.

## Historical data policy

This migration adds a current-rate pointer and does not delete or rewrite old quotes, balances, transactions, PAN files or ledger records. On upgrade, the previously selected buy rate becomes the single current rate for that metal. **Previously submitted buys/sells keep their original accepted amounts**, including any old ₹800/g sale snapshot; they are not silently repriced. Only new requests use the new single-rate policy. Admin can reject a pending old request and the user can submit a new one at the current rate.

Historical display-rate rows remain archived. Old display-rate write endpoints return HTTP 410 with instructions to use Current Store Rates. No reset or reseeding is needed.

## Quick verification on your device

1. Save a new Gold current rate in admin, then tap the refresh icon in the mobile trading screen. Confirm the single rate and timestamp update. Repeat for Silver. The store value on Home and Gold Rate must match.
2. Submit a buy, approve it in admin, refresh mobile and confirm grams were credited.
3. Submit a sell. Open History → Sell: the pending request should be visible immediately.
4. Admin approves and confirms payout; refresh mobile and confirm the balance, available grams and paid history. Example: 5g − 2g = 3g.
5. Restart Expo from this ZIP with `npx expo start -c`, then scan the new QR. An installed native APK must be rebuilt/reinstalled; restarting Metro does not update a standalone APK.

## New installation only

Create an empty MySQL database and backend/.env from .env.example. Set real database/JWT/admin credentials. Run npm ci, npm run db:setup, npm run kyc:key and npm run dev. Remove INITIAL_ADMIN_PASSWORD after seeding. No real balances/rates/KYC approvals are seeded. Configure the merchant and publish both metal rates before accepting requests.

See VALIDATION.md for checks and testing limits.
