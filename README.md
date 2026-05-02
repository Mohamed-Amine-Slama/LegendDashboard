# LEGEND VAPE STORE — Admin Dashboard

CRUD interface for the storefront's product catalogue. Reads/writes the
same MongoDB cluster the storefront reads from (`vape-store-vitrine`).

Stack: Next.js 16 · React 19 · Tailwind v4 · MongoDB driver v7.
Runs on port **3001** so it doesn't clash with the storefront's 3000.

---

## First-time setup

### 1. Create a free MongoDB Atlas cluster

1. Sign up at **https://www.mongodb.com/cloud/atlas/register**
2. Create a free **M0** cluster (any cloud, any region — pick the one
   closest to you).
3. **Database Access** → "Add new database user". Pick "Password" auth,
   create a user (e.g. `lvs-admin`), set a strong password — write it
   down.
4. **Network Access** → "Add IP address" → "Allow access from anywhere"
   (`0.0.0.0/0`). Tighten this for production.
5. **Database** → "Connect" → "Drivers" → "Node.js" → copy the connection
   string. It looks like:
   ```
   mongodb+srv://lvs-admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<password>` with the actual password from step 3.

### 2. Configure both projects

The dashboard and the storefront point at the **same** cluster + database
so writes here appear there.

**Dashboard** (`legend-vape-store-dashboard/.env.local`):
```bash
MONGODB_URI=mongodb+srv://lvs-admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=legend-vape-store
ADMIN_PASSWORD=pick-something-strong-here
```

**Storefront** (`vape-store-vitrine/.env.local`):
```bash
MONGODB_URI=mongodb+srv://lvs-admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=legend-vape-store
```

> The `ADMIN_PASSWORD` only lives in the dashboard — it's the password
> you'll type to sign into the admin UI. Anyone with it can edit
> products, so use 32+ random characters in production.

### 3. Install + run

```powershell
cd "c:\Users\moham\OneDrive\Desktop\VapeStore vitrine\legend-vape-store-dashboard"
npm install
npm run dev      # → http://localhost:3001
```

Open **http://localhost:3001** — you'll be redirected to `/login`. Type
the `ADMIN_PASSWORD` you set in `.env.local`. After signing in you land
at `/products` (empty until you add some).

### 4. Verify storefront sees the changes

In a second terminal:
```powershell
cd "c:\Users\moham\OneDrive\Desktop\VapeStore vitrine\vape-store-vitrine"
npm run dev      # → http://localhost:3000
```

Add a product in the dashboard at `localhost:3001`. Refresh
`localhost:3000/shop` — the new product appears (the storefront fetches
on every page render via `lib/products.ts → fetchProducts()`).

---

## What the dashboard does

| Page | Route | Purpose |
|---|---|---|
| Login | `/login` | Single-password gate. Sets a session cookie valid 12h. |
| Product list | `/products` | Table of every product, with edit + delete. |
| New product | `/products/new` | Create form. |
| Edit product | `/products/[id]` | Edit form, prefilled. |

| API | Method | Purpose |
|---|---|---|
| `/api/auth/login` | POST | `{password}` → sets cookie |
| `/api/auth/logout` | POST | Clears cookie |
| `/api/products` | GET, POST | List / create |
| `/api/products/[id]` | GET, PUT, DELETE | Read / update / delete |

All `/api/*` routes are JSON. Middleware blocks unauthenticated requests.

---

## Architecture

```
                  ┌──────────────────────────┐
                  │   MongoDB Atlas (M0)     │
                  │   db: legend-vape-store  │
                  │   coll: products         │
                  └──────┬─────────────┬─────┘
                         │             │
            ┌────────────┴───┐   ┌────┴───────────────┐
            │ vape-store-    │   │ legend-vape-store- │
            │ vitrine        │   │ dashboard          │
            │ (storefront)   │   │ (admin CRUD)       │
            │ READS only     │   │ READS + WRITES     │
            │ port 3000      │   │ port 3001          │
            └────────────────┘   └────────────────────┘
```

The two projects deploy independently — typically:
- Storefront → Vercel (or any Next host) on the public domain
- Dashboard → separate Vercel project on `admin.<your-domain>` with
  basic-auth or VPN restriction

Both pull `MONGODB_URI` from their own host's secrets.

---

## Deploy notes

For Vercel:
1. Push this directory to its own GitHub repo (don't share with the
   storefront repo — separate concerns).
2. Vercel → Import → set env vars (`MONGODB_URI`, `MONGODB_DB`,
   `ADMIN_PASSWORD`).
3. The storefront project gets the same `MONGODB_URI` + `MONGODB_DB`
   in its Vercel env.

For added security on the dashboard host:
- Set Vercel "Password Protection" on the deployment, OR
- Run behind Cloudflare Access / a VPN, OR
- Replace the env-password auth in `lib/auth.ts` with NextAuth.js +
  email login (recommended once more than one editor exists).

---

## Schema reference

A product document looks like:

```ts
{
  _id: ObjectId,
  name: "Strawberry Mint Pod",
  category: "PODS" | "PUFFS" | "CAPSULES" | "LIQUID",
  description: "Crisp, icy, with a hint of menthol bite.",
  priceTND: 12,
  nicotineMg: 0 | 10 | 20 | 50,
  mlSize: 1 | 2 | 4 | 10 | 30,        // omit for PUFFS
  puffCount: 600,                       // only for PUFFS
  caffeinated: false,
  brand: "LEGEND VAPE STORE Original" | "MAX" | "PRO" | "LITE",
  flavorFamily: "Fruity" | "Minty" | "Creamy" | "Tobacco" | "Sweet" | "Icy",
  flavorColor: "#C8273A",
  imageUrl: "https://…",                // any URL, or local /products/foo.png
  propImageUrl: "https://…",            // optional decoration on card
  badge: "NEW" | "HOT" | "MAX" | undefined,
  releaseOrder: 1718000000,             // higher = newer (NEWEST sort)
  featuredOrder: 0,                     // lower = first (FEATURED sort)
  inStock: true,
  createdAt: "2026-05-02T…Z",
  updatedAt: "2026-05-02T…Z"
}
```

Both projects keep their own copy of this type. When you change a field,
update **both** `lib/types.ts` (here) and
`vape-store-vitrine/types/mongo.ts`.
