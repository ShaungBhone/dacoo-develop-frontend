"use client"

import * as React from "react"
import { toast } from "sonner"

import {
  deleteRecordAttributeImage,
  uploadRecordAttributeImage,
  type Attribute,
  type RecordItem,
  type RecordObject,
} from "@/components/records/api"
import { Button } from "@/components/ui/button"

export function RecordImageEditor({
  organizationId,
  record,
  object,
  attribute,
  value,
  onChanged,
  compact = false,
}: {
  organizationId: number | string
  record: RecordItem
  object: RecordObject
  attribute: Attribute
  value: unknown
  onChanged: () => Promise<void>
  compact?: boolean
}) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [busy, setBusy] = React.useState(false)
  const url =
    typeof value === "object" &&
    value !== null &&
    "url" in value &&
    typeof value.url === "string"
      ? value.url
      : null

  const upload = async (file: File | null) => {
    if (!file) return
    setBusy(true)
    try {
      await uploadRecordAttributeImage(
        organizationId,
        record.id,
        object.id,
        attribute.id,
        file
      )
      await onChanged()
    } catch {
      toast.error("Couldn’t upload image.")
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  const remove = async () => {
    setBusy(true)
    try {
      await deleteRecordAttributeImage(
        organizationId,
        record.id,
        object.id,
        attribute.id
      )
      await onChanged()
    } catch {
      toast.error("Couldn’t remove image.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-w-0 items-center gap-2">
      {url ? (
        // The source is a validated media-library URL returned by our API.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="size-8 rounded object-cover" />
      ) : null}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        {url ? "Replace" : compact ? "Upload" : "Upload image"}
      </Button>
      {url ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={busy}
          onClick={() => void remove()}
        >
          Remove
        </Button>
      ) : null}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(event) => void upload(event.target.files?.[0] ?? null)}
      />
    </div>
  )
}
