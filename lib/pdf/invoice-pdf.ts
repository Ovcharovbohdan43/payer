import { PDFDocument, rgb, StandardFonts, type PDFFont } from "pdf-lib";

/** Transliterate Cyrillic to Latin for PDF (StandardFonts are WinAnsi-only). */
function toAsciiSafe(text: string): string {
  const map: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z",
    и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
    с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch",
    ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
    і: "i", ї: "i", є: "e", ґ: "g", І: "I", Ї: "I", Є: "E", Ґ: "G",
    А: "A", Б: "B", В: "V", Г: "G", Д: "D", Е: "E", Ё: "E", Ж: "Zh", З: "Z",
    И: "I", Й: "Y", К: "K", Л: "L", М: "M", Н: "N", О: "O", П: "P", Р: "R",
    С: "S", Т: "T", У: "U", Ф: "F", Х: "H", Ц: "Ts", Ч: "Ch", Ш: "Sh", Щ: "Sch",
    Ъ: "", Ы: "Y", Ь: "", Э: "E", Ю: "Yu", Я: "Ya",
  };
  return text.replace(/[\u0400-\u04FF]/g, (c) => map[c] ?? "?");
}

export type InvoiceLineItemPdf = {
  description: string;
  amountCents: number;
};

export type InvoicePdfData = {
  businessName: string;
  invoiceNumber: string;
  amountCents: number;
  currency: string;
  /** Line items for the table; if empty, falls back to single "Invoice payment" row */
  lineItems: InvoiceLineItemPdf[];
  dueDate: string | null;
  clientName: string;
  clientEmail?: string | null;
  status: string;
  createdAt?: string | null;
  notes?: string | null;
  /** true = amount is gross (VAT included), false = amount is net (VAT added) */
  vatIncluded?: boolean;
  /** Payment processing fee in cents; shown as row before Total when set */
  paymentProcessingFeeCents?: number | null;
  /** Company logo URL; fetched and embedded in PDF */
  logoUrl?: string | null;
  /** Contact & legal info shown under business name */
  address?: string | null;
  phone?: string | null;
  companyNumber?: string | null;
  vatNumber?: string | null;
};

