'use client'

import { useEffect, useState } from 'react'
import { PRODUCT_SCREENS } from '@/components/landing/product-screens'
import { cn } from '@/lib/utils'

export function ScreenshotGallery() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((a) => (a + 1) % PRODUCT_SCREENS.length)
    }, 7000)
    return () => clearInterval(timer)
  }, [])

  const current = PRODUCT_SCREENS[active]
  const Screen = current.Screen

  return (
    <div className="mx-auto mt-12 max-w-4xl">
      {/* desktop tabs */}
      <div className="hidden flex-wrap justify-center gap-2 sm:flex">
        {PRODUCT_SCREENS.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setActive(i)}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-medium transition-colors',
              i === active
                ? 'bg-brand text-primary-foreground'
                : 'border border-white/10 bg-white/[0.03] text-white/60 hover:text-white',
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="relative mt-6 overflow-hidden rounded-2xl border border-white/10 bg-[#0e131b] shadow-2xl shadow-black/50">
        <div className="mx-auto aspect-[16/11] max-w-md sm:max-w-none">
          <Screen />
        </div>
      </div>

      <div className="mt-4 text-center">
        <p className="text-sm font-semibold text-white">{current.label}</p>
        <p className="mt-0.5 text-sm text-white/50">{current.description}</p>
      </div>

      {/* mobile dots */}
      <div className="mt-4 flex justify-center gap-2 sm:hidden">
        {PRODUCT_SCREENS.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setActive(i)}
            aria-label={`Show ${s.label}`}
            className={cn(
              'h-2 rounded-full transition-all',
              i === active ? 'w-6 bg-brand' : 'w-2 bg-white/20',
            )}
          />
        ))}
      </div>
    </div>
  )
}
