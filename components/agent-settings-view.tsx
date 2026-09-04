"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AnimatePresence, motion } from "motion/react"
import { Streamdown } from "streamdown"
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  BotIcon,
  CheckIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  ChevronUpIcon,
  CircleDashedIcon,
  CopyIcon,
  MessageSquareIcon,
  Maximize2Icon,
  MoreHorizontalIcon,
  PanelLeftIcon,
  PencilIcon,
  PlusIcon,
  RefreshCwIcon,
  RotateCcwIcon,
  SearchIcon,
  SearchXIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TerminalSquareIcon,
  Trash2Icon,
  XIcon,
} from "@/components/ui/icons"
import { ApiError } from "@/lib/api"
import { cn, formatDateTime } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { useActiveOrganization } from "@/hooks/use-active-organization"
import { useIsMobile } from "@/hooks/use-mobile"
import { AgentTestChat } from "@/components/agents/agent-test-chat"
import {
  AGENT_SECTION_LABELS,
  AgentSettingsNav,
  type AgentSection,
} from "@/components/agents/agent-settings-nav"
import { AGENTS } from "@/components/rag/data"
import {
  createAgent,
  createAgentGuidance,
  deleteAgent,
  deleteAgentGuidance,
  fetchAgent,
  fetchAgentTeams,
  fetchDatasets,
  reorderAgentGuidance,
  updateAgent,
  updateAgentGuidance,
  type AgentGuidance,
  type AgentFirstMessageMode,
  type AgentSummary,
  type AgentTeamSummary,
  type AgentUpdateInput,
  type DatasetSummary,
} from "@/components/rag/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import {
  Frame,
  FrameDescription,
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  AvatarGroup,
  AvatarGroupCount,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  useTable,
  type ColumnDef,
  type RowSelectionState,
} from "@tanstack/react-table"
import {
  DataGrid,
  dataGridFeatures,
  type DataGridFeatures,
} from "@/components/reui/data-grid/data-grid"
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table"
import { buildDatasetColumns } from "@/components/rag/datasets-table-columns"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

type Tone = AgentSummary["persona"]["tone"]
type Language = AgentSummary["persona"]["language"]

const FIRST_MESSAGE_MODE_LABELS: Record<AgentFirstMessageMode, string> = {
  "assistant-speaks-first": "Assistant speaks first",
  "assistant-waits-for-user": "Assistant waits for user",
  "assistant-speaks-first-with-model-generated-message":
    "Assistant speaks first with model-generated message",
}

/**
 * Reading-column cap for the settings content, applied inside each scroller
 * rather than on the scroller itself — capping the scroller would pull its
 * scrollbar in off the panel edge.
 *
 * No container query needed: `max-width` is already inert below its own value.
 * With the test chat open the panel sits near 43rem, so the cap never engages
 * and the cards stay full-bleed; it only takes hold once the chat closes and
 * the panel passes 56rem. Dragging the resize handle across that boundary
 * therefore works for free.
 *
 * `mx-auto` is load-bearing, not cosmetic. Commit a403746 removed three
 * `max-w-4xl` wrappers from this file precisely because, left-aligned, they
 * stranded every spare pixel on the right and read as a bug. Centered, the same
 * 56rem reads as a deliberate column. Keep `w-full` so it still fills the panel
 * below the cap.
 */
const SETTINGS_CONTENT_WIDTH = "mx-auto w-full max-w-4xl"
const OVERVIEW_CONTENT_WIDTH = "mx-auto w-full max-w-7xl"

/**
 * Page size for the sources table, chosen to make pagination a no-op.
 *
 * Pagination ships in the shared data-grid feature bundle and the table body
 * renders the paginated row model, so a grid with no pager still paginates —
 * silently, at ten rows. An org's collections are meant to be listed in full,
 * hence a ceiling no workspace will reach. (`records-list-view.tsx` carries
 * the same constant for the same reason; it is module-private there, and one
 * number is not worth a shared module.)
 */
const ALL_ROWS = 100000

/**
 * The unsaved edits behind Persona, Messages and Answer sources.
 *
 * One object rather than three per-card `useState` blocks, because all three
 * cards write to the same `updateAgent` PUT — holding the values together is
 * what lets the toolbar's Save changes button send them in a single request.
 */
type AgentDraft = {
  name: string
  identity: string
  tone: Tone
  language: Language
  teamId: string
  firstMessageMode: AgentFirstMessageMode
  greeting: string
  fallback: string
  datasetIds: string[]
  status: AgentSummary["status"]
}

const DEFAULT_NEW_AGENT: AgentSummary = {
  id: "new",
  name: "New Agent",
  label: "New Agent",
  description: "AI Agent optimized for customer support.",
  system:
    "You are a friendly customer support agent. Use the context below to answer the user's question clearly and empathetically. If you cannot resolve it, suggest escalating to a human agent.",
  isPrimary: false,
  persona: {
    identity:
      "You are a friendly customer support agent. Use the context below to answer the user's question clearly and empathetically. If you cannot resolve it, suggest escalating to a human agent.",
    tone: "friendly",
    language: "match_customer",
  },
  messages: {
    firstMessageMode: "assistant-speaks-first",
    greeting: "Hi! How can I help you today?",
    fallback:
      "I'm sorry, I don't have enough information to answer that question. Let me connect you with a team member.",
  },
  activeGuidanceCount: 0,
  guidance: [],
  status: "draft",
  messageCount: 0,
  datasetIds: [],
  agentTeamId: null,
  createdAt: new Date().toISOString(),
}

function toDraft(agent: AgentSummary): AgentDraft {
  return {
    name: agent.name,
    identity: agent.system || agent.persona?.identity || "",
    tone: agent.persona.tone,
    language: agent.persona.language,
    teamId: agent.agentTeamId ?? NO_TEAM,
    firstMessageMode:
      agent.messages.firstMessageMode ?? "assistant-speaks-first",
    greeting: agent.messages.greeting,
    fallback: agent.messages.fallback,
    datasetIds: agent.datasetIds ?? agent.datasets?.map((d) => d.id) ?? [],
    status: agent.status,
  }
}

/** Selecting the same collections in a different order is not a change. */
function sameIds(a: string[], b: string[]) {
  if (a.length !== b.length) return false
  const left = [...a].sort()
  const right = [...b].sort()
  return left.every((id, index) => id === right[index])
}

/**
 * Dirty check for the toolbar's unsaved group, comparing values rather than
 * tracking edits (the same shape as `profile-view.tsx`).
 *
 * The text fields are compared trimmed because they are also saved trimmed. If
 * they were not, adding a trailing space would raise the unsaved group while
 * producing an empty request body — the group would then never clear.
 */
function draftEquals(a: AgentDraft, b: AgentDraft) {
  return (
    a.name.trim() === b.name.trim() &&
    a.identity.trim() === b.identity.trim() &&
    a.tone === b.tone &&
    a.language === b.language &&
    a.teamId === b.teamId &&
    a.firstMessageMode === b.firstMessageMode &&
    a.greeting.trim() === b.greeting.trim() &&
    a.fallback.trim() === b.fallback.trim() &&
    a.status === b.status &&
    sameIds(a.datasetIds, b.datasetIds)
  )
}

/**
 * Request body for the toolbar save: only the fields that actually changed.
 *
 * The endpoint takes a `Partial<>`, so sending everything would work — but it
 * would also let a value this tab read minutes ago overwrite a newer one
 * written elsewhere. Guarded by `draftEquals` above, this can never be empty
 * while the unsaved group is showing.
 */
function buildAgentUpdate(
  draft: AgentDraft,
  saved: AgentDraft
): AgentUpdateInput {
  const input: AgentUpdateInput = {}
  if (draft.name.trim() !== saved.name.trim()) input.name = draft.name.trim()
  if (draft.identity.trim() !== saved.identity.trim()) {
    input.system = draft.identity.trim()
  }
  if (draft.tone !== saved.tone) input.tone = draft.tone
  if (draft.language !== saved.language) input.language = draft.language
  if (draft.teamId !== saved.teamId) {
    input.agent_team_id = draft.teamId === NO_TEAM ? null : draft.teamId
  }
  if (draft.firstMessageMode !== saved.firstMessageMode) {
    input.first_message_mode = draft.firstMessageMode
  }
  if (draft.greeting.trim() !== saved.greeting.trim()) {
    input.greeting = draft.greeting.trim()
  }
  if (draft.fallback.trim() !== saved.fallback.trim()) {
    input.fallback_message = draft.fallback.trim()
  }
  if (draft.status !== saved.status) {
    input.status = draft.status
  }
  if (!sameIds(draft.datasetIds, saved.datasetIds)) {
    input.dataset_ids = draft.datasetIds
  }
  return input
}

