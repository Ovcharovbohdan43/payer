import React from "react";
import { View, Text, Image } from "@react-pdf/renderer";
import { styles } from "./styles";

type Props = {
  businessName: string;
  address?: string | null;
  phone?: string | null;
  companyNumber?: string | null;
  vatNumber?: string | null;
  logoUrl?: string | null;
};

/** Only PNG and JPG are supported by react-pdf; WebP is skipped */
function isLogoSupported(url: string): boolean {
  const u = url.toLowerCase();
  return u.endsWith(".png") || u.endsWith(".jpg") || u.endsWith(".jpeg");
}

export function InvoiceHeader({
  businessName,
  address,
  phone,
  companyNumber,
  vatNumber,
  logoUrl,
}: Props) {
  const showLogo = logoUrl && isLogoSupported(logoUrl);

  const contactLines: string[] = [];
  if (address?.trim()) contactLines.push(address.trim());
  if (phone?.trim()) contactLines.push(phone.trim());
  if (companyNumber?.trim()) contactLines.push(`Company no: ${companyNumber.trim()}`);
  if (vatNumber?.trim()) contactLines.push(`VAT: ${vatNumber.trim()}`);

  return (
    <View style={styles.headerRow}>
      {showLogo && (
        <Image src={logoUrl!} style={styles.logo} />
      )}
      <View style={[styles.headerText, showLogo ? {} : { marginLeft: 0 }]}>
        <Text style={styles.brandName}>{businessName}</Text>
        {contactLines.map((line, i) => (
          <Text key={i} style={styles.contactLine}>
            {line}
          </Text>
        ))}
      </View>
    </View>
  );
}
