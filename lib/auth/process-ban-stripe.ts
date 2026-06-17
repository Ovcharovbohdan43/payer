import { createAdminClient } from "@/lib/supabase/admin";
import { revokeStripeConnectAccount } from "@/lib/stripe/revoke-connect-account";

/**
 * For banned users: delete pending Stripe Connect accounts via Stripe API.
 * Called from cron after ban_user_account() snapshots acct id in stripe_connect_account_id_at_ban.
 */
export async function processPendingStripeRevocations(): Promise<{
  processed: number;
  errors: string[];
}> {
  const supabase = createAdminClient();
  const errors: string[] = [];
  let processed = 0;

  const { data: rows, error: fetchErr } = await supabase
    .from("profiles")
    .select("id, stripe_connect_account_id_at_ban")
    .eq("account_status", "banned")
    .not("stripe_connect_account_id_at_ban", "is", null)
    .is("stripe_connect_revoked_at", null);

  if (fetchErr) {
    return { processed: 0, errors: [fetchErr.message] };
  }

  for (const row of rows ?? []) {
    const accountId = row.stripe_connect_account_id_at_ban;
    if (!accountId) continue;

    const result = await revokeStripeConnectAccount(accountId);
    if (!result.ok) {
      errors.push(`${row.id}: ${result.error}`);
      continue;
    }

    if (result.mode === "pending_balance") {
      errors.push(`${row.id}: pending balance (${result.currencies.join(", ") || "unknown"})`);
      continue;
    }

    const { error: updateErr } = await supabase
      .from("profiles")
      .update({
        stripe_connect_revoked_at: new Date().toISOString(),
        stripe_connect_account_id_at_ban: null,
      })
      .eq("id", row.id);

    if (updateErr) {
      errors.push(`${row.id}: db update ${updateErr.message}`);
      continue;
    }

    processed += 1;
  }

  return { processed, errors };
}
