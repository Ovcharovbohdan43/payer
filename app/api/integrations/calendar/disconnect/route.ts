import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_PROVIDERS = ["google_calendar", "microsoft_calendar"] as const;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: { provider?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const provider = body?.provider;
    if (!provider || !ALLOWED_PROVIDERS.includes(provider as (typeof ALLOWED_PROVIDERS)[number])) {
      return NextResponse.json(
        { error: "Missing or invalid provider (google_calendar | microsoft_calendar)" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("integration_connections")
      .delete()
      .eq("user_id", user.id)
      .eq("provider", provider);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[calendar disconnect]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
