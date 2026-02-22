"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

const SCREENSHOTS = [
  { id: "dashboard", src: "/screenshots/dashboard.png", label: "Dashboard", desc: "Overview of revenue, invoices, and payouts" },
  { id: "offers", src: "/screenshots/offers.png", label: "Offers", desc: "Create and manage quotes & estimates" },
  { id: "clients", src: "/screenshots/clients.png", label: "Clients", desc: "Your client database in one place" },
  { id: "create", src: "/screenshots/create-invoice.png", label: "Create invoice", desc: "Add services, amounts, due dates" },
  { id: "invoice", src: "/screenshots/invoice-qr.png", label: "Payment page", desc: "Client view with Pay button & QR code" },
];

const AUTO_SLIDE_MS = 7000;

export function ScreenshotGallery() {
  const [active, setActive] = useState(0);
  const item = SCREENSHOTS[active];

  useEffect(() => {
    const t = setInterval(() => {
      setActive((i) => (i + 1) % SCREENSHOTS.length);
    }, AUTO_SLIDE_MS);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Mobile: compact dots. Desktop: label pills */}
      <div className="flex justify-center gap-3 sm:flex-wrap sm:gap-2">
        {SCREENSHOTS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActive(i)}
            aria-label={`Show ${s.label}`}
            aria-current={i === active ? "true" : undefined}
            className={`touch-manipulation shrink-0 rounded-full transition-all duration-200
              h-3 w-3 p-2 sm:h-auto sm:min-h-10 sm:w-auto sm:p-0 sm:px-4 sm:py-2 sm:text-sm sm:font-medium
              ${i === active
                ? "bg-[#3B82F6] sm:text-white"
                : "bg-white/30 sm:bg-white/5 sm:text-muted-foreground sm:hover:bg-white/10 sm:hover:text-foreground active:bg-white/50 sm:active:bg-white/15"
              }`}
          >
            <span className="hidden sm:inline">{s.label}</span>
          </button>
        ))}
      </div>
      <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#121821]/80 shadow-2xl shadow-black/40 sm:rounded-2xl">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#0B0F14] sm:aspect-video sm:aspect-[16/10]" style={{ contain: "layout" }}>
          <div
            className="flex h-full w-full will-change-transform transition-transform duration-500 ease-out"
            style={{ transform: `translate3d(-${active * 100}%, 0, 0)` }}
          >
            {SCREENSHOTS.map((s, i) => (
              <div key={s.id} className="relative h-full w-full shrink-0">
                <Image
                  src={s.src}
                  alt={s.label}
                  fill
                  className="object-contain object-top"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 900px"
                  priority={i === 0}
                  loading={i === 0 ? undefined : "lazy"}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="border-t border-white/5 px-4 py-3 text-center sm:px-6">
          <p className="font-medium text-white">{item.label}</p>
          <p className="text-sm text-muted-foreground">{item.desc}</p>
        </div>
      </div>
    </div>
  );
}
