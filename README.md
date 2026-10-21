# Roarr

AI-powered Shopify app for generating storefronts and product pages.

| Piece | Tech |
|--|--|
| Frontend | `frontend/` → **Vercel** (embedded Shopify app) |
| Backend | `backend/` → **Fly.io** |
| Database + Auth | **Supabase** (Postgres + Auth) |
| Images | **Bunny Storage** (CDN URLs in Postgres) |

## Local setup

### 1. Supabase

1. Create a project.
2. Run `backend/supabase/migrations/20261021_001_init.sql` in the SQL editor.
3. Copy Project URL, anon key, service role key, JWT secret, and Postgres URL.

### 2. Bunny

Create a Storage Zone + Pull Zone, then set:

`BUNNY_STORAGE_ZONE`, `BUNNY_ACCESS_KEY`, `BUNNY_STORAGE_HOST`, `BUNNY_CDN_HOSTNAME`

### 3. Backend

```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill values
python script.py       # http://localhost:5001
```

### 4. Frontend

```bash
cd frontend
npm install
cp .env.example .env.local   # fill values
npx prisma migrate dev --name init_session_pg
npm run dev
```

Create a Shopify Partner app for Roarr and set `frontend/shopify.app.toml` (`client_id`, `application_url`, `name`).

### 5. Auth

Enable Email (or magic link) in Supabase Auth. The frontend uses:

- `frontend/app/lib/supabase.client.js`
- `frontend/app/lib/supabase.server.js`

Send the Supabase access token as `Authorization: Bearer <token>` to the Python API.

## Deploy

### Backend → Fly

```bash
cd backend
fly launch --config fly.toml   # or: fly apps create roarr-api
fly secrets set DATABASE_URL=... SUPABASE_URL=... SUPABASE_JWT_SECRET=... \
  BUNNY_STORAGE_ZONE=... BUNNY_ACCESS_KEY=... BUNNY_CDN_HOSTNAME=... \
  SHOPIFY_APP_CLIENT_ID=... SHOPIFY_APP_SECRET=... \
  FRONTEND_URL=https://YOUR_APP.vercel.app BACKEND_URL=https://roarr-api.fly.dev \
  OPENAI_API_KEY=... GEMINI_API_KEY=...
fly deploy
```

### Frontend → Vercel

- Root directory: `frontend`
- Env: `SHOPIFY_*`, `PYTHON_API_URL=https://roarr-api.fly.dev`, `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

## Smoke check

```bash
cd backend && source venv/bin/activate
python scripts/smoke_v2.py
```

## Stack notes

- Auth: Supabase Auth (JWT)
- Data: Supabase Postgres document store
- Media: Bunny CDN via `app/modules/storage`
- Themes: **Swift** (stores), **Aura** (product pages)
