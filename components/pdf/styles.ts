import { StyleSheet } from "@react-pdf/renderer";

export const BRAND = "#3B82F6";
export const BRAND_DARK = "#2563EB";
export const MARGIN = 48;
export const CONTENT_WIDTH = 595 - MARGIN * 2;
export const VAT_RATE = 0.2;

export const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    paddingHorizontal: MARGIN,
    paddingTop: MARGIN,
    paddingBottom: MARGIN,
  },
  // Header — full-width brand color block
  headerBlock: {
    backgroundColor: BRAND,
    marginHorizontal: -MARGIN,
    marginBottom: 32,
    paddingHorizontal: MARGIN,
    paddingTop: 32,
    paddingBottom: 24,
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
  logo: {
    width: 100,
    maxHeight: 56,
    marginBottom: 12,
  },
  brandName: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    marginBottom: 6,
  },
  contactLine: {
    fontSize: 9,
    color: "#e8edf5",
    marginBottom: 2,
  },
  invoiceBadge: {
    backgroundColor: "#93c5fd",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  invoiceLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#e8edf5",
    marginBottom: 2,
  },
  invoiceNumber: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
  },
  dateLabel: {
    fontSize: 9,
    color: "#e8edf5",
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
    backgroundColor: BRAND,
    borderWidth: 0,
    borderColor: "transparent",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tableHeaderDesc: {
    flex: 1,
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
  },
  tableHeaderAmount: {
    width: 110,
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    textAlign: "right",
  },
  tableRow: {
    flexDirection: "row",
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderLeftWidth: 0.5,
    borderRightWidth: 0.5,
    borderColor: "#e6e6e6",
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 28,
    alignItems: "center",
  },
  tableRowDesc: {
    flex: 1,
    fontSize: 10,
    color: "#262626",
  },
  tableRowAmount: {
    width: 110,
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#262626",
    textAlign: "right",
  },
  totalRow: {
    flexDirection: "row",
    backgroundColor: "#eff6ff",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: BRAND,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  totalLabel: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#262626",
  },
  totalAmount: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: BRAND,
  },
  discountAmount: {
    color: "#339933",
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
  // Footer — full-width brand color block
  footerBlock: {
    backgroundColor: BRAND_DARK,
    marginHorizontal: -MARGIN,
    paddingHorizontal: MARGIN,
    paddingTop: 20,
    paddingBottom: 24,
    marginTop: 40,
  },
  footerText: {
    fontSize: 10,
    color: "#ffffff",
    marginBottom: 6,
  },
  footerSmall: {
    fontSize: 8,
    color: "#bfdbfe",
    marginBottom: 2,
  },
});
