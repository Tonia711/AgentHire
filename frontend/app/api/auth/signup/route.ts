import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "../../../../lib/supabase-server";

type SignupRole = "business" | "contractor";

function isSignupRole(value: unknown): value is SignupRole {
  return value === "business" || value === "contractor";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const displayName = String(body.displayName ?? "").trim();
    const role = body.role;

    if (!email || !password || !isSignupRole(role)) {
      return NextResponse.json(
        { error: "email, password, and role are required" },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 },
      );
    }

    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        display_name: displayName,
        role,
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (role === "business" && data.user) {
      const { error: businessError } = await supabase
        .from("businesses")
        .upsert(
          {
            user_id: data.user.id,
            name: displayName || email,
            chain_id: 43113,
          },
          { onConflict: "user_id" },
        );

      if (businessError) {
        return NextResponse.json({ error: businessError.message }, { status: 400 });
      }
    }

    return NextResponse.json({
      user: {
        id: data.user?.id,
        email: data.user?.email,
        role,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
