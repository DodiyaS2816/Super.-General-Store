# Meridian &mdash; E-Commerce Web Application

A basic online store with product management and order tracking, built to match this spec:

- ✅ Product catalog, add to cart, and checkout functionality
- ✅ User login and role-based access (Admin / User)
- ✅ Backend REST APIs for product & order management
- ✅ Database integration (SQL database, schema below)

## Stack

- **Backend:** Node.js, Express, JWT auth, bcrypt password hashing
- **Database:** SQLite (via `better-sqlite3`) &mdash; a full relational SQL database with zero setup. It uses the same SQL model as MySQL/PostgreSQL (see "Swapping the database" below to point this at either instead).
- **Frontend:** Vanilla HTML/CSS/JS single-page app (no build step), served statically by Express

## Quick start

```bash
cd backend
npm install
npm start
```

Then open **http://localhost:4000** in your browser. The database and demo data (2 users, 8 products) are created automatically on first run.

### Demo accounts

| Role  | Email             | Password |
|-------|-------------------|----------|
| Admin | admin@example.com | admin123 |
| User  | user@example.com  | user123  |

Sign in as the **admin** to reach the Admin panel (product CRUD + order status updates). Sign in as the **user** (or register a new account) to shop as a regular customer.

## What's included

**Storefront (any signed-in user):**
- Browse/search/filter the product catalog
- Add items to cart, adjust quantities, remove items
- Checkout &rarr; creates an order, decrements stock, clears the cart
- View personal order history with status

**Admin panel (admin role only):**
- Create, edit, and delete products
- View **all** customers' orders
- Update order status (pending &rarr; processing &rarr; shipped &rarr; delivered / cancelled)

**Backend API** (`backend/routes/`):
- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `GET /api/products`, `GET /api/products/:id`, `GET /api/products/categories`
- `POST/PUT/DELETE /api/products/:id` (admin only)
- `GET/POST/PUT/DELETE /api/cart` (any logged-in user, scoped to themselves)
- `POST /api/orders/checkout`, `GET /api/orders`, `PUT /api/orders/:id/status` (admin only)

All product-mutation and order-status routes are protected by JWT + role middleware (`backend/middleware/auth.js`), so a regular user hitting them directly gets a `403`.

## Project structure

```
ecommerce-app/
├── backend/
│   ├── server.js            # Express app entry point
│   ├── db/
│   │   ├── database.js      # SQLite connection + schema
│   │   ├── seed.js          # Demo users/products (idempotent)
│   │   └── ecommerce.sqlite # created on first run (gitignored)
│   ├── middleware/auth.js   # JWT verification + role guard
│   └── routes/
│       ├── auth.js
│       ├── products.js
│       ├── cart.js
│       └── orders.js
└── frontend/
    ├── index.html
    ├── css/style.css
    └── js/
        ├── api.js           # fetch wrapper + auth/token storage
        └── app.js           # hash-router + all views
```

## Swapping the database

The app was built against plain SQL, so moving to MySQL or PostgreSQL mainly touches `backend/db/database.js`:

1. Install a driver: `npm install mysql2` or `npm install pg`.
2. Replace the `better-sqlite3` connection in `database.js` with a connection pool for your engine, and convert the schema's `INTEGER PRIMARY KEY AUTOINCREMENT` to `INT AUTO_INCREMENT PRIMARY KEY` (MySQL) or `SERIAL PRIMARY KEY` (PostgreSQL).
3. The route files (`routes/*.js`) use `db.prepare(sql).get/all/run(...)`, a synchronous API specific to `better-sqlite3`. With `mysql2`/`pg` you'd await an async `pool.query(sql, params)` call instead — the SQL strings themselves need little to no change.

To use MongoDB instead, you'd swap `database.js` for a Mongoose/MongoDB client and rewrite the route handlers' queries as document operations (`find`, `insertOne`, etc.) instead of SQL — the REST endpoints, auth flow, and frontend wouldn't need to change at all.

## Notes

- JWTs are signed with a dev secret in `middleware/auth.js`. Set a real `JWT_SECRET` environment variable before deploying anywhere public.
- Product images use placeholder URLs (picsum.photos) — swap in real product photos via the Admin panel's image URL field.
