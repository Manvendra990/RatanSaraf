# Ratan Lal Saraf — Dashboard and catalogue update

This complete project merges your latest uploaded mobile/src, admin/src and backend/src into the existing Expo, React admin and Nest/Prisma project configuration. Your recent numeric KYC version fixes are retained. Mobile and admin keep the existing maroon/gold palette, logo and bottom navigation. Backend secrets and customer uploads are not in this ZIP.

## What changed

- Shop by Metal removed from Home.
- The mobile homepage has one fixed, locally bundled Gold SIP banner that opens manual KYC. Carousel/banner management has been removed from the admin UI and backend API.
- Gold/Silver reference-rate card switches every 3 seconds while Home is focused and the app is active. Manual arrows/metal selection available.
- Market rate fetched from the existing provider; store display rates published independently in admin. Timestamp, purity and tax basis displayed. No screenshot rates hardcoded.
- Important: the existing market feed does not specify purity. The card explicitly says this, so the two figures are references rather than a guaranteed like-for-like saving comparison. No purity conversion or savings percentage is invented.
- Home shows featured Gold jewellery, falling back to other active Gold jewellery. Coins stay in Coins/categories/drawer.
- Wishlist/cart outline icons on the left of the header.
- Jewellery prices removed from customer product cards/details, cart totals and WhatsApp enquiry text. Public jewellery catalogue responses also omit price/pricePaise. Coin prices remain indicative. Mixed carts request a store quote instead of showing an incomplete total.
- Product details support code, brand, colour, availability, weight, purity and certification; empty optional specs stay hidden. No certification claims are seeded.
- Internal IDs/foreign-key columns hidden in admin. UUID values in legacy admin text are redacted. SIP screens and customer enquiries no longer print internal IDs. Product codes and genuine bank/payment references remain visible. IDs stay in API requests and database relations for correct operation; hiding the UI is not an authorization mechanism.
- Admin Display Rates tab, product specifications and Featured checkbox. Product images can be uploaded through the existing authenticated image endpoint.
- Additive Prisma migration 202610300001_home_catalogue; existing financial/KYC records and IDs are not renumbered or reset.

## Install — existing database

1. Stop the old backend/admin/Expo terminals. Back up the MySQL database using Workbench Data Export.
2. Extract this ZIP into a new folder. Copy your old real backend/.env, admin/.env and mobile/.env into their matching folders. Preserve backend/uploads and copy it if it contains existing product photos. Keep KYC_ENCRYPTION_KEY unchanged.
3. In backend, run one command at a time:

```powershell
npm ci
npm run db:upgrade
npm run dev
```

Do not start the mobile/admin against the new code until db:upgrade succeeds. It applies pending migrations and can baseline an unchanged legacy initial SQL installation. If it reports a mismatch or failed migration, stop and share the error. Do not run migrate reset, force push, DROP or schema.sql on the existing database. No seed is needed for this update.

If manual KYC has never been configured, run npm run kyc:key before starting backend; if a key already exists it is preserved.

4. In admin (separate terminal):

```powershell
npm ci
npm run dev
```

5. In mobile (separate terminal):

```powershell
npm ci
npx expo start -c
```

Phone and PC must share Wi-Fi. Mobile EXPO_PUBLIC_API_URL must use the PC LAN IP and port 3004/api, not localhost. Backend HOST=0.0.0.0. Database URL stays on your MySQL host. Admin running on the PC can use localhost. Set backend PUBLIC_API_URL to a phone-accessible LAN address for image uploads.

## Admin setup after update

1. Products: edit existing Gold/Silver jewellery, fill product code/specifications and tick Featured for chosen Gold items. Existing products continue working if optional fields are blank. Internal price remains editable for recordkeeping; it is hidden from customer jewellery views.
2. Display Rates: publish metal, fineness, per-gram price, tax basis and source. Latest active rate per basis is displayed, with its update time. These rates do not alter historical SIP quotes/balances.
3. SIP Trade Rates: continue publishing separate executable buy/sell quotes for manual payments and sales. Existing quote-expiry checks remain in force.
4. KYC: review PAN and personal details, then approve/reject with a reason. Current submission version is validated numerically. Do not bypass stale-submission checks.

The old `banners` database table is retained for existing installations; it is no longer read or managed by the app and is not dropped.

## Verification and limits

Backend build and all 13 automated tests, mobile typecheck and admin production build passed after removing banner management. Banner management is no longer available; verify on a device that tapping the mobile homepage image opens KYC.

Not executed: real MySQL migration/rollback, real bank/provider integration or physical Android/iOS device tests. The existing isolated test:mysql suite requires a dedicated *_test database; never point it at the customer database. Back up before local migration and check Home, product details, mixed cart enquiry, display rates and KYC on your own devices.
