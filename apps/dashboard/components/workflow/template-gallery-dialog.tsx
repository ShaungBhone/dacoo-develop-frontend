"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import {
  ArrowRightIcon,
  BotIcon,
  CheckIcon,
  MessageSquareIcon,
  SparklesIcon,
  TruckIcon,
} from "lucide-react"
import { useState } from "react"

export type StarterTemplate = {
  id: string
  name: string
  description: string
  icon: typeof TruckIcon
  iconColor: string
  stepsCount: number
  triggerLabel: string
}

const templates: StarterTemplate[] = [
  {
    id: "transport-dispatch-automation",
    name: "Transport & Dispatch Pipeline",
    description:
      "Triggered when a Waybill is created. Evaluates priority condition, updates kilometers, and alerts the dispatch channel.",
    icon: TruckIcon,
    iconColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    stepsCount: 5,
    triggerLabel: "Inbound Webhook / Waybills",
  },
  {
    id: "inbound-lead-routing",
    name: "Inbound Lead to Messenger Routing",
    description:
      "Captures incoming customer messages, leverages AI specialist extraction, and delivers instant replies to Messenger.",
    icon: MessageSquareIcon,
    iconColor: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    stepsCount: 3,
    triggerLabel: "Messenger Message Received",
  },
  {
    id: "ai-support-classifier",
    name: "AI Customer Support Assistant",
    description:
      "Classifies incoming customer inquiry intent, tags priority in CRM records, and coordinates responses.",
    icon: BotIcon,
    iconColor: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
    stepsCount: 4,
    triggerLabel: "Inbound Message",
  },
]

type TemplateGalleryDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onApplyTemplate: (templateId: string) => void
}

export function TemplateGalleryDialog({
  open,
  onOpenChange,
  onApplyTemplate,
}: TemplateGalleryDialogProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <SparklesIcon className="size-4" />
            </span>
            <DialogTitle>Start with a Workflow Template</DialogTitle>
          </div>
          <DialogDescription>
            Choose a battle-tested automation blueprint to jumpstart your workflow canvas.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-2">
          {templates.map((tmpl) => {
            const Icon = tmpl.icon
            const isSelected = selectedId === tmpl.id

            return (
              <div
                key={tmpl.id}
                onClick={() => setSelectedId(tmpl.id)}
                className={cn(
                  "flex items-start justify-between gap-4 p-4 rounded-xl border transition-all duration-150 cursor-pointer",
                  isSelected
                    ? "border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-xs"
                    : "border-border hover:border-foreground/30 hover:bg-muted/40"
                )}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <span
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-lg text-sm",
                      tmpl.iconColor
                    )}
                  >
                    <Icon className="size-5" />
                  </span>
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground">
                        {tmpl.name}
                      </span>
                      <span className="text-[11px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                        {tmpl.stepsCount} steps
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                      {tmpl.description}
                    </p>
                    <div className="text-[11px] text-muted-foreground/80 pt-0.5">
                      Trigger: <span className="font-medium text-foreground/80">{tmpl.triggerLabel}</span>
                    </div>
                  </div>
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant={isSelected ? "default" : "outline"}
                  className="shrink-0 gap-1.5 self-center"
                  onClick={(e) => {
                    e.stopPropagation()
                    onApplyTemplate(tmpl.id)
                    onOpenChange(false)
                  }}
                >
                  {isSelected ? (
                    <>
                      <CheckIcon className="size-3.5" />
                      Apply
                    </>
                  ) : (
                    <>
                      Use Template
                      <ArrowRightIcon className="size-3.5" />
                    </>
                  )}
                </Button>
              </div>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
