# 📊 Admin Panel — E-Commerce Dashboard

A React + TypeScript admin dashboard for managing the e-commerce platform. Products CRUD, order management, user list, inventory tracking, and revenue analytics.

## 🚀 Quick Start

```bash
cd admin-panel
npm install
npm run dev
```

Dashboard starts on **http://localhost:5174** (needs backend on port 8080)

## ✅ What's Done

| Feature | Status | Details |
|---------|--------|---------|
| Dashboard | ✅ Complete | Stats cards (revenue, orders, users, products), quick overview |
| Products | ✅ Complete | CRUD — create, edit, delete products with images, variants, pricing |
| Orders | ✅ Complete | List all orders, filter by status, update order status |
| Users | ✅ Complete | List all registered users |
| Inventory | ✅ Complete | Stock levels, low stock alerts |
| Revenue | ✅ Complete | Revenue overview with stats |
| Sidebar Nav | ✅ Complete | Collapsible sidebar with all sections |
| Responsive | ✅ Complete | Works on desktop and tablet |

## ❌ What's Left To Do

### 🔴 Must Have
- [ ] **Admin Auth** — Currently uses same JWT as users. Need admin role check or separate admin login
- [ ] **Backend URL** — Update API base URL if backend is not on localhost:8080
- [ ] **Order Detail View** — Click into order to see full details, items, address, payment status

### 🟡 Should Have
- [ ] **Revenue Charts** — Line/bar charts for daily/weekly/monthly revenue (Chart.js or Recharts)
- [ ] **Product Image Upload** — Image upload directly from admin (S3 integration)
- [ ] **Coupon Management** — Create/edit/delete coupons from admin UI
- [ ] **Order Status SMS** — Trigger SMS when changing order status (backend already sends it)
- [ ] **Bulk Actions** — Select multiple products/orders for bulk operations
- [ ] **Export to CSV** — Export orders, products, users as CSV/Excel
- [ ] **Real-time Updates** — WebSocket for live order notifications
- [ ] **Search & Filters** — Search products/users, date range filters for orders

### 🔵 Nice To Have
- [ ] **Dark Mode** — Theme toggle
- [ ] **Activity Log** — Track admin actions (who changed what)
- [ ] **Customer Support** — View customer messages/complaints
- [ ] **Shipment Management** — Create shipments, track AWB from admin
- [ ] **Refund Processing** — Process refunds from admin UI
- [ ] **Dashboard Widgets** — Customizable dashboard with drag-and-drop widgets
- [ ] **Multi-admin Roles** — Super admin, editor, viewer roles

## 🏗 Architecture

```
admin-panel/
├── src/
│   ├── App.tsx                    # Router + Layout
│   ├── main.tsx                   # Entry point
│   ├── index.css                  # Tailwind styles
│   ├── components/
│   │   └── common/
│   │       └── Sidebar.tsx        # Navigation sidebar
│   ├── pages/
│   │   ├── DashboardPage.tsx      # Stats overview
│   │   ├── ProductsPage.tsx       # Products CRUD
│   │   ├── OrdersPage.tsx         # Order management
│   │   ├── UsersPage.tsx          # User list
│   │   ├── InventoryPage.tsx      # Stock management
│   │   └── RevenuePage.tsx        # Revenue stats
│   └── services/api.ts            # Axios API client
├── tailwind.config.js
├── vite.config.ts
└── package.json
```

## 📄 License
MIT
