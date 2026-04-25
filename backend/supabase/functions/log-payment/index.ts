import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { invoiceId, txHash } = await req.json();

  const { error } = await supabase
    .from('invoices')
    .update({ 
      status: 'paid', 
      tx_hash: txHash,
      paid_at: new Date().toISOString()
    })
    .eq('id', invoiceId);

  if (error) {
    return new Response(JSON.stringify({ error }), { status: 400 });
  }

  return new Response(JSON.stringify({ success: true }));
});
