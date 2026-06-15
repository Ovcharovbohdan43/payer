import {
  DEFAULT_INVOICE_DESIGN,
  getInvoiceDesignTheme,
  INVOICE_DESIGNS,
  normalizeInvoiceDesign,
  type InvoiceDesignKey,
  type InvoiceDesignTheme,
} from "@/lib/invoice-designs";

export const VISUAL_CONFIG_VERSION = 1 as const;

export type HeaderStyle = "brand" | "dark" | "light";
export type ButtonStyle = "filled" | "outline";

export type InvoiceVisualConfig = {
  version: typeof VISUAL_CONFIG_VERSION;
  baseDesign: InvoiceDesignKey;
  accentColor: string;
  headerStyle: HeaderStyle;
  showLogo: boolean;
  showBusinessDetails: boolean;
  showNotes: boolean;
  buttonStyle: ButtonStyle;
};

export type InvoiceVisualTemplateRow = {
  id: string;
  user_id: string;
  name: string;
  config: InvoiceVisualConfig;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type ResolvedPublicPageTheme = {
  pageBg: string;
  cardBg: string;
  borderColor: string;
  primaryTextColor: string;
  mutedTextColor: string;
  accentColor: string;
  softAccentBg: string;
  secondaryCardBg: string;
  buttonBg: string;
  buttonText: string;
  buttonBorder: string;
  headerBg: string;
  headerText: string;
  headerMuted: string;
};

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && HEX_COLOR.test(value);
}

