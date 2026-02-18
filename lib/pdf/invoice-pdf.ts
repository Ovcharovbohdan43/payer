import { PDFDocument, rgb, StandardFonts, type PDFFont } from "pdf-lib";

export type InvoicePdfData = {
  businessName: string;
  invoiceNumber: string;
  amountCents: number;
  currency: string;
  description: string | null;
  dueDate: string | null;
  clientName: string;
  clientEmail?: string | null;
  status: string;
  createdAt?: string | null;
  notes?: string | null;
};

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN = 50;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

function formatAmount(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
  }).format(cents / 100);
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Wrap text to fit maxWidth; returns lines. */
function wrapText(
  font: PDFFont,
  text: string,
  fontSize: number,
  maxWidth: number
): string[] {
  if (!text.trim()) return [];
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const width = font.widthOfTextAtSize(testLine, fontSize);
    if (width <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = "";
      }
      if (font.widthOfTextAtSize(word, fontSize) > maxWidth) {
        for (const char of word) {
          if (font.widthOfTextAtSize(currentLine + char, fontSize) <= maxWidth) {
            currentLine += char;
          } else {
            if (currentLine) lines.push(currentLine);
            currentLine = char;
          }
        }
      } else {
        currentLine = word;
      }
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

export async function generateInvoicePdf(
  data: InvoicePdfData
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(`Invoice ${data.invoiceNumber}`);
  pdfDoc.setAuthor(data.businessName);

  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const c = rgb(0.2, 0.2, 0.2);
  const cLight = rgb(0.45, 0.45, 0.45);
  const cMuted = rgb(0.55, 0.55, 0.55);

  let y = PAGE_HEIGHT - MARGIN;

  // ─── Header ─────────────────────────────────────────────────────────
  page.drawText(data.businessName, {
    x: MARGIN,
    y,
    size: 20,
    font: fontBold,
    color: c,
  });
  y -= 28;

  page.drawText("INVOICE", {
    x: MARGIN,
    y,
    size: 12,
    font: font,
    color: cMuted,
  });
  y -= 8;

  // Invoice number and date (right-aligned)
  const invNumText = `#${data.invoiceNumber}`;
  const invNumWidth = fontBold.widthOfTextAtSize(invNumText, 14);
  page.drawText(invNumText, {
    x: PAGE_WIDTH - MARGIN - invNumWidth,
    y: y + 8,
    size: 14,
    font: fontBold,
    color: c,
  });
  if (data.createdAt) {
    const dateText = `Date: ${formatDate(data.createdAt)}`;
    const dateWidth = font.widthOfTextAtSize(dateText, 9);
    page.drawText(dateText, {
      x: PAGE_WIDTH - MARGIN - dateWidth,
      y,
      size: 9,
      font,
      color: cMuted,
    });
  }
  y -= 24;

  // ─── Bill To ────────────────────────────────────────────────────────
  page.drawText("Bill to", {
    x: MARGIN,
    y,
    size: 9,
    font,
    color: cMuted,
  });
  y -= 6;

  page.drawText(data.clientName, {
    x: MARGIN,
    y,
    size: 11,
    font: fontBold,
    color: c,
  });
  y -= 6;

  if (data.clientEmail) {
    page.drawText(data.clientEmail, {
      x: MARGIN,
      y,
      size: 10,
      font,
      color: cLight,
    });
    y -= 6;
  }
  y -= 16;

  // ─── Items table ────────────────────────────────────────────────────
  const tableTop = y;
  const rowHeight = 22;
  const col1Width = CONTENT_WIDTH - 120;
  const col2Width = 120;

  // Table header
  page.drawRectangle({
    x: MARGIN,
    y: y - rowHeight + 4,
    width: CONTENT_WIDTH,
    height: rowHeight,
    color: rgb(0.96, 0.96, 0.96),
    borderColor: rgb(0.85, 0.85, 0.85),
    borderWidth: 0.5,
  });
  page.drawText("Description", {
    x: MARGIN + 8,
    y: y - 14,
    size: 9,
    font: fontBold,
    color: cMuted,
  });
  page.drawText("Amount", {
    x: PAGE_WIDTH - MARGIN - col2Width + 8,
    y: y - 14,
    size: 9,
    font: fontBold,
    color: cMuted,
  });
  y -= rowHeight;

  // Table row
  const descText = data.description || "Invoice payment";
  const descLines = wrapText(font, descText, 10, col1Width - 16);
  const amountText = formatAmount(data.amountCents, data.currency);
  const rowSpan = Math.max(1, descLines.length) * 14 + 12;

  page.drawRectangle({
    x: MARGIN,
    y: y - rowSpan + 4,
    width: CONTENT_WIDTH,
    height: rowSpan,
    borderColor: rgb(0.9, 0.9, 0.9),
    borderWidth: 0.5,
  });

  let lineY = y - 12;
  for (const line of descLines) {
    page.drawText(line, {
      x: MARGIN + 8,
      y: lineY,
      size: 10,
      font,
      color: c,
    });
    lineY -= 14;
  }

  const amountWidth = fontBold.widthOfTextAtSize(amountText, 12);
  page.drawText(amountText, {
    x: PAGE_WIDTH - MARGIN - col2Width + col2Width - amountWidth - 8,
    y: y - 14,
    size: 12,
    font: fontBold,
    color: c,
  });
  y -= rowSpan + 12;

  // ─── Due date & Status ──────────────────────────────────────────────
  if (data.dueDate) {
    page.drawText(`Due: ${formatDate(data.dueDate)}`, {
      x: MARGIN,
      y,
      size: 10,
      font,
      color: cMuted,
    });
    y -= 6;
  }

  page.drawText(`Status: ${data.status.charAt(0).toUpperCase() + data.status.slice(1)}`, {
    x: MARGIN,
    y,
    size: 10,
    font,
    color: cMuted,
  });
  y -= 20;

  // ─── Notes (optional) ───────────────────────────────────────────────
  if (data.notes && data.notes.trim()) {
    page.drawText("Notes", {
      x: MARGIN,
      y,
      size: 9,
      font: fontBold,
      color: cMuted,
    });
    y -= 6;

    const notesLines = wrapText(font, data.notes, 10, CONTENT_WIDTH);
    for (const line of notesLines) {
      page.drawText(line, {
        x: MARGIN,
        y,
        size: 10,
        font,
        color: cLight,
      });
      y -= 14;
    }
    y -= 12;
  }

  // ─── Footer ─────────────────────────────────────────────────────────
  const footerY = 50;
  page.drawLine({
    start: { x: MARGIN, y: footerY + 20 },
    end: { x: PAGE_WIDTH - MARGIN, y: footerY + 20 },
    thickness: 0.5,
    color: rgb(0.9, 0.9, 0.9),
  });
  page.drawText("Thank you for your business.", {
    x: MARGIN,
    y: footerY + 6,
    size: 9,
    font,
    color: cMuted,
  });
  page.drawText("Powered by Payer", {
    x: MARGIN,
    y: footerY - 6,
    size: 8,
    font,
    color: rgb(0.7, 0.7, 0.7),
  });

  return pdfDoc.save();
}
