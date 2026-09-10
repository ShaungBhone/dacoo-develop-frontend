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
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  ClockIcon,
  Loader2Icon,
  PlayIcon,
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/api"
import { useActiveOrganization } from "@/hooks/use-active-organization"

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
      toast.error("Invalid JSON payload. Please check your syntax.")
      return
    }

    setIsRunning(true)
    setRunResult(null)

    try {
      const response = await apiFetch<{ data?: WorkflowTestRunResult } | WorkflowTestRunResult>(
        `/api/v1/organizations/${activeOrg.id}/workflows/${workflowId}/test-run`,
        {
          method: "POST",
          body: { payload: parsedPayload },
        }
      )

      const data = "data" in response && response.data ? response.data : (response as WorkflowTestRunResult)
      setRunResult(data)
      onRunFinished?.(data)
      toast.success("Workflow test completed successfully")
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to execute workflow test"
      toast.error(message)
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Test Run: {workflowName}</DialogTitle>
          <DialogDescription>
            Simulate a trigger event with sample payload data.
          </DialogDescription>
        </DialogHeader>

        <FieldGroup className="gap-4 py-2">
          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="test-payload">Sample Event Payload (JSON)</FieldLabel>
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
                Load Sample 2
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
              Values in this payload will be accessible to your steps via <code>&#123;&#123;trigger.key&#125;&#125;</code>.
            </FieldDescription>
          </Field>

          {/* Results section */}
          {runResult && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold flex items-center gap-1.5">
                  {runResult.status === "completed" ? (
                    <CheckCircle2Icon className="size-4 text-emerald-600" />
                  ) : (
                    <AlertCircleIcon className="size-4 text-destructive" />
                  )}
                  Execution Results
                </h4>
                <span className="text-xs text-muted-foreground tabular-nums flex items-center gap-1">
                  <ClockIcon className="size-3" />
                  {runResult.duration_ms ?? 0}&nbsp;ms
                </span>
              </div>

              {runResult.error_message && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive">
                  {runResult.error_message}
                </div>
              )}

              {/* Step Logs */}
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {runResult.step_logs?.map((step, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border bg-muted/30 p-2.5 text-xs space-y-1"
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
                                ? "text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200"
                                : "text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200"
                            }
                          >
                            Branch: {step.branch.toUpperCase()}
                          </span>
                        )}
                        <span className="text-muted-foreground tabular-nums text-[11px]">
                          {step.duration_ms}&nbsp;ms
                        </span>
                      </div>
                    </div>
                    {step.output && (
                      <pre className="text-[11px] text-muted-foreground bg-background/80 p-1.5 rounded border overflow-x-auto font-mono">
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
          <DialogClose render={<Button variant="outline" disabled={isRunning} />}>
            Cancel
          </DialogClose>
          <Button
            type="button"
            onClick={handleRun}
            disabled={isRunning}
          >
            {isRunning ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                Executing…
              </>
            ) : (
              <>
                Run Test
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
