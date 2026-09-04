"use client"

import { Handle, Position, ReactFlow } from "@xyflow/react"
import type { Edge, Node, NodeProps } from "@xyflow/react"
import {
  BotIcon,
  MessageCircleIcon,
  RadioTowerIcon,
  ShoppingBagIcon,
} from "@/components/ui/icons"
import type { ElementType } from "react"

import "@xyflow/react/dist/style.css"

import { Email } from "@/components/ui/svgs/email"
import { Messenger } from "@/components/ui/svgs/messenger"
import { Telegram } from "@/components/ui/svgs/telegram"
import { cn } from "@/lib/utils"

type WorkflowNodeData = {
  title: string
  description: string
  icon: ElementType<{ className?: string }>
  tone: "trigger" | "agent" | "ai" | "channel"
  handles: {
    target: boolean
    source: boolean
  }
}

type WorkflowFlowNode = Node<WorkflowNodeData, "workflow">

const toneClasses = {
  trigger: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  agent:
    "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  ai: "border-primary/30 bg-primary/10 text-primary",
  channel:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
}

const nodes: WorkflowFlowNode[] = [
  {
    id: "inbound-message",
    type: "workflow",
    position: { x: 0, y: 240 },
    data: {
      title: "Inbound message",
      description: "A customer message arrives.",
      icon: RadioTowerIcon,
      tone: "trigger",
      handles: { target: false, source: true },
    },
  },
  {
    id: "customer-support",
    type: "workflow",
    position: { x: 270, y: 105 },
    data: {
      title: "Customer support",
      description: "Answers account questions.",
      icon: MessageCircleIcon,
      tone: "agent",
      handles: { target: true, source: true },
    },
  },
  {
    id: "sales",
    type: "workflow",
    position: { x: 270, y: 345 },
    data: {
      title: "Sales",
      description: "Qualifies new opportunities.",
      icon: ShoppingBagIcon,
      tone: "agent",
      handles: { target: true, source: true },
    },
  },
  {
    id: "dacoo-ai",
    type: "workflow",
    position: { x: 545, y: 240 },
    data: {
      title: "Dacoo AI",
      description: "Creates a channel-ready reply.",
      icon: BotIcon,
      tone: "ai",
      handles: { target: true, source: true },
    },
  },
  {
    id: "messenger",
    type: "workflow",
    position: { x: 815, y: 55 },
    data: {
      title: "Messenger",
      description: "Delivers the response.",
      icon: Messenger,
      tone: "channel",
      handles: { target: true, source: false },
    },
  },
  {
    id: "telegram",
    type: "workflow",
    position: { x: 815, y: 240 },
    data: {
      title: "Telegram",
      description: "Delivers the response.",
      icon: Telegram,
      tone: "channel",
      handles: { target: true, source: false },
    },
  },
  {
    id: "email",
    type: "workflow",
    position: { x: 815, y: 425 },
    data: {
      title: "Email",
      description: "Delivers the response.",
      icon: Email,
      tone: "channel",
      handles: { target: true, source: false },
    },
  },
]

const activeEdgeStyle = { stroke: "#22c55e", strokeWidth: 1.5 }

const edges: Edge[] = [
  {
    id: "inbound-to-support",
    source: "inbound-message",
    target: "customer-support",
    type: "smoothstep",
    animated: true,
    style: activeEdgeStyle,
  },
  {
    id: "support-to-dacoo",
    source: "customer-support",
    target: "dacoo-ai",
    type: "smoothstep",
    animated: true,
    style: activeEdgeStyle,
  },
  {
    id: "inbound-to-sales",
    source: "inbound-message",
    target: "sales",
    type: "smoothstep",
    style: {
      stroke: "var(--border)",
      strokeWidth: 1.5,
      strokeDasharray: "5 5",
    },
  },
  {
    id: "sales-to-dacoo",
    source: "sales",
    target: "dacoo-ai",
    type: "smoothstep",
    style: {
      stroke: "var(--border)",
      strokeWidth: 1.5,
      strokeDasharray: "5 5",
    },
  },
  ...["messenger", "telegram", "email"].map((target) => ({
    id: `dacoo-to-${target}`,
    source: "dacoo-ai",
    target,
    type: "smoothstep",
    animated: true,
    style: activeEdgeStyle,
  })),
]

function WorkflowCard({ data }: NodeProps<WorkflowFlowNode>) {
  const Icon = data.icon

  return (
    <div className="relative w-48 rounded-xl border bg-background/95 p-3 shadow-sm backdrop-blur-sm">
      {data.handles.target && (
        <Handle
          className="size-2! border-2! border-emerald-500! bg-background!"
          position={Position.Left}
          type="target"
        />
      )}
      <div className="flex items-start gap-2.5">
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-lg border",
            toneClasses[data.tone]
          )}
        >
          <Icon className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            {data.title}
          </p>
          <p className="mt-0.5 line-clamp-2 text-xs leading-4 text-muted-foreground">
            {data.description}
          </p>
        </div>
      </div>
      {data.handles.source && (
        <Handle
          className="size-2! border-2! border-emerald-500! bg-background!"
          position={Position.Right}
          type="source"
        />
      )}
    </div>
  )
}

const nodeTypes = { workflow: WorkflowCard }

export function LoginWorkflowShowcase() {
  return (
    <aside
      aria-hidden="true"
      className="relative hidden min-h-svh overflow-hidden border-l bg-muted/35 lg:flex lg:flex-col"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,var(--border)_1px,transparent_0)] bg-size-[18px_18px] opacity-70" />
      <div className="relative z-10 px-10 pt-10 xl:px-14 xl:pt-14">
        <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1.5 text-sm font-medium shadow-sm backdrop-blur-sm">
          <span className="size-2 rounded-full bg-emerald-500" />
          Dacoo workflows
        </div>
        <h1 className="mt-6 max-w-md text-4xl font-semibold tracking-tight text-balance text-foreground xl:text-5xl">
          One AI. Every customer conversation.
        </h1>
        <p className="mt-4 max-w-lg leading-7 text-pretty text-muted-foreground">
          Dacoo routes every incoming message to the right specialist, then
          prepares a helpful reply for every channel.
        </p>
      </div>

      <div className="relative z-10 mt-auto h-[30rem] min-h-0 flex-1 xl:h-[34rem]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.18, maxZoom: 0.9 }}
          minZoom={0.6}
          maxZoom={0.9}
          nodesDraggable={false}
          nodesConnectable={false}
          nodesFocusable={false}
          edgesFocusable={false}
          elementsSelectable={false}
          panOnDrag={false}
          panOnScroll={false}
          zoomOnDoubleClick={false}
          zoomOnPinch={false}
          zoomOnScroll={false}
          proOptions={{ hideAttribution: true }}
        />
      </div>
    </aside>
  )
}
