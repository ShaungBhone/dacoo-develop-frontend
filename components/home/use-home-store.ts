"use client"

import * as React from "react"
import { nanoid } from "nanoid"
import type { TaskItem, MeetingItem, NoteItem } from "./types"

const STORAGE_KEY = "dacoo_home_dashboard_data_v1"

const DEFAULT_MEETINGS: MeetingItem[] = [
  {
    id: "m-1",
    title: "Weekly Product Strategy & Roadmap Review",
    time: "10:30 AM",
    duration: "45 mins",
    joinUrl: "https://meet.google.com/abc-defg-hij",
    location: "Google Meet",
    status: "upcoming",
    attendees: [
      { name: "Sarah Jenkins", avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150" },
      { name: "Alex Chen", avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150" },
      { name: "Mia Wong", avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150" },
    ],
  },
  {
    id: "m-2",
    title: "Design System & UI Polish Sync",
    time: "02:00 PM",
    duration: "30 mins",
    joinUrl: "https://meet.google.com/xyz-uvwx-rst",
    location: "Google Meet",
    status: "upcoming",
    attendees: [
      { name: "David Kim", avatarUrl: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150" },
      { name: "Elena Rostova", avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150" },
    ],
  },
  {
    id: "m-3",
    title: "Enterprise Client Demo & Q&A",
    time: "04:15 PM",
    duration: "45 mins",
    joinUrl: "https://zoom.us/j/1234567890",
    location: "Zoom",
    status: "upcoming",
    attendees: [
      { name: "Marcus Vance", avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150" },
      { name: "Sophia Lee", avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150" },
    ],
  },
]

const DEFAULT_TASKS: TaskItem[] = [
  {
    id: "t-1",
    title: "Review and approve Q3 marketing automation workflow",
    completed: false,
    dueDate: "Today",
    priority: "high",
    category: "Marketing",
    createdAt: new Date().toISOString(),
  },
  {
    id: "t-2",
    title: "Finalize API documentation for new customer endpoints",
    completed: false,
    dueDate: "Today",
    priority: "medium",
    category: "Engineering",
    createdAt: new Date().toISOString(),
  },
  {
    id: "t-3",
    title: "Prepare slide deck for enterprise client onboarding",
    completed: false,
    dueDate: "Tomorrow",
    priority: "high",
    category: "Sales",
    createdAt: new Date().toISOString(),
  },
  {
    id: "t-4",
    title: "Audit workspace team permissions & billing limits",
    completed: true,
    dueDate: "Yesterday",
    priority: "low",
    category: "Admin",
    createdAt: new Date().toISOString(),
  },
  {
    id: "t-5",
    title: "Set up automated test coverage for inbox webhook handler",
    completed: false,
    dueDate: "Aug 24",
    priority: "medium",
    category: "Engineering",
    createdAt: new Date().toISOString(),
  },
]

const DEFAULT_NOTES: NoteItem[] = [
  {
    id: "n-1",
    title: "Key Takeaways from Product Sync",
    content: "• Align on ReUI styling across all tables & drawers\n• Improve first-load performance on mobile chat\n• Ship new onboarding checklist by end of sprint",
    tag: "Strategy",
    color: "blue",
    isPinned: true,
    updatedAt: "10 mins ago",
  },
  {
    id: "n-2",
    title: "Customer Feedback on AI Assistant",
    content: "Users love the live typing stream, but requested faster tool action responses and clearer error indicators when rate limits trigger.",
    tag: "Feedback",
    color: "purple",
    isPinned: true,
    updatedAt: "2 hours ago",
  },
  {
    id: "n-3",
    title: "Sprint Retrospective Notes",
    content: "Keep daily standups capped at 15 minutes. Good progress on auth migration.",
    tag: "Team",
    color: "emerald",
    isPinned: false,
    updatedAt: "Yesterday",
  },
]

function getInitialData<T>(key: "meetings" | "tasks" | "notes", defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (parsed[key] && Array.isArray(parsed[key])) {
        return parsed[key] as T
      }
    }
  } catch {
    // Ignore JSON errors
  }
  return defaultValue
}

export function useHomeStore() {
  const [meetings, setMeetings] = React.useState<MeetingItem[]>(() =>
    getInitialData("meetings", DEFAULT_MEETINGS)
  )
  const [tasks, setTasks] = React.useState<TaskItem[]>(() =>
    getInitialData("tasks", DEFAULT_TASKS)
  )
  const [notes, setNotes] = React.useState<NoteItem[]>(() =>
    getInitialData("notes", DEFAULT_NOTES)
  )

  // Persist to localStorage on update
  React.useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ meetings, tasks, notes })
      )
    } catch {
      // Ignore localStorage errors
    }
  }, [meetings, tasks, notes])

  // Task actions
  const addTask = React.useCallback(
    (data: Omit<TaskItem, "id" | "createdAt" | "completed">) => {
      const newTask: TaskItem = {
        ...data,
        id: `t-${nanoid(6)}`,
        completed: false,
        createdAt: new Date().toISOString(),
      }
      setTasks((prev) => [newTask, ...prev])
      return newTask
    },
    []
  )

  const toggleTask = React.useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    )
  }, [])

  const deleteTask = React.useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const updateTask = React.useCallback((id: string, updates: Partial<TaskItem>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    )
  }, [])

  // Meeting actions
  const addMeeting = React.useCallback(
    (data: Omit<MeetingItem, "id">) => {
      const newMeeting: MeetingItem = {
        ...data,
        id: `m-${nanoid(6)}`,
      }
      setMeetings((prev) => [...prev, newMeeting])
      return newMeeting
    },
    []
  )

  const deleteMeeting = React.useCallback((id: string) => {
    setMeetings((prev) => prev.filter((m) => m.id !== id))
  }, [])

  // Note actions
  const addNote = React.useCallback(
    (data: Omit<NoteItem, "id" | "updatedAt" | "isPinned"> & { isPinned?: boolean }) => {
      const newNote: NoteItem = {
        ...data,
        id: `n-${nanoid(6)}`,
        isPinned: data.isPinned ?? false,
        updatedAt: "Just now",
      }
      setNotes((prev) => [newNote, ...prev])
      return newNote
    },
    []
  )

  const updateNote = React.useCallback((id: string, updates: Partial<NoteItem>) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === id
          ? { ...n, ...updates, updatedAt: "Just now" }
          : n
      )
    )
  }, [])

  const togglePinNote = React.useCallback((id: string) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isPinned: !n.isPinned } : n))
    )
  }, [])

  const deleteNote = React.useCallback((id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id))
  }, [])

  return {
    meetings,
    tasks,
    notes,
    addTask,
    toggleTask,
    deleteTask,
    updateTask,
    addMeeting,
    deleteMeeting,
    addNote,
    updateNote,
    togglePinNote,
    deleteNote,
  }
}
