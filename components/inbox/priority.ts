import type { ConversationPriority } from "./api"

export interface PriorityMeta {
  value: ConversationPriority
  label: string
  color: string
  bgColor: string
  dotColor: string
}

export const PRIORITY_CONFIG: Record<ConversationPriority, PriorityMeta> = {
  low: {
    value: "low",
    label: "Low",
    color: "text-slate-400 dark:text-slate-400",
    bgColor: "bg-slate-500/10",
    dotColor: "bg-slate-400",
  },
  normal: {
    value: "normal",
    label: "Normal",
    color: "text-blue-500 dark:text-blue-400",
    bgColor: "bg-blue-500/10",
    dotColor: "bg-blue-500",
  },
  high: {
    value: "high",
    label: "High",
    color: "text-amber-500 dark:text-amber-400",
    bgColor: "bg-amber-500/10",
    dotColor: "bg-amber-500",
  },
  urgent: {
    value: "urgent",
    label: "Urgent",
    color: "text-rose-500 dark:text-rose-400",
    bgColor: "bg-rose-500/10",
    dotColor: "bg-rose-500",
  },
}

export const PRIORITY_OPTIONS: PriorityMeta[] = [
  PRIORITY_CONFIG.low,
  PRIORITY_CONFIG.normal,
  PRIORITY_CONFIG.high,
  PRIORITY_CONFIG.urgent,
]
