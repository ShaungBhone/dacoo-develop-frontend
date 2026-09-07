"use client"

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react"
import { en } from "@/lib/i18n/translations/en"
import { my } from "@/lib/i18n/translations/my"
import { setCookie } from "@/lib/cookies"

export type Locale = "en" | "my"

const translations = { en, my }

type LanguageContextType = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, variables?: Record<string, string | number>) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
)

function getNestedValue(obj: any, path: string): string | undefined {
  const parts = path.split(".")
  let current = obj
  for (const part of parts) {
    if (current === null || current === undefined) return undefined
    current = current[part]
  }
  return typeof current === "string" ? current : undefined
}

export function LanguageProvider({
  children,
  initialLocale = "en",
}: {
  children: ReactNode
  initialLocale?: Locale
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    setCookie("locale", newLocale, 365) // 1 year cookie
    if (typeof document !== "undefined") {
      document.documentElement.lang = newLocale
    }
  }

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale
    }
  }, [locale])

  const t = (
    key: string,
    variables?: Record<string, string | number>
  ): string => {
    let template = getNestedValue(translations[locale], key)

    // Fallback to English dictionary if not found in current locale
    if (template === undefined && locale !== "en") {
      template = getNestedValue(translations.en, key)
    }

    if (template === undefined) {
      return key
    }

    if (variables) {
      let result = template
      for (const [varName, varValue] of Object.entries(variables)) {
        result = result.replace(
          new RegExp(`{${varName}}`, "g"),
          String(varValue)
        )
      }
      return result
    }

    return template
  }

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useTranslation() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useTranslation must be used within a LanguageProvider")
  }
  return context
}
