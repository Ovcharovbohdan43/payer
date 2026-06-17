import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminUserDetail } from "@/lib/admin/queries";
import { AdminUserActions } from "@/components/admin/admin-user-actions";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatAmount } from "@/lib/invoices/utils";

type PageProps = { params: Promise<{ id: string }> };

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-white">{value ?? "—"}</dd>
    </div>
  );
}

export default async function AdminUserDetailPage({ params }: PageProps) {
  const { id } = await params;
  const detail = await getAdminUserDetail(id);
  if (!detail) notFound();

  const { profile, email, counts } = detail;
  const hasStripe =
    !!profile.stripe_connect_account_id || !!profile.stripe_connect_account_id_at_ban;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <ButtonBack />
        <h1 className="mt-2 text-2xl font-bold text-white">
          {profile.business_name || email || "User"}
        </h1>
        <p className="mt-1 font-mono text-xs text-muted-foreground">{profile.id}</p>
      </div>

      <Card className="border-white/[0.06] bg-[#121821]/90 p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Actions
        </h2>
        <AdminUserActions
          userId={profile.id}
          accountStatus={profile.account_status}
          subscriptionStatus={profile.subscription_status}
          hasStripeConnect={!!profile.stripe_connect_account_id}
          hasStripeToRevoke={hasStripe}
        />
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-white/[0.06] bg-[#121821]/90 p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Account
          </h2>
          <dl className="grid gap-4 sm:grid-cols-2">
            <Field label="Email" value={email} />
            <Field
              label="Status"
              value={
                <Badge
                  variant="outline"
                  className={
                    profile.account_status === "banned"
                      ? "border-red-500/40 text-red-400"
                      : "border-green-500/30 text-green-400"
                  }
                >
                  {profile.account_status}
                </Badge>
              }
            />
            <Field label="Subscription" value={profile.subscription_status ?? "free"} />
            <Field label="Country" value={profile.country} />
            <Field
              label="Joined"
              value={new Date(profile.created_at).toLocaleString()}
            />
            <Field
              label="Last sign-in"
              value={
                detail.lastSignIn
                  ? new Date(detail.lastSignIn).toLocaleString()
                  : "—"
              }
            />
            <Field label="Onboarding" value={profile.onboarding_completed ? "Done" : "Pending"} />
            <Field label="Admin" value={profile.is_admin ? "Yes" : "No"} />
          </dl>
        </Card>

        <Card className="border-white/[0.06] bg-[#121821]/90 p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Stripe Connect
          </h2>
          <dl className="grid gap-4">
            <Field
              label="Account ID"
              value={
                profile.stripe_connect_account_id ??
                profile.stripe_connect_account_id_at_ban ??
                "—"
              }
            />
            <Field
              label="Revoked at"
              value={
                profile.stripe_connect_revoked_at
                  ? new Date(profile.stripe_connect_revoked_at).toLocaleString()
                  : "—"
              }
            />
            <Field
              label="Stripe customer"
              value={profile.stripe_customer_id ?? "—"}
            />
          </dl>
        </Card>

        <Card className="border-white/[0.06] bg-[#121821]/90 p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Business profile
          </h2>
          <dl className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" value={`${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim()} />
            <Field label="Business" value={profile.business_name} />
            <Field label="Phone" value={profile.phone} />
            <Field label="Website" value={profile.website} />
            <Field label="VAT" value={profile.vat_number} />
            <Field label="Company no." value={profile.company_number} />
            <Field label="Currency" value={profile.default_currency} />
            <Field label="Timezone" value={profile.timezone} />
          </dl>
        </Card>

        <Card className="border-white/[0.06] bg-[#121821]/90 p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Usage
          </h2>
          <dl className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-white">{counts.invoices}</p>
              <p className="text-xs text-muted-foreground">Invoices</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{counts.clients}</p>
              <p className="text-xs text-muted-foreground">Clients</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{counts.offers}</p>
              <p className="text-xs text-muted-foreground">Offers</p>
            </div>
          </dl>
          {detail.review && (
            <div className="mt-4 border-t border-white/[0.06] pt-4">
              <p className="text-xs text-muted-foreground">Rate Us review</p>
              <p className="mt-1 text-sm text-white">
                {detail.review.rating}/5 — {detail.review.comment || "(no comment)"}
              </p>
            </div>
          )}
        </Card>
      </div>

      <Card className="border-white/[0.06] bg-[#121821]/90 p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          IP log & blocklist
        </h2>
        {detail.bannedEmail && (
          <p className="mb-3 text-sm text-red-400">
            Email blocked: {detail.bannedEmail.email} (since{" "}
            {new Date(detail.bannedEmail.banned_at).toLocaleDateString()})
          </p>
        )}
        {detail.bannedIps.length > 0 && (
          <p className="mb-3 text-sm text-red-400">
            IPs blocked: {detail.bannedIps.map((i) => i.ip_address).join(", ")}
          </p>
        )}
        {detail.ipLog.length === 0 ? (
          <p className="text-sm text-muted-foreground">No IPs logged yet.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {detail.ipLog.map((row) => (
              <li key={row.ip_address} className="flex justify-between text-muted-foreground">
                <span className="font-mono text-white">{row.ip_address}</span>
                <span>{new Date(row.last_seen_at).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="border-white/[0.06] bg-[#121821]/90 p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Recent invoices
        </h2>
        {detail.recentInvoices.length === 0 ? (
          <p className="text-sm text-muted-foreground">No invoices.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Amount</th>
                  <th className="pb-2 font-medium">Created</th>
                  <th className="pb-2 font-medium">Public</th>
                </tr>
              </thead>
              <tbody>
                {detail.recentInvoices.map((inv) => (
                  <tr key={inv.id} className="border-t border-white/[0.04]">
                    <td className="py-2 capitalize">{inv.status}</td>
                    <td className="py-2">
                      {formatAmount(Number(inv.amount_cents), inv.currency)}
                    </td>
                    <td className="py-2 text-muted-foreground">
                      {new Date(inv.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-2">
                      <Link
                        href={`/i/${inv.public_id}`}
                        className="text-[#3B82F6] hover:underline"
                        target="_blank"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="border-white/[0.06] bg-[#121821]/90 p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Audit log
        </h2>
        {detail.auditLogs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No audit entries.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {detail.auditLogs.map((log) => (
              <li key={log.id} className="flex flex-wrap gap-2 text-muted-foreground">
                <span>{new Date(log.created_at).toLocaleString()}</span>
                <span className="text-white">
                  {log.entity_type}.{log.action}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function ButtonBack() {
  return (
    <Link
      href="/admin/users"
      className="text-sm text-muted-foreground hover:text-white"
    >
      ← All users
    </Link>
  );
}
