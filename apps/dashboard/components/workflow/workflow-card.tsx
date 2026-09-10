"use client"

import { Badge } from "@/components/reui/badge"
import {
  Frame,
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { TypographyMuted } from "@/components/ui/typography"
import { cn } from "@/lib/utils"
import type { NodeProps } from "@xyflow/react"
import { Handle, Position, useNodeConnections } from "@xyflow/react"
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
  PlayIcon,
  PlusIcon,
  RadioTowerIcon,
  SendIcon,
  SettingsIcon,
  SparklesIcon,
  TerminalIcon,
  Trash2Icon,
  TruckIcon,
  UserPlusIcon,
} from "lucide-react"
import type { ElementType } from "react"

import {
  getProviderLabel,
  isNodeSetupComplete,
  type WorkflowBranchId,
  type WorkflowTone,
} from "./workflow-node-utils"

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
  tone: WorkflowTone
  handles?: {
    target?: boolean
    source?: boolean
    condition?: boolean
  }
  config?: Record<string, unknown>
  status?: "pending" | "running" | "success" | "failed"
  // Transient callbacks — injected on render, never persisted through the API.
  onDuplicate?: (id: string) => void
  onDelete?: (id: string) => void
  onAddStep?: (parentId: string, branchId?: WorkflowBranchId) => void
  onConfigure?: (id: string) => void
  onTestRun?: (id: string) => void
}

export type WorkflowFlowNode = import("@xyflow/react").Node<
  WorkflowCardData,
  "workflow"
>

