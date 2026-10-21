# Kluck v2

Standalone copy of the Kluck stack. **Does not modify** `kluck-ai/` or `kluck-embeded/`.

| Piece | Tech |
|--|--|
| Frontend | `v2/frontend` → **Vercel** (Shopify embedded app) |
| Backend | `v2/backend` → **Fly.io** |
| Database + Auth | **Supabase** (Postgres + Auth) |
| Images | **Bunny Storage** (CDN URLs stored in Supabase) |
| Crisp / PostHog | Disabled unless env keys are set |

## Local setup

### 1. Supabase

1. Create a project.
2. Run SQL in `backend/supabase/migrations/20261021_001_init.sql` (SQL editor).
3. Copy Project URL, anon key, service role, JWT secret, and Postgres connection string.

### 2. Bunny

1. Create a Storage Zone + Pull Zone.
2. Set `BUNNY_STORAGE_ZONE`, `BUNNY_ACCESS_KEY`, `BUNNY_STORAGE_HOST`, `BUNNY_CDN_HOSTNAME`.

### 3. Backend

```bash
cd v2/backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill values
python script.py       # http://localhost:5001
```

### 4. Frontend

```bash
cd v2/frontend
npm install
cp .env.example .env.local   # fill values
npx prisma migrate dev --name init_session_pg
npm run dev
```

Create a **new** Shopify Partner app; set `shopify.app.toml` `client_id` + `application_url` to your Vercel URL (not prod `kluckyv5`).

### 5. Supabase Auth

Enable Email (or magic link) in Supabase Auth. Frontend helpers:

- `app/lib/supabase.client.js`
- `app/lib/supabase.server.js`

Pass the Supabase access token as `Authorization: Bearer <token>` to the Python API (replaces Cognito).

## Deploy

### Backend → Fly

```bash
cd v2/backend
fly launch --config fly.toml   # or fly apps create kluck-v2-api
fly secrets set DATABASE_URL=... SUPABASE_URL=... SUPABASE_JWT_SECRET=... \
  BUNNY_STORAGE_ZONE=... BUNNY_ACCESS_KEY=... BUNNY_CDN_HOSTNAME=... \
  SHOPIFY_APP_CLIENT_ID=... SHOPIFY_APP_SECRET=... \
  FRONTEND_URL=https://YOUR_V2.vercel.app BACKEND_URL=https://kluck-v2-api.fly.dev \
  OPENAI_API_KEY=... GEMINI_API_KEY=...
fly deploy
```

### Frontend → Vercel

- Root directory: `v2/frontend`
- Env: `SHOPIFY_*`, `PYTHON_API_URL=https://kluck-v2-api.fly.dev`, `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`
- Leave `PUBLIC_POSTHOG_KEY` and `CRISP_WEBSITE_ID` empty

## Smoke check

```bash
cd v2/backend && source venv/bin/activate
python scripts/smoke_v2.py
```

## What was removed vs v1

- AWS Cognito → Supabase Auth  
- AWS DynamoDB / boto3 → Supabase Postgres document store (`document_store`)  
- AWS S3 module → `app/modules/storage` (Bunny)  
- Deleted: `app/modules/aws`, `s3_client`, Dynamo table setup scripts, S3 upload scripts, Fly/Litestream frontend session volume files  
- Crisp / PostHog optional (off by default)
