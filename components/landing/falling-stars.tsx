'use client'

import { useEffect, useState } from 'react'

type Star = {
  id: number
  left: number
  size: number
  duration: number
  delay: number
  opacity: number
}

export function FallingStars({ count = 14 }: { count?: number }) {
  // Generate only on the client to avoid SSR hydration mismatches from Math.random().
  const [stars, setStars] = useState<Star[]>([])

  useEffect(() => {
    setStars(
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: Math.random() * 2 + 1.5,
        duration: Math.random() * 6 + 6,
        delay: Math.random() * 8,
        opacity: Math.random() * 0.4 + 0.3,
      })),
    )
  }, [count])

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {stars.map((s) => (
        <span
          key={s.id}
          className="animate-star-fall absolute top-0 rounded-full bg-brand"
          style={{
            left: `${s.left}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            opacity: s.opacity,
            animationDuration: `${s.duration}s`,
            animationDelay: `${s.delay}s`,
            boxShadow: '0 0 6px 1px var(--brand)',
          }}
        />
      ))}
    </div>
  )
}
