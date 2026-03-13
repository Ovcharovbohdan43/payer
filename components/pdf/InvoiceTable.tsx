import React from "react";
import { View, Text } from "@react-pdf/renderer";
import { styles } from "./styles";

export type InvoiceLineItemPdf = {
  description: string;
  amountCents: number;
};

type Props = {
  items: InvoiceLineItemPdf[];
  currency: string;
};

function formatAmount(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
  }).format(cents / 100);
}

export function InvoiceTable({ items, currency }: Props) {
  return (
    <View style={styles.table}>
      <View style={styles.tableHeader}>
        <Text style={styles.tableHeaderDesc}>Description</Text>
        <Text style={styles.tableHeaderAmount}>Amount</Text>
      </View>
      {items.map((item, i) => (
        <View key={i} style={styles.tableRow}>
          <Text style={styles.tableRowDesc}>{item.description}</Text>
          <Text style={styles.tableRowAmount}>
            {formatAmount(item.amountCents, currency)}
          </Text>
        </View>
      ))}
    </View>
  );
}
