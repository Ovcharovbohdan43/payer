import { addUnsubscribe, verifyUnsubscribeToken } from "@/lib/email/unsubscribe";
import { NextRequest, NextResponse } from "next/server";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://puyer.org";

function renderPage(opts: {
  title: string;
  message: string;
  isError?: boolean;
}) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${opts.title} - Puyer</title>
</head>
<body style="margin:0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0B0F14; color: #fff; min-height: 100vh; display: flex; align-items: center; justify-content: center;">
  <div style="max-width: 28rem; padding: 1.5rem; text-align: center;">
    <h1 style="font-size: 1.25rem; font-weight: 600; margin: 0 0 0.5rem 0;">${opts.title}</h1>
    <p style="color: #a1a1aa; font-size: 0.875rem; margin: 0 0 1.5rem 0;">${opts.message}</p>
    <a href="${APP_URL}" style="color: #3B82F6; font-size: 0.875rem; text-decoration: underline;">Go to Puyer</a>
  </div>
</body>
</html>`;
}

/**
 * GET — user clicked unsubscribe link in email. Shows result page.
 * POST — List-Unsubscribe-Post one-click from Gmail/Yahoo. Returns 202.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email")?.trim();
  const token = searchParams.get("token")?.trim();

  if (!email || !token) {
    return new NextResponse(
      renderPage({
        title: "Unsubscribe",
        message:
          "Invalid link. Please use the unsubscribe link from a Puyer invoice or reminder email.",
      }),
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  if (!verifyUnsubscribeToken(email, token)) {
    return new NextResponse(
      renderPage({
        title: "Invalid link",
        message:
          "This unsubscribe link is invalid or has expired. Please use the link from your most recent invoice or reminder email.",
      }),
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  const result = await addUnsubscribe(email);

  const html = result.ok
    ? renderPage({
        title: "You're unsubscribed",
        message:
          "You will no longer receive invoice or reminder emails from Puyer to this address. If you change your mind, contact the business that sent you the invoice.",
      })
    : renderPage({
        title: "Something went wrong",
        message: `We couldn't process your unsubscribe request. Please try again or contact support@puyer.org.`,
        isError: true,
      });

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email")?.trim();
  const token = searchParams.get("token")?.trim();

  if (!email || !token) {
    return NextResponse.json(
      { error: "Missing email or token" },
      { status: 400 }
    );
  }

  if (!verifyUnsubscribeToken(email, token)) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  const result = await addUnsubscribe(email);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? "Failed to unsubscribe" },
      { status: 500 }
    );
  }

  return new NextResponse(null, { status: 202 });
}
