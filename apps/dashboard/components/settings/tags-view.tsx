"use client"

import * as React from "react"
import {
  PlusIcon,
  RefreshCwIcon,
  TagIcon,
  Trash2Icon,
  TriangleAlertIcon,
} from "@/components/ui/icons"
import { toast } from "sonner"

import { ApiError } from "@/lib/api"
import { useOrganization } from "@/contexts/organization-context"
import { DataTable } from "@/components/data-table"
import {
  createTag,
  deleteTag,
  fetchTags,
  type TagRecord,
  updateTag,
} from "@/components/settings/tags-api"
import { buildTagColumns } from "@/components/settings/tags-table-columns"
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/reui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"

import { StageColorPicker } from "@/components/records/stage-color-picker"
import { getTagColor } from "@/lib/tag-colors"

type TagFormMode = "create" | "rename"

function TagFormDialog({
  open,
  mode,
  tag,
  onOpenChange,
  onSave,
}: {
  open: boolean
  mode: TagFormMode
  tag: TagRecord | null
  onOpenChange: (open: boolean) => void
  onSave: (name: string, color: string) => Promise<void>
}) {
  const [name, setName] = React.useState("")
  const [color, setColor] = React.useState("blue")
  const [isColorTouched, setIsColorTouched] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [nameError, setNameError] = React.useState<string | null>(null)
  const [generalError, setGeneralError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (open) {
      if (mode === "rename" && tag) {
        setName(tag.name ?? "")
        setColor(tag.color ?? getTagColor(tag.name).name)
        setIsColorTouched(!!tag.color)
      } else {
        setName("")
        setColor("blue")
        setIsColorTouched(false)
      }
      setNameError(null)
      setGeneralError(null)
    }
  }, [open, mode, tag])

  const normalizedName = name.trim()
  const canSubmit = normalizedName.length > 0 && normalizedName.length <= 255

  const handleNameChange = (val: string) => {
    setName(val)
    setNameError(null)
    if (!isColorTouched && mode === "create") {
      setColor(getTagColor(val).name)
    }
  }

  const handleColorChange = (newColor: string) => {
    setColor(newColor)
    setIsColorTouched(true)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!normalizedName) {
      setNameError("Enter a tag name.")
      return
    }

    if (normalizedName.length > 255) {
      setNameError("Tag names must be 255 characters or fewer.")
      return
    }

    setSubmitting(true)
    setNameError(null)
    setGeneralError(null)

    try {
      await onSave(normalizedName, color)
      onOpenChange(false)
    } catch (error) {
      if (error instanceof ApiError) {
        setNameError(error.errors?.name?.[0] ?? null)
        setGeneralError(error.errors?.name ? null : error.message)
      } else {
        setGeneralError(
          mode === "create"
            ? "Failed to create the tag. Please try again."
            : "Failed to update the tag. Please try again."
        )
      }
    } finally {
      setSubmitting(false)
    }
  }

  const isRename = mode === "rename"

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!submitting) onOpenChange(nextOpen)
      }}
    >
      <DialogContent>
        <form className="contents" onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isRename ? "Edit tag" : "Create tag"}</DialogTitle>
            <DialogDescription>
              {isRename
                ? "Update the name and color shown wherever this tag is used."
                : "Create a reusable colored tag for conversations and messages."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            {generalError && (
              <Alert variant="destructive">
                <TriangleAlertIcon aria-hidden="true" />
                <AlertDescription>{generalError}</AlertDescription>
              </Alert>
            )}

            <Field data-invalid={nameError ? true : undefined}>
              <FieldLabel htmlFor="tag-name">Name</FieldLabel>
              <Input
                id="tag-name"
                name="name"
                value={name}
                onChange={(event) => handleNameChange(event.target.value)}
                maxLength={255}
                autoComplete="off"
                autoFocus
                placeholder="e.g., VIP customer"
                aria-invalid={nameError ? true : undefined}
              />
              {nameError && <FieldError>{nameError}</FieldError>}
            </Field>

            <Field>
              <FieldLabel>Color</FieldLabel>
              <StageColorPicker
                color={color}
                onChange={handleColorChange}
                variant="field"
              />
            </Field>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit || submitting}>
              {submitting && <Spinner />}
              {isRename ? "Save changes" : "Create tag"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DeleteTagDialog({
  tag,
  onOpenChange,
  onConfirm,
}: {
  tag: TagRecord
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
}) {
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function handleConfirm() {
    setSubmitting(true)
    setError(null)

    try {
      await onConfirm()
      onOpenChange(false)
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiError
          ? caughtError.message
          : "Failed to delete the tag. Please try again."
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(nextOpen) => {
        if (!submitting) onOpenChange(nextOpen)
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <TriangleAlertIcon className="size-4" aria-hidden="true" />
            </span>
            Delete tag
          </DialogTitle>
          <DialogDescription>
            Delete{" "}
            <span className="font-medium text-foreground">{tag?.name}</span>? It
            will be removed from every conversation and message where it is
            used. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <TriangleAlertIcon aria-hidden="true" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={submitting}
          >
            {submitting ? <Spinner /> : <Trash2Icon aria-hidden="true" />}
            Delete tag
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function TagsTableSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-3 p-4">
      <Skeleton className="h-9 w-full max-w-sm rounded-lg" />
      {[0, 1, 2, 3, 4, 5].map((row) => (
        <Skeleton key={row} className="h-10 w-full rounded-md" />
      ))}
    </div>
  )
}

function OrganizationTags({ organizationId }: { organizationId: number }) {
  const [tags, setTags] = React.useState<TagRecord[]>([])
  const [loading, setLoading] = React.useState(true)
  const [loadError, setLoadError] = React.useState<string | null>(null)
  const [reloadKey, setReloadKey] = React.useState(0)
  const [formMode, setFormMode] = React.useState<TagFormMode>("create")
  const [formOpen, setFormOpen] = React.useState(false)
  const [editingTag, setEditingTag] = React.useState<TagRecord | null>(null)
  const [deletingTag, setDeletingTag] = React.useState<TagRecord | null>(null)

  React.useEffect(() => {
    let cancelled = false

    fetchTags(organizationId)
      .then((records) => {
        if (!cancelled) setTags(records)
      })
      .catch((error) => {
        if (!cancelled) {
          setLoadError(
            error instanceof ApiError ? error.message : "Failed to load tags."
          )
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [organizationId, reloadKey])

  const handleRename = React.useCallback((tag: TagRecord) => {
    setEditingTag(tag)
    setFormMode("rename")
    setFormOpen(true)
  }, [])

  const columns = React.useMemo(
    () =>
      buildTagColumns({
        onRename: handleRename,
        onDelete: setDeletingTag,
      }),
    [handleRename]
  )

  async function handleSave(name: string, color: string) {
    if (organizationId === null) return

    if (formMode === "rename" && editingTag) {
      const updated = await updateTag(organizationId, editingTag.id, name, color)
      setTags((current) =>
        current.map((tag) => (tag.id === updated.id ? updated : tag))
      )
      toast.success("Tag updated")
      return
    }

    const created = await createTag(organizationId, name, color)
    setTags((current) => [
      created,
      ...current.filter((tag) => tag.id !== created.id),
    ])
    toast.success("Tag created")
  }

  async function handleDelete() {
    if (organizationId === null || !deletingTag) return

    await deleteTag(organizationId, deletingTag.id)
    setTags((current) => current.filter((tag) => tag.id !== deletingTag.id))
    toast.success("Tag deleted")
  }

  function openCreateDialog() {
    setEditingTag(null)
    setFormMode("create")
    setFormOpen(true)
  }

  function retryLoad() {
    setTags([])
    setLoading(true)
    setLoadError(null)
    setReloadKey((current) => current + 1)
  }

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key.toLowerCase() === "c" || e.key.toLowerCase() === "n") &&
        !["INPUT", "TEXTAREA", "SELECT"].includes(
          (e.target as HTMLElement)?.tagName
        )
      ) {
        e.preventDefault()
        openCreateDialog()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [openCreateDialog])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {loadError && (
        <div className="shrink-0 p-4">
          <Alert variant="destructive">
            <TriangleAlertIcon className="size-4" aria-hidden="true" />
            <AlertTitle className="text-balance">
              Failed to load tags
            </AlertTitle>
            <AlertDescription>{loadError}</AlertDescription>
            <AlertAction>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={retryLoad}
              >
                <RefreshCwIcon aria-hidden="true" />
                Retry
              </Button>
            </AlertAction>
          </Alert>
        </div>
      )}

      {loading ? (
        <TagsTableSkeleton />
      ) : (
        <DataTable
          columns={columns}
          data={tags}
          searchPlaceholder="Search tags…"
          searchableColumnIds={["name", "creator"]}
          initialPageSize={20}
          columnsLabel="View"
          emptyMessage="No tags yet. Create your first tag to get started."
          getRowId={(tag) => String(tag.id)}
          toolbarActions={
            <Button type="button" onClick={openCreateDialog}>
              <PlusIcon data-icon="inline-start" aria-hidden="true" />
              Create tag
            </Button>
          }
          className="min-h-0 flex-1 gap-0"
          toolbarClassName="shrink-0 border-b border-border px-4 py-2"
          containerClassName="min-h-0 flex-1 overflow-auto relative"
          headerClassName="bg-muted"
          rowClassName="bg-background hover:bg-muted/40"
          footerClassName="shrink-0 border-t border-border px-4 py-2"
        />
      )}

      {formOpen && (
        <TagFormDialog
          open
          mode={formMode}
          tag={editingTag}
          onOpenChange={setFormOpen}
          onSave={handleSave}
        />
      )}

      {deletingTag && (
        <DeleteTagDialog
          tag={deletingTag}
          onOpenChange={(open) => {
            if (!open) setDeletingTag(null)
          }}
          onConfirm={handleDelete}
        />
      )}
    </div>
  )
}

export function TagsView() {
  const { activeOrganization } = useOrganization()

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      {activeOrganization ? (
        <OrganizationTags
          key={activeOrganization.id}
          organizationId={activeOrganization.id}
        />
      ) : (
        <Empty className="min-h-96 border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <TagIcon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>No organization selected</EmptyTitle>
            <EmptyDescription>
              Select or create an organization from the workspace switcher to
              manage its tags.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  )
}
