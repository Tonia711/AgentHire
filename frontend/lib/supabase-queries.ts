import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "./supabase";

const DEMO_BUSINESS_ID = "10000000-0000-0000-0000-000000000001";

export type SupabaseContractor = {
  id: string;
  name: string;
  email: string;
  hourly_rate: number;
  wallet_address: string | null;
  status: string;
  civic_pass_id: string | null;
};

export async function fetchDemoContractor(): Promise<SupabaseContractor | null> {
  const sb = getSupabaseBrowserClient();
  if (!sb) return null;
  const { data, error } = await sb
    .from("contractors")
    .select("id,name,email,hourly_rate,wallet_address,status,civic_pass_id")
    .eq("business_id", DEMO_BUSINESS_ID)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.warn("Supabase fetchDemoContractor failed:", error.message);
    return null;
  }
  return data;
}

export async function upsertContractor(input: {
  id: string;
  name: string;
  email: string;
  hourlyRate: number;
  walletAddress: string;
  status: string;
}) {
  const sb = getSupabaseBrowserClient();
  if (!sb) return;
  const { error } = await sb.from("contractors").upsert({
    id: input.id,
    business_id: DEMO_BUSINESS_ID,
    name: input.name,
    email: input.email,
    hourly_rate: input.hourlyRate,
    wallet_address: input.walletAddress,
    status: input.status,
  });
  if (error) console.warn("Supabase upsertContractor failed:", error.message);
}

export async function updateContractorStatus(
  contractorId: string,
  status: string,
  civicPassId?: string,
) {
  const sb = getSupabaseBrowserClient();
  if (!sb) return;
  const patch: Record<string, unknown> = { status };
  if (civicPassId) patch.civic_pass_id = civicPassId;
  const { error } = await sb.from("contractors").update(patch).eq("id", contractorId);
  if (error) console.warn("Supabase updateContractorStatus failed:", error.message);
}

export async function insertInvoice(input: {
  contractorId: string;
  amount: number;
  gstAmount: number;
  description: string;
  invoiceTxHash?: string;
}) {
  const sb = getSupabaseBrowserClient();
  if (!sb) return;
  const { error } = await sb.from("invoices").insert({
    business_id: DEMO_BUSINESS_ID,
    contractor_id: input.contractorId,
    amount: input.amount,
    gst_amount: input.gstAmount,
    description: input.description,
    invoice_tx_hash: input.invoiceTxHash,
    status: "created",
  });
  if (error) console.warn("Supabase insertInvoice failed:", error.message);
}

export async function markLatestInvoicePaid(contractorId: string, txHash: string) {
  const sb = getSupabaseBrowserClient();
  if (!sb) return;
  const { data: latest, error: fetchErr } = await sb
    .from("invoices")
    .select("id")
    .eq("contractor_id", contractorId)
    .eq("status", "created")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (fetchErr || !latest) return;
  const { error } = await sb
    .from("invoices")
    .update({ status: "paid", tx_hash: txHash, paid_at: new Date().toISOString() })
    .eq("id", latest.id);
  if (error) console.warn("Supabase markLatestInvoicePaid failed:", error.message);
}

export async function recordAttestation(input: {
  contractorId: string;
  attestationUid: string;
  documentHash: string;
  txHash?: string;
}) {
  const sb = getSupabaseBrowserClient();
  if (!sb) return;
  const { error } = await sb.from("attestations").insert({
    contractor_id: input.contractorId,
    attestation_uid: input.attestationUid,
    document_hash: input.documentHash,
    tx_hash: input.txHash,
    attestation_type: "agreement",
  });
  if (error) console.warn("Supabase recordAttestation failed:", error.message);
}

// =============================================================================
// Team 2 edge-function helpers (not currently wired into the demo flow).
// Kept for parity with backend/supabase/functions and future migration off
// direct browser writes to RLS-gated edge function calls.
// =============================================================================

export async function getBusiness(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("user_id", userId)
    .single();
  if (error) throw error;
  return data;
}

export async function listContractors(supabase: SupabaseClient, businessId: string) {
  const { data, error } = await supabase
    .from("contractors")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function inviteContractorViaEdge(
  supabase: SupabaseClient,
  params: { name: string; email: string; hourlyRate: number; terms: string; businessId: string },
) {
  const { data, error } = await supabase.functions.invoke("invite-contractor", {
    body: params,
  });
  if (error) throw error;
  return data;
}

export async function createInvoiceViaEdge(
  supabase: SupabaseClient,
  params: {
    contractorId: string;
    businessId: string;
    amount: number;
    gstAmount: number;
    description: string;
    onchainId?: number;
  },
) {
  const { data, error } = await supabase
    .from("invoices")
    .insert({
      contractor_id: params.contractorId,
      business_id: params.businessId,
      amount: params.amount,
      gst_amount: params.gstAmount,
      description: params.description,
      onchain_id: params.onchainId,
      status: "created",
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateContractorStatusAndAttest(
  supabase: SupabaseClient,
  params: {
    contractorId: string;
    status: string;
    walletAddress?: string;
    civicPassId?: string;
    attestationUid?: string;
    documentHash?: string;
  },
) {
  const { data, error } = await supabase.functions.invoke("update-contractor-status", {
    body: params,
  });
  if (error) throw error;
  return data;
}

export async function logPayment(
  supabase: SupabaseClient,
  params: { invoiceId: string; txHash: string },
) {
  const { data, error } = await supabase.functions.invoke("log-payment", {
    body: params,
  });
  if (error) throw error;
  return data;
}

export async function getAttestationVault(supabase: SupabaseClient, contractorId: string) {
  const { data, error } = await supabase
    .from("attestations")
    .select("*")
    .eq("contractor_id", contractorId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}
