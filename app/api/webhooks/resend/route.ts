import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { Webhook } from "svix";

export async function POST(request: Request) {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Webhook not configured (RESEND_WEBHOOK_SECRET)" },
      { status: 503 }
    );
  }

  const rawBody = await request.text();
  const headersList = await headers();
  const svixId = headersList.get("svix-id");
  const svixTimestamp = headersList.get("svix-timestamp");
  const svixSignature = headersList.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json(
      { error: "Missing svix headers" },
      { status: 400 }
    );
  }

  let payload: { type: string; data?: Record<string, unknown> };
  try {
    const wh = new Webhook(webhookSecret);
    payload = wh.verify(rawBody, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as { type: string; data?: Record<string, unknown> };
  } catch (err) {
    console.error("[webhook resend] verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (payload.type === "email.received") {
    const data = payload.data;
    const from = typeof data?.from === "string" ? data.from : "";
    const to = Array.isArray(data?.to) ? data.to : [];
    const subject = typeof data?.subject === "string" ? data.subject : "";
    const emailId = data?.email_id;

    console.log("[webhook resend] email.received", {
      email_id: emailId,
      from,
      to,
      subject,
    });

    // TODO: process inbound email (store, forward, notify, etc.)
  }

  return NextResponse.json({ received: true });
}
