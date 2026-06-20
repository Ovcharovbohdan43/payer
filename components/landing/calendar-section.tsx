import Link from 'next/link'
import { ArrowRight, CalendarCheck, CheckCircle2, Lock, Mail } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AnimateInView } from '@/components/animate-in-view'

const steps = [
  {
    icon: CalendarCheck,
    title: 'Schedule',
    description: 'Your session sits in Google Calendar like always.',
  },
  {
    icon: CheckCircle2,
    title: 'Session ends',
    description: 'Puyer notices the appointment has finished.',
  },
  {
    icon: Mail,
    title: 'Get a gentle nudge',
    description: 'An email lands ~15 minutes later: time to invoice.',
  },
]

export function CalendarSection() {
  return (
    <section className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <AnimateInView className="overflow-hidden rounded-3xl border border-white/8 bg-card/60 p-8 backdrop-blur-sm sm:p-12">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-amber/30 bg-amber/10 px-3 py-1 text-xs font-semibold text-amber">
              Beta · Google Calendar
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-balance text-white sm:text-4xl">
              Bill right after every session
            </h2>
            <p className="mt-4 text-pretty leading-relaxed text-white/60">
              Connect your calendar and Puyer reminds you to invoice the moment a
              job wraps — so nothing slips through the cracks.
            </p>

            <div className="mt-6 flex flex-wrap gap-4 text-xs text-white/50">
              <span className="inline-flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-emerald-400" /> Read-only access
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-brand" /> One email per session
              </span>
            </div>

            <Link
              href="/settings#integrations"
              className={cn(
                buttonVariants(),
                'mt-7 h-11 bg-brand px-4 font-medium text-primary-foreground hover:bg-brand-hover',
              )}
            >
              Connect in Settings <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </div>

          <div className="relative">
            <div
              aria-hidden="true"
              className="absolute inset-0 rounded-2xl bg-[radial-gradient(60%_60%_at_70%_30%,var(--brand-soft),transparent_70%)]"
            />
            <ol className="relative space-y-3">
              {steps.map((s, i) => (
                <li
                  key={s.title}
                  className="flex items-start gap-4 rounded-2xl border border-white/8 bg-[#0e131b]/80 p-4"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/12 text-brand ring-1 ring-inset ring-brand/20">
                    <s.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      <span className="mr-2 text-white/30">{i + 1}</span>
                      {s.title}
                    </p>
                    <p className="mt-0.5 text-sm text-white/55">{s.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </AnimateInView>
    </section>
  )
}
