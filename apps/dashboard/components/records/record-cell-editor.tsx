"use client"

import * as React from "react"
import { createPortal } from "react-dom"

import { fetchMembers } from "@/components/organization/api"
import type { MemberRow } from "@/components/organization/data"
import {
  searchRecords,
  type Attribute,
  type RecordItem,
  type RecordObject,
  type RecordSummary,
} from "@/components/records/api"
import { AttributeInput } from "@/components/records/custom-fields"
import { beginRecordCellEditing } from "@/components/records/record-cell-editing"
import { asRecordSummary } from "@/components/records/record-reference"
import { RecordImageEditor } from "@/components/records/record-image-editor"
import { selectOptionBadgeStyle } from "@/components/records/select-option-colors"
import { Badge } from "@/components/reui/badge"
import type { DataGridCellEditRequest } from "@/components/reui/data-grid/data-grid"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
} from "@/components/ui/combobox"
import { StarIcon, XIcon } from "@/components/ui/icons"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

type Commit = (apiValue: unknown, optimisticValue?: unknown) => Promise<void>

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
}

function selectedReferences(value: unknown): RecordSummary[] {
  if (Array.isArray(value)) {
    return value
      .map(asRecordSummary)
      .filter((entry): entry is RecordSummary => entry !== null)
  }
  const selected = asRecordSummary(value)
  return selected ? [selected] : []
}

function RatingEditor({
  value,
  onCommit,
}: {
  value: unknown
  onCommit: Commit
}) {
  const current = typeof value === "number" ? value : Number(value ?? 0)
  return (
    <div className="flex h-full items-center gap-0.5 bg-background px-2">
      {[1, 2, 3, 4, 5].map((rating) => (
        <button
          key={rating}
          type="button"
          aria-label={`${rating} stars`}
          className="rounded-sm p-0.5 hover:bg-muted"
          onClick={() => void onCommit(rating)}
        >
          <StarIcon
            className={cn(
              "size-4",
              rating <= current
                ? "fill-amber-400 text-amber-400"
                : "text-muted-foreground"
            )}
          />
        </button>
      ))}
      {current > 0 ? (
        <button
          type="button"
          aria-label="Clear rating"
          className="ml-1 rounded-sm p-0.5 text-muted-foreground hover:bg-muted"
          onClick={() => void onCommit(null)}
        >
          <XIcon className="size-3.5" />
        </button>
      ) : null}
    </div>
  )
}

function OptionBadge({
  attribute,
  value,
}: {
  attribute: Attribute
  value: unknown
}) {
  const option = attribute.selectOptions.find(
    (candidate) => candidate.slug === value || candidate.id === value
  )

  if (!option) {
    return <span className="text-xs text-muted-foreground">None</span>
  }

  const tint = selectOptionBadgeStyle(option.color)
  return (
    <Badge
      variant="outline"
      className={cn("max-w-full min-w-0 shrink", tint.className)}
      style={tint.style}
    >
      <span className="truncate">{option.title}</span>
    </Badge>
  )
}

