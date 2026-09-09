"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import type { NodeProps } from "@xyflow/react"
import { Handle, Position } from "@xyflow/react"
import {
  AlertCircleIcon,
  BotIcon,
  CheckCircle2Icon,
  ClockIcon,
  CopyIcon,
  FileEditIcon,
  FilePlusIcon,
  FolderPlusIcon,
  GitBranchIcon,
  LayersIcon,
  Loader2Icon,
  MessageSquareIcon,
  PhoneIcon,
  PlusIcon,
  RadioTowerIcon,
  SendIcon,
  SparklesIcon,
  TerminalIcon,
  Trash2Icon,
  TruckIcon,
  UserPlusIcon,
} from "lucide-react"
import type { ElementType } from "react"

const iconMap: Record<string, ElementType<{ className?: string }>> = {
  RadioTower: RadioTowerIcon,
  Bot: BotIcon,
  FilePlus: FilePlusIcon,
  FileEdit: FileEditIcon,
  FolderPlus: FolderPlusIcon,
  GitBranch: GitBranchIcon,
  Send: SendIcon,
  Sparkles: SparklesIcon,
  Truck: TruckIcon,
  UserPlus: UserPlusIcon,
  Clock: ClockIcon,
  Terminal: TerminalIcon,
  MessageSquare: MessageSquareIcon,
  Phone: PhoneIcon,
  Layers: LayersIcon,
}

export type WorkflowCardData = {
  title: string
  description?: string
  category?: string
  typeLabel?: string
  typeClassName?: string
  icon?: string
  iconClassName?: string
  tone: "trigger" | "action" | "condition" | "ai" | "channel"
  handles?: {
    target?: boolean
    source?: boolean
    condition?: boolean
  }
  config?: Record<string, unknown>
  status?: "pending" | "running" | "success" | "failed"
  onDuplicate?: (id: string) => void
  onDelete?: (id: string) => void
  onAddStep?: (
    parentId: string,
    stepType: "action" | "condition" | "ai" | "channel",
    branchId?: "true" | "false"
  ) => void
}

export type WorkflowFlowNode = import("@xyflow/react").Node<
  WorkflowCardData,
  "workflow"
>

const toneTabStyles: Record<WorkflowCardData["tone"], string> = {
  trigger:
    "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-900/60",
  action:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900/60",
  condition:
    "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-900/60",
  ai: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-900/60",
  channel:
    "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-900/60",
}

const toneTabIcons: Record<
  WorkflowCardData["tone"],
  ElementType<{ className?: string }>
> = {
  trigger: RadioTowerIcon,
  action: FilePlusIcon,
  condition: GitBranchIcon,
  ai: BotIcon,
  channel: SendIcon,
}

const defaultTypeLabels: Record<WorkflowCardData["tone"], string> = {
  trigger: "Trigger",
  action: "Action",
  condition: "Condition",
  ai: "AI Agent",
  channel: "Channel",
}

const defaultCategories: Record<WorkflowCardData["tone"], string> = {
  trigger: "Triggers",
  action: "Records",
  condition: "Logic",
  ai: "AI",
  channel: "Messaging",
}

