create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  contractor_id uuid not null references public.contractors(id) on delete cascade,
  title text not null,
  description text not null,
  category text not null,
  price_nzd numeric(10,2) not null check (price_nzd >= 0),
  gst_nzd numeric(10,2) not null default 0 check (gst_nzd >= 0),
  token_symbol text not null default 'dNZD',
  chain_id bigint not null default 43113,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_services_contractor_id on public.services(contractor_id);
create index if not exists idx_services_active on public.services(active);

alter table public.services enable row level security;

drop policy if exists "Public read active services" on public.services;
create policy "Public read active services"
on public.services
for select
using (active = true or auth.role() = 'service_role');

drop policy if exists "Service role manages services" on public.services;
create policy "Service role manages services"
on public.services
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

alter table public.invoices add column if not exists service_id uuid references public.services(id) on delete set null;
create index if not exists idx_invoices_service_id on public.invoices(service_id);

insert into public.services (id, contractor_id, title, description, category, price_nzd, gst_nzd)
values
  (
    '50000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    'Residential electrical inspection',
    'Full home electrical safety inspection with written report. Up to 4 hours on-site.',
    'electrical',
    320.00,
    48.00
  ),
  (
    '50000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000001',
    'Switchboard upgrade',
    'Replace old fuse-based switchboard with modern RCD-protected unit. Materials included.',
    'electrical',
    1450.00,
    217.50
  ),
  (
    '50000000-0000-0000-0000-000000000003',
    '20000000-0000-0000-0000-000000000001',
    'Emergency callout (after hours)',
    'Same-day response for electrical faults. Minimum 1 hour, billed in 30-min increments.',
    'electrical',
    180.00,
    27.00
  )
on conflict (id) do nothing;
