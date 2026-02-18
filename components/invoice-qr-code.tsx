"use client";

import { QRCodeSVG } from "qrcode.react";

type Props = {
  url: string;
  size?: number;
  label?: string;
};

export function InvoiceQrCode({ url, size = 120, label = "Scan to pay" }: Props) {
  return (
    <div className="flex shrink-0 flex-col items-center gap-2">
      <div className="rounded-xl border border-white/10 bg-white/5 p-2">
        <QRCodeSVG
          value={url}
          size={size}
          level="M"
          includeMargin={false}
          className="rounded-lg"
        />
      </div>
      {label && (
        <span className="text-xs text-muted-foreground">{label}</span>
      )}
    </div>
  );
}
