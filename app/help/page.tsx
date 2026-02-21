import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  HelpCircle,
  FileText,
  CreditCard,
  User,
  Zap,
  Mail,
  ArrowRight,
  LayoutDashboard,
} from "lucide-react";

export const metadata = {
  title: "Help & FAQ",
  description:
    "Frequently asked questions about Puyer — creating invoices, payments, Stripe, and account management.",
};

const FAQ_CATEGORIES = [
  {
    id: "getting-started",
    title: "Getting started",
    icon: Zap,
    items: [
      {
        q: "How do I create my first invoice?",
        a: "Go to Invoices → Create invoice. Add your client (name and optional email), one or more line items (description + amount), choose whether VAT is included, and optional due date. Click Create invoice. You can then copy the payment link or send it by email.",
      },
      {
        q: "Is Puyer free to use?",
        a: "Yes. You can create unlimited invoices, send payment links, and track payments. Stripe fees apply per transaction when your client pays. There's no subscription fee to start.",
      },
      {
        q: "Do I need a Stripe account?",
        a: "You need to connect Stripe to receive payments. Go to Settings → Payments and click Connect Stripe. Stripe handles card processing, payouts, and compliance. Puyer does not store any payment or bank details.",
      },
      {
        q: "What currencies are supported?",
        a: "USD, EUR, and GBP. You set a default currency in Settings. Each invoice uses your default unless you create it in a different currency. Stripe supports many more; we show the most common for simplicity.",
      },
    ],
  },
  {
    id: "invoices",
    title: "Invoices",
    icon: FileText,
    items: [
      {
        q: "How do I send an invoice by email?",
        a: "When creating an invoice, check \"Create & send email\" or use the \"Send by email\" button on the invoice detail page. The client receives a branded email with a \"View & pay\" link. You need the client's email and must have Resend configured.",
      },
      {
        q: "Can I add multiple line items (services) to one invoice?",
        a: "Yes. When creating an invoice, add as many line items as you need. Each row has a description and amount. The total is calculated automatically, with VAT applied if enabled.",
      },
      {
        q: "What is the payment processing fee (1.5% + fixed)?",
        a: "Stripe charges ~1.5% + a fixed fee per transaction. If you enable \"Include payment processing fee\" when creating an invoice, Puyer calculates the extra amount so that after Stripe's deduction you receive the full subtotal + VAT.",
      },
      {
        q: "How do reminders work?",
        a: "You can enable auto-reminders when creating an invoice (e.g. 1, 3, 7 days after send). Or send manual reminders from the invoice detail page. Reminders are rate-limited (e.g. once per 24 hours) to avoid spam.",
      },
      {
        q: "Can I void or mark an invoice as paid manually?",
        a: "Yes. On the invoice detail page you can Void (cancel) or Mark as paid. Use Mark as paid when you receive payment outside Stripe (bank transfer, cash, etc.).",
      },
      {
        q: "How do recurring invoices work?",
        a: "When creating an invoice, enable \"Recurring invoice\" and choose the interval (e.g. every 7 or 30 days). After the invoice is sent, Puyer automatically creates and sends a new copy at each interval until you stop it.",
      },
      {
        q: "Can I add my company logo and contact details?",
        a: "Yes. In Settings → Business profile, add your address, phone, company number, and VAT number. Upload your logo (PNG, JPEG, or WebP, max 1MB). These appear on invoices (PDF), the public payment page, and in the app header.",
      },
    ],
  },
  {
    id: "payments",
    title: "Payments",
    icon: CreditCard,
    items: [
      {
        q: "How does the client pay?",
        a: "When you send the payment link or email, the client opens it, sees the invoice, and clicks Pay. They're taken to Stripe Checkout to enter card details. After payment, they're redirected back and the invoice status updates to Paid.",
      },
      {
        q: "When do I receive the money?",
        a: "Stripe pays out to your connected bank account on their schedule (typically 2–7 days depending on region). Puyer does not hold funds; Stripe handles everything.",
      },
      {
        q: "What payment methods does the client see?",
        a: "Stripe Checkout shows card payments and any methods you've enabled in your Stripe Dashboard (e.g. Apple Pay, Google Pay). You manage this in your Stripe account.",
      },
      {
        q: "Can clients pay without an account?",
        a: "Yes. Clients only need the payment link. No sign-up or account required. They enter their card details on Stripe's secure page.",
      },
    ],
  },
  {
    id: "account",
    title: "Account & security",
    icon: User,
    items: [
      {
        q: "How do I sign in?",
        a: "You can use a magic link (we email you a login link) or password. Set a password in Settings → Account security so you can always sign in with email + password.",
      },
      {
        q: "What is the OTP (5-digit code) when signing in?",
        a: "If you use password sign-in, we send a 5-digit code by email as an extra security step. Enter it to complete login. You can tick \"Remember this device for 30 days\" to skip OTP on trusted devices.",
      },
      {
        q: "How do I change my business name or currency?",
        a: "Go to Settings → Business profile. Edit Business name, Default currency, Country, and Timezone. Currency changes affect how new invoices and dashboard stats are displayed.",
      },
      {
        q: "How do I delete my account?",
        a: "Contact support@puyer.org with your account email. We'll process the deletion request and confirm. Your invoices and data will be removed in line with our privacy practices.",
      },
    ],
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting",
    icon: HelpCircle,
    items: [
      {
        q: "The client didn't receive the invoice email",
        a: "Check spam/junk. Ensure the client's email is correct. If using Resend, check your Resend dashboard for delivery status. You can always copy the payment link and send it manually.",
      },
      {
        q: "Payment link shows 404 or error",
        a: "The link may be for a voided invoice or an invalid public ID. Ensure the invoice exists and is not voided. Try copying a fresh link from the invoice detail page.",
      },
      {
        q: "Logo upload fails with \"row-level security\" error",
        a: "Ensure the database migration for the logos storage bucket and RLS policies is applied (20250232000004). Run migrations in Supabase or contact support if self-hosted.",
      },
      {
        q: "PDF download doesn't show my logo",
        a: "Logos must be PNG or JPEG for PDF (WebP is not supported by the PDF library). Re-upload your logo as PNG or JPEG in Settings.",
      },
      {
        q: "Something else isn't working",
        a: "Contact support@puyer.org with details (what you did, what you expected, any error message). We usually respond within 1–2 business days.",
      },
    ],
  },
] as const;

