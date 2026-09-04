"use client"

import {
  BotIcon,
  CheckCircle2Icon,
  CircleDashedIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
  UsersIcon,
  XIcon,
  type LucideIcon,
} from "@/components/ui/icons"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import type { AgentSummary, AgentTeamSummary } from "@/components/rag/api"

type AgentStatus = "active" | "inactive" | "draft"
type StatusFilter = "all" | AgentStatus

/**
 * Either every agent, only unassigned ones, or one specific team (by id).
 * Kept separate from StatusFilter because the two compose — "active agents in
 * Support" is a thing a user wants.
 */
type TeamFilter = "all" | "none" | (string & {})

type FilterItem = {
  key: StatusFilter
  label: string
  icon: LucideIcon
  count: number
  dotColor?: string
}

interface AgentsFilterRailProps {
  agents: AgentSummary[]
  statusFilter: StatusFilter
  onStatusFilterChange: (filter: StatusFilter) => void
  teams: AgentTeamSummary[]
  teamFilter: TeamFilter
  onTeamFilterChange: (filter: TeamFilter) => void
  onEditTeam: (team: AgentTeamSummary) => void
  onDeleteTeam: (team: AgentTeamSummary) => void
}

function FilterNavItem({
  icon: Icon,
  label,
  count,
  isActive,
  dotColor,
  dotStyle,
  onClick,
  action,
}: {
  icon: LucideIcon
  label: string
  count: number
  isActive: boolean
  dotColor?: string
  dotStyle?: React.CSSProperties
  onClick: () => void
  action?: React.ReactNode
}) {
  return (
    <li className="group/item relative">
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "flex h-9 w-full items-center gap-2 rounded-md px-2 text-sm transition-colors cursor-pointer",
          isActive
            ? "bg-muted font-medium text-foreground"
            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        )}
      >
        {dotColor || dotStyle ? (
          <span
            className={cn("size-2.5 shrink-0 rounded-full", dotColor)}
            style={dotStyle}
            aria-hidden="true"
          />
        ) : (
          <Icon
            className="size-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
        )}
        <span className="min-w-0 flex-1 truncate text-start">{label}</span>
        <span
          className={cn(
            "shrink-0 text-xs font-normal text-muted-foreground tabular-nums",
            action && "group-hover/item:opacity-0"
          )}
        >
          {count}
        </span>
      </button>
      {action}
    </li>
  )
}

export function AgentsFilterRail({
  agents,
  statusFilter,
  onStatusFilterChange,
  teams,
  teamFilter,
  onTeamFilterChange,
  onEditTeam,
  onDeleteTeam,
}: AgentsFilterRailProps) {
  const counts = {
    all: agents.length,
    active: agents.filter((a) => a.status === "active").length,
    draft: agents.filter((a) => a.status === "draft").length,
    inactive: agents.filter((a) => a.status === "inactive").length,
  }

  const totalMessages = agents.reduce((sum, a) => sum + a.messageCount, 0)

  // Counted from the loaded agents rather than the team's own agentCount so the
  // number tracks local optimistic updates without a refetch.
  const unassignedCount = agents.filter((a) => !a.agentTeamId).length

  const items: FilterItem[] = [
    { key: "all", label: "All agents", icon: BotIcon, count: counts.all },
    {
      key: "active",
      label: "Active",
      icon: CheckCircle2Icon,
      count: counts.active,
      dotColor: "bg-emerald-500",
    },
    {
      key: "draft",
      label: "Draft",
      icon: CircleDashedIcon,
      count: counts.draft,
      dotColor: "bg-amber-500",
    },
    {
      key: "inactive",
      label: "Inactive",
      icon: XIcon,
      count: counts.inactive,
      dotColor: "bg-muted-foreground/40",
    },
  ]

  return (
    <nav
      id="agents-filters"
      aria-label="Agents filter navigation"
      className="flex h-full w-full flex-col"
    >
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <ul className="flex flex-col gap-0.5">
          {items.map((item) => (
            <FilterNavItem
              key={item.key}
              icon={item.icon}
              label={item.label}
              count={item.count}
              isActive={statusFilter === item.key}
              dotColor={item.dotColor}
              onClick={() => onStatusFilterChange(item.key)}
            />
          ))}
        </ul>

        <div className="mt-4 px-2 pb-1">
          <span className="text-xs font-medium text-muted-foreground">
            Teams
          </span>
        </div>

        <ul className="flex flex-col gap-0.5">
          <FilterNavItem
            icon={UsersIcon}
            label="All teams"
            count={counts.all}
            isActive={teamFilter === "all"}
            onClick={() => onTeamFilterChange("all")}
          />

          {teams.map((team) => (
            <FilterNavItem
              key={team.id}
              icon={UsersIcon}
              label={team.name}
              count={agents.filter((a) => a.agentTeamId === team.id).length}
              isActive={teamFilter === team.id}
              dotColor={team.iconColor ? undefined : "bg-muted-foreground/40"}
              dotStyle={
                team.iconColor ? { backgroundColor: team.iconColor } : undefined
              }
              onClick={() => onTeamFilterChange(team.id)}
              action={
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        aria-label={`Team options for ${team.name}`}
                        className="absolute end-1 top-1/2 -translate-y-1/2 size-6 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground focus-visible:opacity-100 group-hover/item:opacity-100 data-[state=open]:opacity-100"
                      />
                    }
                  >
                    <MoreHorizontalIcon className="size-3.5" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => onEditTeam(team)}>
                      <PencilIcon className="size-4" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={() => onDeleteTeam(team)}
                    >
                      <Trash2Icon className="size-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              }
            />
          ))}

          {unassignedCount > 0 && (
            <FilterNavItem
              icon={UsersIcon}
              label="No team"
              count={unassignedCount}
              isActive={teamFilter === "none"}
              dotColor="bg-muted-foreground/40"
              onClick={() => onTeamFilterChange("none")}
            />
          )}

          {teams.length === 0 && (
            <li className="px-2 py-1.5 text-xs text-muted-foreground">
              No teams yet. Create one to group your agents.
            </li>
          )}
        </ul>
      </div>

      <div className="shrink-0 border-t border-border p-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Total agents</span>
            <span className="font-mono font-semibold tabular-nums">
              {counts.all}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Messages</span>
            <span className="font-mono font-semibold tabular-nums">
              {totalMessages.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </nav>
  )
}

export type { StatusFilter, TeamFilter }
