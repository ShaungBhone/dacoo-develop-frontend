"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import type { Attribute } from "@/components/records/api"
import { AttributeIcon } from "@/components/records/attribute-icon"
import { AttributeInput } from "@/components/records/custom-fields"
import { RecordValueDisplay } from "@/components/records/record-value-display"

/**
 * Types whose input commits the moment it changes.
 *
 * These render into a portal (Select) or have no meaningful "finished typing"
 * moment (Checkbox), so waiting for blur either fires at the wrong time — when
 * focus moves into the popover — or never fires at all.
 */
const COMMIT_ON_CHANGE = new Set<Attribute["type"]>([
  "checkbox",
  "date",
  "location",
  "select",
  "status",
])

/**
 * Types with no picker yet, so they display but never enter edit mode. Same
 * limitation `RecordSheet` documents for the create/edit form.
 */
const READ_ONLY_TYPES = new Set<Attribute["type"]>([
  "actor-reference",
  "record-reference",
  "interaction",
])

/**
 * One row of the Record Details panel: icon, label, and the value.
 *
 * Click the value to edit it in place. The editor is the same `AttributeInput`
 * the create/edit sheet uses, so every attribute type gets the right control
 * without a second per-type switch existing anywhere.
 */
export function RecordFieldRow({
  attribute,
  value,
  onCommit,
  disabled,
}: {
  attribute: Attribute
  value: unknown
  /** Persist a new value. Rejecting restores the previous value. */
  onCommit: (next: unknown) => Promise<void>
  disabled?: boolean
}) {
  const [editing, setEditing] = React.useState(false)
  const [draft, setDraft] = React.useState<unknown>(value)
  const [saving, setSaving] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const readOnly = disabled || READ_ONLY_TYPES.has(attribute.type)
  const commitsOnChange = COMMIT_ON_CHANGE.has(attribute.type)

  const startEditing = () => {
    if (readOnly) return
    setDraft(value)
    setEditing(true)
  }

  const cancel = () => {
    setDraft(value)
    setEditing(false)
  }

  const commit = React.useCallback(
    async (next: unknown) => {
      setEditing(false)

      // Nothing changed — skip the request rather than writing the same value.
      if (JSON.stringify(next) === JSON.stringify(value)) {
        setDraft(value)
        return
      }

      setSaving(true)
      try {
        await onCommit(next)
      } catch {
        // The parent surfaces the error and rolls its own state back; all this
        // row has to do is stop showing the value that failed to save.
        setDraft(value)
      } finally {
        setSaving(false)
      }
    },
    [onCommit, value]
  )

  // Focus the freshly revealed input so the row behaves like a text field.
  React.useEffect(() => {
    if (!editing) return
    const input = containerRef.current?.querySelector<HTMLElement>(
      "input, textarea, [role=combobox], button"
    )
    input?.focus()
  }, [editing])

  return (
    <div className="group flex min-h-8 items-center gap-3 px-4 py-0.5">
      <div className="flex w-36 shrink-0 items-center gap-2">
        <AttributeIcon
          attribute={attribute}
          className="size-3.5 shrink-0 text-muted-foreground"
        />
        <span className="truncate text-xs font-medium text-muted-foreground">
          {attribute.title}
        </span>
      </div>

      <div className="flex min-w-0 flex-1 items-center" ref={containerRef}>
        {editing ? (
          <div
            className="w-full"
            onBlur={(event) => {
              if (commitsOnChange) return
              // Ignore focus moving between parts of the same control.
              if (
                event.currentTarget.contains(event.relatedTarget as Node | null)
              ) {
                return
              }
              void commit(draft)
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault()
                cancel()
                return
              }
              if (event.key === "Enter" && attribute.type !== "text") {
                event.preventDefault()
                void commit(draft)
              }
            }}
          >
            <AttributeInput
              id={`record-field-${attribute.slug}`}
              attribute={attribute}
              value={draft}
              onChange={(next) => {
                setDraft(next)
                if (commitsOnChange) void commit(next)
              }}
              disabled={saving}
            />
          </div>
        ) : (
          <button
            type="button"
            disabled={readOnly}
            onClick={startEditing}
            className={cn(
              "flex h-7.5 w-full items-center rounded-md px-2 text-left text-sm transition-colors",
              !readOnly && "cursor-pointer hover:bg-muted/60",
              readOnly && "cursor-default",
              saving && "opacity-60"
            )}
          >
            <RecordValueDisplay attribute={attribute} value={value} />
          </button>
        )}
      </div>
    </div>
  )
}
