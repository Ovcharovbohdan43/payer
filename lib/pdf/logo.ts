/**
 * Fetch logo URL and convert to base64 data URI for PDF.
 * Avoids Image fetch issues in react-pdf (CORS, signed URLs, etc).
 */
export async function logoUrlToDataUri(url: string): Promise<string | undefined> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return undefined;
    const ct = res.headers.get("content-type") ?? "";
    const buf = Buffer.from(await res.arrayBuffer());
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
