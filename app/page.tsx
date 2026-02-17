import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 md:py-24">
        <div className="flex flex-col gap-10">
          <header className="text-center">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Invoice in 15 seconds. Get paid faster.
            </h1>
            <p className="mt-3 text-muted-foreground sm:text-lg">
              Payer is built for trades and freelancers. Create an invoice, send
              a link, track payment — no hassle.
            </p>
          </header>

          <section className="grid gap-4 sm:grid-cols-3">
            <Card className="border-border/50 bg-card/80 backdrop-blur sm:transition-[transform,box-shadow] sm:hover:shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Pay link + tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  One link to view and pay. We track when it’s sent, viewed, and
                  paid.
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="border-border/50 bg-card/80 backdrop-blur sm:transition-[transform,box-shadow] sm:hover:shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Auto reminders</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Optional reminders so you get paid without chasing clients.
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="border-border/50 bg-card/80 backdrop-blur sm:transition-[transform,box-shadow] sm:hover:shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Made for you</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Built for trades and freelancers. Mobile-first, simple.
                </CardDescription>
              </CardContent>
            </Card>
          </section>

          <div className="flex justify-center">
            <Button asChild size="lg" className="min-w-[160px]">
              <Link href="/login">Start free</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
