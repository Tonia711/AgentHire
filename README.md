# AgentHire

AI-powered Web3 service marketplace where agents help users discover, evaluate, and purchase services with wallet-based identity and crypto payments.

## Run locally

1. Install dependencies from the repository root:

```bash
npm install
```

2. Set the Supabase environment variables for the frontend. The browser uses the public anon key; the Next.js API routes also need `SUPABASE_SERVICE_ROLE_KEY` to talk to RLS-protected backend tables:

```bash
cp frontend/.env.example frontend/.env.local
```

3. Apply the migration in `backend/supabase/migrations/0001_init.sql` to your Supabase project (this creates the KiwiContract hackathon schema and demo seed data).

4. Start the frontend:

```bash
npm run dev
```

## Structure

- `frontend/` Next.js app
- `backend/` Supabase schema and migration files# AgentHire
AI-powered Web3 service marketplace where agents help users discover, evaluate, and purchase services with wallet-based identity and crypto payments.
