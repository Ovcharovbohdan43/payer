import React from "react";
import { Document, Page, View, Text } from "@react-pdf/renderer";
import { styles } from "./styles";
import { InvoiceHeader } from "./InvoiceHeader";
import { InvoiceTitle } from "./InvoiceTitle";
import { BillTo } from "./BillTo";
import { InvoiceTable } from "./InvoiceTable";
import { InvoiceTotals } from "./InvoiceTotals";
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

  const totalRows: { label: string; amount: string; isDiscount?: boolean }[] = [];

  if (invoiceDiscountCents > 0) {
    const label =
      data.discountType === "percent"
        ? `Discount (${data.discountValue}%)`
        : "Discount";
    totalRows.push({
      label,
      amount: "-" + formatAmount(invoiceDiscountCents, data.currency),
      isDiscount: true,
    });
  }

  if (
    data.paymentProcessingFeeCents != null &&
    data.paymentProcessingFeeCents > 0
  ) {
    totalRows.push({
      label: "Payment processing fee",
      amount: formatAmount(data.paymentProcessingFeeCents, data.currency),
    });
  }

  if (vatIncluded != null) {
    const vatLabel = vatIncluded ? "VAT (20% incl.)" : "VAT (20%)";
    totalRows.push({
      label: vatLabel,
      amount: formatAmount(vatCents, data.currency),
    });
  }

  const metaParts: string[] = [];
  if (data.dueDate) metaParts.push(`Due: ${formatDate(data.dueDate)}`);
  metaParts.push(
    `Status: ${data.status.charAt(0).toUpperCase() + data.status.slice(1)}`
  );

  return (
    <Document
      title={`Invoice ${data.invoiceNumber}`}
      author={data.businessName}
    >
      <Page size="A4" style={styles.page}>
        <InvoiceHeader
          businessName={data.businessName}
          address={data.address}
          phone={data.phone}
          companyNumber={data.companyNumber}
          vatNumber={data.vatNumber}
          logoUrl={data.logoUrl}
        />
        <InvoiceTitle
          invoiceNumber={data.invoiceNumber}
          createdAt={data.createdAt}
        />
        <BillTo
          clientName={data.clientName}
          clientCompanyName={data.clientCompanyName}
          clientAddress={data.clientAddress}
          clientEmail={data.clientEmail}
          clientPhone={data.clientPhone}
          clientVatNumber={data.clientVatNumber}
        />
        <InvoiceTable items={items} currency={data.currency} />
        <InvoiceTotals
          rows={totalRows}
          totalCents={data.amountCents}
          currency={data.currency}
        />
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{metaParts.join("  ·  ")}</Text>
        </View>
        {data.notes && data.notes.trim() && (
          <View>
            <Text style={styles.notesLabel}>Notes</Text>
            <Text style={styles.notesText}>{data.notes.trim()}</Text>
          </View>
        )}
        <InvoiceFooter />
      </Page>
    </Document>
  );
}
