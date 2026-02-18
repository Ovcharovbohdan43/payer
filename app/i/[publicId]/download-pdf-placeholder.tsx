"use client";

type Props = { publicId: string; fullWidth?: boolean };

/** Link to download invoice PDF. */
export function DownloadPdfLink({ publicId, fullWidth }: Props) {
  return (
    <a
      href={`/api/invoices/public/${publicId}/pdf`}
      target="_blank"
      rel="noopener noreferrer"
      download
      className={`inline-flex h-12 items-center justify-center rounded-xl border border-white/10 px-6 text-sm font-medium text-muted-foreground hover:bg-white/5 hover:text-foreground ${
        fullWidth ? "w-full" : "flex-1 sm:flex-initial"
      }`}
    >
      Download PDF
    </a>
  );
}
