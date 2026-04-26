import type { SupabaseClient } from "@supabase/supabase-js";

const DEMO_BUSINESS_ID = "10000000-0000-0000-0000-000000000001";

async function readJson<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(payload?.error ?? "Backend request failed");
  }
  return payload;
}

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
  try {
    const payload = await readJson<{ contractors: SupabaseContractor[] }>(
      await fetch(`/api/contractors?businessId=${DEMO_BUSINESS_ID}`),
    );
    return payload.contractors[0] ?? null;
  } catch (error) {
    console.warn(
      "Backend fetchDemoContractor failed:",
      error instanceof Error ? error.message : "unknown error",
    );
    return null;
  }
}

export async function upsertContractor(input: {
  id: string;
  name: string;
  email: string;
  hourlyRate: number;
  walletAddress: string;
  status: string;
}) {
  try {
    await readJson(
      await fetch("/api/contractors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: DEMO_BUSINESS_ID,
          name: input.name,
          email: input.email,
          hourlyRate: input.hourlyRate,
          walletAddress: input.walletAddress,
          status: input.status,
          terms: "standard",
        }),
      }),
    );
  } catch (error) {
    console.warn(
      "Backend upsertContractor failed:",
      error instanceof Error ? error.message : "unknown error",
    );
  }
}

export async function updateContractorStatus(
  contractorId: string,
  status: string,
  civicPassId?: string,
) {
  try {
    await readJson(
      await fetch(`/api/contractors/${contractorId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, civicPassId }),
      }),
    );
  } catch (error) {
    console.warn(
      "Backend updateContractorStatus failed:",
      error instanceof Error ? error.message : "unknown error",
    );
  }
}

export async function insertInvoice(input: {
  contractorId: string;
  amount: number;
  gstAmount: number;
  description: string;
  invoiceTxHash?: string;
}) {
  try {
    await readJson(
      await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: DEMO_BUSINESS_ID,
          contractorId: input.contractorId,
          amount: input.amount,
          gstAmount: input.gstAmount,
          description: input.description,
          invoiceTxHash: input.invoiceTxHash,
        }),
      }),
    );
  } catch (error) {
    console.warn(
      "Backend insertInvoice failed:",
      error instanceof Error ? error.message : "unknown error",
    );
  }
}

export async function markLatestInvoicePaid(contractorId: string, txHash: string) {
  try {
    const payload = await readJson<{
      invoices: Array<{ id: string; contractor_id: string; status: string }>;
    }>(await fetch(`/api/invoices?businessId=${DEMO_BUSINESS_ID}`));
    const latest = payload.invoices.find(
      (invoice) => invoice.contractor_id === contractorId && invoice.status === "created",
    );

    if (!latest) return;

    await readJson(
      await fetch(`/api/invoices/${latest.id}/paid`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txHash }),
      }),
    );
  } catch (error) {
    console.warn(
      "Backend markLatestInvoicePaid failed:",
      error instanceof Error ? error.message : "unknown error",
    );
  }
}

export async function recordAttestation(input: {
  contractorId: string;
  attestationUid: string;
  documentHash: string;
  txHash?: string;
}) {
  await updateContractorStatus(input.contractorId, "agreement_signed");
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
