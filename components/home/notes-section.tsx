"use client"

import * as React from "react"
import type { NoteItem } from "./types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
import { Textarea } from "@/components/ui/textarea"
import {
  FileTextIcon,
  PlusIcon,
  Trash2Icon,
  PinIcon,
  TagIcon,
  ClockIcon,
  Edit2Icon,
} from "lucide-react"
import { cn } from "@/lib/utils"

type NotesSectionProps = {
  notes: NoteItem[]
  onAddNote: (data: Omit<NoteItem, "id" | "updatedAt" | "isPinned"> & { isPinned?: boolean }) => void
  onUpdateNote: (id: string, updates: Partial<NoteItem>) => void
  onTogglePin: (id: string) => void
  onDeleteNote: (id: string) => void
  isCreateOpen: boolean
  setIsCreateOpen: (open: boolean) => void
}

const COLOR_MAP: Record<NonNullable<NoteItem["color"]>, { border: string; bg: string; badge: "info-light" | "warning-light" | "success-light" | "destructive-light" | "secondary" }> = {
  default: {
    border: "border-border",
    bg: "bg-card",
    badge: "secondary",
  },
  blue: {
    border: "border-sky-500/30",
    bg: "bg-sky-500/5",
    badge: "info-light",
  },
  amber: {
    border: "border-amber-500/30",
    bg: "bg-amber-500/5",
    badge: "warning-light",
  },
  emerald: {
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/5",
    badge: "success-light",
  },
  purple: {
    border: "border-purple-500/30",
    bg: "bg-purple-500/5",
    badge: "info-light",
  },
  rose: {
    border: "border-rose-500/30",
    bg: "bg-rose-500/5",
    badge: "destructive-light",
  },
}

