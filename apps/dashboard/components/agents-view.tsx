"use client"

import * as React from "react"
import Link from "next/link"
import {
  BotIcon,
  PlusIcon,
  PencilIcon,
  Trash2Icon,
  MoreVerticalIcon,
  SettingsIcon,
  UsersIcon,
  XIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  ChevronDownIcon,
  FilterIcon,
} from "@/components/ui/icons"

import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"
import { ButtonGroup11 } from "@/components/shadcn-studio/button-group/button-group-11"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { DataTable } from "@/components/data-table"
import type { ColumnDef } from "@tanstack/react-table"
import type { DataGridFeatures } from "@/components/reui/data-grid/data-grid"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import {
  AgentsFilterRail,
  type StatusFilter,
  type TeamFilter,
} from "@/components/agents/agents-filter-rail"
import { Field, FieldLabel } from "@/components/ui/field"
import { useSearchParams } from "next/navigation"
import { useRouter } from "next/navigation"
import { useActiveOrganization } from "@/hooks/use-active-organization"
import {
  fetchAgents,
  updateAgent,
  deleteAgent,
  fetchDatasets,
  fetchAgentTeams,
  createAgentTeam,
  updateAgentTeam,
  deleteAgentTeam,
  type AgentSummary as Agent,
  type AgentTeamSummary,
  type DatasetSummary,
} from "@/components/rag/api"

/* -------------------------------------------------------------------------- */
/*                                  Constants                                  */
/* -------------------------------------------------------------------------- */

type AgentStatus = "active" | "inactive" | "draft"

/* -------------------------------------------------------------------------- */
/*                               Columns builder                              */
/* -------------------------------------------------------------------------- */

