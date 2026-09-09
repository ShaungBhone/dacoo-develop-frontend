"use client"

import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import type { Node } from "@xyflow/react"
import {
  CheckIcon,
  CopyIcon,
  Trash2Icon,
  VariableIcon,
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import type { WorkflowCardData } from "./workflow-card"

export type WorkflowNodeConfig = {
  type?: string
  field?: string
  operator?: string
  value?: string
  prompt?: string
  fields?: string[] | string
  action?: string
  object_slug?: string
  mapping?: Record<string, string>
  channel?: string
  message?: string
  [key: string]: unknown
}

type WorkflowInspectorSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  node: Node<WorkflowCardData> | null
  onUpdateNode: (id: string, updates: Partial<WorkflowCardData>) => void
  onDeleteNode: (id: string) => void
  webhookUrl?: string | null
}

export function WorkflowInspectorSheet({
  open,
  onOpenChange,
  node,
  onUpdateNode,
  onDeleteNode,
  webhookUrl,
}: WorkflowInspectorSheetProps) {
  const [copiedWebhook, setCopiedWebhook] = useState(false)

  if (!node) {
    return null
  }

  const data = node.data
  const config = (data.config ?? {}) as WorkflowNodeConfig
  const tone = data.tone

  const handleCopyWebhook = async () => {
    if (!webhookUrl) return
    try {
      await navigator.clipboard.writeText(webhookUrl)
      setCopiedWebhook(true)
      toast.success("Webhook URL copied to clipboard")
      setTimeout(() => setCopiedWebhook(false), 2000)
    } catch {
      toast.error("Failed to copy URL")
    }
  }

  const updateConfig = (key: string, value: unknown) => {
    onUpdateNode(node.id, {
      config: {
        ...config,
        [key]: value,
      },
    })
  }

  const mapping = (config.mapping ?? {}) as Record<string, string>

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="w-full sm:max-w-md overflow-y-auto flex flex-col justify-between"
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
        <div className="space-y-6">
          <SheetHeader className="text-left">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {data.typeLabel}
              </span>
            </div>
            <SheetTitle className="text-lg font-semibold">{data.title}</SheetTitle>
            <SheetDescription>
              Configure the parameters, rules, and mappings for this step.
            </SheetDescription>
          </SheetHeader>

          {/* General Fields */}
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor="node-title">Step Title</FieldLabel>
              <Input
                id="node-title"
                value={data.title}
                onChange={(e) => onUpdateNode(node.id, { title: e.target.value })}
                placeholder="Step title…"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="node-description">Description</FieldLabel>
              <Textarea
                id="node-description"
                rows={2}
                value={data.description || ""}
                onChange={(e) =>
                  onUpdateNode(node.id, { description: e.target.value })
                }
                placeholder="What this step does…"
              />
            </Field>
          </FieldGroup>

          {/* Trigger Node Configuration */}
          {tone === "trigger" && (
            <FieldGroup className="gap-4 pt-4 border-t">
              <Field>
                <FieldLabel>Trigger Type</FieldLabel>
                <Select
                  value={config.type || "webhook"}
                  onValueChange={(val) => updateConfig("type", val)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select trigger…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="webhook">Inbound Webhook</SelectItem>
                    <SelectItem value="record.created">Record Created</SelectItem>
                    <SelectItem value="record.updated">Record Updated</SelectItem>
                    <SelectItem value="manual">Manual Test Run</SelectItem>
                    <SelectItem value="message.received">Inbound Channel Message</SelectItem>
                  </SelectContent>
                </Select>
                <FieldDescription>
                  When this trigger activates, it starts this automation workflow.
                </FieldDescription>
              </Field>
              {config.type === "webhook" && webhookUrl && (
                <Field>
                  <FieldLabel>Inbound Webhook URL</FieldLabel>
                  <div className="flex items-center gap-2">
                    <Input
                      readOnly
                      value={webhookUrl}
                      className="font-mono text-xs select-all"
                      spellCheck={false}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleCopyWebhook}
                      aria-label="Copy Webhook URL"
                    >
                      {copiedWebhook ? (
                        <CheckIcon className="size-4 text-emerald-600" />
                      ) : (
                        <CopyIcon className="size-4" />
                      )}
                    </Button>
                  </div>
                  <FieldDescription>
                    POST any JSON payload from Google Forms, Viber webhook, or scripts.
                  </FieldDescription>
                </Field>
              )}
            </FieldGroup>
          )}

          {/* Condition Node Configuration */}
          {tone === "condition" && (
            <FieldGroup className="gap-4 pt-4 border-t">
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-700 dark:text-amber-300">
                <strong>Branching Note:</strong> If this condition matches, the workflow proceeds through the <strong>True (Green)</strong> handle. Otherwise, it proceeds through <strong>False (Amber)</strong>.
              </div>

              <Field>
                <FieldLabel htmlFor="cond-field">Value Path to Check</FieldLabel>
                <Input
                  id="cond-field"
                  placeholder="e.g. trigger.status or trigger.kilo"
                  value={config.field || ""}
                  onChange={(e) => updateConfig("field", e.target.value)}
                  spellCheck={false}
                />
                <FieldDescription>
                  Supports variable paths like <code>trigger.kilo</code> or <code>node-id.output.field</code>.
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel>Comparison Operator</FieldLabel>
                <Select
                  value={config.operator || "equals"}
                  onValueChange={(val) => updateConfig("operator", val)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equals">Equals (==)</SelectItem>
                    <SelectItem value="not_equals">Not Equals (!=)</SelectItem>
                    <SelectItem value="greater_than">Greater Than (&gt;)</SelectItem>
                    <SelectItem value="less_than">Less Than (&lt;)</SelectItem>
                    <SelectItem value="contains">Contains text</SelectItem>
                    <SelectItem value="is_empty">Is Empty</SelectItem>
                    <SelectItem value="is_not_empty">Is Not Empty</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="cond-val">Expected Value</FieldLabel>
                <Input
                  id="cond-val"
                  placeholder="e.g. Delayed or 500"
                  value={config.value || ""}
                  onChange={(e) => updateConfig("value", e.target.value)}
                />
              </Field>
            </FieldGroup>
          )}

          {/* AI Node Configuration */}
          {tone === "ai" && (
            <FieldGroup className="gap-4 pt-4 border-t">
              <Field>
                <FieldLabel htmlFor="ai-prompt">Extraction / Generation Prompt</FieldLabel>
                <Textarea
                  id="ai-prompt"
                  rows={4}
                  placeholder="e.g. Extract driver name, vehicle number, start kilo, end kilo from incoming data…"
                  value={config.prompt || ""}
                  onChange={(e) => updateConfig("prompt", e.target.value)}
                />
                <FieldDescription>
                  Instruct the AI model how to interpret the input data or craft a reply.
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="ai-fields">Structured Extraction Keys</FieldLabel>
                <Input
                  id="ai-fields"
                  placeholder="driver_name, vehicle_no, kilo, status"
                  value={Array.isArray(config.fields) ? config.fields.join(", ") : (config.fields || "")}
                  onChange={(e) =>
                    updateConfig(
                      "fields",
                      e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean)
                    )
                  }
                  spellCheck={false}
                />
                <FieldDescription>
                  Comma-separated fields to make accessible as <code>&#123;&#123;node.output.field&#125;&#125;</code>.
                </FieldDescription>
              </Field>
            </FieldGroup>
          )}

          {/* Record Action Node Configuration */}
          {tone === "action" && (
            <FieldGroup className="gap-4 pt-4 border-t">
              <Field>
                <FieldLabel>Record Operation</FieldLabel>
                <Select
                  value={config.action || "create"}
                  onValueChange={(val) => updateConfig("action", val)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="create">Create New Record</SelectItem>
                    <SelectItem value="update">Update Existing Record</SelectItem>
                    <SelectItem value="find">Find Record</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="rec-object">Target Object</FieldLabel>
                <Input
                  id="rec-object"
                  placeholder="e.g. people, companies, deals"
                  value={config.object_slug || "deals"}
                  onChange={(e) => updateConfig("object_slug", e.target.value)}
                  spellCheck={false}
                />
              </Field>

              <Field>
                <div className="flex items-center justify-between">
                  <FieldLabel>Attribute Field Mappings</FieldLabel>
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <VariableIcon className="size-3" />
                    Use &#123;&#123;var&#125;&#125;
                  </span>
                </div>
                <div className="space-y-2">
                  <Input
                    placeholder="Title: e.g. Waybill: {{trigger.driver}}"
                    value={mapping.title || ""}
                    onChange={(e) =>
                      updateConfig("mapping", {
                        ...mapping,
                        title: e.target.value,
                      })
                    }
                  />
                  <Input
                    placeholder="Amount / Value: e.g. {{trigger.kilo}}"
                    value={mapping.amount || ""}
                    onChange={(e) =>
                      updateConfig("mapping", {
                        ...mapping,
                        amount: e.target.value,
                      })
                    }
                  />
                </div>
              </Field>
            </FieldGroup>
          )}

          {/* Channel Node Configuration */}
          {tone === "channel" && (
            <FieldGroup className="gap-4 pt-4 border-t">
              <Field>
                <FieldLabel>Destination Channel</FieldLabel>
                <Select
                  value={config.channel || "telegram"}
                  onValueChange={(val) => updateConfig("channel", val)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="telegram">Telegram</SelectItem>
                    <SelectItem value="viber">Viber</SelectItem>
                    <SelectItem value="messenger">Facebook Messenger</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="channel-msg">Message Content</FieldLabel>
                <Textarea
                  id="channel-msg"
                  rows={4}
                  placeholder="Type message text or use variables like {{trigger.driver}}…"
                  value={config.message || ""}
                  onChange={(e) => updateConfig("message", e.target.value)}
                />
                <FieldDescription>
                  Supports tokens such as <code>&#123;&#123;trigger.driver&#125;&#125;</code> and <code>&#123;&#123;node-ai-extract.output.summary&#125;&#125;</code>.
                </FieldDescription>
              </Field>
            </FieldGroup>
          )}
        </div>

        {/* Footer Actions */}
        <SheetFooter className="pt-6 border-t mt-6 flex-row items-center justify-between sm:justify-between">
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => {
              onDeleteNode(node.id)
              onOpenChange(false)
            }}
          >
            <Trash2Icon className="size-4 mr-1.5" />
            Delete Step
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Done
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