export function WorkflowCard({
  id,
  data,
  selected,
}: NodeProps<WorkflowFlowNode>) {
  const nodeData = data
  const tone = nodeData.tone || "action"
  const IconComponent =
    (nodeData.icon ? iconMap[nodeData.icon] : null) ??
    toneTabIcons[tone] ??
    RadioTowerIcon
  const TabIcon = toneTabIcons[tone] ?? RadioTowerIcon

  return (
    <div className="group/node relative w-[285px] pt-6 select-none">
      {/* Top Attached Folder Tab */}
      <div
        className={cn(
          "absolute top-0 left-0 z-10 inline-flex items-center gap-1.5 rounded-t-lg border-t border-x px-2.5 py-1 text-xs font-medium transition-colors",
          toneTabStyles[tone]
        )}
      >
        <TabIcon className="size-3.5" aria-hidden="true" />
        <span>{nodeData.typeLabel || defaultTypeLabels[tone]}</span>
      </div>

      {/* Top Right Quick Actions and Status */}
      <div className="absolute top-0.5 right-0 z-20 flex items-center gap-1">
        {nodeData.status === "running" && (
          <span className="inline-flex items-center gap-1 rounded-md bg-sky-100 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 text-[10px] px-2 py-0.5 font-medium">
            <Loader2Icon className="size-3 animate-spin" />
            Running
          </span>
        )}
        {nodeData.status === "success" && (
          <CheckCircle2Icon className="size-4 text-emerald-600" />
        )}
        {nodeData.status === "failed" && (
          <AlertCircleIcon className="size-4 text-destructive" />
        )}

        <div className="hidden items-center gap-0.5 group-hover/node:flex">
          {nodeData.onDuplicate && (
            <button
              type="button"
              className="size-5 rounded-md border border-border bg-background text-muted-foreground hover:text-foreground flex items-center justify-center cursor-pointer shadow-2xs nodrag"
              aria-label="Duplicate step"
              onClick={(e) => {
                e.stopPropagation()
                nodeData.onDuplicate?.(id)
              }}
            >
              <CopyIcon className="size-3" />
            </button>
          )}
          {nodeData.onDelete && (
            <button
              type="button"
              className="size-5 rounded-md border border-border bg-background text-muted-foreground hover:text-destructive flex items-center justify-center cursor-pointer shadow-2xs nodrag"
              aria-label="Delete step"
              onClick={(e) => {
                e.stopPropagation()
                nodeData.onDelete?.(id)
              }}
            >
              <Trash2Icon className="size-3" />
            </button>
          )}
        </div>
      </div>

      {/* Main Node Card Body matching Attio */}
      <div
        className={cn(
          "w-full rounded-xl rounded-tl-none border border-border bg-card p-3 shadow-2xs transition-all duration-150 cursor-pointer",
          selected
            ? "ring-2 ring-sky-500/40 border-sky-500 dark:border-sky-400"
            : "hover:border-border/80 hover:shadow-xs",
          nodeData.status === "running" && "ring-2 ring-sky-500/40 border-sky-500",
          nodeData.status === "failed" && "ring-2 ring-destructive/40 border-destructive"
        )}
      >
        {/* Incoming Target Handle (Top Center) */}
        {nodeData.handles?.target !== false && tone !== "trigger" && (
          <Handle
            type="target"
            position={Position.Top}
            className="size-3 rounded-full border-2 border-slate-300 dark:border-slate-600 bg-background transition-colors hover:border-sky-500"
          />
        )}

        {/* Top Row: Event Icon + Title + Category Badge */}
        <div className="flex items-center gap-2.5 justify-between">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-md text-xs",
                nodeData.iconClassName || "bg-muted text-foreground"
              )}
            >
              <IconComponent className="size-3.5" aria-hidden="true" />
            </div>
            <span className="font-semibold text-sm text-foreground tracking-tight truncate">
              {nodeData.title}
            </span>
          </div>

          <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-muted/60 text-muted-foreground border border-border/50 shrink-0">
            {nodeData.category || defaultCategories[tone]}
          </span>
        </div>

        {/* Hairline Divider */}
        <div className="border-b border-border/50 my-2.5" />

        {/* Description Row */}
        <div className="text-xs leading-normal">
          {nodeData.description ? (
            <p className="text-muted-foreground line-clamp-2">
              {nodeData.description}
            </p>
          ) : (
            <p className="text-muted-foreground/60 italic">No description</p>
          )}
        </div>
      </div>

      {/* Outgoing Source Handle for Normal Nodes (Bottom Center) */}
      {nodeData.handles?.source !== false && !nodeData.handles?.condition && (
        <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 flex flex-col items-center z-20">
          <Handle
            type="source"
            position={Position.Bottom}
            className="relative! left-auto! top-auto! translate-x-0! translate-y-0! size-3 rounded-full border-2 border-slate-300 dark:border-slate-600 bg-background transition-colors hover:border-sky-500"
          />
          <div className="w-px h-1.5 bg-border" />
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  className="size-5 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-xs cursor-pointer hover:scale-110 transition-transform nodrag"
                  aria-label="Add next step"
                  onClick={(e) => e.stopPropagation()}
                >
                  <PlusIcon className="size-3 stroke-[2.5]" />
                </button>
              }
            />
            <DropdownMenuContent
              align="center"
              side="bottom"
              sideOffset={4}
              className="w-52 nodrag"
            >
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Add next step
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => nodeData.onAddStep?.(id, "action")}
                className="gap-2 cursor-pointer text-xs"
              >
                <FilePlusIcon className="size-4 text-emerald-600" />
                <div className="flex flex-col">
                  <span className="font-medium text-xs">Record Action</span>
                  <span className="text-[10px] text-muted-foreground">
                    Create or update records
                  </span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => nodeData.onAddStep?.(id, "condition")}
                className="gap-2 cursor-pointer text-xs"
              >
                <GitBranchIcon className="size-4 text-violet-600" />
                <div className="flex flex-col">
                  <span className="font-medium text-xs">Condition Branch</span>
                  <span className="text-[10px] text-muted-foreground">
                    True / False routing
                  </span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => nodeData.onAddStep?.(id, "ai")}
                className="gap-2 cursor-pointer text-xs"
              >
                <BotIcon className="size-4 text-purple-600" />
                <div className="flex flex-col">
                  <span className="font-medium text-xs">AI Agent</span>
                  <span className="text-[10px] text-muted-foreground">
                    Structured prompt & extraction
                  </span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => nodeData.onAddStep?.(id, "channel")}
                className="gap-2 cursor-pointer text-xs"
              >
                <SendIcon className="size-4 text-cyan-600" />
                <div className="flex flex-col">
                  <span className="font-medium text-xs">Channel Message</span>
                  <span className="text-[10px] text-muted-foreground">
                    Telegram, Messenger, Viber
                  </span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Outgoing Source Handles for Condition (If/Else) Nodes */}
      {nodeData.handles?.condition && (
        <div className="absolute -bottom-9 left-0 right-0 flex items-center justify-around z-20 px-4">
          {/* True Branch */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mb-0.5">
              True
            </span>
            <Handle
              id="true"
              type="source"
              position={Position.Bottom}
              className="relative! left-auto! top-auto! translate-x-0! translate-y-0! size-3 rounded-full border-2 border-emerald-500 bg-background"
            />
            <div className="w-px h-1.5 bg-emerald-500/40" />
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    className="size-4.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-xs cursor-pointer hover:scale-110 transition-transform nodrag"
                    aria-label="Add step if true"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <PlusIcon className="size-2.5 stroke-[2.5]" />
                  </button>
                }
              />
              <DropdownMenuContent
                align="center"
                side="bottom"
                sideOffset={4}
                className="w-52 nodrag"
              >
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Add step if True
                </DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => nodeData.onAddStep?.(id, "action", "true")}
                  className="gap-2 cursor-pointer text-xs"
                >
                  <FilePlusIcon className="size-4 text-emerald-600" />
                  <span>Record Action</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => nodeData.onAddStep?.(id, "condition", "true")}
                  className="gap-2 cursor-pointer text-xs"
                >
                  <GitBranchIcon className="size-4 text-violet-600" />
                  <span>Condition Branch</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => nodeData.onAddStep?.(id, "ai", "true")}
                  className="gap-2 cursor-pointer text-xs"
                >
                  <BotIcon className="size-4 text-purple-600" />
                  <span>AI Agent</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => nodeData.onAddStep?.(id, "channel", "true")}
                  className="gap-2 cursor-pointer text-xs"
                >
                  <SendIcon className="size-4 text-cyan-600" />
                  <span>Channel Message</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* False Branch */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 mb-0.5">
              False
            </span>
            <Handle
              id="false"
              type="source"
              position={Position.Bottom}
              className="relative! left-auto! top-auto! translate-x-0! translate-y-0! size-3 rounded-full border-2 border-rose-500 bg-background"
            />
            <div className="w-px h-1.5 bg-rose-500/40" />
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    className="size-4.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-xs cursor-pointer hover:scale-110 transition-transform nodrag"
                    aria-label="Add step if false"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <PlusIcon className="size-2.5 stroke-[2.5]" />
                  </button>
                }
              />
              <DropdownMenuContent
                align="center"
                side="bottom"
                sideOffset={4}
                className="w-52 nodrag"
              >
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Add step if False
                </DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => nodeData.onAddStep?.(id, "action", "false")}
                  className="gap-2 cursor-pointer text-xs"
                >
                  <FilePlusIcon className="size-4 text-emerald-600" />
                  <span>Record Action</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => nodeData.onAddStep?.(id, "condition", "false")}
                  className="gap-2 cursor-pointer text-xs"
                >
                  <GitBranchIcon className="size-4 text-violet-600" />
                  <span>Condition Branch</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => nodeData.onAddStep?.(id, "ai", "false")}
                  className="gap-2 cursor-pointer text-xs"
                >
                  <BotIcon className="size-4 text-purple-600" />
                  <span>AI Agent</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => nodeData.onAddStep?.(id, "channel", "false")}
                  className="gap-2 cursor-pointer text-xs"
                >
                  <SendIcon className="size-4 text-cyan-600" />
                  <span>Channel Message</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}
    </div>
  )
}
