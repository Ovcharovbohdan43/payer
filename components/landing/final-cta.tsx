import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AnimateInView } from '@/components/animate-in-view'

export function FinalCta() {
  return (
    <section className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <AnimateInView className="relative overflow-hidden rounded-3xl border border-white/8 bg-card/60 px-6 py-16 text-center sm:px-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_80%_at_50%_0%,var(--brand-soft),transparent_70%)]"
        />
        <div className="relative">
          <h2 className="mx-auto max-w-xl text-3xl font-bold tracking-tight text-balance text-white sm:text-4xl">
            Ready to get paid faster?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-pretty text-white/60">
            Create your first invoice in 15 seconds. No credit card required.
          </p>
          <Link
            href="/login"
            className={cn(
              buttonVariants(),
              'mt-8 h-12 border border-brand/25 bg-brand px-7 text-base font-medium text-primary-foreground shadow-none hover:bg-brand-hover',
            )}
          >
            Start free <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
        </div>
      </AnimateInView>
    </section>
  )
}
