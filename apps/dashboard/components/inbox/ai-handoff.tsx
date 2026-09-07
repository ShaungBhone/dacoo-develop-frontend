"use client"

import type { ReactNode } from "react"
import { CheckIcon, SparklesIcon, TriangleAlertIcon, UserRoundCheckIcon, UsersIcon } from "@/components/ui/icons"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { AiHandlerState } from "./api"

type AiTone = "ai" | "attention" | "reclaimed"

const TONE_CLASSES: Record<AiTone, string> = {
  ai: "bg-purple-500/15 text-purple-600 dark:text-purple-400",
  attention: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  reclaimed: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
}

function timeLabel(timestamp: string) {
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp))
}

interface AiTonePillProps {
  tone: AiTone
  icon: ReactNode
  children: ReactNode
  onClick?: () => void
  className?: string
}

function AiTonePill({ tone, icon, children, onClick, className }: AiTonePillProps) {
  const Tag = onClick ? "button" : "div"

  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "flex h-7 items-center gap-1.5 rounded-full px-3 text-xs font-semibold",
        onClick && "transition-opacity hover:opacity-80",
        TONE_CLASSES[tone],
        className
      )}
    >
      {icon}
      {children}
    </Tag>
  )
}

interface AiStatusPillProps {
  state: Exclude<AiHandlerState, "human">
  reason?: string | null
  onClick?: () => void
}

export function AiStatusPill({ state, reason, onClick }: AiStatusPillProps) {
  const needsAttention = state === "needs-attention"
  const isInsufficientCredit = reason === "insufficient_credit"
  const label = isInsufficientCredit ? "No credits" : needsAttention ? "Needs attention" : "AI Active"

  return (
    <AiTonePill
      tone={needsAttention ? "attention" : "ai"}
      icon={
        needsAttention ? (
          <TriangleAlertIcon className="size-3.5" />
        ) : (
          <SparklesIcon className="size-3.5" />
        )
      }
      onClick={onClick}
    >
      {label}
    </AiTonePill>
  )
}

interface AiEscalationCardProps {
  reason?: string | null
  onAssignToMe: () => void
  onAssignToTeam: () => void
}

export function AiEscalationCard({ reason, onAssignToMe, onAssignToTeam }: AiEscalationCardProps) {
  const isInsufficientCredit = reason === "insufficient_credit"
  const label = isInsufficientCredit ? "Manion ran out of credits" : "Manion escalated this"

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-amber-500/10 px-3.5 py-2.5">
      <AiTonePill tone="attention" icon={<TriangleAlertIcon className="size-3.5" />}>
        {label}
      </AiTonePill>
      <div className="flex gap-2">
        <Button onClick={onAssignToMe} size="sm" variant="outline">
          <UserRoundCheckIcon />
          Assign to me
        </Button>
        <Button onClick={onAssignToTeam} size="sm" variant="outline">
          <UsersIcon />
          Assign to team
        </Button>
      </div>
    </div>
  )
}

interface AiTimelineEventProps {
  type: "handoff" | "reclaimed"
  changedAt: string
  agentName?: string | null
}

export function AiTimelineEvent({ type, changedAt, agentName }: AiTimelineEventProps) {
  const reclaimed = type === "reclaimed"
  const label = reclaimed ? `${agentName ?? "A team member"} took over from Manion` : "Handed off to Manion"

  return (
    <div className="flex items-center gap-2">
      <div className="h-px flex-1 bg-border" />
      <AiTonePill
        tone={reclaimed ? "reclaimed" : "ai"}
        icon={reclaimed ? <CheckIcon className="size-3" /> : <SparklesIcon className="size-3" />}
        className="h-auto px-2.5 py-1 text-[10.5px]"
      >
        {label} · {timeLabel(changedAt)}
      </AiTonePill>
      <div className="h-px flex-1 bg-border" />
    </div>
  )
}
