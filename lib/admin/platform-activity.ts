import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

export type ActivityCategory = "page" | "auth" | "billing" | "admin" | "system" | "funnel";

export type LogActivityInput = {
  category: ActivityCategory;
  action: string;
  userId?: string | null;
  actorId?: string | null;
  path?: string | null;
  ip?: string | null;
  meta?: Record<string, unknown>;
};

/** Server-only insert via service role (admin actions, webhooks). */
export async function logPlatformActivityAdmin(input: LogActivityInput): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from("platform_activity_log").insert({
    category: input.category,
    action: input.action,
    user_id: input.userId ?? null,
    actor_id: input.actorId ?? null,
    path: input.path ?? null,
    ip_address: input.ip ?? null,
    meta: input.meta ?? {},
  });
  if (error) {
    console.error("[platform-activity]", error.message);
  }
}

/** From middleware / user session via RPC. */
export async function logPlatformActivityRpc(
  supabase: SupabaseClient,
  input: Omit<LogActivityInput, "userId" | "actorId">
): Promise<void> {
  const { error } = await supabase.rpc("log_platform_activity", {
    p_category: input.category,
    p_action: input.action,
    p_path: input.path ?? null,
    p_ip: input.ip ?? null,
    p_meta: input.meta ?? {},
  });
  if (error) {
    console.error("[platform-activity rpc]", error.message);
  }
}

export type PlatformActivityRow = {
  id: string;
  category: string;
  action: string;
  user_id: string | null;
  actor_id: string | null;
  path: string | null;
  ip_address: string | null;
  meta: Record<string, unknown>;
  created_at: string;
};

export async function listPlatformActivity(options: {
  limit?: number;
  since?: string;
  userId?: string;
  category?: string;
}): Promise<PlatformActivityRow[]> {
  const admin = createAdminClient();
  let query = admin
    .from("platform_activity_log")
    .select("id, category, action, user_id, actor_id, path, ip_address, meta, created_at")
    .order("created_at", { ascending: false })
    .limit(options.limit ?? 80);

  if (options.since) {
    query = query.gt("created_at", options.since);
  }
  if (options.userId) {
    query = query.eq("user_id", options.userId);
  }
  if (options.category) {
    query = query.eq("category", options.category);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[platform-activity list]", error.message);
    return [];
  }
  return (data ?? []) as PlatformActivityRow[];
}
