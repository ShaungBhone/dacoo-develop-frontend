"use client"

import * as React from "react"
import type { MeetingItem } from "./types"
import { Card, CardContent } from "@/components/ui/card"
import { Button, buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/reui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  VideoIcon,
  ClockIcon,
  ExternalLinkIcon,
  PlusIcon,
  Trash2Icon,
  CalendarIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

type MeetingsSectionProps = {
  meetings: MeetingItem[]
  onAddMeeting: (data: Omit<MeetingItem, "id">) => void
  onDeleteMeeting: (id: string) => void
  isCreateOpen: boolean
  setIsCreateOpen: (open: boolean) => void
}

export function MeetingsSection({
  meetings,
  onAddMeeting,
  onDeleteMeeting,
  isCreateOpen,
  setIsCreateOpen,
}: MeetingsSectionProps) {
  const [title, setTitle] = React.useState("")
  const [time, setTime] = React.useState("")
  const [duration, setDuration] = React.useState("30 mins")
  const [location, setLocation] = React.useState("Google Meet")
  const [joinUrl, setJoinUrl] = React.useState("")
  const [attendeesInput, setAttendeesInput] = React.useState("")

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !time.trim()) return

    const attendeeList = attendeesInput
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean)
      .map((name) => ({ name }))

    onAddMeeting({
      title: title.trim(),
      time: time.trim(),
      duration: duration.trim() || "30 mins",
      location: location.trim() || "Google Meet",
      joinUrl: joinUrl.trim() || undefined,
      attendees: attendeeList.length > 0 ? attendeeList : [{ name: "You" }],
      status: "upcoming",
    })

    setTitle("")
    setTime("")
    setDuration("30 mins")
    setLocation("Google Meet")
    setJoinUrl("")
    setAttendeesInput("")
    setIsCreateOpen(false)
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <VideoIcon className="size-4" />
          </div>
          <div>
            <h2 className="font-heading text-base font-semibold text-foreground">
              Today&apos;s Meetings
            </h2>
          </div>
          <Badge variant="secondary" size="sm" className="ml-1 font-mono">
            {meetings.length}
          </Badge>
        </div>

        <Button
          variant="outline"
          size="xs"
          onClick={() => setIsCreateOpen(true)}
          className="gap-1 text-xs"
        >
          <PlusIcon className="size-3" />
          <span>Schedule</span>
        </Button>
      </div>

      <Card className="ring-1 ring-border/80 shadow-xs border-none">
        <CardContent className="p-0 divide-y divide-border">
          {meetings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground mb-2">
                <CalendarIcon className="size-5" />
              </div>
              <p className="text-sm font-medium text-foreground">
                No meetings scheduled for today
              </p>
              <p className="text-xs text-muted-foreground max-w-xs mt-0.5">
                Enjoy your focused work time or schedule a new sync with team members.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCreateOpen(true)}
                className="mt-3 gap-1 text-xs"
              >
                <PlusIcon className="size-3.5" />
                <span>Schedule a Meeting</span>
              </Button>
            </div>
          ) : (
            meetings.map((meeting) => (
              <div
                key={meeting.id}
                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 transition-colors hover:bg-muted/40"
              >
                <div className="flex items-start gap-3 min-w-0">
                  {/* Time Badge */}
                  <div className="flex flex-col items-center justify-center shrink-0 w-16 py-1.5 px-1 rounded-lg bg-muted/70 text-center border border-border/60">
                    <span className="text-xs font-semibold text-foreground leading-tight">
                      {meeting.time}
                    </span>
                    <span className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                      {meeting.duration}
                    </span>
                  </div>

                  {/* Title & Metadata */}
                  <div className="flex flex-col min-w-0">
                    <h3 className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                      {meeting.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <ClockIcon className="size-3 text-muted-foreground" />
                        {meeting.location || "Online"}
                      </span>

                      {meeting.attendees && meeting.attendees.length > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground/60">•</span>
                          <div className="flex -space-x-1.5 overflow-hidden py-0.5">
                            {meeting.attendees.slice(0, 3).map((attendee, idx) => (
                              <Avatar
                                key={idx}
                                size="sm"
                                className="size-5 ring-1 ring-background"
                              >
                                {attendee.avatarUrl && (
                                  <AvatarImage
                                    src={attendee.avatarUrl}
                                    alt={attendee.name}
                                  />
                                )}
                                <AvatarFallback className="text-[9px] font-medium uppercase">
                                  {attendee.name.slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                          </div>
                          <span className="text-[11px] text-muted-foreground ml-0.5">
                            {meeting.attendees.length}{" "}
                            {meeting.attendees.length === 1 ? "person" : "people"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {meeting.joinUrl && (
                    <a
                      href={meeting.joinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        buttonVariants({ variant: "default", size: "sm" }),
                        "h-7 text-xs gap-1 font-medium bg-primary text-primary-foreground"
                      )}
                    >
                      <span>Join</span>
                      <ExternalLinkIcon className="size-3" />
                    </a>
                  )}

                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => onDeleteMeeting(meeting.id)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-opacity"
                    title="Remove meeting"
                  >
                    <Trash2Icon className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Schedule Meeting Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <VideoIcon className="size-4 text-primary" />
                <span>Schedule a Meeting</span>
              </DialogTitle>
              <DialogDescription>
                Add details for an upcoming meeting or video sync.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3.5 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="meeting-title" className="text-xs font-medium">
                  Meeting Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="meeting-title"
                  placeholder="e.g. Sprint Planning, Client Demo"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="h-8 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="meeting-time" className="text-xs font-medium">
                    Time <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="meeting-time"
                    placeholder="e.g. 10:30 AM"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="meeting-duration" className="text-xs font-medium">
                    Duration
                  </Label>
                  <Input
                    id="meeting-duration"
                    placeholder="e.g. 30 mins"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="meeting-location" className="text-xs font-medium">
                    Platform / Location
                  </Label>
                  <Input
                    id="meeting-location"
                    placeholder="Google Meet / Zoom"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="meeting-url" className="text-xs font-medium">
                    Meeting Link
                  </Label>
                  <Input
                    id="meeting-url"
                    placeholder="https://meet.google.com/..."
                    value={joinUrl}
                    onChange={(e) => setJoinUrl(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="meeting-attendees" className="text-xs font-medium">
                  Attendees (comma-separated)
                </Label>
                <Input
                  id="meeting-attendees"
                  placeholder="Sarah Jenkins, Alex Chen"
                  value={attendeesInput}
                  onChange={(e) => setAttendeesInput(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" className="gap-1">
                <span>Save Meeting</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  )
}
