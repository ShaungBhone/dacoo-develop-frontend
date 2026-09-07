"use client"

import * as React from "react"
import {
  MessageSquareTextIcon,
  PencilIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  Trash2Icon,
  TriangleAlertIcon,
} from "@/components/ui/icons"
import { toast } from "sonner"

import { ApiError } from "@/lib/api"
import { useOrganization } from "@/contexts/organization-context"
import {
  createSavedReply,
  deleteSavedReply,
  fetchSavedReplies,
  type SavedReply,
  type SavedReplyInput,
  updateSavedReply,
} from "@/components/settings/saved-replies-api"
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
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { TypographyH3, TypographyMuted } from "@/components/ui/typography"

const byTitle = (left: SavedReply, right: SavedReply) =>
  left.title.localeCompare(right.title, undefined, { sensitivity: "base" })

function SavedReplyFormDialog({
  savedReply,
  onOpenChange,
  onSave,
}: {
  savedReply: SavedReply | null
  onOpenChange: (open: boolean) => void
  onSave: (input: SavedReplyInput) => Promise<void>
}) {
  const [title, setTitle] = React.useState(savedReply?.title ?? "")
  const [body, setBody] = React.useState(savedReply?.body ?? "")
  const [submitting, setSubmitting] = React.useState(false)
  const [errors, setErrors] = React.useState<{
    title?: string
    body?: string
    general?: string
  }>({})
  const isEditing = savedReply !== null
  const normalizedTitle = title.trim()
  const normalizedBody = body.trim()
  const canSubmit =
    normalizedTitle.length > 0 &&
    normalizedTitle.length <= 100 &&
    normalizedBody.length > 0 &&
    normalizedBody.length <= 5000

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors: typeof errors = {}
    if (!normalizedTitle) nextErrors.title = "Enter a title."
    if (normalizedTitle.length > 100)
      nextErrors.title = "Titles must be 100 characters or fewer."
    if (!normalizedBody) nextErrors.body = "Enter a reply."
    if (normalizedBody.length > 5000)
      nextErrors.body = "Replies must be 5,000 characters or fewer."

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setSubmitting(true)
    setErrors({})

    try {
      await onSave({ title: normalizedTitle, body: normalizedBody })
      onOpenChange(false)
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors({
          title: error.errors?.title?.[0],
          body: error.errors?.body?.[0],
          general:
            error.errors?.title || error.errors?.body
              ? undefined
              : error.message,
        })
      } else {
        setErrors({ general: "Couldn’t save this reply. Please try again." })
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!submitting) onOpenChange(open)
      }}
    >
      <DialogContent>
        <form className="contents" onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit saved reply" : "Create saved reply"}
            </DialogTitle>
            <DialogDescription>
              Create reusable text snippets for quick customer replies.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            {errors.general && (
              <Alert variant="destructive">
                <TriangleAlertIcon aria-hidden="true" />
                <AlertDescription>{errors.general}</AlertDescription>
              </Alert>
            )}

            <Field data-invalid={errors.title ? true : undefined}>
              <FieldLabel htmlFor="saved-reply-title">Title</FieldLabel>
              <Input
                id="saved-reply-title"
                value={title}
                maxLength={100}
                autoComplete="off"
                autoFocus
                placeholder="e.g., Shipping update"
                aria-invalid={errors.title ? true : undefined}
                onChange={(event) => {
                  setTitle(event.target.value)
                  setErrors((current) => ({ ...current, title: undefined }))
                }}
              />
              <FieldDescription>{title.length}/100 characters</FieldDescription>
              {errors.title && <FieldError>{errors.title}</FieldError>}
            </Field>

            <Field data-invalid={errors.body ? true : undefined}>
              <FieldLabel htmlFor="saved-reply-body">Reply</FieldLabel>
              <Textarea
                id="saved-reply-body"
                value={body}
                maxLength={5000}
                rows={8}
                className="min-h-40 resize-y"
                placeholder="Write the message teammates can insert…"
                aria-invalid={errors.body ? true : undefined}
                onChange={(event) => {
                  setBody(event.target.value)
                  setErrors((current) => ({ ...current, body: undefined }))
                }}
              />
              <FieldDescription>
                {body.length}/5,000 characters
              </FieldDescription>
              {errors.body && <FieldError>{errors.body}</FieldError>}
            </Field>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit || submitting}>
              {submitting && <Spinner />}
              {isEditing ? "Save changes" : "Create reply"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DeleteSavedReplyDialog({
  savedReply,
  onOpenChange,
  onConfirm,
}: {
  savedReply: SavedReply
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
          : "Couldn’t delete this reply. Please try again."
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!submitting) onOpenChange(open)
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete saved reply</DialogTitle>
          <DialogDescription>
            Delete{" "}
            <span className="font-medium text-foreground">
              {savedReply.title}
            </span>
            ? This action cannot be undone.
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
            disabled={submitting}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={submitting}
            onClick={handleConfirm}
          >
            {submitting ? <Spinner /> : <Trash2Icon aria-hidden="true" />}
            Delete reply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function SavedRepliesSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[0, 1, 2].map((row) => (
        <Skeleton key={row} className="h-24 w-full rounded-2xl" />
      ))}
    </div>
  )
}

