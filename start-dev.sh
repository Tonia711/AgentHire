#!/usr/bin/env bash

# Stop on error
set -e

echo "============================================="
echo "🚀 Starting One-Click Integration Task (Frontend + Cloud DB)"
echo "============================================="

# Your dedicated Supabase cloud project reference ID
PROJECT_REF="jqqondvcxreffukewznp"
SUPABASE_URL="https://${PROJECT_REF}.supabase.co"

echo "============================================="
echo "[1/4] Syncing local schema and policies to the cloud environment..."
echo "👉 Note: You might be prompted to enter the [database password] for your project"
supabase db push

echo ""
echo "[2/4] Injecting fake seed data into your cloud database..."
supabase db query --file backend/supabase/seed.sql --linked

echo ""
echo "[3/4] Checking and configuring frontend .env keys..."
cd frontend
if [ ! -f .env.local ]; then
    touch .env.local
fi

if ! grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env.local; then
    echo "⚠️  Could not find public API keys in frontend/.env.local."
    echo "Please open this URL and find the [anon key] starting with eyJhbG :"
    echo "👉 https://supabase.com/dashboard/project/${PROJECT_REF}/settings/api"
    echo ""
    read -p "Please paste your [anon key] here and press Enter: " ANON_KEY
    echo "NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}" > .env.local
    echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=${ANON_KEY}" >> .env.local
    echo "✅ Configuration written to .env.local!"
else
    echo "✅ Found existing .env.local configuration, skipping manual input."
fi

echo ""
echo "[4/4] Installing frontend dependencies and starting local server..."
npm install
echo "✅ Installation complete! Starting Next.js server now..."
echo "👉 Please open your browser and visit: http://localhost:3000"
echo "---------------------------------------------"
npm run dev
