"use client"

import {
  Canvas,
} from "@/components/ai-elements/canvas"
import { Controls } from "@/components/ai-elements/controls"
import { Edge as WorkflowEdge } from "@/components/ai-elements/edge"
import {
  Node as WorkflowNode,
  NodeDescription,
  NodeHeader,
  NodeTitle,
} from "@/components/ai-elements/node"
import { Email } from "@/components/ui/svgs/email"
import { Messenger } from "@/components/ui/svgs/messenger"
import { Telegram } from "@/components/ui/svgs/telegram"
import { Tiktok } from "@/components/ui/svgs/tiktok"
import { Viber } from "@/components/ui/svgs/viber"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Edge, Node, NodeProps } from "@xyflow/react"
import Link from "next/link"
import type { ElementType } from "react"
import {
  BadgeDollarSignIcon,
  BotIcon,
  CalendarCheckIcon,
  MessageCircleIcon,
  RadioTowerIcon,
  ReceiptTextIcon,
  StethoscopeIcon,
} from "lucide-react"

type WorkflowIcon = ElementType<{ className?: string }>

type WorkflowNodeData = {
  title: string
  description: string
  typeLabel: string
  typeClassName: string
  icon: WorkflowIcon
  iconClassName: string
  handles: {
    target: boolean
    source: boolean
  }
}

type ManionNode = Node<WorkflowNodeData, "workflow">

const nodes: ManionNode[] = [
  {
    id: "inbound-message",
    type: "workflow",
    position: { x: 0, y: 250 },
    data: {
      title: "Inbound message",
      description: "Receive and normalize a customer message.",
      typeLabel: "Trigger",
      typeClassName: "border-blue-200 bg-blue-50 text-blue-700",
      icon: RadioTowerIcon,
      iconClassName: "bg-sky-100 text-sky-700",
      handles: { target: false, source: true },
    },
  },
  {
    id: "customer-support",
    type: "workflow",
    position: { x: 360, y: 0 },
    data: {
      title: "Customer Support",
      description: "Resolve account and product questions.",
      typeLabel: "Custom agent",
      typeClassName: "border-amber-200 bg-amber-50 text-amber-700",
      icon: MessageCircleIcon,
      iconClassName: "bg-amber-100 text-amber-700",
      handles: { target: true, source: true },
    },
  },
  {
    id: "clinic-services",
    type: "workflow",
    position: { x: 360, y: 125 },
    data: {
      title: "Clinic Services",
      description: "Coordinate care requests and appointments.",
      typeLabel: "Custom agent",
      typeClassName: "border-amber-200 bg-amber-50 text-amber-700",
      icon: StethoscopeIcon,
      iconClassName: "bg-amber-100 text-amber-700",
      handles: { target: true, source: true },
    },
  },
  {
    id: "sales",
    type: "workflow",
    position: { x: 360, y: 250 },
    data: {
      title: "Sales",
      description: "Qualify leads and move opportunities forward.",
      typeLabel: "Custom agent",
      typeClassName: "border-amber-200 bg-amber-50 text-amber-700",
      icon: BadgeDollarSignIcon,
      iconClassName: "bg-amber-100 text-amber-700",
      handles: { target: true, source: true },
    },
  },
  {
    id: "booking",
    type: "workflow",
    position: { x: 360, y: 375 },
    data: {
      title: "Booking",
      description: "Manage reservations and schedule changes.",
      typeLabel: "Custom agent",
      typeClassName: "border-amber-200 bg-amber-50 text-amber-700",
      icon: CalendarCheckIcon,
      iconClassName: "bg-amber-100 text-amber-700",
      handles: { target: true, source: true },
    },
  },
  {
    id: "billing",
    type: "workflow",
    position: { x: 360, y: 500 },
    data: {
      title: "Billing",
      description: "Handle invoices, payments, and account updates.",
      typeLabel: "Custom agent",
      typeClassName: "border-amber-200 bg-amber-50 text-amber-700",
      icon: ReceiptTextIcon,
      iconClassName: "bg-amber-100 text-amber-700",
      handles: { target: true, source: true },
    },
  },
  {
    id: "manion-ai",
    type: "workflow",
    position: { x: 720, y: 250 },
    data: {
      title: "Dacoo",
      description: "Prepare channel-ready replies with the specialist context.",
      typeLabel: "AI agent",
      typeClassName: "border-violet-200 bg-violet-50 text-violet-700",
      icon: BotIcon,
      iconClassName: "bg-violet-100 text-violet-700",
      handles: { target: true, source: true },
    },
  },
  {
    id: "messenger",
    type: "workflow",
    position: { x: 1080, y: 0 },
    data: {
      title: "Messenger",
      description: "Route the reply to Messenger.",
      typeLabel: "Channel",
      typeClassName: "border-blue-200 bg-blue-50 text-blue-700",
      icon: Messenger,
      iconClassName: "bg-blue-100 text-blue-700",
      handles: { target: true, source: false },
    },
  },
  {
    id: "viber",
    type: "workflow",
    position: { x: 1080, y: 125 },
    data: {
      title: "Viber",
      description: "Deliver the reply to the Viber conversation.",
      typeLabel: "Channel",
      typeClassName: "border-purple-200 bg-purple-50 text-purple-700",
      icon: Viber,
      iconClassName: "bg-purple-100 text-purple-700",
      handles: { target: true, source: false },
    },
  },
  {
    id: "tiktok",
    type: "workflow",
    position: { x: 1080, y: 250 },
    data: {
      title: "TikTok",
      description: "Send the response through TikTok.",
      typeLabel: "Channel",
      typeClassName: "border-slate-200 bg-slate-50 text-slate-700",
      icon: Tiktok,
      iconClassName: "bg-slate-100 text-slate-700",
      handles: { target: true, source: false },
    },
  },
  {
    id: "telegram",
    type: "workflow",
    position: { x: 1080, y: 375 },
    data: {
      title: "Telegram",
      description: "Send the response through Telegram.",
      typeLabel: "Channel",
      typeClassName: "border-cyan-200 bg-cyan-50 text-cyan-700",
      icon: Telegram,
      iconClassName: "bg-cyan-100 text-cyan-700",
      handles: { target: true, source: false },
    },
  },
  {
    id: "email",
    type: "workflow",
    position: { x: 1080, y: 500 },
    data: {
      title: "Email",
      description: "Deliver the reply by email.",
      typeLabel: "Channel",
      typeClassName: "border-rose-200 bg-rose-50 text-rose-700",
      icon: Email,
      iconClassName: "bg-rose-100 text-rose-700",
      handles: { target: true, source: false },
    },
  },
]

