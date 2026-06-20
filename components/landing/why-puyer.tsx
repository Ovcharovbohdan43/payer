'use client'

import { useEffect, useRef, useState } from 'react'
import {
  BookOpen,
  CreditCard,
  Minimize2,
  Sparkles,
  Timer,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const advantages = [
  {
    icon: Sparkles,
    title: 'Dead simple',
    description:
      'A clean interface with no clutter — nothing like the bloated dashboards other invoicing tools throw at you.',
  },
  {
    icon: Zap,
    title: 'Blazing fast',
    description:
      'Create, send, and track invoices without lag. Built to feel instant on phone and desktop.',
  },
  {
    icon: Timer,
    title: 'Ready in seconds',
    description:
      'Sign up, add your details, and send your first invoice in under 15 seconds — not hours of setup.',
  },
  {
    icon: BookOpen,
    title: 'No accounting knowledge',
    description:
      'No bookkeeping, jargon, or tax wizardry. Add a client, set an amount, send — and start getting paid.',
  },
  {
    icon: CreditCard,
    title: 'Instant card payments',
    description:
      'Clients pay by debit or credit card via email, link, or QR. You receive money through Stripe.',
  },
  {
    icon: Minimize2,
    title: 'Only what you need',
    description:
      'Not an accounting suite — just invoicing and payments. Less noise, less learning curve, more time on the job.',
  },
]

export function WhyPuyer() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return

    const reveal = () => setVisible(true)

    const rect = el.getBoundingClientRect()
    if (rect.top < window.innerHeight * 0.92) {
      reveal()
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          reveal()
          observer.disconnect()
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -24px 0px' },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={sectionRef} className="relative z-10 mx-auto mt-12 max-w-4xl sm:mt-14">
      <div
        className={cn(
          'text-center transition-all duration-1000 ease-out',
          visible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0',
        )}
      >
        <p className="text-sm font-medium text-brand">Why Puyer</p>
        <h2 className="mt-2 text-xl font-bold tracking-tight text-balance text-white sm:text-2xl">
          Simpler and faster than the competition
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-pretty text-white/55 sm:text-base">
          Other tools expect you to learn accounting software before you can
          collect a single payment. Puyer is built so anyone can invoice and get
          paid in seconds — no expertise required.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {advantages.map((item, i) => (
          <div
            key={item.title}
            style={visible ? undefined : { transitionDelay: `${180 + i * 90}ms` }}
            className={cn(
              'rounded-xl border border-white/8 bg-card/40 p-4 backdrop-blur-sm',
              'hover:-translate-y-0.5 hover:border-brand/25 hover:bg-card/60',
              visible
                ? 'translate-y-0 scale-100 opacity-100 transition-[border-color,background-color,transform] duration-150 ease-out'
                : 'translate-y-8 scale-[0.96] opacity-0 transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]',
            )}
          >
            <span
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-lg bg-brand/12 text-brand ring-1 ring-inset ring-brand/20',
                visible
                  ? 'scale-100'
                  : 'scale-75 transition-transform duration-700 ease-out',
              )}
              style={visible ? undefined : { transitionDelay: `${220 + i * 90}ms` }}
            >
              <item.icon className="h-4 w-4" />
            </span>
            <h3 className="mt-3 text-sm font-semibold text-white">{item.title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-white/55 sm:text-sm">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
