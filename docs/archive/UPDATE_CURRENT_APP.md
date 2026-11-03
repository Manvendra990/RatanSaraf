Latest dashboard/catalogue update: follow READ_FIRST_20261030.md first.

# Update your current app — keep your data

This ZIP updates the supplied full source. Original assets, theme, product flows and API routes are retained. Changes: Prisma 6.19 database layer, manual admin-reviewed KYC, existing manual SIP/payment/allocation workflow, and a jewellery rate calculator replacing the Wishlist bottom tab. Wishlist remains in the drawer and product buttons.

## 1. Before replacing files
Stop backend/Expo/admin terminals. Back up MySQL using Workbench Data Export. Keep your real .env files and uploads folder locally. Extract this ZIP to a new folder, then copy your existing backend/.env, mobile/.env and admin/.env into the matching folders. Copy existing backend/uploads if it contains product images. Do not delete the old project yet.

## 2. Backend (PowerShell, inside backend)

```
npm ci
npm run db:upgrade
npm run kyc:key
npm run dev
```

Run each command only after the previous command succeeds. db:upgrade detects legacy SQL tables, validates their structure, records a baseline when needed and applies pending migrations. It never invokes reset, drop or force push. Existing Prisma installations skip baseline. If a mismatch is reported, stop and share the output; do not reset. Keep a backup: MySQL DDL migrations cannot always roll back automatically.

This existing installation already has an admin and catalogue: do not run the initial seed again. For a brand-new database use START_HERE.md instead. Preserve the KYC encryption key permanently once generated.

## 3. Admin (new terminal, inside admin)

```
npm ci
npm run dev
```

Open the KYC tab to review personal details and the private PAN document, then approve/reject with a note. This records manual store approval, not external identity verification.

## 4. Mobile (new terminal, inside mobile)

```
npm ci
npx expo start -c
```

Scan using Expo Go. The phone and PC must share a network. Mobile .env must point EXPO_PUBLIC_API_URL to your PC LAN IP and port 3004, not localhost. Keep backend DATABASE_URL on the local MySQL address. The admin on the PC can continue using localhost:3004/api. Set backend PUBLIC_API_URL to the LAN address for phone-accessible product image URLs.

## Calculator
The Calculator tab replaces Wishlist. Enter a per-gram rate for the chosen purity; changing purity clears the rate to avoid accidental reuse. No screenshot price is hardcoded. Options are 22K/916, 18K/750, 14K/585 and 9K/375 (duplicate reference options removed). Making discount affects making charges only. Tax is calculated on gold plus discounted making plus diamond and other charges. GST is editable with a 3% estimate default; this is an estimate, not a tax invoice or trade quote. Editing an input clears previous totals until Calculate is tapped.

## SIP
Customer submits personal details/PAN with consent; admin reviews; approved customer can enrol. Payments and purchases remain manual: admin checks payment and real allocation reference before crediting gold. Sale/payout workflows remain in place. No sample gold balances or executable market prices are introduced.

## Validation limits
Automated source checks/builds are recorded in VALIDATION.md. Your Windows MySQL database, real PAN uploads, physical devices and actual bank transfers still need local end-to-end verification. No access to your local database was available while preparing this source.
