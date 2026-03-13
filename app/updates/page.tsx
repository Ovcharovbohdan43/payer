import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Updates",
  description:
    "Puyer product updates — new features, bug fixes, and improvements.",
};

type UpdateBadge = "Bug fix" | "Improvement" | "New";

type Update = {
  date: string;
  badge: UpdateBadge;
  title: string;
  description: string;
};

const UPDATES: Update[] = [
  {
    date: "2025-03-13",
    badge: "New",
    title: "Payout email notifications",
    description:
      "When Stripe sends a payout to your bank account, you now receive an email notification with the amount, currency, expected arrival date, and a link to your dashboard. Keeps you informed as soon as the money is on the way.",
  },
  {
    date: "2025-03-13",
    badge: "Bug fix",
    title: "Payout webhook not receiving events",
    description:
      "Fixed an issue where payout.paid events from Stripe Connect were not reaching our webhook. Payouts are sent from connected accounts, so a separate Connect webhook was needed. Added STRIPE_WEBHOOK_SECRET_CONNECT — payout records and activity now update correctly when funds are sent to your bank.",
  },
  {
    date: "2025-02-20",
    badge: "Improvement",
    title: "Larger logo upload limit (10MB)",
    description:
      "Increased the maximum file size for company logo uploads from 1MB to 10MB. Logo upload now uses a dedicated API route to support larger images.",
  },
  {
    date: "2025-02-20",
    badge: "Bug fix",
    title: "Invoice total and payment processing fee display",
    description:
      "Fixed an issue where clients did not see the full amount (including payment processing fee and VAT) before Stripe Checkout. The payment page now shows a clear breakdown: line items, optional fee, and total to pay — matching the amount charged.",
  },
  {
    date: "2025-02-20",
    badge: "Bug fix",
    title: "Stripe webhook not receiving payment events",
    description:
      "Resolved a configuration issue where the webhook listened only to Connected account events. For destination charges, checkout.session.completed is a platform event. Added a platform webhook so payment status updates correctly when clients pay.",
  },
];

function formatDate(iso: string): string {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function UpdatesPage() {
  return (
    <div className="min-h-screen bg-[#0B0F14]">
      <header className="border-b border-white/5 px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/" className="text-lg font-bold text-white">
            Puyer
          </Link>
          <Button asChild variant="ghost" size="sm">
            <Link href="/">← Back</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Updates</h1>
        <p className="mt-2 text-sm text-white/60">
          Product updates, bug fixes, and news. Check back for the latest.
        </p>

        <ul className="mt-10 space-y-0">
          {UPDATES.map((entry, idx) => (
            <li
              key={idx}
              className="border-b border-white/5 py-6 last:border-b-0 sm:py-8"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:gap-4">
                <time
                  dateTime={entry.date}
                  className="shrink-0 text-xs font-medium text-white/50"
                >
                  {formatDate(entry.date)}
                </time>
                <span
                  className={`inline-flex w-fit shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                    entry.badge === "Bug fix"
                      ? "bg-amber-500/20 text-amber-400"
                      : entry.badge === "Improvement"
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-emerald-500/20 text-emerald-400"
                  }`}
                >
                  {entry.badge}
                </span>
              </div>
              <h2 className="mt-2 text-base font-semibold text-white sm:text-lg">
                {entry.title}
              </h2>
              <p className="mt-1 text-sm text-white/70 leading-relaxed">
                {entry.description}
              </p>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
