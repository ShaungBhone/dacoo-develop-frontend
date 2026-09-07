"use client"

import * as React from "react"
import {
  SparklesIcon,
  ShieldCheckIcon,
  MessageCircleIcon,
  BarChart2Icon,
  ListChecksIcon,
  AlignLeftIcon,
  CheckIcon,
  Maximize2Icon,
} from "@/components/ui/icons"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Streamdown } from "streamdown"
import { cjk } from "@streamdown/cjk"
import { code } from "@streamdown/code"
import { math } from "@streamdown/math"
import { mermaid } from "@streamdown/mermaid"

const streamdownPlugins = { cjk, code, math, mermaid }
import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorEmpty,
  ModelSelectorGroup,
  ModelSelectorInput,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorLogo,
  ModelSelectorName,
} from "@/components/ai-elements/model-selector"
import {
  PromptInput,
  PromptInputBody,
  PromptInputButton,
  PromptInputCommand,
  PromptInputCommandEmpty,
  PromptInputCommandGroup,
  PromptInputCommandInput,
  PromptInputCommandItem,
  PromptInputCommandList,
  PromptInputCommandSeparator,
  PromptInputFooter,
  PromptInputHeader,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input"
import { useRag } from "@/components/rag/rag-context"
import { AGENTS, type Agent, type QuerySuggestion } from "@/components/rag/data"

export type AgentDialogState =
  { mode: "add" } | { mode: "edit"; agent: Agent } | null

export function QueryBar({
  query,
  setQuery,
  onRun,
  isRunning,
  agents,
  agentId,
  setAgentId,
  suggestions,
  isLoadingSuggestions,
  onOpenSuggestions,
  disabled,
}: {
  query: string
  setQuery: (v: string) => void
  onRun: (query?: string) => void
  isRunning: boolean
  agents: Agent[]
  agentId: string
  setAgentId: (id: string) => void
  suggestions: QuerySuggestion[]
  isLoadingSuggestions?: boolean
  onOpenSuggestions?: () => void
  onAddAgent: () => void
  disabled?: boolean
}) {
  const [previewAgentId, setPreviewAgentId] = React.useState(agentId)
  const [modelPickerOpen, setModelPickerOpen] = React.useState(false)
  const [agentPickerOpen, setAgentPickerOpen] = React.useState(false)
  const [suggestionsPickerOpen, setSuggestionsPickerOpen] =
    React.useState(false)
  const [suggestionsOpened, setSuggestionsOpened] = React.useState(false)

  const active = agents.find((a) => a.id === agentId) ??
    agents[0] ?? {
      id: "loading",
      label: "Loading...",
      description: "Please wait...",
      system: "",
    }
  const previewAgent = agents.find((a) => a.id === previewAgentId) ?? active

  React.useEffect(() => {
    if (agentId) {
      setPreviewAgentId(agentId)
    }
  }, [agentId])

  const {
    config: { genModel },
    modelCatalog,
    isLoadingModels,
  } = useRag()

  const activeModel =
    modelCatalog.chatModels.find((m) => m.id === genModel) ?? null
  const modelLabel = activeModel?.label
    ? stripVendorPrefix(activeModel.label)
    : genModel || "Select model"
  const modelDisabled =
    disabled || isLoadingModels || modelCatalog.chatModels.length === 0
  const suggestionsDisabled = disabled || isLoadingSuggestions
  const suggestionsLabel =
    suggestions.length === 0
      ? suggestionsOpened
        ? "No suggestions"
        : "Suggestions"
      : suggestions.length === 1
        ? "1 suggestion"
        : `${suggestions.length} suggestions`

  function handleSubmit(message: PromptInputMessage) {
    const nextQuery = message.text.trim()
    if (!nextQuery) return
    onRun(nextQuery)
  }

  return (
    <div className="flex flex-col gap-3">
      <PromptInput onSubmit={handleSubmit}>
        <PromptInputHeader>
          <Dialog open={agentPickerOpen} onOpenChange={setAgentPickerOpen}>
            <DialogTrigger
              render={
                <PromptInputButton
                  className="max-w-full"
                  size="sm"
                  variant="outline"
                  disabled={disabled}
                />
              }
            >
              <AgentIcon id={active.id} />
              <span className="truncate">{active.label}</span>
            </DialogTrigger>
            <DialogContent className="gap-0 p-0 sm:max-w-2xl">
              <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">Agents</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {previewAgent.description}
                  </p>
                </div>
              </div>

              <div className="grid gap-0 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
                <div className="max-h-96 overflow-y-auto p-1.5">
                  {agents.map((agent) => {
                    const isActive = agent.id === agentId
                    return (
                      <div
                        key={agent.id}
                        className={cn(
                          "flex items-center gap-1 rounded-2xl px-2 py-1.5 transition-colors hover:bg-muted/60",
                          isActive && "bg-muted text-foreground"
                        )}
                        onMouseEnter={() => setPreviewAgentId(agent.id)}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setAgentId(agent.id)
                            setPreviewAgentId(agent.id)
                            setAgentPickerOpen(false)
                          }}
                          className="flex min-w-0 flex-1 items-center gap-2 rounded-xl px-1.5 py-1 text-left text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                        >
                          <AgentIcon id={agent.id} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium">
                              {agent.label}
                            </span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {agent.description}
                            </span>
                          </span>
                          {isActive && (
                            <CheckIcon className="size-3.5 text-primary" />
                          )}
                        </button>
                      </div>
                    )
                  })}
                </div>

                <div className="max-h-96 overflow-y-auto border-t border-border bg-muted/30 p-4 md:border-t-0 md:border-l">
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    <AgentIcon id={previewAgent.id} />
                    {previewAgent.label}
                  </p>
                  <p className="rounded-2xl bg-background/70 px-3 py-2.5 font-mono text-[11px] leading-relaxed text-muted-foreground">
                    {previewAgent.system}
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog
            open={suggestionsPickerOpen}
            onOpenChange={(open) => {
              setSuggestionsPickerOpen(open)
              if (open) {
                setSuggestionsOpened(true)
                onOpenSuggestions?.()
              }
            }}
          >
            <DialogTrigger
              render={
                <PromptInputButton
                  size="sm"
                  variant="outline"
                  disabled={suggestionsDisabled}
                />
              }
            >
              {isLoadingSuggestions ? (
                <Spinner className="size-3.5" />
              ) : (
                <SparklesIcon className="size-3.5" />
              )}
              <span>
                {isLoadingSuggestions ? "Loading…" : suggestionsLabel}
              </span>
            </DialogTrigger>
            <DialogContent
              showCloseButton={false}
              className="w-[min(92vw,560px)] max-w-[min(92vw,560px)] overflow-hidden p-0"
            >
              <PromptInputCommand>
                <PromptInputCommandInput
                  className="border-none focus-visible:ring-0"
                  placeholder="Find a suggestion..."
                />
                <PromptInputCommandList className="max-h-96">
                  {isLoadingSuggestions ? (
                    <div className="flex items-center justify-center gap-2 p-6 text-sm text-muted-foreground">
                      <Spinner className="size-4" />
                      Loading suggestions…
                    </div>
                  ) : (
                    <>
                      <PromptInputCommandEmpty className="p-3 text-sm text-muted-foreground">
                        No suggestion found.
                      </PromptInputCommandEmpty>
                      <PromptInputCommandGroup
                        heading={`${active.label} suggestions`}
                      >
                        {suggestions.map((suggestion) => (
                          <PromptInputCommandItem
                            key={suggestion.id}
                            value={suggestion.query}
                            onSelect={() => {
                              setQuery(suggestion.query)
                              setSuggestionsPickerOpen(false)
                            }}
                          >
                            <SparklesIcon className="text-primary" />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate font-medium">
                                {suggestion.label}
                              </span>
                              <span className="line-clamp-2 text-xs text-muted-foreground">
                                {suggestion.query}
                              </span>
                            </span>
                          </PromptInputCommandItem>
                        ))}
                      </PromptInputCommandGroup>
                      <PromptInputCommandSeparator />
                      <p className="px-3 pt-1 pb-2 text-xs text-muted-foreground">
                        Suggestions update with the selected agent and dataset.
                      </p>
                    </>
                  )}
                </PromptInputCommandList>
              </PromptInputCommand>
            </DialogContent>
          </Dialog>
        </PromptInputHeader>

        <PromptInputBody>
          <PromptInputTextarea
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
            placeholder="Ask a question against your indexed sources…"
            className="min-h-10"
            disabled={disabled}
          />
        </PromptInputBody>

        <PromptInputFooter>
          <PromptInputTools>
            <PromptInputButton
              size="sm"
              variant="outline"
              disabled={modelDisabled}
              onClick={() => setModelPickerOpen(true)}
              tooltip="Generation model"
            >
              <SparklesIcon className="size-3.5" />
              <span className="max-w-32 truncate">
                {isLoadingModels ? "Loading…" : modelLabel}
              </span>
            </PromptInputButton>
            <span className="truncate text-xs text-muted-foreground">
              Retrieval testing
            </span>
          </PromptInputTools>
          <PromptInputSubmit
            status={isRunning ? "submitted" : "ready"}
            disabled={disabled || !query.trim() || isRunning}
            className="h-8!"
          />
        </PromptInputFooter>
      </PromptInput>

      <ModelPicker open={modelPickerOpen} onOpenChange={setModelPickerOpen} />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                            Generation model picker                          */
/* -------------------------------------------------------------------------- */

const PROVIDER_NAMES: Record<string, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  google: "Google",
}

