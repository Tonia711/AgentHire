import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

type UpdateContractorStatusBody = {
  contractorId: string;
  status:
    | "invited"
    | "kyc_pending"
    | "kyc_complete"
    | "agreement_signed"
    | "active"
    | "paused";
  walletAddress?: string;
  civicPassId?: string;
  attestationUid?: string;
  schemaUid?: string;
  documentHash?: string;
  txHash?: string;
  chainId?: number;
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

  if (req.method !== "POST" && req.method !== "PATCH") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const supabase = createClient(
      getEnv("SUPABASE_URL"),
      getEnv("SUPABASE_SERVICE_ROLE_KEY"),
    );

    const body: UpdateContractorStatusBody = await req.json();
    const {
      contractorId,
      status,
      walletAddress,
      civicPassId,
      attestationUid,
      schemaUid,
      documentHash,
      txHash,
      chainId = 43113,
    } = body;

    if (!contractorId || !status) {
      return jsonResponse({ error: "contractorId and status are required" }, 400);
    }

    const updates: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (walletAddress) updates.wallet_address = walletAddress;
    if (civicPassId) updates.civic_pass_id = civicPassId;

    const { data: contractor, error: updateError } = await supabase
      .from("contractors")
      .update(updates)
      .eq("id", contractorId)
      .select()
      .single();

    if (updateError) {
      return jsonResponse({ error: updateError.message, details: updateError }, 400);
    }

    let attestation = null;
    if (attestationUid) {
      const attestationType =
        status === "kyc_complete"
          ? "identity"
          : status === "agreement_signed"
            ? "agreement"
            : "payment";

      const { data, error } = await supabase
        .from("attestations")
        .insert({
          contractor_id: contractorId,
          attestation_uid: attestationUid,
          schema_uid: schemaUid,
          attestation_type: attestationType,
          document_hash: documentHash,
          tx_hash: txHash,
          chain_id: chainId,
        })
        .select()
        .single();

      if (error) {
        return jsonResponse({ error: error.message, details: error }, 400);
      }
      attestation = data;
    }

    return jsonResponse({
      success: true,
      contractor,
      attestation,
    });
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Unknown error" },
      500,
    );
  }
});
