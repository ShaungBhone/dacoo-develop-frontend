"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  FolderIcon,
  PlusIcon,
  SearchIcon,
} from "@/components/ui/icons"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { useActiveOrganization } from "@/hooks/use-active-organization"
import {
  fetchCollection,
  fetchCollectionEntries,
  addRecordToCollection,
  removeRecordFromCollection,
  type Collection,
} from "@/components/records/collections-api"
import { fetchRecords, type RecordItem } from "@/components/records/api"
import { RecordsListView } from "@/components/records-list-view"
import { Skeleton } from "@/components/ui/skeleton"

export function CollectionDetailView({ slug }: { slug: string }) {
  const router = useRouter()
  const organization = useActiveOrganization()

  const [collection, setCollection] = React.useState<Collection | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  // State for Add Record Popover
  const [addPopoverOpen, setAddPopoverOpen] = React.useState(false)
  const [allObjectRecords, setAllObjectRecords] = React.useState<RecordItem[]>([])
  const [loadingAllRecords, setLoadingAllRecords] = React.useState(false)
  const [recordSearch, setRecordSearch] = React.useState("")
  const [refreshTrigger, setRefreshTrigger] = React.useState(0)

  React.useEffect(() => {
    if (!organization?.id || !slug) return

    let isMounted = true
    Promise.resolve().then(() => {
      if (isMounted) setLoading(true)
    })
    fetchCollection(organization.id, slug)
      .then((col) => {
        if (isMounted) {
          setCollection(col)
          setError(null)
        }
      })
      .catch((err) => {
        console.error("Failed to load collection", err)
        if (isMounted) setError("Collection not found.")
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [organization?.id, slug])

  // Fetch parent object records when Add Popover opens
  React.useEffect(() => {
    if (!addPopoverOpen || !organization?.id || !collection?.objectSlug) return

    let isMounted = true
    Promise.resolve().then(() => {
      if (isMounted) setLoadingAllRecords(true)
    })
    fetchRecords(organization.id, collection.objectSlug)
      .then((records) => {
        if (isMounted) setAllObjectRecords(records)
      })
      .catch((err) => {
        console.error("Failed to fetch records for collection", err)
      })
      .finally(() => {
        if (isMounted) setLoadingAllRecords(false)
      })

    return () => {
      isMounted = false
    }
  }, [addPopoverOpen, organization?.id, collection?.objectSlug])

  const handleAddExistingRecord = async (record: RecordItem) => {
    if (!organization?.id || !collection) return

    try {
      await addRecordToCollection(organization.id, collection.slug, record.id)
      toast.success(`Added "${record.title || record.displayText}" to ${collection.name}`)
      setRefreshTrigger((prev) => prev + 1)
      window.dispatchEvent(new CustomEvent("record-collections-changed"))
      setAddPopoverOpen(false)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to add record to collection"
      toast.error(message)
    }
  }

  const loadCollectionRecords = React.useCallback(
    async (orgId: number | string) => {
      if (!collection) return []
      const res = await fetchCollectionEntries(orgId, collection.slug)
      return res.records
    },
    [collection]
  )

  if (loading) {
    return (
      <div className="flex flex-col h-full p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="size-8 rounded-lg" />
          <Skeleton className="h-6 w-48" />
        </div>
        <Skeleton className="h-10 w-full rounded-md" />
        <Skeleton className="flex-1 w-full rounded-md" />
      </div>
    )
  }

  if (error || !collection) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <FolderIcon className="size-10 text-muted-foreground mb-3 opacity-50" />
        <h2 className="text-base font-semibold text-foreground">Collection Not Found</h2>
        <p className="text-sm text-muted-foreground mt-1 mb-4">
          This collection may have been moved or deleted.
        </p>
        <Button variant="outline" size="sm" onClick={() => router.push("/home")}>
          Back to Home
        </Button>
      </div>
    )
  }

  const filteredCandidates = allObjectRecords.filter((rec) => {
    const title = (rec.title || rec.displayText || "").toLowerCase()
    return title.includes(recordSearch.trim().toLowerCase())
  })

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Top Banner / Breadcrumb */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2.5 border-b bg-background">
        <div className="flex items-center gap-2.5">
          <FolderIcon
            className="size-5 shrink-0"
            style={{ color: collection.iconColor ?? undefined }}
          />
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-foreground">
              {collection.name}
            </span>
            <Badge variant="secondary" className="text-xs capitalize font-normal">
              {collection.objectName}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Popover open={addPopoverOpen} onOpenChange={setAddPopoverOpen}>
            <PopoverTrigger
              render={
                <Button size="sm" variant="outline" className="gap-1.5 text-xs font-medium cursor-pointer">
                  <PlusIcon className="size-3.5" />
                  Add existing {collection.objectName}
                </Button>
              }
            />
            <PopoverContent className="w-72 p-2" align="end">
              <div className="space-y-2">
                <div className="text-xs font-semibold px-1 text-muted-foreground">
                  Add to {collection.name}
                </div>
                <div className="relative">
                  <SearchIcon className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                  <Input
                    placeholder={`Search ${collection.objectName}…`}
                    value={recordSearch}
                    onChange={(e) => setRecordSearch(e.target.value)}
                    className="h-8 pl-8 text-xs"
                    autoFocus
                  />
                </div>

                <div className="max-h-56 overflow-y-auto space-y-0.5 pt-1">
                  {loadingAllRecords ? (
                    <div className="p-3 text-center text-xs text-muted-foreground">
                      Loading {collection.objectName}…
                    </div>
                  ) : filteredCandidates.length === 0 ? (
                    <div className="p-3 text-center text-xs text-muted-foreground">
                      No records found.
                    </div>
                  ) : (
                    filteredCandidates.map((rec) => (
                      <button
                        key={rec.id}
                        type="button"
                        onClick={() => handleAddExistingRecord(rec)}
                        className="w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs text-left hover:bg-muted transition-colors cursor-pointer"
                      >
                        <span className="truncate font-medium text-foreground">
                          {rec.title || rec.displayText || "Untitled"}
                        </span>
                        <PlusIcon className="size-3 text-muted-foreground shrink-0 ml-1" />
                      </button>
                    ))
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="flex-1 min-h-0" key={`${collection.slug}-${refreshTrigger}`}>
        <RecordsListView
          objectSlug={collection.objectSlug}
          singular={collection.name}
          plural={collection.name}
          loadRecords={loadCollectionRecords}
          deleteRecordItem={async (orgId, record) => {
            await removeRecordFromCollection(orgId, collection.slug, record.id)
            setRefreshTrigger((prev) => prev + 1)
            window.dispatchEvent(new CustomEvent("record-collections-changed"))
          }}
          deleteDescription="This will remove the record from this collection. The record will remain in your workspace."
        />
      </div>
    </div>
  )
}
