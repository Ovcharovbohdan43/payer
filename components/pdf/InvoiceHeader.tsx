import React from "react";
import { View, Text, Image } from "@react-pdf/renderer";
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
  businessName: string;
  address?: string | null;
  phone?: string | null;
  companyNumber?: string | null;
  vatNumber?: string | null;
  logoUrl?: string | null;
  invoiceNumber: string;
  createdAt?: string | null;
};

/** PNG/JPG URLs or data URIs; WebP skipped */
function isLogoSupported(url: string): boolean {
  const u = url.toLowerCase();
  if (u.startsWith("data:image/")) {
    return u.includes("png") || u.includes("jpeg") || u.includes("jpg");
  }
  return u.endsWith(".png") || u.endsWith(".jpg") || u.endsWith(".jpeg");
}

export function InvoiceHeader({
  businessName,
  address,
  phone,
  companyNumber,
  vatNumber,
  logoUrl,
  invoiceNumber,
  createdAt,
}: Props) {
  const showLogo = logoUrl && isLogoSupported(logoUrl);

  const contactLines: string[] = [];
  if (address?.trim()) contactLines.push(address.trim());
  if (phone?.trim()) contactLines.push(phone.trim());
  if (companyNumber?.trim())
    contactLines.push(`Company no: ${companyNumber.trim()}`);
  if (vatNumber?.trim()) contactLines.push(`VAT: ${vatNumber.trim()}`);

  return (
    <View style={styles.headerBlock}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          {showLogo && <Image src={logoUrl!} style={styles.logo} />}
          <Text style={styles.brandName}>{businessName}</Text>
          {contactLines.map((line, i) => (
            <Text key={i} style={styles.contactLine}>
              {line}
            </Text>
          ))}
        </View>
        <View style={[styles.headerRight, styles.invoiceBadge]}>
          <Text style={styles.invoiceLabel}>INVOICE</Text>
          <Text style={styles.invoiceNumber}>#{invoiceNumber}</Text>
          {createdAt && (
            <Text style={styles.dateLabel}>
              Date: {formatDate(createdAt)}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}
