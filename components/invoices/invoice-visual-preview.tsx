"use client";

import { PublicLogo } from "@/components/public-logo";
import { formatAmount } from "@/lib/invoices/utils";
import {
  resolvePublicPageTheme,
  type InvoiceVisualConfig,
} from "@/lib/invoice-visual-config";
import type { InvoiceDesignKey } from "@/lib/invoice-designs";

export type InvoicePreviewLineItem = {
  description: string;
  amountCents: number;
  discountPercent?: number;
};

export type InvoiceVisualPreviewProps = {
  businessName: string;
  logoUrl?: string | null;
  address?: string | null;
  phone?: string | null;
  companyNumber?: string | null;
  vatNumber?: string | null;
  clientName?: string | null;
  invoiceNumber?: string;
  currency: string;
  totalCents: number;
  dueDate?: string | null;
  notes?: string | null;
  lineItems: InvoicePreviewLineItem[];
  vatIncluded?: boolean;
  paymentProcessingFeeCents?: number;
  visualConfig: InvoiceVisualConfig;
  fallbackDesign?: InvoiceDesignKey | null;
  compact?: boolean;
};

function formatMoney(cents: number, currency: string): string {
  return formatAmount(cents, currency);
}

export function InvoiceVisualPreview({
  businessName,
  logoUrl,
  address,
  phone,
  companyNumber,
  vatNumber,
  clientName,
  invoiceNumber = "INV-0001",
  currency,
  totalCents,
  dueDate,
  notes,
  lineItems,
  visualConfig,
  fallbackDesign,
  compact = false,
  paymentProcessingFeeCents = 0,
}: InvoiceVisualPreviewProps) {
  const theme = resolvePublicPageTheme(visualConfig, fallbackDesign ?? visualConfig.baseDesign);
  const showLogo = visualConfig.showLogo;
  const showBusinessDetails = visualConfig.showBusinessDetails;
  const showNotes = visualConfig.showNotes;

  const contactLines: string[] = [];
  if (showBusinessDetails) {
    if (address?.trim()) contactLines.push(address.trim());
    if (phone?.trim()) contactLines.push(phone.trim());
    if (companyNumber?.trim()) contactLines.push(`Company no: ${companyNumber.trim()}`);
    if (vatNumber?.trim()) contactLines.push(`VAT: ${vatNumber.trim()}`);
  }

  const visibleLineItems = lineItems.filter((item) => item.description.trim());

  return (
    <div
      className={`overflow-hidden rounded-[20px] border ${compact ? "text-[11px]" : "text-sm"}`}
      style={{
        backgroundColor: theme.pageBg,
        borderColor: theme.borderColor,
      }}
    >
      <div
        className={`${compact ? "px-4 py-4" : "px-6 py-5"}`}
        style={{ backgroundColor: theme.headerBg }}
      >
        <div className="flex items-start gap-3">
          {showLogo ? (
            <PublicLogo
              logoUrl={logoUrl ?? ""}
              businessName={businessName}
              size={compact ? "sm" : "md"}
            />
          ) : null}
          <div className="min-w-0 flex-1">
            <p
              className={`font-semibold ${compact ? "text-sm" : "text-base"}`}
              style={{ color: theme.headerText }}
            >
              {businessName || "Your business"}
            </p>
            {contactLines.length > 0 ? (
              <div className="mt-1 space-y-0.5" style={{ color: theme.headerMuted }}>
                {contactLines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div
        className={`${compact ? "p-4" : "p-6"}`}
        style={{ backgroundColor: theme.cardBg, color: theme.primaryTextColor }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: theme.mutedTextColor }}>
              Total to pay
            </p>
            <p className={`font-bold tabular-nums ${compact ? "text-2xl" : "text-3xl"}`}>
              {formatMoney(totalCents, currency)}
            </p>
            <p className="mt-1" style={{ color: theme.mutedTextColor }}>
              Invoice {invoiceNumber}
            </p>
            {clientName ? (
              <p className="mt-1" style={{ color: theme.mutedTextColor }}>
                Bill to: {clientName}
              </p>
            ) : null}
          </div>
        </div>

        {visibleLineItems.length > 0 ? (
          <ul className="mt-4 space-y-1" style={{ color: theme.mutedTextColor }}>
            {visibleLineItems.map((item, index) => {
              const discount = item.discountPercent ?? 0;
              const amountAfterDiscount = Math.round(
                item.amountCents * (1 - discount / 100)
              );
              return (
                <li key={`${item.description}-${index}`} className="flex justify-between gap-2">
                  <span>{item.description}</span>
                  <span className="tabular-nums">
                    {formatMoney(amountAfterDiscount, currency)}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <div
            className="mt-4 rounded-xl px-3 py-2"
            style={{ backgroundColor: theme.secondaryCardBg, color: theme.mutedTextColor }}
          >
            Add services to see them in the invoice preview.
          </div>
        )}

        {paymentProcessingFeeCents > 0 ? (
          <div
            className="mt-3 flex justify-between gap-2 border-t pt-3"
            style={{ borderColor: theme.borderColor, color: theme.mutedTextColor }}
          >
            <span>Payment processing fee</span>
            <span className="tabular-nums">{formatMoney(paymentProcessingFeeCents, currency)}</span>
          </div>
        ) : null}

        {dueDate ? (
          <p className="mt-3" style={{ color: theme.mutedTextColor }}>
            Due: {new Date(dueDate).toLocaleDateString("en-US")}
          </p>
        ) : null}

        {showNotes && notes?.trim() ? (
          <div
            className="mt-4 rounded-xl px-3 py-2"
            style={{ backgroundColor: theme.secondaryCardBg, color: theme.mutedTextColor }}
          >
            <p className="text-xs font-medium uppercase tracking-wide">Notes</p>
            <p className="mt-1 whitespace-pre-wrap">{notes.trim()}</p>
          </div>
        ) : null}

        <div className={`${compact ? "mt-4" : "mt-6"} flex flex-col gap-2 sm:flex-row`}>
          <div
            className={`inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-medium ${compact ? "h-9 px-3 text-xs" : ""}`}
            style={{
              backgroundColor: theme.buttonBg,
              color: theme.buttonText,
              border: `1px solid ${theme.buttonBorder}`,
            }}
          >
            Pay invoice
          </div>
          <div
            className={`inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-medium ${compact ? "h-9 px-3 text-xs" : ""}`}
            style={{
              backgroundColor: theme.secondaryCardBg,
              color: theme.primaryTextColor,
              border: `1px solid ${theme.borderColor}`,
            }}
          >
            Download PDF
          </div>
        </div>

        <p className="mt-6 text-center text-xs" style={{ color: theme.mutedTextColor }}>
          Powered by Puyer
        </p>
      </div>
    </div>
  );
}
