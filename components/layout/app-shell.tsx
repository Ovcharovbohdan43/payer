"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, FileText, Users, Settings, Bell } from "lucide-react";
import { signOut } from "@/app/login/actions";
import { MobileNav } from "./mobile-nav";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

type AppShellProps = {
  children: React.ReactNode;
  businessName: string;
};

export function AppShell({ children, businessName }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-[#0B0F14]">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-white/5 bg-[#0B0F14]/95 backdrop-blur-xl md:flex">
        <div className="flex h-16 items-center border-b border-white/5 px-6">
          <Link href="/dashboard" className="font-semibold text-white">
            Payer
          </Link>
        </div>
        <nav className="flex-1 space-y-0.5 p-4">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200",
                  isActive
                    ? "bg-[#121821] text-[#3B82F6]"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                )}
              >
                <Icon className="size-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col md:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/5 bg-[#0B0F14]/80 px-4 backdrop-blur-xl sm:px-6">
          <div className="md:hidden">
            <Link href="/dashboard" className="font-semibold text-white">
              Payer
            </Link>
          </div>
          <div className="flex flex-1 flex-wrap items-center justify-end gap-2 md:justify-end">
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
              aria-label="Notifications"
              disabled
            >
              <Bell className="size-5" />
            </Button>
            <span className="hidden max-w-[140px] truncate text-sm text-muted-foreground sm:inline sm:leading-9">
              {businessName}
            </span>
            <form action={signOut} className="leading-none">
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="h-9 text-muted-foreground hover:text-foreground"
              >
                Sign out
              </Button>
            </form>
          </div>
        </header>

        <main className="flex-1 pb-20 md:pb-0">{children}</main>
        <MobileNav />
      </div>
    </div>
  );
}