const toneBadgeStyles: Record<WorkflowTone, string> = {
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

const toneBadgeIcons: Record<
  WorkflowTone,
  ElementType<{ className?: string }>
> = {
  trigger: RadioTowerIcon,
  action: FilePlusIcon,
  condition: GitBranchIcon,
  ai: BotIcon,
  channel: SendIcon,
}

const defaultTypeLabels: Record<WorkflowTone, string> = {
  trigger: "Trigger",
  action: "Action",
  condition: "Condition",
  ai: "AI Agent",
  channel: "Channel",
}

/** Shown on hover or keyboard focus anywhere inside the node. */
const revealOnHoverClassName =
  "pointer-events-none opacity-0 transition-opacity group-hover/node:pointer-events-auto group-hover/node:opacity-100 group-focus-within/node:pointer-events-auto group-focus-within/node:opacity-100"

const handleClassName =
  "size-3.5 rounded-full border-2 border-slate-300 bg-background transition-colors hover:border-sky-500 dark:border-slate-600 shadow-2xs"

export function WorkflowCard({
  id,
  data,
  selected,
}: NodeProps<WorkflowFlowNode>) {
  const nodeData = data
  const tone = nodeData.tone || "action"
  const IconComponent =
    (nodeData.icon ? iconMap[nodeData.icon] : null) ??
    toneBadgeIcons[tone] ??
    RadioTowerIcon
  const BadgeIcon = toneBadgeIcons[tone] ?? RadioTowerIcon

  const isCondition = Boolean(nodeData.handles?.condition)
  const hasTarget = nodeData.handles?.target !== false && tone !== "trigger"
  const hasSource = nodeData.handles?.source !== false
  const needsSetup = !isNodeSetupComplete(tone, nodeData.config)
  const providerLabel = getProviderLabel(
    tone,
    nodeData.config,
    nodeData.category
  )

  // Branch outputs keep their own Add control only while nothing is wired to
  // them; a connected branch is extended from the child's own rail instead.
  const sourceConnections = useNodeConnections({ id, handleType: "source" })
  const isBranchConnected = (branchId: WorkflowBranchId) =>
    sourceConnections.some((connection) => connection.sourceHandle === branchId)

  const openInspector = () => nodeData.onConfigure?.(id)

  return (
    <div className="group/node relative w-75 select-none">
      {tone === "trigger" && nodeData.onTestRun ? (
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant="outline"
                className="nodrag group/badge absolute -top-9 z-20"
                aria-label="Run trigger with mock data"
                onClick={(event) => {
                  event.stopPropagation()
                  nodeData.onTestRun?.(id)
                }}
              >
                <BadgeIcon
                  className="size-3 group-hover/badge:hidden"
                  aria-hidden="true"
                />
                <PlayIcon
                  className="hidden size-3 fill-emerald-600 text-emerald-600 group-hover/badge:inline-block dark:fill-emerald-400 dark:text-emerald-400"
                  aria-hidden="true"
                />
                {nodeData.typeLabel || defaultTypeLabels[tone]}
              </Button>
            }
          />
          <TooltipContent side="top">
            {nodeData.description && (
              <TypographyMuted className="text-[11px] opacity-80">
                {nodeData.description}
              </TypographyMuted>
            )}
          </TooltipContent>
        </Tooltip>
      ) : (
        <Badge
          variant="outline"
          className={cn(
            "pointer-events-none absolute -top-6 left-1 z-20",
            toneBadgeStyles[tone]
          )}
        >
          <BadgeIcon className="size-3" aria-hidden="true" />
          <span>{nodeData.typeLabel || defaultTypeLabels[tone]}</span>
        </Badge>
      )}

      {/* Action rail (reveals on hover/focus) */}
      <ButtonGroup
        orientation="vertical"
        className={cn(
          "nodrag absolute top-1 -right-8 z-20",
          revealOnHoverClassName
        )}
      >
        {(nodeData.onConfigure ||
          (nodeData.onAddStep && hasSource && !isCondition) ||
          nodeData.onDuplicate) && (
          <ButtonGroup orientation="vertical">
            {nodeData.onConfigure && (
              <Button
                type="button"
                variant="outline"
                size="icon-xs"
                aria-label="Configure this step"
                onClick={(event) => {
                  event.stopPropagation()
                  nodeData.onConfigure?.(id)
                }}
              >
                <SettingsIcon className="size-3" />
              </Button>
            )}
            {nodeData.onAddStep && hasSource && !isCondition && (
              <Button
                type="button"
                variant="outline"
                size="icon-xs"
                aria-label="Add next step"
                onClick={(event) => {
                  event.stopPropagation()
                  nodeData.onAddStep?.(id)
                }}
              >
                <PlusIcon className="size-3" />
              </Button>
            )}
            {nodeData.onDuplicate && (
              <Button
                type="button"
                variant="outline"
                size="icon-xs"
                aria-label="Duplicate step"
                onClick={(event) => {
                  event.stopPropagation()
                  nodeData.onDuplicate?.(id)
                }}
              >
                <CopyIcon className="size-3" />
              </Button>
            )}
          </ButtonGroup>
        )}
        {nodeData.onDelete && (
          <ButtonGroup>
            <Button
              type="button"
              variant="outline"
              size="icon-xs"
              aria-label="Delete step"
              onClick={(event) => {
                event.stopPropagation()
                nodeData.onDelete?.(id)
              }}
            >
              <Trash2Icon className="size-3" />
            </Button>
          </ButtonGroup>
        )}
      </ButtonGroup>

      {/* Frame matching the provided Pattern */}
      <Frame
        role="button"
        spacing="xs"
        tabIndex={0}
        aria-label={nodeData.title}
        onClick={openInspector}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            openInspector()
          }
        }}
        className={cn(
          "w-full max-w-sm cursor-pointer bg-muted/50 outline-hidden",
          selected && "border-ring ring-1 ring-ring",
          nodeData.status === "running" && "border-sky-500",
          nodeData.status === "failed" && "border-destructive"
        )}
      >
        {hasTarget && (
          <Handle
            type="target"
            position={Position.Left}
            className={handleClassName}
          />
        )}

        <FrameHeader>
          <FrameTitle className="truncate text-sm font-medium">
            {nodeData.title}
          </FrameTitle>
        </FrameHeader>

        <FramePanel>
          {nodeData.description ? (
            <p className="text-muted-foreground text-xs line-clamp-2">
              {nodeData.description}
            </p>
          ) : needsSetup ? (
            <p className="text-muted-foreground/60 text-xs italic">
              Requires configuration
            </p>
          ) : (
            <p className="text-muted-foreground/60 text-xs italic">
              Step ready
            </p>
          )}
        </FramePanel>

        <FrameFooter>
          <div className="flex items-center justify-between">
            <Badge variant="secondary">
              <IconComponent
                className={cn("size-3 shrink-0", nodeData.iconClassName)}
                aria-hidden="true"
              />
              <span className="truncate">{providerLabel}</span>
            </Badge>
            {nodeData.status === "running" && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-600">
                <Loader2Icon className="size-3.5 animate-spin" />
                Running
              </span>
            )}
            {nodeData.status === "success" && (
              <CheckCircle2Icon className="size-3.5 text-emerald-600" />
            )}
            {nodeData.status === "failed" && (
              <AlertCircleIcon className="size-3.5 text-destructive" />
            )}
          </div>
        </FrameFooter>

        {hasSource && !isCondition && (
          <Handle
            type="source"
            position={Position.Right}
            className={handleClassName}
          />
        )}

        {isCondition && (
          <>
            <Handle
              id="true"
              type="source"
              position={Position.Right}
              style={{ top: "35%" }}
              className={cn(handleClassName, "border-emerald-500")}
            />
            <Handle
              id="false"
              type="source"
              position={Position.Right}
              style={{ top: "65%" }}
              className={cn(handleClassName, "border-rose-500")}
            />
          </>
        )}
      </Frame>

      {/* Branch labels and Add controls for unconnected condition outputs */}
      {isCondition && (
        <>
          <div
            style={{ top: "35%", right: "-2.5rem" }}
            className="pointer-events-none absolute z-20 flex -translate-y-1/2 items-center gap-1"
          >
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              True
            </span>
            {!isBranchConnected("true") && nodeData.onAddStep && (
              <Button
                type="button"
                variant="outline"
                size="icon-xs"
                className="nodrag pointer-events-auto size-5 shadow-2xs hover:text-emerald-600"
                aria-label="Add step if true"
                onClick={(event) => {
                  event.stopPropagation()
                  nodeData.onAddStep?.(id, "true")
                }}
              >
                <PlusIcon className="size-3" />
              </Button>
            )}
          </div>
          <div
            style={{ top: "65%", right: "-2.5rem" }}
            className="pointer-events-none absolute z-20 flex -translate-y-1/2 items-center gap-1"
          >
            <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400">
              False
            </span>
            {!isBranchConnected("false") && nodeData.onAddStep && (
              <Button
                type="button"
                variant="outline"
                size="icon-xs"
                className="nodrag pointer-events-auto size-5 shadow-2xs hover:text-rose-600"
                aria-label="Add step if false"
                onClick={(event) => {
                  event.stopPropagation()
                  nodeData.onAddStep?.(id, "false")
                }}
              >
                <PlusIcon className="size-3" />
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
