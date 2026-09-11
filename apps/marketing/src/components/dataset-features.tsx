"use client"

import { useEffect } from "react"
import {
  useNodesInitialized,
  useReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react"
import {
  BotIcon,
  CheckCircle2Icon,
  DatabaseIcon,
  LayersIcon,
  SearchCheckIcon,
  UploadIcon,
  type LucideIcon,
} from "lucide-react"
import Link from "next/link"

import { Canvas } from "@/components/ai-elements/canvas"
import { Controls } from "@/components/ai-elements/controls"
import { Edge as WorkflowEdge } from "@/components/ai-elements/edge"
import {
  Node as WorkflowNode,
  NodeDescription,
  NodeHeader,
  NodeTitle,
} from "@/components/ai-elements/node"
import { cn } from "@/lib/utils"

type DatasetNodeData = {
  title: string
  description: string
  step: string
  metric: string
  status: string
  icon: LucideIcon
  iconClassName: string
  handles: {
    target: boolean
    source: boolean
  }
}

type DatasetNode = Node<DatasetNodeData, "dataset">

const nodes: DatasetNode[] = [
  {
    id: "sources",
    type: "dataset",
    position: { x: 0, y: 130 },
    data: {
      title: "Source library",
      description: "Product docs, support playbooks, and pricing data.",
      step: "1. Add sources",
      metric: "PDF · CSV · JSON · MD",
      status: "4 file types",
      icon: UploadIcon,
      iconClassName: "bg-violet-100 text-violet-700",
      handles: { target: false, source: true },
    },
  },
  {
    id: "dataset",
    type: "dataset",
    position: { x: 340, y: 130 },
    data: {
      title: "Customer knowledge",
      description: "One dataset shared by the agents that need it.",
      step: "2. Organize",
      metric: "24 documents",
      status: "Ready",
      icon: DatabaseIcon,
      iconClassName: "bg-blue-100 text-blue-700",
      handles: { target: true, source: true },
    },
  },
  {
    id: "index",
    type: "dataset",
    position: { x: 680, y: 130 },
    data: {
      title: "Indexed context",
      description: "Sources are chunked and prepared for retrieval.",
      step: "3. Index",
      metric: "1,320 chunks · 208k tokens",
      status: "Complete",
      icon: LayersIcon,
      iconClassName: "bg-amber-100 text-amber-700",
      handles: { target: true, source: true },
    },
  },
  {
    id: "agent",
    type: "dataset",
    position: { x: 1020, y: 130 },
    data: {
      title: "Herd Agent",
      description: "Answers using the most relevant, connected sources.",
      step: "4. Answer",
      metric: "Grounded response",
      status: "Cited sources",
      icon: BotIcon,
      iconClassName: "bg-emerald-100 text-emerald-700",
      handles: { target: true, source: false },
    },
  },
]

const edges: Edge[] = [
  {
    id: "sources-to-dataset",
    source: "sources",
    target: "dataset",
    type: "animated",
    style: { stroke: "#7c3aed", strokeWidth: 1.5 },
  },
  {
    id: "dataset-to-index",
    source: "dataset",
    target: "index",
    type: "animated",
    style: { stroke: "#7c3aed", strokeWidth: 1.5 },
  },
  {
    id: "index-to-agent",
    source: "index",
    target: "agent",
    type: "animated",
    style: { stroke: "#7c3aed", strokeWidth: 1.5 },
  },
]

function DatasetFlowNode({ data }: NodeProps<DatasetNode>) {
  const Icon = data.icon

  return (
    <div className="relative w-[260px] pt-6">
      <span className="absolute top-0 left-0 z-10 inline-flex items-center gap-1 rounded-md border bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground">
        <Icon className="size-3 text-primary" />
        {data.step}
      </span>
      <WorkflowNode
        handles={data.handles}
        className="w-full rounded-xl border-border bg-background shadow-sm"
      >
        <NodeHeader className="border-b-0 bg-transparent p-3!">
          <div className="flex items-start gap-3">
            <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", data.iconClassName)}>
              <Icon className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <NodeTitle className="text-sm font-medium">{data.title}</NodeTitle>
              <NodeDescription className="mt-1 text-xs leading-4">{data.description}</NodeDescription>
            </div>
          </div>
          <span className="mt-4 flex items-center justify-between gap-2 rounded-md border bg-muted/30 px-2.5 py-2 text-[11px] text-muted-foreground">
            <span className="truncate">{data.metric}</span>
            <span className="flex shrink-0 items-center gap-1 font-medium text-emerald-600">
              <CheckCircle2Icon className="size-3" />
              {data.status}
            </span>
          </span>
        </NodeHeader>
      </WorkflowNode>
    </div>
  )
}

const nodeTypes = { dataset: DatasetFlowNode }
const edgeTypes = { animated: WorkflowEdge.Animated }

function FitDatasetFlow() {
  const nodesInitialized = useNodesInitialized()
  const { fitView } = useReactFlow()

  useEffect(() => {
    if (nodesInitialized) {
      void fitView({ padding: 0.18, minZoom: 0.2, maxZoom: 1 })
    }
  }, [fitView, nodesInitialized])

  return null
}

export function DatasetFeatures() {
  return (
    <section className="flex min-h-0 flex-1 flex-col bg-background px-6 py-6 sm:px-10 sm:py-8 lg:px-14 xl:px-20">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col">
        <header className="max-w-3xl">
          <p className="flex items-center gap-2 text-sm font-medium text-primary">
            <DatabaseIcon className="size-4" /> Knowledge, ready for AI
          </p>
          <h1 className="mt-2 text-balance font-serif text-3xl font-medium tracking-tight sm:text-4xl">
            Turn your documents into <span className="text-muted-foreground">answers your team can trust.</span>
          </h1>
          <p className="mt-3 max-w-2xl text-pretty leading-6 text-muted-foreground">
            Bring every source together, let Herd index the important details, and give every agent the context to answer with confidence.
          </p>
        </header>

        <div className="relative mt-6 min-h-0 flex-1 overflow-hidden rounded-2xl border bg-[radial-gradient(circle_at_1px_1px,var(--border)_1px,transparent_0)] bg-size-[12px_12px]">
          <div className="absolute top-5 right-5 z-10 hidden rounded-full border bg-background/90 px-3 py-1.5 text-xs text-muted-foreground shadow-sm backdrop-blur sm:flex sm:items-center sm:gap-2">
            <SearchCheckIcon className="size-3.5 text-primary" />
            From source to grounded answer
          </div>
          <div className="h-full w-full">
            <Canvas
              className="h-full w-full [&_.react-flow__handle]:size-3 [&_.react-flow__handle]:border-2 [&_.react-flow__handle]:border-primary [&_.react-flow__handle]:bg-background"
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
              fitViewOptions={{ padding: 0.18, minZoom: 0.2, maxZoom: 1 }}
            >
              <FitDatasetFlow />
              <Controls position="bottom-left" showInteractive={false} />
            </Canvas>
          </div>
          <div className="absolute right-5 bottom-5 z-10 hidden sm:block">
            <Link href="#link" className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80">
              Start building
            </Link>
          </div>
        </div>
        <Link href="#link" className="mt-5 inline-flex h-9 w-fit items-center justify-center rounded-md bg-primary px-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80 sm:hidden">
          Start building
        </Link>
      </div>
    </section>
  )
}
