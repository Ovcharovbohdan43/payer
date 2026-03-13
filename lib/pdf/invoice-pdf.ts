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

export async function generateInvoicePdf(
  data: InvoicePdfData
): Promise<Uint8Array> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(
    React.createElement(InvoiceDocument, { data }) as any
  );
  return new Uint8Array(buffer);
}
