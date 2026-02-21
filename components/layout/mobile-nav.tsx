"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, FileText, Plus, Users, Settings, FileSignature } from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/offers", label: "Offers", icon: FileSignature, badge: "New" },
  { href: "/invoices/new", label: "Create", icon: Plus },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 flex items-end border-t border-white/5 bg-[#0B0F14] pb-[env(safe-area-inset-bottom,0px)] lg:hidden">
      <div className="flex h-14 min-h-[56px] w-full items-center justify-around gap-0 px-1 sm:h-16 sm:px-2">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" &&
              item.href !== "/invoices/new" &&
              pathname.startsWith(item.href));
          const isCreate = item.href === "/invoices/new";
          const Icon = item.icon;
          const badge = "badge" in item ? (item as { badge?: string }).badge : undefined;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-2 transition-colors",
                isCreate
                  ? "rounded-xl bg-[#3B82F6] text-white"
                  : isActive
                    ? "text-[#3B82F6]"
                    : "text-muted-foreground"
              )}
            >
              <Icon className={cn("shrink-0", isCreate ? "size-5 min-[360px]:size-6" : "size-4 min-[360px]:size-5")} />
              <span className="flex items-center gap-1 truncate text-[9px] font-medium min-[360px]:text-[10px]">
                {item.label}
                {badge && (
                  <span className="rounded bg-[#3B82F6] px-1 text-[8px] font-bold text-white">{badge}</span>
                )}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
