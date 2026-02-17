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
    .select("business_name")
    .eq("id", user.id)
    .single();

  if (profile?.business_name) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Set up your account
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We need a few details to create your invoices.
          </p>
        </div>
        <OnboardingForm />
      </div>
    </div>
  );
}
