"use client";

import { useState } from "react";
import Image from "next/image";

type Props = {
  logoUrl: string;
  businessName: string;
  size?: "sm" | "md";
};

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-12 w-12",
};

export function PublicLogo({ logoUrl, businessName, size = "md" }: Props) {
  const [logoError, setLogoError] = useState(false);
  const showLogo = logoUrl && !logoError;

  if (!showLogo) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#3B82F6]/20 text-sm font-medium text-[#3B82F6] ${sizeClasses[size]}`}
      >
        {businessName.trim().charAt(0).toUpperCase() || "B"}
      </div>
    );
  }

  return (
    <div className={`relative shrink-0 overflow-hidden rounded-full ring-1 ring-white/10 ${sizeClasses[size]}`}>
      <Image
        src={logoUrl}
        alt=""
        fill
        className="object-cover"
        sizes={size === "sm" ? "32px" : "48px"}
        unoptimized
        onError={() => setLogoError(true)}
      />
    </div>
  );
}
