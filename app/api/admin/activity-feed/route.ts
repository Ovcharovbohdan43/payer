import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isUserAdmin } from "@/lib/auth/require-admin";
import { listPlatformActivity } from "@/lib/admin/platform-activity";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isUserAdmin(supabase, user.id))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const since = searchParams.get("since") ?? undefined;
  const userId = searchParams.get("userId") ?? undefined;
  const category = searchParams.get("category") ?? undefined;
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 50));

  const events = await listPlatformActivity({ since, userId, category, limit });

  return NextResponse.json({ events });
}
