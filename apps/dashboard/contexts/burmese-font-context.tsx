"use client"

import { createContext, useContext, useEffect, useState } from "react"

import { setCookie } from "@/lib/cookies"

export type BurmeseFont = "typewriter" | "atest"

type BurmeseFontContextValue = {
  burmeseFont: BurmeseFont
  setBurmeseFont: (font: BurmeseFont) => void
}

const BurmeseFontContext = createContext<BurmeseFontContextValue | undefined>(
  undefined
)

export function BurmeseFontProvider({
  children,
  initialFont = "typewriter",
}: {
  children: React.ReactNode
  initialFont?: BurmeseFont
}) {
  const [burmeseFont, setBurmeseFontState] = useState<BurmeseFont>(initialFont)

  useEffect(() => {
    document.documentElement.dataset.burmeseFont = burmeseFont
  }, [burmeseFont])

  const setBurmeseFont = (font: BurmeseFont) => {
    setBurmeseFontState(font)
    setCookie("burmese-font", font, 365)
  }

  return (
    <BurmeseFontContext.Provider value={{ burmeseFont, setBurmeseFont }}>
      {children}
    </BurmeseFontContext.Provider>
  )
}

export function useBurmeseFont() {
  const context = useContext(BurmeseFontContext)

  if (context === undefined) {
    throw new Error("useBurmeseFont must be used within a BurmeseFontProvider")
  }

  return context
}
