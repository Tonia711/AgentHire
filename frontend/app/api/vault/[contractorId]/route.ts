import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "../../../../lib/supabase-server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ contractorId: string }> },
) {
  try {
    const { contractorId } = await params;
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("attestations")
      .select("*")
      .eq("contractor_id", contractorId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ attestations: data ?? [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