export function NotesSection({
  notes,
  onAddNote,
  onUpdateNote,
  onTogglePin,
  onDeleteNote,
  isCreateOpen,
  setIsCreateOpen,
}: NotesSectionProps) {
  const [editingNote, setEditingNote] = React.useState<NoteItem | null>(null)

  // Form state
  const [title, setTitle] = React.useState("")
  const [content, setContent] = React.useState("")
  const [tag, setTag] = React.useState("")
  const [color, setColor] = React.useState<NoteItem["color"]>("blue")
  const [isPinned, setIsPinned] = React.useState(false)

  // Sort: pinned notes first
  const sortedNotes = React.useMemo(() => {
    return [...notes].sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0))
  }, [notes])

  const openCreateDialog = () => {
    setEditingNote(null)
    setTitle("")
    setContent("")
    setTag("")
    setColor("blue")
    setIsPinned(false)
    setIsCreateOpen(true)
  }

  const openEditDialog = (note: NoteItem) => {
    setEditingNote(note)
    setTitle(note.title)
    setContent(note.content)
    setTag(note.tag || "")
    setColor(note.color || "default")
    setIsPinned(note.isPinned)
    setIsCreateOpen(true)
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() && !content.trim()) return

    if (editingNote) {
      onUpdateNote(editingNote.id, {
        title: title.trim() || "Untitled Note",
        content: content.trim(),
        tag: tag.trim() || undefined,
        color,
        isPinned,
      })
    } else {
      onAddNote({
        title: title.trim() || "Untitled Note",
        content: content.trim(),
        tag: tag.trim() || undefined,
        color,
        isPinned,
      })
    }

    setIsCreateOpen(false)
    setEditingNote(null)
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
            <FileTextIcon className="size-4" />
          </div>
          <div>
            <h2 className="font-heading text-base font-semibold text-foreground">
              Notes & Scratchpad
            </h2>
          </div>
          <Badge variant="secondary" size="sm" className="ml-1 font-mono">
            {notes.length}
          </Badge>
        </div>

        <Button
          variant="outline"
          size="xs"
          onClick={openCreateDialog}
          className="gap-1 text-xs"
        >
          <PlusIcon className="size-3" />
          <span>New Note</span>
        </Button>
      </div>

      {notes.length === 0 ? (
        <Card className="ring-1 ring-border/80 shadow-xs border-none">
          <CardContent className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground mb-2">
              <FileTextIcon className="size-5" />
            </div>
            <p className="text-sm font-medium text-foreground">
              No notes written yet
            </p>
            <p className="text-xs text-muted-foreground max-w-xs mt-0.5">
              Keep quick memos, meeting points, and scratchpad ideas handy.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={openCreateDialog}
              className="mt-3 gap-1 text-xs"
            >
              <PlusIcon className="size-3.5" />
              <span>Create First Note</span>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {sortedNotes.map((note) => {
            const colorConfig = COLOR_MAP[note.color || "default"] || COLOR_MAP.default

            return (
              <div
                key={note.id}
                className={cn(
                  "group relative flex flex-col justify-between rounded-xl border p-4 transition-all duration-200 hover:shadow-xs",
                  colorConfig.border,
                  colorConfig.bg
                )}
              >
                <div>
                  {/* Top Note Row: Pin & Tag */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {note.isPinned && (
                        <Badge
                          variant="invert-light"
                          size="xs"
                          className="gap-1 text-[10px] font-medium"
                        >
                          <PinIcon className="size-2.5 fill-current" />
                          Pinned
                        </Badge>
                      )}
                      {note.tag && (
                        <Badge
                          variant={colorConfig.badge}
                          size="xs"
                          className="text-[10px] font-medium truncate"
                        >
                          <TagIcon className="size-2.5" />
                          {note.tag}
                        </Badge>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => onTogglePin(note.id)}
                        className="text-muted-foreground hover:text-foreground"
                        title={note.isPinned ? "Unpin note" : "Pin to top"}
                      >
                        <PinIcon
                          className={cn("size-3.5", note.isPinned && "fill-current")}
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => openEditDialog(note)}
                        className="text-muted-foreground hover:text-foreground"
                        title="Edit note"
                      >
                        <Edit2Icon className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => onDeleteNote(note.id)}
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title="Delete note"
                      >
                        <Trash2Icon className="size-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Note Title */}
                  <h3
                    onClick={() => openEditDialog(note)}
                    className="text-sm font-semibold text-foreground cursor-pointer hover:text-primary transition-colors line-clamp-1"
                  >
                    {note.title}
                  </h3>

                  {/* Note Content */}
                  <p
                    onClick={() => openEditDialog(note)}
                    className="text-xs text-muted-foreground/90 mt-1 whitespace-pre-line line-clamp-3 cursor-pointer"
                  >
                    {note.content}
                  </p>
                </div>

                {/* Footer timestamp */}
                <div className="flex items-center gap-1 mt-3 pt-2 border-t border-border/40 text-[11px] text-muted-foreground">
                  <ClockIcon className="size-3 text-muted-foreground/70" />
                  <span>Updated {note.updatedAt}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create / Edit Note Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleFormSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileTextIcon className="size-4 text-sky-600" />
                <span>{editingNote ? "Edit Note" : "Create New Note"}</span>
              </DialogTitle>
              <DialogDescription>
                Jot down ideas, meeting minutes, or workspace reminders.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3.5 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="note-title" className="text-xs font-medium">
                  Note Title
                </Label>
                <Input
                  id="note-title"
                  placeholder="e.g. Key Takeaways from Product Sync"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="note-content" className="text-xs font-medium">
                  Content
                </Label>
                <Textarea
                  id="note-content"
                  placeholder="Type your notes or bullet points here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-28 text-sm"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="note-tag" className="text-xs font-medium">
                    Tag / Topic
                  </Label>
                  <Input
                    id="note-tag"
                    placeholder="e.g. Strategy, Ideas, Team"
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="note-color" className="text-xs font-medium">
                    Color Theme
                  </Label>
                  <select
                    id="note-color"
                    value={color}
                    onChange={(e) =>
                      setColor(e.target.value as NoteItem["color"])
                    }
                    className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                  >
                    <option value="blue">Blue Accent</option>
                    <option value="amber">Amber Accent</option>
                    <option value="emerald">Emerald Accent</option>
                    <option value="purple">Purple Accent</option>
                    <option value="rose">Rose Accent</option>
                    <option value="default">Default Neutral</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="note-pin"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="size-4 rounded border-input text-primary focus:ring-ring"
                />
                <Label htmlFor="note-pin" className="text-xs font-medium cursor-pointer">
                  Pin this note to the top
                </Label>
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
                {editingNote ? "Update Note" : "Save Note"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  )
}
