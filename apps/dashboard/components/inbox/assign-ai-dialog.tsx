"use client"

import * as React from "react"
import { CheckCheckIcon, SparklesIcon } from "@/components/ui/icons"
import { ApiError } from "@/lib/api"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { updateConversation, type Conversation } from "./api"

const CAPABILITIES = [
  "Automatically responds to common questions",
  "Escalates complex issues to your team",
  "Available 24/7 without interruption",
  "Learns from your team's conversations",
]

interface AssignAiDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: number | string
  conversationId: number | string
  onActivated: (conversation: Conversation) => void
}

export function AssignAiDialog({
  open,
  onOpenChange,
  organizationId,
  conversationId,
  onActivated,
}: AssignAiDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleActivate = async () => {
    setIsSubmitting(true)
    setError(null)
    try {
      const conversation = await updateConversation(organizationId, conversationId, {
        ai_handler: "ai-active",
      })
      onActivated(conversation)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign to Manion</DialogTitle>
          <DialogDescription>
            Let Manion handle replies automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-2xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-purple-500/15">
              <SparklesIcon className="size-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-bold">Manion</p>
              <p className="text-xs text-muted-foreground">Powered by Claude</p>
            </div>
          </div>

          <div className="my-3 h-px bg-border" />

          <p className="mb-2 text-[10px] font-bold tracking-wide text-muted-foreground">
            CAPABILITIES
          </p>
          <ul className="flex flex-col gap-2">
            {CAPABILITIES.map((capability) => (
              <li key={capability} className="flex items-center gap-2">
                <CheckCheckIcon className="size-3.5 shrink-0 text-primary" />
                <span className="text-sm">{capability}</span>
              </li>
            ))}
          </ul>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <Button disabled={isSubmitting} onClick={handleActivate}>
          {isSubmitting ? <Spinner /> : <SparklesIcon />}
          Activate Manion
        </Button>
      </DialogContent>
    </Dialog>
  )
}
