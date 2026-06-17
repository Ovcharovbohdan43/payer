"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  adminBanUser,
  adminUnbanUser,
  adminGrantPro,
  adminRevokePro,
  adminRevokeStripeForUser,
  adminDeleteUser,
} from "@/lib/admin/actions";

type AdminUserActionsProps = {
  userId: string;
  userEmail?: string | null;
  accountStatus: string;
  subscriptionStatus: string | null;
  hasStripeConnect: boolean;
  hasStripeToRevoke: boolean;
  isTargetAdmin?: boolean;
};

export function AdminUserActions({
  userId,
  userEmail,
  accountStatus,
  subscriptionStatus,
  hasStripeConnect,
  hasStripeToRevoke,
  isTargetAdmin,
}: AdminUserActionsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"success" | "warning" | "error">("success");

  async function run(
    action: string,
    fn: () => Promise<{ error?: string; warning?: string }>
  ) {
    setLoading(action);
    setMessage(null);
    const result = await fn();
    setLoading(null);
    if (result.error) {
      setMessageTone("error");
      setMessage(result.error);
    } else if (result.warning) {
      setMessageTone("warning");
      setMessage(result.warning);
    } else {
      setMessageTone("success");
      setMessage("Done");
      window.location.reload();
    }
  }

  async function handleDelete() {
    const label = userEmail ?? userId;
    const confirmed = window.confirm(
      `Permanently delete account ${label}?\n\nThis removes auth, profile, invoices, clients, and all related data. This cannot be undone.`
    );
    if (!confirmed) return;

    setLoading("delete");
    setMessage(null);
    const result = await adminDeleteUser(userId);
    setLoading(null);
    if (result.error) {
      setMessageTone("error");
      setMessage(result.error);
    } else {
      window.location.href = "/admin/users";
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
            disabled={!!loading || isTargetAdmin}
            onClick={() => run("unban", () => adminUnbanUser(userId))}
          >
            {loading === "unban" ? "…" : "Unban user"}
          </Button>
        ) : (
          <Button
            size="sm"
            variant="destructive"
            disabled={!!loading || isTargetAdmin}
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

        {!isTargetAdmin && (
          <Button
            size="sm"
            variant="outline"
            className="border-[#3B82F6]/40 text-[#3B82F6]"
            disabled={!!loading}
            onClick={() => {
              setMessageTone("success");
              setMessage(
                "Opening a new tab as this user. Both tabs share the same login — sign in again to return to admin."
              );
              window.open(
                `/api/admin/impersonate?userId=${encodeURIComponent(userId)}`,
                "_blank",
                "noopener,noreferrer"
              );
            }}
          >
            Sign in as user
          </Button>
        )}

        {!isTargetAdmin && (
          <Button
            size="sm"
            variant="destructive"
            disabled={!!loading}
            onClick={() => void handleDelete()}
          >
            {loading === "delete" ? "…" : "Delete account"}
          </Button>
        )}
      </div>
      {isTargetAdmin && (
        <p className="text-xs text-amber-400">Admin accounts cannot be banned, impersonated, or deleted here.</p>
      )}
      {message && (
        <p
          className={`text-sm ${
            messageTone === "success"
              ? "text-green-400"
              : messageTone === "warning"
                ? "text-amber-400"
                : "text-red-400"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
