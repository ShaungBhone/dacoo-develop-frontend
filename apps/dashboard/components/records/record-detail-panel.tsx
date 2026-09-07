"use client"

import * as React from "react"
import {
  ArrowLeftIcon,
  ChevronRightIcon,
  CircleCheckBigIcon,
  ListPlusIcon,
  MailIcon,
  PencilIcon,
  SearchIcon,
  StarIcon,
  StickyNoteIcon,
  WorkflowIcon,
  XIcon,
  ImageIcon,
} from "@/components/ui/icons"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import type {
  Attribute,
  AttributeValues,
  RecordItem,
  RecordObject,
} from "@/components/records/api"
import { deleteRecordAttributeImage, uploadRecordAttributeImage } from "@/components/records/api"
import { ObjectGlyph } from "@/components/records/object-icon"
import { RecordFieldRow } from "@/components/records/record-field-row"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

/** Fields shown before "View all values" is expanded. */
const COLLAPSED_FIELD_COUNT = 6

/**
 * Actions that have no backend yet. Kept in one list so it is obvious what is
 * still a stub, and so none of them silently do nothing when clicked.
 */
const QUICK_ACTIONS = [
  {
    key: "compose",
    label: "Compose email",
    icon: MailIcon,
    minWidthClass: "@[320px]/panel:inline",
  },
  {
    key: "add-to-list",
    label: "Add to list",
    icon: ListPlusIcon,
    minWidthClass: "@[400px]/panel:inline",
  },
  {
    key: "new-note",
    label: "New note",
    icon: StickyNoteIcon,
    minWidthClass: "@[480px]/panel:inline",
  },
  {
    key: "run-workflow",
    label: "Run workflow",
    icon: WorkflowIcon,
    minWidthClass: "@[570px]/panel:inline",
  },
  {
    key: "task",
    label: "New task",
    icon: CircleCheckBigIcon,
    minWidthClass: "@[650px]/panel:inline",
  },
] as const

function SectionShell({
  title,
  action,
  children,
  defaultOpen = true,
}: {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  return (
    <Collapsible defaultOpen={defaultOpen} className="w-full">
      <div className="flex items-center justify-between gap-2 px-4 py-2.5">
        <CollapsibleTrigger className="flex items-center gap-1.5 text-sm font-semibold text-foreground hover:text-foreground/80 cursor-pointer">
          <span>{title}</span>
          <ChevronRightIcon
            aria-hidden="true"
            className="size-3.5 text-muted-foreground transition-transform duration-200 in-data-open:rotate-90"
          />
        </CollapsibleTrigger>
        {action}
      </div>
      <CollapsibleContent>
        <div className="pb-2">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  )
}

function RecordImageField({
  organizationId,
  record,
  object,
  attribute,
  value,
  onChanged,
}: {
  organizationId: number | string
  record: RecordItem
  object: RecordObject | null
  attribute: Attribute
  value: unknown
  onChanged: () => Promise<void>
}) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [busy, setBusy] = React.useState(false)
  const url = typeof value === "object" && value !== null && "url" in value && typeof value.url === "string" ? value.url : null
  const upload = async (file: File | null) => {
    if (!file || !object) return
    setBusy(true)
    try {
      await uploadRecordAttributeImage(organizationId, record.id, object.id, attribute.id, file)
      await onChanged()
    } catch (error) {
      toast.error("Couldn’t upload image.")
    } finally { setBusy(false) }
  }
  const remove = async () => {
    if (!object) return
    setBusy(true)
    try {
      await deleteRecordAttributeImage(organizationId, record.id, object.id, attribute.id)
      await onChanged()
    } catch { toast.error("Couldn’t remove image.") } finally { setBusy(false) }
  }
  return <div className="flex min-h-8 items-center gap-3 px-4 py-1">
    <div className="flex w-36 shrink-0 items-center gap-2"><ImageIcon className="size-3.5 text-muted-foreground" /><span className="truncate text-xs font-medium text-muted-foreground">{attribute.title}</span></div>
    <div className="flex min-w-0 flex-1 items-center gap-2">
      {url ? <img src={url} alt="" className="size-8 rounded object-cover" /> : null}
      <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>{url ? "Replace" : "Upload image"}</Button>
      {url ? <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => void remove()}>Remove</Button> : null}
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => void upload(event.target.files?.[0] ?? null)} />
    </div>
  </div>
}

/**
 * The record's identity, quick actions, and its attribute values.
 *
 * Values are edited in place; saving is delegated upward so the record's state
 * has a single owner.
 */