type LoadError = "notfound" | "failed"

function toLoadError(error: unknown): LoadError {
  return error instanceof ApiError && error.status === 404
    ? "notfound"
    : "failed"
}

export function AgentSettingsView({
  agentId,
  initialDatasetId,
}: {
  agentId: string
  initialDatasetId?: string | null
}) {
  const isNew = agentId === "new"
  const [selectedTemplateId, setSelectedTemplateId] = React.useState<string | null>("support")
  const [templateModalOpen, setTemplateModalOpen] = React.useState(isNew)
  const organization = useActiveOrganization()
  const { isLoading: authLoading } = useAuth()
  const [agent, setAgent] = React.useState<AgentSummary | null>(null)
  const [datasets, setDatasets] = React.useState<DatasetSummary[]>([])
  // Loaded on its own rather than joined to the agent/dataset Promise.all —
  // teams only feed one Select, so a failure here shouldn't blank the page.
  const [teams, setTeams] = React.useState<AgentTeamSummary[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<LoadError | null>(null)
  const [guidanceEditor, setGuidanceEditor] = React.useState<
    AgentGuidance | "new" | null
  >(null)
  const [section, setSection] = React.useState<AgentSection>("overview")
  const [navOpen, setNavOpen] = React.useState(false)
  const isMobile = useIsMobile()
  const [isChatOpen, setIsChatOpen] = React.useState(false)
  const [draft, setDraft] = React.useState<AgentDraft | null>(null)
  const [savingDraft, setSavingDraft] = React.useState(false)
  const [isChatSheetOpen, setIsChatSheetOpen] = React.useState(false)

  // Deliberately does not touch `loading`: guidance mutations call this to
  // refresh in the background, and flipping the page back to the skeleton would
  // unmount the other cards and throw away whatever the user had typed there.
  const reload = React.useCallback(async () => {
    if (!organization) return
    if (isNew) {
      try {
        const [nextDatasets, nextTeams] = await Promise.all([
          fetchDatasets(organization.id),
          fetchAgentTeams(organization.id),
        ])
        setDatasets(nextDatasets)
        setTeams(nextTeams)
        setError(null)
      } catch (cause) {
        setError(toLoadError(cause))
      }
      return
    }
    try {
      const [nextAgent, nextDatasets] = await Promise.all([
        fetchAgent(organization.id, agentId),
        fetchDatasets(organization.id),
      ])
      setAgent(nextAgent)
      setDatasets(nextDatasets)
      setError(null)
    } catch (cause) {
      // Only surface a full-page error when there's nothing on screen to keep.
      setError((current) => (agent ? current : toLoadError(cause)))
      toast.error("Couldn’t load this agent")
    }
  }, [agent, agentId, isNew, organization])

  React.useEffect(() => {
    if (!organization) {
      // Auth still hydrating → keep the skeleton. Resolved with no org → this
      // page has nothing to fetch, so land on a real state instead of spinning.
      if (!authLoading) {
        setLoading(false)
        setError("failed")
      }
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    if (isNew) {
      void Promise.all([
        fetchDatasets(organization.id),
        fetchAgentTeams(organization.id),
      ])
        .then(([nextDatasets, nextTeams]) => {
          if (cancelled) return
          setDatasets(nextDatasets)
          setTeams(nextTeams)

          const preselected =
            initialDatasetId && nextDatasets.find((d) => d.id === initialDatasetId)
          const tmpl = AGENTS.find((a) => a.id === "support") ?? AGENTS[0]
          const initName = preselected
            ? `${preselected.name} Assistant`
            : tmpl.label
          const initDesc = preselected
            ? `AI Agent optimized for ${preselected.name} using the ${tmpl.label.toLowerCase()} template.`
            : tmpl.description
          const initPrompt = preselected
            ? `${tmpl.system}\n\nInstructions:\n- Answer queries strictly using the retrieved context from the dataset: "${preselected.name}".\n- Be factual and do not make up facts outside the provided knowledge.`
            : tmpl.system

          const initialAgent: AgentSummary = {
            ...DEFAULT_NEW_AGENT,
            name: initName,
            label: initName,
            description: initDesc,
            system: initPrompt,
            datasetIds: initialDatasetId ? [initialDatasetId] : [],
          }
          setAgent(initialAgent)
          setDraft(toDraft(initialAgent))
        })
        .catch((cause) => {
          if (cancelled) return
          setError(toLoadError(cause))
          toast.error("Couldn’t load setup data")
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
      return () => {
        cancelled = true
      }
    }

    void Promise.all([
      fetchAgent(organization.id, agentId),
      fetchDatasets(organization.id),
    ])
      .then(([nextAgent, nextDatasets]) => {
        if (cancelled) return
        setAgent(nextAgent)
        setDatasets(nextDatasets)
      })
      .catch((cause) => {
        if (cancelled) return
        setError(toLoadError(cause))
        toast.error("Couldn’t load this agent")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [agentId, authLoading, initialDatasetId, isNew, organization])

  React.useEffect(() => {
    if (!organization || isNew) return
    let cancelled = false
    void fetchAgentTeams(organization.id)
      .then((nextTeams) => {
        if (!cancelled) setTeams(nextTeams)
      })
      .catch(() => {
        // Non-fatal: the Team select just stays empty.
      })
    return () => {
      cancelled = true
    }
  }, [isNew, organization])

  const retry = React.useCallback(() => {
    if (!organization) return
    setLoading(true)
    setError(null)
    if (isNew) {
      void Promise.all([
        fetchDatasets(organization.id),
        fetchAgentTeams(organization.id),
      ])
        .then(([nextDatasets, nextTeams]) => {
          setDatasets(nextDatasets)
          setTeams(nextTeams)
        })
        .catch((cause) => setError(toLoadError(cause)))
        .finally(() => setLoading(false))
      return
    }
    void Promise.all([
      fetchAgent(organization.id, agentId),
      fetchDatasets(organization.id),
    ])
      .then(([nextAgent, nextDatasets]) => {
        setAgent(nextAgent)
        setDatasets(nextDatasets)
      })
      .catch((cause) => setError(toLoadError(cause)))
      .finally(() => setLoading(false))
  }, [agentId, isNew, organization])

  const router = useRouter()
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false)

  const handleSelectTemplate = React.useCallback(
    (tmpl: (typeof AGENTS)[number] | "blank") => {
      if (tmpl === "blank") {
        setSelectedTemplateId(null)
        setDraft((current) =>
          current
            ? {
                ...current,
                name: "",
                identity: "",
                tone: "friendly",
              }
            : current
        )
        setAgent((current) =>
          current
            ? {
                ...current,
                name: "",
                label: "",
                description: "",
                system: "",
                persona: {
                  ...current.persona,
                  tone: "friendly",
                },
              }
            : current
        )
        setTemplateModalOpen(false)
        toast.success("Blank agent initialized", {
          description: "Started with a clean workspace to build custom instructions.",
        })
        return
      }

      setSelectedTemplateId(tmpl.id)
      const currentDatasetId = draft?.datasetIds?.[0] ?? (initialDatasetId || null)
      const ds = currentDatasetId
        ? datasets.find((d) => d.id === currentDatasetId)
        : null

      const suffix = tmpl.id === "default" ? "Assistant" : tmpl.label
      const newName = ds ? `${ds.name} ${suffix}` : tmpl.label
      const newDesc = ds
        ? `AI Agent optimized for ${ds.name} using the ${tmpl.label.toLowerCase()} template.`
        : tmpl.description
      const newPrompt = ds
        ? `${tmpl.system}\n\nInstructions:\n- Answer queries strictly using the retrieved context from the dataset: "${ds.name}".\n- Be factual and do not make up facts outside the provided knowledge.`
        : tmpl.system

      let newTone: Tone = "friendly"
      if (tmpl.id === "analyst" || tmpl.id === "compliance") newTone = "professional"
      else if (tmpl.id === "concise") newTone = "concise"
      else if (tmpl.id === "support") newTone = "friendly"

      setDraft((current) =>
        current
          ? {
              ...current,
              name: newName,
              identity: newPrompt,
              tone: newTone,
            }
          : current
      )
      setAgent((current) =>
        current
          ? {
              ...current,
              name: newName,
              label: newName,
              description: newDesc,
              system: newPrompt,
              persona: {
                ...current.persona,
                tone: newTone,
              },
            }
          : current
      )
      setTemplateModalOpen(false)
      toast.success(`${tmpl.label} template applied`, {
        description: "Configured persona, system prompt, and guidelines.",
      })
    },
    [datasets, draft?.datasetIds, initialDatasetId]
  )

  async function handleCreateAgent() {
    if (!organization || !activeDraft) return
    const name = activeDraft.name.trim()
    const system = activeDraft.identity.trim()
    if (!name) {
      toast.error("Agent name is required")
      return
    }
    if (!system) {
      toast.error("System prompt is required")
      return
    }

    setSavingDraft(true)
    try {
      const created = await createAgent(organization.id, {
        name,
        description: agent?.description || "",
        system,
        status: activeDraft.status,
        tone: activeDraft.tone,
        language: activeDraft.language,
        first_message_mode: activeDraft.firstMessageMode,
        greeting: activeDraft.greeting,
        fallback_message: activeDraft.fallback,
        dataset_ids: activeDraft.datasetIds,
        agent_team_id:
          activeDraft.teamId === NO_TEAM ? null : activeDraft.teamId,
      })

      toast.success("Agent created successfully")
      router.replace(`/agents/${created.id}`)
    } catch {
      toast.error("Couldn’t create agent")
    } finally {
      setSavingDraft(false)
    }
  }

  async function handleDeleteAgent() {
    if (!organization || !agent) return
    try {
      await deleteAgent(organization.id, agent.id)
      toast.success("Agent deleted")
      router.push("/agents")
    } catch {
      toast.error("Couldn’t delete agent")
    }
  }

  async function patchAgent(
    input: Parameters<typeof updateAgent>[2],
    success: string
  ) {
    if (!organization || !agent) return
    try {
      const updated = await updateAgent(organization.id, agent.id, input)
      setAgent(updated)
      toast.success(success)
    } catch {
      toast.error("Couldn’t save agent settings")
    }
  }

  const savedDraft = React.useMemo(
    () => (agent && !isNew ? toDraft(agent) : null),
    [agent, isNew]
  )

  /**
   * Re-seed the draft whenever the *saved values* change.
   *
   * Keyed on a serialization rather than on `agent` itself: guidance mutations
   * call `setAgent`/`reload()` on every toggle, reorder and delete, and none of
   * them touch a field the draft owns. Depending on the object identity would
   * wipe whatever the user had typed in Persona each time they flipped a
   * guidance switch. Depending on the values means those refreshes are inert,
   * while a real save still resyncs and clears the unsaved group.
   */
  const savedSignature = savedDraft ? JSON.stringify(savedDraft) : null
  React.useEffect(() => {
    if (isNew) return
    setDraft(savedSignature ? (JSON.parse(savedSignature) as AgentDraft) : null)
  }, [isNew, savedSignature])

  const updateDraft = React.useCallback((patch: Partial<AgentDraft>) => {
    setDraft((current) => (current ? { ...current, ...patch } : current))
  }, [])

  async function handleToggleGuidance(rule: AgentGuidance, active: boolean) {
    if (!organization || !agent) return
    const updated = await updateAgentGuidance(
      organization.id,
      agent.id,
      rule.id,
      { is_active: active }
    )
    setAgent((current) =>
      current
        ? {
            ...current,
            guidance: current.guidance.map((item) =>
              item.id === updated.id ? updated : item
            ),
            activeGuidanceCount:
              current.activeGuidanceCount + (active ? 1 : -1),
          }
        : current
    )
  }

  async function handleDeleteGuidance(rule: AgentGuidance) {
    if (!organization || !agent) return
    await deleteAgentGuidance(organization.id, agent.id, rule.id)
    await reload()
    toast.success("Guidance deleted")
  }

  async function handleMoveGuidance(index: number, offset: number) {
    if (!organization || !agent) return
    const reordered = [...agent.guidance]
    const target = index + offset
    if (target < 0 || target >= reordered.length) return
    ;[reordered[index], reordered[target]] = [
      reordered[target],
      reordered[index],
    ]
    setAgent({ ...agent, guidance: reordered })
    const saved = await reorderAgentGuidance(
      organization.id,
      agent.id,
      reordered.map((item) => item.id)
    )
    setAgent((current) =>
      current ? { ...current, guidance: saved } : current
    )
  }

  if (loading) return <AgentSettingsSkeleton />

  if (!agent) {
    return <AgentSettingsError kind={error ?? "failed"} onRetry={retry} />
  }

  /*
   * The effect above populates `draft` one commit after `agent` arrives, so
   * fall back to the saved values for that single render. Without this the
   * cards would flash empty on load.
   */
  const activeDraft = draft ?? toDraft(agent)
  const savedValues = savedDraft ?? activeDraft

  const isDirty = !isNew && !draftEquals(activeDraft, savedValues)
  // Required fields, mirroring the guards the per-card Save buttons carried.
  const canSaveDraft =
    isDirty &&
    Boolean(
      activeDraft.name.trim() &&
        activeDraft.identity.trim() &&
        activeDraft.greeting.trim() &&
        activeDraft.fallback.trim()
    )

  async function handleSaveDraft() {
    if (!savedDraft) return
    const input = buildAgentUpdate(activeDraft, savedDraft)
    if (Object.keys(input).length === 0) return
    setSavingDraft(true)
    // `patchAgent` already calls `setAgent`, which resyncs the draft and so
    // clears the toolbar's unsaved group; it also swallows its own errors,
    // which is why this needs no catch of its own.
    await patchAgent(input, "Agent settings saved")
    setSavingDraft(false)
  }

  function handleDiscardDraft() {
    if (savedDraft) setDraft({ ...savedDraft })
  }

  const description =
    agent.description || "Configure how this agent speaks and answers."

  const guidanceCount = agent.guidance?.length ?? 0
  const sourceCount = activeDraft.datasetIds?.length ?? agent.datasetIds?.length ?? 0
  const testChatAgent: AgentSummary = {
    ...agent,
    name: activeDraft.name || "New Agent",
    system: activeDraft.identity,
    datasetIds: activeDraft.datasetIds,
    status: activeDraft.status,
    persona: {
      ...agent.persona,
      identity: activeDraft.identity,
      tone: activeDraft.tone,
      language: activeDraft.language,
    },
    messages: {
      firstMessageMode: activeDraft.firstMessageMode,
      greeting: activeDraft.greeting,
      fallback: activeDraft.fallback,
    },
  }

  const sectionContent =
    section === "overview" ? (
      <div className="flex flex-col gap-6">
        <OverviewCard
          agent={
            isNew
              ? {
                  ...agent,
                  name: activeDraft.name,
                  system: activeDraft.identity,
                  status: activeDraft.status,
                  persona: {
                    ...agent.persona,
                    tone: activeDraft.tone,
                    language: activeDraft.language,
                  },
                }
              : agent
          }
          draft={activeDraft}
          isNew={isNew}
          selectedTemplateId={selectedTemplateId}
          onOpenTemplateModal={() => setTemplateModalOpen(true)}
          onPromptChange={(identity) => updateDraft({ identity })}
        />
      </div>
    ) : section === "all" ? (
      <div className="flex flex-col gap-6">
        <PersonaCard
          draft={activeDraft}
          teams={teams}
          onChange={updateDraft}
        />
        <MessagesCard draft={activeDraft} onChange={updateDraft} />
        <GuidanceCard
          guidance={agent.guidance}
          isNew={isNew}
          onAdd={() => (isNew ? void handleCreateAgent() : setGuidanceEditor("new"))}
          onEdit={setGuidanceEditor}
          onToggle={handleToggleGuidance}
          onDelete={handleDeleteGuidance}
          onMove={handleMoveGuidance}
        />
        <SourcesCard
          datasets={datasets}
          selected={activeDraft.datasetIds}
          onChange={(datasetIds) => updateDraft({ datasetIds })}
        />
      </div>
    ) : section === "persona" ? (
      <PersonaCard
        draft={activeDraft}
        teams={teams}
        onChange={updateDraft}
      />
    ) : section === "messages" ? (
      <MessagesCard draft={activeDraft} onChange={updateDraft} />
    ) : section === "guidance" ? (
      <GuidanceCard
        guidance={agent.guidance}
        isNew={isNew}
        onAdd={() => (isNew ? void handleCreateAgent() : setGuidanceEditor("new"))}
        onEdit={setGuidanceEditor}
        onToggle={handleToggleGuidance}
        onDelete={handleDeleteGuidance}
        onMove={handleMoveGuidance}
      />
    ) : (
      <SourcesCard
        datasets={datasets}
        selected={activeDraft.datasetIds}
        onChange={(datasetIds) => updateDraft({ datasetIds })}
      />
    )

  const contentWidth =
    section === "overview" ? OVERVIEW_CONTENT_WIDTH : SETTINGS_CONTENT_WIDTH

  const mobileSettingsContent = (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="shrink-0 border-b border-border bg-background px-4 py-2">
        <Sheet open={navOpen} onOpenChange={setNavOpen}>
          <SheetTrigger render={<Button variant="outline" size="sm" />}>
            <PanelLeftIcon data-icon="inline-start" />
            {AGENT_SECTION_LABELS[section]}
          </SheetTrigger>
          <SheetContent
            side="left"
            onPointerDownOutside={(e) => {
              const target = e.target as HTMLElement | null
              const isOverlay =
                target?.getAttribute?.("data-slot") === "sheet-overlay" ||
                target?.classList?.contains("bg-black/30")
              if (!isOverlay) {
                e.preventDefault()
              }
            }}
            onInteractOutside={(e) => {
              const target = e.target as HTMLElement | null
              const isOverlay =
                target?.getAttribute?.("data-slot") === "sheet-overlay" ||
                target?.classList?.contains("bg-black/30")
              if (!isOverlay) {
                e.preventDefault()
              }
            }}
          >
            <SheetHeader>
              <SheetTitle>Agent settings</SheetTitle>
              <SheetDescription>
                Choose a section to configure this agent.
              </SheetDescription>
            </SheetHeader>
            <AgentSettingsNav
              section={section}
              onSectionChange={(next) => {
                setSection(next)
                setNavOpen(false)
              }}
              guidanceCount={guidanceCount}
              sourceCount={sourceCount}
              className="px-4 pb-6"
            />
          </SheetContent>
        </Sheet>
      </div>

      {/* Scrollable Content */}
      <div className="scrollbar-thin @container/settings flex min-h-0 min-w-0 flex-1 flex-col gap-6 overflow-y-auto p-4 lg:p-6">
        <div className={contentWidth}>{sectionContent}</div>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background text-foreground">
      {/* Top Toolbar - edge-to-edge header */}
      <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border bg-background px-2 lg:px-4">
        {/* Left: Back Arrow + Breadcrumb/Title & Subtitle */}
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon-sm"
            nativeButton={false}
            render={<Link href="/agents" />}
            className="shrink-0"
          >
            <ArrowLeftIcon className="size-4" />
            <span className="sr-only">Back to agents</span>
          </Button>
          <div className="flex flex-col gap-0.5 min-w-0">
            <div className="flex items-center gap-2 min-w-0 whitespace-nowrap">
              <div className="flex items-center gap-1.5 min-w-0 text-sm">
                <Link
                  href="/agents"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Agents
                </Link>
                <span className="text-muted-foreground/60">/</span>
                <span className="font-semibold text-foreground truncate">
                  {isNew
                    ? (activeDraft.name || "New Agent")
                    : (activeDraft.name || agent.name)}
                </span>
              </div>
              {!isNew && (
                <AgentStatusBadge status={activeDraft.status ?? agent.status} />
              )}
              {!isNew && agent.isPrimary && (
                <Badge className="h-5 shrink-0 gap-1 bg-primary px-1.5 text-[11px] font-medium text-primary-foreground">
                  <SparklesIcon className="size-3" />
                  Primary
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate whitespace-nowrap">
              {isNew
                ? "Configure instructions, knowledge sources, and persona for this new agent."
                : description}
            </p>
          </div>
        </div>

        {/* Right: Unsaved changes / Create CTA + Actions + Menu */}
        <div className="flex items-center gap-2.5 shrink-0 whitespace-nowrap">
          {isNew ? (
            <Button
              size="sm"
              onClick={() => void handleCreateAgent()}
              disabled={
                savingDraft ||
                !activeDraft.name.trim() ||
                !activeDraft.identity.trim()
              }
            >
              {savingDraft ? (
                <Spinner />
              ) : (
                <PlusIcon className="size-3.5" />
              )}
              Create agent
            </Button>
          ) : (
            <AnimatePresence>
              {isDirty ? (
                <motion.div
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ type: "spring", stiffness: 380, damping: 26 }}
                  className="flex items-center gap-2"
                >
                  <span className="hidden items-center gap-2 text-xs font-semibold text-muted-foreground sm:flex">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
                    </span>
                    Unsaved
                  </span>
                  <Button
                    size="sm"
                    onClick={() => void handleSaveDraft()}
                    disabled={!canSaveDraft || savingDraft}
                  >
                    {savingDraft ? (
                      <Spinner />
                    ) : (
                      <CheckCircle2Icon className="size-3.5" />
                    )}
                    Save changes
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleDiscardDraft}
                    disabled={savingDraft}
                    className="hidden text-destructive hover:bg-destructive/10 hover:text-destructive sm:inline-flex"
                  >
                    <RotateCcwIcon className="size-3.5" />
                    Discard
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={handleDiscardDraft}
                    disabled={savingDraft}
                    aria-label="Discard changes"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive sm:hidden"
                  >
                    <RotateCcwIcon className="size-3.5" />
                  </Button>
                  <Separator
                    orientation="vertical"
                    className="data-vertical:h-5 data-vertical:self-auto mx-1"
                  />
                </motion.div>
              ) : null}
            </AnimatePresence>
          )}

          {!isNew && (
            <>
              <AvatarGroup className="hidden sm:flex">
                <Avatar size="sm">
                  <AvatarImage
                    src="https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=96&h=96&dpr=2&q=80"
                    alt="Sarah Chen"
                  />
                  <AvatarFallback className="text-[10px]">SC</AvatarFallback>
                </Avatar>
                <Avatar size="sm">
                  <AvatarImage
                    src="https://images.unsplash.com/photo-1584308972272-9e4e7685e80f?w=96&h=96&dpr=2&q=80"
                    alt="Michael Rodriguez"
                  />
                  <AvatarFallback className="text-[10px]">MR</AvatarFallback>
                </Avatar>
                <Avatar size="sm">
                  <AvatarImage
                    src="https://images.unsplash.com/photo-1485893086445-ed75865251e0?w=96&h=96&dpr=2&q=80"
                    alt="Emma Wilson"
                  />
                  <AvatarFallback className="text-[10px]">EW</AvatarFallback>
                </Avatar>
                <AvatarGroupCount className="text-xs">+3</AvatarGroupCount>
              </AvatarGroup>

              <Separator
                orientation="vertical"
                className="hidden sm:block data-vertical:h-5 data-vertical:self-auto mx-1"
              />

            </>
          )}

          <TooltipProvider>
            {!isNew && !agent.isPrimary ? (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Make primary"
                      onClick={() =>
                        void patchAgent(
                          { is_primary: true },
                          "Primary agent updated"
                        )
                      }
                    />
                  }
                >
                  <SparklesIcon className="size-4" />
                </TooltipTrigger>
                <TooltipContent>Make primary</TooltipContent>
              </Tooltip>
            ) : null}

            {!isNew ? (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      nativeButton={false}
                      render={
                        <Link href={`/playground?agentId=${agent.id}`} />
                      }
                      aria-label="Open playground"
                    />
                  }
                >
                  <TerminalSquareIcon className="size-4" />
                </TooltipTrigger>
                <TooltipContent>Playground</TooltipContent>
              </Tooltip>
            ) : null}

            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    aria-label="Toggle test chat"
                    aria-pressed={isMobile ? isChatSheetOpen : isChatOpen}
                    className="aria-pressed:bg-muted"
                    onClick={() =>
                      isMobile
                        ? setIsChatSheetOpen((open) => !open)
                        : setIsChatOpen((open) => !open)
                    }
                  />
                }
              >
                <MessageSquareIcon className="size-4" />
              </TooltipTrigger>
              <TooltipContent>Test chat</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {!isNew && (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="More options"
                    className="text-muted-foreground hover:text-foreground"
                  />
                }
              >
                <MoreHorizontalIcon className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-44">
                <DropdownMenuItem
                  onClick={() => {
                    navigator.clipboard.writeText(agent.id)
                    toast.success("Agent ID copied to clipboard")
                  }}
                >
                  <CopyIcon className="size-4" />
                  Copy Agent ID
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/agents" />}>
                  <BotIcon className="size-4" />
                  All Agents
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setDeleteConfirmOpen(true)}
                >
                  <Trash2Icon className="size-4" />
                  Delete Agent
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      {/* Settings + test chat split */}
      {isMobile ? (
        <>
          {mobileSettingsContent}
          {isChatSheetOpen ? (
            <AgentTestChat
              agent={testChatAgent}
              isMobile
              openMobile={isChatSheetOpen}
              onOpenMobileChange={setIsChatSheetOpen}
              onClose={() => setIsChatSheetOpen(false)}
            />
          ) : null}
        </>
      ) : (
        <ResizablePanelGroup
          key={isChatOpen ? "chat-open" : "chat-closed"}
          className="min-h-0 flex-1 overflow-hidden"
        >
          <ResizablePanel
            id="agent-settings-nav-panel"
            defaultSize="18%"
            minSize="14%"
            maxSize="26%"
            className="min-w-0"
          >
            <aside className="flex h-full flex-col bg-sidebar">
              <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto p-3">
                <AgentSettingsNav
                  section={section}
                  onSectionChange={setSection}
                  guidanceCount={guidanceCount}
                  sourceCount={sourceCount}
                />
              </div>
            </aside>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel
            id="agent-settings-content-panel"
            defaultSize={isChatOpen ? "52%" : "82%"}
            minSize="35%"
            className="min-h-0 min-w-0"
          >
            {/* Scrollable Content */}
            <div className="scrollbar-thin @container/settings flex h-full min-h-0 min-w-0 flex-col gap-6 overflow-y-auto p-4 lg:p-6">
              <div className={contentWidth}>{sectionContent}</div>
            </div>
          </ResizablePanel>
          {isChatOpen ? (
            <>
              <ResizableHandle withHandle />
              <AgentTestChat
                agent={testChatAgent}
                onClose={() => setIsChatOpen(false)}
              />
            </>
          ) : null}
        </ResizablePanelGroup>
      )}

      <GuidanceDialog
        key={
          guidanceEditor === "new" ? "new" : (guidanceEditor?.id ?? "closed")
        }
        value={guidanceEditor}
        onOpenChange={(open) => !open && setGuidanceEditor(null)}
        onSave={async (input) => {
          if (!organization || !guidanceEditor) return
          if (guidanceEditor === "new") {
            await createAgentGuidance(organization.id, agent.id, input)
          } else {
            await updateAgentGuidance(
              organization.id,
              agent.id,
              guidanceEditor.id,
              input
            )
          }
          setGuidanceEditor(null)
          await reload()
          toast.success("Guidance saved")
        }}
      />

      <DeleteConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        agentName={agent.name}
        onConfirm={handleDeleteAgent}
      />

      {isNew && (
        <AgentTemplateModal
          open={templateModalOpen}
          onOpenChange={setTemplateModalOpen}
          activeTemplateId={selectedTemplateId}
          onApplyTemplate={handleSelectTemplate}
        />
      )}
    </div>
  )
}

function AgentSettingsSkeleton() {
  const isMobile = useIsMobile()
  // Same cap as the loaded page, so content does not visibly snap to 56rem
  // when the skeleton hands off.
  const skeletonCards = (
    <div className={cn("flex flex-col gap-6", SETTINGS_CONTENT_WIDTH)}>
      {[0, 1, 2, 3].map((index) => (
        <div
          key={index}
          className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6"
        >
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-24 self-end" />
        </div>
      ))}
    </div>
  )

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background text-foreground">
      <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border bg-background px-2 lg:px-4">
        <div className="flex items-center gap-3">
          <Skeleton className="size-8 shrink-0 rounded-md" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3.5 w-64" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-8 w-36 rounded-md" />
        </div>
      </header>

      {isMobile ? (
        <>
          <div className="shrink-0 border-b border-border bg-background px-4 py-2">
            <Skeleton className="h-8 w-44 rounded-md" />
          </div>

          <div className="scrollbar-thin flex min-h-0 min-w-0 flex-1 flex-col gap-6 overflow-y-auto p-4 lg:p-6">
            {skeletonCards}
          </div>
        </>
      ) : (
        <div className="flex min-h-0 min-w-0 flex-1">
          <aside className="flex w-48 shrink-0 flex-col border-r border-border bg-sidebar py-4 pl-4 pr-3 lg:pl-6">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-9 w-full rounded-md" />
              <Skeleton className="h-9 w-full rounded-md" />
              <Skeleton className="h-9 w-full rounded-md" />
              <Skeleton className="h-9 w-full rounded-md" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
          </aside>

          <div className="scrollbar-thin flex min-h-0 min-w-0 flex-1 flex-col gap-6 overflow-y-auto p-4 lg:p-6">
            {skeletonCards}
          </div>
        </div>
      )}
    </div>
  )
}

function AgentSettingsError({
  kind,
  onRetry,
}: {
  kind: LoadError
  onRetry: () => void
}) {
  const notFound = kind === "notfound"
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background text-foreground">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col px-4 py-6 lg:px-6">
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              {notFound ? <SearchXIcon /> : <AlertTriangleIcon />}
            </EmptyMedia>
            <EmptyTitle>
              {notFound ? "Agent not found" : "Couldn’t load this agent"}
            </EmptyTitle>
            <EmptyDescription>
              {notFound
                ? "This agent may have been deleted, or the link is wrong."
                : "Something went wrong while loading the settings. Check your connection and try again."}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button
                variant="outline"
                nativeButton={false}
                render={<Link href="/agents" />}
              >
                <ArrowLeftIcon /> Back to agents
              </Button>
              {notFound ? null : (
                <Button onClick={onRetry}>
                  <RefreshCwIcon /> Try again
                </Button>
              )}
            </div>
          </EmptyContent>
        </Empty>
      </div>
    </div>
  )
}

