create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  contractor_id uuid not null references public.contractors(id) on delete cascade,
  chain_id bigint not null default 43113,
  token_symbol text not null default 'dNZD',
  amount numeric(10,2) not null check (amount >= 0),
  tx_hash text not null unique,
  paid_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_payments_invoice_id on public.payments(invoice_id);
create index if not exists idx_payments_business_id on public.payments(business_id);
create index if not exists idx_payments_contractor_id on public.payments(contractor_id);
create index if not exists idx_payments_chain_id_paid_at on public.payments(chain_id, paid_at desc);

alter table public.payments enable row level security;

drop policy if exists "Business sees own payments" on public.payments;
create policy "Business sees own payments"
on public.payments
for all
using (
  auth.role() = 'service_role'
  or business_id in (select b.id from public.businesses b where b.user_id = auth.uid())
)
with check (
  auth.role() = 'service_role'
  or business_id in (select b.id from public.businesses b where b.user_id = auth.uid())
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'contractor-docs',
  'contractor-docs',
  false,
  10485760,
  array['application/pdf', 'image/png', 'image/jpeg']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Business can read own contractor docs" on storage.objects;
create policy "Business can read own contractor docs"
on storage.objects
for select
using (
  bucket_id = 'contractor-docs'
  and (
    auth.role() = 'service_role'
    or (storage.foldername(name))[1] in (
      select b.id::text from public.businesses b where b.user_id = auth.uid()
    )
  )
);

drop policy if exists "Business can upload own contractor docs" on storage.objects;
create policy "Business can upload own contractor docs"
on storage.objects
for insert
with check (
  bucket_id = 'contractor-docs'
  and (
    auth.role() = 'service_role'
    or (storage.foldername(name))[1] in (
      select b.id::text from public.businesses b where b.user_id = auth.uid()
    )
  )
);

drop policy if exists "Business can update own contractor docs" on storage.objects;
create policy "Business can update own contractor docs"
on storage.objects
for update
using (
  bucket_id = 'contractor-docs'
  and (
    auth.role() = 'service_role'
    or (storage.foldername(name))[1] in (
      select b.id::text from public.businesses b where b.user_id = auth.uid()
    )
  )
)
with check (
  bucket_id = 'contractor-docs'
  and (
    auth.role() = 'service_role'
    or (storage.foldername(name))[1] in (
      select b.id::text from public.businesses b where b.user_id = auth.uid()
    )
  )
);

drop policy if exists "Business can delete own contractor docs" on storage.objects;
create policy "Business can delete own contractor docs"
on storage.objects
for delete
using (
  bucket_id = 'contractor-docs'
  and (
    auth.role() = 'service_role'
    or (storage.foldername(name))[1] in (
      select b.id::text from public.businesses b where b.user_id = auth.uid()
    )
  )
);
