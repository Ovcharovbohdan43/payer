import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Privacy Policy",
  description:
    "Privacy Policy for Puyer — how we collect, use, and protect your personal data.",
};

export default function PrivacyPolicyPage() {
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
        <h1 className="text-2xl font-bold text-white sm:text-3xl">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-white/60">
          Last updated: March 2025
        </p>

        <article className="mt-8 space-y-8 text-sm text-white/80 sm:text-base">
          <section>
            <h2 className="text-lg font-semibold text-white">
              1. Introduction and data controller
            </h2>
            <p className="mt-2">
              Puyer (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) operates the Puyer platform and
              related services (the &quot;Service&quot;). This Privacy Policy explains how we
              collect, use, disclose, and protect your personal data when you use the
              Service. We are the data controller in respect of the personal data we
              process for the purposes of providing the Service. By using the Service,
              you acknowledge that you have read and understood this Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">
              2. Data we collect
            </h2>
            <p className="mt-2">
              We collect and process the following categories of personal data:
            </p>
            <ul className="mt-3 list-inside list-disc space-y-1 pl-2">
              <li>
                <strong className="text-white">Account and profile data:</strong> email
                address, name (first and last), password (stored in hashed form), company
                or business name, phone number, address, website, company type or
                industry, country, timezone, default currency, and optional company logo.
              </li>
              <li>
                <strong className="text-white">Invoice and business data:</strong> data
                you enter when creating invoices (descriptions, amounts, due dates,
                notes), client names and contact details (email, address, phone, company
                name, VAT number) that you provide for the purpose of sending invoices and
                receiving payments.
              </li>
              <li>
                <strong className="text-white">Payment-related data:</strong> we do
                <strong className="text-white"> not</strong> store your or your
                clients&apos; full payment card numbers, bank account details, or card
                verification codes. Payment processing is carried out by Stripe. We
                store only references necessary to link transactions to your account
                (e.g. Stripe payment intent or transaction identifiers) and, where
                applicable, payout and fee information for your dashboard.
              </li>
              <li>
                <strong className="text-white">Technical and usage data:</strong> IP
                address, browser type and version, device information, and logs of access
                to the Service, where necessary for security, fraud prevention, and
                operation of the Service.
              </li>
              <li>
                <strong className="text-white">Communications:</strong> when you contact
                us (e.g. by email), we process the content of your messages and your
                contact details to respond and provide support.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">
              3. How we use your data
            </h2>
            <p className="mt-2">
              We use your personal data to: provide, maintain, and improve the Service;
              create and manage your account; process invoices and send them to your
              clients by email; enable payment processing via Stripe and display payment
              status and payouts; send you transactional emails (e.g. magic links,
              reminders) and, where you have agreed, marketing or product updates;
              enforce our Terms of Service and prevent fraud or abuse; comply with
              applicable laws and respond to lawful requests; and protect the security
              and integrity of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">
              4. Legal basis for processing (EEA/UK)
            </h2>
            <p className="mt-2">
              Where data protection laws (e.g. GDPR, UK GDPR) apply, we process your
              data on the following bases: (a) <strong className="text-white">performance
              of a contract</strong> — to provide the Service you have signed up for; (b){" "}
              <strong className="text-white">legitimate interests</strong> — for
              security, fraud prevention, analytics, and improving the Service, where
              balanced against your rights; (c) <strong className="text-white">consent</strong> —
              where we ask for your consent (e.g. optional marketing); (d){" "}
              <strong className="text-white">legal obligation</strong> — where we must
              retain or disclose data to comply with the law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">
              5. Data sharing and third parties
            </h2>
            <p className="mt-2">
              We share data only as necessary to operate the Service and as described
              here:
            </p>
            <ul className="mt-3 list-inside list-disc space-y-1 pl-2">
              <li>
                <strong className="text-white">Stripe:</strong> payment processing. Card
                and banking data are collected and processed directly by Stripe in
                accordance with their privacy policy. We do not store or have access to
                full card numbers or bank account details.
              </li>
              <li>
                <strong className="text-white">Supabase:</strong> hosting, database, and
                authentication. Data is stored in secure environments; see Supabase&apos;s
                privacy and security documentation.
              </li>
              <li>
                <strong className="text-white">Resend (or similar):</strong> sending
                transactional and marketing emails. Recipient addresses and email content
                are processed in accordance with our instructions and the provider&apos;s
                terms.
              </li>
              <li>
                <strong className="text-white">Analytics and monitoring:</strong> we may
                use analytics or error-tracking tools that process limited technical or
                usage data; we configure these to minimise personal data where
                possible.
              </li>
            </ul>
            <p className="mt-3">
              We do not sell your personal data. We may disclose data to authorities or
              others when required by law or to protect our rights and safety.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">
              6. International transfers
            </h2>
            <p className="mt-2">
              Your data may be processed in countries outside your country of residence,
              including the United States and the European Economic Area. We ensure
              appropriate safeguards (e.g. standard contractual clauses, adequacy
              decisions) where required by applicable law so that your data remains
              protected.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">
              7. Data retention
            </h2>
            <p className="mt-2">
              We retain your data for as long as your account is active and as needed to
              provide the Service and comply with legal, tax, or regulatory obligations.
              After you close your account, we may retain certain data for a limited
              period for legal or operational reasons (e.g. dispute resolution, audit),
              after which it is deleted or anonymised. You may request deletion of your
              data subject to our legal retention requirements.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">
              8. Security
            </h2>
            <p className="mt-2">
              We implement appropriate technical and organisational measures to protect
              your personal data against unauthorised access, alteration, disclosure, or
              destruction. This includes encryption in transit (TLS), access controls,
              and secure handling of credentials. Payment card data is never stored by
              us; it is handled entirely by Stripe in line with industry standards
              (e.g. PCI DSS).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">
              9. Your rights
            </h2>
            <p className="mt-2">
              Depending on your location, you may have the right to: access your
              personal data; correct inaccurate data; request erasure (&quot;right to be
              forgotten&quot;); restrict or object to certain processing; data portability;
              withdraw consent where processing is based on consent; and lodge a
              complaint with a supervisory authority. To exercise these rights, contact
              us at the email below. We will respond within the timeframes required by
              applicable law. You can also close your account and request deletion of
              your data from the Service; we will process such requests in line with our
              retention and legal obligations.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">
              10. Cookies and similar technologies
            </h2>
            <p className="mt-2">
              We use cookies and similar technologies (e.g. local storage) that are
              strictly necessary for the operation and security of the Service (e.g.
              session and authentication). We may also use analytics or functional
              cookies to improve the Service; where required by law, we will obtain
              your consent for non-essential cookies. You can control cookies through
              your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">
              11. Children
            </h2>
            <p className="mt-2">
              The Service is not directed at individuals under 16 (or higher age where
              required). We do not knowingly collect personal data from children. If you
              become aware that a child has provided us with personal data, please
              contact us and we will take steps to delete it.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">
              12. Changes to this policy
            </h2>
            <p className="mt-2">
              We may update this Privacy Policy from time to time. We will post the
              updated version on this page and update the &quot;Last updated&quot; date. For
              material changes, we may notify you by email or through the Service. Your
              continued use of the Service after the effective date of changes
              constitutes acceptance of the updated policy. If you do not agree, you
              should stop using the Service and may close your account.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">
              13. Contact
            </h2>
            <p className="mt-2">
              For any questions about this Privacy Policy, your personal data, or to
              exercise your rights, contact us at{" "}
              <a
                href="mailto:support@puyer.org"
                className="text-[#3B82F6] underline hover:text-blue-400"
              >
                support@puyer.org
              </a>
              . We will respond as soon as practicable and in any event within the
              periods required by applicable data protection law.
            </p>
          </section>
        </article>

        <div className="mt-12 flex justify-center gap-3">
          <Button asChild variant="outline">
            <Link href="/terms">Terms of Service</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </main>

      <footer className="mt-16 border-t border-white/5 px-4 py-6">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 text-center text-sm text-white/50 sm:flex-row sm:justify-between">
          <span>© Puyer</span>
          <div className="flex gap-6">
            <Link href="/terms" className="hover:text-white/80">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-white/80">
              Privacy
            </Link>
            <Link href="/help" className="hover:text-white/80">
              Help
            </Link>
            <Link href="mailto:support@puyer.org" className="hover:text-white/80">
              support@puyer.org
            </Link>
            <Link href="/" className="hover:text-white/80">
              puyer.org
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
