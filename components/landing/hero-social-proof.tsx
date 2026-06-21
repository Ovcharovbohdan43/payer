'use client'

import { useEffect, useRef, useState } from 'react'
import { CreditCard, Star, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

type StatItem = {
  icon: typeof Star
  value: number
  prefix?: string
  suffix?: string
  label: string
  iconClass: string
}

const STATS: StatItem[] = [
  {
    icon: Star,
    value: 100,
    suffix: '+',
    label: 'freelancers trust Puyer',
    iconClass: 'text-amber fill-amber',
  },
  {
    icon: CreditCard,
    value: 50000,
    prefix: '£',
    suffix: '+',
    label: 'processed through Stripe',
    iconClass: 'text-brand',
  },
  {
    icon: Zap,
    value: 12,
    suffix: 's',
    label: 'average time to create an invoice',
    iconClass: 'text-emerald-400',
  },
]

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3)
}

function formatStatValue(
  item: StatItem,
  progress: number,
): string {
  const current = Math.round(item.value * progress)
  const formatted =
    item.value >= 1000
      ? current.toLocaleString('en-GB')
      : String(current)
  return `${item.prefix ?? ''}${formatted}${item.suffix ?? ''}`
}

function AnimatedStat({
  item,
  started,
  delay,
}: {
  item: StatItem
  started: boolean
  delay: number
}) {
  const [progress, setProgress] = useState(0)
  const Icon = item.icon

  useEffect(() => {
    if (!started) return

    let frame = 0
    const duration = 1400
    const startAt = performance.now() + delay

    const tick = (now: number) => {
      if (now < startAt) {
        frame = requestAnimationFrame(tick)
        return
      }
      const p = Math.min((now - startAt) / duration, 1)
      setProgress(easeOutCubic(p))
      if (p < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [started, delay])

  return (
    <div
      className={cn(
        'rounded-xl border border-white/8 bg-card/40 px-4 py-3 backdrop-blur-sm',
        'transition-[border-color,background-color,transform] duration-150 ease-out',
        'hover:border-brand/20 hover:bg-card/55',
        started ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0',
      )}
      style={{
        transitionDelay: started ? `${delay}ms` : '0ms',
        transitionDuration: started ? '500ms' : '0ms',
      }}
    >
      <div className="flex items-center gap-2">
        <Icon className={cn('h-4 w-4 shrink-0', item.iconClass)} />
        <p className="text-lg font-semibold tabular-nums tracking-tight text-white sm:text-xl">
          {formatStatValue(item, progress)}
        </p>
      </div>
      <p className="mt-1 text-xs leading-snug text-white/50 sm:text-sm">
        {item.label}
      </p>
    </div>
  )
}

export function HeroSocialProof() {
  const ref = useRef<HTMLDivElement>(null)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const reveal = () => setStarted(true)
    const rect = el.getBoundingClientRect()
    if (rect.top < window.innerHeight * 0.95) {
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
      { threshold: 0.2 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className="mx-auto mt-8 max-w-3xl">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {STATS.map((item, i) => (
          <AnimatedStat
            key={item.label}
            item={item}
            started={started}
            delay={i * 120}
          />
        ))}
      </div>
    </div>
  )
}
