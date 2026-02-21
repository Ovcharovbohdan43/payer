"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, FileText, Users, Settings, FileSignature } from "lucide-react";
import { signOut } from "@/app/login/actions";
import { MobileNav } from "./mobile-nav";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/offers", label: "Offers", icon: FileSignature, badge: "New" },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

type AppShellProps = {
  children: React.ReactNode;
  businessName: string;
  logoUrl?: string | null;
  /** Stripe connected = verified (ID verification required by Stripe) */
  isVerified?: boolean;
};

export function AppShell({ children, businessName, logoUrl, isVerified }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen min-w-0 bg-[#0B0F14]">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-white/5 bg-[#0B0F14]/95 backdrop-blur-xl lg:flex">
        <div className="flex h-16 items-center border-b border-white/5 px-6">
          <Link href="/dashboard" className="font-semibold text-white">
            Puyer
          </Link>
        </div>
        <nav className="flex-1 space-y-0.5 p-4">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;
            const badge = "badge" in item ? (item as { badge?: string }).badge : undefined;
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
                {badge && (
                  <span className="rounded-full bg-[#3B82F6] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/5 bg-[#0B0F14]/80 px-4 backdrop-blur-xl sm:px-6">
          <div className="lg:hidden">
            <Link href="/dashboard" className="font-semibold text-white">
              Puyer
            </Link>
          </div>
          <div className="flex flex-1 flex-wrap items-center justify-end gap-2 md:justify-end">
            <div className="flex items-center gap-2">
              <div className="relative shrink-0">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt=""
                    className="h-8 w-8 rounded-full object-cover ring-1 ring-white/10"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3B82F6]/20 text-sm font-medium text-[#3B82F6]">
                    {businessName.charAt(0).toUpperCase() || "B"}
                  </div>
                )}
                {isVerified && (
                  <span
                    className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-[#0B0F14] bg-emerald-500"
                    aria-label="Verified account"
                  />
                )}
              </div>
              <span className="hidden max-w-[120px] truncate text-sm text-muted-foreground sm:inline sm:leading-9">
                {businessName}
              </span>
            </div>
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

        <main className="flex-1 pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))] lg:pb-0">{children}</main>
        <MobileNav />
      </div>
    </div>
  );
}
