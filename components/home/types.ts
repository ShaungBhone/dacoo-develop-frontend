export type TaskPriority = "low" | "medium" | "high"

export type TaskItem = {
  id: string
  title: string
  completed: boolean
  dueDate?: string
  priority: TaskPriority
  category?: string
  createdAt: string
}

export type MeetingAttendee = {
  name: string
  email?: string
  avatarUrl?: string
}

export type MeetingItem = {
  id: string
  title: string
  time: string
  duration: string
  joinUrl?: string
  location?: string
  attendees: MeetingAttendee[]
  status?: "upcoming" | "in_progress" | "completed"
}

export type NoteItem = {
  id: string
  title: string
  content: string
  tag?: string
  color?: "default" | "blue" | "amber" | "emerald" | "purple" | "rose"
  isPinned: boolean
  updatedAt: string
}
