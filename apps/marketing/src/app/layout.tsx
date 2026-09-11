import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://dacoo.co"),
  applicationName: "Dacoo",
  title: "Dacoo - One Intelligent Platform for Every Customer",
  description: "One Intelligent Platform for Every Customer",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Dacoo - One Intelligent Platform for Every Customer",
    description: "One Intelligent Platform for Every Customer",
    url: "/",
    siteName: "Dacoo",
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1366,
        height: 768,
        alt: "Dacoo - One Intelligent Platform for Every Customer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dacoo - One Intelligent Platform for Every Customer",
    description: "One Intelligent Platform for Every Customer",
    images: [
      {
        url: "/og.png",
        alt: "Dacoo - One Intelligent Platform for Every Customer",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", inter.variable)}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
