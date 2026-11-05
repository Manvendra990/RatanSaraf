# Coins and ledger update

Replace Web source files from this ZIP in your existing Web folder. Keep your existing .env unchanged. Run `npm ci` if dependencies are missing, then `npm run dev`. No database reset, seed or Prisma migration is required. The supplied backend was inspected and is compatible without modifications.

- Jewellery Products and Coins have separate navigation, lists, category choices and forms. Coins use supported weights 0.5, 1, 10, 20 and 50 grams; jewellery keeps audience/colour/featured fields.
- Both sections save through the existing /admin/products API and preserve existing inventory. Jewellery prices remain internal, coin prices remain customer visible.
- Ledger BUY is green, SELL is red. Gold/Silver and search/status filters determine summary totals.
- Summary shows bought grams, sold grams, buy amount, sell amount and net posted movement. Pending requests are excluded. Net posted movement is not available-to-sell balance because reservations are separate.
- Backend /admin/ledger returns all ledger entries without pagination. Totals use BigInt micrograms/paise, avoiding floating point accumulation. Existing data is not modified.

Validation: Vite production build passed; 3 calculation/classification tests passed; Chromium mock-API checks passed for separate catalogue forms/lists/categories and metal-filtered ledger totals/colours. Not tested against your local Windows database.

Run calculation tests: `node --test test/*.test.mjs`.
