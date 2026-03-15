import React from "react";
import { View, Text } from "@react-pdf/renderer";
import { styles } from "./styles";

export type InvoiceLineItemPdf = {
  description: string;
  amountCents: number;
};

export type InvoiceTableRow = {
  description: string;
  amountCents: number;
  isDiscount?: boolean;
};

type Props = {
  rows: InvoiceTableRow[];
  totalCents: number;
  currency: string;
};

function formatAmount(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
  }).format(cents / 100);
}

function safeAmount(cents: number): number {
  return Number.isFinite(cents) ? Math.round(cents) : 0;
}

export function InvoiceTable({ rows, totalCents, currency }: Props) {
  const list = Array.isArray(rows) ? rows : [];
  const curr = typeof currency === "string" && currency.trim() ? currency : "USD";
  return (
    <View style={styles.table}>
      <View style={styles.tableHeader}>
        <Text style={styles.tableHeaderDesc}>Description</Text>
        <Text style={styles.tableHeaderAmount}>Amount</Text>
      </View>
      {list.map((row, i) => (
        <View key={i} style={styles.tableRow}>
          <Text style={styles.tableRowDesc}>
            {row?.description != null ? String(row.description) : "—"}
          </Text>
          <Text
            style={[
              styles.tableRowAmount,
              ...(row?.isDiscount ? [styles.discountAmount] : []),
            ]}
          >
            {row && row.amountCents < 0
              ? "-" + formatAmount(Math.abs(safeAmount(row.amountCents)), curr)
              : formatAmount(safeAmount(row?.amountCents ?? 0), curr)}
          </Text>
        </View>
      ))}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalAmount}>
          {formatAmount(safeAmount(totalCents), curr)}
        </Text>
      </View>
    </View>
  );
}
