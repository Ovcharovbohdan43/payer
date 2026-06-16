"use client";

import Image from "next/image";
import { useState } from "react";

type ReviewAvatarProps = {
  businessName: string;
  logoUrl: string | null;
  size?: "sm" | "md";
};

export function ReviewAvatar({
  businessName,
  logoUrl,
  size = "md",
}: ReviewAvatarProps) {
  const [logoError, setLogoError] = useState(false);
  const showLogo = logoUrl && !logoError;
  const initial = (businessName.trim().charAt(0) || "P").toUpperCase();
  const dimension = size === "sm" ? "size-9" : "size-11";
  const textSize = size === "sm" ? "text-sm" : "text-base";

  if (showLogo) {
    return (
      <div
        className={`relative ${dimension} shrink-0 overflow-hidden rounded-full ring-1 ring-white/10`}
      >
        <Image
          src={logoUrl}
          alt=""
          fill
          className="object-cover"
          sizes={size === "sm" ? "36px" : "44px"}
          unoptimized
          onError={() => setLogoError(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={`flex ${dimension} shrink-0 items-center justify-center rounded-full bg-[#3B82F6]/20 ${textSize} font-semibold text-[#3B82F6] ring-1 ring-white/10`}
      aria-hidden
    >
      {initial}
    </div>
  );
}
