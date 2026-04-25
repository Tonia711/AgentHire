import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Team 2 Provides these Supabase Helper Queries for Team 1 (Frontend & AI Agent)
 */

// 1. Get business entity info (based on current User ID)
export async function getBusiness(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error) throw error;
  return data;
}

// 2. Get all contractors under this business entity
export async function listContractors(supabase: SupabaseClient, businessId: string) {
  const { data, error } = await supabase
    .from('contractors')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

// 3. Invite a contractor (via Edge Function)
export async function inviteContractor(
  supabase: SupabaseClient, 
  params: { name: string; email: string; hourlyRate: number; terms: string; businessId: string }
) {
  const { data, error } = await supabase.functions.invoke('invite-contractor', {
    body: params,
  });
  if (error) throw error;
  return data;
}

// 4. Create a new on-chain invoice record (direct database insert)
export async function createInvoice(
  supabase: SupabaseClient, 
  params: { contractorId: string; businessId: string; amount: number; gstAmount: number; description: string; onchainId?: number }
) {
  const { data, error } = await supabase
    .from('invoices')
    .insert({
      contractor_id: params.contractorId,
      business_id: params.businessId,
      amount: params.amount,
      gst_amount: params.gstAmount,
      description: params.description,
      onchain_id: params.onchainId,
      status: 'created'
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// 5. Update contractor status & attestation details (via Edge Function)
export async function updateContractorStatusAndAttest(
  supabase: SupabaseClient, 
  params: { contractorId: string; status: string; walletAddress?: string; civicPassId?: string; attestationUid?: string; documentHash?: string }
) {
  const { data, error } = await supabase.functions.invoke('update-contractor-status', {
    body: params,
  });
  if (error) throw error;
  return data;
}

// 6. Log payment hash, update invoice to paid (via Edge Function)
export async function logPayment(
  supabase: SupabaseClient, 
  params: { invoiceId: string; txHash: string }
) {
  const { data, error } = await supabase.functions.invoke('log-payment', {
    body: params,
  });
  if (error) throw error;
  return data;
}

// 7. Data Vault: Query all on-chain attestation records for a contractor
export async function getAttestationVault(supabase: SupabaseClient, contractorId: string) {
  const { data, error } = await supabase
    .from('attestations')
    .select('*')
    .eq('contractor_id', contractorId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}
