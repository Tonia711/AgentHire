import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { name, email, hourlyRate, terms, businessId } = await req.json();

  // Create contractor row
  const { data: contractor, error } = await supabase
    .from('contractors')
    .insert({
      business_id: businessId,
      name,
      email,
      hourly_rate: hourlyRate,
      contract_terms: terms,
      status: 'invited',
    })
    .select()
    .single();

  if (error) return new Response(JSON.stringify({ error }), { status: 400 });

  // In production: send email with invite link
  // For hackathon: return the invite token for manual testing
  const inviteLink = `${Deno.env.get('FRONTEND_URL')}/onboard/${contractor.invite_token}`;

  return new Response(JSON.stringify({
    success: true,
    contractor,
    inviteLink,
    message: `Invited ${name}. Onboarding link: ${inviteLink}`,
  }));
});
