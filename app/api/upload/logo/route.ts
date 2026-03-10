import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const LOGO_BUCKET = "logos";
const LOGO_MAX_BYTES = 10 * 1024 * 1024; // 10MB
const LOGO_ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("logo") as File | null;
    if (!file || !(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { error: "Please select an image file" },
        { status: 400 }
      );
    }
    if (!LOGO_ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Image must be PNG, JPEG, or WebP" },
        { status: 400 }
      );
    }
    if (file.size > LOGO_MAX_BYTES) {
      return NextResponse.json(
        { error: "Image must be under 10MB" },
        { status: 400 }
      );
    }

    const ext =
      file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `${user.id}/logo.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from(LOGO_BUCKET)
      .upload(path, buffer, { upsert: true, contentType: file.type });

    if (uploadError) {
      console.error("[upload logo]", uploadError.message);
      return NextResponse.json(
        { error: uploadError.message },
        { status: 500 }
      );
    }

    const { data: urlData } = supabase.storage
      .from(LOGO_BUCKET)
      .getPublicUrl(path);
    const publicUrl = `${urlData.publicUrl}?v=${Date.now()}`;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ logo_url: publicUrl, updated_at: new Date().toISOString() })
      .eq("id", user.id);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    revalidatePath("/settings");
    revalidatePath("/dashboard");
    revalidatePath("/invoices");
    revalidatePath("/invoices/new");

    return NextResponse.json({ url: publicUrl });
  } catch (err) {
    console.error("[upload logo]", err);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