/** The Select cannot hold "" as a value, so "no team" needs a real sentinel. */
const NO_TEAM = "__none__"

const LANGUAGE_LABELS: Record<Language, string> = {
  match_customer: "Match customer",
  english: "English",
  burmese: "Burmese",
}

const TONE_LABELS: Record<string, string> = {
  friendly: "Friendly",
  professional: "Professional",
  concise: "Concise",
  empathetic: "Empathetic",
  casual: "Casual",
}

function AgentStatusBadge({ status }: { status: AgentSummary["status"] }) {
  if (status === "active") {
    return (
      <Badge
        variant="outline"
        className="h-5 shrink-0 gap-1 border-emerald-500/30 bg-emerald-500/10 px-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400"
      >
        <CheckCircle2Icon className="size-3" />
        Active
      </Badge>
    )
  }
  if (status === "draft") {
    return (
      <Badge
        variant="outline"
        className="h-5 shrink-0 gap-1 border-amber-500/30 bg-amber-500/10 px-1.5 text-[11px] font-medium text-amber-600 dark:text-amber-400"
      >
        <CircleDashedIcon className="size-3" />
        Draft
      </Badge>
    )
  }
  return (
    <Badge
      variant="secondary"
      className="h-5 shrink-0 gap-1 px-1.5 text-[11px] font-medium"
    >
      <XIcon className="size-3" />
      Inactive
    </Badge>
  )
}

