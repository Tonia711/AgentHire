import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { contractorId, status, walletAddress, civicPassId, attestationUid, documentHash } = await req.json();

  // Update contractor status
  const updates: any = { status, updated_at: new Date().toISOString() };
  if (walletAddress) updates.wallet_address = walletAddress;
  if (civicPassId) updates.civic_pass_id = civicPassId;

  await supabase.from('contractors').update(updates).eq('id', contractorId);

  // If attestation data provided, record it
  if (attestationUid) {
    await supabase.from('attestations').insert({
      contractor_id: contractorId,
      attestation_uid: attestationUid,
      document_hash: documentHash,
      attestation_type: status === 'kyc_complete' ? 'identity' : 'agreement',
    });
  }

  return new Response(JSON.stringify({ success: true }));
});