export const buildAgentColumns = (
  onDelete: (agent: Agent) => void,
  teams: AgentTeamSummary[],
  onMoveToTeam: (agent: Agent, teamId: string | null) => void
): ColumnDef<DataGridFeatures, Agent>[] => [
  {
    id: "name",
    // Search should match the description too, but it has no column of its own
    // — it renders as the second line of this cell. Folding both into the
    // accessor keeps the toolbar filter matching what the cell actually shows.
    accessorFn: (agent) => `${agent.name} ${agent.description ?? ""}`,
    header: "Agent",
    meta: { headerTitle: "Agent" },
    cell: ({ row }) => {
      const agent = row.original
      return (
        <div className="flex items-center gap-2.5">
          <img
            src={`https://api.dicebear.com/10.x/glyphs/svg?seed=${encodeURIComponent(agent.name)}`}
            alt={agent.name}
            className="size-8 shrink-0 rounded-md border border-border bg-muted object-cover"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {agent.name}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {agent.description}
            </p>
          </div>
        </div>
      )
    },
  },
  {
    id: "team",
    accessorFn: (agent) =>
      teams.find((t) => t.id === agent.agentTeamId)?.name ?? "",
    header: "Team",
    meta: { headerTitle: "Team" },
    cell: ({ row }) => {
      const team = teams.find((t) => t.id === row.original.agentTeamId)
      if (!team) {
        return <span className="text-sm text-muted-foreground">—</span>
      }
      return (
        <Badge variant="secondary" className="gap-1.5">
          <span
            className="size-2 shrink-0 rounded-full bg-muted-foreground/40"
            style={
              team.iconColor ? { backgroundColor: team.iconColor } : undefined
            }
            aria-hidden="true"
          />
          {team.name}
        </Badge>
      )
    },
  },
  {
    accessorKey: "messageCount",
    header: () => <div className="text-right">Messages</div>,
    meta: { headerTitle: "Messages" },
    cell: ({ row }) => (
      <div className="text-right font-mono text-sm text-muted-foreground">
        {row.original.messageCount.toLocaleString()}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: () => <div className="text-center">Status</div>,
    meta: { headerTitle: "Status" },
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <AgentStatusBadge status={row.original.status} />
      </div>
    ),
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    enableHiding: false,
    cell: ({ row }) => {
      const agent = row.original
      return (
        <div className="flex items-center justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`Actions for ${agent.name}`}
                />
              }
            >
              <MoreVerticalIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-36">
              <DropdownMenuItem render={<Link href={`/agents/${agent.id}`} />}>
                <SettingsIcon />
                Manage agent
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href={`/agents/${agent.id}`} />}>
                <PencilIcon />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <UsersIcon />
                  Move to team
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem
                    disabled={!agent.agentTeamId}
                    onClick={() => onMoveToTeam(agent, null)}
                  >
                    No team
                  </DropdownMenuItem>
                  {teams.map((team) => (
                    <DropdownMenuItem
                      key={team.id}
                      disabled={agent.agentTeamId === team.id}
                      onClick={() => onMoveToTeam(agent, team.id)}
                    >
                      {team.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onDelete(agent)}
              >
                <Trash2Icon />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
  },
]

/* -------------------------------------------------------------------------- */
/*                              AgentsView                                      */
/* -------------------------------------------------------------------------- */

export function AgentsView() {
  const organization = useActiveOrganization()
  const searchParams = useSearchParams()
  const router = useRouter()

  const isMobile = useIsMobile()

  const [agents, setAgents] = React.useState<Agent[]>([])
  const [datasets, setDatasets] = React.useState<DatasetSummary[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all")
  const [deleteTarget, setDeleteTarget] = React.useState<Agent | null>(null)

  const [teams, setTeams] = React.useState<AgentTeamSummary[]>([])
  // Seeded from the URL rather than applied in an effect, so a deep link filters
  // on the first render instead of flashing the full list. `loadTeams` drops the
  // selection again if the id turns out not to exist.
  const [teamFilter, setTeamFilter] = React.useState<TeamFilter>(
    () => searchParams?.get("teamId") || "all"
  )
  const [teamDialogTarget, setTeamDialogTarget] = React.useState<
    AgentTeamSummary | "new" | null
  >(null)
  const [deleteTeamTarget, setDeleteTeamTarget] =
    React.useState<AgentTeamSummary | null>(null)

  const preselectedDatasetId = searchParams?.get("datasetId") || null

  const loadAgents = React.useCallback(async () => {
    if (!organization) return
    setIsLoading(true)
    try {
      const list = await fetchAgents(organization.id)
      setAgents(list)
    } catch (error) {
      console.error("Failed to load agents:", error)
    } finally {
      setIsLoading(false)
    }
  }, [organization])

  const loadDatasets = React.useCallback(async () => {
    if (!organization) return
    try {
      const list = await fetchDatasets(organization.id)
      setDatasets(list)
    } catch (error) {
      console.error("Failed to load datasets:", error)
    }
  }, [organization])

  const loadTeams = React.useCallback(async () => {
    if (!organization) return
    try {
      const list = await fetchAgentTeams(organization.id)
      setTeams(list)
      // A `?teamId=` pointing at a deleted or foreign team would otherwise
      // filter the table down to nothing with no way back except the rail.
      setTeamFilter((current) =>
        current === "all" ||
        current === "none" ||
        list.some((t) => t.id === current)
          ? current
          : "all"
      )
    } catch (error) {
      console.error("Failed to load agent teams:", error)
    }
  }, [organization])

  React.useEffect(() => {
    loadAgents()
    loadDatasets()
    loadTeams()
  }, [loadAgents, loadDatasets, loadTeams])

  React.useEffect(() => {
    if (searchParams?.get("create") === "true") {
      router.replace(
        preselectedDatasetId
          ? `/agents/new?datasetId=${preselectedDatasetId}`
          : "/agents/new"
      )
    }
  }, [preselectedDatasetId, router, searchParams])

  // Status and team both come from the filter rail and compose — "active
  // agents in Support" is one selection of each. Free-text search is handled
  // by the table toolbar's global filter.
  const filtered = React.useMemo(
    () =>
      agents.filter((a) => {
        if (statusFilter !== "all" && a.status !== statusFilter) return false
        if (teamFilter === "none" && a.agentTeamId) return false
        if (teamFilter !== "all" && teamFilter !== "none") {
          return a.agentTeamId === teamFilter
        }
        return true
      }),
    [agents, statusFilter, teamFilter]
  )

  const handleMoveToTeam = React.useCallback(
    async (agent: Agent, teamId: string | null) => {
      if (!organization) return
      try {
        const updated = await updateAgent(organization.id, agent.id, {
          agent_team_id: teamId,
        })
        setAgents((prev) =>
          prev.map((a) => (a.id === agent.id ? updated : a))
        )
      } catch (error) {
        console.error("Failed to move agent:", error)
      }
    },
    [organization]
  )

  const columns = React.useMemo(
    () =>
      buildAgentColumns(setDeleteTarget, teams, handleMoveToTeam),
    [teams, handleMoveToTeam]
  )

  async function handleDelete() {
    if (!organization || !deleteTarget) return
    try {
      await deleteAgent(organization.id, deleteTarget.id)
      setAgents((prev) => prev.filter((a) => a.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (error) {
      console.error("Failed to delete agent:", error)
    }
  }

  async function handleSaveTeam(name: string, description: string) {
    if (!organization || !teamDialogTarget) return
    if (teamDialogTarget === "new") {
      const team = await createAgentTeam(organization.id, {
        name,
        description,
      })
      setTeams((prev) => [...prev, team])
    } else {
      const updated = await updateAgentTeam(
        organization.id,
        teamDialogTarget.id,
        { name, description }
      )
      setTeams((prev) =>
        prev.map((t) => (t.id === updated.id ? updated : t))
      )
    }
    setTeamDialogTarget(null)
  }

  async function handleDeleteTeam() {
    if (!organization || !deleteTeamTarget) return
    try {
      await deleteAgentTeam(organization.id, deleteTeamTarget.id)
      setTeams((prev) => prev.filter((t) => t.id !== deleteTeamTarget.id))
      // If the active filter pointed at this team, reset to "all" so the
      // table doesn't get permanently stuck on a deleted team.
      if (teamFilter === deleteTeamTarget.id) {
        setTeamFilter("all")
      }
      // The API nulls the foreign key rather than deleting the agents, so
      // reflect that locally without a full reload.
      setAgents((prev) =>
        prev.map((a) =>
          a.agentTeamId === deleteTeamTarget.id
            ? { ...a, agentTeamId: null }
            : a
        )
      )
      setDeleteTeamTarget(null)
    } catch (error) {
      console.error("Failed to delete agent team:", error)
    }
  }

  const newAgentHref = preselectedDatasetId
    ? `/agents/new?datasetId=${preselectedDatasetId}`
    : "/agents/new"

  const filterRail = (
    <AgentsFilterRail
      agents={agents}
      statusFilter={statusFilter}
      onStatusFilterChange={setStatusFilter}
      teamFilter={teamFilter}
      onTeamFilterChange={setTeamFilter}
      teams={teams}
      onEditTeam={(team) => setTeamDialogTarget(team)}
      onDeleteTeam={(team) => setDeleteTeamTarget(team)}
    />
  )

  const mainContent = (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background">
      {/* Mobile filter sheet trigger */}
      {isMobile && (
        <div className="shrink-0 border-b border-border bg-background px-4 py-2">
          <Sheet>
            <SheetTrigger render={<Button variant="outline" size="sm" />}>
              <FilterIcon data-icon="inline-start" />
              Filters
              {(statusFilter !== "all" || teamFilter !== "all") && (
                <span className="size-1.5 rounded-full bg-primary" />
              )}
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
                <SheetTitle>Filters</SheetTitle>
                <SheetDescription>
                  Filter agents by status or team.
                </SheetDescription>
              </SheetHeader>
              {filterRail}
            </SheetContent>
          </Sheet>
        </div>
      )}

      {/* Main content table */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {isLoading ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
            <Spinner className="size-8 text-primary" />
            <p className="text-sm font-medium text-muted-foreground">
              Loading agents…
            </p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filtered}
            searchPlaceholder="Search agents…"
            searchableColumnIds={["name"]}
            initialPageSize={10}
            columnsLabel="View"
            getRowId={(agent) => agent.id}
            onRowClick={(agent) => router.push(`/agents/${agent.id}`)}
            emptyMessage={
              <Empty className="mx-auto my-8 max-w-sm border-dashed border-border bg-card/40 p-6">
                <EmptyHeader>
                  <EmptyMedia variant="outline">
                    <BotIcon className="size-5" />
                  </EmptyMedia>
                  <EmptyTitle className="text-sm font-semibold">
                    No agents found
                  </EmptyTitle>
                  <EmptyDescription className="text-xs">
                    {agents.length === 0
                      ? "Create an agent to get started."
                      : "No agents match your filters."}
                  </EmptyDescription>
                </EmptyHeader>
                {agents.length === 0 && (
                  <EmptyContent className="mt-2">
                    <Button
                      variant="outline"
                      nativeButton={false}
                      render={<Link href={newAgentHref} />}
                      disabled={!organization}
                    >
                      <PlusIcon data-icon="inline-start" />
                      New agent
                    </Button>
                  </EmptyContent>
                )}
              </Empty>
            }
            toolbarActions={
              <ButtonGroup11>
                <Button
                  type="button"
                  onClick={() => router.push(newAgentHref)}
                  disabled={!organization}
                >
                  <PlusIcon data-icon="inline-start" />
                  New agent
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        type="button"
                        size="icon"
                        aria-label="Create options"
                        disabled={!organization}
                      />
                    }
                  >
                    <ChevronDownIcon aria-hidden="true" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => setTeamDialogTarget("new")}
                    >
                      <UsersIcon aria-hidden="true" />
                      New team
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </ButtonGroup11>
            }
            className="min-h-0 flex-1 gap-0"
            toolbarClassName="shrink-0 border-b border-border px-4 py-2"
            containerClassName="min-h-0 flex-1 overflow-auto relative"
            headerClassName="bg-muted"
            rowClassName="bg-background hover:bg-muted/40 cursor-pointer"
            footerClassName="shrink-0 border-t border-border px-4 py-2"
          />
        )}
      </div>
    </div>
  )

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden bg-background text-foreground">
      {!isMobile ? (
        <ResizablePanelGroup className="min-h-0 flex-1 overflow-hidden">
          <ResizablePanel
            id="agents-filter-panel"
            defaultSize="18%"
            minSize="12%"
            maxSize="25%"
            className="min-w-0"
          >
            <aside className="flex h-full flex-col bg-sidebar">
              {filterRail}
            </aside>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel id="agents-content" className="min-h-0 min-w-0">
            {mainContent}
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {mainContent}
        </div>
      )}

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        agentName={deleteTarget?.name ?? ""}
        onConfirm={handleDelete}
      />

      <AgentTeamDialog
        key={
          teamDialogTarget === "new" || teamDialogTarget === null
            ? "team-new"
            : `team-${teamDialogTarget.id}`
        }
        open={!!teamDialogTarget}
        onOpenChange={(o) => !o && setTeamDialogTarget(null)}
        team={teamDialogTarget === "new" ? null : teamDialogTarget}
        onSave={handleSaveTeam}
      />

      <DeleteTeamDialog
        open={!!deleteTeamTarget}
        onOpenChange={(o) => !o && setDeleteTeamTarget(null)}
        teamName={deleteTeamTarget?.name ?? ""}
        agentCount={
          agents.filter((a) => a.agentTeamId === deleteTeamTarget?.id).length
        }
        onConfirm={handleDeleteTeam}
      />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                           Delete confirm dialog                             */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/*                                 Small parts                                  */
/* -------------------------------------------------------------------------- */

function AgentStatusBadge({ status }: { status: AgentStatus }) {
  if (status === "active") {
    return (
      <Badge
        variant="outline"
        className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      >
        <CheckCircle2Icon data-icon="inline-start" />
        Active
      </Badge>
    )
  }
  if (status === "inactive") {
    return (
      <Badge variant="secondary">
        <XIcon data-icon="inline-start" />
        Inactive
      </Badge>
    )
  }
  return (
    <Badge
      variant="outline"
      className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
    >
      <Spinner className="size-3!" />
      Draft
    </Badge>
  )
}



/* -------------------------------------------------------------------------- */
/*                          Agent team create / rename                          */
/* -------------------------------------------------------------------------- */

function AgentTeamDialog({
  open,
  onOpenChange,
  team,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** `null` means create; otherwise the team being renamed. */
  team: AgentTeamSummary | null
  onSave: (name: string, description: string) => Promise<void>
}) {
  const [name, setName] = React.useState(team?.name ?? "")
  const [description, setDescription] = React.useState(team?.description ?? "")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || isSubmitting) return
    setIsSubmitting(true)
    try {
      await onSave(name.trim(), description.trim())
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to save team:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UsersIcon className="size-5 text-primary" />
              {team ? "Rename team" : "New team"}
            </DialogTitle>
            <DialogDescription>
              Teams group agents in the sidebar. They do not change how any
              agent answers.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <Field>
              <FieldLabel htmlFor="team-name">
                Team name <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="team-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Support"
                required
                autoFocus
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="team-desc">Description</FieldLabel>
              <Textarea
                id="team-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description of what this team covers..."
                rows={3}
              />
            </Field>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || isSubmitting}>
              {isSubmitting ? (
                <Spinner className="size-4" />
              ) : team ? (
                "Save changes"
              ) : (
                "Create team"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/* -------------------------------------------------------------------------- */
/*                            Delete team dialog                                */
/* -------------------------------------------------------------------------- */

function DeleteTeamDialog({
  open,
  onOpenChange,
  teamName,
  agentCount,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  teamName: string
  agentCount: number
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
            Delete team
          </DialogTitle>
          <DialogDescription>
            Delete{" "}
            <span className="font-medium text-foreground">{teamName}</span>?{" "}
            {agentCount > 0
              ? `Its ${agentCount} agent${agentCount === 1 ? "" : "s"} will be kept and moved to "No team".`
              : "No agents are affected."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            <Trash2Icon data-icon="inline-start" />
            Delete team
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