/** Label/value row for the overview meta table. */
function MetaRow({
  label,
  children,
  capitalize,
}: {
  label: string
  children: React.ReactNode
  capitalize?: boolean
}) {
  return (
    <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
      {/* Narrow label column: the table lives in an 18rem sidebar, so pinning
          it wider would wrap values like "Match customer". */}
      <TableCell className="w-28 bg-muted/50 py-2 text-sm font-medium">
        {label}
      </TableCell>
      <TableCell className={cn("py-2 text-sm", capitalize && "capitalize")}>
        {children}
      </TableCell>
    </TableRow>
  )
}

/**
 * One settings row: label and helper text on the left, control on the right.
 *
 * A thin wrapper over `Field orientation="horizontal"` rather than a new row
 * implementation — the repo already carries three near-identical hand-rolled
 * versions of this (profile-view, workspace-profile-view, currency-view) and a
 * fourth would compound that. `horizontal` is deliberate over `responsive`: the
 * rows are meant to stay label-left/control-right at every width, and the
 * responsive variant keys off the field group's own width, so it would silently
 * fall back to stacked whenever the panel is narrow.
 */
function SettingsRow({
  label,
  htmlFor,
  description,
  children,
}: {
  label: string
  htmlFor?: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <Field
      orientation="horizontal"
      className="flex-col items-start gap-3 py-4 sm:flex-row sm:items-start sm:gap-6"
    >
      <FieldContent className="min-w-0 flex-1">
        <FieldLabel htmlFor={htmlFor}>{label}</FieldLabel>
        {description ? (
          <FieldDescription>{description}</FieldDescription>
        ) : null}
      </FieldContent>
      <div className="flex w-full min-w-0 max-w-lg shrink-0 flex-col gap-1 sm:w-3/5">
        {children}
      </div>
    </Field>
  )
}

