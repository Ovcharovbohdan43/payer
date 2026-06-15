export const DEFAULT_INVOICE_DESIGN = "classic";

export const INVOICE_DESIGNS = [
  {
    key: "classic",
    name: "Classic",
    description: "Blue branded header with a strong payment CTA.",
    accent: "#3B82F6",
  },
  {
    key: "modern",
    name: "Modern",
    description: "Dark premium header with green payment accents.",
    accent: "#10B981",
  },
  {
    key: "minimal",
    name: "Minimal",
    description: "Clean white layout with restrained black typography.",
    accent: "#18181B",
  },
] as const;

export type InvoiceDesignKey = (typeof INVOICE_DESIGNS)[number]["key"];

export type InvoiceDesignTheme = {
  key: InvoiceDesignKey;
  name: string;
  description: string;
  accent: string;
  pdf: {
    brand: string;
    brandDark: string;
    headerBg: string;
    headerText: string;
    headerMuted: string;
    invoiceBadgeBg: string;
    invoiceBadgeText: string;
    tableHeaderBg: string;
    tableHeaderText: string;
    totalBg: string;
    totalText: string;
    footerText: string;
    footerMuted: string;
    footerDisclaimer: string;
    border: string;
  };
  email: {
    pageBg: string;
    cardBg: string;
    headerBg: string;
    headerText: string;
    headerMuted: string;
    buttonBg: string;
    buttonText: string;
    link: string;
    footerBg: string;
  };
  publicPage: {
    pageBg: string;
    cardBg: string;
    border: string;
    primaryText: string;
    mutedText: string;
    accent: string;
    softAccent: string;
    secondaryCard: string;
  };
};

const DESIGN_KEYS = new Set<string>(INVOICE_DESIGNS.map((design) => design.key));

export function isInvoiceDesignKey(value: unknown): value is InvoiceDesignKey {
  return typeof value === "string" && DESIGN_KEYS.has(value);
}

export function normalizeInvoiceDesign(value: unknown): InvoiceDesignKey {
  return isInvoiceDesignKey(value) ? value : DEFAULT_INVOICE_DESIGN;
}

export function getInvoiceDesign(key: unknown) {
  const normalized = normalizeInvoiceDesign(key);
  return INVOICE_DESIGNS.find((design) => design.key === normalized) ?? INVOICE_DESIGNS[0];
}

export function getInvoiceDesignTheme(key: unknown): InvoiceDesignTheme {
  const design = getInvoiceDesign(key);

  if (design.key === "modern") {
    return {
      ...design,
      pdf: {
        brand: "#10B981",
        brandDark: "#064E3B",
        headerBg: "#111827",
        headerText: "#F9FAFB",
        headerMuted: "#D1D5DB",
        invoiceBadgeBg: "#10B981",
        invoiceBadgeText: "#052E16",
        tableHeaderBg: "#111827",
        tableHeaderText: "#F9FAFB",
        totalBg: "#ECFDF5",
        totalText: "#047857",
        footerText: "#FFFFFF",
        footerMuted: "#A7F3D0",
        footerDisclaimer: "#6EE7B7",
        border: "#D1FAE5",
      },
      email: {
        pageBg: "#F3F4F6",
        cardBg: "#FFFFFF",
        headerBg: "#111827",
        headerText: "#F9FAFB",
        headerMuted: "#D1D5DB",
        buttonBg: "#10B981",
        buttonText: "#052E16",
        link: "#059669",
        footerBg: "#F9FAFB",
      },
      publicPage: {
        pageBg: "#08111F",
        cardBg: "#101827",
        border: "border-emerald-400/15",
        primaryText: "text-white",
        mutedText: "text-emerald-100/65",
        accent: "text-emerald-300",
        softAccent: "bg-emerald-400/10",
        secondaryCard: "bg-white/5",
      },
    };
  }

  if (design.key === "minimal") {
    return {
      ...design,
      pdf: {
        brand: "#18181B",
        brandDark: "#27272A",
        headerBg: "#FFFFFF",
        headerText: "#18181B",
        headerMuted: "#52525B",
        invoiceBadgeBg: "#18181B",
        invoiceBadgeText: "#FFFFFF",
        tableHeaderBg: "#18181B",
        tableHeaderText: "#FFFFFF",
        totalBg: "#F4F4F5",
        totalText: "#18181B",
        footerText: "#FFFFFF",
        footerMuted: "#D4D4D8",
        footerDisclaimer: "#A1A1AA",
        border: "#D4D4D8",
      },
      email: {
        pageBg: "#FAFAFA",
        cardBg: "#FFFFFF",
        headerBg: "#FFFFFF",
        headerText: "#18181B",
        headerMuted: "#71717A",
        buttonBg: "#18181B",
        buttonText: "#FFFFFF",
        link: "#18181B",
        footerBg: "#FAFAFA",
      },
      publicPage: {
        pageBg: "#F4F4F5",
        cardBg: "#FFFFFF",
        border: "border-zinc-200",
        primaryText: "text-zinc-950",
        mutedText: "text-zinc-500",
        accent: "text-zinc-950",
        softAccent: "bg-zinc-100",
        secondaryCard: "bg-zinc-50",
      },
    };
  }

  return {
    ...design,
    pdf: {
      brand: "#3B82F6",
      brandDark: "#2563EB",
      headerBg: "#3B82F6",
      headerText: "#FFFFFF",
      headerMuted: "#E8EDF5",
      invoiceBadgeBg: "#FFFFFF",
      invoiceBadgeText: "#262626",
      tableHeaderBg: "#3B82F6",
      tableHeaderText: "#FFFFFF",
      totalBg: "#EFF6FF",
      totalText: "#3B82F6",
      footerText: "#FFFFFF",
      footerMuted: "#BFDBFE",
      footerDisclaimer: "#93C5FD",
      border: "#3B82F6",
    },
    email: {
      pageBg: "#F4F4F5",
      cardBg: "#FFFFFF",
      headerBg: "#FFFFFF",
      headerText: "#18181B",
      headerMuted: "#71717A",
      buttonBg: "#18181B",
      buttonText: "#FFFFFF",
      link: "#3B82F6",
      footerBg: "#FAFAFA",
    },
    publicPage: {
      pageBg: "#0B0F14",
      cardBg: "#121821",
      border: "border-white/5",
      primaryText: "text-white",
      mutedText: "text-muted-foreground",
      accent: "text-[#3B82F6]",
      softAccent: "bg-white/5",
      secondaryCard: "bg-white/5",
    },
  };
}
