import { LandingTop } from "@/components/landing/landing-top";
import { Features } from "@/components/landing/features";
import { CalendarSection } from "@/components/landing/calendar-section";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Screenshots } from "@/components/landing/screenshots";
import { Reviews } from "@/components/landing/reviews";
import { Pricing } from "@/components/landing/pricing";
import { FinalCta } from "@/components/landing/final-cta";
import { SiteFooter } from "@/components/landing/site-footer";
import { MobileCtaBar } from "@/components/landing/mobile-cta-bar";

export default function HomePage() {
  return (
    <div className="min-h-screen min-w-0 overflow-x-hidden bg-background">
      <main>
        <LandingTop />
        <Features />
        <CalendarSection />
        <HowItWorks />
        <Screenshots />
        <Reviews />
        <Pricing />
        <FinalCta />
      </main>
      <SiteFooter />
      <MobileCtaBar />
    </div>
  );
}
