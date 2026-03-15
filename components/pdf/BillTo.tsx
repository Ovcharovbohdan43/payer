import React from "react";
import { View, Text } from "@react-pdf/renderer";
import { styles } from "./styles";

type Props = {
  clientName: string;
  clientCompanyName?: string | null;
  clientAddress?: string | null;
  clientEmail?: string | null;
  clientPhone?: string | null;
  clientVatNumber?: string | null;
};

export function BillTo({
  clientName,
  clientCompanyName,
  clientAddress,
  clientEmail,
  clientPhone,
  clientVatNumber,
}: Props) {
  const clientLines: string[] = [];
  if (clientAddress?.trim()) clientLines.push(clientAddress.trim());
  if (clientEmail?.trim()) clientLines.push(clientEmail.trim());
  if (clientPhone?.trim()) clientLines.push(clientPhone.trim());
  if (clientVatNumber?.trim()) clientLines.push(`VAT: ${clientVatNumber.trim()}`);

  return (
    <View style={styles.billToBlock}>
      <Text style={styles.sectionLabel}>Bill to</Text>
      {clientCompanyName?.trim() && (
        <Text style={styles.clientCompany}>{clientCompanyName.trim()}</Text>
      )}
      <Text
        style={
          clientCompanyName?.trim()
            ? styles.clientName
            : [
              styles.clientName,
              {
                fontSize: 11,
                borderTopWidth: 0,
                borderBottomWidth: 0,
                borderLeftWidth: 0,
                borderRightWidth: 0,
                borderColor: "transparent",
              },
            ]
        }
      >
        {clientName}
      </Text>
      {clientLines.map((line, i) => (
        <Text key={i} style={styles.clientLine}>
          {line}
        </Text>
      ))}
    </View>
  );
}
