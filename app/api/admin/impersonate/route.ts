import { NextResponse } from "next/server";
import { isUserBanned } from "@/lib/auth/account-status";
import { isUserAdmin } from "@/lib/auth/require-admin";
import { logPlatformActivityAdmin } from "@/lib/admin/platform-activity";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Admin impersonation: exchange generateLink hashed_token for a user session.
 * Opens in a new tab; replaces auth cookies for this browser profile.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId")?.trim();
  const origin = new URL(request.url).origin;

  if (!userId) {
    return NextResponse.redirect(`${origin}/admin/users`);
  }

  const supabase = await createClient();
  const {
    data: { user: adminUser },
  } = await supabase.auth.getUser();

  if (!adminUser || !(await isUserAdmin(supabase, adminUser.id))) {
    return NextResponse.redirect(`${origin}/dashboard`);
  }

  if (userId === adminUser.id) {
    return NextResponse.redirect(`${origin}/admin/users/${userId}?error=self_impersonate`);
  }

  const service = createAdminClient();
  if (await isUserAdmin(service, userId)) {
    return NextResponse.redirect(`${origin}/admin/users/${userId}?error=admin_impersonate`);
  }

  const { data: target, error: targetErr } = await service.auth.admin.getUserById(userId);
  const email = target.user?.email;
  if (targetErr || !email) {
    return NextResponse.redirect(`${origin}/admin/users/${userId}?error=no_email`);
  }

  const { data: linkData, error: linkErr } = await service.auth.admin.generateLink({
    type: "magiclink",
    email,
  });

  const tokenHash = linkData?.properties?.hashed_token;
  if (linkErr || !tokenHash) {
    console.error("[impersonate] generateLink", linkErr?.message);
    return NextResponse.redirect(`${origin}/admin/users/${userId}?error=impersonate_link`);
  }

  const { error: verifyErr } = await supabase.auth.verifyOtp({
    type: "email",
    token_hash: tokenHash,
  });

  if (verifyErr) {
    console.error("[impersonate] verifyOtp", verifyErr.message);
    return NextResponse.redirect(`${origin}/admin/users/${userId}?error=impersonate_verify`);
  }

  if (await isUserBanned(supabase, userId)) {
    return NextResponse.redirect(`${origin}/account-restricted`);
  }

  await service.from("admin_actions_log").insert({
    admin_id: adminUser.id,
    action: "impersonate",
    target_user_id: userId,
    meta: { email },
  });
  await logPlatformActivityAdmin({
    category: "admin",
    action: "impersonate",
    actorId: adminUser.id,
    userId,
    meta: { email },
  });

  return NextResponse.redirect(`${origin}/dashboard`);
}
