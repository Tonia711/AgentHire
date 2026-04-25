import { NextRequest, NextResponse } from "next/server";
import { callEdgeFunction } from "../../../../../lib/supabase-server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const payload = await callEdgeFunction(
      "update-contractor-status",
      {
        contractorId: id,
        ...body,
      },
      "PATCH",
    );
    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 },
    );
  }
}
