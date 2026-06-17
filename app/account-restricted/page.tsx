import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { signOut } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { isUserBanned, SUPPORT_EMAIL } from "@/lib/auth/account-status";

export default async function AccountRestrictedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const banned = await isUserBanned(supabase, user.id);
  if (!banned) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0B0F14] px-4 py-8">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-amber-500/20 bg-[#121821] p-8 shadow-xl">
        <div className="space-y-3 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-amber-500/10">
            <span className="text-2xl" aria-hidden>
              ⚠️
            </span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Account temporarily restricted
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Your account has been temporarily restricted. If you believe this is a mistake,
            please contact our support team.
          </p>
        </div>

        <div className="rounded-xl border border-white/5 bg-[#0B0F14]/60 px-4 py-3 text-center">
          <p className="text-sm text-muted-foreground">Support email</p>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="mt-1 inline-block text-base font-medium text-[#3B82F6] hover:underline"
          >
            {SUPPORT_EMAIL}
          </a>
        </div>

        <form action={signOut} className="flex justify-center">
          <Button type="submit" variant="outline" className="w-full sm:w-auto">
            Sign out
          </Button>
        </form>
      </div>
    </div>
  );
}
