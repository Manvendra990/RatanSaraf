# Ratan Lal Saraf — Unified React + JSX website and admin

One **React (JSX) Vite application** serves the customer website and the redesigned administration dashboard. There are **no SIP pages, SIP plans, SIP navigation entries, or monthly/yearly plan UI** in this website. The admin retains **Metal Purchases, Sales, KYC, Ledger** and other existing operations, not SIP management screens.

## URLs (one frontend port)

| Experience                  | Local URL                   |
| --------------------------- | --------------------------- |
| Jewellery storefront        | http://localhost:5173/      |
| Admin login and management  | http://localhost:5173/admin |
| Existing backend, unchanged | http://localhost:3004/api   |

**There is only ONE frontend dev server/port.** The backend remains its own NestJS process on port 3004; React routes and the Vite proxy do not replace or duplicate the backend. The admin is integrated at `/admin` and the customer site stays at `/`. A discreet Admin login shortcut is in the customer site's footer.

## Local setup (Windows PowerShell)

```powershell
# Start your EXISTING NestJS backend first (its normal commands, port 3004).
# From inside the downloaded project:
Copy-Item .env.example .env
npm install
npm run dev
```

Open the URLs above. You do **not** need to run a second admin frontend. The Vite dev proxy maps `/backend/*` to `http://localhost:3004/api/*` and `/assets-api/*` to the **same backend** at root (for uploaded images).

To verify production build:

```powershell
npm run build
npm run preview
```

`preview` uses port 4173 for the **same combined site** (store `/` and admin `/admin`); its backend proxy matches dev. For a single public domain/port, deploy the `dist` folder and reverse-proxy `/backend/` and `/assets-api/` with Nginx. Review `deployment/nginx.conf.example`. In production use HTTPS for admin cookies, and configure the backend's cookie/CORS/proxy trust settings as appropriate. Preserve existing admin RBAC — hiding the admin URL is not a security control.

## Same-backend mapping

- Customer website: `GET /catalog`, `GET /store`, `GET /home`, `GET /gold/rates`, `POST /enquiries`.
- Admin session: `GET /auth/me`, `POST /auth/admin-login`, `POST /auth/logout`, using the existing cookie-based admin auth.
- Admin data: `GET /admin/overview`, `/admin/products`, `/admin/categories`, `/admin/users`, `/manual-kyc/admin`, `/admin/purchases`, `/admin/sales`, `/admin/ledger`, `/admin/enquiries`, `/admin/settings`, `/admin/audit`.
- Admin writes: `POST/PUT /admin/products`, `/admin/categories`, `POST /admin/rates`, `PUT /admin/settings`, `POST /admin/images`; KYC and purchase/sale decisions use the exact existing decision routes from the supplied admin source.
- Store rates are read from `GET /gold/rates` (the mobile's published-store-rates endpoint); if this fails, the admin alone falls back to the older `GET /sip/rates` route. **This is a legacy backend API route only, not a SIP screen.**

**Important:** The supplied uploads contain only the mobile `src/` tree and the older admin `src/` UI, not the NestJS backend. Thus these endpoints were matched against the provided frontend source, but end-to-end operations cannot be verified without your running backend. No demo inventory, fallback metal prices, fabricated transactions, new backend, or new database have been added.

### Customer login caveat

Customer auth implementations were not supplied (`context/AuthContext` and the original `services/api` were missing from the uploaded mobile src-only archive). `VITE_LOGIN_PATH` and `VITE_REGISTER_PATH` remain configurable in `.env` and default to `/auth/login` and `/auth/register`. Align these two paths **and their request/response payloads** with your existing backend before accepting website accounts. Existing customer cart and wishlist are browser-local (not claimed to sync across devices). Admin auth instead matches the supplied admin source exactly and uses the backend's HttpOnly cookie.

### Operational safety

Before live use, verify admin login and session expiry, backend authorization for every `/admin/*` and `/manual-kyc/*` endpoint, CSRF controls for cookie-authenticated mutations, KYC evidence access and revocation, image upload restrictions, rates publication, and purchase/sale audit records. Test these against a safe staging database first. Treat production personal identity documents and payout details as restricted data.

## Features

**Public:** Responsive premium jewellery homepage, product catalogue and metal/category filters, coin weights, product details, product enquiry/WhatsApp, wishlist, cart, store information, and periodically refreshed backend gold/silver rates. No SIP UI.

**Admin:** Unified branded login, responsive grouped sidebar, live backend KPI cards, quick actions, organised product/category forms and image upload, rate management, customer data, private KYC review with version validation, metal purchase/sale approval and payout workflows, ledger, enquiries, store settings, audit, searchable record tables, status filters, and detail modals. Data changes are always sent to the existing backend.
