# Manual personal-details and PAN review update

The Gold SIP KYC screen now opens a reference-style Personal Details form using the app's maroon/gold theme. It collects name, optional email, registered mobile (read-only), India, address, city, pincode, state, DOB, optional spouse DOB/anniversary, PAN number and one PAN image/PDF. Customer reviews the details and provides consent before submission.

## Review flow

- New submission -> PENDING / Awaiting admin review.
- Admin -> KYC -> Review details -> Open private PAN document.
- Approval requires opening the document in the admin UI and confirming the review, with a review note.
- Approval -> APPROVED / Manually reviewed. It allows SIP enrolment, payment submission and sale requests; normal payment/ledger checks still apply.
- Rejection requires a reason. Customer can correct and resubmit; the current rejected submission is replaced and reset to pending. Audit events retain submission/review history, but old document versions are not retained by this version.
- Every resubmission increments a review version; decisions from a stale admin screen are rejected.
- Pending/approved submissions cannot be silently replaced by the customer.
- This is a shop-admin review, not Aadhaar authentication or authoritative PAN API verification. No Aadhaar number/OTP is collected. Existing provider endpoints remain separate.

## Install safely

Back up the database and keep your actual .env files. This package uses Prisma; your earlier local version may still be the SQL-only backend. Do not overwrite credentials or reset existing tables.

### If you already run the Prisma backend

From backend/:

```sh
npm ci
npm run db:migrate
npm run kyc:key
npm run dev
```

### If you still run the original SQL-only backend

Replace backend code from this package while preserving .env. From backend/:

```sh
npm ci
npm run db:baseline:check
npm run db:baseline
npm run db:migrate
npm run kyc:key
npm run dev
```

The baseline check targets the legacy initial schema, not the new manual-review table. It refuses incompatible databases; stop on a failed check and review the output. Never use migrate reset or force db push to bypass differences. The new migration only adds manual_kyc; it does not drop customer/payment records.

### For a brand-new empty database

Follow START_HERE.md, then run `npm run kyc:key` from backend/ after creating your .env. The root setup-local script generates this key automatically for new configurations.

## Encryption key

`npm run kyc:key` generates KYC_ENCRYPTION_KEY locally without printing it. It preserves an existing valid key. Back it up securely with the database; losing/replacing it makes encrypted records unreadable. Do not share the key or use the JWT secret as a substitute.

Full submitted profile/PAN and document bytes are AES-256-GCM encrypted in the MySQL manual_kyc table. Only masked PAN metadata/status are listed. Documents are not saved under public /media or the product uploads directory. Document access requires the account owner or an authenticated admin and is audited; admin details access is also audited. Staff can still save screenshots/downloads after viewing, so limit admin access to trusted reviewers.

This version retains one current document per customer and has no automated retention/purge policy. Agree retention and access practices with the shop before collecting real documents.

## Admin and Expo

In admin/:

```sh
npm ci
npm run dev
```

In your mobile app folder (named mobile in this ZIP; you may use gwalior locally):

```sh
npm ci
npx expo start --clear --lan
```

Preserve EXPO_PUBLIC_API_URL with your computer LAN IP for physical-device testing. New Expo-compatible dependencies are expo-document-picker and the native date/time picker. Use an Expo Go version matching the project's SDK, or a matching development build. Native development builds must be rebuilt after adding native modules.

Do not copy the reference screenshots' people's details or their marketing terms into real customer records. The reference 0%/10-month campaign artwork has not been copied; your existing configured SIP plans remain unchanged.

## Validation

Passed: backend compilation, tools typecheck, 11 backend tests including encryption/tampering, upload signatures, forbidden status injection and authenticated route guards; admin production build; mobile typecheck and Android/iOS bundle generation.

Not run against real MySQL or physical phones here. The MySQL integration suite now includes actual manual submission, admin document access/review, cross-user document denial and subsequent gold operations; run `npm run test:mysql` on a dedicated *_test database before using real customer documents/funds. Provider verification remains unconfigured unless separately integrated.
