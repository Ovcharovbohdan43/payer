import Image from "next/image";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 bg-gradient-to-b from-background/40 via-background/10 to-transparent backdrop-blur-[6px] supports-[backdrop-filter]:bg-background/20">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
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

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {[
            { href: "#features", label: "Features" },
            { href: "#how", label: "How it works" },
            { href: "#pricing", label: "Pricing" },
            { href: "#reviews", label: "Reviews" },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-lg px-3 py-2 text-sm text-white/60 transition-colors hover:text-white"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "h-9 px-3 text-white/70 hover:bg-white/5 hover:text-white"
            )}
          >
            Log in
          </Link>
          <Link
            href="/register"
            className={cn(
              buttonVariants(),
              "h-9 bg-brand px-4 font-medium text-primary-foreground hover:bg-brand-hover"
            )}
          >
            Sign up
          </Link>
        </div>
      </div>
    </header>
  );
}
