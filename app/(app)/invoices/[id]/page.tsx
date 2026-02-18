import { createClient } from "@/lib/supabase/server";
import { getInvoiceById } from "@/app/invoices/actions";
import { getPublicInvoiceUrl } from "@/lib/invoices/utils";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatAmount, STATUS_LABELS, type InvoiceStatus } from "@/lib/invoices/utils";
import { InvoiceDetailClient } from "@/app/invoices/[id]/invoice-detail-client";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const invoice = await getInvoiceById(id);
  if (!invoice) notFound();

  const status = invoice.status as InvoiceStatus;
  const statusVariant =
    status === "paid"
      ? "bg-emerald-500/20 text-emerald-400"
      : status === "overdue"
        ? "bg-red-500/20 text-red-400"
        : "bg-blue-500/20 text-blue-400";

  return (
    <div className="min-h-screen bg-[#0B0F14]">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/invoices" className="text-muted-foreground hover:text-foreground">
              ← Invoices
            </Link>
          </Button>
        </div>

        <div className="space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span
                className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${statusVariant}`}
              >
                {STATUS_LABELS[status] ?? status}
              </span>
              <h1 className="mt-3 text-3xl font-bold tabular-nums">
                {formatAmount(invoice.amount_cents, invoice.currency)}
              </h1>
              <p className="mt-1 text-muted-foreground">
                {invoice.number} · {invoice.client_name}
              </p>
            </div>
          </div>

          {invoice.description && (
            <p className="text-sm text-muted-foreground">{invoice.description}</p>
          )}
          {invoice.notes && (
            <p className="text-sm text-muted-foreground">Notes: {invoice.notes}</p>
          )}

          <Timeline invoice={invoice} />

          <InvoiceDetailClient
            invoiceId={invoice.id}
            publicUrl={getPublicInvoiceUrl(invoice.public_id, BASE_URL)}
            status={status}
            canVoid={status !== "void" && status !== "paid"}
            canMarkPaid={status !== "paid" && status !== "void"}
          />

          {invoice.paid_at && (
            <section className="rounded-[20px] border border-white/5 bg-[#121821]/80 p-6 backdrop-blur">
              <h2 className="text-sm font-medium text-muted-foreground">Payment</h2>
              <p className="mt-1 text-sm">
                Paid{" "}
                {new Date(invoice.paid_at).toLocaleDateString("en-US", {
                  dateStyle: "medium",
                })}
                {invoice.stripe_payment_intent_id && (
                  <span className="ml-2 text-muted-foreground">
                    (Stripe: {invoice.stripe_payment_intent_id.slice(0, 20)}…)
                  </span>
                )}
              </p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function Timeline({
  invoice,
}: {
  invoice: {
    created_at: string;
    sent_at: string | null;
    viewed_at: string | null;
    paid_at: string | null;
    status: string;
  };
}) {
  const steps = [
    { label: "Created", at: invoice.created_at },
    { label: "Sent", at: invoice.sent_at },
    { label: "Viewed", at: invoice.viewed_at },
    {
      label: invoice.status === "paid" ? "Paid" : "Overdue",
      at: invoice.paid_at,
    },
  ].filter((s) => s.at);

  if (steps.length === 0) return null;

  return (
    <section className="rounded-[20px] border border-white/5 bg-[#121821]/80 p-6 backdrop-blur">
      <h2 className="mb-3 text-sm font-medium text-muted-foreground">Timeline</h2>
      <ul className="space-y-3">
        {steps.map((step, i) => (
          <li key={i} className="flex items-center gap-3 text-sm">
            <span className="size-2 shrink-0 rounded-full bg-[#3B82F6]" />
            <span>{step.label}</span>
            <span className="text-muted-foreground">
              {new Date(step.at!).toLocaleString("en-US", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
