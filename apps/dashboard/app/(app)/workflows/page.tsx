"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { useActiveOrganization } from "@/hooks/use-active-organization"
import { apiFetch } from "@/lib/api"
import { cn } from "@/lib/utils"
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  Loader2Icon,
  MessageSquareIcon,
  PlayIcon,
  PlusIcon,
  SearchIcon,
  SparklesIcon,
  Trash2Icon,
  TruckIcon,
  WorkflowIcon,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { WorkflowTestRunModal } from "@/components/workflow/workflow-test-modal"

type WorkflowItem = {
  id: string
  name: string
  description?: string
  trigger_type: string
  is_active: boolean
  runs_count: number
  last_run?: {
    id: string
    status: string
    finished_at?: string
  } | null
  created_at: string
}

type TemplateItem = {
  id: string
  name: string
  description: string
  icon: string
  trigger_type: string
}

export default function WorkflowsPage() {
  const router = useRouter()
  const activeOrg = useActiveOrganization()

  const [workflows, setWorkflows] = useState<WorkflowItem[]>([])
  const [templates, setTemplates] = useState<TemplateItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")

  // Create Modal state
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("transport-dispatch-automation")
  const [workflowName, setWorkflowName] = useState("")
  const [workflowDescription, setWorkflowDescription] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  // Test Run Modal state
  const [testModalOpen, setTestModalOpen] = useState(false)
  const [activeTestWorkflow, setActiveTestWorkflow] = useState<{ id: string; name: string } | null>(null)

  const refetchWorkflows = async () => {
    if (!activeOrg?.id) return
    try {
      const res = await apiFetch<{ data?: WorkflowItem[] } | WorkflowItem[]>(
        `/api/v1/organizations/${activeOrg.id}/workflows`
      )
      const data = "data" in res && res.data ? res.data : (Array.isArray(res) ? res : [])
      setWorkflows(data)
    } catch {
      toast.error("Failed to load workflows")
    }
  }

  useEffect(() => {
    if (!activeOrg?.id) return

    let ignore = false

    const loadData = async () => {
      setIsLoading(true)
      try {
        const [wfRes, tplRes] = await Promise.all([
          apiFetch<{ data?: WorkflowItem[] } | WorkflowItem[]>(
            `/api/v1/organizations/${activeOrg.id}/workflows`
          ).catch(() => null),
          apiFetch<{ data?: TemplateItem[] } | TemplateItem[]>(
            `/api/v1/organizations/${activeOrg.id}/workflows/templates`
          ).catch(() => null),
        ])

        if (!ignore) {
          if (wfRes) {
            const data = "data" in wfRes && wfRes.data ? wfRes.data : (Array.isArray(wfRes) ? wfRes : [])
            setWorkflows(data)
          }
          if (tplRes) {
            const data = "data" in tplRes && tplRes.data ? tplRes.data : (Array.isArray(tplRes) ? tplRes : [])
            setTemplates(data)
          } else {
            setTemplates([
              {
                id: "transport-dispatch-automation",
                name: "Transport & Dispatch Automation",
                description: "Extract waybill and kilometer data from inbound form, sync Driver & Waybill records, and alert Telegram if delayed.",
                icon: "Truck",
                trigger_type: "webhook",
              },
              {
                id: "lead-notification",
                name: "New Inbound Lead to Messenger",
                description: "When a new contact record is created, evaluate inquiry urgency and send an instant Messenger notification to the team.",
                icon: "MessageSquare",
                trigger_type: "record.created",
              },
              {
                id: "blank-canvas",
                name: "Blank Canvas",
                description: "Start completely from scratch with an empty canvas and trigger block.",
                icon: "Sparkles",
                trigger_type: "manual",
              },
            ])
          }
        }
      } finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }

    void loadData()

    return () => {
      ignore = true
    }
  }, [activeOrg?.id])

  const handleQuickCreateWorkflow = async () => {
    if (!activeOrg?.id) return

    setIsCreating(true)
    try {
      const res = await apiFetch<{ data?: { id: string } } | { id: string }>(
        `/api/v1/organizations/${activeOrg.id}/workflows`,
        {
          method: "POST",
          body: {
            name: "Untitled Workflow",
            is_active: false,
          },
        }
      )

      const created = "data" in res && res.data ? res.data : (res as { id: string })
      router.push(`/workflows/${created.id}`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create workflow"
      toast.error(message)
    } finally {
      setIsCreating(false)
    }
  }

  const handleCreateWorkflow = async () => {
    if (!activeOrg?.id || !workflowName.trim()) return

    setIsCreating(true)
    try {
      const res = await apiFetch<{ data?: { id: string } } | { id: string }>(
        `/api/v1/organizations/${activeOrg.id}/workflows`,
        {
          method: "POST",
          body: {
            name: workflowName.trim(),
            description: workflowDescription.trim() || undefined,
            template_id: selectedTemplateId || undefined,
          },
        }
      )

      const created = "data" in res && res.data ? res.data : (res as { id: string })
      toast.success("Workflow created successfully")
      setCreateOpen(false)
      router.push(`/workflows/${created.id}`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create workflow"
      toast.error(message)
    } finally {
      setIsCreating(false)
    }
  }

  const handleToggleActive = async (id: string, current: boolean) => {
    if (!activeOrg?.id) return

    setWorkflows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, is_active: !current } : w))
    )

    try {
      await apiFetch(
        `/api/v1/organizations/${activeOrg.id}/workflows/${id}`,
        {
          method: "PUT",
          body: { is_active: !current },
        }
      )
      toast.success(!current ? "Workflow activated" : "Workflow paused")
    } catch {
      toast.error("Failed to update status")
      void refetchWorkflows()
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!activeOrg?.id) return
    if (!confirm(`Are you sure you want to delete workflow "${name}"?`)) return

    try {
      await apiFetch(
        `/api/v1/organizations/${activeOrg.id}/workflows/${id}`,
        {
          method: "DELETE",
        }
      )
      setWorkflows((prev) => prev.filter((w) => w.id !== id))
      toast.success("Workflow deleted")
    } catch {
      toast.error("Failed to delete workflow")
    }
  }

  const openCreateWithTemplate = (templateId: string, defaultName: string) => {
    setSelectedTemplateId(templateId)
    setWorkflowName(defaultName)
    setWorkflowDescription("")
    setCreateOpen(true)
  }

  const filteredWorkflows = workflows.filter(
    (w) =>
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      (w.description && w.description.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="flex-1 space-y-8 p-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Workflows
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground tabular-nums">
              {workflows.length}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Build visual automations for dispatch recording, customer updates, and record syncing.
          </p>
        </div>

        <Button
          onClick={handleQuickCreateWorkflow}
          disabled={isCreating}
          className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs"
        >
          {isCreating ? (
            <Loader2Icon className="size-4 mr-1.5 animate-spin" />
          ) : (
            <PlusIcon className="size-4 mr-1.5" />
          )}
          New Workflow
        </Button>
      </div>

      {/* Starter Templates Banner */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Starter Templates
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            onClick={() =>
              openCreateWithTemplate(
                "transport-dispatch-automation",
                "Transport & Dispatch Waybill Automation"
              )
            }
            className="group cursor-pointer rounded-xl border bg-card p-4 hover:border-emerald-500/50 hover:shadow-sm transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
                <TruckIcon className="size-5" />
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-medium text-foreground group-hover:text-emerald-600 transition-colors truncate">
                  Transport & Dispatch Automation
                </h3>
                <span className="text-[11px] text-muted-foreground">Inbound Webhook</span>
              </div>
            </div>
            <p className="mt-2.5 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
              Extract waybill and kilometer data from forms, sync Driver records, and alert Telegram if delayed.
            </p>
          </div>

          <div
            onClick={() =>
              openCreateWithTemplate(
                "lead-notification",
                "Inbound Lead to Messenger"
              )
            }
            className="group cursor-pointer rounded-xl border bg-card p-4 hover:border-emerald-500/50 hover:shadow-sm transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
                <MessageSquareIcon className="size-5" />
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-medium text-foreground group-hover:text-emerald-600 transition-colors truncate">
                  New Lead Notification
                </h3>
                <span className="text-[11px] text-muted-foreground">Record Created</span>
              </div>
            </div>
            <p className="mt-2.5 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
              Score new leads with AI and deliver instant alerts directly to Facebook Messenger.
            </p>
          </div>

          <div
            onClick={handleQuickCreateWorkflow}
            className="group cursor-pointer rounded-xl border border-dashed bg-card/60 p-4 hover:border-foreground/40 hover:shadow-sm transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-foreground">
                <SparklesIcon className="size-5" />
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-medium text-foreground group-hover:text-foreground transition-colors truncate">
                  Blank Canvas
                </h3>
                <span className="text-[11px] text-muted-foreground">Start from scratch</span>
              </div>
            </div>
            <p className="mt-2.5 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
              Start with an empty canvas and compose your own custom triggers, AI steps, and actions.
            </p>
          </div>
        </div>
      </div>

      {/* Search & Workflows Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search workflows…"
              className="pl-9 text-sm"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-sm text-muted-foreground">
            <Loader2Icon className="size-6 animate-spin mb-3 text-emerald-600" />
            Loading workflows…
          </div>
        ) : filteredWorkflows.length === 0 ? (
          <div className="rounded-xl border border-dashed p-12 text-center bg-card/40">
            <div className="flex justify-center mb-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <WorkflowIcon className="size-5" />
              </span>
            </div>
            <h3 className="text-base font-semibold text-foreground">
              {search ? "No matching workflows found" : "No workflows created yet"}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              {search
                ? "Try searching with different keywords."
                : "Select a starter template above or start from scratch to build your first automation."}
            </p>
          </div>
        ) : (
          <div className="rounded-xl border bg-card overflow-hidden shadow-2xs">
            <div className="divide-y">
              {filteredWorkflows.map((workflow) => (
                <div
                  key={workflow.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 hover:bg-muted/25 transition-colors"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted/40 text-foreground">
                      <WorkflowIcon className="size-4 text-muted-foreground" />
                    </span>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/workflows/${workflow.id}`}
                          className="font-semibold text-sm text-foreground hover:text-emerald-600 transition-colors truncate"
                        >
                          {workflow.name}
                        </Link>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border bg-muted/50 text-muted-foreground capitalize">
                          {workflow.trigger_type.replace(".", " ")}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {workflow.description || "No description provided"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 shrink-0 justify-between sm:justify-end">
                    {/* Runs stats */}
                    <div className="text-right hidden md:block">
                      <div className="text-xs font-semibold tabular-nums text-foreground">
                        {workflow.runs_count}&nbsp;runs
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {workflow.last_run ? (
                          <span className="flex items-center gap-1 justify-end">
                            {workflow.last_run.status === "completed" ? (
                              <CheckCircle2Icon className="size-3 text-emerald-600" />
                            ) : (
                              <AlertCircleIcon className="size-3 text-destructive" />
                            )}
                            Last run {workflow.last_run.status}
                          </span>
                        ) : (
                          "Never executed"
                        )}
                      </div>
                    </div>

                    {/* Active toggle switch */}
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={workflow.is_active}
                        onCheckedChange={() =>
                          handleToggleActive(workflow.id, workflow.is_active)
                        }
                        aria-label="Toggle active status"
                      />
                      <span className="text-xs text-muted-foreground hidden sm:inline">
                        {workflow.is_active ? "Active" : "Paused"}
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setActiveTestWorkflow({ id: workflow.id, name: workflow.name })
                          setTestModalOpen(true)
                        }}
                        className="text-xs h-8 text-muted-foreground hover:text-foreground"
                      >
                        <PlayIcon className="size-3.5 mr-1 text-emerald-600" />
                        Test
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        render={<Link href={`/workflows/${workflow.id}`} />}
                        className="text-xs h-8"
                      >
                        Open Builder
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(workflow.id, workflow.name)}
                        className="size-8 text-muted-foreground hover:text-destructive"
                        aria-label="Delete workflow"
                      >
                        <Trash2Icon className="size-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create Workflow Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Workflow</DialogTitle>
            <DialogDescription>
              Set up a visual automation flow to handle repetitive tasks.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="gap-4 py-2">
            <Field>
              <FieldLabel htmlFor="wf-name">Workflow Name</FieldLabel>
              <Input
                id="wf-name"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                placeholder="e.g. Waybill Dispatch Automation"
                autoFocus
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="wf-desc">Description (Optional)</FieldLabel>
              <Input
                id="wf-desc"
                value={workflowDescription}
                onChange={(e) => setWorkflowDescription(e.target.value)}
                placeholder="What this workflow accomplishes…"
              />
            </Field>

            <Field>
              <FieldLabel>Template Preset</FieldLabel>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {templates.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => setSelectedTemplateId(tmpl.id)}
                    className={cn(
                      "w-full text-left p-2.5 rounded-lg border text-xs transition-all",
                      selectedTemplateId === tmpl.id
                        ? "border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500"
                        : "hover:bg-muted/40"
                    )}
                  >
                    <div className="font-semibold text-foreground">{tmpl.name}</div>
                    <div className="text-muted-foreground line-clamp-1 mt-0.5">
                      {tmpl.description}
                    </div>
                  </button>
                ))}
              </div>
            </Field>
          </FieldGroup>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setCreateOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateWorkflow}
              disabled={isCreating || !workflowName.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isCreating ? (
                <>
                  <Loader2Icon className="size-4 mr-1.5 animate-spin" />
                  Creating…
                </>
              ) : (
                "Create Workflow"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test Run Modal */}
      {activeTestWorkflow && (
        <WorkflowTestRunModal
          open={testModalOpen}
          onOpenChange={setTestModalOpen}
          workflowId={activeTestWorkflow.id}
          workflowName={activeTestWorkflow.name}
          onRunFinished={() => void refetchWorkflows()}
        />
      )}
    </div>
  )
}
