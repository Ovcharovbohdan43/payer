"use client";

import { useState } from "react";
import { toast } from "sonner";
import { downloadPdf } from "@/lib/pdf/download-pdf";

type Props = { publicId: string; fullWidth?: boolean };

/** Button to download invoice PDF via fetch (more reliable than direct link). */
export function DownloadPdfLink({ publicId, fullWidth }: Props) {
  const [pending, setPending] = useState(false);

  const handleClick = async () => {
    setPending(true);
    const r = await downloadPdf(`/api/invoices/public/${publicId}/pdf`);
    setPending(false);
    if (r.ok) {
      toast.success("PDF downloaded");
    } else {
      toast.error(r.error ?? "Could not download PDF");
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className={`inline-flex h-12 items-center justify-center rounded-xl border border-white/10 px-6 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground disabled:opacity-60 ${
        fullWidth ? "w-full" : "flex-1 sm:flex-initial"
      }`}
    >
      {pending ? "Downloading…" : "Download PDF"}
    </button>
  );
}
