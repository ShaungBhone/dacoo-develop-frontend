"use client"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useActiveOrganization } from "@/hooks/use-active-organization"
import { apiFetch } from "@/lib/api"
import { cn } from "@/lib/utils"
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  ChevronRightIcon,
  ClockIcon,
  HistoryIcon,
  Loader2Icon,
  PlayIcon,
} from "lucide-react"
import { useEffect, useState } from "react"
import type { WorkflowStepLog } from "./workflow-test-modal"

export type WorkflowRunRecord = {
  id: string
  workflow_id: string
  trigger_source: string
  status: "pending" | "running" | "completed" | "failed"
  duration_ms: number | null
  finished_at: string | null
  created_at: string
  step_logs?: WorkflowStepLog[]
}

export function WorkflowRunsList({
  workflowId,
  onOpenTestModal,
}: {
  workflowId: string
  onOpenTestModal?: () => void
}) {
  const activeOrg = useActiveOrganization()
  const [runs, setRuns] = useState<WorkflowRunRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null)

  useEffect(() => {
    if (!activeOrg?.id || !workflowId) return

    let ignore = false

    const loadRuns = async () => {
      setIsLoading(true)
      try {
        const res = await apiFetch<{ data?: WorkflowRunRecord[] } | WorkflowRunRecord[]>(
          `/api/v1/organizations/${activeOrg.id}/workflows/${workflowId}/runs`
        )
        if (!ignore) {
          const data = "data" in res && res.data ? res.data : (Array.isArray(res) ? res : [])
          setRuns(data)
          if (data.length > 0) {
            setExpandedRunId(data[0].id)
          }
        }
      } catch {
        // ignore error
      } finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }

    void loadRuns()

    return () => {
      ignore = true
    }
  }, [activeOrg?.id, workflowId])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-sm text-muted-foreground">
        <Loader2Icon className="size-5 animate-spin mb-2" />
        Loading execution runs…
      </div>
    )
  }

  if (runs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <span className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <HistoryIcon className="size-6" />
        </span>
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-foreground">No executions recorded yet</h3>
          <p className="text-xs text-muted-foreground max-w-sm">
            Runs will show up here whenever this workflow is triggered or tested.
          </p>
        </div>
        {onOpenTestModal && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenTestModal}
            className="gap-1.5 rounded-lg"
          >
            <PlayIcon className="size-3.5" />
            Test workflow
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {runs.map((run) => {
        const isExpanded = expandedRunId === run.id
        const isSuccess = run.status === "completed"

        return (
          <div
            key={run.id}
            className="rounded-xl border bg-card overflow-hidden text-sm transition-all shadow-2xs"
          >
            <button
              type="button"
              className="w-full p-3.5 flex items-center justify-between text-left hover:bg-muted/30 transition-colors cursor-pointer"
              onClick={() => setExpandedRunId(isExpanded ? null : run.id)}
            >
              <div className="flex items-center gap-3 min-w-0">
                {isSuccess ? (
                  <CheckCircle2Icon className="size-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircleIcon className="size-4 text-destructive shrink-0" />
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-foreground capitalize">
                      {run.trigger_source} trigger
                    </span>
                    <span
                      className={cn(
                        "text-[10px] px-2 py-0.5 rounded font-semibold uppercase tracking-wider",
                        isSuccess
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-destructive/10 text-destructive"
                      )}
                    >
                      {run.status}
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    {run.finished_at ? new Date(run.finished_at).toLocaleString() : "Just now"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {run.duration_ms !== null && (
                  <span className="text-xs text-muted-foreground tabular-nums flex items-center gap-1">
                    <ClockIcon className="size-3" />
                    {run.duration_ms}&nbsp;ms
                  </span>
                )}
                {isExpanded ? (
                  <ChevronDownIcon className="size-4 text-muted-foreground" />
                ) : (
                  <ChevronRightIcon className="size-4 text-muted-foreground" />
                )}
              </div>
            </button>

            {isExpanded && (
              <div className="p-3.5 pt-0 space-y-2 border-t bg-muted/20">
                <div className="text-xs font-semibold text-muted-foreground pt-3">
                  Step Logs ({run.step_logs?.length || 0})
                </div>
                <div className="space-y-2">
                  {run.step_logs?.map((step, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border bg-background p-3 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between font-medium">
                        <span className="text-foreground font-semibold">{step.node_title}</span>
                        <span className="text-[11px] text-muted-foreground tabular-nums">
                          {step.duration_ms}&nbsp;ms
                        </span>
                      </div>
                      {step.output && (
                        <pre className="text-[10px] text-muted-foreground bg-muted/40 p-2 rounded-md font-mono overflow-x-auto max-h-40">
                          {JSON.stringify(step.output, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

type WorkflowHistorySheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  workflowId: string
  workflowName: string
  onOpenTestModal?: () => void
}

export function WorkflowHistorySheet({
  open,
  onOpenChange,
  workflowId,
  workflowName,
  onOpenTestModal,
}: WorkflowHistorySheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="w-full sm:max-w-md overflow-y-auto"
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
        <SheetHeader className="text-left pb-4 border-b">
          <div className="flex items-center gap-2">
            <HistoryIcon className="size-4 text-muted-foreground" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Run History
            </span>
          </div>
          <SheetTitle className="text-lg font-semibold">{workflowName}</SheetTitle>
          <SheetDescription>
            Past execution runs and detailed step outputs.
          </SheetDescription>
        </SheetHeader>

        <div className="py-4">
          <WorkflowRunsList
            workflowId={workflowId}
            onOpenTestModal={onOpenTestModal}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
