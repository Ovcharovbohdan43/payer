import { FileText, Send, Wallet } from 'lucide-react'
import { AnimateInView } from '@/components/animate-in-view'

const steps = [
  {
    icon: FileText,
    title: 'Create invoice',
    description: 'Add the client, services, amount, VAT and due date.',
  },
  {
    icon: Send,
    title: 'Send link',
    description: 'Copy it or email it — works on any device.',
  },
  {
    icon: Wallet,
    title: 'Get paid',
    description: 'Stripe collects payment. You get notified and paid out.',
  },
]

export function HowItWorks() {
  return (
    <section id="how" className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <AnimateInView className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-medium text-brand">How it works</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-balance text-white sm:text-4xl">
          Three steps to getting paid
        </h2>
      </AnimateInView>

      <div className="relative mt-14 grid gap-8 sm:grid-cols-3">
        {/* connector line */}
        <div
          aria-hidden="true"
          className="absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-white/15 to-transparent sm:block"
        />
        {steps.map((s, i) => (
          <AnimateInView
            key={s.title}
            delay={i * 120}
            className="relative flex flex-col items-center text-center"
          >
            <span className="animate-pulse-ring relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl border border-brand/30 bg-background text-brand">
              <s.icon className="h-6 w-6" />
            </span>
            <span className="mt-4 text-xs font-semibold uppercase tracking-wider text-brand">
              Step {i + 1}
            </span>
            <h3 className="mt-1 text-lg font-semibold text-white">{s.title}</h3>
            <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-white/55">
              {s.description}
            </p>
          </AnimateInView>
        ))}
      </div>
    </section>
  )
}
