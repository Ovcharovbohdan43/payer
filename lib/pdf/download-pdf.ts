/**
 * Fetch PDF and trigger browser download.
 * Uses credentials (cookies) for auth; works more reliably than direct link in some browsers.
 */
export async function downloadPdf(
  url: string,
  filename: string = "invoice.pdf"
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(url, {
      method: "GET",
      credentials: "same-origin",
      headers: { Accept: "application/pdf" },
    });

    if (!res.ok) {
      const text = await res.text();
      let err = `Download failed (${res.status})`;
      try {
        const json = JSON.parse(text);
        if (json.error) err = json.error;
      } catch {
        if (text.length < 200) err = text || err;
      }
      return { ok: false, error: err };
    }

    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes("application/pdf")) {
      return { ok: false, error: "Server did not return a PDF" };
    }

    const cd = res.headers.get("content-disposition");
    const fnMatch = cd?.match(/filename="?([^";\n]+)"?/);
    const finalFilename = fnMatch ? fnMatch[1].trim() : filename;

    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = finalFilename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);

    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Download failed",
    };
  }
}
