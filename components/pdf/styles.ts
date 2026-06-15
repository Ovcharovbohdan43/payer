import { StyleSheet } from "@react-pdf/renderer";
import { getInvoiceDesignTheme, normalizeInvoiceDesign } from "@/lib/invoice-designs";
import {
  normalizeInvoiceVisualConfig,
  resolveInvoiceTheme,
  type InvoiceVisualConfig,
} from "@/lib/invoice-visual-config";

export const BRAND = "#3B82F6";
export const BRAND_DARK = "#2563EB";
export const MARGIN = 48;
export const CONTENT_WIDTH = 595 - MARGIN * 2;
export const VAT_RATE = 0.2;

export function createInvoicePdfStyles(
  designKey: unknown,
  visualConfig?: InvoiceVisualConfig | null
) {
  const normalizedDesign = normalizeInvoiceDesign(designKey);
  const theme = visualConfig
    ? resolveInvoiceTheme(
        normalizeInvoiceVisualConfig(visualConfig, normalizedDesign),
        normalizedDesign
      ).pdf
    : getInvoiceDesignTheme(normalizedDesign).pdf;

  return StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    paddingHorizontal: MARGIN,
    paddingTop: MARGIN,
    paddingBottom: MARGIN,
    flexDirection: "column",
  },
  pageContent: {
    flexGrow: 1,
    flexDirection: "column",
  },
  // Header — full-width brand color block
  headerBlock: {
    backgroundColor: theme.headerBg,
    marginHorizontal: -MARGIN,
    marginBottom: 32,
    paddingHorizontal: MARGIN,
    paddingTop: 32,
    paddingBottom: 24,
    borderBottomWidth: theme.headerBg === "#FFFFFF" ? 1 : 0,
    borderBottomColor: theme.border,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  headerRightColumn: {
    flexDirection: "column",
    alignItems: "flex-end",
    minWidth: 180,
  },
  billToInHeader: {
    marginTop: 16,
    marginBottom: 0,
    alignItems: "flex-end",
  },
  logo: {
    width: 100,
    maxHeight: 56,
    marginBottom: 12,
  },
  brandName: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    color: theme.headerText,
    marginBottom: 6,
  },
  contactLine: {
    fontSize: 9,
    color: theme.headerMuted,
    marginBottom: 2,
  },
  invoiceBadge: {
    backgroundColor: theme.invoiceBadgeBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  invoiceLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: theme.invoiceBadgeText,
    marginBottom: 2,
  },
  invoiceNumber: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: theme.invoiceBadgeText,
  },
  dateLabel: {
    fontSize: 9,
    color: theme.invoiceBadgeText,
    marginTop: 4,
  },
  // Bill to
  sectionLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#999",
    marginBottom: 6,
  },
  billToBlock: {
    marginBottom: 28,
  },
  clientLineRight: {
    fontSize: 10,
    color: "#595959",
    marginBottom: 2,
    textAlign: "right",
  },
  clientNameRight: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#262626",
    marginBottom: 4,
    textAlign: "right",
  },
  clientCompanyRight: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#262626",
    marginBottom: 4,
    textAlign: "right",
  },
  sectionLabelRight: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: theme.headerMuted,
    marginBottom: 6,
    textAlign: "right",
  },
  clientCompanyInHeader: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: theme.headerText,
    marginBottom: 4,
    textAlign: "right",
  },
  clientNameInHeader: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: theme.headerText,
    marginBottom: 4,
    textAlign: "right",
  },
  clientLineInHeader: {
    fontSize: 10,
    color: theme.headerMuted,
    marginBottom: 2,
    textAlign: "right",
  },
  clientCompany: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#262626",
    marginBottom: 4,
  },
  clientName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#262626",
    marginBottom: 4,
  },
  clientLine: {
    fontSize: 10,
    color: "#595959",
    marginBottom: 2,
  },
  // Table
  table: {
    marginBottom: 6,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: theme.tableHeaderBg,
    borderTopWidth: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderColor: "transparent",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tableHeaderDesc: {
    flex: 1,
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: theme.tableHeaderText,
  },
  tableHeaderAmount: {
    width: 110,
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: theme.tableHeaderText,
    textAlign: "right",
  },
  tableRow: {
    flexDirection: "row",
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderLeftWidth: 0.5,
    borderRightWidth: 0.5,
    borderColor: theme.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 28,
    alignItems: "center",
  },
  tableRowDesc: {
    flex: 1,
    fontSize: 10,
    color: "#262626",
    borderTopWidth: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderColor: "transparent",
  },
  tableRowAmount: {
    width: 110,
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#262626",
    textAlign: "right",
    borderTopWidth: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderColor: "transparent",
  },
  totalRow: {
    flexDirection: "row",
    backgroundColor: theme.totalBg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  totalLabel: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#262626",
    borderTopWidth: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderColor: "transparent",
  },
  totalAmount: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: theme.totalText,
    borderTopWidth: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderColor: "transparent",
  },
  discountAmount: {
    color: "#339933",
    borderTopWidth: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderColor: "transparent",
  },
  // Meta
  metaRow: {
    flexDirection: "row",
    marginTop: 28,
    marginBottom: 16,
  },
  metaText: {
    fontSize: 10,
    color: "#999",
  },
  // Notes
  notesLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#999",
    marginBottom: 6,
  },
  notesText: {
    fontSize: 10,
    color: "#595959",
    marginBottom: 16,
  },
  // Footer — full-width at bottom of page
  footerBlock: {
    backgroundColor: theme.brandDark,
    marginHorizontal: -MARGIN,
    paddingHorizontal: MARGIN,
    paddingTop: 20,
    paddingBottom: 24,
    marginTop: "auto",
  },
  footerText: {
    fontSize: 10,
    color: theme.footerText,
    marginBottom: 6,
  },
  footerSmall: {
    fontSize: 8,
    color: theme.footerMuted,
    marginBottom: 2,
  },
  footerDisclaimer: {
    fontSize: 7,
    color: theme.footerDisclaimer,
    marginTop: 10,
    marginBottom: 0,
  },
  });
}

export const styles = createInvoicePdfStyles("classic");
export type InvoicePdfStyles = typeof styles;
