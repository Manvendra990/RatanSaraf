# Ratan Lal Saraf — React Website

Responsive React 18 + JavaScript (JSX) + Vite website adapted from the uploaded Expo/React Native mobile app source.

> **This is the JavaScript + JSX version:** all TypeScript source, type-only modules, type annotations, `.tsx` files, `tsconfig.json`, and the TypeScript build dependency have been removed. The uploaded `src.zip` was used as the source of truth. The styling, assets, routes, and API contracts are preserved.

## What is included

- Luxury maroon/gold responsive storefront with the supplied **original Ratan Lal Saraf logo**.
- Home, collections and search/filter/sort; gold/silver jewellery; 0.5g, 1g, 10g, 20g and 50g gold/silver coins; product detail pages.
- Shopping bag, wishlist, and WhatsApp enquiry (only if a real WhatsApp number is configured in your store backend).
- Jewellery rate calculator with manual 22K/18K/14K/9K rates, making charges, discounts, diamond/other charges and editable GST.
- Live metal provider quotes, and international gold/silver history trend charts (provider and browser access permitting).
- Login, registration, profile and account logout.
- Gold SIP Yojana: dashboard, manual KYC upload, create/pause/resume/cancel plans, submit manual payments for admin review, gold-sale requests, and transaction history **using existing backend APIs**.
- Store address and Google Maps directions.

## Important: this upload contained **frontend app source only**

No NestJS backend, MySQL/Prisma database, admin panel, or `.env` with credentials was supplied. This website uses **the same API endpoint patterns as your existing mobile app**. It does not create a separate backend or database.

When the backend cannot be reached, only the **shop catalogue** uses an openly labelled sample/demo fallback, taken from the uploaded mobile app's sample product data. Product prices in fallback mode are illustrative, not live. **Login and all Gold SIP/KYC/payment actions require the real backend**; nothing is faked. Metal-rate requests are made to the original external feeds and will report errors rather than invent prices.

## Requirements

- Node.js 20.19+ or Node.js 22+
- npm
- Existing NestJS API running (usually `http://localhost:3004/api`) for live catalogue, account and Gold SIP features
- For use from another device or production: backend reachable from browser, correct HTTPS/CORS and origin settings

## Run in development (Windows / PowerShell)

```powershell
cd Ratan_Lal_Saraf_React_JS
Copy-Item .env.example .env
npm install
npm run dev
```

Open **http://localhost:5173** on your laptop.

The example `.env` has:

```env
VITE_API_BASE=/api
VITE_BACKEND_ORIGIN=http://localhost:3004
```

Vite forwards `/api` requests to the NestJS server at port 3004. You **must start your original backend separately** if you want live backend functionality. If it runs at a different URL/port, update `VITE_BACKEND_ORIGIN` and restart the React development server.

### If the frontend is opened from a phone on the same Wi-Fi

Visit `http://YOUR_PC_LOCAL_IP:5173` from the phone. The Vite frontend proxy forwards requests on the **PC**, so `/api` does not need to point to a phone's localhost. Allow port 5173 through Windows Firewall if needed. The NestJS backend can remain bound to localhost on the PC because Vite reaches it from the PC. This is for development only.

### Build and deploy

```powershell
npm run build
npm run preview
```

Upload the `dist/` output to your web host. Configure the host to send unknown paths to `index.html` (SPA history fallback).

For production, use an API base reachable from visitors' browsers, e.g.:

```env
VITE_API_BASE=https://api.your-domain.example/api
```

The backend **must allow the production frontend's origin**, accept Bearer tokens and handle HTTPS. `VITE_` values are compiled into public JavaScript: **never place API secrets, database passwords or private tokens in them**.

## Backend routes expected (from the original mobile app)

| Area | Endpoint |
|---|---|
| Catalogue | `GET /api/catalog` |
| Store configuration | `GET /api/store` |
| Auth | `POST /api/auth/login`, `POST /api/auth/register`, `GET /api/auth/me`, `POST /api/auth/logout` |
| Cart + wishlist | `GET /api/shop`, `PUT /api/shop` |
| Product enquiry | `POST /api/enquiries` (when signed in) |
| Gold SIP | `GET /api/sip/dashboard`, `/api/sip/plans`, `/api/sip/rates` |
| SIP plans | `POST /api/sip/subscriptions`, `PUT /api/sip/subscriptions/:id` |
| Manual payments | `POST /api/sip/payments` |
| Gold sales | `POST /api/sip/sales` |
| PAN KYC | `POST /api/manual-kyc/submit` (`multipart/form-data`) |

External price feeds from the original mobile app: `https://api.oropocket.com/public/prices` and `https://api.goldprice.dev/v1/bars`. These third-party calls are subject to rate limits, allowed origins, subscription entitlements and network access; server-side proxying may be needed in production.

## Design / source notes

- Uploaded `logo-gold.png` and `logo-on-maroon.jpg` are preserved under `src/assets/`.
- Sample merchandise images use the same remote Unsplash image references as the uploaded mobile app. If an image fails to load, the website displays a local SVG jewellery illustration instead. Demo coin artwork is an illustration.
- Existing catalogue and KYC records are **never modified by the fallback sample data**.
- Login token is stored in **sessionStorage** (cleared when the browser session ends); guest cart/wishlist use localStorage. When signed in, the website uses the account's `/shop` data.
- The site accepts no card payment itself. Manual payment submissions are **requests for verification**, not successful payment claims.
- Revalidate CORS, auth/session policy, uploaded document security, product image permissions, rate-provider terms and backend API contracts before live deployment.

## Folder layout

```
src/
  main.jsx                 # Routes
  styles.css               # Full responsive design system
  components.jsx           # Header, footer, product UI, enquiry
  context.jsx              # Auth, catalogue, bag, wishlist, notices
  api.js                   # Backend + rate-provider client
  data.js                  # Store/sample fallback + calculator
  assets/                  # Original shop logos
  pages/
    ShopPages.jsx          # Home, shop, coins, details, cart, etc.
    ToolsPages.jsx         # Calculator and rate charts
    AccountPages.jsx       # Login/register/profile
    SipPages.jsx           # Gold SIP and KYC
```

## Setup checklist

1. Start the original NestJS/MySQL/Prisma backend with its existing migrations applied.
2. Check `http://localhost:3004/api/catalog` and `http://localhost:3004/api/store` in the browser.
3. Start this frontend: `npm install`, `npm run dev`.
4. Verify the **sample catalogue notice disappears** when the backend responds.
5. Check register/login, cart, favourites, Gold SIP, manual KYC and store configuration with a safe test account.
6. Set the real shop WhatsApp/phone, payments policy/instructions, products and images in the existing admin backend before public release.
7. For production, deploy with HTTPS, restrict API CORS to trusted origins, set SPA rewrite rules and verify the rate providers' CORS limitations.

