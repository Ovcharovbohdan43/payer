import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-[#0B0F14]">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-xl font-semibold">Settings</h1>
        <div className="rounded-[20px] border border-white/5 bg-[#121821]/80 p-6 backdrop-blur">
          <p className="text-muted-foreground">
            Business profile, currency, and more options coming in Phase 8.
          </p>
        </div>
      </div>
    </div>
  );
}
