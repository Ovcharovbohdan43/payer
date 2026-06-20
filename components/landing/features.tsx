import {
  Bell,
  Calendar,
  CreditCard,
  FileText,
  Link2,
  Smartphone,
  Zap,
} from 'lucide-react'
import { AnimateInView } from '@/components/animate-in-view'
import { cn } from '@/lib/utils'

type Feature = {
  icon: typeof Link2
  title: string
  description: string
  className?: string
  beta?: boolean
}

const features: Feature[] = [
  {
    icon: Link2,
    title: 'Pay link + tracking',
    description:
      'One link to view and pay. Real-time status tracking — sent, viewed and paid — so you always know where you stand.',
    className: 'sm:col-span-2',
  },
  {
    icon: CreditCard,
    title: 'Stripe Checkout',
    description: 'Stripe Checkout & Connect with QR codes for in-person payments.',
  },
  {
    icon: Bell,
    title: 'Email & reminders',
    description: 'Email invoices and send manual reminders with smart rate limiting.',
  },
  {
    icon: FileText,
    title: 'Professional PDFs',
    description:
      'Auto-generated PDFs with line items, VAT and due dates — ready to download or attach.',
  },
  {
    icon: Smartphone,
    title: 'Mobile-first',
    description: 'Phone-first design. Create and send invoices on the go.',
  },
  {
    icon: Zap,
    title: 'Lightning fast',
    description: 'Minimal setup with magic-link sign-in. Be invoicing in under a minute.',
  },
  {
    icon: Calendar,
    title: 'Google Calendar',
    description:
      'A post-session email nudge reminds you to issue the invoice while the job is fresh.',
    className: 'sm:col-span-2',
    beta: true,
  },
]

export function Features() {
  return (
    <section id="features" className="relative mx-auto max-w-6xl px-4 pb-24 pt-16 sm:px-6 sm:pt-20">
      <AnimateInView className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-medium text-brand">Features</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-balance text-white sm:text-4xl">
          Everything you need to get paid
        </h2>
        <p className="mt-4 text-pretty text-white/55">
          No bloat, no learning curve. Just the tools trades and freelancers
          actually use to send invoices and collect payment fast.
        </p>
      </AnimateInView>

      <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {features.map((f, i) => (
          <AnimateInView
            key={f.title}
            delay={i * 60}
            className={cn(
              'group relative rounded-2xl border border-white/8 bg-card/60 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/30 hover:bg-card',
              f.className,
            )}
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/12 text-brand ring-1 ring-inset ring-brand/20">
                <f.icon className="h-5 w-5" />
              </span>
              {f.beta && (
                <span className="rounded-full border border-amber/30 bg-amber/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber">
                  Beta
                </span>
              )}
            </div>
            <h3 className="mt-4 text-base font-semibold text-white">{f.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-white/55">
              {f.description}
            </p>
          </AnimateInView>
        ))}
      </div>
    </section>
  )
}
