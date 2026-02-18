import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Zap,
  Link2,
  Bell,
  FileText,
  CreditCard,
  Smartphone,
  ArrowRight,
  Check,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen min-w-0 overflow-x-hidden bg-[#0B0F14]">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0B0F14]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 min-h-[44px] max-w-6xl items-center justify-between px-4 sm:h-16 sm:px-6 min-[375px]:px-4">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-white"
          >
            Payer
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="min-h-10 touch-manipulation rounded-xl text-muted-foreground hover:text-foreground">
              <Link href="/register">Sign up</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="min-h-10 touch-manipulation rounded-xl sm:min-h-9">
              <Link href="/login">Log in</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden px-4 py-12 sm:px-6 sm:py-24 min-[375px]:px-4 min-[375px]:py-16 lg:py-32">
          <div className="absolute inset-0 bg-gradient-to-b from-[#3B82F6]/5 via-transparent to-transparent" />
          <div className="relative mx-auto max-w-4xl text-center">
            <h1 className="text-3xl font-bold tracking-tight text-white min-[375px]:text-4xl sm:text-5xl lg:text-6xl">
              Invoice in 15 seconds.
              <br />
              <span className="bg-gradient-to-r from-[#3B82F6] to-blue-400 bg-clip-text text-transparent">
                Get paid faster.
              </span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-base text-white/70 min-[375px]:text-lg sm:text-xl">
              Built for trades and freelancers. Create an invoice, send a link,
              track payment — no hassle. Mobile-first, simple, secure.
            </p>
            <div className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center sm:gap-4">
              <Button
                asChild
                size="lg"
                className="min-h-12 min-w-0 touch-manipulation rounded-xl bg-[#3B82F6] text-base font-semibold shadow-[0_0_40px_rgba(59,130,246,0.3)] transition-all hover:bg-[#2563EB] sm:h-14 sm:min-w-[200px]"
              >
                <Link href="/login" className="flex items-center gap-2">
                  Start free
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="min-h-12 touch-manipulation rounded-xl border-white/10 bg-white/5 hover:bg-white/10 sm:h-14"
              >
                <Link href="/login">Log in</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="px-4 py-12 sm:px-6 sm:py-24 min-[375px]:px-4">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center text-xl font-bold text-white min-[375px]:text-2xl sm:text-3xl">
              Everything you need to get paid
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-sm text-white/60 min-[375px]:text-base">
              One link, one dashboard. No spreadsheets, no chasing clients.
            </p>
            <div className="mt-10 grid gap-4 min-[375px]:gap-6 sm:grid-cols-2 sm:mt-12 lg:grid-cols-3">
              <FeatureCard
                icon={<Link2 className="size-6 text-[#3B82F6]" />}
                title="Pay link + tracking"
                description="One link to view and pay. We track when it's sent, viewed, and paid — so you always know the status."
              />
              <FeatureCard
                icon={<Bell className="size-6 text-[#3B82F6]" />}
                title="Email & reminders"
                description="Send invoices by email. Manual reminders with rate limiting. No more chasing clients."
              />
              <FeatureCard
                icon={<FileText className="size-6 text-[#3B82F6]" />}
                title="Professional PDFs"
                description="Auto-generated invoice PDFs. Line items, VAT, due dates — everything your clients expect."
              />
              <FeatureCard
                icon={<CreditCard className="size-6 text-[#3B82F6]" />}
                title="Stripe Checkout"
                description="Secure payments via Stripe. Stripe Connect for payouts. QR codes on payment pages."
              />
              <FeatureCard
                icon={<Smartphone className="size-6 text-[#3B82F6]" />}
                title="Mobile-first"
                description="Designed for phones first. Create invoices on the go. Works everywhere."
              />
              <FeatureCard
                icon={<Zap className="size-6 text-[#3B82F6]" />}
                title="Lightning fast"
                description="Minimal setup. Magic link sign-in. Start invoicing in under a minute."
              />
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="border-t border-white/5 px-4 py-12 sm:px-6 sm:py-24 min-[375px]:px-4">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-center text-xl font-bold text-white min-[375px]:text-2xl sm:text-3xl">
              How it works
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-center text-sm text-white/60 min-[375px]:text-base">
              Three steps from sign-up to paid.
            </p>
            <div className="mt-12 grid gap-10 min-[375px]:gap-12 sm:grid-cols-3 sm:mt-16">
              <StepCard
                step={1}
                title="Create invoice"
                description="Add client, services, amount. Optional due date and VAT. Done in seconds."
              />
              <StepCard
                step={2}
                title="Send link"
                description="Copy the payment link or send by email. Client opens it on any device."
              />
              <StepCard
                step={3}
                title="Get paid"
                description="Client pays via Stripe. You get notified. Money flows to your account."
              />
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="border-t border-white/5 px-4 py-12 sm:px-6 sm:py-24 min-[375px]:px-4">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-center text-xl font-bold text-white min-[375px]:text-2xl sm:text-3xl">
              Simple pricing
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-center text-sm text-white/60 min-[375px]:text-base">
              Start free. Upgrade when you need more.
            </p>
            <div className="mt-10 flex justify-center sm:mt-12">
              <div className="w-full max-w-md rounded-[16px] border border-white/10 bg-[#121821]/80 p-6 backdrop-blur min-[375px]:rounded-[20px] min-[375px]:p-8 sm:p-10">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-white">Free</span>
                  <span className="text-white/60">to start</span>
                </div>
                <p className="mt-2 text-white/70">
                  Create invoices, send links, track payments. Stripe fees apply
                  per transaction.
                </p>
                <ul className="mt-6 space-y-3">
                  {[
                    "Unlimited invoices",
                    "Magic link sign-in",
                    "Payment tracking",
                    "Email invoices & reminders",
                    "PDF download",
                    "Stripe Connect payouts",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-white/80">
                      <Check className="size-5 shrink-0 text-[#3B82F6]" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  size="lg"
                  className="mt-8 min-h-12 w-full touch-manipulation rounded-xl bg-[#3B82F6] font-semibold hover:bg-[#2563EB]"
                >
                  <Link href="/login">Start free</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-white/5 px-4 py-12 sm:px-6 sm:py-24 min-[375px]:px-4">
          <div className="mx-auto max-w-2xl rounded-[16px] border border-white/10 bg-gradient-to-br from-[#121821] to-[#121821]/80 p-6 text-center backdrop-blur min-[375px]:rounded-[20px] min-[375px]:p-8 sm:p-12">
            <h2 className="text-xl font-bold text-white min-[375px]:text-2xl sm:text-3xl">
              Ready to get paid faster?
            </h2>
            <p className="mt-3 text-sm text-white/70 min-[375px]:text-base">
              Create your first invoice in 15 seconds. No credit card required.
            </p>
            <Button
              asChild
              size="lg"
              className="mt-6 min-h-12 touch-manipulation rounded-xl bg-[#3B82F6] px-8 font-semibold shadow-[0_0_30px_rgba(59,130,246,0.25)] hover:bg-[#2563EB] sm:h-14"
            >
              <Link href="/login">Start free</Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 px-4 py-6 sm:px-6 sm:py-8 min-[375px]:px-4">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-center sm:flex-row sm:gap-4 sm:text-left">
          <span className="text-sm text-white/50">© Payer. Invoice in 15 seconds.</span>
          <div className="flex gap-6 text-sm">
            <Link href="/login" className="text-white/50 hover:text-white/80">
              Log in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div
      className="group min-w-0 rounded-[14px] border border-white/5 bg-[#121821]/80 p-5 backdrop-blur transition-all hover:border-white/10 hover:shadow-[0_0_40px_rgba(59,130,246,0.08)] min-[375px]:rounded-[20px] min-[375px]:p-6 sm:p-8"
    >
      <div className="flex size-12 items-center justify-center rounded-xl bg-[#3B82F6]/10 text-[#3B82F6]">
        {icon}
      </div>
      <h3 className="mt-4 text-base font-semibold text-white min-[375px]:text-lg">{title}</h3>
      <p className="mt-2 text-sm text-white/60 min-[375px]:text-base">{description}</p>
    </div>
  );
}

function StepCard({
  step,
  title,
  description,
}: {
  step: number;
  title: string;
  description: string;
}) {
  return (
    <div className="min-w-0 text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-full border border-[#3B82F6]/30 bg-[#3B82F6]/10 text-lg font-bold text-[#3B82F6]">
        {step}
      </div>
      <h3 className="mt-4 text-base font-semibold text-white min-[375px]:text-lg">{title}</h3>
      <p className="mt-2 text-sm text-white/60 min-[375px]:text-base">{description}</p>
    </div>
  );
}
