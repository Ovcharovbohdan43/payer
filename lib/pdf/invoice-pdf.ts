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
  /** Invoice-level discount */
  discountType?: "percent" | "fixed" | null;
  discountValue?: number | null;
};

const VAT_RATE = 0.2; // 20%

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN = 52;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

// Typography
const FS_BRAND = 22;
const FS_HEADING = 16;
const FS_SUBHEADING = 11;
const FS_BODY = 10;
const FS_LABEL = 8;
const FS_TABLE_AMOUNT = 11;
const FS_TOTAL = 14;
const FS_FOOTER = 8;

// Spacing (vertical rhythm)
const SECTION_GAP = 28;
const BLOCK_GAP = 16;
const LINE_GAP = 6;

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

  const c = rgb(0.15, 0.15, 0.15);
  const cBody = rgb(0.35, 0.35, 0.35);
  const cMuted = rgb(0.5, 0.5, 0.5);
  const cLabel = rgb(0.6, 0.6, 0.6);

  const line = (size: number) => size + LINE_GAP;
  let y = PAGE_HEIGHT - MARGIN;

  // ─── Header: logo (optional) + business name + contact ───────────────
  const logoMaxWidth = 80;
  const logoMaxHeight = 48;
  const logoToTextGap = 24;
  let contentStartX = MARGIN;
  let logoHeightUsed = 0;

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
          const scale = Math.min(
            logoMaxWidth / img.width,
            logoMaxHeight / img.height,
            1
          );
          const w = img.width * scale;
          const h = img.height * scale;
          page.drawImage(img, { x: MARGIN, y: y - h, width: w, height: h });
          contentStartX = MARGIN + w + logoToTextGap;
          logoHeightUsed = h;
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
    size: FS_BRAND,
    font: fontBold,
    color: c,
  });
  headerY -= line(FS_BRAND);

  const contactLines: string[] = [];
  if (data.address?.trim()) contactLines.push(toAsciiSafe(data.address.trim()));
  if (data.phone?.trim()) contactLines.push(toAsciiSafe(data.phone.trim()));
  if (data.companyNumber?.trim()) contactLines.push(`Company no: ${toAsciiSafe(data.companyNumber.trim())}`);
  if (data.vatNumber?.trim()) contactLines.push(`VAT: ${toAsciiSafe(data.vatNumber.trim())}`);

  for (const contactLine of contactLines) {
    page.drawText(contactLine, {
      x: contentStartX,
      y: headerY,
      size: FS_LABEL,
      font,
      color: cLabel,
    });
    headerY -= line(FS_LABEL);
  }

  y = Math.min(headerY, y - logoHeightUsed) - SECTION_GAP;

  // Invoice title + number (same row)
  page.drawText("INVOICE", {
    x: MARGIN,
    y,
    size: FS_LABEL,
    font: fontBold,
    color: cMuted,
  });
  const invNumText = `#${data.invoiceNumber}`;
  const invNumWidth = fontBold.widthOfTextAtSize(invNumText, FS_HEADING);
  page.drawText(invNumText, {
    x: PAGE_WIDTH - MARGIN - invNumWidth,
    y,
    size: FS_HEADING,
    font: fontBold,
    color: c,
  });
  y -= line(FS_HEADING);

  if (data.createdAt) {
    const dateText = `Date: ${formatDate(data.createdAt)}`;
    const dateWidth = font.widthOfTextAtSize(dateText, FS_LABEL);
    page.drawText(dateText, {
      x: PAGE_WIDTH - MARGIN - dateWidth,
      y,
      size: FS_LABEL,
      font,
      color: cLabel,
    });
  }
  y -= line(FS_LABEL) + BLOCK_GAP;

  // ─── Bill To ────────────────────────────────────────────────────────
  page.drawText("Bill to", {
    x: MARGIN,
    y,
    size: FS_LABEL,
    font: fontBold,
    color: cLabel,
  });
  y -= line(FS_LABEL);

  page.drawText(toAsciiSafe(data.clientName), {
    x: MARGIN,
    y,
    size: FS_SUBHEADING,
    font: fontBold,
    color: c,
  });
  y -= line(FS_SUBHEADING);

  if (data.clientEmail) {
    page.drawText(toAsciiSafe(data.clientEmail), {
      x: MARGIN,
      y,
      size: FS_BODY,
      font,
      color: cBody,
    });
    y -= line(FS_BODY);
  }
  y -= SECTION_GAP;

  // ─── Items table ────────────────────────────────────────────────────
  const rowHeight = 28;
  const col1Width = CONTENT_WIDTH - 110;
  const col2Width = 110;
  const cellPadding = 12;
  const textBaselineY = 16;

  // Table header
  page.drawRectangle({
    x: MARGIN,
    y: y - rowHeight,
    width: CONTENT_WIDTH,
    height: rowHeight,
    color: rgb(0.94, 0.94, 0.94),
    borderColor: rgb(0.82, 0.82, 0.82),
    borderWidth: 0.5,
  });
  page.drawText("Description", {
    x: MARGIN + cellPadding,
    y: y - rowHeight + textBaselineY,
    size: FS_BODY,
    font: fontBold,
    color: cLabel,
  });
  page.drawText("Amount", {
    x: PAGE_WIDTH - MARGIN - col2Width + cellPadding,
    y: y - rowHeight + textBaselineY,
    size: FS_BODY,
    font: fontBold,
    color: cLabel,
  });
  y -= rowHeight;

  const vatIncluded = data.vatIncluded;
  const lineH = FS_BODY + 6;

  const items =
    data.lineItems?.length > 0
      ? data.lineItems
      : [{ description: "Invoice payment", amountCents: data.amountCents }];

  let subtotalFromLines = items.reduce((s, i) => s + i.amountCents, 0);
  let invoiceDiscountCents = 0;
  if (data.discountType && data.discountValue != null && data.discountValue > 0) {
    if (data.discountType === "percent") {
      invoiceDiscountCents = Math.round(subtotalFromLines * (data.discountValue / 100));
    } else {
      invoiceDiscountCents = Math.round(data.discountValue);
    }
  }
  const subtotalAfterDiscount = Math.max(0, subtotalFromLines - invoiceDiscountCents);

  let subtotalCents: number;
  let vatCents: number;
  let totalCents: number;
  if (vatIncluded === true) {
    totalCents = data.amountCents;
    subtotalCents = Math.round(totalCents / (1 + VAT_RATE));
    vatCents = totalCents - subtotalCents;
  } else if (vatIncluded === false) {
    subtotalCents = subtotalAfterDiscount;
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
      FS_BODY,
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
    for (const descLine of descLines) {
      page.drawText(descLine, {
        x: MARGIN + cellPadding,
        y: lineY,
        size: FS_BODY,
        font,
        color: c,
      });
      lineY -= lineH;
    }

    const amountWidth = fontBold.widthOfTextAtSize(amountText, FS_TABLE_AMOUNT);
    page.drawText(amountText, {
      x: PAGE_WIDTH - MARGIN - amountWidth - cellPadding,
      y: y - textBaselineY,
      size: FS_TABLE_AMOUNT,
      font: fontBold,
      color: c,
    });
    y -= rowSpan + 2;
  }
  y -= 6;

  // Invoice discount row (when set)
  if (invoiceDiscountCents > 0) {
    const discountLabel =
      data.discountType === "percent"
        ? `Discount (${data.discountValue}%)`
        : "Discount";
    const discountText = "-" + formatAmount(invoiceDiscountCents, data.currency);

    page.drawRectangle({
      x: MARGIN,
      y: y - rowHeight,
      width: CONTENT_WIDTH,
      height: rowHeight,
      borderColor: rgb(0.9, 0.9, 0.9),
      borderWidth: 0.5,
    });
    page.drawText(discountLabel, {
      x: MARGIN + cellPadding,
      y: y - rowHeight + textBaselineY,
      size: FS_BODY,
      font,
      color: c,
    });
    const discountTextWidth = fontBold.widthOfTextAtSize(discountText, FS_TABLE_AMOUNT);
    page.drawText(discountText, {
      x: PAGE_WIDTH - MARGIN - discountTextWidth - cellPadding,
      y: y - rowHeight + textBaselineY,
      size: FS_TABLE_AMOUNT,
      font: fontBold,
      color: rgb(0.2, 0.6, 0.3),
    });
    y -= rowHeight;
  }

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
      size: FS_BODY,
      font,
      color: c,
    });
    const feeTextWidth = fontBold.widthOfTextAtSize(feeText, FS_TABLE_AMOUNT);
    page.drawText(feeText, {
      x: PAGE_WIDTH - MARGIN - feeTextWidth - cellPadding,
      y: y - rowHeight + textBaselineY,
      size: FS_TABLE_AMOUNT,
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
      size: FS_BODY,
      font,
      color: c,
    });
    const vatTextWidth = fontBold.widthOfTextAtSize(vatText, FS_TABLE_AMOUNT);
    page.drawText(vatText, {
      x: PAGE_WIDTH - MARGIN - vatTextWidth - cellPadding,
      y: y - rowHeight + textBaselineY,
      size: FS_TABLE_AMOUNT,
      font: fontBold,
      color: c,
    });
    y -= rowHeight;
  }

  // Total row — prominent
  const totalRowHeight = 36;
  const displayTotalCents = data.amountCents;
  const totalText = formatAmount(displayTotalCents, data.currency);
  page.drawRectangle({
    x: MARGIN,
    y: y - totalRowHeight,
    width: CONTENT_WIDTH,
    height: totalRowHeight,
    color: rgb(0.96, 0.96, 0.96),
    borderColor: rgb(0.8, 0.8, 0.8),
    borderWidth: 0.5,
  });
  page.drawText("Total", {
    x: MARGIN + cellPadding,
    y: y - totalRowHeight + 18,
    size: FS_SUBHEADING,
    font: fontBold,
    color: c,
  });
  const totalTextWidth = fontBold.widthOfTextAtSize(totalText, FS_TOTAL);
  page.drawText(totalText, {
    x: PAGE_WIDTH - MARGIN - totalTextWidth - cellPadding,
    y: y - totalRowHeight + 18,
    size: FS_TOTAL,
    font: fontBold,
    color: c,
  });
  y -= totalRowHeight + SECTION_GAP;

  // ─── Due date & Status ──────────────────────────────────────────────
  const metaParts: string[] = [];
  if (data.dueDate) metaParts.push(`Due: ${formatDate(data.dueDate)}`);
  metaParts.push(`Status: ${data.status.charAt(0).toUpperCase() + data.status.slice(1)}`);
  page.drawText(metaParts.join("  ·  "), {
    x: MARGIN,
    y,
    size: FS_BODY,
    font,
    color: cLabel,
  });
  y -= line(FS_BODY) + BLOCK_GAP;

  // ─── Notes (optional) ───────────────────────────────────────────────
  if (data.notes && data.notes.trim()) {
    page.drawText("Notes", {
      x: MARGIN,
      y,
      size: FS_LABEL,
      font: fontBold,
      color: cLabel,
    });
    y -= line(FS_LABEL);

    const notesLines = wrapText(font, toAsciiSafe(data.notes), FS_BODY, CONTENT_WIDTH);
    for (const notesLine of notesLines) {
      page.drawText(notesLine, {
        x: MARGIN,
        y,
        size: FS_BODY,
        font,
        color: cBody,
      });
      y -= line(FS_BODY);
    }
    y -= BLOCK_GAP;
  }

  // ─── Footer ─────────────────────────────────────────────────────────
  const footerY = 48;
  page.drawLine({
    start: { x: MARGIN, y: footerY + 22 },
    end: { x: PAGE_WIDTH - MARGIN, y: footerY + 22 },
    thickness: 0.5,
    color: rgb(0.88, 0.88, 0.88),
  });
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://puyer.org";
  const termsUrl = appUrl.replace(/\/$/, "") + "/terms";

  page.drawText("Thank you for your business.", {
    x: MARGIN,
    y: footerY + 8,
    size: FS_FOOTER,
    font,
    color: cLabel,
  });
  page.drawText("Powered by Puyer", {
    x: MARGIN,
    y: footerY,
    size: 7,
    font,
    color: rgb(0.65, 0.65, 0.65),
  });
  page.drawText(`Terms of service: ${termsUrl.replace(/^https?:\/\//, "")}`, {
    x: MARGIN,
    y: footerY - 10,
    size: 6,
    font,
    color: rgb(0.55, 0.55, 0.55),
  });

  return pdfDoc.save();
}
