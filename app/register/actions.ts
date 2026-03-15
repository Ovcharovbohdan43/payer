"use server";

import { createClient } from "@/lib/supabase/server";
import { registerSchema } from "@/lib/validations";
import { redirect } from "next/navigation";

const LOGO_BUCKET = "logos";
const LOGO_MAX_BYTES = 10 * 1024 * 1024;
const LOGO_ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];

export async function signUpAction(formData: FormData) {
  const raw = {
    first_name: formData.get("first_name"),
    last_name: formData.get("last_name"),
    email: formData.get("email"),
    business_name: formData.get("business_name"),
    password: formData.get("password"),
    country: formData.get("country") ?? "",
    termsAccepted: formData.get("termsAccepted"),
  };
  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    const msg =
      first.first_name?.[0] ??
      first.last_name?.[0] ??
      first.email?.[0] ??
      first.business_name?.[0] ??
      first.password?.[0] ??
      first.termsAccepted?.[0] ??
      "Invalid fields";
    return { error: msg };
  }

  const supabase = await createClient();
  const fullName = `${parsed.data.first_name.trim()} ${parsed.data.last_name.trim()}`;
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: fullName,
        business_name: parsed.data.business_name,
      },
    },
  });

  if (error) {
    const msg = error.message;
    if (
      /rate limit|too many requests|limit exceeded/i.test(msg) ||
      msg.includes("over email sending")
    ) {
      return {
        error:
          "Email sending limit exceeded. Try again in an hour or use magic link to sign in.",
      };
    }
    return { error: msg };
  }
  if (!data.user) return { error: "Sign up failed" };

  if (data.session) {
    const logoFile = formData.get("logo") as File | null;
    if (
      logoFile &&
      logoFile instanceof File &&
      logoFile.size > 0 &&
      LOGO_ALLOWED_TYPES.includes(logoFile.type) &&
      logoFile.size <= LOGO_MAX_BYTES
    ) {
      const ext =
        logoFile.type === "image/png"
          ? "png"
          : logoFile.type === "image/webp"
            ? "webp"
            : "jpg";
      const path = `${data.user.id}/logo.${ext}`;
      const buffer = Buffer.from(await logoFile.arrayBuffer());
      const { error: uploadErr } = await supabase.storage
        .from(LOGO_BUCKET)
        .upload(path, buffer, { upsert: true, contentType: logoFile.type });
      if (!uploadErr) {
        const { data: urlData } = supabase.storage
          .from(LOGO_BUCKET)
          .getPublicUrl(path);
        await supabase
          .from("profiles")
          .update({
            logo_url: `${urlData.publicUrl}?v=${Date.now()}`,
            updated_at: new Date().toISOString(),
          })
          .eq("id", data.user.id);
      }
    }
    redirect("/onboarding");
  }

  redirect("/login?message=check_email");
}
