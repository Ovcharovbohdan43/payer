import { AnimateInView } from '@/components/animate-in-view'
import { ScreenshotGallery } from '@/components/landing/screenshot-gallery'

export function Screenshots() {
  return (
    <section className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <AnimateInView className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-medium text-brand">Product</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-balance text-white sm:text-4xl">
          See Puyer in action
        </h2>
        <p className="mt-4 text-pretty text-white/55">
          A clean, fast interface designed for the phone in your pocket.
        </p>
      </AnimateInView>

      <AnimateInView delay={100}>
        <ScreenshotGallery />
      </AnimateInView>
    </section>
  )
}
