# Ratan Lal Saraf — 4 November 2026 update

The release uses your uploaded `gwalior` project. Admin is in **Web**, at **http://localhost:5173/admin**, not a separate admin folder.

## Update an existing installation

1. Stop old backend, Web and Expo terminals with Ctrl+C. Back up your MySQL database.
2. Extract this ZIP into a NEW folder. Keep the previous project until the update works.
3. Copy old `backend/.env`, `Web/.env`, `mobile/.env` into the new matching folders. Copy old `backend/uploads` for existing product photos. Keep the SAME KYC_ENCRYPTION_KEY so existing encrypted PAN/bank data stays readable. Do not copy old src files over the new code.
4. In the NEW backend folder, run one command at a time:

```powershell
npm ci
npm run db:upgrade
npm run dev
```

No database reset or seed is required. Do not run schema.sql, migrate reset, DROP, force push or db:setup on an existing installation. If migration fails, stop and share its error.

5. In NEW Web (another terminal):

```powershell
npm ci
npm run dev
```

Open http://localhost:5173/admin and press Ctrl+Shift+R. ADMIN_ORIGIN in backend must match this browser origin. Preserve Web's existing backend proxy configuration.

6. In NEW mobile (another terminal):

```powershell
npm ci
npx expo start -c
```

Use Expo Go to scan this new QR. An installed standalone APK/IPA must be rebuilt and reinstalled; restarting Expo does not update it. Phone and PC must share Wi-Fi; backend HOST=0.0.0.0 and port 3004 must be reachable. Keep mobile EXPO_PUBLIC_API_URL pointed at your PC's CURRENT LAN IP + `:3004/api`.

## Admin setup / verification

- **Settings:** set the real store Phone, WhatsApp and social page/channel links. Do not use generic platform homepages as if they were the store's profiles.
- **Products:** choose Men / Women / Unisex / Children, save, then open mobile Categories or Collection and select that audience. Existing unclassified products stay visible in All.
- **Store Rates:** change a Gold or Silver price. Open the mobile bell after its active refresh (up to 15 seconds) or tap Refresh. Confirm metal, ₹/gram and time; mark read and check the badge. The same numeric price does not create a duplicate notice.
- **Gold & Silver → Sell:** fill all bank fields. Mismatched accounts or malformed IFSC must be rejected. Submit; view it in mobile History → Sell.
- **Admin → Sales → Bank details:** view the private bank record, then use the existing approve / Mark paid flow. Grams remain reserved until payout or rejection.
- **Home:** confirm the rate card is compact with the SAME colours, live/store rate behaviour and metal switching. Header actions should be on the right; the floating button opens a vertical contact menu.

The database migration preserves previous balances, quotes, products, KYC and transactions. Notification history starts with rate changes made AFTER this upgrade. New fields on older records are blank, not fabricated.

See CHANGES_20261104.md for the exact scope and VALIDATION.md for tested limits.
