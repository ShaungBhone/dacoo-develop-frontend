"use client"

import * as React from "react"
import { ChevronRightIcon, SparklesIcon } from "@/components/ui/icons"
import { ApiError } from "@/lib/api"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import {
  updateConversation,
  type Conversation,
  type OrganizationMember,
} from "./api"

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
}

interface AssignMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: number | string
  conversationId: number | string
  assignedToUserId: number | string | null
  preselectedUserId: number | string | null
  members: OrganizationMember[] | null
  onAssigned: (conversation: Conversation) => void
  onAssignAi: () => void
}

export function AssignMemberDialog({
  open,
  onOpenChange,
  organizationId,
  conversationId,
  assignedToUserId,
  preselectedUserId,
  members,
  onAssigned,
  onAssignAi,
}: AssignMemberDialogProps) {
  const [selectedId, setSelectedId] = React.useState<number | string | null>(
    assignedToUserId
  )
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!open) return

    setSelectedId(preselectedUserId ?? assignedToUserId)
    setError(null)
  }, [open, assignedToUserId, preselectedUserId])

  const hasChanged = selectedId !== assignedToUserId

  const handleAssign = async () => {
    if (selectedId === null) return

    setIsSubmitting(true)
    setError(null)
    try {
      const conversation = await updateConversation(
        organizationId,
        conversationId,
        {
          assigned_to_user_id: selectedId,
        }
      )
      onAssigned(conversation)
      onOpenChange(false)
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Something went wrong. Please try again."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign conversation</DialogTitle>
          <DialogDescription>
            Hand this conversation to Manion or a team member.
          </DialogDescription>
        </DialogHeader>

        <button
          className="flex items-center gap-3 rounded-xl border border-purple-500/25 bg-purple-500/5 p-3 text-left transition-colors hover:bg-purple-500/10"
          onClick={() => {
            onOpenChange(false)
            onAssignAi()
          }}
          type="button"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-background">
            <SparklesIcon className="size-4.5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Manion</p>
            <p className="truncate text-xs text-muted-foreground">
              Handles replies and escalates when needed
            </p>
          </div>
          <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
        </button>

        {members === null ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
          </div>
        ) : members.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No team members yet.
          </p>
        ) : (
          <RadioGroup
            value={selectedId !== null ? String(selectedId) : ""}
            onValueChange={(value) => setSelectedId(Number(value))}
            className="gap-0 overflow-hidden rounded-xl border border-border"
          >
            {members.map((member, index) => (
              <label
                key={member.id}
                className="flex cursor-pointer items-center gap-3 p-3"
                style={
                  index > 0
                    ? { borderTop: "1px solid var(--border)" }
                    : undefined
                }
              >
                <Avatar className="size-9 rounded-sm after:rounded-sm">
                  {member.avatarUrl ? (
                    <AvatarImage
                      className="rounded-sm"
                      src={member.avatarUrl}
                      alt=""
                    />
                  ) : null}
                  <AvatarFallback className="rounded-sm text-xs">
                    {initials(member.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{member.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {member.email}
                  </p>
                </div>
                <RadioGroupItem value={String(member.id)} />
              </label>
            ))}
          </RadioGroup>
        )}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <Button
          disabled={selectedId === null || !hasChanged || isSubmitting}
          onClick={handleAssign}
        >
          {isSubmitting ? <Spinner /> : null}
          Assign
        </Button>
      </DialogContent>
    </Dialog>
  )
}
