"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { processPendingStripeRevocations } from "@/lib/auth/process-ban-stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { revokeStripeConnectAccount } from "@/lib/stripe/revoke-connect-account";

async function logAdminAction(
  adminId: string,
  action: string,
  targetUserId: string | null,
  meta: Record<string, unknown> = {}
) {
  const admin = createAdminClient();
  await admin.from("admin_actions_log").insert({
    admin_id: adminId,
    action,
    target_user_id: targetUserId,
    meta,
  });
}

export async function adminBanUser(userId: string): Promise<{ error?: string }> {
  const { user } = await requireAdmin();
  const admin = createAdminClient();

  const { error } = await admin.rpc("ban_user_account", { p_user_id: userId });
  if (error) return { error: error.message };

  await logAdminAction(user.id, "ban_user", userId);
  revalidatePath("/admin");
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  return {};
}

export async function adminUnbanUser(userId: string): Promise<{ error?: string }> {
  const { user } = await requireAdmin();
  const admin = createAdminClient();

  const { error } = await admin.rpc("unban_user_account", { p_user_id: userId });
  if (error) return { error: error.message };

  await logAdminAction(user.id, "unban_user", userId);
  revalidatePath("/admin");
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  return {};
}

export async function adminGrantPro(userId: string): Promise<{ error?: string }> {
  const { user } = await requireAdmin();
  const admin = createAdminClient();

  const { error } = await admin.rpc("grant_pro_subscription", { p_user_id: userId });
  if (error) return { error: error.message };

  await logAdminAction(user.id, "grant_pro", userId);
  revalidatePath(`/admin/users/${userId}`);
  return {};
}

export async function adminRevokePro(userId: string): Promise<{ error?: string }> {
  const { user } = await requireAdmin();
  const admin = createAdminClient();

  const { error } = await admin.rpc("revoke_pro_subscription", { p_user_id: userId });
  if (error) return { error: error.message };

  await logAdminAction(user.id, "revoke_pro", userId);
  revalidatePath(`/admin/users/${userId}`);
  return {};
}

export async function adminRevokeStripeForUser(
  userId: string
): Promise<{ error?: string; ok?: boolean }> {
  const { user } = await requireAdmin();
  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select(
      "stripe_connect_account_id, stripe_connect_account_id_at_ban, stripe_connect_revoked_at"
    )
    .eq("id", userId)
    .single();

  const accountId =
    profile?.stripe_connect_account_id ?? profile?.stripe_connect_account_id_at_ban ?? null;

  if (!accountId) {
    return { error: "No Stripe Connect account to revoke" };
  }

  const result = await revokeStripeConnectAccount(accountId);
  if (!result.ok) return { error: result.error };

  await admin
    .from("profiles")
    .update({
      stripe_connect_account_id: null,
      stripe_connect_revoked_at: new Date().toISOString(),
      stripe_connect_account_id_at_ban: null,
    })
    .eq("id", userId);

  await logAdminAction(user.id, "revoke_stripe_connect", userId, { accountId });
  revalidatePath(`/admin/users/${userId}`);
  return { ok: true };
}

export async function adminRunStripeBanCron(): Promise<{
  processed: number;
  errors: string[];
}> {
  const { user } = await requireAdmin();
  const result = await processPendingStripeRevocations();
  await logAdminAction(user.id, "run_stripe_ban_cron", null, result);
  revalidatePath("/admin");
  return result;
}

/** Form action wrapper (no return value). */
export async function adminRunStripeBanCronAction(): Promise<void> {
  await adminRunStripeBanCron();
}
