import Link from "next/link";
import { STRIPE_CONNECT_SETTINGS_HREF } from "@/lib/stripe/connect-reminder";

export function StripeConnectBanner() {
  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
      <p className="font-medium text-amber-50">Online card payment is not available yet</p>
      <p className="mt-1 text-amber-100/90">
        Connect Stripe in Settings so clients can pay this invoice by card. Until then, share the
        payment link manually or mark the invoice as paid when you receive payment elsewhere.
      </p>
      <Link
        href={STRIPE_CONNECT_SETTINGS_HREF}
        className="mt-3 inline-flex text-sm font-semibold text-[#93C5FD] underline underline-offset-2 hover:text-white"
      >
        Connect Stripe in Settings →
      </Link>
    </div>
  );
}
