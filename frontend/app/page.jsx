'use client';

import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '../lib/supabase';

export default function HomePage() {
  const [message, setMessage] = useState('Connecting to Supabase...');

  useEffect(() => {
    const client = getSupabaseBrowserClient();

    if (!client) {
      setMessage('Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to connect the frontend to Supabase.');
      return;
    }

    let active = true;

    client
      .from('app_status')
      .select('name,value,updated_at')
      .eq('name', 'backend')
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) {
          return;
        }

        if (error) {
          setMessage(`Supabase connected, but the demo table returned an error: ${error.message}`);
          return;
        }

        if (!data) {
          setMessage('Supabase connected, but no demo row was found yet. Apply the migration in backend/supabase/migrations/0001_init.sql.');
          return;
        }

        setMessage(`Supabase online: ${data.value} @ ${data.updated_at}`);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="shell">
      <section className="card">
        <p className="eyebrow">AgentHire</p>
        <h1>Next.js frontend with Supabase backend</h1>
        <p className="lede">
          The app is wired to a public Supabase status table so the frontend can verify the backend connection immediately.
        </p>
        <div className="status">{message}</div>
      </section>
    </main>
  );
}