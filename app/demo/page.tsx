import { createDemoInvoiceAction } from "./actions";
import { DemoInvoiceForm } from "./demo-invoice-form";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";

export default function DemoPage() {
  async function handleSubmit(formData: FormData) {
    "use server";
    const clientName = formData.get("clientName") as string;
    const clientEmail = (formData.get("clientEmail") as string) || undefined;
    const currency = (formData.get("currency") as string) || "GBP";
    const vatIncluded = formData.get("vatIncluded") === "true";
    const dueDate = (formData.get("dueDate") as string) || undefined;
    const lineItemsRaw = formData.get("lineItems") as string;
    let lineItems: { description: string; amount: number; discountPercent?: number }[] = [];
    try {
      lineItems = JSON.parse(lineItemsRaw || "[]");
    } catch {}

    const discountType = (formData.get("discountType") as string) || "none";
    const discountPercent = discountType === "percent" ? parseFloat((formData.get("discountPercent") as string) || "0") : 0;
    const discountCents = discountType === "fixed" ? parseInt((formData.get("discountCents") as string) || "0", 10) : 0;

    const result = await createDemoInvoiceAction({
      clientName,
      clientEmail,
      currency,
      lineItems,
      vatIncluded,
      dueDate,
      discountType: discountType as "percent" | "fixed" | "none",
      discountPercent,
      discountCents,
    });

    if ("error" in result) {
      return { error: result.error };
    }
    redirect(`/demo/success?publicId=${encodeURIComponent(result.publicId)}`);
  }

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

      <main className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-white sm:text-3xl">
            Try Puyer — create a demo invoice
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            No account needed. You&apos;ll see how clients view and pay invoices.
          </p>
        </div>

        <DemoInvoiceForm action={handleSubmit} />
      </main>
    </div>
  );
}
