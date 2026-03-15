const MAX_LOGO_BASE64_BYTES = 500_000; // ~660KB base64, avoid huge PDFs and react-pdf issues

/**
 * Fetch logo URL and convert to base64 data URI for PDF.
 * Avoids Image fetch issues in react-pdf (CORS, signed URLs, etc).
 */
export async function logoUrlToDataUri(url: string): Promise<string | undefined> {
  if (!url || typeof url !== "string" || !url.startsWith("http")) return undefined;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return undefined;
    const ct = res.headers.get("content-type") ?? "";
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > MAX_LOGO_BASE64_BYTES) return undefined;
    if (ct.includes("png")) {
      return `data:image/png;base64,${buf.toString("base64")}`;
    }
    if (ct.includes("jpeg") || ct.includes("jpg")) {
      return `data:image/jpeg;base64,${buf.toString("base64")}`;
    }
    return undefined;
  } catch {
    return undefined;
  }
}
