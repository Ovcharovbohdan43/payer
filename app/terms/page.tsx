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
          Last updated: February 2025
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
            <h2 className="text-lg font-semibold text-white">5. Acceptable Use</h2>
            <p className="mt-2">
              You agree to use the Service only for lawful purposes and in accordance with
              these Terms. You must not: (a) use the Service for any illegal or fraudulent
              activity; (b) send invoices or collect payments for illegal goods or
              services; (c) harass, abuse, or harm others; (d) attempt to gain unauthorized
              access to the Service or related systems; (e) interfere with or disrupt the
              Service; (f) use the Service in any way that violates applicable laws or
              regulations. We reserve the right to suspend or terminate your account for
              any violation of this section.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">6. Payment Terms</h2>
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
            <h2 className="text-lg font-semibold text-white">7. Your Content and Data</h2>
            <p className="mt-2">
              You retain ownership of the content you create (invoices, client data, etc.).
              By using the Service, you grant us a limited license to process, store, and
              transmit your content as necessary to provide the Service. We will not sell
              your data to third parties. Our handling of personal data is described in
              our Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">8. Intellectual Property</h2>
            <p className="mt-2">
              The Service, including its design, software, trademarks, and branding, is
              owned by us or our licensors. You may not copy, modify, distribute, or
              create derivative works based on the Service without our prior written
              consent.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">9. Limitation of Liability</h2>
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
            <h2 className="text-lg font-semibold text-white">10. Indemnification</h2>
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
            <h2 className="text-lg font-semibold text-white">11. Termination</h2>
            <p className="mt-2">
              You may close your account at any time. We may suspend or terminate your
              account and access to the Service for any reason, including breach of these
              Terms, with or without notice. Upon termination, your right to use the
              Service ceases immediately. Sections that by their nature should survive
              (including Sections 7–10, 12) will survive termination.
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
