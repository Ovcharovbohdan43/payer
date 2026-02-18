import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen min-w-0 overflow-x-hidden bg-[#0B0F14]">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
        <h1 className="mb-4 text-lg font-semibold sm:mb-6 sm:text-xl">Settings</h1>
        <div className="rounded-[16px] border border-white/5 bg-[#121821]/80 p-4 backdrop-blur sm:rounded-[20px] sm:p-6">
          <p className="text-muted-foreground">
            Business profile, currency, and more options coming in Phase 8.
          </p>
        </div>
      </div>
    </div>
  );
}
