import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.puyer.org";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Puyer — Invoice in 15 seconds",
    template: "%s | Puyer",
  },
  description:
    "Create invoices in seconds, send payment links, track payments, and get paid faster. Built for trades and freelancers. Free to start.",
  keywords: [
    "invoice",
    "invoicing",
    "get paid",
    "freelancer",
    "trades",
    "payment link",
    "stripe",
  ],
  authors: [{ name: "Puyer", url: SITE_URL }],
  creator: "Puyer",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "Puyer",
    title: "Puyer — Invoice in 15 seconds",
    description:
      "Create invoices in seconds, send payment links, track payments, and get paid faster. Built for trades and freelancers.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Puyer — Invoice in 15 seconds",
    description:
      "Create invoices in seconds, send payment links, track payments, and get paid faster.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  verification: {
    google: "L11KhrXvyMuiwNq2mKwhAjqAcCDxfZk00pDBscsj4CQ",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Puyer",
  description:
    "Create invoices in seconds, send payment links, track payments, and get paid faster. Built for trades and freelancers.",
  url: SITE_URL,
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased min-h-screen`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ThemeProvider>
          {children}
          <Toaster richColors position="top-center" />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