function AgentTemplateModal({
  open,
  onOpenChange,
  activeTemplateId,
  onApplyTemplate,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  activeTemplateId: string | null
  onApplyTemplate: (template: (typeof AGENTS)[number] | "blank") => void
}) {
  const [selectedId, setSelectedId] = React.useState<string | null>(
    activeTemplateId ?? "support"
  )

  React.useEffect(() => {
    if (open) {
      setSelectedId(activeTemplateId ?? "support")
    }
  }, [open, activeTemplateId])

  const handleApply = () => {
    if (!selectedId || selectedId === "blank") {
      onApplyTemplate("blank")
    } else {
      const tmpl = AGENTS.find((a) => a.id === selectedId)
      if (tmpl) onApplyTemplate(tmpl)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl" showCloseButton>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SparklesIcon className="size-5 text-primary" />
            Choose an Agent Template
          </DialogTitle>
          <DialogDescription>
            Select a starter template to pre-fill persona and guidelines, or start from scratch with a blank agent.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto py-2 pr-1">
          <FieldGroup className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Blank option */}
            <FieldLabel className="cursor-pointer">
              <Field orientation="horizontal">
                <Checkbox
                  checked={selectedId === "blank"}
                  onCheckedChange={() => setSelectedId("blank")}
                />
                <FieldContent>
                  <FieldTitle className="flex items-center gap-1.5 font-semibold text-foreground">
                    <BotIcon className="size-4 text-muted-foreground" />
                    Start from scratch
                  </FieldTitle>
                  <FieldDescription className="text-xs">
                    Begin with an empty prompt and build custom instructions from the ground up.
                  </FieldDescription>
                </FieldContent>
              </Field>
            </FieldLabel>

            {/* Template cards */}
            {AGENTS.map((tmpl) => (
              <FieldLabel key={tmpl.id} className="cursor-pointer">
                <Field orientation="horizontal">
                  <Checkbox
                    checked={selectedId === tmpl.id}
                    onCheckedChange={() => setSelectedId(tmpl.id)}
                  />
                  <FieldContent>
                    <FieldTitle className="font-semibold text-foreground">
                      {tmpl.label}
                    </FieldTitle>
                    <FieldDescription className="text-xs">
                      {tmpl.description}
                    </FieldDescription>
                  </FieldContent>
                </Field>
              </FieldLabel>
            ))}
          </FieldGroup>
        </div>

        <DialogFooter className="flex flex-row items-center justify-between gap-2 border-t border-border pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              onApplyTemplate("blank")
            }}
          >
            Skip / Start blank
          </Button>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleApply}>
              Apply template
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function OverviewCard({
  agent,
  draft,
  isNew,
  selectedTemplateId,
  onOpenTemplateModal,
  onPromptChange,
}: {
  agent: AgentSummary
  draft?: AgentDraft | null
  isNew?: boolean
  selectedTemplateId?: string | null
  onOpenTemplateModal?: () => void
  onPromptChange?: (prompt: string) => void
}) {
  const prompt = draft?.identity ?? agent.system
  const [copied, setCopied] = React.useState(false)
  const [fullViewOpen, setFullViewOpen] = React.useState(false)
  const [editorOpen, setEditorOpen] = React.useState(false)
  const [editorPrompt, setEditorPrompt] = React.useState(prompt)
  const activeGuidance =
    agent.guidance?.filter((rule) => rule.isActive).length ?? 0
  // Prefer a real update stamp, but never label a creation date as an update.
  const stamp = isNew
    ? null
    : formatDateTime(agent.updatedAt ?? agent.createdAt)
  const stampLabel = agent.updatedAt ? "Last updated" : "Created"
  const selectedTemplate = selectedTemplateId
    ? AGENTS.find((t) => t.id === selectedTemplateId)
    : null
  const editorTarget = isNew
    ? "the new agent"
    : "this agent's unsaved changes"

  React.useEffect(() => {
    if (!copied) return

    const timeout = window.setTimeout(() => setCopied(false), 2000)

    return () => window.clearTimeout(timeout)
  }, [copied])

  async function handleCopyPrompt() {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopied(true)
    } catch {
      toast.error("Couldn’t copy the system prompt")
    }
  }

  function handleOpenEditor() {
    setEditorPrompt(prompt)
    setEditorOpen(true)
  }

  function handleApplyPrompt() {
    if (!editorPrompt.trim()) return

    onPromptChange?.(editorPrompt)
    setEditorOpen(false)
  }

  return (
    <>
      {/* Two columns once the panel is wide enough: prompt on the left, detail
          table beside it. Collapses to the prompt alone when the test chat opens. */}
      <div className="grid items-start gap-6 @4xl/settings:grid-cols-[minmax(0,1fr)_26rem]">
        <Frame className="w-full min-w-0">
          <FrameHeader>
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 flex-col gap-0.5">
                <FrameTitle>System prompt</FrameTitle>
                <FrameDescription>
                  The instructions that define this agent&apos;s behavior and
                  voice.
                </FrameDescription>
              </div>
              <TooltipProvider>
                <div className="ml-auto flex shrink-0 items-center gap-0.5">
                  {isNew && (
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Change system prompt template"
                            onClick={onOpenTemplateModal}
                          />
                        }
                      >
                        <SparklesIcon className="size-3.5 text-primary" />
                      </TooltipTrigger>
                      <TooltipContent>
                        {selectedTemplate
                          ? `Change template (${selectedTemplate.label})`
                          : "Choose template"}
                      </TooltipContent>
                    </Tooltip>
                  )}

                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={
                            copied ? "Copied" : "Copy system prompt"
                          }
                          onClick={() => void handleCopyPrompt()}
                        />
                      }
                    >
                      {copied ? (
                        <CheckIcon className="size-3.5" />
                      ) : (
                        <CopyIcon className="size-3.5" />
                      )}
                    </TooltipTrigger>
                    <TooltipContent>
                      {copied ? "Copied" : "Copy"}
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label="View system prompt fullscreen"
                          onClick={() => setFullViewOpen(true)}
                        />
                      }
                    >
                      <Maximize2Icon className="size-3.5" />
                    </TooltipTrigger>
                    <TooltipContent>Fullscreen</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Edit system prompt"
                          onClick={handleOpenEditor}
                        />
                      }
                    >
                      <PencilIcon className="size-3.5" />
                    </TooltipTrigger>
                    <TooltipContent>Edit</TooltipContent>
                  </Tooltip>
                </div>
              </TooltipProvider>
            </div>
          </FrameHeader>

          <FramePanel>
            <PromptMarkdown prompt={prompt} />
          </FramePanel>

          {stamp ? (
            <FrameFooter>
              <p className="text-sm text-muted-foreground">
                {stampLabel} {stamp}
              </p>
            </FrameFooter>
          ) : null}
        </Frame>

        {/* Detail table: sits beside the prompt, and only while the settings
            panel is wide enough — i.e. the test chat is closed and the panel has
            not been dragged narrow. */}
        <Frame className="hidden w-full min-w-0 @4xl/settings:block">
          <FramePanel className="overflow-hidden p-0" fit>
            <Table>
              <TableBody>
                {isNew && (
                  <MetaRow label="Template">
                    <span className="font-medium text-foreground">
                      {selectedTemplate
                        ? selectedTemplate.label
                        : "Custom (Blank)"}
                    </span>
                  </MetaRow>
                )}
                {!isNew && (
                  <MetaRow label="Status">
                    <AgentStatusBadge status={draft?.status ?? agent.status} />
                  </MetaRow>
                )}
                <MetaRow label="Tone" capitalize>
                  {draft?.tone ?? agent.persona.tone}
                </MetaRow>
                <MetaRow label="Language">
                  {LANGUAGE_LABELS[draft?.language ?? agent.persona.language]}
                </MetaRow>
                <MetaRow label="Guidance">{`${activeGuidance} active`}</MetaRow>
                <MetaRow label="Sources">
                  {`${(draft?.datasetIds ?? agent.datasetIds)?.length ?? 0} collections`}
                </MetaRow>
              </TableBody>
            </Table>
          </FramePanel>
        </Frame>
      </div>

      <Dialog open={fullViewOpen} onOpenChange={setFullViewOpen}>
        <DialogContent className="flex h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none">
          <DialogHeader className="shrink-0 border-b border-border px-5 py-4 pr-12">
            <DialogTitle>System prompt</DialogTitle>
            <DialogDescription>
              Fullscreen Markdown preview of the current prompt.
            </DialogDescription>
          </DialogHeader>
          <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto p-5 sm:p-8">
            <div className="mx-auto w-full max-w-4xl">
              <PromptMarkdown prompt={prompt} />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="flex h-[calc(100dvh-2rem)] max-h-[48rem] w-[calc(100vw-2rem)] max-w-5xl flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl">
          <DialogHeader className="shrink-0 border-b border-border px-5 py-4 pr-12">
            <DialogTitle>Edit system prompt</DialogTitle>
            <DialogDescription>
              Write Markdown and preview how the prompt will appear before
              applying it to {editorTarget}.
            </DialogDescription>
          </DialogHeader>

          <Tabs
            defaultValue="write"
            className="min-h-0 flex-1 gap-0 overflow-hidden"
          >
            <div className="shrink-0 border-b border-border px-5 py-2">
              <TabsList>
                <TabsTrigger value="write">Write</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="write" className="min-h-0 p-0">
              <Textarea
                aria-label="System prompt Markdown"
                value={editorPrompt}
                onChange={(event) => setEditorPrompt(event.target.value)}
                placeholder="Enter instructions that define what this agent does and how it behaves..."
                className="h-full min-h-0 resize-none rounded-none border-0 p-5 font-mono text-sm leading-relaxed shadow-none"
              />
            </TabsContent>
            <TabsContent
              value="preview"
              className="scrollbar-thin min-h-0 overflow-y-auto p-5"
            >
              <PromptMarkdown prompt={editorPrompt} />
            </TabsContent>
          </Tabs>

          <DialogFooter className="mx-0 mb-0 shrink-0 rounded-none">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditorOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleApplyPrompt}
              disabled={!editorPrompt.trim()}
            >
              Apply changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function PromptMarkdown({ prompt }: { prompt: string }) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed">
      <Streamdown>{prompt || "*No prompt content entered yet.*"}</Streamdown>
    </div>
  )
}

