import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { CheckCircle2, ArrowRight } from "lucide-react";

export default async function DemoSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ publicId?: string }>;
}) {
  const { publicId } = await searchParams;
  const invoicePath = publicId ? `/i/${publicId}` : null;

  return (
    <div className="min-h-screen bg-[#0B0F14]">
      <header className="border-b border-white/5 bg-[#0B0F14]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4 sm:h-16 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-xl font-bold tracking-tight text-white"
          >
            <Image src="/logo.png" alt="Puyer" width={32} height={32} className="h-8 w-8" />
            Puyer
          </Link>
          <Link
            href="/register"
            className="text-sm font-medium text-[#3B82F6] hover:text-blue-400"
          >
            Sign up
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 py-12 sm:py-20">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="h-10 w-10" strokeWidth={2} />
          </div>
          <h1 className="mt-6 text-2xl font-bold text-white sm:text-3xl">
            Demo invoice created
          </h1>
          <p className="mt-3 text-muted-foreground">
            See how your clients would view and pay the invoice.
          </p>

          {invoicePath && (
            <div className="mt-8">
              <Button asChild size="lg" className="h-12 rounded-xl">
                <Link href={invoicePath} className="flex items-center gap-2">
                  View invoice page
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}

          <div className="mt-16 rounded-2xl border border-white/10 bg-[#121821]/80 p-8">
            <h2 className="text-xl font-bold text-white">
              Liked it? Create an account
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Use Puyer for real: unlimited invoices, Stripe payments, client
              management, email reminders & more.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button asChild size="lg" className="h-12 rounded-xl bg-[#3B82F6] font-semibold hover:bg-[#2563EB]">
                <Link href="/register">Create free account</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 rounded-xl">
                <Link href="/">Back to home</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
