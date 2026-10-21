"use client"

import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from "react"
import Link from "next/link"
import {
  AtSignIcon,
  BotIcon,
  CirclePlusIcon,
  ExpandIcon,
  FileIcon,
  ImageIcon,
  MailIcon,
  MessageSquareIcon,
  MicIcon,
  PlusIcon,
  RefreshCwIcon,
  SendHorizontalIcon,
  Settings2Icon,
  SquareCodeIcon,
  StepForwardIcon,
  XIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Frame, FramePanel } from "@/components/reui/frame"
import { fetchAgents, type AgentSummary } from "@/components/rag/api"
import { Alert, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupTextarea,
} from "@/components/ui/input-group"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useAuth } from "@/contexts/auth-context"
import { useActiveOrganization } from "@/hooks/use-active-organization"
import { cn } from "@/lib/utils"

const models = ["Model Fusion", "v0 Mini", "v0 1.5", "v0 Max"]
const suggestions = [
  {
    label: "Message someone",
    icon: MessageSquareIcon,
    prompt: "Help me write a message to a customer about ",
  },
  {
    label: "Summarise contract",
    icon: StepForwardIcon,
    prompt: "Summarise this customer contract and highlight the key terms: ",
  },
  {
    label: "Email customer",
    icon: MailIcon,
    prompt: "Draft a friendly email to a customer about ",
  },
  {
    label: "Add note",
    icon: CirclePlusIcon,
    prompt: "Help me turn these details into a customer note: ",
  },
]
const examples = [
  {
    title: "Generate a quarterly sales report for Acme Corp",
    prompt: "Generate a quarterly sales report for Acme Corp.",
  },
  {
    title: "Analyze customer feedback trends for Q2",
    prompt:
      "Analyze customer feedback trends for Q2 and highlight the main themes.",
  },
  {
    title: "Create follow up reminders for overdue invoices",
    prompt: "Help me draft follow up reminders for overdue invoices.",
  },
  {
    title: "Identify top 5 leads from last month’s campaign",
    prompt:
      "Identify the top 5 leads from last month’s campaign and suggest next steps.",
  },
  {
    title: "Prepare weekly sync agenda for the Design team",
    prompt: "Prepare a weekly sync agenda for the Design team.",
  },
]

function ModelMark() {
  return (
    <span aria-hidden="true" className="flex items-center">
      {[
        "linear-gradient(135deg,#d8a9ff,#a65be2)",
        "linear-gradient(135deg,#ffa4d8,#f0559b)",
        "linear-gradient(135deg,#ffd081,#ff9550)",
      ].map((background) => (
        <span
          key={background}
          className="-ml-1.5 size-3.5 rounded-full ring-1 ring-background first:ml-0"
          style={{ background }}
        />
      ))}
    </span>
  )
}

type Attachment = {
  id: string
  kind: "file" | "image"
  name: string
  size: number
}

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

export function HomepagePromptFrame({
  embedded = false,
}: {
  embedded?: boolean
}) {
  const organization = useActiveOrganization()
  return (
    <OrganizationHomePrompt
      key={organization?.id ?? "no-organization"}
      organizationId={organization?.id ?? null}
      embedded={embedded}
    />
  )
}