function StatusEditor({
  attribute,
  value,
  onCommit,
}: {
  attribute: Attribute
  value: unknown
  onCommit: Commit
}) {
  const selected = value == null || value === "" ? "__none__" : String(value)

  return (
    <Select
      value={selected}
      onValueChange={(next) => void onCommit(next === "__none__" ? null : next)}
    >
      <SelectTrigger
        size="sm"
        className="h-full min-h-6 w-full min-w-0 overflow-hidden rounded-none border-0 bg-transparent px-1 shadow-none"
        aria-label={attribute.title}
      >
        <SelectValue className="min-w-0 overflow-hidden">
          <OptionBadge attribute={attribute} value={selected} />
        </SelectValue>
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false} align="start" sideOffset={8}>
        <SelectItem value="__none__">
          <span className="text-muted-foreground">None</span>
        </SelectItem>
        {attribute.selectOptions
          .filter((option) => !option.isArchived)
          .map((option) => (
            <SelectItem key={option.id} value={option.slug}>
              <OptionBadge attribute={attribute} value={option.slug} />
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  )
}

function RecordReferenceEditor({
  organizationId,
  attribute,
  value,
  onCommit,
}: {
  organizationId: number | string
  attribute: Attribute
  value: unknown
  onCommit: Commit
}) {
  const referencedObjects = attribute.config?.referenced_objects
  const objectSlug = String(
    attribute.config?.referenced_object ??
      (Array.isArray(referencedObjects) ? referencedObjects[0] : "") ??
      ""
  )
  const [query, setQuery] = React.useState("")
  const [records, setRecords] = React.useState<RecordItem[]>([])
  const [selected, setSelected] = React.useState(() =>
    selectedReferences(value)
  )

  React.useEffect(() => {
    if (!objectSlug) return
    let active = true
    const timeout = window.setTimeout(
      () => {
        void searchRecords(organizationId, objectSlug, query)
          .then((result) => {
            if (active) setRecords(result)
          })
          .catch(() => {
            if (active) setRecords([])
          })
      },
      query ? 180 : 0
    )
    return () => {
      active = false
      window.clearTimeout(timeout)
    }
  }, [objectSlug, organizationId, query])

  const choose = (record: RecordItem) => {
    const summary = { id: record.id, title: record.title }
    if (!attribute.isMultiselect) {
      void onCommit(record.id, summary)
      return
    }
    setSelected((current) =>
      current.some((entry) => entry.id === record.id)
        ? current.filter((entry) => entry.id !== record.id)
        : [...current, summary]
    )
  }

  if (attribute.isMultiselect) {
    return (
      <PickerShell>
        <input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={`Search ${objectSlug} records…`}
          className="h-8 w-full rounded-md bg-input/30 px-2 text-sm outline-hidden"
        />
        <div className="max-h-56 overflow-y-auto py-1">
          <PickerClear onClick={() => void onCommit([])} />
          {records.map((record) => (
            <button
              key={record.id}
              type="button"
              className="flex w-full items-center justify-between rounded-md py-1 pr-8 pl-1.5 text-left text-sm hover:bg-accent"
              onClick={() => choose(record)}
            >
              <span className="truncate">{record.title}</span>
              {selected.some((entry) => entry.id === record.id) ? "✓" : null}
            </button>
          ))}
        </div>
        <Button
          size="sm"
          onClick={() =>
            void onCommit(
              selected.map((entry) => entry.id),
              selected
            )
          }
        >
          Apply ({selected.length})
        </Button>
      </PickerShell>
    )
  }

  const current = selected[0]
  const selectedRecord =
    records.find((record) => record.id === current?.id) ?? null

  return (
    <Combobox
      items={records}
      value={selectedRecord}
      onValueChange={(record: RecordItem | null) => {
        if (record) choose(record)
      }}
      inputValue={query}
      onInputValueChange={setQuery}
      itemToStringValue={(record: RecordItem) => record.title}
      isItemEqualToValue={(record: RecordItem, candidate: RecordItem) =>
        record.id === candidate.id
      }
      autoHighlight
    >
      <ComboboxTrigger
        className="w-full"
        render={
          <Button
            type="button"
            variant="ghost"
            className="h-full min-h-6 w-full justify-between rounded-none px-1 font-normal"
          />
        }
      >
        <ComboboxValue>
          <span className={cn("truncate", !current && "text-muted-foreground")}>
            {current?.title ?? "None"}
          </span>
        </ComboboxValue>
      </ComboboxTrigger>
      <ComboboxContent align="start" sideOffset={8} className="w-64">
        <ComboboxInput
          placeholder={`Search ${objectSlug} records`}
          showTrigger={false}
        />
        <ComboboxEmpty>No records found.</ComboboxEmpty>
        <ComboboxList>
          <ComboboxItem value={null} onClick={() => void onCommit(null)}>
            <span className="text-muted-foreground">None</span>
          </ComboboxItem>
          {records.map((record) => (
            <ComboboxItem key={record.id} value={record}>
              <span className="truncate">{record.title}</span>
            </ComboboxItem>
          ))}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}

function MemberEditor({
  organizationId,
  value,
  onCommit,
}: {
  organizationId: number | string
  value: unknown
  onCommit: Commit
}) {
  const [query, setQuery] = React.useState("")
  const [members, setMembers] = React.useState<MemberRow[]>([])
  React.useEffect(() => {
    void fetchMembers(organizationId)
      .then(setMembers)
      .catch(() => setMembers([]))
  }, [organizationId])

  const selected = asRecordSummary(value)
  const filtered = members.filter((member) =>
    `${member.name} ${member.email}`.toLowerCase().includes(query.toLowerCase())
  )

  const selectedMember =
    members.find((member) => String(member.id) === selected?.id) ?? null

  return (
    <Combobox
      items={filtered}
      value={selectedMember}
      onValueChange={(member: MemberRow | null) => {
        if (member)
          void onCommit(member.id, { id: member.id, title: member.name })
      }}
      inputValue={query}
      onInputValueChange={setQuery}
      itemToStringValue={(member: MemberRow) =>
        `${member.name} ${member.email}`
      }
      isItemEqualToValue={(member: MemberRow, candidate: MemberRow) =>
        member.id === candidate.id
      }
      autoHighlight
    >
      <ComboboxTrigger
        className="w-full"
        render={
          <Button
            type="button"
            variant="ghost"
            className="h-full min-h-6 w-full justify-between rounded-none px-1 font-normal"
          />
        }
      >
        <ComboboxValue>
          <span
            className={cn(
              "flex min-w-0 items-center gap-2",
              !selected && "text-muted-foreground"
            )}
          >
            {selected ? (
              <Avatar size="sm">
                <AvatarImage src={selectedMember?.avatarUrl} alt="" />
                <AvatarFallback>{initials(selected.title)}</AvatarFallback>
              </Avatar>
            ) : null}
            <span className="truncate">{selected?.title ?? "None"}</span>
          </span>
        </ComboboxValue>
      </ComboboxTrigger>
      <ComboboxContent align="start" sideOffset={8} className="w-64">
        <ComboboxInput placeholder="Search members" showTrigger={false} />
        <ComboboxEmpty>No members found.</ComboboxEmpty>
        <ComboboxList>
          <ComboboxItem value={null} onClick={() => void onCommit(null)}>
            <span className="text-muted-foreground">None</span>
          </ComboboxItem>
          {filtered.map((member) => (
            <ComboboxItem key={member.id} value={member}>
              <Avatar className="size-5">
                <AvatarImage src={member.avatarUrl} alt={member.name} />
                <AvatarFallback className="text-[9px]">
                  {initials(member.name)}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{member.name}</span>
            </ComboboxItem>
          ))}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}

function PickerShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute top-full left-0 z-60 mt-1 flex min-w-72 flex-col gap-1 rounded-md bg-popover p-2 text-popover-foreground shadow-lg ring-1 ring-foreground/10">
      {children}
    </div>
  )
}

function PickerClear({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="w-full rounded px-2 py-1.5 text-left text-sm text-muted-foreground hover:bg-muted"
      onClick={onClick}
    >
      None
    </button>
  )
}

export function RecordCellEditor({
  request,
  attribute,
  organizationId,
  object,
  onCommit,
  onCancel,
  onImageChanged,
}: {
  request: DataGridCellEditRequest<RecordItem>
  attribute: Attribute
  organizationId: number | string
  object: RecordObject
  onCommit: Commit
  onCancel: () => void
  onImageChanged: () => Promise<void>
}) {
  const editorRef = React.useRef<HTMLDivElement>(null)
  const committedRef = React.useRef(false)
  const [value, setValue] = React.useState<unknown>(
    request.initialText ?? request.previousValue
  )
  const [rect, setRect] = React.useState(() =>
    request.cellElement.getBoundingClientRect()
  )
  const textLike = [
    "currency",
    "domain",
    "email-address",
    "number",
    "personal-name",
    "phone-number",
    "tags",
    "text",
    "timestamp",
  ].includes(attribute.type)
  const staysOpen =
    attribute.isMultiselect &&
    ["domain", "tags", "select", "status"].includes(attribute.type)

  React.useEffect(() => {
    return beginRecordCellEditing(request.cellElement)
  }, [request.cellElement])

  React.useEffect(() => {
    const editor = editorRef.current
    if (!editor) return

    if (
      ["checkbox", "date", "location", "select", "status"].includes(
        attribute.type
      )
    ) {
      editor.querySelector<HTMLElement>("button")?.click()
      return
    }

    editor.querySelector<HTMLElement>("input, textarea, button")?.focus()
  }, [attribute.type])

  React.useEffect(() => {
    let animationFrame = 0
    const reposition = () => {
      window.cancelAnimationFrame(animationFrame)
      animationFrame = window.requestAnimationFrame(() => {
        setRect(request.cellElement.getBoundingClientRect())
      })
    }
    const tableElement = request.cellElement.closest("table")
    const resizeObserver = new ResizeObserver(reposition)
    resizeObserver.observe(request.cellElement)
    if (tableElement) resizeObserver.observe(tableElement)

    const mutationObserver = new MutationObserver(reposition)
    if (tableElement) {
      mutationObserver.observe(tableElement, {
        attributes: true,
        subtree: true,
        attributeFilter: ["class", "style", "data-pinned"],
      })
    }

    window.addEventListener("resize", reposition)
    window.addEventListener("scroll", reposition, true)
    return () => {
      window.cancelAnimationFrame(animationFrame)
      resizeObserver.disconnect()
      mutationObserver.disconnect()
      window.removeEventListener("resize", reposition)
      window.removeEventListener("scroll", reposition, true)
      request.cellElement.focus()
    }
  }, [request.cellElement])

  const commit: Commit = async (apiValue, optimisticValue = apiValue) => {
    if (committedRef.current) return
    committedRef.current = true
    await onCommit(apiValue, optimisticValue)
  }

  const content = (
    <div
      ref={editorRef}
      role="dialog"
      aria-label={`Edit ${attribute.title}`}
      className={cn(
        "fixed z-50 bg-background [&_[data-slot=combobox-chips]]:border-0 [&_[data-slot=combobox-trigger]]:rounded-none [&_[data-slot=combobox-trigger]]:border-0 [&_[data-slot=input-group]]:border-0 [&_input]:rounded-none [&_input]:border-0 [&_input]:shadow-none [&_input]:ring-0",
        ["date", "location", "select", "status"].includes(attribute.type) &&
          "[&>div>button]:rounded-none [&>div>button]:border-0"
      )}
      style={{
        left: rect.left,
        top: rect.top,
        width: rect.width,
        minHeight: rect.height,
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault()
          onCancel()
        }
        if (textLike && (event.key === "Enter" || event.key === "Tab")) {
          event.preventDefault()
          void commit(value)
        }
      }}
    >
      {attribute.type === "rating" ? (
        <RatingEditor value={request.previousValue} onCommit={commit} />
      ) : (attribute.type === "select" || attribute.type === "status") &&
        !attribute.isMultiselect ? (
        <StatusEditor
          attribute={attribute}
          value={request.previousValue}
          onCommit={commit}
        />
      ) : attribute.type === "record-reference" ? (
        <RecordReferenceEditor
          organizationId={organizationId}
          attribute={attribute}
          value={request.previousValue}
          onCommit={commit}
        />
      ) : attribute.type === "actor-reference" ? (
        <MemberEditor
          organizationId={organizationId}
          value={request.previousValue}
          onCommit={commit}
        />
      ) : attribute.type === "image" ? (
        <div className="flex min-h-9 items-center bg-background px-2">
          <RecordImageEditor
            compact
            organizationId={organizationId}
            record={request.row}
            object={object}
            attribute={attribute}
            value={request.previousValue}
            onChanged={onImageChanged}
          />
        </div>
      ) : (
        <div
          onBlur={textLike && !staysOpen ? () => void commit(value) : undefined}
        >
          <AttributeInput
            id={`cell-editor-${request.rowId}-${request.columnId}`}
            attribute={attribute}
            value={value}
            onChange={(next) => {
              setValue(next)
              if (!textLike && !staysOpen) void commit(next)
            }}
          />
          {staysOpen ? (
            <div className="absolute top-full right-0 z-60 mt-1 rounded-md bg-popover p-2 shadow-lg ring-1 ring-foreground/10">
              <Button
                size="sm"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => void commit(value)}
              >
                Apply
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )

  return createPortal(content, document.body)
}
