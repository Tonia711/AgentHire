-- backend/supabase/seed.sql
-- Seed data for KiwiContract demonstration

-- 1. Insert Demo Business
INSERT INTO public.businesses (id, name, wallet_address, chain_id)
VALUES (
  '10000000-0000-0000-0000-000000000001',
  'Kiwi Electrical Limited',
  '0xB1ZN355000000000000000000000000000001',
  43113
)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- 2. Insert Contractors
INSERT INTO public.contractors (
  id, business_id, name, email, hourly_rate, contract_terms, wallet_address, 
  preferred_chain_id, preferred_token, status, gst_registered
)
VALUES 
(
  '20000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  'Sarah Electrician',
  'sarah@email.co.nz',
  80.00,
  'standard',
  '0xC0N7RAC7000000000000000000000000000001',
  43113, 'dNZD', 'active', true
),
(
  '20000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000001',
  'Bob Plumber',
  'bob@plumbingsquad.co.nz',
  65.00,
  'standard',
  '0xC0N7RAC7000000000000000000000000000002',
  43113, 'dNZD', 'agreement_signed', true
),
(
  '20000000-0000-0000-0000-000000000003',
  '10000000-0000-0000-0000-000000000001',
  'Alice Designer',
  'alice@designplus.co.nz',
  100.00,
  'net30',
  null,
  43113, 'dNZD', 'invited', false
)
ON CONFLICT (id) DO UPDATE SET 
  status = EXCLUDED.status, 
  wallet_address = EXCLUDED.wallet_address;

-- 3. Insert Invoices
INSERT INTO public.invoices (
  id, onchain_id, business_id, contractor_id, amount, gst_amount, token_symbol, chain_id, description, status
)
VALUES 
(
  '30000000-0000-0000-0000-000000000001',
  1,
  '10000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001',
  800.00, 120.00, 'dNZD', 43113, 'Weekly electrical maintenance (10 hours)', 'paid'
),
(
  '30000000-0000-0000-0000-000000000002',
  2,
  '10000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000002',
  1300.00, 195.00, 'dNZD', 43113, 'Office plumbing fixes (20 hours)', 'created'
)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;

-- 4. Insert Attestations
INSERT INTO public.attestations (
  id, contractor_id, attestation_uid, schema_uid, attestation_type, document_hash, chain_id
)
VALUES 
(
  '40000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001',
  '0xattestationuiddemo000000000000000000000000000000000000000000000001',
  '0xschemauiddemo000000000000000000000000000000000000000000000000000001',
  'agreement',
  '0xdoc0000000000000000000000000000000000000000000000000000000000001',
  43113
),
(
  '40000000-0000-0000-0000-000000000002',
  '20000000-0000-0000-0000-000000000001',
  '0xattestationuiddemo000000000000000000000000000000000000000000000002',
  '0xschemauiddemo000000000000000000000000000000000000000000000000000001',
  'identity',
  '0xidhash0000000000000000000000000000000000000000000000000000000002',
  43113
)
ON CONFLICT (id) DO NOTHING;

-- 5. Insert Payments (Matching the paid invoice)
INSERT INTO public.payments (
  id, invoice_id, business_id, contractor_id, chain_id, token_symbol, amount, tx_hash
)
VALUES 
(
  '50000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001',
  43113,
  'dNZD',
  920.00,
  '0xpaymenthash00000000000000000000000000000000000000000000000000001'
)
ON CONFLICT (id) DO NOTHING;