function OrganizationHomePrompt({
  organizationId,
  embedded,
}: {
  organizationId: number | null
  embedded: boolean
}) {
  const { user } = useAuth()
  const Container = embedded ? "section" : "main"
  const fileInputRef = useRef<HTMLInputElement>(null)
  const promptRef = useRef<HTMLTextAreaElement>(null)
  const [prompt, setPrompt] = useState("")
  const [model, setModel] = useState<string>(models[0])
  const [agentId, setAgentId] = useState<string | null>(null)
  const [agentState, setAgentState] = useState<{
    status: "loading" | "ready" | "error"
    agents: AgentSummary[]
  }>(() => ({
    status: organizationId === null ? "ready" : "loading",
    agents: [],
  }))
  const [retryCount, setRetryCount] = useState(0)
  const agents = agentState.agents
  const selectedAgent =
    agents.find((agent) => agent.id === agentId) ??
    agents.find((agent) => agent.isPrimary) ??
    agents[0] ??
    null

  useEffect(() => {
    if (organizationId === null) return
    let cancelled = false
    fetchAgents(organizationId).then(
      (agents) => {
        if (!cancelled) setAgentState({ status: "ready", agents })
      },
      () => {
        if (!cancelled) setAgentState({ status: "error", agents: [] })
      }
    )
    return () => {
      cancelled = true
    }
  }, [organizationId, retryCount])
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [historyOffset, setHistoryOffset] = useState(0)
  const [historyExpanded, setHistoryExpanded] = useState(false)
  const visibleExamples = [
    ...examples.slice(historyOffset),
    ...examples.slice(0, historyOffset),
  ]

  function fillPrompt(value: string) {
    setPrompt(value)
    promptRef.current?.focus()
  }

  function previewFeature(name: string) {
    toast.info(`${name} is a preview`, {
      description: "This feature isn’t connected yet.",
    })
  }

  function submitPrompt(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault()
    if (!prompt.trim()) {
      toast.info("Enter a prompt first.")
      promptRef.current?.focus()
      return
    }
    toast.info("AI chat isn’t connected in this preview", {
      description:
        "Your draft and attachments will stay here while you explore.",
    })
  }

  function selectAttachments(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []).map((file) => ({
      id: `${file.name}-${file.size}-${file.type}`,
      kind: file.type.startsWith("image/")
        ? ("image" as const)
        : ("file" as const),
      name: file.name,
      size: file.size,
    }))
    setAttachments((current) =>
      Array.from(
        new Map(
          [...current, ...selected].map((file) => [file.id, file])
        ).values()
      )
    )
    event.target.value = ""
  }

  return (
    <Container
      aria-label="Home assistant"
      className={cn(
        "bg-background text-foreground",
        embedded ? "min-h-0 flex-1 overflow-y-auto" : "min-h-svh"
      )}
    >
      <div className="flex min-h-full flex-col">
        <div className="flex min-h-10 shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b px-2 py-1">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {agentState.status === "loading" ? (
              <div
                role="status"
                aria-label="Loading agents"
                className="flex min-w-0 flex-1 gap-2"
              >
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
                <span className="sr-only">Loading agents…</span>
              </div>
            ) : agentState.status === "error" ? (
              <Alert className="flex min-w-0 flex-1 flex-wrap items-center gap-2 py-1">
                <AlertTitle>Couldn’t load agents.</AlertTitle>
                <Button
                  variant="outline"
                  onClick={() => {
                    setAgentState({ status: "loading", agents: [] })
                    setRetryCount((count) => count + 1)
                  }}
                >
                  Retry
                </Button>
              </Alert>
            ) : agents.length === 0 ? (
              <p className="min-w-0 flex-1 text-sm text-muted-foreground">
                {organizationId === null
                  ? "Select a workspace to see its agents."
                  : "No agents yet. Add an agent to get started."}
              </p>
            ) : (
              <Tabs
                value={selectedAgent?.id ?? null}
                onValueChange={(value) => setAgentId(String(value))}
                className="max-w-full min-w-0 flex-initial"
              >
                <TabsList
                  aria-label="Agents"
                  variant="ghost"
                  className="max-w-full flex-wrap justify-start border-0 group-data-horizontal/tabs:h-auto"
                >
                  {agents.map((agent) => (
                    <TabsTrigger
                      key={agent.id}
                      value={agent.id}
                      className="h-8 max-w-full min-w-0 flex-none gap-1.5"
                    >
                      <BotIcon aria-hidden="true" />
                      <span className="truncate" title={agent.name}>
                        {agent.name}
                      </span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            )}
            <div className="flex shrink-0 items-center gap-3">
              <Separator
                orientation="vertical"
                className="h-4 data-vertical:self-center"
              />
              <Button
                variant="ghost"
                disabled={organizationId === null}
                render={
                  organizationId === null ? undefined : (
                    <Link href="/agents/new" />
                  )
                }
              >
                <PlusIcon data-icon="inline-start" />
                Add Agent
              </Button>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              variant="ghost"
              className="hidden lg:inline-flex"
              onClick={() => {
                setPrompt("")
                setAttachments([])
                promptRef.current?.focus()
              }}
            >
              <RefreshCwIcon data-icon="inline-start" />
              Start from scratch
            </Button>
            {selectedAgent && (
              <Button
                variant="ghost"
                render={
                  <Link
                    href={`/agents/${encodeURIComponent(selectedAgent.id)}`}
                  />
                }
              >
                <Settings2Icon data-icon="inline-start" />
                Settings
              </Button>
            )}
          </div>
        </div>

        <section
          aria-labelledby="home-greeting"
          className="flex flex-1 flex-col items-center px-4 pt-12 pb-12 sm:px-8 sm:pt-16 lg:min-h-[calc(100svh-384px)]"
        >
          <div className="flex flex-col items-center gap-2 text-center">
            <h1
              id="home-greeting"
              className="font-serif text-[2rem] leading-10 tracking-[-0.035em]"
            >
              Good morning, {user?.name?.trim().split(/\s+/)[0] || "there"}
            </h1>
            <p className="text-xs leading-4 text-muted-foreground">
              {selectedAgent
                ? `I’m ${selectedAgent.name}, where should we start today?`
                : "Where should we start today?"}
            </p>
          </div>
          <div className="mt-10 flex w-full max-w-168 flex-col gap-6">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              tabIndex={-1}
              aria-label="Choose attachments"
              className="sr-only"
              onChange={selectAttachments}
            />
            <Frame variant="ghost" className="gap-0 p-0">
              <FramePanel fit className="rounded-xl p-0 shadow-sm">
                <form onSubmit={submitPrompt}>
                  <FieldGroup>
                    <Field>
                      <FieldLabel className="sr-only" htmlFor="homepage-prompt">
                        Ask Dacoo
                      </FieldLabel>
                      <InputGroup
                        className="rounded-xl border-0 has-disabled:opacity-100"
                        style={{ background: "var(--card)" }}
                      >
                        {attachments.length > 0 && (
                          <InputGroupAddon
                            align="block-start"
                            className="flex-wrap gap-2 px-4 pt-3"
                          >
                            {attachments.map((attachment) => {
                              const Icon =
                                attachment.kind === "image"
                                  ? ImageIcon
                                  : FileIcon
                              return (
                                <Item
                                  key={attachment.id}
                                  variant="outline"
                                  size="xs"
                                  className="w-full min-w-0 flex-nowrap sm:w-64"
                                >
                                  <Icon
                                    className="size-4 shrink-0"
                                    aria-hidden="true"
                                  />
                                  <ItemContent className="min-w-0">
                                    <ItemTitle className="block w-full truncate">
                                      {attachment.name}
                                    </ItemTitle>
                                    <ItemDescription>
                                      {formatFileSize(attachment.size)}
                                    </ItemDescription>
                                  </ItemContent>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    aria-label={`Remove ${attachment.name}`}
                                    onClick={() =>
                                      setAttachments((current) =>
                                        current.filter(
                                          (file) => file.id !== attachment.id
                                        )
                                      )
                                    }
                                  >
                                    <XIcon />
                                  </Button>
                                </Item>
                              )
                            })}
                          </InputGroupAddon>
                        )}
                        <InputGroupTextarea
                          ref={promptRef}
                          id="homepage-prompt"
                          value={prompt}
                          onChange={(event) => setPrompt(event.target.value)}
                          onKeyDown={(event) => {
                            if (
                              !event.nativeEvent.isComposing &&
                              (event.metaKey || event.ctrlKey) &&
                              event.key === "Enter"
                            ) {
                              event.preventDefault()
                              submitPrompt()
                            }
                          }}
                          placeholder="Example: Summarise my latest customer contract with James Wick…"
                          aria-describedby="home-preview-note"
                          className="max-h-64 min-h-16 overflow-y-auto px-[18px] pt-3.5 pb-2"
                        />
                        <InputGroupAddon
                          align="block-end"
                          className="flex-wrap justify-between gap-1 px-2.5 pt-1 pb-2.5"
                        >
                          <div className="flex min-w-0 flex-wrap items-center gap-1">
                            <Tooltip>
                              <TooltipTrigger
                                render={
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    aria-label="Add attachment"
                                    onClick={() =>
                                      fileInputRef.current?.click()
                                    }
                                  />
                                }
                              >
                                <PlusIcon />
                              </TooltipTrigger>
                              <TooltipContent>Add attachment</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger
                                render={
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    aria-label="Mention context"
                                    onClick={() => previewFeature("Mentions")}
                                  />
                                }
                              >
                                <AtSignIcon />
                              </TooltipTrigger>
                              <TooltipContent>
                                Mention context · Preview
                              </TooltipContent>
                            </Tooltip>
                            <Separator
                              orientation="vertical"
                              className="mx-1 h-4 data-vertical:self-center"
                            />
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={
                                  <Button type="button" variant="ghost" />
                                }
                              >
                                <SquareCodeIcon data-icon="inline-start" />
                                Skills
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start">
                                <DropdownMenuGroup>
                                  {suggestions.map((suggestion) => (
                                    <DropdownMenuItem
                                      key={suggestion.label}
                                      onClick={() =>
                                        fillPrompt(suggestion.prompt)
                                      }
                                    >
                                      {suggestion.label}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuGroup>
                              </DropdownMenuContent>
                            </DropdownMenu>
                            <Select
                              value={model}
                              onValueChange={(value) =>
                                value && setModel(value)
                              }
                            >
                              <SelectTrigger
                                aria-label="Select preview model"
                                size="sm"
                                className="max-w-44 border-0 bg-transparent px-1.5 shadow-none [&>svg:last-child]:hidden"
                              >
                                <ModelMark />
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent
                                align="start"
                                alignItemWithTrigger={false}
                              >
                                <SelectGroup>
                                  {models.map((option) => (
                                    <SelectItem key={option} value={option}>
                                      {option}
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="ml-auto flex items-center gap-1.5">
                            <Tooltip>
                              <TooltipTrigger
                                render={
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    aria-label="Voice input preview"
                                    onClick={() =>
                                      previewFeature("Voice input")
                                    }
                                  />
                                }
                              >
                                <MicIcon />
                              </TooltipTrigger>
                              <TooltipContent>
                                Voice input · Preview
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger
                                render={
                                  <Button
                                    type="submit"
                                    variant="default"
                                    aria-label="Submit prompt"
                                    disabled={!prompt.trim()}
                                  />
                                }
                              >
                                <SendHorizontalIcon />
                              </TooltipTrigger>
                              <TooltipContent>
                                Send prompt · ⌘/Ctrl + Enter
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </InputGroupAddon>
                      </InputGroup>
                    </Field>
                  </FieldGroup>
                </form>
              </FramePanel>
            </Frame>
            <div
              aria-label="Suggested prompts"
              className="flex flex-wrap justify-center gap-1.5"
            >
              {suggestions.map(({ label, icon: Icon, prompt: value }) => (
                <Button
                  key={label}
                  type="button"
                  variant="outline"
                  onClick={() => fillPrompt(value)}
                >
                  <Icon aria-hidden="true" />
                  {label}
                </Button>
              ))}
            </div>
            <p id="home-preview-note" className="sr-only">
              Design preview. AI chat isn’t connected; drafts and attachments
              stay on this page. Previous chats are examples.
            </p>
          </div>
        </section>

        <section
          aria-labelledby="example-chats-heading"
          className="flex shrink-0 flex-col gap-3 px-4 pb-8 sm:px-8"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h2 id="example-chats-heading" className="text-sm font-normal">
                Previous chats
              </h2>
              <Badge
                variant="outline"
                className="h-4 px-1.5 text-[10px] text-muted-foreground"
              >
                Examples
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={() =>
                  setHistoryOffset((value) => (value + 1) % examples.length)
                }
              >
                <RefreshCwIcon data-icon="inline-start" />
                Refresh
              </Button>
              <Separator
                orientation="vertical"
                className="h-4 data-vertical:self-center"
              />
              <Button
                variant="ghost"
                aria-expanded={historyExpanded}
                onClick={() => setHistoryExpanded((value) => !value)}
              >
                <ExpandIcon data-icon="inline-start" />
                {historyExpanded ? "Collapse" : "Expand"}
              </Button>
            </div>
          </div>
          <div
            className={cn(
              "grid grid-cols-1 gap-3 sm:grid-cols-2",
              historyExpanded ? "lg:grid-cols-3" : "xl:grid-cols-5"
            )}
          >
            {visibleExamples.map((example) => (
              <Card
                key={example.title}
                size="sm"
                className="relative gap-3 rounded-lg py-3 shadow-xs ring-border"
              >
                <CardHeader className="flex min-h-3.5 flex-row items-center gap-2">
                  <MessageSquareIcon
                    className="size-3.5 text-muted-foreground"
                    aria-hidden="true"
                  />
                </CardHeader>
                <CardContent>
                  <Button
                    type="button"
                    variant="ghost"
                    className={cn(
                      "h-auto w-full min-w-0 justify-start rounded-none p-0 text-left text-xs font-normal after:absolute after:inset-0 after:rounded-lg",
                      historyExpanded ? "whitespace-normal" : "block truncate"
                    )}
                    onClick={() => fillPrompt(example.prompt)}
                  >
                    {example.title}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </Container>
  )
}
