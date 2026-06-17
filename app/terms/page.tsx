import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Terms of Service",
  description: "Terms of Service for Puyer — invoice and payment platform.",
};

export default function TermsOfServicePage() {
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
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-white/60">
          Last updated: June 2026
        </p>

        <article className="mt-8 space-y-8 text-sm text-white/80 sm:text-base">
          <section>
            <h2 className="text-lg font-semibold text-white">1. Acceptance of Terms</h2>
            <p className="mt-2">
              By accessing or using the Puyer platform (&quot;Service&quot;), operated by Puyer
              (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), you agree to be bound by these Terms of
              Service (&quot;Terms&quot;). If you do not agree to these Terms, you may not use the
              Service. By creating an account or clicking &quot;Create account&quot; or similar, you
              confirm that you have read, understood, and accept these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">2. Description of Service</h2>
            <p className="mt-2">
              Puyer is an online platform that enables users to create, send, and manage
              invoices and receive payments. The Service includes: invoice creation and
              PDF generation; sending invoices by email; payment processing via Stripe;
              payment tracking and reminders; client management; and related features as
              may be added from time to time. We use third-party services, including
              Stripe for payment processing and Resend for email delivery. Your use of
              those services may be subject to their respective terms and policies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">3. Eligibility</h2>
            <p className="mt-2">
              You must be at least 18 years old and have the legal capacity to enter into
              a binding agreement to use the Service. If you are using the Service on
              behalf of a business or other entity, you represent that you have authority
              to bind that entity to these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">4. Account Registration and Security</h2>
            <p className="mt-2">
              You must provide accurate and complete information when creating an account.
              You are responsible for maintaining the confidentiality of your account
              credentials and for all activities that occur under your account. You must
              notify us promptly of any unauthorized access or use.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">5. Prohibited Activities and Acceptable Use</h2>
            <p className="mt-2">
              Puyer is a business invoicing and payment platform for lawful commercial
              activities only. You agree to use the Service exclusively for legitimate
              business purposes and in compliance with all applicable laws and
              regulations in your jurisdiction and in the jurisdictions of your clients.
            </p>
            <p className="mt-3 font-medium text-white">
              You must not use the Service, directly or indirectly, to invoice, collect,
              facilitate, or promote any of the following (including related goods,
              services, or activities):
            </p>
            <ul className="mt-3 list-inside list-disc space-y-1 pl-2">
              <li>Illegal goods, services, or activities of any kind</li>
              <li>Gambling, betting, casinos, lottery services, or other games of chance where prohibited or unlicensed</li>
              <li>Weapons, firearms, ammunition, explosives, or related accessories where sale or transfer is restricted or illegal</li>
              <li>Controlled substances, illegal drugs, narcotics, or prescription medicines sold without proper authorization</li>
              <li>Counterfeit, stolen, or fraudulently obtained goods or services</li>
              <li>Human trafficking, exploitation, or abuse</li>
              <li>Child sexual abuse material or any content involving minors in a sexual context</li>
              <li>Terrorist financing, money laundering, sanctions evasion, or other financial crime</li>
              <li>Pyramid schemes, unlicensed investment schemes, or deceptive financial products</li>
              <li>Adult content or services where prohibited by law or Stripe&apos;s policies</li>
              <li>Any activity that violates Stripe&apos;s restricted or prohibited business lists or payment network rules</li>
              <li>Any other activity that is unlawful, harmful, deceptive, or that we reasonably determine is incompatible with the Service</li>
            </ul>
            <p className="mt-3">
              You must not: (a) harass, abuse, or harm others; (b) attempt to gain
              unauthorized access to the Service or related systems; (c) interfere with or
              disrupt the Service; (d) misrepresent your identity, business, or the
              nature of goods or services invoiced through the Service; or (e) use the
              Service to process payments for third parties in a manner that conceals the
              true merchant or purpose of the transaction (&quot;transaction laundering&quot;).
            </p>
            <p className="mt-3">
              We may monitor use of the Service for compliance, cooperate with payment
              providers and authorities, and investigate suspected violations. You are
              solely responsible for ensuring that your business and every invoice you
              create complies with these restrictions.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">6. Enforcement and Account Termination</h2>
            <p className="mt-2">
              If we discover, reasonably suspect, or are notified of a violation of these
              Terms — including use of the Service for any prohibited activity described
              in Section 5 — we may, at our sole discretion and without prior notice:
              suspend your account, restrict access to the Service, disconnect payment
              processing, withhold or reverse payouts where permitted by law and our
              payment providers, and{" "}
              <strong className="text-white">permanently delete your account</strong>.
            </p>
            <p className="mt-3">
              Permanent deletion is at our sole discretion and may be applied
              unilaterally. Upon termination for violation, you lose access to your
              account and data immediately. We are not obliged to provide a refund,
              explanation, or appeal process, except where required by mandatory
              applicable law. We may retain certain records as required by law or for
              fraud prevention.
            </p>
            <p className="mt-3">
              You may close your account at any time if you are in good standing. Sections
              that by their nature should survive termination (including liability,
              indemnification, and governing law) will survive.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">7. Payment Terms</h2>
            <p className="mt-2">
              Payment processing is provided by Stripe. When you receive payments through
              the Service, Stripe fees and applicable taxes apply. You are responsible for
              any fees charged by Stripe and for compliance with Stripe&apos;s terms. Puyer does
              not store your full payment card details. Refunds and disputes are handled
              through Stripe in accordance with their policies. You are solely responsible
              for the accuracy of invoices you create and for any tax obligations arising
              from your use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">8. Your Content and Data</h2>
            <p className="mt-2">
              You retain ownership of the content you create (invoices, client data, etc.).
              By using the Service, you grant us a limited license to process, store, and
              transmit your content as necessary to provide the Service. We will not sell
              your data to third parties. Our handling of personal data is described in
              our Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">9. Intellectual Property</h2>
            <p className="mt-2">
              The Service, including its design, software, trademarks, and branding, is
              owned by us or our licensors. You may not copy, modify, distribute, or
              create derivative works based on the Service without our prior written
              consent.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">10. Limitation of Liability</h2>
            <p className="mt-2">
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, PUYER AND ITS
              AFFILIATES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
              CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR FOR ANY LOSS OF PROFITS, DATA, OR
              GOODWILL, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE SERVICE.
              OUR TOTAL LIABILITY FOR ANY CLAIMS ARISING FROM OR RELATED TO THE SERVICE
              SHALL NOT EXCEED THE AMOUNT YOU PAID US (IF ANY) IN THE TWELVE MONTHS
              PRECEDING THE CLAIM, OR ONE HUNDRED US DOLLARS ($100), WHICHEVER IS
              GREATER. Some jurisdictions do not allow certain limitations of liability,
              so some of the above may not apply to you.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">11. Indemnification</h2>
            <p className="mt-2">
              You agree to indemnify, defend, and hold harmless Puyer and its officers,
              directors, employees, and agents from and against any claims, damages,
              losses, liabilities, and expenses (including reasonable legal fees) arising
              from: (a) your use of the Service; (b) your violation of these Terms; (c)
              your violation of any third-party rights; or (d) any content or data you
              submit through the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">12. Changes to Terms</h2>
            <p className="mt-2">
              We may modify these Terms at any time. We will notify you of material
              changes by posting the updated Terms on this page and updating the
              &quot;Last updated&quot; date. Your continued use of the Service after such changes
              constitutes acceptance of the new Terms. If you do not agree, you must stop
              using the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">13. Governing Law and Disputes</h2>
            <p className="mt-2">
              These Terms shall be governed by and construed in accordance with the laws
              of England and Wales, without regard to conflict of law principles. Any
              dispute arising from or relating to these Terms or the Service shall be
              subject to the exclusive jurisdiction of the courts of England and Wales.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">14. General</h2>
            <p className="mt-2">
              These Terms constitute the entire agreement between you and Puyer regarding
              the Service. If any provision is found unenforceable, the remaining
              provisions remain in effect. Our failure to enforce any right does not
              constitute a waiver of that right.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">15. Contact</h2>
            <p className="mt-2">
              For questions about these Terms or the Service, contact us at{" "}
              <a
                href="mailto:support@puyer.org"
                className="text-[#3B82F6] underline hover:text-blue-400"
              >
                support@puyer.org
              </a>
              .
            </p>
          </section>
        </article>

        <div className="mt-12 flex justify-center">
          <Button asChild variant="outline">
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </main>

      <footer className="mt-16 border-t border-white/5 px-4 py-6">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 text-center text-sm text-white/50 sm:flex-row sm:justify-between">
          <span>© Puyer</span>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-white/80">
              Privacy
            </Link>
            <Link href="/updates" className="hover:text-white/80">
              Updates
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