/**
 * Fully controlled: the draft lives in `AgentSettingsView` so the unsaved-changes
 * toolbar can see edits made here alongside the ones from Messages and Answer
 * sources, and save all three in one request.
 */
function PersonaCard({
  draft,
  teams,
  onChange,
}: {
  draft: AgentDraft
  teams: AgentTeamSummary[]
  onChange: (patch: Partial<AgentDraft>) => void
}) {
  return (
    <SettingsFrame
      title="Persona"
      description="How the agent introduces itself and the tone it replies in."
    >
      <FieldGroup className="gap-0 divide-y divide-border">
        <SettingsRow
          label="Agent name"
          htmlFor="persona-name"
          description="Shown to teammates wherever this agent appears."
        >
          <Input
            id="persona-name"
            value={draft.name}
            onChange={(event) => onChange({ name: event.target.value })}
          />
        </SettingsRow>
        <SettingsRow
          label="Identity and role"
          htmlFor="persona-identity"
          description="The system instructions that define what this agent is."
        >
          <Textarea
            id="persona-identity"
            rows={5}
            className="h-40 field-sizing-fixed resize-none overflow-y-auto"
            value={draft.identity}
            onChange={(event) => onChange({ identity: event.target.value })}
          />
        </SettingsRow>
        <SettingsRow
          label="Tone"
          htmlFor="persona-tone"
          description="The voice the agent replies in."
        >
          <Select
            value={draft.tone}
            onValueChange={(value) => onChange({ tone: value as Tone })}
          >
            <SelectTrigger id="persona-tone" className="w-full">
              <SelectValue>
                {(value) => (value ? (TONE_LABELS[String(value)] ?? String(value)) : "Select tone")}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {[
                "friendly",
                "professional",
                "concise",
                "empathetic",
                "casual",
              ].map((value) => (
                <SelectItem key={value} value={value}>
                  {TONE_LABELS[value] ?? value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingsRow>
        <SettingsRow
          label="Language"
          htmlFor="persona-language"
          description="Which language replies are written in."
        >
          <Select
            value={draft.language}
            onValueChange={(value) => onChange({ language: value as Language })}
          >
            <SelectTrigger id="persona-language" className="w-full">
              <SelectValue>
                {(value) =>
                  value
                    ? (LANGUAGE_LABELS[value as Language] ?? String(value))
                    : "Select language"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="match_customer">Match customer</SelectItem>
              <SelectItem value="english">English</SelectItem>
              <SelectItem value="burmese">Burmese</SelectItem>
            </SelectContent>
          </Select>
        </SettingsRow>
        <SettingsRow
          label="Team"
          htmlFor="persona-team"
          description="Groups this agent with others in the same workspace."
        >
          <Select
            value={draft.teamId || NO_TEAM}
            onValueChange={(value) => value && onChange({ teamId: value })}
          >
            <SelectTrigger id="persona-team" className="w-full">
              <SelectValue>
                {(value) =>
                  !value || value === NO_TEAM
                    ? "No team"
                    : (teams.find((t) => t.id === value)?.name ?? "No team")
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_TEAM}>No team</SelectItem>
              {teams.map((team) => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingsRow>
      </FieldGroup>
    </SettingsFrame>
  )
}

function MessagesCard({
  draft,
  onChange,
}: {
  draft: AgentDraft
  onChange: (patch: Partial<AgentDraft>) => void
}) {
  return (
    <SettingsFrame
      title="Messages"
      description="How a conversation starts and the low-confidence fallback."
    >
      <FieldGroup className="gap-0 divide-y divide-border">
        <SettingsRow
          label="First message mode"
          htmlFor="agent-first-message-mode"
          description="Choose whether the assistant or customer starts the conversation."
        >
          <Select
            value={draft.firstMessageMode}
            onValueChange={(value) =>
              value &&
              onChange({ firstMessageMode: value as AgentFirstMessageMode })
            }
          >
            <SelectTrigger id="agent-first-message-mode" className="w-full">
              <SelectValue>
                {(value) =>
                  value
                    ? FIRST_MESSAGE_MODE_LABELS[
                        value as AgentFirstMessageMode
                      ]
                    : "Select first message mode"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(FIRST_MESSAGE_MODE_LABELS).map(
                ([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </SettingsRow>
        {draft.firstMessageMode === "assistant-speaks-first" ? (
          <SettingsRow
            label="First message"
            htmlFor="agent-greeting"
            description="Shown immediately when Test chat starts."
          >
            <Textarea
              id="agent-greeting"
              rows={3}
              value={draft.greeting}
              onChange={(event) => onChange({ greeting: event.target.value })}
            />
          </SettingsRow>
        ) : null}
        <SettingsRow
          label="Fallback"
          htmlFor="agent-fallback"
          description="Sent before the conversation moves to needs attention."
        >
          <Textarea
            id="agent-fallback"
            rows={4}
            value={draft.fallback}
            onChange={(event) => onChange({ fallback: event.target.value })}
          />
        </SettingsRow>
      </FieldGroup>
    </SettingsFrame>
  )
}

function GuidanceCard({
  guidance,
  isNew,
  onAdd,
  onEdit,
  onToggle,
  onDelete,
  onMove,
}: {
  guidance: AgentGuidance[]
  isNew?: boolean
  onAdd: () => void
  onEdit: (rule: AgentGuidance) => void
  onToggle: (rule: AgentGuidance, active: boolean) => void
  onDelete: (rule: AgentGuidance) => void
  onMove: (index: number, offset: number) => void
}) {
  const active = guidance.filter((rule) => rule.isActive).length
  return (
    <SettingsFrame
      title="Guidance"
      badge={isNew ? "0 active" : `${active} active`}
      description="Custom instructions applied on top of the Knowledge Base."
    >
      <div className="flex flex-col gap-4">
        {guidance.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            <ShieldCheckIcon className="size-8 text-muted-foreground/50 mb-2" />
            <p className="font-medium text-foreground">Custom guidance rules</p>
            <p className="text-xs mt-1 max-w-sm">
              {isNew
                ? "Create this agent to start adding custom rules and constraints."
                : "No guidance rules yet. Add instructions applied on top of the Knowledge Base."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {guidance.map((rule, index) => (
              <div
                key={rule.id}
                className="flex items-start gap-3 py-3"
              >
                <Switch
                  checked={rule.isActive}
                  onCheckedChange={(checked) => void onToggle(rule, checked)}
                  aria-label={`Toggle ${rule.title}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{rule.title}</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {rule.instruction}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    disabled={index === 0}
                    onClick={() => void onMove(index, -1)}
                  >
                    <ChevronUpIcon />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    disabled={index === guidance.length - 1}
                    onClick={() => void onMove(index, 1)}
                  >
                    <ChevronDownIcon />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => onEdit(rule)}
                  >
                    <PencilIcon />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="text-destructive"
                    onClick={() => void onDelete(rule)}
                  >
                    <Trash2Icon />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-end">
          <Button variant="outline" onClick={onAdd}>
            <PlusIcon /> Add guidance
          </Button>
        </div>
      </div>
    </SettingsFrame>
  )
}

function SourcesCard({
  datasets,
  selected,
  onChange,
}: {
  datasets: DatasetSummary[]
  selected: string[]
  onChange: (ids: string[]) => void
}) {
  const [search, setSearch] = React.useState("")
  const columns = React.useMemo(() => buildDatasetColumns(), [])

  /*
   * The table's own selection shape, derived from the ids the draft owns.
   * Selection lives outside this component — the toolbar's Save sends
   * `datasetIds`, and Discard has to be able to put them back — so the grid is
   * driven rather than left to hold its own state.
   */
  const rowSelection: RowSelectionState = React.useMemo(
    () =>
      selected.reduce<RowSelectionState>((acc, id) => {
        acc[id] = true
        return acc
      }, {}),
    [selected]
  )

  const table = useTable<DataGridFeatures, DatasetSummary>({
    features: dataGridFeatures,
    data: datasets,
    columns: columns as ColumnDef<DataGridFeatures, DatasetSummary, unknown>[],
    // Without this the selection keys are row indices, so the ids sent to the
    // API would be "0", "1", "2".
    getRowId: (dataset) => dataset.id,
    // Enables the behaviour *and* the selected-row styling, which the grid
    // gates on this same flag.
    enableRowSelection: true,
    state: { rowSelection, globalFilter: search },
    onRowSelectionChange: (updater) => {
      // v9 passes either the next value or a function producing it.
      const next =
        typeof updater === "function" ? updater(rowSelection) : updater
      // v9 drops deselected rows from the map rather than storing `false`, so
      // the keys are exactly the selected ids — no truthiness filter needed.
      onChange(Object.keys(next))
    },
    onGlobalFilterChange: (updater) => {
      const next = typeof updater === "function" ? updater(search) : updater
      setSearch(typeof next === "string" ? next : "")
    },
    globalFilterFn: (row, _columnId, filterValue) => {
      const query = String(filterValue).trim().toLocaleLowerCase()
      if (!query) return true
      return row.original.name.toLocaleLowerCase().includes(query)
    },
    /*
     * Pagination is part of the shared feature bundle, so it applies whether
     * or not a pager is rendered — and the body renders the *paginated* row
     * model. Left at the default page size this would quietly show the first
     * 10 collections and no control to reach the rest.
     */
    initialState: { pagination: { pageIndex: 0, pageSize: ALL_ROWS } },
  })

  return (
    <SettingsFrame
      title="Answer sources"
      badge={`${selected.length} selected`}
      // Folded into the description now that the panel is edge-to-edge table:
      // the standalone helper paragraph it replaces had nowhere to sit without
      // reintroducing the padding the grid needs removed.
      description="Choose knowledge collections. Only indexed documents can answer questions."
      action={
        datasets.length > 0 ? (
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 opacity-50 select-none" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search collections"
              aria-label="Search collections"
              className="h-8 w-44 pl-8 text-sm"
            />
          </div>
        ) : null
      }
      // The grid brings its own cell padding; the panel's would stack on it.
      panelClassName="overflow-hidden p-0"
      fit
    >
      <DataGrid
        table={table}
        recordCount={datasets.length}
        /*
          The grid shows its empty row whenever the *filtered* set is empty,
          so a search that matches nothing lands here too. Saying "none
          available" there would be a lie about the workspace rather than a
          report about the query.
        */
        emptyMessage={
          search.trim()
            ? `No collections match “${search.trim()}”.`
            : "No Knowledge Base collections available."
        }
        tableClassNames={{ edgeCell: "px-3" }}
      >
        <DataGridTable />
      </DataGrid>
    </SettingsFrame>
  )
}

/**
 * Section shell for the agent settings pages: a titled header over a single
 * content panel. Badge and action share one right-aligned group so they do not
 * both claim `ml-auto` and fight over the free space.
 */
function SettingsFrame({
  title,
  description,
  badge,
  action,
  panelClassName,
  fit,
  children,
}: {
  title: string
  description: string
  badge?: string
  action?: React.ReactNode
  /**
   * Escape hatch for a section whose content brings its own padding — the
   * sources table needs `p-0` so the panel's 16px does not stack on top of
   * the grid's own cell padding. Every other section leaves this unset.
   */
  panelClassName?: string
  fit?: boolean
  children: React.ReactNode
}) {
  return (
    <Frame className="w-full min-w-0">
      <FrameHeader>
        <div className="flex items-center gap-2">
          <div className="flex min-w-0 flex-col gap-0.5">
            <FrameTitle>{title}</FrameTitle>
            <FrameDescription>{description}</FrameDescription>
          </div>
          {badge || action ? (
            <div className="ml-auto flex shrink-0 items-center gap-2">
              {badge ? <Badge variant="secondary">{badge}</Badge> : null}
              {action}
            </div>
          ) : null}
        </div>
      </FrameHeader>
      <FramePanel className={panelClassName} fit={fit}>
        {children}
      </FramePanel>
    </Frame>
  )
}

function GuidanceDialog({
  value,
  onOpenChange,
  onSave,
}: {
  value: AgentGuidance | "new" | null
  onOpenChange: (open: boolean) => void
  onSave: (input: {
    title: string
    instruction: string
    is_active: boolean
  }) => Promise<void>
}) {
  const current = value && value !== "new" ? value : null
  const [title, setTitle] = React.useState(current?.title ?? "")
  const [instruction, setInstruction] = React.useState(
    current?.instruction ?? ""
  )
  const [saving, setSaving] = React.useState(false)
  return (
    <Dialog open={value !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {current ? "Edit guidance" : "Add guidance"}
          </DialogTitle>
          <DialogDescription>
            Give the rule a clear name and tell the agent exactly how to behave.
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="guidance-title">Title</FieldLabel>
            <Input
              id="guidance-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="guidance-instruction">Instruction</FieldLabel>
            <Textarea
              id="guidance-instruction"
              rows={6}
              value={instruction}
              onChange={(event) => setInstruction(event.target.value)}
            />
          </Field>
        </FieldGroup>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={saving || !title.trim() || !instruction.trim()}
            onClick={async () => {
              setSaving(true)
              try {
                await onSave({
                  title: title.trim(),
                  instruction: instruction.trim(),
                  is_active: current?.isActive ?? true,
                })
              } finally {
                setSaving(false)
              }
            }}
          >
            {saving ? <Spinner /> : <CheckCircle2Icon />} Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DeleteConfirmDialog({
  open,
  onOpenChange,
  agentName,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  agentName: string
  onConfirm: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm" showCloseButton>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <AlertTriangleIcon className="size-4" />
            </span>
            Delete agent
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete{" "}
            <span className="font-medium text-foreground">{agentName}</span>?
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            <Trash2Icon data-icon="inline-start" />
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
