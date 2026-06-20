import Image from "next/image";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

const columns = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "Updates", href: "/updates" },
      { label: "Try demo", href: "/demo" },
    ],
  },
  {
    title: "Company",
    links: [
      {
        label: "About us",
        href: "https://github.com/Ovcharovbohdan43",
        external: true,
      },
      { label: "Help", href: "/help" },
      { label: "Support", href: "mailto:support@puyer.org" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms", href: "/terms" },
      { label: "Privacy", href: "/privacy" },
      { label: "Log in", href: "/login" },
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-white/5">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="flex items-center gap-2" aria-label="Puyer home">
              <Image
                src="/logo.png"
                alt=""
                width={32}
                height={32}
                className="h-8 w-8"
              />
              <span className="text-base font-semibold tracking-tight text-white">
                Puyer
              </span>
            </Link>
            <p className="mt-3 text-sm text-white/50">Invoice in 15 seconds.</p>
            <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-white/40">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
              We do not store or share your banking or card details with third
              parties.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <p className="text-sm font-semibold text-white">{col.title}</p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {"external" in link && link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-white/55 transition-colors hover:text-white"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-white/55 transition-colors hover:text-white"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/5 pt-6 text-xs text-white/40 sm:flex-row">
          <p>© {new Date().getFullYear()} Puyer. Invoice in 15 seconds.</p>
          <p>Powered by Stripe</p>
        </div>
      </div>
    </footer>
  );
}
