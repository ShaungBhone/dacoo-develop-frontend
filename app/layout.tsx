import type { Metadata } from "next"
import { cookies } from "next/headers"
import localFont from "next/font/local"
import { Geist_Mono, Inter } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { LanguageProvider, type Locale } from "@/contexts/language-context"

export const metadata: Metadata = {
  title: "Dacoo",
  description: "Dacoo Platform",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
}

const inter = Inter({subsets:['latin'],variable:'--font-sans'})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
})

const burmese = localFont({
  src: "./fonts/typewriter-regular.ttf",
  weight: "400",
  display: "swap",
  variable: "--font-burmese",
  fallback: ["sans-serif"],
  adjustFontFallback: false,
})

const burmeseATest = localFont({
  src: "./fonts/atest-light.ttf",
  weight: "400",
  display: "swap",
  variable: "--font-burmese-atest",
  fallback: ["sans-serif"],
  adjustFontFallback: false,
  declarations: [
    { prop: "size-adjust", value: "88%" },
    { prop: "line-gap-override", value: "0%" },
  ],
})

import { AuthProvider } from "@/contexts/auth-context"
import { EchoProvider } from "@/contexts/echo-context"
import { CurrencySettingsProvider } from "@/contexts/currency-settings-context"
import { OrganizationProvider } from "@/contexts/organization-context"
import {
  BurmeseFontProvider,
  type BurmeseFont,
} from "@/contexts/burmese-font-context"

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies()
  const initialLocale = (cookieStore.get("locale")?.value || "en") as Locale
  const initialBurmeseFont: BurmeseFont =
    cookieStore.get("burmese-font")?.value === "atest" ? "atest" : "typewriter"

  return (
    <html
      lang={initialLocale}
      data-burmese-font={initialBurmeseFont}
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        burmese.variable,
        burmeseATest.variable,
        "font-sans",
        inter.variable
      )}
    >
      <body suppressHydrationWarning>
        <ThemeProvider>
          <BurmeseFontProvider initialFont={initialBurmeseFont}>
            <LanguageProvider initialLocale={initialLocale}>
              <AuthProvider>
                <EchoProvider>
                  <OrganizationProvider>
                    <CurrencySettingsProvider>
                      <TooltipProvider>{children}</TooltipProvider>
                      <Toaster position="top-center" />
                    </CurrencySettingsProvider>
                  </OrganizationProvider>
                </EchoProvider>
              </AuthProvider>
            </LanguageProvider>
          </BurmeseFontProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
