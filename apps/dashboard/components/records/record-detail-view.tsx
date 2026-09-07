"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  AlertTriangleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CircleHelpIcon,
  MessageSquareIcon,
  MoreVerticalIcon,
  SparklesIcon,
  XIcon,
} from "@/components/ui/icons"
import { toast } from "sonner"

import { ApiError } from "@/lib/api"
import { useActiveOrganization } from "@/hooks/use-active-organization"
import {
  fetchObjects,
  fetchRecord,
  fetchRecords,
  updateRecord,
  type AttributeValues,
  type RecordItem,
  type RecordObject,
} from "@/components/records/api"
import { RecordDetailPanel } from "@/components/records/record-detail-panel"
import { RecordDetailTabs } from "@/components/records/record-detail-tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * Everything one record's page needs, tagged with the record it belongs to.
 *
 * Keeping the tag alongside the data is what lets a stale response from the
 * previously-viewed record be ignored instead of flashed on screen, without
 * resetting state synchronously inside the effect.
 */
interface LoadedRecord {
  key: string
  record: RecordItem
  object: RecordObject | null
  siblings: RecordItem[]
}

/**
 * One record's page: identity and values on the left, related content on the
 * right.
 *
 * The object's full record list is loaded alongside the record itself so the
 * ↑/↓ controls can step through it — the same list the grid already fetches in
 * full, so this costs no more than the view the user just came from.
 */
