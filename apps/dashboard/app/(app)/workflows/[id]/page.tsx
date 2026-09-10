"use client"

import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Canvas } from "@/components/workflow/canvas"
import { CanvasEmptyState } from "@/components/workflow/canvas-empty-state"
import { Controls } from "@/components/workflow/controls"
import { Edge, type WorkflowEdgeData } from "@/components/workflow/edge"
import {
  TemplateGalleryDialog,
} from "@/components/workflow/template-gallery-dialog"
import {
  WorkflowBlockSelectionSidebar,
  type StepDefinition,
  type TriggerDefinition,
} from "@/components/workflow/trigger-selection-sidebar"
import {
  WorkflowCard,
  type WorkflowCardData,
} from "@/components/workflow/workflow-card"
import {
  attachNodeCallbacks,
  getChildNodePosition,
  isLegacyHorizontalLayout,
  layoutNodesTopToBottom,
  ROOT_NODE_POSITION,
} from "@/components/workflow/workflow-node-utils"
import { WorkflowRunsList } from "@/components/workflow/workflow-history"
import { WorkflowInspectorDialog } from "@/components/workflow/workflow-inspector"
import { WorkflowTestRunModal } from "@/components/workflow/workflow-test-modal"
import { useActiveOrganization } from "@/hooks/use-active-organization"
import { apiFetch } from "@/lib/api"
import { cn } from "@/lib/utils"
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type Node,
  type NodeChange,
  type NodeTypes,
  type Edge as ReactFlowEdge,
} from "@xyflow/react"
import {
  ArrowDownIcon,
  CopyIcon,
  HistoryIcon,
  InfoIcon,
  Loader2Icon,
  PlayIcon,
  PlusIcon,
  SaveIcon,
  SettingsIcon,
  Share2Icon,
  StarIcon,
  Trash2Icon,
  WorkflowIcon,
} from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

const nodeTypes: NodeTypes = {
  workflow: WorkflowCard as unknown as NodeTypes[string],
}
const edgeTypes = {
  animated: Edge.Animated,
  temporary: Edge.Temporary,
}

type WorkflowDetailResponse = {
  id: string
  name: string
  description?: string
  is_active: boolean
  webhook_url?: string | null
  nodes?: Node<WorkflowCardData>[]
  edges?: ReactFlowEdge[]
}

type StepInsertionTarget = {
  parentId?: string
  branchId?: "true" | "false"
}

