import { LoginForm } from "./login-form";
import Link from "next/link";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error: queryError, message } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Use magic link or password. Create an account if you don&apos;t have one.
          </p>
        </div>
        {queryError === "link_invalid" && (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-center text-sm text-amber-700 dark:text-amber-400">
            That sign-in link is invalid or has expired. Try again below or sign in with password.
          </p>
        )}
        {message === "check_email" && (
          <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-center text-sm text-emerald-700 dark:text-emerald-400">
            Check your email to confirm your account, then sign in.
          </p>
        )}
        <LoginForm />
        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="underline hover:text-foreground">
            Create account
          </Link>
        </p>
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/" className="underline hover:text-foreground">
            Back to home
          </Link>
          {" · "}
          <Link href="/terms" className="underline hover:text-foreground">
            Terms of Service
          </Link>
          {" · "}
          <a href="mailto:support@puyer.org" className="underline hover:text-foreground">
            support@puyer.org
          </a>
        </p>
      </div>
    </div>
  );
}
