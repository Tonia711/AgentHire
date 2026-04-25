# Supabase Backend

The backend for this repository is Supabase.

Apply the migration in `backend/supabase/migrations/0001_init.sql` to initialize the KiwiContract hackathon schema.

This migration creates:

- `businesses`: hirer organizations mapped to Supabase auth users
- `contractors`: invite + onboarding + compliance state machine
- `invoices`: off-chain mirror of on-chain `Invoice.sol` records
- `attestations`: EAS proof records (identity/agreement/payment)
- `app_status`: frontend connection status check

The migration also includes:

- `updated_at` trigger for mutable entities
- indexes for invite token and ownership lookups
- row level security policies scoped to business ownership
- Web3-friendly metadata (`chain_id`, token symbol, tx hash fields)
- seed data for local/demo development (Sarah demo flow)

If you are wiring the app to a real Supabase project, copy `frontend/.env.local.example` to `frontend/.env.local` and fill in your project URL and anon key.
