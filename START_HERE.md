**Manual KYC update:** Start with MANUAL_KYC_SETUP.md. Personal details/PAN can now be reviewed and approved by the admin; no provider API is required for this manual-review route.

# Ratan Lal Saraf — Expo App + React Admin + NestJS API

**Prisma update:** Read PRISMA_SETUP.md first if you already created tables with the earlier SQL version. Existing tables need the guarded baseline step before db:setup.

This source package extends your uploaded `src (2).zip`. The original maroon/gold theme, jewellery layouts, sidebar, wishlist/cart/WhatsApp flows, coin filters and external rate charts are retained. Only the home hero is replaced with a Gold SIP entry card. New SIP views use the same buttons and colour tokens.

## Included

- **mobile/** — complete Expo project for Android and iOS, original images/source, real registration/login, API catalogue, account cart/wishlist and Gold SIP views.
- **admin/** — React/Vite web admin: products/photos, metal categories, coins, store settings, trade rates, SIP plans, customers/KYC status, payment approvals, sales/payouts, enquiries and audit trail.
- **backend/** — NestJS API, Prisma ORM, MySQL schema/migrations, safe initial admin setup, sample catalogue seed, fixed-point gold ledger and tests.
- **compose.yml** — optional local MySQL 8.4 container.

This is a source delivery for local setup and review. It has not been deployed, store-submitted or tested on physical phones. Real KYC, banking and custody connections need your chosen providers and merchant details. Read backend/INTEGRATIONS.md before enabling real money.

## 1. Prerequisites

Install a maintained Node.js 24 LTS release and npm. For the optional database container install Docker Desktop and start it. You can instead use an existing MySQL 8 database. Install Expo Go on your Android/iPhone, or use a matching Expo development build. Your phone and computer must use the same Wi-Fi.

Open a terminal in this extracted project folder (the folder containing this file).

```sh
node setup-local.mjs
```

Enter your computer's LAN IPv4 address and initial admin email. On Windows find the Wi-Fi IPv4 address using `ipconfig`; on macOS use Network settings. Avoid VPN/virtual-adapter IPs. This script generates unique database/admin passwords and JWT secret, writes local .env files and prints the initial admin login. It refuses to overwrite existing .env files. Save the generated credentials securely.

### Option A — Docker MySQL

From the project root:

```sh
docker compose up -d
```

Wait for MySQL to finish its first startup. `docker compose ps` should show healthy. If port 3306 is already used, use your existing database instead, or change the host port in compose.yml and DATABASE_URL together. Do not remove an existing database or its volume to solve a port conflict.

### Option B — Existing MySQL

Create a NEW empty database named `ratan_saraf` and a dedicated application user. Grant that user privileges on this database only. Set `DATABASE_URL` in backend/.env to its URL. Percent-encode special characters in the password inside a database URL. Do not point setup at an unrelated project database. Docker is unnecessary for this option.

## 2. Backend — terminal 1

```sh
cd backend
npm ci
npm run db:setup
npm run dev
```

`db:setup` applies Prisma migrations and seeds your initial admin and sample catalogue. It does not create trade quotes, verified KYC, balances or transactions. It can be rerun without resetting existing data. After successful initialization, REMOVE `INITIAL_ADMIN_PASSWORD` from backend/.env. Keep your login in your password manager. An existing admin password is not reset by rerunning setup.

API: `http://localhost:3004/api/health`
Database readiness: `http://localhost:3004/api/ready`

Development uses ts-node with decorator metadata and automatic restart. Production uses:

```sh
npm run build
npm start
```

## 3. Admin — terminal 2

Open a NEW terminal at the project root:

```sh
cd admin
npm ci
npm run dev
```

Open `http://localhost:5173` and log in with the generated initial admin credentials. Use this exact origin; switching between localhost and 127.0.0.1 requires matching ADMIN_ORIGIN and VITE_API_URL settings and a new login. Keep port 5173 available; if Vite chooses 5174 instead, stop it and resolve the conflict or change ADMIN_ORIGIN accordingly.

- **Categories:** Gold/Silver category names and visibility.
- **Products:** Add/edit product name, category, weight, purity, price, photos, stock and visibility. The reserved category name `Coins` cannot be renamed. Keep the category named `Coins` for coin filtering; set coin weight to 0.5, 1, 10, 20 or 50 grams. Uploaded photos are supported. Seed coin illustrations remain placeholders until you upload actual photographs.
- **Settings:** Store name/address/contact/WhatsApp number. WhatsApp requires country code and digits only.
- **Rates:** Publish final all-in buy and net sell rates per gram. These immutable STORE TRADE quotes power SIP only. The separate original market-rate chart remains as supplied. Quotes must be freshly published: 15-minute buy submission limit, 5-minute sale limit.
- **Plans:** Monthly/quarterly/yearly enrolment plans and minimum instalment. Existing plan frequency cannot be changed; create another plan instead.
- **Payments:** Verify bank receipt AND actual gold allocation, then approve with allocation reference. Reject invalid submissions with a reason.
- **Sales:** Approve/reject pending sale requests. For an approved sale, make the real external payout and record the bank reference before marking paid.
- **KYC:** Review personal details and the private PAN document; approve/reject with a reason. Manual approval is distinct from provider/Aadhaar verification.

Mobile refreshes catalogue/settings on screen focus, app foreground and about every 30 seconds. No app rebuild is needed for catalogue edits. A connection error shows a retry message rather than silently substituting demo products.

## 4. Mobile Expo app — terminal 3

Open another terminal at the root:

```sh
cd mobile
npm ci
npx expo start --clear
```

Scan the QR code using Expo Go (Android) or Camera/Expo Go (iPhone). Use a matching Expo Go version for the pinned SDK. For an Android emulator the API host is normally `10.0.2.2`; for an iOS simulator on the Mac host, `localhost` usually works. Physical phones must use your computer LAN IP in mobile/.env. Restart Expo after changing .env. Backend must listen on 0.0.0.0; allow local port 3004 through your private-network firewall.

`localhost` on a phone points to the phone, not your computer. Expo's tunnel only tunnels Metro, not your local API. Keep API network access configured separately.

Press `a` to open an installed Android emulator. On macOS with Xcode installed, press `i` for the iOS simulator. Windows cannot run Apple's iOS simulator, but can serve the app to an iPhone via Expo Go. Physical native builds and provider-native SDKs may require Expo development builds/EAS and developer accounts. No signing credentials are included.

## 5. Gold SIP flow

1. Register or sign in. Guest browsing is preserved; guest SIP requests require sign-in.
2. Open the new **Gold SIP Yojana** home card or sidebar item.
3. Open **KYC**, open Personal Details, upload PAN, give consent and submit for admin review. Return and refresh after the review.
4. **Start SIP:** choose monthly, quarterly or yearly plan and instalment amount.
5. **Payment:** choose your SIP, read merchant instructions, make a manual payment, accept the current store rate and submit the bank/UPI reference.
6. Admin verifies funds and physical/provider allocation. Only approval credits gold and advances the due date.
7. **Dashboard / History:** inspect balance, reserved/available gold, confirmed payments, next due date and ledger. Plans can pause/resume/cancel; existing balances and pending financial records remain.
8. **Sell Gold:** accept the fresh sell rate and enter grams plus payout details. The backend atomically reserves that gold. Admin rejection unlocks it; confirmed payout deducts it once and appends a sale ledger entry.

## 6. Configure real integrations before trading

Defaults deliberately block unconfigured operations:

- No KYC provider: provider verification remains unavailable; the separate consent-based manual PAN review route works when its encryption key and migration are configured.
- No merchant payment setup: `PAYMENTS_ENABLED=false`; configure merchant instructions and enable only after review.
- No published shop trade quote: SIP payment/sale cannot proceed.
- No real allocation: admin must not approve a payment merely from a screenshot or reference.

Set KYC provider adapter/credentials, PRIVACY_URL, merchant details and the agreed gold custody/redemption/price/tax terms. See backend/INTEGRATIONS.md. The generic KYC contract must be adapted to the chosen vendor's actual API; credentials alone do not guarantee vendor compatibility.

Original external market-rate endpoints were preserved and were not licensed, onboarded or verified here. Their errors remain visible in the original rate UI. They never directly credit or debit customer gold.

## 7. Validation and tests

```sh
# In backend/
npm test

# In admin/
npm run build

# In mobile/
npm run typecheck
npx expo export --platform android --platform ios --max-workers 2
```

See VALIDATION.md for actual results and limits. An additional REAL MySQL concurrency suite is supplied. Use a separate empty database whose name ends in `_test`, set TEST_DATABASE_URL in backend/.env, then run from backend:

```sh
npm run test:mysql
```

That suite adds fixture identities/verification ONLY inside the isolated test database and retains records for inspection. It does not add a KYC bypass to the app. Never use a real customer database for it.

## 8. Scope and production setup

Original placeholder profile entries (orders, saved addresses, alerts, help/settings) remain placeholders unless separately described above. Jewellery purchases continue through cart/WhatsApp enquiry; this package does not add shipping checkout, card processing, returns or a full order fulfilment engine. Phone/email password registration is provided; SMS/email OTP verification, password recovery, push reminders and multi-admin permission management are not included.

For deployment: HTTPS is required for production ADMIN_ORIGIN and PUBLIC_API_URL. Serve admin/API on the same site (e.g. subdomains of your own domain) so strict secure cookies work. Restrict MySQL to the backend, use least-privilege accounts, back up both MySQL and backend/uploads, configure appropriate retention and monitoring, and test restore/rollback. Set KYC/payment secrets on the server only; no secrets belong in EXPO_PUBLIC variables. Customer app tokens use Expo SecureStore; admin uses HttpOnly cookies and trusted-origin checks.

Database monetary values are integer paisa; gold is integer micrograms. Credit/payout division rounds DOWN. Accepted trades use immutable quotes; duplicate terminal approvals do not create a second ledger credit/debit. Inspect and run the supplied MySQL tests before using real customer funds.
