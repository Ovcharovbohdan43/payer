"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  BarChart3,
  ArrowLeft,
  Shield,
  Activity,
} from "lucide-react";
import { signOut } from "@/app/login/actions";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/activity", label: "Live activity", icon: Activity },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
];

type AdminShellProps = {
  children: React.ReactNode;
  adminEmail?: string | null;
};

export function AdminShell({ children, adminEmail }: AdminShellProps) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen min-w-0 bg-[#080B10]">
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-amber-500/10 bg-[#0B0F14]/98 backdrop-blur-xl lg:flex">
        <div className="flex h-16 items-center gap-2 border-b border-white/5 px-6">
          <Shield className="size-5 text-amber-400" />
          <span className="font-semibold text-white">Puyer Admin</span>
        </div>
        <nav className="flex-1 space-y-0.5 p-4">
          {NAV_ITEMS.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-amber-500/10 text-amber-400"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                )}
              >
                <Icon className="size-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/5 p-4">
          <Button variant="ghost" size="sm" className="mb-2 w-full justify-start" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 size-4" />
              Back to app
            </Link>
          </Button>
          {adminEmail && (
            <p className="truncate px-1 text-xs text-muted-foreground">{adminEmail}</p>
          )}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/5 bg-[#080B10]/90 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-3 lg:hidden">
            <Shield className="size-5 text-amber-400" />
            <span className="font-semibold text-white">Admin</span>
          </div>
          <div className="flex items-center gap-2 lg:ml-auto">
            <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex">
              <Link href="/dashboard">App</Link>
            </Button>
            <form action={signOut}>
              <Button variant="ghost" size="sm" type="submit">
                Sign out
              </Button>
            </form>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