const VAT_RATE = 0.2; // 20%

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
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Wrap text to fit maxWidth; returns lines. Input is sanitized for WinAnsi. */
function wrapText(
  font: PDFFont,
  text: string,
  fontSize: number,
  maxWidth: number
): string[] {
  const safe = toAsciiSafe(text);
  if (!safe.trim()) return [];
  const words = safe.split(/\s+/);
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

  const lineHeight = (fontSize: number) => fontSize + 8;

  let y = PAGE_HEIGHT - MARGIN;

  // ─── Header: logo (optional) + business name + contact ───────────────
  let headerStartY = y;
  const logoSize = 48;
  let contentStartX = MARGIN;

  if (data.logoUrl) {
    try {
      const imgRes = await fetch(data.logoUrl);
      if (imgRes.ok) {
        const bytes = new Uint8Array(await imgRes.arrayBuffer());
        const contentType = imgRes.headers.get("content-type") ?? "";
        const url = data.logoUrl.toLowerCase();
        let img: Awaited<ReturnType<typeof pdfDoc.embedPng>> | null = null;
        if (contentType.includes("png") || url.endsWith(".png")) {
          img = await pdfDoc.embedPng(bytes);
        } else if (!contentType.includes("webp") && !url.endsWith(".webp")) {
          img = await pdfDoc.embedJpg(bytes);
        }
        // pdf-lib does not support WebP; skip logo for WebP
        if (img) {
          const scale = Math.min(logoSize / img.width, logoSize / img.height, 1);
          const w = img.width * scale;
          const h = img.height * scale;
          page.drawImage(img, { x: MARGIN, y: y - h, width: w, height: h });
          contentStartX = MARGIN + w + 12;
        }
      }
    } catch {
      // Skip logo on fetch error
    }
  }

  let headerY = y;
  page.drawText(toAsciiSafe(data.businessName), {
    x: contentStartX,
    y: headerY,
    size: 20,
    font: fontBold,
    color: c,
  });
  headerY -= lineHeight(20);

  const contactLines: string[] = [];
  if (data.address?.trim()) contactLines.push(toAsciiSafe(data.address.trim()));
  if (data.phone?.trim()) contactLines.push(toAsciiSafe(data.phone.trim()));
  if (data.companyNumber?.trim()) contactLines.push(`Company no: ${toAsciiSafe(data.companyNumber.trim())}`);
  if (data.vatNumber?.trim()) contactLines.push(`VAT: ${toAsciiSafe(data.vatNumber.trim())}`);

  for (const line of contactLines) {
    page.drawText(line, {
      x: contentStartX,
      y: headerY,
      size: 9,
      font,
      color: cMuted,
    });
    headerY -= lineHeight(9);
  }

  y = Math.min(headerY, y - (data.logoUrl ? logoSize : 0)) - 4;

  page.drawText("INVOICE", {
    x: MARGIN,
    y,
    size: 12,
    font: font,
    color: cMuted,
  });

  // Invoice number and date (right-aligned, same row as INVOICE)
  const invNumText = `#${data.invoiceNumber}`;
  const invNumWidth = fontBold.widthOfTextAtSize(invNumText, 14);
  page.drawText(invNumText, {
    x: PAGE_WIDTH - MARGIN - invNumWidth,
    y,
    size: 14,
    font: fontBold,
    color: c,
  });
  y -= lineHeight(12);

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
  y -= lineHeight(9) + 8;

  // ─── Bill To ────────────────────────────────────────────────────────
  page.drawText("Bill to", {
    x: MARGIN,
    y,
    size: 9,
    font,
    color: cMuted,
  });
  y -= lineHeight(9);

  page.drawText(toAsciiSafe(data.clientName), {
    x: MARGIN,
    y,
    size: 11,
    font: fontBold,
    color: c,
  });
  y -= lineHeight(11);

  if (data.clientEmail) {
    page.drawText(toAsciiSafe(data.clientEmail), {
      x: MARGIN,
      y,
      size: 10,
      font,
      color: cLight,
    });
    y -= lineHeight(10);
  }
  y -= 16;

  // ─── Items table ────────────────────────────────────────────────────
  const rowHeight = 24;
  const col1Width = CONTENT_WIDTH - 120;
  const col2Width = 120;
  const cellPadding = 10;
  const descFontSize = 10;
  const amountFontSize = 12;
  const textBaselineY = 14; // from row bottom

  // Table header
  page.drawRectangle({
    x: MARGIN,
    y: y - rowHeight,
    width: CONTENT_WIDTH,
    height: rowHeight,
    color: rgb(0.96, 0.96, 0.96),
    borderColor: rgb(0.85, 0.85, 0.85),
    borderWidth: 0.5,
  });
  page.drawText("Description", {
    x: MARGIN + cellPadding,
    y: y - rowHeight + textBaselineY,
    size: descFontSize,
    font: fontBold,
    color: cMuted,
  });
  page.drawText("Amount", {
    x: PAGE_WIDTH - MARGIN - col2Width + cellPadding,
    y: y - rowHeight + textBaselineY,
    size: descFontSize,
    font: fontBold,
    color: cMuted,
  });
  y -= rowHeight;

  const vatIncluded = data.vatIncluded;
  const lineH = descFontSize + 6;

  const items =
    data.lineItems?.length > 0
      ? data.lineItems
      : [{ description: "Invoice payment", amountCents: data.amountCents }];

  let subtotalCents: number;
  let vatCents: number;
  let totalCents: number;
  if (vatIncluded === true) {
    totalCents = data.amountCents;
    subtotalCents = Math.round(totalCents / (1 + VAT_RATE));
    vatCents = totalCents - subtotalCents;
  } else if (vatIncluded === false) {
    subtotalCents = items.reduce((s, i) => s + i.amountCents, 0);
    vatCents = Math.round(subtotalCents * VAT_RATE);
    totalCents = subtotalCents + vatCents;
  } else {
    subtotalCents = data.amountCents;
    vatCents = 0;
    totalCents = data.amountCents;
  }

  for (const item of items) {
    const descLines = wrapText(
      font,
      item.description,
      descFontSize,
      col1Width - cellPadding * 2
    );
    const amountText = formatAmount(item.amountCents, data.currency);
    const rowSpan = Math.max(rowHeight, descLines.length * lineH + 16);

    page.drawRectangle({
      x: MARGIN,
      y: y - rowSpan,
      width: CONTENT_WIDTH,
      height: rowSpan,
      borderColor: rgb(0.9, 0.9, 0.9),
      borderWidth: 0.5,
    });

    let lineY = y - textBaselineY;
    for (const line of descLines) {
      page.drawText(line, {
        x: MARGIN + cellPadding,
        y: lineY,
        size: descFontSize,
        font,
        color: c,
      });
      lineY -= lineH;
    }

    const amountWidth = fontBold.widthOfTextAtSize(amountText, amountFontSize);
    page.drawText(amountText, {
      x: PAGE_WIDTH - MARGIN - amountWidth - cellPadding,
      y: y - textBaselineY,
      size: amountFontSize,
      font: fontBold,
      color: c,
    });
    y -= rowSpan + 2;
  }
  y -= 6;

  // Payment processing fee row (when set)
  if (data.paymentProcessingFeeCents != null && data.paymentProcessingFeeCents > 0) {
    const feeLabel = "Payment processing fee";
    const feeText = formatAmount(data.paymentProcessingFeeCents, data.currency);

    page.drawRectangle({
      x: MARGIN,
      y: y - rowHeight,
      width: CONTENT_WIDTH,
      height: rowHeight,
      borderColor: rgb(0.9, 0.9, 0.9),
      borderWidth: 0.5,
    });
    page.drawText(feeLabel, {
      x: MARGIN + cellPadding,
      y: y - rowHeight + textBaselineY,
      size: descFontSize,
      font,
      color: c,
    });
    const feeTextWidth = fontBold.widthOfTextAtSize(feeText, amountFontSize);
    page.drawText(feeText, {
      x: PAGE_WIDTH - MARGIN - feeTextWidth - cellPadding,
      y: y - rowHeight + textBaselineY,
      size: amountFontSize,
      font: fontBold,
      color: c,
    });
    y -= rowHeight;
  }

  // VAT row (when vatIncluded set) + Total row (always)
  if (vatIncluded != null) {
    const vatLabel = vatIncluded ? "VAT (20% incl.)" : "VAT (20%)";
    const vatText = formatAmount(vatCents, data.currency);

    // VAT row
    page.drawRectangle({
      x: MARGIN,
      y: y - rowHeight,
      width: CONTENT_WIDTH,
      height: rowHeight,
      borderColor: rgb(0.9, 0.9, 0.9),
      borderWidth: 0.5,
    });
    page.drawText(vatLabel, {
      x: MARGIN + cellPadding,
      y: y - rowHeight + textBaselineY,
      size: descFontSize,
      font,
      color: c,
    });
    const vatTextWidth = fontBold.widthOfTextAtSize(vatText, amountFontSize);
    page.drawText(vatText, {
      x: PAGE_WIDTH - MARGIN - vatTextWidth - cellPadding,
      y: y - rowHeight + textBaselineY,
      size: amountFontSize,
      font: fontBold,
      color: c,
    });
    y -= rowHeight;
  }

  // Total row (always; uses data.amountCents as canonical total, incl. payment fee when present)
  const displayTotalCents = data.amountCents;
  const totalText = formatAmount(displayTotalCents, data.currency);
  page.drawRectangle({
    x: MARGIN,
    y: y - rowHeight,
    width: CONTENT_WIDTH,
    height: rowHeight,
    borderColor: rgb(0.85, 0.85, 0.85),
    borderWidth: 0.5,
  });
  page.drawText("Total", {
    x: MARGIN + cellPadding,
    y: y - rowHeight + textBaselineY,
    size: descFontSize,
    font: fontBold,
    color: c,
  });
  const totalTextWidth = fontBold.widthOfTextAtSize(totalText, amountFontSize);
  page.drawText(totalText, {
    x: PAGE_WIDTH - MARGIN - totalTextWidth - cellPadding,
    y: y - rowHeight + textBaselineY,
    size: amountFontSize,
    font: fontBold,
    color: c,
  });
  y -= rowHeight + 8;

  // ─── Due date & Status ──────────────────────────────────────────────
  if (data.dueDate) {
    page.drawText(`Due: ${formatDate(data.dueDate)}`, {
      x: MARGIN,
      y,
      size: 10,
      font,
      color: cMuted,
    });
    y -= lineHeight(10);
  }

  page.drawText(`Status: ${data.status.charAt(0).toUpperCase() + data.status.slice(1)}`, {
    x: MARGIN,
    y,
    size: 10,
    font,
    color: cMuted,
  });
  y -= lineHeight(10) + 16;

  // ─── Notes (optional) ───────────────────────────────────────────────
  if (data.notes && data.notes.trim()) {
    page.drawText("Notes", {
      x: MARGIN,
      y,
      size: 9,
      font: fontBold,
      color: cMuted,
    });
    y -= lineHeight(9);

    const notesLines = wrapText(font, toAsciiSafe(data.notes), 10, CONTENT_WIDTH);
    for (const line of notesLines) {
      page.drawText(line, {
        x: MARGIN,
        y,
        size: 10,
        font,
        color: cLight,
      });
      y -= lineH;
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
  page.drawText("Powered by Puyer", {
    x: MARGIN,
    y: footerY - 6,
    size: 8,
    font,
    color: rgb(0.7, 0.7, 0.7),
  });

  return pdfDoc.save();
}