function formatProviderName(provider: string): string {
  const known = PROVIDER_NAMES[provider]
  if (known) return known
  return provider
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

function stripVendorPrefix(label: string): string {
  const idx = label.indexOf(": ")
  return idx === -1 ? label : label.slice(idx + 2)
}

function ModelPicker({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const {
    config: { genModel },
    setGenModel,
    modelCatalog,
  } = useRag()

  const providers = React.useMemo(() => {
    const seen = new Map<string, boolean>()
    for (const m of modelCatalog.chatModels) {
      if (!seen.has(m.provider)) seen.set(m.provider, true)
    }
    return [...seen.keys()]
  }, [modelCatalog.chatModels])

  function handleSelect(id: string) {
    setGenModel(id)
    onOpenChange(false)
  }

  return (
    <ModelSelector open={open} onOpenChange={onOpenChange}>
      <ModelSelectorContent title="Select generation model">
        <ModelSelectorInput placeholder="Search models…" />
        <ModelSelectorList>
          <ModelSelectorEmpty>No models found.</ModelSelectorEmpty>
          {providers.map((provider) => (
            <ModelSelectorGroup
              key={provider}
              heading={formatProviderName(provider)}
            >
              {modelCatalog.chatModels
                .filter((m) => m.provider === provider)
                .map((m) => (
                  <ModelSelectorItem
                    key={m.id}
                    value={m.id}
                    onSelect={() => handleSelect(m.id)}
                    data-checked={m.id === genModel ? "true" : undefined}
                  >
                    <ModelSelectorLogo provider={m.provider.toLowerCase()} />
                    <ModelSelectorName>
                      {stripVendorPrefix(m.label)}
                    </ModelSelectorName>
                  </ModelSelectorItem>
                ))}
            </ModelSelectorGroup>
          ))}
        </ModelSelectorList>
      </ModelSelectorContent>
    </ModelSelector>
  )
}

function AgentIcon({ id }: { id: string }) {
  switch (id) {
    case "support":
      return <MessageCircleIcon className="size-3" />
    case "analyst":
      return <BarChart2Icon className="size-3" />
    case "compliance":
      return <ShieldCheckIcon className="size-3" />
    case "onboarding":
      return <ListChecksIcon className="size-3" />
    case "concise":
      return <AlignLeftIcon className="size-3" />
    default:
      return <SparklesIcon className="size-3" />
  }
}

export function AgentDialog({
  agent,
  onClose,
  onSave,
}: {
  agent: Agent | null
  onClose: () => void
  onSave: (input: Omit<Agent, "id"> & { id?: string }) => void
}) {
  const isEdit = agent != null
  const [label, setLabel] = React.useState(agent?.label ?? "")
  const [description, setDescription] = React.useState(agent?.description ?? "")
  const [system, setSystem] = React.useState(agent?.system ?? "")
  const [isPromptFullView, setIsPromptFullView] = React.useState(false)

  const canSave = label.trim().length > 0 && system.trim().length > 0

  function handleSave() {
    if (!canSave) return
    onSave({
      id: agent?.id,
      label: label.trim(),
      description: description.trim() || "Custom agent",
      system: system.trim(),
    })
  }

  return (
    <>
      <Dialog open onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <SparklesIcon className="size-4" />
              </span>
              {isEdit ? "Edit agent" : "New agent"}
            </DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Adjust how this agent instructs the model."
                : "Define a reusable agent persona for your answers."}
            </DialogDescription>
          </DialogHeader>

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="agent-label">Name</FieldLabel>
              <Input
                id="agent-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Technical writer"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="agent-desc">Description</FieldLabel>
              <Input
                id="agent-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short hint shown on hover (optional)"
              />
            </Field>

            <Field>
              <div className="flex items-center justify-between">
                <FieldLabel htmlFor="agent-system">System prompt</FieldLabel>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsPromptFullView(true)}
                  className="h-7 px-2 text-xs font-medium text-primary hover:bg-primary/10"
                >
                  <Maximize2Icon className="mr-1 size-3" />
                  Full view
                </Button>
              </div>
              <Textarea
                id="agent-system"
                value={system}
                onChange={(e) => setSystem(e.target.value)}
                rows={6}
                placeholder="You are a… Answer using only the context provided below."
                className="font-mono text-xs leading-relaxed"
              />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!canSave}>
              <CheckIcon data-icon="inline-start" />
              {isEdit ? "Save changes" : "Add agent"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPromptFullView} onOpenChange={setIsPromptFullView}>
        <DialogContent
          className="flex h-[65vh] max-w-7xl flex-col gap-4"
          showCloseButton
        >
          <DialogHeader>
            <DialogTitle>System Prompt (Full View)</DialogTitle>
            <DialogDescription>
              Edit the system prompt with markdown formatting.
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="write" className="flex min-h-0 flex-1 flex-col">
            <div className="flex items-center justify-between border-b pb-2">
              <TabsList>
                <TabsTrigger value="write">Write</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent
              value="write"
              className="mt-4 min-h-0 flex-1 outline-none"
            >
              <Textarea
                value={system}
                onChange={(e) => setSystem(e.target.value)}
                className="h-full w-full resize-none p-4 font-mono text-xs leading-relaxed"
                placeholder="You are a helpful assistant..."
              />
            </TabsContent>
            <TabsContent
              value="preview"
              className="mt-4 min-h-0 flex-1 overflow-y-auto rounded-md border border-border bg-muted/20 p-4"
            >
              <div className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed">
                <Streamdown plugins={streamdownPlugins}>
                  {system || "*No prompt content entered yet.*"}
                </Streamdown>
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button onClick={() => setIsPromptFullView(false)}>
              Close Full View
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export { AGENTS }
export type { Agent }
