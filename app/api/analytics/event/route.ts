import { NextResponse } from "next/server";
import { z } from "zod";
import { logPlatformActivityAdmin } from "@/lib/admin/platform-activity";
import { getClientIpFromRequest } from "@/lib/auth/client-ip";

const bodySchema = z.object({
  action: z.literal("cta.clicked"),
  cta: z.enum(["start_free", "sign_up"]),
  location: z.string().min(1).max(60),
  path: z.string().max(500).optional(),
});

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await logPlatformActivityAdmin({
    category: "funnel",
    action: parsed.data.action,
    path: parsed.data.path ?? null,
    ip: getClientIpFromRequest(request),
    meta: {
      cta: parsed.data.cta,
      location: parsed.data.location,
    },
  });

  return NextResponse.json({ ok: true });
}