export default function WorkflowBuilderPage() {
  const params = useParams()
  const router = useRouter()
  const workflowId = params.id as string
  const activeOrg = useActiveOrganization()

  // Tabs state
  const [activeTab, setActiveTab] = useState<"editor" | "runs" | "settings">("editor")

  // Core workflow metadata
  const [workflowName, setWorkflowName] = useState("Untitled Workflow")
  const [description, setDescription] = useState("")
  const [isActive, setIsActive] = useState(false)
  const [webhookUrl, setWebhookUrl] = useState<string | null>(null)
  const [isFavorite, setIsFavorite] = useState(false)

  // Canvas graph state
  const [nodes, setNodes] = useState<Node<WorkflowCardData>[]>([])
  const [edges, setEdges] = useState<ReactFlowEdge[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Sidebar & Modal states
  const [selectionSidebarMode, setSelectionSidebarMode] = useState<
    "all" | "step" | null
  >(null)
  const [stepInsertionTarget, setStepInsertionTarget] =
    useState<StepInsertionTarget | null>(null)
  const [templateGalleryOpen, setTemplateGalleryOpen] = useState(false)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [inspectorOpen, setInspectorOpen] = useState(false)
  const [testModalOpen, setTestModalOpen] = useState(false)

  const nodeActionsRef = useRef<{
    duplicate: (id: string) => void
    delete: (id: string) => void
    addStep: (parentId: string, branchId?: "true" | "false") => void
    configure: (id: string) => void
    testRun: (id: string) => void
  }>({
    duplicate: () => {},
    delete: () => {},
    addStep: () => {},
    configure: () => {},
    testRun: () => {},
  })

  // Transient node callbacks — injected on render, stripped before saving.
  const nodeCallbacks = useMemo<
    Pick<
      WorkflowCardData,
      "onDuplicate" | "onDelete" | "onAddStep" | "onConfigure" | "onTestRun"
    >
  >(
    () => ({
      onDuplicate: (targetId) => nodeActionsRef.current.duplicate(targetId),
      onDelete: (targetId) => nodeActionsRef.current.delete(targetId),
      onAddStep: (parentId, branchId) =>
        nodeActionsRef.current.addStep(parentId, branchId),
      onConfigure: (targetId) => nodeActionsRef.current.configure(targetId),
      onTestRun: (targetId) => nodeActionsRef.current.testRun(targetId),
    }),
    []
  )

  const handleCloseSelectionSidebar = useCallback(() => {
    setSelectionSidebarMode(null)
    setStepInsertionTarget(null)
  }, [])

  const handleOpenBlockSidebar = useCallback(() => {
    setInspectorOpen(false)
    setStepInsertionTarget(null)
    setSelectionSidebarMode("all")
  }, [])

  const handleRequestAddStep = useCallback(
    (parentId: string, branchId?: "true" | "false") => {
      setInspectorOpen(false)
      setStepInsertionTarget({ parentId, branchId })
      setSelectionSidebarMode("step")
    },
    []
  )

  // Delete node
  const handleDeleteNode = useCallback((id: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== id))
    setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id))
    setSelectedNodeId((cur) => {
      if (cur === id) {
        setInspectorOpen(false)
        return null
      }
      return cur
    })
    toast.success("Step removed")
  }, [])

  // Duplicate node
  const handleDuplicateNode = useCallback((id: string) => {
    setNodes((nds) => {
      const existing = nds.find((n) => n.id === id)
      if (!existing) return nds

      const newId = `step-${Date.now()}`
      const newNode: Node<WorkflowCardData> = {
        ...existing,
        id: newId,
        position: {
          x: existing.position.x + 40,
          y: existing.position.y + 40,
        },
        data: {
          ...existing.data,
          title: `${existing.data.title} (Copy)`,
          ...nodeCallbacks,
        },
      }
      return [...nds, newNode]
    })
    toast.success("Step duplicated")
  }, [nodeCallbacks])

  // Quick-add next step from handle '+' button
  const handleAddStep = useCallback(
    (
      parentId: string,
      tone: WorkflowCardData["tone"],
      branchId?: "true" | "false"
    ) => {
      setNodes((nds) => {
        const parentNode = nds.find((n) => n.id === parentId)
        const id = `node-${Date.now()}`
        let title = "New Step"
        let description = ""
        let typeLabel = "Action"
        let typeClassName =
          "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-300"
        let icon = "FilePlus"
        let category = "Records"
        const handles = { target: true, source: true }

        if (tone === "condition") {
          title = "Evaluate Condition"
          description = "Check attribute rules"
          typeLabel = "Condition"
          typeClassName =
            "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/50 dark:bg-violet-950/40 dark:text-violet-300"
          icon = "GitBranch"
          category = "Logic"
          handles.target = true
          handles.source = true
        } else if (tone === "ai") {
          title = "AI Specialist"
          description = "Extract fields & summarize"
          typeLabel = "AI Agent"
          typeClassName =
            "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-900/50 dark:bg-purple-950/40 dark:text-purple-300"
          icon = "Bot"
          category = "AI"
        } else if (tone === "channel") {
          title = "Send Message"
          description = "Post to channel"
          typeLabel = "Channel"
          typeClassName =
            "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-900/50 dark:bg-cyan-950/40 dark:text-cyan-300"
          icon = "Send"
          category = "Messaging"
        }

        const { x: nextX, y: nextY } = getChildNodePosition(
          parentNode?.position,
          branchId
        )

        const newNode: Node<WorkflowCardData> = {
          id,
          type: "workflow",
          position: { x: nextX, y: nextY },
          data: {
            title,
            description,
            category,
            typeLabel,
            typeClassName,
            icon,
            tone,
            handles: {
              target: handles.target,
              source: handles.source,
              condition: tone === "condition",
            },
            config: {},
            ...nodeCallbacks,
          },
        }

        if (parentNode) {
          setEdges((eds) => [
            ...eds,
            {
              id: `e-${parentNode.id}-${id}`,
              source: parentNode.id,
              target: id,
              sourceHandle: branchId || undefined,
              type: "animated",
              style: { stroke: "var(--border)", strokeWidth: 1.5 },
            },
          ])
        }

        toast.success(`Added ${typeLabel} step`)

        return [...nds, newNode]
      })
    },
    [nodeCallbacks]
  )

  // Open the inspector for a node (frame click or the "Configure" affordance)
  const handleConfigureNode = useCallback((id: string) => {
    setSelectionSidebarMode(null)
    setStepInsertionTarget(null)
    setSelectedNodeId(id)
    setInspectorOpen(true)
  }, [])

  // "Run trigger with mock data" reuses the existing whole-workflow test modal
  const handleTestRunNode = useCallback((id: string) => {
    setSelectedNodeId(id)
    setInspectorOpen(false)
    setTestModalOpen(true)
  }, [])

  useEffect(() => {
    nodeActionsRef.current = {
      duplicate: handleDuplicateNode,
      delete: handleDeleteNode,
      addStep: handleRequestAddStep,
      configure: handleConfigureNode,
      testRun: handleTestRunNode,
    }
  }, [
    handleDuplicateNode,
    handleDeleteNode,
    handleRequestAddStep,
    handleConfigureNode,
    handleTestRunNode,
  ])

  // Load workflow from backend
  useEffect(() => {
    if (!activeOrg?.id || !workflowId) return

    let ignore = false

    const loadWorkflow = async () => {
      setIsLoading(true)
      try {
        const res = await apiFetch<{ data?: WorkflowDetailResponse } | WorkflowDetailResponse>(
          `/api/v1/organizations/${activeOrg.id}/workflows/${workflowId}`
        )
        if (!ignore) {
          const data = "data" in res && res.data ? res.data : (res as WorkflowDetailResponse)
          setWorkflowName(data.name || "Untitled Workflow")
          setDescription(data.description || "")
          setIsActive(Boolean(data.is_active))
          setWebhookUrl(data.webhook_url || null)

          let loadedNodes = attachNodeCallbacks(
            data.nodes || [],
            nodeCallbacks
          )
          const loadedEdges = data.edges || []

          if (isLegacyHorizontalLayout(loadedNodes, loadedEdges)) {
            loadedNodes = layoutNodesTopToBottom(loadedNodes, loadedEdges)
          }

          setNodes(loadedNodes)
          setEdges(loadedEdges)

          // If workflow has zero nodes, automatically open the Trigger Selection Sidebar!
          if (loadedNodes.length === 0) {
            setSelectionSidebarMode("all")
          }
        }
      } catch {
        if (!ignore) {
          toast.error("Failed to load workflow details")
        }
      } finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }

    void loadWorkflow()

    return () => {
      ignore = true
    }
  }, [activeOrg?.id, workflowId, nodeCallbacks])

  // Save changes to backend
  const handleSave = useCallback(
    async (overrideActive?: boolean) => {
      if (!activeOrg?.id || !workflowId) return

      setIsSaving(true)
      const targetActive = overrideActive !== undefined ? overrideActive : isActive
      try {
        await apiFetch(`/api/v1/organizations/${activeOrg.id}/workflows/${workflowId}`, {
          method: "PUT",
          body: {
            name: workflowName.trim() || "Untitled Workflow",
            description: description.trim() || null,
            is_active: targetActive,
            nodes: nodes.map((n) => ({
              id: n.id,
              type: n.type,
              position: n.position,
              data: {
                title: n.data.title,
                description: n.data.description,
                typeLabel: n.data.typeLabel,
                typeClassName: n.data.typeClassName,
                icon: n.data.icon,
                iconClassName: n.data.iconClassName,
                tone: n.data.tone,
                handles: n.data.handles,
                config: n.data.config,
              },
            })),
            edges,
          },
        })
        toast.success(overrideActive ? "Workflow published!" : "Workflow saved successfully")
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to save workflow"
        toast.error(message)
      } finally {
        setIsSaving(false)
      }
    },
    [activeOrg, workflowId, workflowName, description, isActive, nodes, edges]
  )

  // Publish workflow handler
  const handlePublishWorkflow = async () => {
    setIsActive(true)
    await handleSave(true)
  }

  // Keyboard shortcut Cmd/Ctrl + S
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault()
        void handleSave()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [handleSave])

  // Edges rendered with a transient Add-step callback; `edges` state stays
  // serializable so saving never leaks a function into the API payload.
  const renderedEdges = useMemo<ReactFlowEdge<WorkflowEdgeData>[]>(
    () =>
      edges.map((edge) => ({
        ...edge,
        data: {
          ...(edge.data as WorkflowEdgeData | undefined),
          onAddStep: (parentId: string, branchId?: "true" | "false") =>
            nodeActionsRef.current.addStep(parentId, branchId),
        },
      })),
    [edges]
  )

  // Auto-arrange all nodes from top to bottom
  const handleAutoLayout = useCallback(() => {
    setNodes((nds) => layoutNodesTopToBottom(nds, edges))
    toast.success("Workflow arranged top to bottom")
  }, [edges])

  // Node & Edge changes from React Flow
  const onNodesChange = useCallback(
    (changes: NodeChange<Node<WorkflowCardData>>[]) =>
      setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  )

  const onEdgesChange = useCallback(
    (changes: EdgeChange<ReactFlowEdge>[]) =>
      setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  )

  // Connect edges
  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: "animated",
            style: { stroke: "var(--border)", strokeWidth: 1.5 },
          },
          eds
        )
      ),
    []
  )

  // Clicking a node closes open sidebars without popping open the modal
  const onNodeClick = (_: React.MouseEvent) => {
    setSelectionSidebarMode(null)
    setStepInsertionTarget(null)
  }

  // Double-clicking a node opens the inspector dialog
  const onNodeDoubleClick = (_: React.MouseEvent, node: Node) => {
    setSelectionSidebarMode(null)
    setStepInsertionTarget(null)
    setSelectedNodeId(node.id)
    setInspectorOpen(true)
  }

  // Update node data from inspector
  const handleUpdateNode = (id: string, updates: Partial<WorkflowCardData>) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: {
              ...node.data,
              ...updates,
            },
          }
        }
        return node
      })
    )
  }

  // Handle trigger selected from the TriggerSelectionSidebar
  const handleSelectTrigger = (trigger: TriggerDefinition) => {
    const triggerNodeId = `trigger-${Date.now()}`

    setNodes((currentNodes) => {
      const triggerCount = currentNodes.filter(
        (node) => node.data.tone === "trigger"
      ).length
      const newTriggerNode: Node<WorkflowCardData> = {
        id: triggerNodeId,
        type: "workflow",
        position: { x: 80 + triggerCount * 360, y: 160 },
        data: {
          title: trigger.title,
          description: trigger.description,
          category:
            trigger.category === "Collections" ? "Lists" : trigger.category,
          typeLabel: trigger.typeLabel,
          typeClassName: trigger.typeClassName,
          icon: trigger.iconName || "RadioTower",
          tone: trigger.tone,
          handles: { target: false, source: true },
          config: trigger.config ?? {},
          ...nodeCallbacks,
        },
      }

      return [...currentNodes, newTriggerNode]
    })
    setSelectionSidebarMode(null)
    setStepInsertionTarget(null)
    toast.success(`Trigger added: ${trigger.title}`)
  }

  // Apply starter blueprint
  const handleApplyTemplate = async (templateId: string) => {
    if (!activeOrg?.id) return
    setIsLoading(true)
    try {
      const res = await apiFetch<{ data?: { id: string } } | { id: string }>(
        `/api/v1/organizations/${activeOrg.id}/workflows`,
        {
          method: "POST",
          body: {
            name: workflowName !== "Untitled Workflow" ? workflowName : undefined,
            template_id: templateId,
          },
        }
      )
      const created = "data" in res && res.data ? res.data : (res as { id: string })
      toast.success("Template applied successfully")
      router.push(`/workflows/${created.id}`)
    } catch {
      toast.error("Failed to apply template")
    } finally {
      setIsLoading(false)
    }
  }

  // Add block to canvas
  const handleAddBlock = (tone: WorkflowCardData["tone"]) => {
    const id = `node-${Date.now()}`
    let title = "New Step"
    let description = ""
    let typeLabel = "Action"
    let typeClassName =
      "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-300"
    let icon = "FilePlus"
    let category = "Records"
    const handles = { target: true, source: true }

    if (tone === "condition") {
      title = "Evaluate Condition"
      description = "Check attribute rules"
      typeLabel = "Condition"
      typeClassName =
        "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/50 dark:bg-violet-950/40 dark:text-violet-300"
      icon = "GitBranch"
      category = "Logic"
      handles.target = true
      handles.source = true
    } else if (tone === "ai") {
      title = "AI Specialist"
      description = "Extract fields & summarize"
      typeLabel = "AI Agent"
      typeClassName =
        "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-900/50 dark:bg-purple-950/40 dark:text-purple-300"
      icon = "Bot"
      category = "AI"
    } else if (tone === "channel") {
      title = "Send Message"
      description = "Post to channel"
      typeLabel = "Channel"
      typeClassName =
        "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-900/50 dark:bg-cyan-950/40 dark:text-cyan-300"
      icon = "Send"
      category = "Messaging"
    }

    const lastNode = nodes[nodes.length - 1]
    const { x: nextX, y: nextY } = lastNode
      ? getChildNodePosition(lastNode.position)
      : ROOT_NODE_POSITION

    const newNode: Node<WorkflowCardData> = {
      id,
      type: "workflow",
      position: { x: nextX, y: nextY },
      data: {
        title,
        description,
        category,
        typeLabel,
        typeClassName,
        icon,
        tone,
        handles: {
          target: handles.target,
          source: handles.source,
          condition: tone === "condition",
        },
        config: {},
        ...nodeCallbacks,
      },
    }

    setNodes((nds) => [...nds, newNode])

    if (lastNode) {
      setEdges((eds) => [
        ...eds,
        {
          id: `e-${lastNode.id}-${newNode.id}`,
          source: lastNode.id,
          target: newNode.id,
          type: "animated",
          style: { stroke: "var(--border)", strokeWidth: 1.5 },
        },
      ])
    }

    toast.success(`Added ${typeLabel} block`)
  }

  const handleSelectStep = (step: StepDefinition) => {
    const insertionTarget = stepInsertionTarget

    setSelectionSidebarMode(null)
    setStepInsertionTarget(null)

    if (insertionTarget?.parentId) {
      handleAddStep(insertionTarget.parentId, step.tone, insertionTarget.branchId)
      return
    }

    handleAddBlock(step.tone)
  }

  // Delete entire workflow
  const handleDeleteWorkflow = async () => {
    if (!activeOrg?.id || !workflowId) return
    const confirmed = window.confirm("Are you sure you want to delete this workflow?")
    if (!confirmed) return

    try {
      await apiFetch(`/api/v1/organizations/${activeOrg.id}/workflows/${workflowId}`, {
        method: "DELETE",
      })
      toast.success("Workflow deleted")
      router.push("/workflows")
    } catch {
      toast.error("Failed to delete workflow")
    }
  }

  // Copy share link
  const handleShareLink = () => {
    if (typeof window !== "undefined") {
      void navigator.clipboard.writeText(window.location.href)
      toast.success("Workflow link copied to clipboard")
    }
  }

  const selectedNode = nodes.find((n) => n.id === selectedNodeId)

  if (isLoading) {
    return (
      <div className="flex h-full min-h-0 flex-1 w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
          <Loader2Icon className="size-6 animate-spin text-emerald-600" />
          Loading workflow builder…
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col bg-background text-foreground overflow-hidden">
      {/* Top Header matching Attio Layout */}
      <header className="flex flex-col border-b border-border bg-card/80 backdrop-blur-xs shrink-0">
        {/* Breadcrumbs Row */}
        <div className="flex h-12 items-center justify-between px-4">
          <div className="flex items-center gap-2 min-w-0">
            <Link
              href="/workflows"
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <WorkflowIcon className="size-3.5" />
              Workflows
            </Link>
            <span className="text-muted-foreground/60 text-xs">/</span>
            <input
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              placeholder="Untitled Workflow"
              className="h-7 w-52 rounded-md bg-transparent px-1.5 text-sm font-semibold text-foreground hover:bg-muted/40 focus:bg-background focus:ring-1 focus:ring-ring outline-none truncate transition-colors"
            />
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground hover:text-amber-500"
              aria-label="Star workflow"
              onClick={() => setIsFavorite(!isFavorite)}
            >
              <StarIcon
                className={cn("size-3.5", isFavorite && "fill-amber-400 text-amber-400")}
              />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShareLink}
              className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <Share2Icon className="size-3.5" />
              Share
            </Button>

            <Button
              size="sm"
              disabled={isSaving}
              onClick={() => void handleSave()}
              className="h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium shadow-2xs"
            >
              {isSaving ? (
                <Loader2Icon className="size-3.5 animate-spin" />
              ) : (
                <SaveIcon className="size-3.5" />
              )}
              Save
            </Button>
          </div>
        </div>

        {/* Tab Bar Row (Editor, Runs, Settings) + Draft Switch */}
        <div className="flex h-10 items-center justify-between px-4 border-t border-border/50 bg-muted/20">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("editor")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer",
                activeTab === "editor"
                  ? "bg-background text-foreground shadow-2xs font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <WorkflowIcon className="size-3.5" />
              Editor
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("runs")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer",
                activeTab === "runs"
                  ? "bg-background text-foreground shadow-2xs font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <HistoryIcon className="size-3.5" />
              Runs
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("settings")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer",
                activeTab === "settings"
                  ? "bg-background text-foreground shadow-2xs font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <SettingsIcon className="size-3.5" />
              Settings
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-muted-foreground">
              {isActive ? "Active" : "Draft"}
            </span>
            <Switch
              checked={isActive}
              onCheckedChange={setIsActive}
              aria-label="Workflow active state"
            />
          </div>
        </div>
      </header>

      {/* Main Content Area based on activeTab */}
      {activeTab === "editor" && (
        <div className="relative flex min-h-0 flex-1 overflow-hidden">
          {/* Left Column: Canvas Area + Top Notice Banner */}
          <div className="relative flex min-h-0 flex-col flex-1 h-full overflow-hidden">
            {/* Top Notice Banner when in Draft mode */}
            {!isActive && (
              <div className="flex items-center justify-between px-4 py-2 bg-sky-50 dark:bg-sky-950/40 border-b border-sky-200 dark:border-sky-900/60 shrink-0">
                <div className="flex items-center gap-2 text-xs font-medium text-sky-800 dark:text-sky-300">
                  <InfoIcon className="size-4 shrink-0 text-sky-600 dark:text-sky-400" />
                  <span>This workflow has not yet been published</span>
                </div>
                <Button
                  size="sm"
                  onClick={handlePublishWorkflow}
                  disabled={isSaving}
                  className="h-7 px-3 bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium rounded-lg shadow-2xs"
                >
                  Publish workflow
                </Button>
              </div>
            )}

            {/* Canvas Area */}
            <div className="relative flex-1 min-h-0 h-full overflow-hidden">
              {/* Empty State Overlay */}
              {nodes.length === 0 && (
                <CanvasEmptyState
                  onOpenBlockSidebar={handleOpenBlockSidebar}
                  onOpenTemplates={() => setTemplateGalleryOpen(true)}
                />
              )}

              <Canvas
                nodes={nodes}
                edges={renderedEdges}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                onNodeDoubleClick={onNodeDoubleClick}
                className="h-full w-full"
                fitViewOptions={{ padding: 0.25, maxZoom: 1 }}
              >
                <Controls position="bottom-left" />

                {/* Floating Canvas Toolbar */}
                <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAutoLayout}
                    className="bg-card hover:bg-muted/60 text-xs gap-1.5 shadow-2xs rounded-lg"
                    title="Arrange workflow top-to-bottom"
                  >
                    <ArrowDownIcon className="size-3.5 text-muted-foreground" />
                    Auto layout
                  </Button>

                  <Button
                    size="sm"
                    onClick={handleOpenBlockSidebar}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-xs text-xs rounded-lg"
                  >
                    <PlusIcon className="size-3.5" />
                    Add block
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTestModalOpen(true)}
                    className="bg-card hover:bg-muted/60 text-xs gap-1.5 shadow-2xs rounded-lg"
                  >
                    <PlayIcon className="size-3.5 text-emerald-600" />
                    Test Run
                  </Button>
                </div>
              </Canvas>
            </div>
          </div>

          <WorkflowBlockSelectionSidebar
            key={selectionSidebarMode ?? "closed"}
            open={selectionSidebarMode !== null}
            mode={selectionSidebarMode ?? "all"}
            onClose={handleCloseSelectionSidebar}
            onSelectTrigger={handleSelectTrigger}
            onSelectStep={handleSelectStep}
          />
        </div>
      )}

      {/* Runs Tab */}
      {activeTab === "runs" && (
        <div className="flex-1 min-h-0 overflow-y-auto p-6 bg-background">
          <div className="mx-auto max-w-4xl space-y-4">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-foreground">
                  Execution Runs
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Audit step durations, input snapshots, and execution logs for this workflow.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setTestModalOpen(true)}
                className="gap-1.5"
              >
                <PlayIcon className="size-3.5 text-emerald-600" />
                Test Run
              </Button>
            </div>

            <WorkflowRunsList
              workflowId={workflowId}
              onOpenTestModal={() => setTestModalOpen(true)}
            />
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === "settings" && (
        <div className="flex-1 min-h-0 overflow-y-auto p-6 bg-background">
          <div className="mx-auto max-w-2xl space-y-6">
            <div className="border-b pb-4">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                Workflow Settings
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Configure identity, triggers, and integration settings.
              </p>
            </div>

            <div className="space-y-4">
              <FieldGroup className="gap-4">
                <Field>
                  <FieldLabel>Workflow Name</FieldLabel>
                  <Input
                    value={workflowName}
                    onChange={(e) => setWorkflowName(e.target.value)}
                    placeholder="Enter workflow name"
                  />
                </Field>

                <Field>
                  <FieldLabel>Description</FieldLabel>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Explain what this automation accomplishes"
                    rows={3}
                  />
                </Field>

                <div className="flex items-center justify-between p-4 rounded-xl border bg-card">
                  <div className="space-y-0.5">
                    <span className="text-sm font-semibold text-foreground">
                      Published Status
                    </span>
                    <p className="text-xs text-muted-foreground">
                      Enable this workflow to execute automatically upon trigger events.
                    </p>
                  </div>
                  <Switch
                    checked={isActive}
                    onCheckedChange={setIsActive}
                    aria-label="Workflow active state"
                  />
                </div>

                {webhookUrl && (
                  <div className="space-y-2 p-4 rounded-xl border bg-muted/20">
                    <span className="text-sm font-semibold text-foreground">
                      Inbound Webhook Endpoint
                    </span>
                    <p className="text-xs text-muted-foreground">
                      Send JSON payloads to this unique public URL to trigger this workflow.
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        readOnly
                        value={webhookUrl}
                        className="font-mono text-xs bg-background"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          void navigator.clipboard.writeText(webhookUrl)
                          toast.success("Webhook URL copied to clipboard")
                        }}
                        className="shrink-0"
                      >
                        <CopyIcon className="size-3.5" />
                        Copy
                      </Button>
                    </div>
                  </div>
                )}
              </FieldGroup>

              <div className="flex justify-end pt-2">
                <Button
                  onClick={() => void handleSave()}
                  disabled={isSaving}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                >
                  {isSaving ? (
                    <Loader2Icon className="size-3.5 animate-spin" />
                  ) : (
                    <SaveIcon className="size-3.5" />
                  )}
                  Save Changes
                </Button>
              </div>

              {/* Danger Zone */}
              <div className="border-t pt-6 mt-8 space-y-3">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-semibold text-destructive">Danger Zone</h3>
                  <p className="text-xs text-muted-foreground">
                    Permanently delete this workflow and all of its past execution history.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteWorkflow}
                  className="gap-1.5"
                >
                  <Trash2Icon className="size-3.5" />
                  Delete Workflow
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Node Inspector Dialog */}
      <WorkflowInspectorDialog
        open={inspectorOpen}
        onOpenChange={setInspectorOpen}
        node={selectedNode ?? null}
        onUpdateNode={handleUpdateNode}
        onDeleteNode={handleDeleteNode}
        webhookUrl={webhookUrl}
      />

      {/* Template Gallery Modal */}
      <TemplateGalleryDialog
        open={templateGalleryOpen}
        onOpenChange={setTemplateGalleryOpen}
        onApplyTemplate={handleApplyTemplate}
      />

      {/* Test Run Modal */}
      <WorkflowTestRunModal
        open={testModalOpen}
        onOpenChange={setTestModalOpen}
        workflowId={workflowId}
        workflowName={workflowName}
      />
    </div>
  )
}
