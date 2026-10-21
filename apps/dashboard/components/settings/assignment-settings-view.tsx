"use client"

import * as React from "react"
import { useActiveOrganization } from "@/hooks/use-active-organization"
import { useWorkspaceAiSettings } from "@/contexts/workspace-ai-settings-context"
import { ApiError } from "@/lib/api"
import {
  fetchAgents,
  fetchModelCatalog,
  updateAiSettings,
  type AgentSummary,
  type AiSettings,
  type ModelOption,
} from "@/components/rag/api"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { TypographyH3, TypographyMuted } from "@/components/ui/typography"

const DEFAULT_OPTION = "workspace-default"

export function AssignmentSettingsView() {
  const organization = useActiveOrganization()
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <TypographyH3>Assignments</TypographyH3>
        <TypographyMuted>
          Configure AI replies for all inboxes. Human assignments and takeovers
          stay with your team.
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
  const {
    settings,
    isLoading,
    error: loadError,
    refresh,
    publish,
  } = useWorkspaceAiSettings()
  const [draft, setDraft] = React.useState<AiSettings | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [attempt, setAttempt] = React.useState(0)
  const [options, setOptions] = React.useState<{
    attempt: number
    agents: AgentSummary[]
    models: ModelOption[]
    error: boolean
  } | null>(null)
  const mounted = React.useRef(true)
  React.useEffect(() => {
    mounted.current = true
    let current = true
    Promise.all([
      fetchAgents(organizationId),
      fetchModelCatalog().catch(() => ({
        chatModels: [],
        embeddingProviders: [],
      })),
    ]).then(
      ([agents, catalog]) => {
        if (current)
          setOptions({
            attempt,
            agents: agents.filter((agent) => agent.status === "active"),
            models: catalog.chatModels,
            error: false,
          })
      },
      () => {
        if (current)
          setOptions({ attempt, agents: [], models: [], error: true })
      }
    )
    return () => {
      current = false
      mounted.current = false
    }
  }, [organizationId, attempt])

  const available = options?.attempt === attempt ? options : null
  const values = draft ?? settings
  const change = (patch: Partial<AiSettings>) => {
    if (values) setDraft({ ...values, ...patch })
  }
  const save = async () => {
    if (!values || !available || available.error || isSaving) return
    setIsSaving(true)
    setError(null)
    try {
      const next = await updateAiSettings(organizationId, {
        ...values,
        primary_agent_id: values.primary_agent_id ?? null,
      })
      if (!mounted.current) return
      publish(next)
      setDraft(null)
    } catch (err) {
      if (mounted.current)
        setError(
          err instanceof ApiError
            ? err.message
            : "Couldn't save assignment settings. Please try again."
        )
    } finally {
      if (mounted.current) setIsSaving(false)
    }
  }
  if ((isLoading && !settings) || !available)
    return (
      <Skeleton
        aria-label="Loading assignment settings"
        className="h-48 w-full rounded-lg"
      />
    )
  if (!values || available.error || loadError)
    return (
      <div className="flex flex-col items-start gap-3">
        <p role="alert" className="text-sm text-destructive">
          {loadError || "Couldn't load assignment options. Please try again."}
        </p>
        <Button
          variant="outline"
          onClick={() => {
            setAttempt((value) => value + 1)
            void refresh()
          }}
        >
          Retry loading settings
        </Button>
      </div>
    )

  const selectedAgent = available.agents.find(
    (agent) => agent.id === values.primary_agent_id
  )
  const selectedModel = available.models.find(
    (model) => model.id === values.default_model
  )
  const dirty =
    draft !== null && JSON.stringify(draft) !== JSON.stringify(settings)
  return (
    <div className="flex max-w-2xl flex-col gap-5">
      <Field orientation="horizontal" className="rounded-lg border p-4">
        <FieldContent>
          <FieldLabel htmlFor="workspace-ai-assignment">
            Enable workspace AI
          </FieldLabel>
          <FieldDescription>
            Applies to future inbound messages in eligible new and existing
            conversations across every inbox. Saving does not send messages.
          </FieldDescription>
        </FieldContent>
        <Switch
          id="workspace-ai-assignment"
          checked={values.auto_assign && values.auto_reply}
          disabled={isSaving}
          onCheckedChange={(enabled) =>
            change({ auto_assign: enabled, auto_reply: enabled })
          }
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="workspace-primary-agent">Primary agent</FieldLabel>
        <Select
          value={values.primary_agent_id ?? DEFAULT_OPTION}
          onValueChange={(id: string) =>
            change({ primary_agent_id: id === DEFAULT_OPTION ? null : id })
          }
          disabled={isSaving}
        >
          <SelectTrigger id="workspace-primary-agent" className="w-full">
            <SelectValue>
              {values.primary_agent_id
                ? (selectedAgent?.name ?? "Selected agent is no longer active")
                : "Workspace AI"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={DEFAULT_OPTION}>Workspace AI</SelectItem>
            {values.primary_agent_id && !selectedAgent ? (
              <SelectItem value={values.primary_agent_id} disabled>
                Selected agent is no longer active
              </SelectItem>
            ) : null}
            {available.agents.map((agent) => (
              <SelectItem key={agent.id} value={agent.id}>
                {agent.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldDescription>
          Choose an active agent, or use the default workspace assistant.
        </FieldDescription>
      </Field>
      <Field>
        <FieldLabel htmlFor="workspace-default-model">Default model</FieldLabel>
        <Select
          value={values.default_model ?? DEFAULT_OPTION}
          onValueChange={(id: string) =>
            change({ default_model: id === DEFAULT_OPTION ? null : id })
          }
          disabled={isSaving}
        >
          <SelectTrigger id="workspace-default-model" className="w-full">
            <SelectValue>
              {values.default_model
                ? (selectedModel?.label ?? values.default_model)
                : "Workspace default model"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={DEFAULT_OPTION}>
              Workspace default model
            </SelectItem>
            {values.default_model && !selectedModel ? (
              <SelectItem value={values.default_model}>
                {values.default_model}
              </SelectItem>
            ) : null}
            {available.models.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                {model.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      {error || loadError ? (
        <p role="alert" className="text-sm text-destructive">
          {error || loadError}
        </p>
      ) : null}
      <div className="flex justify-end">
        <Button
          onClick={() => void save()}
          disabled={!dirty || isSaving || !!loadError}
        >
          {isSaving ? <Spinner /> : null}Save
        </Button>
      </div>
    </div>
  )
}
