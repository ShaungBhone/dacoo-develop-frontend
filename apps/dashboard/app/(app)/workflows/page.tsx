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
import { useTranslation } from "@/contexts/language-context"

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
  const { t } = useTranslation()

  const [workflows, setWorkflows] = useState<WorkflowItem[]>([])
  const [templates, setTemplates] = useState<TemplateItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")

  // Create Modal state
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    "transport-dispatch-automation"
  )
  const [workflowName, setWorkflowName] = useState("")
  const [workflowDescription, setWorkflowDescription] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  // Test Run Modal state
  const [testModalOpen, setTestModalOpen] = useState(false)
  const [activeTestWorkflow, setActiveTestWorkflow] = useState<{
    id: string
    name: string
  } | null>(null)

  const refetchWorkflows = async () => {
    if (!activeOrg?.id) return
    try {
      const res = await apiFetch<{ data?: WorkflowItem[] } | WorkflowItem[]>(
        `/api/v1/organizations/${activeOrg.id}/workflows`
      )
      const data =
        "data" in res && res.data ? res.data : Array.isArray(res) ? res : []
      setWorkflows(data)
    } catch {
      toast.error(t("workflows.notifications.loadFailed"))
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
            const data =
              "data" in wfRes && wfRes.data
                ? wfRes.data
                : Array.isArray(wfRes)
                  ? wfRes
                  : []
            setWorkflows(data)
          }
          if (tplRes) {
            const data =
              "data" in tplRes && tplRes.data
                ? tplRes.data
                : Array.isArray(tplRes)
                  ? tplRes
                  : []
            setTemplates(data)
          } else {
            setTemplates([
              {
                id: "transport-dispatch-automation",
                name: "Transport & Dispatch Automation",
                description:
                  "Extract waybill and kilometer data from inbound form, sync Driver & Waybill records, and alert Telegram if delayed.",
                icon: "Truck",
                trigger_type: "webhook",
              },
              {
                id: "lead-notification",
                name: "New Inbound Lead to Messenger",
                description:
                  "When a new contact record is created, evaluate inquiry urgency and send an instant Messenger notification to the team.",
                icon: "MessageSquare",
                trigger_type: "record.created",
              },
              {
                id: "blank-canvas",
                name: "Blank Canvas",
                description:
                  "Start completely from scratch with an empty canvas and trigger block.",
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
            name: t("workflows.untitledName"),
            is_active: false,
          },
        }
      )

      const created =
        "data" in res && res.data ? res.data : (res as { id: string })
      router.push(`/workflows/${created.id}`)
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : t("workflows.notifications.createFailed")
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

      const created =
        "data" in res && res.data ? res.data : (res as { id: string })
      toast.success(t("workflows.notifications.created"))
      setCreateOpen(false)
      router.push(`/workflows/${created.id}`)
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : t("workflows.notifications.createFailed")
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
      await apiFetch(`/api/v1/organizations/${activeOrg.id}/workflows/${id}`, {
        method: "PUT",
        body: { is_active: !current },
      })
      toast.success(
        !current
          ? t("workflows.notifications.activated")
          : t("workflows.notifications.paused")
      )
    } catch {
      toast.error(t("workflows.notifications.updateFailed"))
      void refetchWorkflows()
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!activeOrg?.id) return
    if (!confirm(t("workflows.deleteConfirmation", { name }))) return

    try {
      await apiFetch(`/api/v1/organizations/${activeOrg.id}/workflows/${id}`, {
        method: "DELETE",
      })
      setWorkflows((prev) => prev.filter((w) => w.id !== id))
      toast.success(t("workflows.notifications.deleted"))
    } catch {
      toast.error(t("workflows.notifications.deleteFailed"))
    }
  }

  const openCreateWithTemplate = (templateId: string, defaultName: string) => {
    setSelectedTemplateId(templateId)
    setWorkflowName(defaultName)
    setWorkflowDescription("")
    setCreateOpen(true)
  }

  const getTemplateText = (template: TemplateItem) => {
    if (template.id === "transport-dispatch-automation") {
      return {
        name: t("workflows.templates.transport.name"),
        description: t("workflows.templates.transport.description"),
      }
    }

    if (template.id === "lead-notification") {
      return {
        name: t("workflows.templates.lead.name"),
        description: t("workflows.templates.lead.description"),
      }
    }

    if (template.id === "blank-canvas") {
      return {
        name: t("workflows.templates.blank.name"),
        description: t("workflows.templates.blank.description"),
      }
    }

    return template
  }

  const getTriggerTypeLabel = (triggerType: string) => {
    if (triggerType === "webhook") {
      return t("workflows.triggerTypes.webhook")
    }

    if (triggerType === "record.created") {
      return t("workflows.triggerTypes.recordCreated")
    }

    if (triggerType === "manual") {
      return t("workflows.triggerTypes.manual")
    }

    return triggerType.replace(".", " ")
  }

  const getStatusLabel = (status: string) => {
    const knownStatuses = [
      "completed",
      "failed",
      "pending",
      "running",
      "skipped",
    ]

    return knownStatuses.includes(status)
      ? t(`workflows.statuses.${status}`)
      : status
  }

  const filteredWorkflows = workflows.filter(
    (w) =>
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      (w.description &&
        w.description.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="mx-auto max-w-7xl flex-1 space-y-8 p-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {t("workflows.title")}
            </h1>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground tabular-nums">
              {workflows.length}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("workflows.subtitle")}
          </p>
        </div>

        <Button
          onClick={handleQuickCreateWorkflow}
          disabled={isCreating}
          className="bg-emerald-600 text-white shadow-2xs hover:bg-emerald-700"
        >
          {isCreating ? (
            <Loader2Icon className="mr-1.5 size-4 animate-spin" />
          ) : (
            <PlusIcon className="mr-1.5 size-4" />
          )}
          {t("workflows.newWorkflow")}
        </Button>
      </div>

      {/* Starter Templates Banner */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          {t("workflows.starterTemplates")}
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div
            onClick={() =>
              openCreateWithTemplate(
                "transport-dispatch-automation",
                t("workflows.templates.transport.defaultName")
              )
            }
            className="group cursor-pointer rounded-xl border bg-card p-4 transition-all hover:border-emerald-500/50 hover:shadow-sm"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
                <TruckIcon className="size-5" />
              </span>
              <div className="min-w-0">
                <h3 className="truncate text-sm font-medium text-foreground transition-colors group-hover:text-emerald-600">
                  {t("workflows.templates.transport.name")}
                </h3>
                <span className="text-[11px] text-muted-foreground">
                  {t("workflows.triggerTypes.webhook")}
                </span>
              </div>
            </div>
            <p className="mt-2.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {t("workflows.templates.transport.description")}
            </p>
          </div>

          <div
            onClick={() =>
              openCreateWithTemplate(
                "lead-notification",
                t("workflows.templates.lead.defaultName")
              )
            }
            className="group cursor-pointer rounded-xl border bg-card p-4 transition-all hover:border-emerald-500/50 hover:shadow-sm"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
                <MessageSquareIcon className="size-5" />
              </span>
              <div className="min-w-0">
                <h3 className="truncate text-sm font-medium text-foreground transition-colors group-hover:text-emerald-600">
                  {t("workflows.templates.lead.name")}
                </h3>
                <span className="text-[11px] text-muted-foreground">
                  {t("workflows.triggerTypes.recordCreated")}
                </span>
              </div>
            </div>
            <p className="mt-2.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {t("workflows.templates.lead.description")}
            </p>
          </div>

          <div
            onClick={handleQuickCreateWorkflow}
            className="group cursor-pointer rounded-xl border border-dashed bg-card/60 p-4 transition-all hover:border-foreground/40 hover:shadow-sm"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-foreground">
                <SparklesIcon className="size-5" />
              </span>
              <div className="min-w-0">
                <h3 className="truncate text-sm font-medium text-foreground transition-colors group-hover:text-foreground">
                  {t("workflows.templates.blank.name")}
                </h3>
                <span className="text-[11px] text-muted-foreground">
                  {t("workflows.templates.blank.label")}
                </span>
              </div>
            </div>
            <p className="mt-2.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {t("workflows.templates.blank.description")}
            </p>
          </div>
        </div>
      </div>

      {/* Search & Workflows Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="relative max-w-sm flex-1">
            <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("workflows.searchPlaceholder")}
              className="pl-9 text-sm"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-sm text-muted-foreground">
            <Loader2Icon className="mb-3 size-6 animate-spin text-emerald-600" />
            {t("workflows.loading")}
          </div>
        ) : filteredWorkflows.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-card/40 p-12 text-center">
            <div className="mb-3 flex justify-center">
              <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <WorkflowIcon className="size-5" />
              </span>
            </div>
            <h3 className="text-base font-semibold text-foreground">
              {search ? t("workflows.noMatches") : t("workflows.noWorkflows")}
            </h3>
            <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
              {search
                ? t("workflows.tryDifferentKeywords")
                : t("workflows.emptyDescription")}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border bg-card shadow-2xs">
            <div className="divide-y">
              {filteredWorkflows.map((workflow) => (
                <div
                  key={workflow.id}
                  className="flex flex-col justify-between gap-4 p-4 transition-colors hover:bg-muted/25 sm:flex-row sm:items-center"
                >
                  <div className="flex min-w-0 items-start gap-3.5">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted/40 text-foreground">
                      <WorkflowIcon className="size-4 text-muted-foreground" />
                    </span>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/workflows/${workflow.id}`}
                          className="truncate text-sm font-semibold text-foreground transition-colors hover:text-emerald-600"
                        >
                          {workflow.name}
                        </Link>
                        <span className="rounded-full border bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground capitalize">
                          {getTriggerTypeLabel(workflow.trigger_type)}
                        </span>
                      </div>
                      <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                        {workflow.description || t("workflows.noDescription")}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center justify-between gap-6 sm:justify-end">
                    {/* Runs stats */}
                    <div className="hidden text-right md:block">
                      <div className="text-xs font-semibold text-foreground tabular-nums">
                        {t("workflows.runs", {
                          count: workflow.runs_count,
                        })}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {workflow.last_run ? (
                          <span className="flex items-center justify-end gap-1">
                            {workflow.last_run.status === "completed" ? (
                              <CheckCircle2Icon className="size-3 text-emerald-600" />
                            ) : (
                              <AlertCircleIcon className="size-3 text-destructive" />
                            )}
                            {t("workflows.lastRun", {
                              status: getStatusLabel(workflow.last_run.status),
                            })}
                          </span>
                        ) : (
                          t("workflows.neverExecuted")
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
                        aria-label={t("workflows.toggleActive")}
                      />
                      <span className="hidden text-xs text-muted-foreground sm:inline">
                        {workflow.is_active
                          ? t("workflows.active")
                          : t("workflows.paused")}
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setActiveTestWorkflow({
                            id: workflow.id,
                            name: workflow.name,
                          })
                          setTestModalOpen(true)
                        }}
                        className="h-8 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <PlayIcon className="mr-1 size-3.5 text-emerald-600" />
                        {t("workflows.test")}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        render={<Link href={`/workflows/${workflow.id}`} />}
                        className="h-8 text-xs"
                      >
                        {t("workflows.openBuilder")}
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(workflow.id, workflow.name)}
                        className="size-8 text-muted-foreground hover:text-destructive"
                        aria-label={t("workflows.deleteWorkflow")}
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
            <DialogTitle>{t("workflows.createDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("workflows.createDialog.description")}
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="gap-4 py-2">
            <Field>
              <FieldLabel htmlFor="wf-name">
                {t("workflows.createDialog.name")}
              </FieldLabel>
              <Input
                id="wf-name"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                placeholder={t("workflows.createDialog.namePlaceholder")}
                autoFocus
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="wf-desc">
                {t("workflows.createDialog.optionalDescription")}
              </FieldLabel>
              <Input
                id="wf-desc"
                value={workflowDescription}
                onChange={(e) => setWorkflowDescription(e.target.value)}
                placeholder={t("workflows.createDialog.descriptionPlaceholder")}
              />
            </Field>

            <Field>
              <FieldLabel>
                {t("workflows.createDialog.templatePreset")}
              </FieldLabel>
              <div className="max-h-48 space-y-2 overflow-y-auto">
                {templates.map((tmpl) => {
                  const templateText = getTemplateText(tmpl)

                  return (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => setSelectedTemplateId(tmpl.id)}
                      className={cn(
                        "w-full rounded-lg border p-2.5 text-left text-xs transition-all",
                        selectedTemplateId === tmpl.id
                          ? "border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500"
                          : "hover:bg-muted/40"
                      )}
                    >
                      <div className="font-semibold text-foreground">
                        {templateText.name}
                      </div>
                      <div className="mt-0.5 line-clamp-1 text-muted-foreground">
                        {templateText.description}
                      </div>
                    </button>
                  )
                })}
              </div>
            </Field>
          </FieldGroup>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setCreateOpen(false)}
              disabled={isCreating}
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleCreateWorkflow}
              disabled={isCreating || !workflowName.trim()}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {isCreating ? (
                <>
                  <Loader2Icon className="mr-1.5 size-4 animate-spin" />
                  {t("workflows.createDialog.creating")}
                </>
              ) : (
                t("workflows.createDialog.create")
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