export function SavedRepliesView() {
  const { activeOrganization, isOwner, can } = useOrganization()
  const [savedReplies, setSavedReplies] = React.useState<SavedReply[]>([])
  const [search, setSearch] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [loadError, setLoadError] = React.useState<string | null>(null)
  const [loadedOrganizationId, setLoadedOrganizationId] = React.useState<
    number | null
  >(null)
  const [reloadKey, setReloadKey] = React.useState(0)
  const [editingReply, setEditingReply] = React.useState<SavedReply | null>(
    null
  )
  const [formOpen, setFormOpen] = React.useState(false)
  const [deletingReply, setDeletingReply] = React.useState<SavedReply | null>(
    null
  )
  const canManage = isOwner || can("update:organization")
  const organizationId = activeOrganization?.id ?? null

  React.useEffect(() => {
    if (organizationId === null) return

    let cancelled = false

    fetchSavedReplies(organizationId)
      .then((records) => {
        if (!cancelled) {
          setSavedReplies(records.sort(byTitle))
          setLoadError(null)
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setSavedReplies([])
          setLoadError(
            error instanceof ApiError
              ? error.message
              : "Couldn’t load saved replies."
          )
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadedOrganizationId(organizationId)
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [organizationId, reloadKey])

  const isLoading =
    organizationId !== null &&
    (loading || loadedOrganizationId !== organizationId)

  const filteredReplies = React.useMemo(() => {
    const query = search.trim().toLocaleLowerCase()
    if (!query) return savedReplies

    return savedReplies.filter((savedReply) =>
      `${savedReply.title}\n${savedReply.body}`
        .toLocaleLowerCase()
        .includes(query)
    )
  }, [savedReplies, search])

  async function handleSave(input: SavedReplyInput) {
    if (organizationId === null) return

    if (editingReply) {
      const updated = await updateSavedReply(
        organizationId,
        editingReply.id,
        input
      )
      setSavedReplies((current) =>
        current
          .map((savedReply) =>
            savedReply.id === updated.id ? updated : savedReply
          )
          .sort(byTitle)
      )
      toast.success("Saved reply updated")
      return
    }

    const created = await createSavedReply(organizationId, input)
    setSavedReplies((current) => [...current, created].sort(byTitle))
    toast.success("Saved reply created")
  }

  async function handleDelete() {
    if (organizationId === null || deletingReply === null) return

    await deleteSavedReply(organizationId, deletingReply.id)
    setSavedReplies((current) =>
      current.filter((savedReply) => savedReply.id !== deletingReply.id)
    )
    toast.success("Saved reply deleted")
  }

  function openCreateDialog() {
    setEditingReply(null)
    setFormOpen(true)
  }

  function openEditDialog(savedReply: SavedReply) {
    setEditingReply(savedReply)
    setFormOpen(true)
  }

  return (
    <section className="flex w-full flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="flex flex-col gap-1">
          <TypographyH3>Saved replies</TypographyH3>
          <TypographyMuted>
            Reuse consistent answers when responding to customers.
          </TypographyMuted>
        </div>
        {canManage && activeOrganization && (
          <Button type="button" onClick={openCreateDialog}>
            <PlusIcon data-icon="inline-start" aria-hidden="true" />
            Create reply
          </Button>
        )}
      </div>

      {!activeOrganization ? (
        <Empty className="min-h-80 border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MessageSquareTextIcon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>No organization selected</EmptyTitle>
            <EmptyDescription>
              Select or create an organization to view its saved replies.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          {!canManage && (
            <Alert>
              <MessageSquareTextIcon aria-hidden="true" />
              <AlertTitle>Shared workspace library</AlertTitle>
              <AlertDescription>
                You can use these replies in the inbox. Only workspace owners
                and administrators can change them.
              </AlertDescription>
            </Alert>
          )}

          {loadError && (
            <Alert variant="destructive">
              <TriangleAlertIcon aria-hidden="true" />
              <AlertTitle>Couldn’t load saved replies</AlertTitle>
              <AlertDescription>{loadError}</AlertDescription>
              <AlertAction>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setLoading(true)
                    setLoadError(null)
                    setReloadKey((current) => current + 1)
                  }}
                >
                  <RefreshCwIcon aria-hidden="true" />
                  Retry
                </Button>
              </AlertAction>
            </Alert>
          )}

          {isLoading ? (
            <SavedRepliesSkeleton />
          ) : savedReplies.length === 0 && !loadError ? (
            <Empty className="min-h-80 border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <MessageSquareTextIcon aria-hidden="true" />
                </EmptyMedia>
                <EmptyTitle>No saved replies yet</EmptyTitle>
                <EmptyDescription>
                  {canManage
                    ? "Create the first reusable reply for your workspace."
                    : "A workspace administrator hasn’t added any replies yet."}
                </EmptyDescription>
              </EmptyHeader>
              {canManage && (
                <EmptyContent>
                  <Button type="button" onClick={openCreateDialog}>
                    <PlusIcon aria-hidden="true" />
                    Create reply
                  </Button>
                </EmptyContent>
              )}
            </Empty>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="relative max-w-md">
                <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="pl-9"
                  placeholder="Search titles and replies…"
                  aria-label="Search saved replies"
                />
              </div>

              {filteredReplies.length === 0 ? (
                <Empty className="min-h-56 border">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <SearchIcon aria-hidden="true" />
                    </EmptyMedia>
                    <EmptyTitle>No matching replies</EmptyTitle>
                    <EmptyDescription>
                      Try a different title or phrase.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border">
                  {filteredReplies.map((savedReply) => (
                    <article
                      key={savedReply.id}
                      className="flex flex-col gap-3 bg-background p-4 sm:flex-row sm:items-start sm:justify-between"
                    >
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-foreground">
                          {savedReply.title}
                        </h4>
                        <p className="mt-1 line-clamp-2 text-sm whitespace-pre-line text-muted-foreground">
                          {savedReply.body}
                        </p>
                      </div>
                      {canManage && (
                        <div className="flex shrink-0 items-center gap-1 self-end sm:self-start">
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="ghost"
                            aria-label={`Edit ${savedReply.title}`}
                            onClick={() => openEditDialog(savedReply)}
                          >
                            <PencilIcon aria-hidden="true" />
                          </Button>
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="ghost"
                            aria-label={`Delete ${savedReply.title}`}
                            onClick={() => setDeletingReply(savedReply)}
                          >
                            <Trash2Icon aria-hidden="true" />
                          </Button>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {formOpen && (
        <SavedReplyFormDialog
          key={editingReply?.id ?? "new"}
          savedReply={editingReply}
          onOpenChange={(open) => {
            setFormOpen(open)
            if (!open) setEditingReply(null)
          }}
          onSave={handleSave}
        />
      )}

      {deletingReply && (
        <DeleteSavedReplyDialog
          savedReply={deletingReply}
          onOpenChange={(open) => {
            if (!open) setDeletingReply(null)
          }}
          onConfirm={handleDelete}
        />
      )}
    </section>
  )
}
