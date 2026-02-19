import Link from "next/link";
import { VerifyOtpForm } from "./verify-otp-form";

export default function VerifyOtpPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Enter code</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We sent a 5-digit code to your email. Enter it below.
          </p>
        </div>
        <VerifyOtpForm />
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="underline hover:text-foreground">
            ← Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