function FaqAccordion({
  items,
}: {
  items: ReadonlyArray<{ q: string; a: string }>;
}) {
  return (
    <div className="space-y-1">
      {items.map((item, i) => (
        <details
          key={i}
          className="group rounded-xl border border-white/5 bg-[#121821]/50 transition-colors hover:border-white/10 [&[open]]:border-white/10 [&[open]]:bg-[#121821]/80"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 text-left font-medium text-white transition-colors hover:text-white/90 [&::-webkit-details-marker]:hidden">
            <span className="min-w-0 flex-1 text-sm sm:text-base">{item.q}</span>
            <ChevronDown className="size-5 shrink-0 text-white/50 transition-transform group-open:rotate-180" />
          </summary>
          <div className="border-t border-white/5 px-4 py-3">
            <p className="text-sm leading-relaxed text-white/70 sm:text-base">
              {item.a}
            </p>
          </div>
        </details>
      ))}
    </div>
  );
}

export default async function HelpPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_CATEGORIES.flatMap((cat) =>
      cat.items.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.a,
        },
      }))
    ),
  };

  return (
    <div className="min-h-screen bg-[#0B0F14]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0B0F14]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4 sm:h-16 sm:px-6">
          <Link
            href={user ? "/dashboard" : "/"}
            className="text-lg font-bold text-white transition-colors hover:text-white/90"
          >
            Puyer
          </Link>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Button asChild variant="ghost" size="sm" className="rounded-lg">
                  <Link href="/dashboard" className="flex items-center gap-2">
                    <LayoutDashboard className="size-4" />
                    Dashboard
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="rounded-lg">
                  <Link href="/settings">← Back</Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className="rounded-lg">
                  <Link href="/login">Log in</Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="rounded-lg">
                  <Link href="/">← Back</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
        <div className="text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#3B82F6]/10 text-[#3B82F6]">
            <HelpCircle className="size-7" />
          </div>
          <h1 className="mt-6 text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
            Help & FAQ
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-white/60 sm:text-base">
            Quick answers to common questions about invoices, payments, and your
            account.
          </p>
        </div>

        <nav
          className="mt-10 flex flex-wrap justify-center gap-2 sm:mt-12"
          aria-label="FAQ categories"
        >
          {FAQ_CATEGORIES.map((cat) => (
            <a
              key={cat.id}
              href={`#${cat.id}`}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#121821]/60 px-4 py-2 text-xs font-medium text-white/80 transition-colors hover:border-white/20 hover:bg-[#121821] hover:text-white sm:text-sm"
            >
              <cat.icon className="size-3.5 sm:size-4" />
              {cat.title}
            </a>
          ))}
        </nav>

        <div className="mt-12 space-y-14 sm:mt-16">
          {FAQ_CATEGORIES.map((cat) => (
            <section
              key={cat.id}
              id={cat.id}
              className="scroll-mt-24"
            >
              <div className="mb-6 flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-[#3B82F6]/10 text-[#3B82F6]">
                  <cat.icon className="size-5" />
                </div>
                <h2 className="text-lg font-semibold text-white sm:text-xl">
                  {cat.title}
                </h2>
              </div>
              <FaqAccordion items={cat.items} />
            </section>
          ))}
        </div>

        <section className="mt-16 rounded-2xl border border-white/10 bg-gradient-to-br from-[#121821] to-[#121821]/80 p-6 sm:p-8">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
            <div className="flex items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-xl bg-[#3B82F6]/10 text-[#3B82F6]">
                <Mail className="size-6" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Still need help?</h3>
                <p className="mt-0.5 text-sm text-white/60">
                  We reply within 1–2 business days.
                </p>
              </div>
            </div>
            <Button
              asChild
              className="shrink-0 rounded-xl bg-[#3B82F6] font-semibold hover:bg-[#2563EB]"
            >
              <a
                href="mailto:support@puyer.org"
                className="inline-flex items-center gap-2"
              >
                support@puyer.org
                <ArrowRight className="size-4" />
              </a>
            </Button>
          </div>
        </section>

        <div className="mt-10 flex flex-wrap justify-center gap-4 text-sm">
          <Link
            href="/terms"
            className="text-white/50 transition-colors hover:text-white/80"
          >
            Terms of Service
          </Link>
          <Link
            href="/"
            className="text-white/50 transition-colors hover:text-white/80"
          >
            Home
          </Link>
          <Link
            href="/login"
            className="text-white/50 transition-colors hover:text-white/80"
          >
            Log in
          </Link>
        </div>
      </main>
    </div>
  );
}
