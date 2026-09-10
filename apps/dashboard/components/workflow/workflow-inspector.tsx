"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
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
  FieldTitle,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import type { Node } from "@xyflow/react"
import {
  CheckIcon,
  CopyIcon,
  MessageSquareIcon,
  PlayIcon,
  PlusCircleIcon,
  RefreshCwIcon,
  WebhookIcon,
} from "lucide-react"
import { Fragment, useEffect, useState } from "react"
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

const TRIGGER_TYPES = [
  {
    value: "webhook",
    label: "Inbound Webhook",
    icon: WebhookIcon,
  },
  {
    value: "record.created",
    label: "Record Created",
    icon: PlusCircleIcon,
  },
  {
    value: "record.updated",
    label: "Record Updated",
    icon: RefreshCwIcon,
  },
  {
    value: "manual",
    label: "Manual Test Run",
    icon: PlayIcon,
  },
  {
    value: "message.received",
    label: "Inbound Channel Message",
    icon: MessageSquareIcon,
  },
]

export type WorkflowInspectorDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  node: Node<WorkflowCardData> | null
  onUpdateNode: (id: string, updates: Partial<WorkflowCardData>) => void
  onDeleteNode: (id: string) => void
  webhookUrl?: string | null
}

export function WorkflowInspectorDialog({
  open,
  onOpenChange,
  node,
  onUpdateNode,
  onDeleteNode,
  webhookUrl,
}: WorkflowInspectorDialogProps) {
  const [copiedWebhook, setCopiedWebhook] = useState(false)
  const [title, setTitle] = useState(node?.data.title ?? "")
  const [description, setDescription] = useState(node?.data.description ?? "")
  const [config, setConfig] = useState<WorkflowNodeConfig>(
    (node?.data.config ?? {}) as WorkflowNodeConfig
  )

  useEffect(() => {
    if (node) {
      setTitle(node.data.title)
      setDescription(node.data.description || "")
      setConfig((node.data.config ?? {}) as WorkflowNodeConfig)
    }
  }, [node])

  if (!node) {
    return null
  }

  const data = node.data
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
    setConfig((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleSave = () => {
    onUpdateNode(node.id, {
      title,
      description,
      config,
    })
    onOpenChange(false)
  }

  const handleDelete = () => {
    onDeleteNode(node.id)
    onOpenChange(false)
  }

  const mapping = (config.mapping ?? {}) as Record<string, string>

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title || data.title}</DialogTitle>
          <DialogDescription>
            Configure the parameters, rules, and mappings for this step.
          </DialogDescription>
        </DialogHeader>

        <FieldGroup className="gap-4 py-2">
          {/* General Fields */}
          <Field>
            <FieldLabel htmlFor="node-title">Step Title</FieldLabel>
            <Input
              id="node-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Step title…"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="node-description">Description</FieldLabel>
            <Textarea
              id="node-description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What this step does…"
            />
          </Field>

          {/* Trigger Node Configuration */}
          {tone === "trigger" && (
            <>
              <Field>
                <FieldLabel>Trigger Type</FieldLabel>
                <Card className="w-full p-0">
                  <FieldGroup className="gap-0">
                    {TRIGGER_TYPES.map((item, index) => {
                      const Icon = item.icon
                      const isSelected =
                        (config.type || "webhook") === item.value
                      return (
                        <Fragment key={item.value}>
                          {index > 0 && <Separator />}
                          <Field>
                            <FieldLabel className="w-full justify-between px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors">
                              <FieldTitle className="flex items-center gap-2">
                                <Icon
                                  aria-hidden="true"
                                  className="size-4 opacity-60"
                                />
                                {item.label}
                              </FieldTitle>
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() =>
                                  updateConfig("type", item.value)
                                }
                              />
                            </FieldLabel>
                          </Field>
                        </Fragment>
                      )
                    })}
                  </FieldGroup>
                </Card>
                <FieldDescription>
                  When this trigger activates, it starts this automation
                  workflow.
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
                    POST any JSON payload from Google Forms, Viber webhook, or
                    scripts.
                  </FieldDescription>
                </Field>
              )}
            </>
          )}

          {/* Condition Node Configuration */}
          {tone === "condition" && (
            <>
              <Field>
                <FieldLabel htmlFor="cond-field">
                  Value Path to Check
                </FieldLabel>
                <Input
                  id="cond-field"
                  placeholder="e.g. trigger.status or trigger.kilo"
                  value={config.field || ""}
                  onChange={(e) => updateConfig("field", e.target.value)}
                  spellCheck={false}
                />
                <FieldDescription>
                  Supports variable paths like <code>trigger.kilo</code> or{" "}
                  <code>node-id.output.field</code>.
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
                    <SelectItem value="not_equals">
                      Not Equals (!=)
                    </SelectItem>
                    <SelectItem value="greater_than">
                      Greater Than (&gt;)
                    </SelectItem>
                    <SelectItem value="less_than">
                      Less Than (&lt;)
                    </SelectItem>
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
            </>
          )}

          {/* AI Node Configuration */}
          {tone === "ai" && (
            <>
              <Field>
                <FieldLabel htmlFor="ai-prompt">
                  Extraction / Generation Prompt
                </FieldLabel>
                <Textarea
                  id="ai-prompt"
                  rows={4}
                  placeholder="e.g. Extract driver name, vehicle number, start kilo, end kilo from incoming data…"
                  value={config.prompt || ""}
                  onChange={(e) => updateConfig("prompt", e.target.value)}
                />
                <FieldDescription>
                  Instruct the AI model how to interpret the input data or
                  craft a reply.
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="ai-fields">
                  Structured Extraction Keys
                </FieldLabel>
                <Input
                  id="ai-fields"
                  placeholder="driver_name, vehicle_no, kilo, status"
                  value={
                    Array.isArray(config.fields)
                      ? config.fields.join(", ")
                      : config.fields || ""
                  }
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
                  Comma-separated fields to make accessible as{" "}
                  <code>&#123;&#123;node.output.field&#125;&#125;</code>.
                </FieldDescription>
              </Field>
            </>
          )}

          {/* Record Action Node Configuration */}
          {tone === "action" && (
            <>
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
                    <SelectItem value="update">
                      Update Existing Record
                    </SelectItem>
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
                  onChange={(e) =>
                    updateConfig("object_slug", e.target.value)
                  }
                  spellCheck={false}
                />
              </Field>

              <Field>
                <FieldLabel>Attribute Field Mappings</FieldLabel>
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
            </>
          )}

          {/* Channel Node Configuration */}
          {tone === "channel" && (
            <>
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
                    <SelectItem value="messenger">
                      Facebook Messenger
                    </SelectItem>
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
                  Supports tokens such as{" "}
                  <code>&#123;&#123;trigger.driver&#125;&#125;</code>.
                </FieldDescription>
              </Field>
            </>
          )}
        </FieldGroup>

        <DialogFooter>
          <Button
            type="button"
            variant="destructive"
            className="mr-auto"
            onClick={handleDelete}
          >
            Delete
          </Button>

          <DialogClose render={<Button variant="outline" />}>
            Cancel
          </DialogClose>
          <Button
            type="button"
            onClick={handleSave}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export const WorkflowInspectorSheet = WorkflowInspectorDialog
export type WorkflowInspectorSheetProps = WorkflowInspectorDialogProps
