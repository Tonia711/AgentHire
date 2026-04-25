# Supabase Backend

The backend for this repository is Supabase.

Apply migrations in order:

1. `backend/supabase/migrations/0001_init.sql`
2. `backend/supabase/migrations/0002_payments_and_storage.sql`

These initialize the KiwiContract hackathon schema.

This migration creates:

- `businesses`: hirer organizations mapped to Supabase auth users
- `contractors`: invite + onboarding + compliance state machine
- `invoices`: off-chain mirror of on-chain `Invoice.sol` records
- `attestations`: EAS proof records (identity/agreement/payment)
- `app_status`: frontend connection status check
- `payments`: immutable payment log rows per on-chain payment tx

The migration also includes:

- `updated_at` trigger for mutable entities
- indexes for invite token and ownership lookups
- row level security policies scoped to business ownership
- Web3-friendly metadata (`chain_id`, token symbol, tx hash fields)
- seed data for local/demo development (Sarah demo flow)
- private storage bucket `contractor-docs` for contract PDFs / ID docs / signatures

## Storage path convention

Use this object path shape in the `contractor-docs` bucket so RLS works per business:

- `<business_id>/<contractor_id>/<filename>`

Example:

- `10000000-0000-0000-0000-000000000001/20000000-0000-0000-0000-000000000001/agreement.pdf`

If you are wiring the app to a real Supabase project, copy `frontend/.env.local.example` to `frontend/.env.local` and fill in your project URL and anon key.

## One-command sync script

You can sync migrations + deploy edge functions in one command from the repository root:

```bash
npm run supabase:sync -- mevlpenppzadimcpxvad
```

The script runs:

- `supabase link --workdir backend --project-ref <project-ref>`
- `supabase db push --workdir backend`
- deploys `invite-contractor`, `update-contractor-status`, and `log-payment`
