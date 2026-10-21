"use client"

import * as React from "react"
import { useActiveOrganization } from "@/hooks/use-active-organization"
import { fetchAiSettings, type AiSettings } from "@/components/rag/api"

type WorkspaceAiSettingsState = {
  settings: AiSettings | null
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
  publish: (settings: AiSettings) => void
}

const WorkspaceAiSettingsContext =
  React.createContext<WorkspaceAiSettingsState | null>(null)

export function WorkspaceAiSettingsProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const organization = useActiveOrganization()
  return (
    <WorkspaceAiSettingsScope
      key={organization?.id ?? "none"}
      organizationId={organization?.id ?? null}
    >
      {children}
    </WorkspaceAiSettingsScope>
  )
}

export function WorkspaceAiSettingsScope({
  organizationId,
  children,
}: {
  organizationId: number | null
  children: React.ReactNode
}) {
  const [settings, setSettings] = React.useState<AiSettings | null>(null)
  const [isLoading, setIsLoading] = React.useState(organizationId !== null)
  const [error, setError] = React.useState<string | null>(null)
  const requestVersion = React.useRef(0)
  const mounted = React.useRef(true)

  const refresh = React.useCallback(async () => {
    if (organizationId === null) return
    const version = ++requestVersion.current
    setIsLoading(true)
    setError(null)
    try {
      const next = await fetchAiSettings(organizationId)
      if (mounted.current && version === requestVersion.current)
        setSettings(next)
    } catch {
      if (mounted.current && version === requestVersion.current) {
        setSettings(null)
        setError("Couldn't load Manion AI settings. Please try again.")
      }
    } finally {
      if (mounted.current && version === requestVersion.current)
        setIsLoading(false)
    }
  }, [organizationId])

  React.useEffect(() => {
    mounted.current = true
    let current = true
    void Promise.resolve().then(() => {
      if (current) void refresh()
    })
    const focus = () => {
      void refresh()
    }
    window.addEventListener("focus", focus)
    return () => {
      current = false
      mounted.current = false
      window.removeEventListener("focus", focus)
    }
  }, [refresh])

  const publish = React.useCallback((next: AiSettings) => {
    if (!mounted.current) return
    requestVersion.current++
    setSettings(next)
    setIsLoading(false)
    setError(null)
  }, [])

  return (
    <WorkspaceAiSettingsContext.Provider
      value={{ settings, isLoading, error, refresh, publish }}
    >
      {children}
    </WorkspaceAiSettingsContext.Provider>
  )
}

export function useWorkspaceAiSettings(): WorkspaceAiSettingsState {
  const context = React.useContext(WorkspaceAiSettingsContext)
  if (!context)
    throw new Error(
      "useWorkspaceAiSettings requires WorkspaceAiSettingsProvider"
    )
  return context
}
