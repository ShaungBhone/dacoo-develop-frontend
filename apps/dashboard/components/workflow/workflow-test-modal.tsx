"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  ClockIcon,
  Loader2Icon,
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/api"
import { useActiveOrganization } from "@/hooks/use-active-organization"
import { useTranslation } from "@/contexts/language-context"

export type WorkflowStepLog = {
  node_id: string
  node_title: string
  status: "pending" | "running" | "completed" | "failed" | "skipped"
  duration_ms: number
  branch?: string
  input?: Record<string, unknown>
  output?: Record<string, unknown>
  error?: string
}

export type WorkflowTestRunResult = {
  id: string
  status: "pending" | "running" | "completed" | "failed"
  duration_ms: number
  trigger_type: string
  error_message?: string | null
  step_logs?: WorkflowStepLog[]
}

type WorkflowTestRunModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  workflowId: string
  workflowName: string
  onRunFinished?: (run: WorkflowTestRunResult) => void
}

export function WorkflowTestRunModal({
  open,
  onOpenChange,
  workflowId,
  workflowName,
  onRunFinished,
}: WorkflowTestRunModalProps) {
  const activeOrg = useActiveOrganization()
  const { t } = useTranslation()
  const [payloadText, setPayloadText] = useState(
    JSON.stringify(
      {
        driver: "Ko Aung",
        vehicle_no: "YGN-9A/1234",
        kilo: 650,
        status: "Delayed",
        customer: "Acme Logistics",
      },
      null,
      2
    )
  )
  const [isRunning, setIsRunning] = useState(false)
  const [runResult, setRunResult] = useState<WorkflowTestRunResult | null>(null)

  const handleRun = async () => {
    if (!activeOrg?.id) return

    let parsedPayload: Record<string, unknown> = {}
    try {
      parsedPayload = JSON.parse(payloadText) as Record<string, unknown>
    } catch {
      toast.error(t("workflows.notifications.invalidJson"))
      return
    }

    setIsRunning(true)
    setRunResult(null)

    try {
      const response = await apiFetch<
        { data?: WorkflowTestRunResult } | WorkflowTestRunResult
      >(
        `/api/v1/organizations/${activeOrg.id}/workflows/${workflowId}/test-run`,
        {
          method: "POST",
          body: { payload: parsedPayload },
        }
      )

      const data =
        "data" in response && response.data
          ? response.data
          : (response as WorkflowTestRunResult)
      setRunResult(data)
      onRunFinished?.(data)
      toast.success(t("workflows.notifications.testCompleted"))
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : t("workflows.notifications.testFailed")
      toast.error(message)
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {t("workflows.testRun.title", { name: workflowName })}
          </DialogTitle>
          <DialogDescription>
            {t("workflows.testRun.description")}
          </DialogDescription>
        </DialogHeader>

        <FieldGroup className="gap-4 py-2">
          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="test-payload">
                {t("workflows.testRun.payloadLabel")}
              </FieldLabel>
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs"
                onClick={() =>
                  setPayloadText(
                    JSON.stringify(
                      {
                        driver: "U Mya",
                        vehicle_no: "MDY-2B/5678",
                        kilo: 320,
                        status: "On Time",
                      },
                      null,
                      2
                    )
                  )
                }
              >
                {t("workflows.testRun.loadSample")}
              </Button>
            </div>
            <Textarea
              id="test-payload"
              rows={6}
              value={payloadText}
              onChange={(e) => setPayloadText(e.target.value)}
              className="font-mono text-xs"
              spellCheck={false}
            />
            <FieldDescription>
              {t("workflows.testRun.payloadHelp")}
            </FieldDescription>
          </Field>

          {/* Results section */}
          {runResult && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="flex items-center gap-1.5 text-sm font-semibold">
                  {runResult.status === "completed" ? (
                    <CheckCircle2Icon className="size-4 text-emerald-600" />
                  ) : (
                    <AlertCircleIcon className="size-4 text-destructive" />
                  )}
                  {t("workflows.testRun.results")}
                </h4>
                <span className="flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
                  <ClockIcon className="size-3" />
                  {runResult.duration_ms ?? 0}&nbsp;ms
                </span>
              </div>

              {runResult.error_message && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-2.5 text-xs text-destructive">
                  {runResult.error_message}
                </div>
              )}

              {/* Step Logs */}
              <div className="max-h-60 space-y-2 overflow-y-auto">
                {runResult.step_logs?.map((step, idx) => (
                  <div
                    key={idx}
                    className="space-y-1 rounded-lg border bg-muted/30 p-2.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">
                        {step.node_title}
                      </span>
                      <div className="flex items-center gap-2">
                        {step.branch && (
                          <span
                            className={
                              step.branch === "true"
                                ? "rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600"
                                : "rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600"
                            }
                          >
                            {t("workflows.testRun.branch", {
                              branch: step.branch.toUpperCase(),
                            })}
                          </span>
                        )}
                        <span className="text-[11px] text-muted-foreground tabular-nums">
                          {step.duration_ms}&nbsp;ms
                        </span>
                      </div>
                    </div>
                    {step.output && (
                      <pre className="overflow-x-auto rounded border bg-background/80 p-1.5 font-mono text-[11px] text-muted-foreground">
                        {JSON.stringify(step.output, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </FieldGroup>

        <DialogFooter>
          <DialogClose
            render={<Button variant="outline" disabled={isRunning} />}
          >
            {t("common.cancel")}
          </DialogClose>
          <Button type="button" onClick={handleRun} disabled={isRunning}>
            {isRunning ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                {t("workflows.testRun.executing")}
              </>
            ) : (
              <>{t("workflows.testRun.run")}</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
