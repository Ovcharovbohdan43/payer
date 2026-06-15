"use client";

import type { ReactNode } from "react";
import { formatAmount } from "@/lib/invoices/utils";
import {
  resolveInvoiceTheme,
  type InvoiceVisualConfig,
} from "@/lib/invoice-visual-config";

export type PdfPreviewLineItem = {
  description: string;
  amountCents: number;
  discountPercent?: number;
};

type InvoicePdfPreviewProps = {
  businessName: string;
  logoUrl?: string | null;
  address?: string | null;
  phone?: string | null;
  companyNumber?: string | null;
  vatNumber?: string | null;
  clientName?: string | null;
  clientEmail?: string | null;
  invoiceNumber?: string;
  currency: string;
  lineItems: PdfPreviewLineItem[];
  subtotalCents: number;
  invoiceDiscountCents?: number;
  invoiceDiscountLabel?: string | null;
  vatIncluded?: boolean;
  vatCents?: number;
  paymentProcessingFeeCents?: number;
  totalCents: number;
  dueDate?: string | null;
  notes?: string | null;
  visualConfig: InvoiceVisualConfig;
};

function money(cents: number, currency: string): string {
  return formatAmount(Math.round(cents), currency);
}

function formatPreviewDate(value?: string | null): string {
  if (!value) {
    return new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function InvoicePdfPreview({
  businessName,
  logoUrl,
  address,
  phone,
  companyNumber,
  vatNumber,
  clientName,
  clientEmail,
  invoiceNumber = "INV-0001",
  currency,
  lineItems,
  subtotalCents,
  invoiceDiscountCents = 0,
  invoiceDiscountLabel,
  vatIncluded = false,
  vatCents = 0,
  paymentProcessingFeeCents = 0,
  totalCents,
  dueDate,
  notes,
  visualConfig,
}: InvoicePdfPreviewProps) {
  const theme = resolveInvoiceTheme(visualConfig, visualConfig.baseDesign).pdf;
  const contactLines: string[] = [];

  if (visualConfig.showBusinessDetails) {
    if (address?.trim()) contactLines.push(address.trim());
    if (phone?.trim()) contactLines.push(phone.trim());
    if (companyNumber?.trim()) contactLines.push(`Company no: ${companyNumber.trim()}`);
    if (vatNumber?.trim()) contactLines.push(`VAT: ${vatNumber.trim()}`);
  }

  const rows = lineItems.filter((item) => item.description.trim());

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <LabelText>PDF invoice preview</LabelText>
        <span className="text-xs text-muted-foreground">
          Matches the downloaded PDF layout
        </span>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-transparent p-3">
        <div className="mx-auto min-h-[620px] w-full max-w-[760px] overflow-hidden rounded-sm bg-white text-zinc-950 shadow-2xl">
          <div
            className="px-8 py-7"
            style={{
              backgroundColor: theme.headerBg,
              color: theme.headerText,
              borderBottom:
                theme.headerBg === "#FFFFFF" ? `1px solid ${theme.border}` : undefined,
            }}
          >
            <div className="flex items-start justify-between gap-6">
              <div className="min-w-0 flex-1">
                {visualConfig.showLogo && logoUrl?.trim() ? (
                  <div className="mb-4 flex max-h-16 max-w-[180px] items-start">
                    {/* Match the PDF: show the real logo shape, constrained by max size. */}
                    <img
                      src={logoUrl.trim()}
                      alt={`${businessName || "Business"} logo`}
                      className="block max-h-16 max-w-[180px] object-contain"
                    />
                  </div>
                ) : null}
                <h3 className="text-2xl font-bold">{businessName || "Your business"}</h3>
                {contactLines.length > 0 ? (
                  <div className="mt-2 space-y-0.5 text-xs" style={{ color: theme.headerMuted }}>
                    {contactLines.map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="text-right">
                <div
                  className="inline-block px-4 py-2"
                  style={{
                    backgroundColor: theme.invoiceBadgeBg,
                    color: theme.invoiceBadgeText,
                  }}
                >
                  <p className="text-[10px] font-bold uppercase tracking-wider">Invoice</p>
                  <p className="text-xl font-bold tabular-nums">{invoiceNumber}</p>
                </div>
                <p className="mt-3 text-xs" style={{ color: theme.headerMuted }}>
                  Date: {formatPreviewDate(null)}
                </p>
              </div>
            </div>

            <div className="mt-6 text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: theme.headerMuted }}>
                Bill to
              </p>
              <p className="mt-1 text-sm font-bold">{clientName || "Client name"}</p>
              {clientEmail ? (
                <p className="text-xs" style={{ color: theme.headerMuted }}>
                  {clientEmail}
                </p>
              ) : null}
            </div>
          </div>

          <div className="px-8 py-8">
            <div className="overflow-hidden rounded-sm border" style={{ borderColor: theme.border }}>
              <div
                className="grid grid-cols-[1fr_130px] px-4 py-3 text-xs font-bold"
                style={{
                  backgroundColor: theme.tableHeaderBg,
                  color: theme.tableHeaderText,
                }}
              >
                <span>Description</span>
                <span className="text-right">Amount</span>
              </div>
              {rows.length > 0 ? (
                rows.map((item, index) => {
                  const discount = item.discountPercent ?? 0;
                  const amountAfterDiscount = Math.round(
                    item.amountCents * (1 - discount / 100)
                  );

                  return (
                    <div
                      key={`${item.description}-${index}`}
                      className="grid grid-cols-[1fr_130px] border-t px-4 py-3 text-sm"
                      style={{ borderColor: theme.border }}
                    >
                      <div>
                        <p>{item.description}</p>
                        {discount > 0 ? (
                          <p className="mt-1 text-xs text-zinc-500">
                            Discount {discount}%
                          </p>
                        ) : null}
                      </div>
                      <span className="text-right font-semibold tabular-nums">
                        {money(amountAfterDiscount, currency)}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="border-t px-4 py-8 text-sm text-zinc-500" style={{ borderColor: theme.border }}>
                  Add services to see the PDF table.
                </div>
              )}
            </div>

            <div className="mt-5 ml-auto w-full max-w-sm space-y-2 text-sm">
              <BreakdownRow label="Subtotal" value={money(subtotalCents, currency)} />
              {invoiceDiscountCents > 0 ? (
                <BreakdownRow
                  label={invoiceDiscountLabel || "Discount"}
                  value={`-${money(invoiceDiscountCents, currency)}`}
                  valueClassName="text-emerald-600"
                />
              ) : null}
              <BreakdownRow
                label={vatIncluded ? "VAT (20% incl.)" : "VAT (20%)"}
                value={money(vatCents, currency)}
              />
              {paymentProcessingFeeCents > 0 ? (
                <BreakdownRow
                  label="Payment processing fee"
                  value={money(paymentProcessingFeeCents, currency)}
                />
              ) : null}
              <div
                className="mt-3 flex items-center justify-between rounded-sm border px-4 py-3"
                style={{
                  backgroundColor: theme.totalBg,
                  borderColor: theme.border,
                  color: theme.totalText,
                }}
              >
                <span className="font-bold">Total</span>
                <span className="text-xl font-bold tabular-nums">
                  {money(totalCents, currency)}
                </span>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-500">
              <span>{dueDate ? `Due: ${formatPreviewDate(dueDate)}` : "Due date not set"}</span>
            </div>

            {visualConfig.showNotes && notes?.trim() ? (
              <div className="mt-5">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Notes
                </p>
                <p className="whitespace-pre-wrap text-sm text-zinc-700">{notes.trim()}</p>
              </div>
            ) : null}
          </div>

          <div
            className="mt-auto px-8 py-5 text-xs"
            style={{
              backgroundColor: theme.brandDark,
              color: theme.footerText,
            }}
          >
            <p className="font-medium">Thank you for your business.</p>
            <p className="mt-1 opacity-75">Powered by Puyer</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function LabelText({ children }: { children: ReactNode }) {
  return <p className="text-sm font-medium">{children}</p>;
}

function BreakdownRow({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-zinc-600">
      <span>{label}</span>
      <span className={`font-semibold tabular-nums text-zinc-950 ${valueClassName ?? ""}`}>
        {value}
      </span>
    </div>
  );
}
