import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed, business_name")
    .eq("id", user.id)
    .single();

  if (profile?.onboarding_completed) {
    redirect("/dashboard");
  }

  const meta = user.user_metadata ?? {};
  const fullName = (meta.full_name ?? meta.name ?? "").trim();
  const nameParts = fullName ? fullName.split(/\s+/) : [];
  const initialFirstName = (meta.given_name ?? meta.first_name ?? nameParts[0] ?? "").trim();
  const initialLastName = (meta.family_name ?? meta.last_name ?? (nameParts.length > 1 ? nameParts.slice(1).join(" ") : "")).trim();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0B0F14] px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Complete your profile
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Tell us a few details so we can set up your account and invoices.
          </p>
        </div>
        <OnboardingForm
          initialEmail={user.email ?? undefined}
          initialFirstName={initialFirstName || undefined}
          initialLastName={initialLastName || undefined}
          initialBusinessName={profile?.business_name ?? undefined}
        />
      </div>
    </div>
  );
}
