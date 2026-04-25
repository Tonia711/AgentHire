import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

type InviteContractorBody = {
  businessId: string;
  name: string;
  email: string;
  hourlyRate: number;
  terms?: string;
  preferredChainId?: number;
  preferredToken?: string;
  gstRegistered?: boolean;
};

function getEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const supabase = createClient(
      getEnv("SUPABASE_URL"),
      getEnv("SUPABASE_SERVICE_ROLE_KEY"),
    );

    const body: InviteContractorBody = await req.json();
    const {
      businessId,
      name,
      email,
      hourlyRate,
      terms = "standard",
      preferredChainId = 43113,
      preferredToken = "dNZD",
      gstRegistered = false,
    } = body;

    if (!businessId || !name || !email || Number.isNaN(hourlyRate)) {
      return jsonResponse(
        { error: "businessId, name, email, hourlyRate are required" },
        400,
      );
    }

    const { data: contractor, error } = await supabase
      .from("contractors")
      .insert({
        business_id: businessId,
        name,
        email,
        hourly_rate: hourlyRate,
        contract_terms: terms,
        preferred_chain_id: preferredChainId,
        preferred_token: preferredToken,
        status: "invited",
        gst_registered: gstRegistered,
      })
      .select()
      .single();

    if (error) {
      return jsonResponse({ error: error.message, details: error }, 400);
    }

    const frontendUrl = Deno.env.get("FRONTEND_URL") ?? "http://localhost:3000";
    const inviteLink = `${frontendUrl}/onboard/${contractor.invite_token}`;

    return jsonResponse({
      success: true,
      contractor,
      inviteLink,
      message: `Invited ${name}. Onboarding link: ${inviteLink}`,
    });
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Unknown error" },
      500,
    );
  }
});
