import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

type LogPaymentBody = {
  invoiceId?: string;
  onchainId?: number;
  chainId?: number;
  txHash: string;
  contractorId?: string;
  amount?: number;
  tokenSymbol?: string;
  paidAt?: string;
  markContractorActive?: boolean;
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

    const body: LogPaymentBody = await req.json();
    const {
      invoiceId,
      onchainId,
      chainId = 43113,
      txHash,
      contractorId,
      amount,
      tokenSymbol,
      paidAt,
      markContractorActive = true,
    } = body;

    if (!txHash || (!invoiceId && onchainId === undefined)) {
      return jsonResponse(
        { error: "txHash and (invoiceId or onchainId) are required" },
        400,
      );
    }

    const paymentTimestamp = paidAt ?? new Date().toISOString();
    const updatePayload = {
      status: "paid",
      tx_hash: txHash,
      paid_at: paymentTimestamp,
    };

    let invoiceQuery = supabase.from("invoices").update(updatePayload);
    if (invoiceId) {
      invoiceQuery = invoiceQuery.eq("id", invoiceId);
    } else {
      invoiceQuery = invoiceQuery.eq("onchain_id", onchainId).eq("chain_id", chainId);
    }

    const { data: invoices, error: invoiceError } = await invoiceQuery.select();
    if (invoiceError) {
      return jsonResponse({ error: invoiceError.message, details: invoiceError }, 400);
    }

    if (!invoices || invoices.length === 0) {
      return jsonResponse({ error: "Invoice not found" }, 404);
    }

    const invoice = invoices[0];
    const resolvedContractorId = contractorId ?? invoice.contractor_id;
    const resolvedAmount = amount ?? Number(invoice.amount);
    const resolvedTokenSymbol = tokenSymbol ?? invoice.token_symbol ?? "dNZD";

    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .upsert(
        {
          invoice_id: invoice.id,
          business_id: invoice.business_id,
          contractor_id: resolvedContractorId,
          chain_id: chainId,
          token_symbol: resolvedTokenSymbol,
          amount: resolvedAmount,
          tx_hash: txHash,
          paid_at: paymentTimestamp,
        },
        { onConflict: "tx_hash" },
      )
      .select()
      .single();

    if (paymentError) {
      return jsonResponse({ error: paymentError.message, details: paymentError }, 400);
    }

    let contractor = null;
    if (markContractorActive && resolvedContractorId) {
      const { data, error } = await supabase
        .from("contractors")
        .update({
          status: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("id", resolvedContractorId)
        .select()
        .single();

      if (error) {
        return jsonResponse({ error: error.message, details: error }, 400);
      }
      contractor = data;
    }

    return jsonResponse({
      success: true,
      invoice,
      payment,
      contractor,
      message: "Payment logged, payment row created, and invoice marked as paid.",
    });
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Unknown error" },
      500,
    );
  }
});
