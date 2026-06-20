'use client'

import { TrackedRegisterLink } from '@/components/analytics/tracked-register-link'
import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function MobileCtaBar() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-background/85 p-3 backdrop-blur-xl transition-transform duration-300 md:hidden',
        show ? 'translate-y-0' : 'translate-y-full',
      )}
    >
      <TrackedRegisterLink
        href="/register"
        cta="start_free"
        location="mobile_bar"
        className={cn(
          buttonVariants(),
          'h-12 w-full border border-brand/25 bg-brand text-base font-medium text-primary-foreground shadow-none hover:bg-brand-hover',
        )}
      >
        Start free — invoice in 15s <ArrowRight className="ml-1.5 h-4 w-4" />
      </TrackedRegisterLink>
    </div>
  )
}
