import Link from "next/link";
import { listAdminUsers } from "@/lib/admin/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { isAccountPendingReview } from "@/lib/invoices/creation-limit";

type PageProps = {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
};

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const search = params.q ?? "";
  const status =
    params.status === "banned" ||
    params.status === "active" ||
    params.status === "pending_review"
      ? params.status
      : "all";
  const page = Math.max(1, Number(params.page) || 1);
  const limit = 40;
  const offset = (page - 1) * limit;

  const { users, total } = await listAdminUsers({
    search,
    status,
    limit,
    offset,
  });

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total} total · search by name or email
          </p>
        </div>
      </div>

      <form className="flex flex-col gap-3 sm:flex-row sm:items-center" method="get">
        <Input
          name="q"
          defaultValue={search}
          placeholder="Search name or email…"
          className="max-w-md border-white/10 bg-[#121821]"
        />
        <select
          name="status"
          defaultValue={status}
          className="h-10 rounded-md border border-white/10 bg-[#121821] px-3 text-sm text-white"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="pending_review">New — pending review</option>
          <option value="banned">Banned</option>
        </select>
        <Button type="submit">Search</Button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-white/[0.06] bg-white/[0.02] text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Business</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 font-medium">Stripe</th>
              <th className="px-4 py-3 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-white/[0.04] transition-colors hover:bg-white/[0.02]"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/users/${u.id}`}
                      className="font-medium text-white hover:text-[#3B82F6]"
                    >
                      {u.business_name || "—"}
                      {u.is_admin && (
                        <Badge className="ml-2 bg-amber-500/20 text-amber-400">Admin</Badge>
                      )}
                      {isAccountPendingReview(u) && (
                        <Badge className="ml-2 bg-yellow-500/20 text-yellow-300">New</Badge>
                      )}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="outline"
                      className={
                        u.account_status === "banned"
                          ? "border-red-500/40 text-red-400"
                          : "border-green-500/30 text-green-400"
                      }
                    >
                      {u.account_status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 capitalize text-muted-foreground">
                    {u.subscription_status ?? "free"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {u.stripe_connect_account_id
                      ? "Connected"
                      : u.stripe_connect_revoked_at
                        ? "Revoked"
                        : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <Button variant="outline" size="sm" asChild>
              <Link
                href={`/admin/users?q=${encodeURIComponent(search)}&status=${status}&page=${page - 1}`}
              >
                Previous
              </Link>
            </Button>
          )}
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Button variant="outline" size="sm" asChild>
              <Link
                href={`/admin/users?q=${encodeURIComponent(search)}&status=${status}&page=${page + 1}`}
              >
                Next
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
