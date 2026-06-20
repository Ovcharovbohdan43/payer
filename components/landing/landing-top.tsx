import { SiteHeader } from "@/components/landing/site-header";
import { Hero } from "@/components/landing/hero";
import { FallingStars } from "@/components/landing/falling-stars";

/** Shared header + hero shell with one continuous ambient background. */
export function LandingTop() {
  return (
    <div className="relative overflow-x-hidden pb-6 sm:pb-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[min(1050px,125vh)] bg-[radial-gradient(ellipse_100%_85%_at_50%_0%,var(--brand-soft),transparent_72%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-72 bg-gradient-to-b from-transparent via-background/40 to-background sm:h-96"
      />
      <FallingStars />
      <div className="relative">
        <SiteHeader />
        <Hero />
      </div>
    </div>
  );
}
