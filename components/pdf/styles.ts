import { StyleSheet } from "@react-pdf/renderer";

export const MARGIN = 52;
export const CONTENT_WIDTH = 595 - MARGIN * 2;
export const VAT_RATE = 0.2;

export const styles = StyleSheet.create({
  page: {
    padding: MARGIN,
    fontFamily: "Helvetica",
    fontSize: 10,
  },
  // Header
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 28,
  },
  headerText: {
    flex: 1,
    marginLeft: 0,
  },
  logo: {
    width: 120,
    maxHeight: 72,
    marginRight: 28,
  },
  brandName: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: "#262626",
    marginBottom: 4,
  },
  contactLine: {
    fontSize: 8,
    color: "#999",
    marginBottom: 2,
  },
  // Title
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 16,
  },
  invoiceLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#666",
  },
  invoiceNumber: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#262626",
  },
  dateLabel: {
    fontSize: 8,
    color: "#999",
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
    backgroundColor: "#f0f0f0",
    borderWidth: 0.5,
    borderColor: "#d1d1d1",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  tableHeaderDesc: {
    flex: 1,
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#999",
  },
  tableHeaderAmount: {
    width: 110,
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#999",
    textAlign: "right",
  },
  tableRow: {
    flexDirection: "row",
    borderWidth: 0.5,
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
    backgroundColor: "#f5f5f5",
    borderWidth: 0.5,
    borderColor: "#cccccc",
    paddingHorizontal: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  totalLabel: {
    flex: 1,
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#262626",
  },
  totalAmount: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#262626",
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
  // Footer
  footerLine: {
    borderTopWidth: 0.5,
    borderTopColor: "#e0e0e0",
    marginTop: "auto",
    paddingTop: 12,
    marginBottom: 8,
  },
  footerText: {
    fontSize: 8,
    color: "#999",
    marginBottom: 4,
  },
  footerSmall: {
    fontSize: 7,
    color: "#8c8c8c",
    marginBottom: 2,
  },
});
