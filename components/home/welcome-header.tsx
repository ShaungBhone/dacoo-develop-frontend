"use client"

import * as React from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/reui/badge"
import {
  CalendarIcon,
  CheckCircle2Icon,
  FileTextIcon,
  PlusIcon,
  VideoIcon,
  SparklesIcon,
} from "lucide-react"

type WelcomeHeaderProps = {
  meetingsCount: number
  pendingTasksCount: number
  notesCount: number
  onOpenNewTask: () => void
  onOpenNewNote: () => void
  onOpenNewMeeting: () => void
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

function getFormattedDate() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

export function WelcomeHeader({
  meetingsCount,
  pendingTasksCount,
  notesCount,
  onOpenNewTask,
  onOpenNewNote,
  onOpenNewMeeting,
}: WelcomeHeaderProps) {
  const { user } = useAuth()
  
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => {
    // Only used to avoid SSR hydration mismatches for local time
    const t = setTimeout(() => setMounted(true), 0)
    return () => clearTimeout(t)
  }, [])

  const greeting = mounted ? getGreeting() : "Welcome"
  const currentDate = mounted ? getFormattedDate() : "Today"
  const firstName = user?.name ? user.name.split(" ")[0] : "there"

  return (
    <div className="flex flex-col gap-5 pt-2 pb-2">
      {/* Top row: Date & Greeting */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-xs font-medium tracking-wide uppercase text-muted-foreground">
          <CalendarIcon className="size-3.5" />
          <span>{currentDate}</span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
            {greeting}, <span className="text-primary">{firstName}</span> 👋
          </h1>
        </div>
        <p className="text-sm text-muted-foreground max-w-xl">
          Here is your daily snapshot. You have meetings to attend, actionable tasks on your plate, and workspace notes ready.
        </p>
      </div>

      {/* Metric summary badges */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant="primary-light"
          size="lg"
          className="rounded-full px-3 py-1 gap-1.5 text-xs font-medium cursor-default"
        >
          <VideoIcon className="size-3.5" />
          <span>
            {meetingsCount} {meetingsCount === 1 ? "Meeting" : "Meetings"} today
          </span>
        </Badge>

        <Badge
          variant={pendingTasksCount > 0 ? "warning-light" : "success-light"}
          size="lg"
          className="rounded-full px-3 py-1 gap-1.5 text-xs font-medium cursor-default"
        >
          <CheckCircle2Icon className="size-3.5" />
          <span>
            {pendingTasksCount} {pendingTasksCount === 1 ? "Task" : "Tasks"} pending
          </span>
        </Badge>

        <Badge
          variant="info-light"
          size="lg"
          className="rounded-full px-3 py-1 gap-1.5 text-xs font-medium cursor-default"
        >
          <FileTextIcon className="size-3.5" />
          <span>
            {notesCount} {notesCount === 1 ? "Note" : "Notes"} saved
          </span>
        </Badge>
      </div>

      {/* Quick action bar */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-b border-border pb-4">
        <span className="text-xs font-medium text-muted-foreground mr-1 flex items-center gap-1">
          <SparklesIcon className="size-3 text-amber-500" /> Quick actions:
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={onOpenNewTask}
          className="h-8 gap-1.5 text-xs font-medium shadow-xs"
        >
          <PlusIcon className="size-3.5 text-primary" />
          <span>New Task</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onOpenNewNote}
          className="h-8 gap-1.5 text-xs font-medium shadow-xs"
        >
          <FileTextIcon className="size-3.5 text-info-foreground" />
          <span>New Note</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onOpenNewMeeting}
          className="h-8 gap-1.5 text-xs font-medium shadow-xs"
        >
          <CalendarIcon className="size-3.5 text-emerald-600" />
          <span>Schedule Meeting</span>
        </Button>
      </div>
    </div>
  )
}
