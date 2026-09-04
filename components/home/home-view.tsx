"use client"

import * as React from "react"
import { useHomeStore } from "./use-home-store"
import { WelcomeHeader } from "./welcome-header"
import { MeetingsSection } from "./meetings-section"
import { TasksSection } from "./tasks-section"
import { NotesSection } from "./notes-section"

export function HomeView() {
  const {
    meetings,
    tasks,
    notes,
    addTask,
    toggleTask,
    deleteTask,
    addMeeting,
    deleteMeeting,
    addNote,
    updateNote,
    togglePinNote,
    deleteNote,
  } = useHomeStore()

  // Modal controls
  const [isTaskModalOpen, setIsTaskModalOpen] = React.useState(false)
  const [isNoteModalOpen, setIsNoteModalOpen] = React.useState(false)
  const [isMeetingModalOpen, setIsMeetingModalOpen] = React.useState(false)

  const pendingTasksCount = tasks.filter((t) => !t.completed).length

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-background">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 sm:py-8 space-y-8 pb-20">
        {/* Welcoming Header */}
        <WelcomeHeader
          meetingsCount={meetings.length}
          pendingTasksCount={pendingTasksCount}
          notesCount={notes.length}
          onOpenNewTask={() => setIsTaskModalOpen(true)}
          onOpenNewNote={() => setIsNoteModalOpen(true)}
          onOpenNewMeeting={() => setIsMeetingModalOpen(true)}
        />

        {/* 1. Upcoming Meetings */}
        <MeetingsSection
          meetings={meetings}
          onAddMeeting={addMeeting}
          onDeleteMeeting={deleteMeeting}
          isCreateOpen={isMeetingModalOpen}
          setIsCreateOpen={setIsMeetingModalOpen}
        />

        {/* 2. Tasks & To-Dos */}
        <TasksSection
          tasks={tasks}
          onAddTask={addTask}
          onToggleTask={toggleTask}
          onDeleteTask={deleteTask}
          isCreateOpen={isTaskModalOpen}
          setIsCreateOpen={setIsTaskModalOpen}
        />

        {/* 3. Quick Notes & Scratchpad */}
        <NotesSection
          notes={notes}
          onAddNote={addNote}
          onUpdateNote={updateNote}
          onTogglePin={togglePinNote}
          onDeleteNote={deleteNote}
          isCreateOpen={isNoteModalOpen}
          setIsCreateOpen={setIsNoteModalOpen}
        />
      </div>
    </div>
  )
}