function clampChannel(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace("#", "");
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b]
    .map((channel) => clampChannel(channel).toString(16).padStart(2, "0"))
    .join("")}`;
}

export function darkenColor(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  const factor = 1 - amount;
  return rgbToHex(r * factor, g * factor, b * factor);
}

export function lightenColor(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(
    r + (255 - r) * amount,
    g + (255 - g) * amount,
    b + (255 - b) * amount
  );
}

export function contrastTextColor(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62 ? "#18181B" : "#FFFFFF";
}

export function getDefaultVisualConfig(
  baseDesign: InvoiceDesignKey = DEFAULT_INVOICE_DESIGN
): InvoiceVisualConfig {
  const design = INVOICE_DESIGNS.find((item) => item.key === baseDesign) ?? INVOICE_DESIGNS[0];
  return {
    version: VISUAL_CONFIG_VERSION,
    baseDesign: design.key,
    accentColor: design.accent,
    headerStyle: design.key === "minimal" ? "light" : design.key === "modern" ? "dark" : "brand",
    showLogo: true,
    showBusinessDetails: true,
    showNotes: true,
    buttonStyle: design.key === "minimal" ? "outline" : "filled",
  };
}

export function normalizeInvoiceVisualConfig(
  value: unknown,
  fallbackDesign: InvoiceDesignKey | null | undefined = DEFAULT_INVOICE_DESIGN
): InvoiceVisualConfig {
  const defaults = getDefaultVisualConfig(normalizeInvoiceDesign(fallbackDesign));
  if (!value || typeof value !== "object") return defaults;

  const raw = value as Partial<InvoiceVisualConfig>;
  const baseDesign = normalizeInvoiceDesign(raw.baseDesign ?? fallbackDesign);

  return {
    version: VISUAL_CONFIG_VERSION,
    baseDesign,
    accentColor: isHexColor(raw.accentColor) ? raw.accentColor : getDefaultVisualConfig(baseDesign).accentColor,
    headerStyle:
      raw.headerStyle === "brand" || raw.headerStyle === "dark" || raw.headerStyle === "light"
        ? raw.headerStyle
        : defaults.headerStyle,
    showLogo: raw.showLogo ?? defaults.showLogo,
    showBusinessDetails: raw.showBusinessDetails ?? defaults.showBusinessDetails,
    showNotes: raw.showNotes ?? defaults.showNotes,
    buttonStyle:
      raw.buttonStyle === "filled" || raw.buttonStyle === "outline"
        ? raw.buttonStyle
        : defaults.buttonStyle,
  };
}

export function parseInvoiceVisualConfigJson(
  json: string | null | undefined,
  fallbackDesign?: InvoiceDesignKey | null
): InvoiceVisualConfig | null {
  if (!json?.trim()) return null;
  try {
    return normalizeInvoiceVisualConfig(JSON.parse(json), fallbackDesign);
  } catch {
    return null;
  }
}

export function serializeInvoiceVisualConfig(config: InvoiceVisualConfig): string {
  return JSON.stringify(normalizeInvoiceVisualConfig(config));
}

function resolveHeaderColors(config: InvoiceVisualConfig): {
  headerBg: string;
  headerText: string;
  headerMuted: string;
} {
  if (config.headerStyle === "dark") {
    return {
      headerBg: "#111827",
      headerText: "#F9FAFB",
      headerMuted: "#D1D5DB",
    };
  }
  if (config.headerStyle === "light") {
    return {
      headerBg: "#FFFFFF",
      headerText: "#18181B",
      headerMuted: "#71717A",
    };
  }
  return {
    headerBg: config.accentColor,
    headerText: contrastTextColor(config.accentColor),
    headerMuted: lightenColor(config.accentColor, 0.35),
  };
}

export function resolveInvoiceTheme(
  config: InvoiceVisualConfig | null | undefined,
  fallbackDesign?: InvoiceDesignKey | null
): InvoiceDesignTheme {
  const normalized = config
    ? normalizeInvoiceVisualConfig(config)
    : getDefaultVisualConfig(normalizeInvoiceDesign(fallbackDesign));
  const baseTheme = getInvoiceDesignTheme(normalized.baseDesign);
  const header = resolveHeaderColors(normalized);
  const brandDark = darkenColor(normalized.accentColor, 0.18);
  const totalBg = lightenColor(normalized.accentColor, 0.88);
  const buttonBg =
    normalized.buttonStyle === "outline" ? "transparent" : normalized.accentColor;
  const buttonText =
    normalized.buttonStyle === "outline"
      ? normalized.accentColor
      : contrastTextColor(normalized.accentColor);

  return {
    ...baseTheme,
    key: normalized.baseDesign,
    accent: normalized.accentColor,
    pdf: {
      ...baseTheme.pdf,
      brand: normalized.accentColor,
      brandDark,
      headerBg: header.headerBg,
      headerText: header.headerText,
      headerMuted: header.headerMuted,
      invoiceBadgeBg:
        normalized.headerStyle === "light" ? normalized.accentColor : header.headerBg,
      invoiceBadgeText:
        normalized.headerStyle === "light"
          ? contrastTextColor(normalized.accentColor)
          : header.headerText,
      tableHeaderBg: header.headerBg,
      tableHeaderText: header.headerText,
      totalBg,
      totalText: darkenColor(normalized.accentColor, 0.25),
      footerText: contrastTextColor(brandDark),
      footerMuted: lightenColor(brandDark, 0.45),
      footerDisclaimer: lightenColor(brandDark, 0.3),
      border: lightenColor(normalized.accentColor, 0.65),
    },
    email: {
      ...baseTheme.email,
      buttonBg,
      buttonText,
      link: normalized.accentColor,
      headerBg: header.headerBg,
      headerText: header.headerText,
      headerMuted: header.headerMuted,
    },
    publicPage: {
      ...baseTheme.publicPage,
      accent: normalized.accentColor,
    },
  };
}

export function resolvePublicPageTheme(
  config: InvoiceVisualConfig | null | undefined,
  fallbackDesign?: InvoiceDesignKey | null
): ResolvedPublicPageTheme {
  const normalized = config
    ? normalizeInvoiceVisualConfig(config)
    : getDefaultVisualConfig(normalizeInvoiceDesign(fallbackDesign));
  const header = resolveHeaderColors(normalized);
  const isLight = normalized.baseDesign === "minimal" || normalized.headerStyle === "light";
  const pageBg = isLight ? "#F4F4F5" : "#0B0F14";
  const cardBg = isLight ? "#FFFFFF" : "#121821";
  const buttonBg =
    normalized.buttonStyle === "outline" ? "transparent" : normalized.accentColor;
  const buttonText =
    normalized.buttonStyle === "outline"
      ? normalized.accentColor
      : contrastTextColor(normalized.accentColor);

  return {
    pageBg,
    cardBg,
    borderColor: isLight ? "#E4E4E7" : "rgba(255,255,255,0.08)",
    primaryTextColor: isLight ? "#18181B" : "#FFFFFF",
    mutedTextColor: isLight ? "#71717A" : "#A1A1AA",
    accentColor: normalized.accentColor,
    softAccentBg: lightenColor(normalized.accentColor, isLight ? 0.9 : 0.12),
    secondaryCardBg: isLight ? "#FAFAFA" : "rgba(255,255,255,0.05)",
    buttonBg,
    buttonText,
    buttonBorder: normalized.accentColor,
    headerBg: header.headerBg,
    headerText: header.headerText,
    headerMuted: header.headerMuted,
  };
}

export function resolveInvoiceThemeFromSources(input: {
  invoiceDesignConfig?: unknown;
  invoiceDesign?: unknown;
}): { config: InvoiceVisualConfig; theme: InvoiceDesignTheme; publicPage: ResolvedPublicPageTheme } {
  const fallbackDesign = normalizeInvoiceDesign(input.invoiceDesign);
  const config = input.invoiceDesignConfig
    ? normalizeInvoiceVisualConfig(input.invoiceDesignConfig, fallbackDesign)
    : getDefaultVisualConfig(fallbackDesign);

  return {
    config,
    theme: resolveInvoiceTheme(config, fallbackDesign),
    publicPage: resolvePublicPageTheme(config, fallbackDesign),
  };
}
