"use client"

import * as React from "react"
import { type RoleDetail } from "@/components/organization/data"
import { Alert, AlertDescription } from "@/components/reui/alert"
import { Badge } from "@/components/ui/badge"
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
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { TriangleAlertIcon } from "@/components/ui/icons"

type RoleDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: RoleDetail | null
  onSave: (data: {
    name: string
    description?: string
  }) => Promise<void>
}

function RoleDialogContent({
  role,
  onOpenChange,
  onSave,
}: {
  role: RoleDetail | null
  onOpenChange: (open: boolean) => void
  onSave: (data: { name: string; description?: string }) => Promise<void>
}) {
  const isEditing = role !== null
  const isSystem = role?.is_system ?? false

  const [name, setName] = React.useState(role?.label ?? role?.name ?? "")
  const [description, setDescription] = React.useState(role?.description ?? "")
  const [submitting, setSubmitting] = React.useState(false)
  const [errors, setErrors] = React.useState<{ name?: string; general?: string }>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isSystem && !name.trim()) {
      setErrors({ name: "Role name is required." })
      return
    }

    setSubmitting(true)
    setErrors({})

    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || undefined,
      })
      onOpenChange(false)
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to save role. Please check your inputs and try again."
      setErrors({ general: message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <DialogHeader>
        <div className="flex items-center gap-2">
          <DialogTitle>
            {isEditing
              ? isSystem
                ? `Edit ${role?.label}`
                : `Edit Role: ${role?.label}`
              : "Create Custom Role"}
          </DialogTitle>
          {isSystem && (
            <Badge variant="secondary" className="text-[11px] h-5">
              System Role
            </Badge>
          )}
        </div>
        <DialogDescription>
          {isEditing
            ? isSystem
              ? "Update description for this system role."
              : "Update custom role details."
            : "Define a tailored role name and description. Permissions can be configured directly in the permissions sub-table."}
        </DialogDescription>
      </DialogHeader>

      <FieldGroup className="gap-4 py-1">
        {errors.general && (
          <Alert variant="destructive">
            <TriangleAlertIcon aria-hidden="true" />
            <AlertDescription>{errors.general}</AlertDescription>
          </Alert>
        )}

        <Field>
          <FieldLabel htmlFor="role-name">Role name</FieldLabel>
          <Input
            id="role-name"
            value={isSystem ? role?.label ?? name : name}
            onChange={(e) => {
              setName(e.target.value)
              if (errors.name) {
                setErrors((prev) => ({ ...prev, name: undefined }))
              }
            }}
            disabled={isSystem || submitting}
            placeholder="e.g. Sales Coordinator, Content Reviewer"
            aria-invalid={Boolean(errors.name)}
          />
          {errors.name ? (
            <FieldError>{errors.name}</FieldError>
          ) : isSystem ? (
            <p className="text-xs text-muted-foreground mt-1">
              System role names are standardized and cannot be renamed.
            </p>
          ) : null}
        </Field>

        <Field>
          <FieldLabel htmlFor="role-description">
            Description{" "}
            <span className="text-muted-foreground font-normal">
              (optional)
            </span>
          </FieldLabel>
          <Textarea
            id="role-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={submitting}
            placeholder="Summarize what access and responsibilities this role entails..."
            rows={3}
          />
        </Field>
      </FieldGroup>

      <DialogFooter className="gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={submitting || (!isSystem && !name.trim())}
        >
          {submitting ? (
            <>
              <Spinner className="size-4 mr-2" />
              {isEditing ? "Saving…" : "Creating…"}
            </>
          ) : isEditing ? (
            "Save Changes"
          ) : (
            "Create Role"
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function RoleDialog({
  open,
  onOpenChange,
  role,
  onSave,
}: RoleDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open && (
          <RoleDialogContent
            key={role?.id ?? "create"}
            role={role}
            onOpenChange={onOpenChange}
            onSave={onSave}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