const activeEdgeStyle = { stroke: "#22c55e", strokeWidth: 1.5 }
const inactiveCustomAgentIds = ["clinic-services", "sales", "booking", "billing"]

const edges: Edge[] = [
  {
    id: "inbound-to-customer-support",
    source: "inbound-message",
    target: "customer-support",
    type: "animated",
    style: activeEdgeStyle,
  },
  {
    id: "customer-support-to-manion",
    source: "customer-support",
    target: "manion-ai",
    type: "animated",
    style: activeEdgeStyle,
  },
  ...inactiveCustomAgentIds.flatMap((agentId) => [
    {
      id: `inbound-to-${agentId}`,
      source: "inbound-message",
      target: agentId,
      type: "temporary",
    },
    {
      id: `${agentId}-to-manion`,
      source: agentId,
      target: "manion-ai",
      type: "temporary",
    },
  ]),
  ...["messenger", "viber", "tiktok", "telegram", "email"].map((target) => ({
    id: `manion-to-${target}`,
    source: "manion-ai",
    target,
    type: "animated",
    style: activeEdgeStyle,
  })),
]

function WorkflowCard({ data }: NodeProps<ManionNode>) {
  const Icon = data.icon

  return (
    <div className="relative w-[280px] pt-6">
      <div className={cn("absolute top-0 left-0 z-10 inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium", data.typeClassName)}>
        <Icon className="size-3" />
        {data.typeLabel}
      </div>
      <WorkflowNode
        handles={data.handles}
        className="w-full rounded-xl border-emerald-500 bg-background shadow-none"
      >
        <NodeHeader className="border-b-0 bg-transparent p-3!">
          <div className="flex items-start gap-3">
            <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", data.iconClassName)}>
              <Icon className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <NodeTitle className="truncate text-sm font-medium">{data.title}</NodeTitle>
              <NodeDescription className="mt-1 truncate text-xs leading-4">
                {data.description}
              </NodeDescription>
            </div>
          </div>
        </NodeHeader>
      </WorkflowNode>
    </div>
  )
}

const nodeTypes = { workflow: WorkflowCard }
const edgeTypes = {
  animated: WorkflowEdge.Animated,
  temporary: WorkflowEdge.Temporary,
}

export function ManionWorkflow() {
  return (
    <section className="grid h-full min-h-[620px] flex-1 border-t bg-background lg:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.2fr)]">
      <div className="flex flex-col justify-center border-b bg-[radial-gradient(circle_at_1px_1px,var(--border)_1px,transparent_0)] bg-size-[18px_18px] px-8 py-16 sm:px-12 lg:border-r lg:border-b-0 lg:px-14 xl:px-20">
        <div className="max-w-sm">
          <span className="inline-flex rounded-full border bg-background px-3 py-1 text-sm font-medium">
            Dacoo workflows
          </span>
          <h1 className="mt-8 text-balance font-serif text-4xl font-medium tracking-tight sm:text-5xl">
            One AI. Every customer conversation.
          </h1>
          <p className="mt-5 text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
            Dacoo selects the right specialist for every incoming conversation, then prepares and delivers the reply across every channel.
          </p>
          <Button
            className="mt-8"
            render={<Link href="/contact" />}
            nativeButton={false}
          >
            Talk to sales
          </Button>
        </div>
      </div>
      <div className="relative min-h-[620px] overflow-hidden">
        <Canvas
          className="h-full w-full [&_.react-flow__handle]:size-3 [&_.react-flow__handle]:border-2 [&_.react-flow__handle]:border-emerald-500 [&_.react-flow__handle]:bg-background"
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          deleteKeyCode={null}
          edgesFocusable={false}
          elementsSelectable={false}
          nodesConnectable={false}
          nodesDraggable={false}
          nodesFocusable={false}
          panOnDrag
          selectionOnDrag={false}
          minZoom={0.2}
          fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
        >
          <Controls position="bottom-left" showInteractive={false} />
        </Canvas>
      </div>
    </section>
  )
}
