import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "../../../lib/supabase-server";

export async function GET(req: NextRequest) {
  try {
    const businessId = req.nextUrl.searchParams.get("businessId");
    if (!businessId) {
      return NextResponse.json({ error: "businessId is required" }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ invoices: data ?? [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      businessId,
      contractorId,
      amount,
      gstAmount = 0,
      description,
      onchainId,
      tokenSymbol = "dNZD",
      chainId = 43113,
    } = body;

    if (!businessId || !contractorId || typeof amount !== "number") {
      return NextResponse.json(
        { error: "businessId, contractorId, amount are required" },
        { status: 400 },
      );
    }

    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("invoices")
      .insert({
        business_id: businessId,
        contractor_id: contractorId,
        amount,
        gst_amount: gstAmount,
        description,
        onchain_id: onchainId,
        token_symbol: tokenSymbol,
        chain_id: chainId,
        status: "created",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ invoice: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
