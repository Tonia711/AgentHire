import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

type CivicEvent = {
  type?: string;
  event?: string;
  status?: string;
  verificationStatus?: string;
  contractorId?: string;
  contractor_id?: string;
  email?: string;
  civicPassId?: string;
  civic_pass_id?: string;
  attestationUid?: string;
  attestation_uid?: string;
  schemaUid?: string;
  schema_uid?: string;
  documentHash?: string;
  document_hash?: string;
  txHash?: string;
  tx_hash?: string;
  chainId?: number;
  chain_id?: number;
};

function getEnv(name: string): string | undefined {
  const value = Deno.env.get(name);
  return value && value.trim().length > 0 ? value : undefined;
}

function toHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacSha256Hex(secret: string, payload: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  );
  return toHex(new Uint8Array(signature));
}

async function verifySignature(payload: string, signatureHeader: string | null) {
  const webhookSecret = getEnv("CIVIC_WEBHOOK_SECRET");
  if (!webhookSecret) {
    return { ok: true, reason: "secret-not-set" };
  }
  if (!signatureHeader) {
    return { ok: false, reason: "missing-signature-header" };
  }

  const expectedHex = await hmacSha256Hex(webhookSecret, payload);
  const candidates = [
    signatureHeader.trim(),
    signatureHeader.replace(/^sha256=/i, "").trim(),
  ];
  const expectedBase64 = btoa(
    String.fromCharCode(...expectedHex.match(/.{1,2}/g)!.map((b) => parseInt(b, 16))),
  );
  candidates.push(expectedBase64);

  const ok = candidates.includes(expectedHex);
  return { ok, reason: ok ? "verified" : "signature-mismatch" };
}

function isKycApproved(event: CivicEvent) {
  const value = `${event.type ?? event.event ?? event.status ?? event.verificationStatus ?? ""}`.toLowerCase();
  return (
    value.includes("kyc_complete") ||
    value.includes("kyc_approved") ||
    value.includes("approved") ||
    value.includes("verified")
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const payloadText = await req.text();
    const signatureHeader =
      req.headers.get("x-civic-signature") ??
      req.headers.get("civic-signature") ??
      req.headers.get("x-signature");
    const verified = await verifySignature(payloadText, signatureHeader);
    if (!verified.ok) {
      return jsonResponse({ error: `Webhook rejected: ${verified.reason}` }, 401);
    }

    const event: CivicEvent = JSON.parse(payloadText);
    if (!isKycApproved(event)) {
      return jsonResponse({
        success: true,
        skipped: true,
        reason: "Event is not a KYC-approved status.",
      });
    }

    const supabaseUrl = getEnv("SUPABASE_URL");
    const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse(
        { error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" },
        500,
      );
    }
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const contractorId = event.contractorId ?? event.contractor_id;
    const email = event.email;
    if (!contractorId && !email) {
      return jsonResponse(
        { error: "contractorId/contractor_id or email is required in webhook payload" },
        400,
      );
    }

    let contractorQuery = supabase
      .from("contractors")
      .update({
        status: "kyc_complete",
        civic_pass_id: event.civicPassId ?? event.civic_pass_id ?? "civic-pass-verified",
        updated_at: new Date().toISOString(),
      })
      .select()
      .limit(1);

    contractorQuery = contractorId
      ? contractorQuery.eq("id", contractorId)
      : contractorQuery.eq("email", email!);

    const { data: contractors, error: updateError } = await contractorQuery;
    if (updateError) {
      return jsonResponse({ error: updateError.message, details: updateError }, 400);
    }
    if (!contractors || contractors.length === 0) {
      return jsonResponse({ error: "Contractor not found" }, 404);
    }

    let attestation = null;
    const attestationUid = event.attestationUid ?? event.attestation_uid;
    if (attestationUid) {
      const { data, error } = await supabase
        .from("attestations")
        .upsert(
          {
            contractor_id: contractors[0].id,
            attestation_uid: attestationUid,
            schema_uid: event.schemaUid ?? event.schema_uid,
            attestation_type: "identity",
            document_hash: event.documentHash ?? event.document_hash,
            tx_hash: event.txHash ?? event.tx_hash,
            chain_id: event.chainId ?? event.chain_id ?? 43113,
          },
          { onConflict: "attestation_uid" },
        )
        .select()
        .single();
      if (error) {
        return jsonResponse({ error: error.message, details: error }, 400);
      }
      attestation = data;
    }

    return jsonResponse({
      success: true,
      contractor: contractors[0],
      attestation,
      message: "Contractor marked as kyc_complete from Civic webhook.",
    });
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Unknown error" },
      500,
    );
  }
});
