import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export type InvoicePdfData = {
  businessName: string;
  invoiceNumber: string;
  amountCents: number;
  currency: string;
  description: string | null;
  dueDate: string | null;
  clientName: string;
  status: string;
};

function formatAmount(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
  }).format(cents / 100);
}

export async function generateInvoicePdf(data: InvoicePdfData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const margin = 50;
  let y = height - margin;

  const drawText = (
    text: string,
    opts: { fontSize?: number; bold?: boolean; maxWidth?: number } = {}
  ) => {
    const { fontSize = 11, bold = false } = opts;
    const f = bold ? fontBold : font;
    page.drawText(text, {
      x: margin,
      y,
      size: fontSize,
      font: f,
      color: rgb(0.1, 0.1, 0.1),
    });
    y -= fontSize + 4;
  };

  drawText(data.businessName, { fontSize: 16, bold: true });
  y -= 8;
  drawText(`Invoice ${data.invoiceNumber}`, { fontSize: 14, bold: true });
  y -= 16;

  drawText(`To: ${data.clientName}`, { fontSize: 10 });
  y -= 12;

  drawText(`Amount: ${formatAmount(data.amountCents, data.currency)}`, {
    fontSize: 18,
    bold: true,
  });
  y -= 8;

  if (data.description) {
    drawText(`Description: ${data.description}`, { fontSize: 10 });
    y -= 4;
  }
  if (data.dueDate) {
    drawText(`Due: ${new Date(data.dueDate).toLocaleDateString("en-US")}`, {
      fontSize: 10,
    });
    y -= 4;
  }

  drawText(`Status: ${data.status}`, { fontSize: 10 });
  y -= 20;

  drawText("Thank you for your business.", { fontSize: 9 });
  drawText("Powered by Payer", { fontSize: 8 });

  return pdfDoc.save();
}
