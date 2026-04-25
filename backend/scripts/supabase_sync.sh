#!/usr/bin/env bash

set -euo pipefail

PROJECT_REF="${1:-}"

if [ -z "$PROJECT_REF" ]; then
  echo "Usage: bash backend/scripts/supabase_sync.sh <project-ref>"
  exit 1
fi

if ! command -v supabase >/dev/null 2>&1; then
  echo "Supabase CLI not found. Install with: brew install supabase/tap/supabase"
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT_DIR"

echo "Linking to project: $PROJECT_REF"
supabase link --workdir backend --project-ref "$PROJECT_REF"

echo "Applying database migrations..."
supabase db push --workdir backend

echo "Deploying edge functions..."
supabase functions deploy invite-contractor --workdir backend --project-ref "$PROJECT_REF"
supabase functions deploy update-contractor-status --workdir backend --project-ref "$PROJECT_REF"
supabase functions deploy log-payment --workdir backend --project-ref "$PROJECT_REF"

echo "Done. Supabase backend synced for project: $PROJECT_REF"
