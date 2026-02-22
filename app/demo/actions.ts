"use server";

import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { createHash } from "crypto";

const MAX_DEMO_PER_IP_PER_24H = 3;
const DEMO_EXPIRY_HOURS = 24;

async function getIpHash(): Promise<string> {
  const headersList = await headers();
  const forwarded = headersList.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? headersList.get("x-real-ip") ?? "unknown";
  const salt = process.env.DEMO_RATE_LIMIT_SECRET ?? "demo-default-salt";
  return createHash("sha256").update(ip + salt).digest("hex").slice(0, 32);
}

export type DemoCreateInput = {
  clientName: string;
  clientEmail?: string;
  currency: string;
  lineItems: { description: string; amount: number; discountPercent?: number }[];
  vatIncluded?: boolean;
  dueDate?: string;
  discountType?: "percent" | "fixed" | "none";
  discountPercent?: number;
  discountCents?: number;
};

export type DemoCreateResult =
  | { error: string }
  | { publicId: string; publicUrl: string };

export async function createDemoInvoiceAction(
  input: DemoCreateInput
): Promise<DemoCreateResult> {
  const lineItems = input.lineItems.filter(
    (i) => i.description?.trim() && typeof i.amount === "number" && i.amount > 0
  );
  if (lineItems.length === 0) {
    return { error: "Add at least one service with description and amount" };
  }

  const vatIncluded = input.vatIncluded ?? false;
  const lineTotals = lineItems.map((i) => {
    const rawCents = Math.round((i.amount || 0) * 100);
    const dp = Math.min(100, Math.max(0, i.discountPercent ?? 0));
    return Math.round(rawCents * (1 - dp / 100));
  });
  let subtotalAfterLineDiscounts = lineTotals.reduce((a, b) => a + b, 0);

  const discountType = input.discountType ?? "none";
  const discountPercent = input.discountPercent ?? 0;
  const discountCents = input.discountCents ?? 0;
  if (discountType === "percent" && discountPercent > 0) {
    subtotalAfterLineDiscounts = Math.round(subtotalAfterLineDiscounts * (1 - discountPercent / 100));
  } else if (discountType === "fixed" && discountCents > 0) {
    subtotalAfterLineDiscounts = Math.max(0, subtotalAfterLineDiscounts - discountCents);
  }

  let amountCents = subtotalAfterLineDiscounts;
  if (!vatIncluded) {
    amountCents = amountCents + Math.round(amountCents * 0.2);
  }

  if (amountCents < 100) {
    return { error: "Minimum invoice amount is £1 (or equivalent)" };
  }

  const clientName = (input.clientName ?? "").trim();
  if (!clientName) return { error: "Client name is required" };

  const ipHash = await getIpHash();
  const supabase = createAdminClient();

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("demo_invoices")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", since);

  if ((count ?? 0) >= MAX_DEMO_PER_IP_PER_24H) {
    return {
      error: "Demo limit reached (3 per day). Sign up for a free account to create unlimited invoices.",
    };
  }

  const publicId = crypto.randomUUID();
  const expiresAt = new Date(
    Date.now() + DEMO_EXPIRY_HOURS * 60 * 60 * 1000
  ).toISOString();

  const lineItemsJson = lineItems.map((i) => {
    const rawCents = Math.round((i.amount || 0) * 100);
    const dp = Math.min(100, Math.max(0, i.discountPercent ?? 0));
    return {
      description: i.description.trim(),
      amount_cents: rawCents,
      discount_percent: dp,
    };
  });

  const { error } = await supabase.from("demo_invoices").insert({
    public_id: publicId,
    ip_hash: ipHash,
    business_name: "Demo Business",
    client_name: clientName,
    client_email: input.clientEmail?.trim() || null,
    amount_cents: amountCents,
    currency: (input.currency || "GBP").toUpperCase(),
    vat_included: vatIncluded,
    due_date: input.dueDate || null,
    line_items: lineItemsJson,
    expires_at: expiresAt,
  });

  if (error) return { error: error.message };

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://puyer.org";
  const publicUrl = `${baseUrl.replace(/\/$/, "")}/i/${publicId}`;

  return { publicId, publicUrl };
}
