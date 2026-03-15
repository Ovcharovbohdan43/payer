import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { InvoiceDocument } from "@/components/pdf/InvoiceDocument";

export type InvoiceLineItemPdf = {
  description: string;
  amountCents: number;
};

export type InvoicePdfData = {
  businessName: string;
  invoiceNumber: string;
  amountCents: number;
  currency: string;
  /** Line items for the table; if empty, falls back to single "Invoice payment" row */
  lineItems: InvoiceLineItemPdf[];
  dueDate: string | null;
  clientName: string;
  clientEmail?: string | null;
  /** Client address (from client profile when linked) */
  clientAddress?: string | null;
  /** Client phone (from client profile when linked) */
  clientPhone?: string | null;
  /** Client company name (from client profile when linked) */
  clientCompanyName?: string | null;
  /** Client VAT number (from client profile when linked) */
  clientVatNumber?: string | null;
  status: string;
  createdAt?: string | null;
  notes?: string | null;
  /** true = amount is gross (VAT included), false = amount is net (VAT added) */
  vatIncluded?: boolean;
  /** Payment processing fee in cents; shown as row before Total when set */
  paymentProcessingFeeCents?: number | null;
  /** Company logo URL; fetched and embedded in PDF (PNG/JPG only; WebP not supported) */
  logoUrl?: string | null;
  /** Contact & legal info shown under business name */
  address?: string | null;
  phone?: string | null;
  companyNumber?: string | null;
  vatNumber?: string | null;
  /** Invoice-level discount */
  discountType?: "percent" | "fixed" | null;
  discountValue?: number | null;
};

/** Ensure all required fields are valid (no NaN, null strings) to avoid react-pdf errors. */
function sanitizeInvoicePdfData(data: InvoicePdfData): InvoicePdfData {
  const safeNum = (n: unknown): number =>
    typeof n === "number" && Number.isFinite(n) ? n : 0;
  const safeStr = (s: unknown): string =>
    s != null && typeof s === "string" ? s : "";

  const lineItems: InvoiceLineItemPdf[] = (data.lineItems ?? []).map((i) => ({
    description: safeStr(i?.description).trim() || "Item",
    amountCents: Math.round(safeNum(i?.amountCents)),
  })).filter((i) => i.amountCents >= 0);

  return {
    businessName: safeStr(data.businessName).trim() || "Business",
    invoiceNumber: safeStr(data.invoiceNumber).trim() || "INV",
    amountCents: Math.round(safeNum(data.amountCents)),
    currency: safeStr(data.currency).trim() || "USD",
    lineItems,
    dueDate: data.dueDate ?? null,
    clientName: safeStr(data.clientName).trim() || "Client",
    clientEmail: data.clientEmail != null ? safeStr(data.clientEmail) : undefined,
    clientAddress: data.clientAddress != null ? safeStr(data.clientAddress) : undefined,
    clientPhone: data.clientPhone != null ? safeStr(data.clientPhone) : undefined,
    clientCompanyName: data.clientCompanyName != null ? safeStr(data.clientCompanyName) : undefined,
    clientVatNumber: data.clientVatNumber != null ? safeStr(data.clientVatNumber) : undefined,
    status: safeStr(data.status).trim() || "draft",
    createdAt: data.createdAt ?? undefined,
    notes: data.notes != null ? safeStr(data.notes) : undefined,
    vatIncluded: data.vatIncluded,
    paymentProcessingFeeCents:
      data.paymentProcessingFeeCents != null && Number.isFinite(Number(data.paymentProcessingFeeCents))
        ? Math.round(Number(data.paymentProcessingFeeCents))
        : undefined,
    logoUrl: data.logoUrl && typeof data.logoUrl === "string" ? data.logoUrl : undefined,
    address: data.address != null ? safeStr(data.address) : undefined,
    phone: data.phone != null ? safeStr(data.phone) : undefined,
    companyNumber: data.companyNumber != null ? safeStr(data.companyNumber) : undefined,
    vatNumber: data.vatNumber != null ? safeStr(data.vatNumber) : undefined,
    discountType: data.discountType === "percent" || data.discountType === "fixed" ? data.discountType : undefined,
    discountValue:
      data.discountValue != null && Number.isFinite(Number(data.discountValue))
        ? Math.round(Number(data.discountValue))
        : undefined,
  };
}

export async function generateInvoicePdf(
  data: InvoicePdfData
): Promise<Uint8Array> {
  const safe = sanitizeInvoicePdfData(data);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(
    React.createElement(InvoiceDocument, { data: safe }) as any
  );
  return new Uint8Array(buffer);
}
