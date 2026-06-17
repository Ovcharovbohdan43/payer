"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  adminBanUser,
  adminUnbanUser,
  adminGrantPro,
  adminRevokePro,
  adminRevokeStripeForUser,
} from "@/lib/admin/actions";

type AdminUserActionsProps = {
  userId: string;
  accountStatus: string;
  subscriptionStatus: string | null;
  hasStripeConnect: boolean;
  hasStripeToRevoke: boolean;
};

export function AdminUserActions({
  userId,
  accountStatus,
  subscriptionStatus,
  hasStripeConnect,
  hasStripeToRevoke,
}: AdminUserActionsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function run(action: string, fn: () => Promise<{ error?: string }>) {
    setLoading(action);
    setMessage(null);
    const result = await fn();
    setLoading(null);
    if (result.error) {
      setMessage(result.error);
    } else {
      setMessage("Done");
      window.location.reload();
    }
  }

  const isBanned = accountStatus === "banned";
  const isPro =
    subscriptionStatus === "active" || subscriptionStatus === "trialing";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {isBanned ? (
          <Button
            size="sm"
            variant="outline"
            disabled={!!loading}
            onClick={() => run("unban", () => adminUnbanUser(userId))}
          >
            {loading === "unban" ? "…" : "Unban user"}
          </Button>
        ) : (
          <Button
            size="sm"
            variant="destructive"
            disabled={!!loading}
            onClick={() => run("ban", () => adminBanUser(userId))}
          >
            {loading === "ban" ? "…" : "Ban user"}
          </Button>
        )}

        {isPro ? (
          <Button
            size="sm"
            variant="outline"
            disabled={!!loading}
            onClick={() => run("revoke_pro", () => adminRevokePro(userId))}
          >
            {loading === "revoke_pro" ? "…" : "Revoke Pro"}
          </Button>
        ) : (
          <Button
            size="sm"
            variant="secondary"
            disabled={!!loading}
            onClick={() => run("grant_pro", () => adminGrantPro(userId))}
          >
            {loading === "grant_pro" ? "…" : "Grant Pro"}
          </Button>
        )}

        {(hasStripeConnect || hasStripeToRevoke) && (
          <Button
            size="sm"
            variant="outline"
            className="border-amber-500/40 text-amber-400"
            disabled={!!loading}
            onClick={() => run("stripe", () => adminRevokeStripeForUser(userId))}
          >
            {loading === "stripe" ? "…" : "Revoke Stripe Connect"}
          </Button>
        )}
      </div>
      {message && (
        <p className={`text-sm ${message === "Done" ? "text-green-400" : "text-red-400"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
