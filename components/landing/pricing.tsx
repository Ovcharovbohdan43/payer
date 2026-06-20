import Link from "next/link";
import { Check } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AnimateInView } from "@/components/animate-in-view";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Everything you need to try Puyer end to end.",
    cta: "Start free",
    href: "/login",
    highlight: false,
    features: [
      "3 invoices with all features",
      "Magic-link sign-in",
      "Pay links & status tracking",
      "Email invoices & PDFs",
      "Stripe Connect payouts",
      "Google Calendar (Beta)",
    ],
  },
  {
    name: "Pro",
    price: "$9.99",
    period: "per month",
    description: "Unlimited invoicing for growing trades and freelancers.",
    cta: "Upgrade to Pro",
    href: "/login",
    highlight: true,
    features: [
      "Unlimited invoices",
      "Everything in Free",
      "Premium support",
      "Cancel anytime",
    ],
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <AnimateInView className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-medium text-brand">Pricing</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-balance text-white sm:text-4xl">
          Simple pricing
        </h2>
        <p className="mt-4 text-pretty text-white/55">
          Start free. Upgrade when invoicing becomes second nature.
        </p>
      </AnimateInView>

      <div className="mx-auto mt-12 grid max-w-3xl grid-cols-1 items-stretch gap-5 sm:grid-cols-2">
        {plans.map((plan, i) => (
          <AnimateInView key={plan.name} delay={i * 100} className="h-full">
            <div
              className={cn(
                "flex h-full flex-col rounded-3xl p-7 pt-8",
                plan.highlight
                  ? "border border-brand/40 bg-gradient-to-b from-brand/10 to-card/60 shadow-[0_0_60px_-20px_var(--brand)]"
                  : "border border-white/8 bg-card/60"
              )}
            >
              <div className="flex h-6 items-center justify-center">
                {plan.highlight ? (
                  <span className="rounded-full bg-brand px-3 py-1 text-xs font-semibold text-primary-foreground">
                    Most popular
                  </span>
                ) : null}
              </div>

              <div className="mt-2">
                <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                <div className="mt-3 flex items-baseline gap-1.5">
                  <span className="text-4xl font-bold tracking-tight text-white">
                    {plan.price}
                  </span>
                  <span className="text-sm text-white/45">/ {plan.period}</span>
                </div>
              </div>

              <p className="mt-2 min-h-10 text-sm leading-relaxed text-white/55 sm:min-h-11">
                {plan.description}
              </p>

              <Link
                href={plan.href}
                className={cn(
                  buttonVariants(),
                  "mt-6 h-11 w-full shrink-0 font-medium",
                  plan.highlight
                    ? "bg-brand text-primary-foreground hover:bg-brand-hover"
                    : "border border-white/15 bg-white/[0.02] text-white hover:bg-white/5"
                )}
              >
                {plan.cta}
              </Link>

              <ul className="mt-7 flex-1 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                    <span className="text-white/70">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </AnimateInView>
        ))}
      </div>
    </section>
  );
}
