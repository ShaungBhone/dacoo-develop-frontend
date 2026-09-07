"use client"

import * as React from "react"
import {
  CheckIcon,
  Clock3Icon,
  FileIcon,
  RefreshCwIcon,
  UploadCloudIcon,
  XIcon,
} from "@/components/ui/icons"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import {
  Attachment,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from "@/components/ui/attachment"
import { cn } from "@/lib/utils"

export function ImageUploadBox({
  id,
  onChange,
  accept = "image/svg+xml,image/png,image/jpeg,image/gif",
  hint = "SVG, PNG, JPG or GIF (max. 800x400px)",
  disabled = false,
  uploading = false,
  removing = false,
  readyToUpload = false,
  previewUrl,
  fileName,
  error,
  onRetry,
  onRemove,
  className,
}: {
  id: string
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  accept?: string
  hint?: string
  disabled?: boolean
  uploading?: boolean
  removing?: boolean
  readyToUpload?: boolean
  previewUrl?: string | null
  fileName?: string | null
  error?: string | null
  onRetry?: () => void | Promise<void>
  onRemove?: () => void | Promise<void>
  className?: string
}) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const hasAttachment = Boolean(previewUrl || fileName)
  const state = error
    ? "error"
    : removing
      ? "processing"
      : uploading
        ? "uploading"
        : readyToUpload
          ? "idle"
          : hasAttachment
            ? "done"
            : "idle"
  const title = fileName ?? (hasAttachment ? "Workspace logo" : "Upload image")
  const description =
    (error ? "Upload failed. Try again." : null) ??
    (removing
      ? "Removing..."
      : uploading
        ? "Uploading..."
        : readyToUpload
          ? "Ready to upload"
          : hasAttachment
            ? "Uploaded"
            : hint)
  const actionsDisabled = disabled || uploading || removing

  return (
    <div className={cn("w-full max-w-md", className)}>
      <Attachment state={state} className="w-full flex-nowrap">
        <label
          htmlFor={actionsDisabled ? undefined : id}
          aria-disabled={actionsDisabled}
          className={cn(
            "flex min-w-0 flex-1 cursor-pointer items-center gap-2",
            actionsDisabled && "cursor-not-allowed"
          )}
        >
          <AttachmentMedia variant="icon">
            {uploading || removing ? (
              <Spinner aria-hidden="true" />
            ) : error ? (
              <FileIcon aria-hidden="true" />
            ) : readyToUpload ? (
              <Clock3Icon aria-hidden="true" />
            ) : hasAttachment ? (
              <CheckIcon aria-hidden="true" />
            ) : (
              <UploadCloudIcon aria-hidden="true" />
            )}
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>{title}</AttachmentTitle>
            <AttachmentDescription>{description}</AttachmentDescription>
          </AttachmentContent>
        </label>

        {(hasAttachment || error) && (
          <div className="flex shrink-0 items-center gap-1">
            {error && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={actionsDisabled}
                onClick={() =>
                  void (onRetry ? onRetry() : inputRef.current?.click())
                }
                aria-label="Retry upload"
                title="Retry upload"
              >
                <RefreshCwIcon aria-hidden="true" />
              </Button>
            )}
            {onRemove && hasAttachment && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={actionsDisabled}
                onClick={() => void onRemove()}
                aria-label="Remove image"
                title="Remove image"
              >
                <XIcon aria-hidden="true" />
              </Button>
            )}
          </div>
        )}
      </Attachment>
      <input
        ref={inputRef}
        id={id}
        className="sr-only"
        type="file"
        accept={accept}
        disabled={actionsDisabled}
        onChange={onChange}
      />
    </div>
  )
}
