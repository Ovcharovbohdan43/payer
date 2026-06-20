import Link from 'next/link'
import { ArrowRight, ShieldCheck, Sparkles, Star } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { DashboardScreen, PaymentScreen } from '@/components/landing/product-screens'

export function Hero() {
  return (
    <section className="relative">
      <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 sm:pb-24 sm:pt-14">
        <h1 className="mx-auto max-w-3xl text-center text-4xl font-bold leading-[1.05] tracking-tight text-balance text-white sm:text-6xl">
          Invoice in 15 seconds.{' '}
          <span className="bg-gradient-to-r from-brand to-sky-400 bg-clip-text text-transparent">
            Pay with any debit or credit card.
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-center text-base leading-relaxed text-pretty text-white/60 sm:text-lg">
          Built for trades and freelancers. Create an invoice, send a link,
          track payment — no hassle. Mobile-first, simple, secure.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/register"
            className={cn(
              buttonVariants(),
              'h-12 w-full bg-brand px-6 text-base font-medium text-primary-foreground shadow-[0_0_40px_-8px_var(--brand)] hover:bg-brand-hover sm:w-auto',
            )}
          >
            Start free <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
          <Link
            href="/demo"
            className={cn(
              buttonVariants({ variant: 'outline' }),
              'h-12 w-full border-white/15 bg-white/[0.02] px-6 text-base text-white hover:bg-white/5 sm:w-auto',
            )}
          >
            Try demo
          </Link>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-white/45">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> No card
            required
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-brand" /> Klarna, Clearpay,
            Zilch and more
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5 fill-amber text-amber" /> Powered by
            Stripe
          </span>
        </div>

        {/* product preview */}
        <div className="relative mx-auto mt-14 max-w-4xl">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-x-12 -top-12 bottom-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_20%,var(--brand-soft),transparent_75%)] opacity-50"
          />
          <div className="relative grid items-end gap-4 sm:grid-cols-[1.5fr_1fr]">
            {/* main dashboard */}
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0e131b] shadow-2xl shadow-black/50">
              <div className="aspect-[4/3] sm:aspect-[16/12]">
                <DashboardScreen />
              </div>
            </div>
            {/* floating payment card */}
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0e131b] shadow-2xl shadow-black/50 sm:mb-8 sm:translate-y-6">
              <div className="aspect-[3/4] sm:aspect-[9/14]">
                <PaymentScreen />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
