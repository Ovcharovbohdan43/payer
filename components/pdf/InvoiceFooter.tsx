import React from "react";
import { View, Text } from "@react-pdf/renderer";
import { styles } from "./styles";

export function InvoiceFooter() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://puyer.org";
  const termsUrl = appUrl.replace(/\/$/, "") + "/terms";
  const termsHost = termsUrl.replace(/^https?:\/\//, "");

  return (
    <View style={styles.footerBlock}>
      <Text style={styles.footerText}>Thank you for your business.</Text>
      <Text style={styles.footerSmall}>Powered by Puyer</Text>
      <Text style={[styles.footerSmall, { marginTop: 4, borderWidth: 0, borderColor: "transparent" }]}>
        Terms of service: {termsHost}
      </Text>
    </View>
  );
}
