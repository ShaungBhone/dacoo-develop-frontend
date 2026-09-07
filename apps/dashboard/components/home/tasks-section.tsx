"use client"

import * as React from "react"
import type { TaskItem, TaskPriority } from "./types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/reui/badge"
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
  CheckSquareIcon,
  PlusIcon,
  Trash2Icon,
  CalendarIcon,
  TagIcon,
  CheckCircle2Icon,
} from "lucide-react"
import { cn } from "@/lib/utils"

type TasksSectionProps = {
  tasks: TaskItem[]
  onAddTask: (data: Omit<TaskItem, "id" | "createdAt" | "completed">) => void
  onToggleTask: (id: string) => void
  onDeleteTask: (id: string) => void
  isCreateOpen: boolean
  setIsCreateOpen: (open: boolean) => void
}

export function TasksSection({
  tasks,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  isCreateOpen,
  setIsCreateOpen,
}: TasksSectionProps) {
  const [filter, setFilter] = React.useState<"all" | "pending" | "completed">("all")
  const [quickTitle, setQuickTitle] = React.useState("")
  
  // Dialog state
  const [dialogTitle, setDialogTitle] = React.useState("")
  const [dialogPriority, setDialogPriority] = React.useState<TaskPriority>("medium")
  const [dialogDueDate, setDialogDueDate] = React.useState("Today")
  const [dialogCategory, setDialogCategory] = React.useState("")

  const pendingCount = tasks.filter((t) => !t.completed).length

  const filteredTasks = React.useMemo(() => {
    if (filter === "pending") return tasks.filter((t) => !t.completed)
    if (filter === "completed") return tasks.filter((t) => t.completed)
    return tasks
  }, [tasks, filter])

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickTitle.trim()) return

    onAddTask({
      title: quickTitle.trim(),
      priority: "medium",
      dueDate: "Today",
      category: "General",
    })
    setQuickTitle("")
  }

  const handleDialogSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!dialogTitle.trim()) return

    onAddTask({
      title: dialogTitle.trim(),
      priority: dialogPriority,
      dueDate: dialogDueDate.trim() || "Today",
      category: dialogCategory.trim() || undefined,
    })

    setDialogTitle("")
    setDialogPriority("medium")
    setDialogDueDate("Today")
    setDialogCategory("")
    setIsCreateOpen(false)
  }

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case "high":
        return (
          <Badge variant="destructive-light" size="xs" className="font-medium">
            High
          </Badge>
        )
      case "medium":
        return (
          <Badge variant="warning-light" size="xs" className="font-medium">
            Medium
          </Badge>
        )
      case "low":
      default:
        return (
          <Badge variant="outline" size="xs" className="font-medium text-muted-foreground">
            Low
          </Badge>
        )
    }
  }

  return (
    <section className="space-y-3">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckSquareIcon className="size-4" />
          </div>
          <div>
            <h2 className="font-heading text-base font-semibold text-foreground">
              Tasks & To-Dos
            </h2>
          </div>
          <Badge variant="secondary" size="sm" className="ml-1 font-mono">
            {pendingCount} left
          </Badge>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border border-border/40 text-xs">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={cn(
              "px-2.5 py-1 rounded-md font-medium transition-colors",
              filter === "all"
                ? "bg-background text-foreground shadow-2xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            All ({tasks.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("pending")}
            className={cn(
              "px-2.5 py-1 rounded-md font-medium transition-colors",
              filter === "pending"
                ? "bg-background text-foreground shadow-2xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Pending ({pendingCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter("completed")}
            className={cn(
              "px-2.5 py-1 rounded-md font-medium transition-colors",
              filter === "completed"
                ? "bg-background text-foreground shadow-2xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Done ({tasks.length - pendingCount})
          </button>
        </div>
      </div>

      <Card className="ring-1 ring-border/80 shadow-xs border-none overflow-hidden">
        <CardContent className="p-0 divide-y divide-border">
          {/* Quick Add Inline Row */}
          <form
            onSubmit={handleQuickAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-muted/20 focus-within:bg-muted/40 transition-colors"
          >
            <PlusIcon className="size-4 text-muted-foreground shrink-0" />
            <input
              type="text"
              placeholder="Add a new task and press enter..."
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              className="w-full bg-transparent text-sm placeholder:text-muted-foreground/70 outline-none"
            />
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => setIsCreateOpen(true)}
              className="text-xs text-muted-foreground hover:text-foreground shrink-0"
            >
              Details
            </Button>
          </form>

          {/* Task List */}
          {filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <CheckCircle2Icon className="size-8 text-muted-foreground/40 mb-1.5" />
              <p className="text-sm font-medium text-foreground">
                {filter === "completed"
                  ? "No completed tasks yet"
                  : "All caught up! No tasks left"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Type above to add your next goal.
              </p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div
                key={task.id}
                className={cn(
                  "group flex items-start justify-between gap-3 p-3.5 transition-colors hover:bg-muted/40",
                  task.completed && "bg-muted/15 opacity-70"
                )}
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="pt-0.5">
                    <Checkbox
                      checked={task.completed}
                      onCheckedChange={() => onToggleTask(task.id)}
                      className="cursor-pointer"
                    />
                  </div>

                  <div className="flex flex-col min-w-0 flex-1">
                    <span
                      onClick={() => onToggleTask(task.id)}
                      className={cn(
                        "text-sm font-medium text-foreground cursor-pointer select-none transition-all",
                        task.completed && "line-through text-muted-foreground"
                      )}
                    >
                      {task.title}
                    </span>

                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                      {task.dueDate && (
                        <span className="inline-flex items-center gap-1 text-[11px]">
                          <CalendarIcon className="size-3 text-muted-foreground" />
                          {task.dueDate}
                        </span>
                      )}

                      {task.category && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/80">
                          <TagIcon className="size-3" />
                          {task.category}
                        </span>
                      )}

                      {getPriorityBadge(task.priority)}
                    </div>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => onDeleteTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-opacity shrink-0"
                  title="Delete task"
                >
                  <Trash2Icon className="size-3.5" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Add Task Detailed Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleDialogSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckSquareIcon className="size-4 text-emerald-600" />
                <span>Create New Task</span>
              </DialogTitle>
              <DialogDescription>
                Define a task with priority, due date, and category.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3.5 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="task-title" className="text-xs font-medium">
                  Task Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="task-title"
                  placeholder="e.g. Audit workspace team permissions"
                  value={dialogTitle}
                  onChange={(e) => setDialogTitle(e.target.value)}
                  required
                  className="h-8 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="task-priority" className="text-xs font-medium">
                    Priority
                  </Label>
                  <select
                    id="task-priority"
                    value={dialogPriority}
                    onChange={(e) =>
                      setDialogPriority(e.target.value as TaskPriority)
                    }
                    className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="task-due-date" className="text-xs font-medium">
                    Due Date
                  </Label>
                  <Input
                    id="task-due-date"
                    placeholder="Today / Tomorrow"
                    value={dialogDueDate}
                    onChange={(e) => setDialogDueDate(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="task-category" className="text-xs font-medium">
                  Category / Tag
                </Label>
                <Input
                  id="task-category"
                  placeholder="e.g. Marketing, Engineering, Sales"
                  value={dialogCategory}
                  onChange={(e) => setDialogCategory(e.target.value)}
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
              <Button type="submit" size="sm">
                Save Task
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  )
}
