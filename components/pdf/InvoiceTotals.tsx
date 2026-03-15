import React from "react";
import { View, Text } from "@react-pdf/renderer";
import { styles } from "./styles";

function formatAmount(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
  }).format(cents / 100);
}

type Row = { label: string; amount: string; isDiscount?: boolean };

type Props = {
  rows: Row[];
  totalCents: number;
  currency: string;
};

function TotalRow({ label, amount, isDiscount }: Row & { isDiscount?: boolean }) {
  return (
    <View style={styles.tableRow}>
      <Text style={styles.tableRowDesc}>{label}</Text>
      <Text
        style={[
          styles.tableRowAmount,
          ...(isDiscount ? [styles.discountAmount] : []),
        ]}
      >
        {amount}
      </Text>
    </View>
  );
}

function safeCents(c: number): number {
  return Number.isFinite(c) ? Math.round(c) : 0;
}

export function InvoiceTotals({ rows, totalCents, currency }: Props) {
  const list = Array.isArray(rows) ? rows : [];
  const curr = typeof currency === "string" && currency.trim() ? currency : "USD";
  return (
    <View style={styles.table}>
      {list.map((row, i) => (
        <TotalRow
          key={i}
          label={row?.label != null ? String(row.label) : ""}
          amount={row?.amount != null ? String(row.amount) : "—"}
          isDiscount={row?.isDiscount}
        />
      ))}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalAmount}>
          {formatAmount(safeCents(totalCents), curr)}
        </Text>
      </View>
    </View>
  );
}
