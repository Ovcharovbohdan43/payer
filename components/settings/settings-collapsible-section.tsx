"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type SettingsCollapsibleSectionProps = {
  id?: string;
  title: string;
  description?: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  children: ReactNode;
};

export function SettingsCollapsibleSection({
  id,
  title,
  description,
  defaultOpen = false,
  className,
  children,
}: SettingsCollapsibleSectionProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    if (!id || window.location.hash !== `#${id}`) return;
    setOpen(true);
    requestAnimationFrame(() => {
      detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [id]);

  return (
    <details
      ref={detailsRef}
      id={id}
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
      className={cn(
        "group rounded-[16px] border border-white/5 bg-[#121821]/80 backdrop-blur transition-colors sm:rounded-[20px]",
        open && "border-white/10",
        className
      )}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 sm:p-6 [&::-webkit-details-marker]:hidden">
        <div className="min-w-0 flex-1 text-left">
          <h2 className="text-base font-semibold">{title}</h2>
          {description && !open ? (
            <div className="mt-1 line-clamp-2 text-sm text-muted-foreground">{description}</div>
          ) : null}
        </div>
        <ChevronDown
          className={cn(
            "size-5 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
      </summary>
      <div className="border-t border-white/5 px-4 pb-4 pt-4 sm:px-6 sm:pb-6">{children}</div>
    </details>
  );
}
