import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { signOut } from "@/app/login/actions";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("business_name")
    .eq("id", user?.id ?? "")
    .single();

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-4 py-3">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <h1 className="text-lg font-semibold">
            {profile?.business_name ?? "Dashboard"}
          </h1>
          <form action={signOut}>
            <Button type="submit" variant="ghost" size="sm">
              Sign out
            </Button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">
        <p className="text-muted-foreground">
          Dashboard content (invoices, stats) will be added in Phase 6.
        </p>
        <Button asChild className="mt-4" variant="outline">
          <Link href="/">Home</Link>
        </Button>
      </main>
    </div>
  );
}
