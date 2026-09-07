"use client"

import * as React from "react"

import { useOrganization } from "@/contexts/organization-context"
import {
  fetchCurrencySettings,
  type CurrencySettings,
} from "@/components/settings/currency-api"

type CurrencySettingsContextValue = {
  settings: CurrencySettings | null
  isLoading: boolean
  setSettings: (settings: CurrencySettings) => void
  refresh: () => Promise<void>
}

const CurrencySettingsContext =
  React.createContext<CurrencySettingsContextValue | null>(null)

export function CurrencySettingsProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { activeOrganizationId } = useOrganization()
  const [settings, setSettings] = React.useState<CurrencySettings | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)

  const refresh = React.useCallback(async () => {
    if (!activeOrganizationId) {
      setSettings(null)
      return
    }

    setIsLoading(true)
    try {
      setSettings(await fetchCurrencySettings(activeOrganizationId))
    } catch {
      setSettings(null)
    } finally {
      setIsLoading(false)
    }
  }, [activeOrganizationId])

  React.useEffect(() => {
    async function load() {
      await refresh()
    }

    void load()
  }, [refresh])

  const value = React.useMemo(
    () => ({ settings, isLoading, setSettings, refresh }),
    [isLoading, refresh, settings]
  )

  return (
    <CurrencySettingsContext.Provider value={value}>
      {children}
    </CurrencySettingsContext.Provider>
  )
}

export function useCurrencySettings() {
  const context = React.useContext(CurrencySettingsContext)
  if (!context) {
    throw new Error(
      "useCurrencySettings must be used within a CurrencySettingsProvider"
    )
  }
  return context
}