export function RecordDetailView({
  objectSlug,
  recordId,
}: {
  objectSlug: string
  recordId: string
}) {
  const organization = useActiveOrganization()
  const router = useRouter()

  const requestKey = `${objectSlug}/${recordId}`
  const [loaded, setLoaded] = React.useState<LoadedRecord | null>(null)
  const [failure, setFailure] = React.useState<{
    key: string
    message: string
  } | null>(null)

  React.useEffect(() => {
    if (!organization) return

    let active = true

    Promise.all([
      fetchRecord(organization.id, recordId),
      fetchObjects(organization.id),
      fetchRecords(organization.id, objectSlug),
    ])
      .then(([record, objects, siblings]) => {
        if (!active) return
        setLoaded({
          key: requestKey,
          record,
          object:
            objects.find((candidate) => candidate.slug === objectSlug) ?? null,
          siblings,
        })
      })
      .catch((err) => {
        if (!active) return
        setFailure({
          key: requestKey,
          message:
            err instanceof ApiError
              ? err.message
              : "Failed to load the record.",
        })
      })

    return () => {
      active = false
    }
  }, [organization, objectSlug, recordId, requestKey])

  const data = loaded?.key === requestKey ? loaded : null
  const error = failure?.key === requestKey ? failure.message : null

  const record = data?.record ?? null
  const object = data?.object ?? null
  const siblings = React.useMemo(() => data?.siblings ?? [], [data])
  const attributes = object?.attributes ?? []

  const index = siblings.findIndex((candidate) => candidate.id === recordId)
  const previous = index > 0 ? siblings[index - 1] : null
  const next =
    index >= 0 && index < siblings.length - 1 ? siblings[index + 1] : null

  const goToList = () => router.push(`/records/${objectSlug}`)
  const goTo = (target: RecordItem) =>
    router.push(`/records/${objectSlug}/${target.id}`)

  /**
   * Persist changed attribute values. The panel shows the new value before the
   * request settles so editing feels immediate, and rolls back if the server
   * rejects it.
   */
  const handleSaveValue = React.useCallback(
    async (values: AttributeValues) => {
      if (!organization || !record) return

      const rollback = record
      setLoaded((current) =>
        current && current.key === requestKey
          ? {
              ...current,
              record: {
                ...current.record,
                values: { ...current.record.values, ...values },
              },
            }
          : current
      )

      try {
        const saved = await updateRecord(organization.id, record.id, values)
        setLoaded((current) =>
          current && current.key === requestKey
            ? {
                ...current,
                record: saved,
                siblings: current.siblings.map((candidate) =>
                  candidate.id === saved.id ? saved : candidate
                ),
              }
            : current
        )
      } catch (err) {
        setLoaded((current) =>
          current && current.key === requestKey
            ? { ...current, record: rollback }
            : current
        )
        toast.error(
          err instanceof ApiError
            ? (Object.values(err.errors ?? {})[0]?.[0] ?? err.message)
            : "Could not save that value."
        )
        throw err
      }
    },
    [organization, record, requestKey]
  )

  /** Refresh relation-backed content after a linked record changes elsewhere. */
  const refreshRecord = React.useCallback(async () => {
    if (!organization) return

    try {
      const refreshed = await fetchRecord(organization.id, recordId)
      setLoaded((current) =>
        current && current.key === requestKey
          ? {
              ...current,
              record: refreshed,
              siblings: current.siblings.map((candidate) =>
                candidate.id === refreshed.id ? refreshed : candidate
              ),
            }
          : current
      )
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Could not refresh the record."
      )
    }
  }, [organization, recordId, requestKey])

  if (!organization) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-muted-foreground">No active organization.</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-6">
        <Alert variant="destructive">
          <AlertTriangleIcon className="size-4" />
          <AlertTitle>Failed to load record</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!record) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <Skeleton className="h-9 w-full" />
        <div className="flex min-h-96 flex-1 gap-4">
          <Skeleton className="h-auto w-[32%]" />
          <Skeleton className="h-auto flex-1" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background text-foreground">
      <div className="flex shrink-0 items-center gap-2 border-b px-3 py-2">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Close record"
          onClick={goToList}
        >
          <XIcon aria-hidden="true" />
        </Button>

        <ButtonGroup>
          <Button
            variant="outline"
            size="icon"
            aria-label="Previous record"
            disabled={!previous}
            onClick={() => previous && goTo(previous)}
          >
            <ChevronUpIcon aria-hidden="true" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Next record"
            disabled={!next}
            onClick={() => next && goTo(next)}
          >
            <ChevronDownIcon aria-hidden="true" />
          </Button>
        </ButtonGroup>

        {index >= 0 && (
          <span className="truncate text-sm text-muted-foreground">
            {index + 1} of {siblings.length} in All{" "}
            {object?.pluralNoun ?? "Records"}
          </span>
        )}

        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Comments"
            onClick={() => toast.info("Comments aren't available yet.")}
          >
            <MessageSquareIcon aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Help"
            onClick={() => toast.info("Help isn't available yet.")}
          >
            <CircleHelpIcon aria-hidden="true" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon" aria-label="Record actions">
                  <MoreVerticalIcon aria-hidden="true" />
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={goToList}>
                Back to all {(object?.pluralNoun ?? "records").toLowerCase()}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  void navigator.clipboard.writeText(window.location.href)
                  toast.success("Link copied")
                }}
              >
                Copy record link
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => toast.info("The assistant isn't wired up yet.")}
          >
            <SparklesIcon aria-hidden="true" />
            Ask AI
          </Button>
        </div>
      </div>

      {/*
        Sizes are percentage strings on purpose: react-resizable-panels v4
        reads a bare number as pixels, so `defaultSize={32}` would render a
        32px sliver rather than a third of the width.
      */}
      <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1">
        <ResizablePanel
          defaultSize="32%"
          minSize="20%"
          maxSize="70%"
          className="min-w-0"
        >
          <RecordDetailPanel
            record={record}
            object={object}
            attributes={attributes}
            organizationId={organization.id}
            onSaveValue={handleSaveValue}
            onImageChanged={refreshRecord}
          />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize="68%" className="min-w-0">
          <RecordDetailTabs
            key={record.id}
            record={record}
            attributes={attributes}
            organizationId={organization.id}
            onTeamChanged={refreshRecord}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
