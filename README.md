# 📊 LucubraElec — Admin Panel

React + TypeScript dashboard for managing the LucubraElec store: products, orders, shipping, refunds, coupons, inventory, users.

## 🚀 Quick Start

```bash
npm install
npm run dev
```

Starts on **http://localhost:3001** (needs backend on :8080). Local dev login: see backend seed.

## ✅ Feature Status

| Feature | Status | Details |
|---------|--------|---------|
| Dashboard | ✅ | Real stats from backend (no fake data) |
| Products | ✅ | Create + **edit** (paise↔rupee round-trip safe), negative-value guards, image upload, per-product public copy-link button (`/p/{slug}`) |
| Orders | ✅ | Server-side search (`ORD-…`, `#uuid`, partial, any case), status tabs matching the backend state machine, payment filter (incl. `refund_pending`), pending/expired filters |
| Order detail | ✅ | Items, address, payment breakdown, **"paid · COD due"** badge for partial orders, **GUEST** badge for guest orders |
| Status updates | ✅ | Dropdown restricted to legal next states; backend 400s surfaced as toasts |
| Shipping | ✅ | Create Shipment → Shipmozo push + auto-assign (real AWB when keys configured; mock otherwise), tracking timeline |
| Refunds | ✅ | Full + partial (validated 0 < amount ≤ paid) via Razorpay |
| Coupons / Returns / Users / Inventory | ✅ | CRUD, return approval (auto-refund), real stock from products |

## ❌ Left for launch

- [ ] Deploy to Vercel + prod env vars
- [ ] Optional at volume: bulk-ship button, COD remittance reconciliation report

## ⚙️ Configuration

| Variable | Description |
|----------|-------------|
| VITE_API_URL | Backend API base (default http://localhost:8080/api/v1) |
| VITE_STORE_URL | Public storefront origin (used by the product copy-link button) |

## 📄 License
MIT
