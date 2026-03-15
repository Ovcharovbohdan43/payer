import React from "react";
import { Document, Page, View, Text } from "@react-pdf/renderer";
import { styles } from "./styles";
import { InvoiceHeader } from "./InvoiceHeader";
import { InvoiceTable } from "./InvoiceTable";
import { InvoiceFooter } from "./InvoiceFooter";
import type { InvoicePdfData } from "@/lib/pdf/invoice-pdf";

const VAT_RATE = 0.2;

function formatAmount(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
  }).format(cents / 100);
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function InvoiceDocument({ data }: { data: InvoicePdfData }) {
  const items =
    data.lineItems?.length > 0
      ? data.lineItems
      : [{ description: "Invoice payment", amountCents: data.amountCents }];

  let subtotalFromLines = items.reduce((s, i) => s + i.amountCents, 0);
  let invoiceDiscountCents = 0;
  if (data.discountType && data.discountValue != null && data.discountValue > 0) {
    if (data.discountType === "percent") {
      invoiceDiscountCents = Math.round(
        subtotalFromLines * (data.discountValue / 100)
      );
    } else {
      invoiceDiscountCents = Math.round(data.discountValue);
    }
  }
  const subtotalAfterDiscount = Math.max(
    0,
    subtotalFromLines - invoiceDiscountCents
  );

  const vatIncluded = data.vatIncluded;
  let subtotalCents: number;
  let vatCents: number;
  let totalCents: number;
  if (vatIncluded === true) {
    totalCents = data.amountCents;
    subtotalCents = Math.round(totalCents / (1 + VAT_RATE));
    vatCents = totalCents - subtotalCents;
  } else if (vatIncluded === false) {
    subtotalCents = subtotalAfterDiscount;
    vatCents = Math.round(subtotalCents * VAT_RATE);
    totalCents = subtotalCents + vatCents;
  } else {
    subtotalCents = data.amountCents;
    vatCents = 0;
    totalCents = data.amountCents;
  }

  type TableRow = {
    description: string;
    amountCents: number;
    isDiscount?: boolean;
  };
  const tableRows: TableRow[] = [...items.map((i) => ({
    description: i?.description != null ? String(i.description) : "—",
    amountCents: Number.isFinite(i?.amountCents) ? Math.round(Number(i.amountCents)) : 0,
    isDiscount: false,
  }))];

  if (invoiceDiscountCents > 0) {
    const label =
      data.discountType === "percent"
        ? `Discount (${data.discountValue}%)`
        : "Discount";
    tableRows.push({
      description: label,
      amountCents: -invoiceDiscountCents,
      isDiscount: true,
    });
  }

  if (
    data.paymentProcessingFeeCents != null &&
    data.paymentProcessingFeeCents > 0
  ) {
    tableRows.push({
      description: "Payment processing fee",
      amountCents: Math.round(Number(data.paymentProcessingFeeCents)),
      isDiscount: false,
    });
  }

  if (vatIncluded != null) {
    const vatLabel = vatIncluded ? "VAT (20% incl.)" : "VAT (20%)";
    tableRows.push({
      description: vatLabel,
      amountCents: vatCents,
      isDiscount: false,
    });
  }

  const metaParts: string[] = [];
  if (data.dueDate) metaParts.push(`Due: ${formatDate(data.dueDate)}`);

  return (
    <Document
      title={`Invoice ${data.invoiceNumber}`}
      author={data.businessName}
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.pageContent}>
          <InvoiceHeader
            businessName={data.businessName}
            address={data.address}
            phone={data.phone}
            companyNumber={data.companyNumber}
            vatNumber={data.vatNumber}
            logoUrl={data.logoUrl}
            invoiceNumber={data.invoiceNumber}
            createdAt={data.createdAt}
            clientName={data.clientName}
            clientCompanyName={data.clientCompanyName}
            clientAddress={data.clientAddress}
            clientEmail={data.clientEmail}
            clientPhone={data.clientPhone}
            clientVatNumber={data.clientVatNumber}
          />
          <InvoiceTable
            rows={tableRows}
            totalCents={data.amountCents}
            currency={data.currency}
          />
          {metaParts.length > 0 && (
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>{metaParts.join("  ·  ")}</Text>
            </View>
          )}
          {data.notes && data.notes.trim() && (
            <View>
              <Text style={styles.notesLabel}>Notes</Text>
              <Text style={styles.notesText}>{data.notes.trim()}</Text>
            </View>
          )}
        </View>
        <InvoiceFooter />
      </Page>
    </Document>
  );
}
