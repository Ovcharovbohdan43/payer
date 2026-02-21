import { createClient } from "@/lib/supabase/server";
import { getClientById, getClientStats } from "@/app/clients/actions";
import { formatAmount } from "@/lib/invoices/utils";
import { STATUS_LABELS, type InvoiceStatus } from "@/lib/invoices/utils";
import { OFFER_STATUS_LABELS, type OfferStatus } from "@/lib/offers/utils";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { Button } from "@/components/ui/button";

export default async function ClientDetailPage({
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

  const [client, stats] = await Promise.all([
    getClientById(id),
    getClientStats(id),
  ]);

  if (!client) notFound();
  if (!stats) notFound();

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("default_currency, business_name, address, phone, company_number, vat_number")
    .eq("id", user.id)
    .single();
  const currency = profileRow?.default_currency ?? "USD";

  const total = stats.totalPaidCents + stats.totalUnpaidCents;
  const paidPercent = total > 0 ? (stats.totalPaidCents / total) * 100 : 0;
  const unpaidPercent = total > 0 ? (stats.totalUnpaidCents / total) * 100 : 0;

  return (
    <div className="min-h-screen bg-[#0B0F14]">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-4 sm:mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link
              href="/clients"
              className="text-muted-foreground hover:text-foreground"
            >
              ← Clients
            </Link>
          </Button>
        </div>

        <div className="mb-8 space-y-4">
          <h1 className="text-2xl font-bold sm:text-3xl">{client.name}</h1>

          {/* Client contact information */}
          <div className="rounded-xl border border-white/5 bg-[#121821]/60 p-4 sm:p-5">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
              Client contact information
            </h2>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Company</dt>
                <dd className="font-medium">{client.company_name || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Address</dt>
                <dd>{client.address || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Email</dt>
                <dd>
                  {client.email ? (
                    <a href={`mailto:${client.email}`} className="text-[#3B82F6] hover:underline">
                      {client.email}
                    </a>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Phone</dt>
                <dd>
                  {client.phone ? (
                    <a href={`tel:${client.phone}`} className="text-[#3B82F6] hover:underline">
                      {client.phone}
                    </a>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">VAT number</dt>
                <dd>{client.vat_number || "—"}</dd>
              </div>
            </dl>
          </div>

          {/* Your business (invoicing from) */}
          {(profileRow?.business_name || profileRow?.address || profileRow?.phone || profileRow?.company_number || profileRow?.vat_number) && (
            <div className="rounded-xl border border-white/5 bg-[#121821]/60 p-4 sm:p-5">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
                Your business (invoicing from)
              </h2>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                {profileRow?.business_name && (
                  <div>
                    <dt className="text-muted-foreground">Company</dt>
                    <dd className="font-medium">{profileRow.business_name}</dd>
                  </div>
                )}
                {profileRow?.address && (
                  <div>
                    <dt className="text-muted-foreground">Address</dt>
                    <dd>{profileRow.address}</dd>
                  </div>
                )}
                {profileRow?.phone && (
                  <div>
                    <dt className="text-muted-foreground">Phone</dt>
                    <dd>{profileRow.phone}</dd>
                  </div>
                )}
                {profileRow?.company_number && (
                  <div>
                    <dt className="text-muted-foreground">Company number</dt>
                    <dd>{profileRow.company_number}</dd>
                  </div>
                )}
                {profileRow?.vat_number && (
                  <div>
                    <dt className="text-muted-foreground">VAT number</dt>
                    <dd>{profileRow.vat_number}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}
        </div>

        {/* Stats cards */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <StatCard
            label="Total paid"
            value={formatAmount(stats.totalPaidCents, currency)}
            variant="success"
          />
          <StatCard
            label="Total unpaid"
            value={formatAmount(stats.totalUnpaidCents, currency)}
            variant="warning"
          />
          <StatCard
            label="Avg payment time"
            value={
              stats.avgPaymentDays != null
                ? `${stats.avgPaymentDays} days`
                : "—"
            }
            variant="neutral"
          />
          <StatCard
            label="Invoices"
            value={`${stats.paidCount} paid / ${stats.unpaidCount} unpaid`}
            variant="neutral"
          />
        </div>

        {/* Paid vs Unpaid visualization */}
        {total > 0 && (
          <section className="mb-8 rounded-2xl border border-white/[0.06] bg-[#121821]/90 p-5 sm:p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground/80">
              Paid vs unpaid
            </h2>
            <div className="flex h-8 overflow-hidden rounded-lg bg-white/5">
              {paidPercent > 0 && (
                <div
                  className="bg-emerald-500/60 transition-all"
                  style={{ width: `${paidPercent}%` }}
                  title={`Paid: ${formatAmount(stats.totalPaidCents, currency)}`}
                />
              )}
              {unpaidPercent > 0 && (
                <div
                  className="bg-amber-500/60 transition-all"
                  style={{ width: `${unpaidPercent}%` }}
                  title={`Unpaid: ${formatAmount(stats.totalUnpaidCents, currency)}`}
                />
              )}
            </div>
            <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500/60" />
                Paid {formatAmount(stats.totalPaidCents, currency)}
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-500/60" />
                Unpaid {formatAmount(stats.totalUnpaidCents, currency)}
              </span>
            </div>
          </section>
        )}

        {/* Transactions: Invoices + Offers */}
        <section className="rounded-2xl border border-white/[0.06] bg-[#121821]/90 p-5 sm:p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground/80">
            Transactions
          </h2>

          {stats.invoices.length === 0 && stats.offers.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No invoices or offers yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {stats.invoices.map((inv) => (
                <li key={`inv-${inv.id}`}>
                  <Link
                    href={`/invoices/${inv.id}`}
                    className="flex items-center justify-between gap-4 rounded-lg px-3 py-2.5 transition-colors hover:bg-white/5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{inv.number}</p>
                      <p className="text-xs text-muted-foreground">Invoice</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium tabular-nums">
                        {formatAmount(Number(inv.amount_cents), inv.currency)}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          inv.status === "paid"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : inv.status === "overdue"
                              ? "bg-red-500/20 text-red-400"
                              : "bg-blue-500/20 text-blue-400"
                        }`}
                      >
                        {STATUS_LABELS[inv.status as InvoiceStatus] ?? inv.status}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
              {stats.offers.map((off) => (
                <li key={`off-${off.id}`}>
                  <Link
                    href={`/offers/${off.id}`}
                    className="flex items-center justify-between gap-4 rounded-lg px-3 py-2.5 transition-colors hover:bg-white/5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{off.number}</p>
                      <p className="text-xs text-muted-foreground">Offer</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium tabular-nums">
                        {formatAmount(Number(off.amount_cents), off.currency)}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          off.status === "accepted"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : off.status === "declined"
                              ? "bg-red-500/20 text-red-400"
                              : "bg-blue-500/20 text-blue-400"
                        }`}
                      >
                        {OFFER_STATUS_LABELS[off.status as OfferStatus] ??
                          off.status}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  variant,
}: {
  label: string;
  value: string;
  variant: "success" | "warning" | "neutral";
}) {
  const colors = {
    success: "border-emerald-500/20 bg-emerald-500/5",
    warning: "border-amber-500/20 bg-amber-500/5",
    neutral: "border-white/10 bg-white/5",
  };
  return (
    <div
      className={`rounded-xl border p-4 ${colors[variant]}`}
    >
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-bold tabular-nums sm:text-xl">{value}</p>
    </div>
  );
}
