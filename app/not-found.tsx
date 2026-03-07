import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0B0F14] px-4">
      <p className="text-6xl font-bold text-white/10">404</p>
      <h1 className="mt-4 text-xl font-semibold text-white">
        Page not found
      </h1>
      <p className="mt-2 max-w-sm text-center text-sm text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button asChild>
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="" width={20} height={20} />
            Back to home
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/login">Log in</Link>
        </Button>
      </div>
    </div>
  );
}
