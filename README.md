# AgentHire

AI-powered Web3 service marketplace where agents help users discover, evaluate, and purchase services with wallet-based identity and crypto payments.

## Run locally

1. Install dependencies from the repository root:

```bash
npm install
```

2. Set the Supabase environment variables for the frontend:

```bash
cp frontend/.env.local.example frontend/.env.local
```

3. Apply the migration in `backend/supabase/migrations/0001_init.sql` to your Supabase project.

4. Start the frontend:

```bash
npm run dev
```

## Structure

- `frontend/` Next.js app
- `backend/` Supabase schema and migration files# AgentHire
AI-powered Web3 service marketplace where agents help users discover, evaluate, and purchase services with wallet-based identity and crypto payments.
