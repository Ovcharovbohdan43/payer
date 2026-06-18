import { CHECKOUT_FEE_DISCLAIMER } from "@/lib/stripe/connect";

type Props = {
  businessName: string;
  className?: string;
};

/** Shown on public invoice page before Stripe Checkout. */
export function CheckoutFeeDisclaimer({ businessName, className }: Props) {
  const seller = businessName.trim() || "the seller";
  return (
    <p className={className}>
      Stripe card processing fees are paid by <strong>{seller}</strong>, not by
      Puyer. {CHECKOUT_FEE_DISCLAIMER}
    </p>
  );
}
