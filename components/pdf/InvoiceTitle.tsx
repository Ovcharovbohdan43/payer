import React from "react";
import { View, Text } from "@react-pdf/renderer";
import { styles } from "./styles";

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

type Props = {
  invoiceNumber: string;
  createdAt?: string | null;
};

export function InvoiceTitle({ invoiceNumber, createdAt }: Props) {
  return (
    <View style={styles.titleRow}>
      <Text style={styles.invoiceLabel}>INVOICE</Text>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={styles.invoiceNumber}>#{invoiceNumber}</Text>
        {createdAt && (
          <Text style={styles.dateLabel}>Date: {formatDate(createdAt)}</Text>
        )}
      </View>
    </View>
  );
}
