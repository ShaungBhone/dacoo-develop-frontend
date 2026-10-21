"use client"

import * as React from "react"
import { useActiveOrganization } from "@/hooks/use-active-organization"
import { ApiError } from "@/lib/api"
import {
  fetchAiSettings,
  updateAiSettings,
  type AiSettings,
} from "@/components/rag/api"
import { Button } from "@/components/ui/button"
import { Field, FieldContent, FieldLabel } from "@/components/ui/field"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { TypographyH3, TypographyMuted } from "@/components/ui/typography"

export function AssignmentSettingsView() {
  const organization = useActiveOrganization()
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <TypographyH3>Assignments</TypographyH3>
        <TypographyMuted>
          Manage how conversations are assigned across your workspace.
        </TypographyMuted>
      </div>
      {organization ? (
        <WorkspaceAiAssignment
          key={organization.id}
          organizationId={organization.id}
        />
      ) : (
        <p>Select a workspace to manage assignment settings.</p>
      )}
    </section>
  )
}

export function WorkspaceAiAssignment({
  organizationId,
}: {
  organizationId: number
}) {
  const [settings, setSettings] = React.useState<AiSettings | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [loadError, setLoadError] = React.useState(false)

  React.useEffect(() => {
    let current = true
    fetchAiSettings(organizationId)
      .then((next) => {
        if (current) setSettings(next)
      })
      .catch((err) => {
        if (current) {
          setLoadError(true)
          setError(
            err instanceof ApiError
              ? err.message
              : "Couldn't load assignment settings. Please try again."
          )
        }
      })
      .finally(() => {
        if (current) setIsLoading(false)
      })
    return () => {
      current = false
    }
  }, [organizationId])

  const retry = async () => {
    setIsLoading(true)
    setError(null)
    try {
      setSettings(await fetchAiSettings(organizationId))
      setLoadError(false)
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Couldn't load assignment settings. Please try again."
      )
    } finally {
      setIsLoading(false)
    }
  }

  const save = async (enabled: boolean) => {
    if (!settings) return
    setIsSaving(true)
    setError(null)
    try {
      const updated = await updateAiSettings(organizationId, {
        ...settings,
        auto_assign: enabled,
        auto_reply: enabled,
      })
      setSettings(updated)
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Couldn't save assignment settings. Please try again."
      )
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) return <Skeleton className="h-32 w-full rounded-lg" />

  return (
    <div className="flex flex-col gap-4">
      {settings ? (
        <Field orientation="horizontal" className="rounded-lg border p-4">
          <FieldContent>
            <FieldLabel htmlFor="workspace-ai-assignment">
              Automatically assign conversations to AI
            </FieldLabel>
          </FieldContent>
          <Switch
            id="workspace-ai-assignment"
            checked={settings.auto_assign && settings.auto_reply}
            disabled={isSaving}
            onCheckedChange={(enabled) => void save(enabled)}
          />
        </Field>
      ) : null}
      {isSaving ? <Spinner aria-label="Saving assignment settings" /> : null}
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {loadError ? (
        <Button
          variant="outline"
          className="self-start"
          onClick={() => void retry()}
        >
          Retry loading settings
        </Button>
      ) : null}
    </div>
  )
}
