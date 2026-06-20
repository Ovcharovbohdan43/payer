"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showErrorToast } from "@/components/ui/form-error-toast";
import {
  adminApproveSellerPayments,
  adminFlagSellerPayments,
} from "@/lib/admin/actions";

type Props = {
  userId: string;
  paymentsEnabled: boolean;
  paymentRiskStatus: string;
  paymentRiskNotes: string | null;
  paymentsVerifiedAt: string | null;
  payoutHoldUntil: string | null;
  stripeConnected: boolean;
  isTargetAdmin?: boolean;
};

export function AdminPaymentRiskControls({
  userId,
  paymentsEnabled,
  paymentRiskStatus,
  paymentRiskNotes,
  paymentsVerifiedAt,
  payoutHoldUntil,
  stripeConnected,
  isTargetAdmin,
}: Props) {
  const [note, setNote] = useState(paymentRiskNotes ?? "");
  const [loading, setLoading] = useState<string | null>(null);

  if (isTargetAdmin) {
    return (
      <p className="text-sm text-muted-foreground">Admin accounts are exempt from payment risk controls.</p>
    );
  }

  async function run(action: "approve" | "flag") {
    setLoading(action);
    const result =
      action === "approve"
        ? await adminApproveSellerPayments(userId, note || undefined)
        : await adminFlagSellerPayments(userId, note || "Manual review");
    setLoading(null);
    if (result.error) {
      showErrorToast(result.error);
      return;
    }
    window.location.reload();
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-white/80">
        <p>
          <span className="text-muted-foreground">Status:</span> {paymentRiskStatus.replace(/_/g, " ")}
        </p>
        <p className="mt-1">
          <span className="text-muted-foreground">Payments enabled:</span>{" "}
          {paymentsEnabled ? "Yes" : "No"}
        </p>
        {paymentsVerifiedAt && (
          <p className="mt-1 text-xs text-muted-foreground">
            Verified: {new Date(paymentsVerifiedAt).toLocaleString("en-GB")}
          </p>
        )}
        {payoutHoldUntil && (
          <p className="mt-1 text-xs text-muted-foreground">
            Payout hold until: {new Date(payoutHoldUntil).toLocaleString("en-GB")}
          </p>
        )}
        {stripeConnected && (
          <p className="mt-1 text-xs text-muted-foreground">Stripe Connect linked</p>
        )}
      </div>

      <div>
        <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Note / flag reason
        </label>
        <Input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Verification notes or flag reason"
          className="mt-1 h-10 border-white/10 bg-[#0B0F14]"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          disabled={!!loading}
          onClick={() => run("approve")}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          {loading === "approve" ? "Approving…" : "Approve payments"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="destructive"
          disabled={!!loading}
          onClick={() => run("flag")}
        >
          {loading === "flag" ? "Flagging…" : "Flag & pause payments"}
        </Button>
      </div>
    </div>
  );
}
