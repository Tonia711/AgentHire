import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

function getEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Only allow POST
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const supabase = createClient(
      getEnv("SUPABASE_URL"),
      getEnv("SUPABASE_SERVICE_ROLE_KEY"),
    );

    const body = await req.json();
    const { businessId } = body;

    if (!businessId) {
      return jsonResponse({ error: "businessId is required" }, 400);
    }

    // Fetch all paid invoices for the business
    const { data: invoices, error } = await supabase
      .from("invoices")
      .select(`
        amount, 
        gst_amount, 
        contractor_id
      `)
      .eq("business_id", businessId)
      .eq("status", "paid");

    if (error) {
      return jsonResponse({ error: error.message, details: error }, 400);
    }

    // Placeholder for NZ IR330C logic (20% default withholding tax rate)
    const WITHHOLDING_RATE = 0.20;

    let totalPayments = 0;
    let totalGstCollected = 0;
    let totalWithheld = 0;

    if (invoices && invoices.length > 0) {
      for (const inv of invoices) {
        const amt = Number(inv.amount || 0);
        const gst = Number(inv.gst_amount || 0);
        
        totalPayments += (amt + gst);
        totalGstCollected += gst;
        // Withholding is typically calculated on the base amount
        totalWithheld += (amt * WITHHOLDING_RATE);
      }
    }

    return jsonResponse({
      success: true,
      summary: {
        totalPayments,
        totalGstCollected,
        totalWithheld,
      },
      message: "Tax summary retrieved successfully",
    });

  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Unknown error" },
      500,
    );
  }
});
