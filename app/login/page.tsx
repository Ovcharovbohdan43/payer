import { Button } from "@/components/ui/button";
import Link from "next/link";

/**
 * Placeholder for Phase 1. Magic link login will be implemented in Phase 1.
 */
export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-muted-foreground">
          Auth (magic link) will be added in Phase 1.
        </p>
        <Button asChild variant="outline" className="w-full">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </div>
  );
}
