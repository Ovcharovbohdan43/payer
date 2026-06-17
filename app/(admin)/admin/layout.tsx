import { requireAdmin } from "@/lib/auth/require-admin";
import { AdminShell } from "@/components/layout/admin-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireAdmin();

  return (
    <AdminShell adminEmail={user.email}>{children}</AdminShell>
  );
}
