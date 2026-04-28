# 🏪 E-Commerce Admin Panel

A **generic, reusable** admin dashboard that can be integrated with **any e-commerce platform**. Built with React + TypeScript + Tailwind CSS + Recharts.

---

## ✨ Features

| Page | Features |
|------|----------|
| 📊 **Dashboard** | KPI cards (Revenue, Orders, Customers, Products), Revenue area chart, Order status pie chart, Daily orders bar chart, Recent orders list |
| 📦 **Orders** | Full order table, search by ID/customer, status filter tabs (placed/confirmed/processing/shipped/delivered/cancelled), inline status update dropdown |
| 👥 **Customers** | User directory with phone, AI credits, admin role, join date, search |
| 📋 **Inventory** | Stock levels by color/style/size, availability indicators (green/yellow/red), store status |
| 💰 **Revenue** | Monthly revenue area chart, Orders trend line chart, Payment methods bar chart, Total revenue, AOV, Growth KPIs |
| ⚙️ **Settings** | Coming soon |

---

## 🚀 Quick Start

```bash
cd admin-panel
npm install
npm run dev
```

Opens at **http://localhost:3001** (or next available port)

---

## 🔌 Integration with ANY E-Commerce Backend

This admin panel is **not tied to any specific platform**. It works with any backend that exposes REST APIs.

### Step 1: Set your backend URL

Create a `.env` file:
```env
VITE_API_URL=https://your-ecom-backend.com/api/v1
```

### Step 2: Implement these REST endpoints on your backend

| Endpoint | Method | Request | Response |
|----------|--------|---------|----------|
| `/admin/users` | GET | `?page=1&limit=20` | `{ "users": [{ "id", "phone", "credits", "is_admin", "created_at" }], "total": N }` |
| `/admin/orders` | GET | `?status=placed&page=1&limit=20` | `{ "orders": [{ "id", "user_id", "tshirt_color", "size", "price", "status", "payment_status", "shipping_address", "created_at" }], "total": N }` |
| `/admin/order/:id/status` | PUT | `{ "status": "shipped", "tracking_id": "..." }` | `{ "message": "Order status updated" }` |
| `/admin/inventory` | GET | — | `{ "colors": [...], "types": [...], "sizes": [...], "price": 499 }` |
| `/admin/stats` | GET | — | `{ "total_revenue", "total_orders", "total_users", "total_products" }` |
| `/admin/revenue` | GET | `?period=monthly` | `[{ "month": "Jan", "revenue": 12400, "orders": 49 }]` |

### Step 3: Authentication

The admin panel reads auth tokens from `localStorage`:
- First checks `admin_token`
- Falls back to `token`
- Sends as `Authorization: Bearer <token>` header

Your backend should validate this token and verify admin access.

### Step 4: Order Statuses

The admin panel supports these order statuses:
- `placed` → `confirmed` → `processing` → `shipped` → `delivered`
- `cancelled` (from any state)

Each status gets a colored badge in the UI.

---

## 🏗 Architecture

```
admin-panel/
├── src/
│   ├── components/
│   │   └── common/
│   │       └── Sidebar.tsx          # Dark sidebar navigation
│   ├── pages/
│   │   ├── DashboardPage.tsx        # KPIs + charts + recent orders
│   │   ├── OrdersPage.tsx           # Order management table
│   │   ├── UsersPage.tsx            # Customer directory
│   │   ├── InventoryPage.tsx        # Stock management
│   │   └── RevenuePage.tsx          # Revenue analytics
│   ├── services/
│   │   └── api.ts                   # Generic API client (Axios)
│   ├── App.tsx                      # Router + Layout
│   └── main.tsx                     # Entry point
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

---

## 🛠 Tech Stack

| Technology | Purpose |
|-----------|---------|
| React 18 | UI framework |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| Recharts | Charts & graphs (Area, Bar, Pie, Line) |
| Lucide React | Icons |
| React Router v6 | Client-side routing |
| Axios | HTTP API client |
| React Hot Toast | Notifications |
| Vite | Build tool |

---

## 🎨 Customization

### Change sidebar branding
Edit `src/components/common/Sidebar.tsx` — update the logo, title, and navigation items.

### Add new pages
1. Create a new page in `src/pages/`
2. Add a route in `src/App.tsx`
3. Add a nav item in `src/components/common/Sidebar.tsx`

### Change API response format
Edit `src/services/api.ts` and the corresponding page component to match your backend's response format.

### Change color theme
Edit `tailwind.config.js` — update the `primary` and `sidebar` color values.

---

## 🔗 Example: Using with PrintMyTee T-shirt Platform

```env
VITE_API_URL=http://localhost:8080/api/v1
```

The T-shirt platform already has these admin endpoints built in:
- `GET /api/v1/admin/users`
- `GET /api/v1/admin/orders`
- `PUT /api/v1/admin/order/:id/status`

Start the T-shirt backend first (`./start-dev.sh`), then run the admin panel.

---

## 📄 License

MIT — use it for any project, commercial or personal.