export function RecordDetailPanel({
  record,
  object,
  attributes,
  organizationId,
  onSaveValue,
  onImageChanged,
}: {
  record: RecordItem
  object: RecordObject | null
  attributes: Attribute[]
  organizationId: number | string
  onSaveValue: (values: AttributeValues) => Promise<void>
  onImageChanged: () => Promise<void>
}) {
  const [showAll, setShowAll] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")

  const visibleAttributes = React.useMemo(() => {
    if (!showAll) {
      return attributes.slice(0, COLLAPSED_FIELD_COUNT)
    }
    const q = searchQuery.trim().toLowerCase()
    if (!q) return attributes
    return attributes.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.slug.toLowerCase().includes(q)
    )
  }, [attributes, searchQuery, showAll])

  const hiddenCount = attributes.length - COLLAPSED_FIELD_COUNT
  const renderField = (attribute: Attribute) => attribute.type === "image" ? (
    <RecordImageField key={attribute.id} organizationId={organizationId} record={record} object={object} attribute={attribute} value={record.values[attribute.slug]} onChanged={onImageChanged} />
  ) : (
    <RecordFieldRow key={attribute.id} attribute={attribute} value={record.values[attribute.slug]} onCommit={(next) => onSaveValue({ [attribute.slug]: next })} />
  )

  return (
    <div className="@container/panel flex h-full min-h-0 flex-col overflow-hidden">
      <div className="shrink-0 flex flex-col gap-3 border-b p-2">
        <div className="flex items-center gap-2">
          {record.displayImageUrl ? (
            <img src={record.displayImageUrl} alt="" className="size-8 shrink-0 rounded-md object-cover" />
          ) : (
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-muted/50">
              <ObjectGlyph icon={object?.icon} color={object?.iconColor} className="size-4" />
            </span>
          )}
          <h1 className="min-w-0 flex-1 truncate text-lg font-semibold text-foreground">
            {record.displayText}
          </h1>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Edit record"
            onClick={() => toast.info("Renaming lands with the record editor.")}
          >
            <PencilIcon aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Favourite record"
            onClick={() => toast.info("Favourites aren't available yet.")}
          >
            <StarIcon aria-hidden="true" />
          </Button>
        </div>

        <div className="flex items-center gap-1.5 overflow-hidden">
          {QUICK_ACTIONS.map((action) => (
            <Button
              key={action.key}
              variant="outline"
              className="h-8 px-2.5 shrink-0"
              title={action.label}
              aria-label={action.label}
              onClick={() =>
                toast.info(`${action.label} isn't wired up yet.`)
              }
            >
              <action.icon aria-hidden="true" />
              <span
                className={cn(
                  "hidden whitespace-nowrap",
                  action.minWidthClass
                )}
              >
                {action.label}
              </span>
            </Button>
          ))}
        </div>
      </div>

      {showAll ? (
        <div className="flex flex-1 flex-col min-h-0">
          <div className="shrink-0 flex items-center gap-2 px-4 py-2 border-b bg-muted/20">
            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 text-muted-foreground hover:text-foreground cursor-pointer"
              aria-label="Back to summary"
              onClick={() => {
                setShowAll(false)
                setSearchQuery("")
              }}
            >
              <ArrowLeftIcon className="size-4" />
            </Button>
            <InputGroup className="h-8 flex-1">
              <InputGroupAddon>
                <SearchIcon className="size-3.5 text-muted-foreground" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Search attributes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-xs"
                autoFocus
              />
              {searchQuery && (
                <InputGroupAddon align="inline-end">
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground cursor-pointer p-0.5"
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search"
                  >
                    <XIcon className="size-3" />
                  </button>
                </InputGroupAddon>
              )}
            </InputGroup>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto py-2 flex flex-col gap-y-0.5">
            {visibleAttributes.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No attributes matching "{searchQuery}"
              </div>
            ) : (
              visibleAttributes.map(renderField)
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="border-b">
            <SectionShell title="Record Details">
              <div className="flex flex-col gap-y-0.5">
                {visibleAttributes.map(renderField)}
              </div>

              {attributes.length > COLLAPSED_FIELD_COUNT && (
                <button
                  type="button"
                  onClick={() => setShowAll(true)}
                  className={cn(
                    "mt-1.5 px-4 py-1.5 text-left text-xs font-medium text-muted-foreground",
                    "transition-colors hover:text-foreground cursor-pointer"
                  )}
                >
                  View all values ({hiddenCount} more)
                </button>
              )}
            </SectionShell>
          </div>

          <div className="border-b">
            <SectionShell
              title="Lists"
              action={
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-sm font-normal text-muted-foreground hover:text-foreground"
                  onClick={() => toast.info("Lists aren't available yet.")}
                >
                  Add to list
                </Button>
              }
            >
              <Empty className="border-0 py-4">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <ListPlusIcon />
                  </EmptyMedia>
                  <EmptyTitle className="text-sm">Not in any lists</EmptyTitle>
                  <EmptyDescription>
                    This record has not been added to any lists.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toast.info("Lists aren't available yet.")}
                  >
                    <ListPlusIcon data-icon="inline-start" />
                    Add to list
                  </Button>
                </EmptyContent>
              </Empty>
            </SectionShell>
          </div>
        </div>
      )}
    </div>
  )
}
