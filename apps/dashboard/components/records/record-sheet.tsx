"use client"

import * as React from "react"
import { TriangleAlertIcon } from "@/components/ui/icons"
import { toast } from "sonner"

import { ApiError } from "@/lib/api"
import {
  createRecord,
  uploadRecordAttributeImage,
  updateRecord,
  type Attribute,
  type AttributeValues,
  type RecordItem,
} from "@/components/records/api"
import { AttributeInput } from "@/components/records/custom-fields"
import { Alert, AlertDescription } from "@/components/reui/alert"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Spinner } from "@/components/ui/spinner"

interface RecordSheetProps {
  organizationId: number | string
  objectSlug: string
  objectId: string
  objectLabel: string
  attributes: Attribute[]
  /** Pass a record to edit it; omit to create. */
  record?: RecordItem | null
  initialValues?: AttributeValues
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}

/**
 * Create or edit any record, with the form generated from attribute metadata inside a Sheet drawer.
 *
 * Mounted only while open, so state seeds from props without a reset effect.
 */
export function RecordSheet({
  organizationId,
  objectSlug,
  objectId,
  objectLabel,
  attributes,
  record,
  initialValues,
  onOpenChange,
  onSaved,
}: RecordSheetProps) {
  const isEdit = Boolean(record)

  const [values, setValues] = React.useState<AttributeValues>(
    record?.values ?? initialValues ?? {}
  )
  const [submitting, setSubmitting] = React.useState(false)
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [generalError, setGeneralError] = React.useState<string | null>(null)

  // Reference fields need a picker the record engine doesn't have yet, so they
  // are shown read-only rather than as an editable text box.
  const editable = attributes.filter(
    (attribute) =>
      attribute.type !== "record-reference" &&
      attribute.type !== "actor-reference"
  )

  const canSubmit = true

  const set = (slug: string, value: unknown) =>
    setValues((current) => ({ ...current, [slug]: value }))

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setErrors({})
    setGeneralError(null)

    try {
      const imageFiles = attributes.flatMap((attribute) =>
        attribute.type === "image" && values[attribute.slug] instanceof File
          ? [[attribute, values[attribute.slug] as File] as const]
          : []
      )
      const recordValues = Object.fromEntries(
        Object.entries(values).filter(([, value]) => !(value instanceof File))
      )
      let saved: RecordItem
      if (record) {
        saved = await updateRecord(organizationId, record.id, recordValues)
        toast.success(`${objectLabel} updated`)
      } else {
        saved = await createRecord(organizationId, objectSlug, recordValues)
        toast.success(`${objectLabel} created`)
      }
      await Promise.all(imageFiles.map(([attribute, file]) =>
        uploadRecordAttributeImage(organizationId, saved.id, objectId, attribute.id, file)
      ))
      onSaved()
      onOpenChange(false)
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        // The server keys errors as `values.<slug>`; strip the prefix so they
        // land on the field that produced them.
        const mapped: Record<string, string> = {}
        for (const [key, messages] of Object.entries(err.errors)) {
          mapped[key.replace(/^values\./, "")] = messages[0]
        }
        setErrors(mapped)
      } else {
        setGeneralError(
          err instanceof ApiError
            ? err.message
            : `Failed to ${isEdit ? "update" : "create"} the ${objectLabel.toLowerCase()}.`
        )
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Sheet
      open
      onOpenChange={(next, eventDetails) => {
        if (submitting) {
          eventDetails.cancel()
          return
        }

        onOpenChange(next)
      }}
    >
      <SheetContent
        side="right"
        className="inset-y-3! right-3! flex h-[calc(100vh-1.5rem)]! w-[calc(100%-1.5rem)]! flex-col gap-0 overflow-hidden rounded-2xl border border-border p-0 shadow-2xl sm:max-w-lg!"
        onPointerDownOutside={(e) => {
          const target = e.target as HTMLElement | null
          const isOverlay =
            target?.getAttribute?.("data-slot") === "sheet-overlay" ||
            target?.classList?.contains("bg-black/30")
          if (!isOverlay) {
            e.preventDefault()
          }
        }}
        onInteractOutside={(e) => {
          const target = e.target as HTMLElement | null
          const isOverlay =
            target?.getAttribute?.("data-slot") === "sheet-overlay" ||
            target?.classList?.contains("bg-black/30")
          if (!isOverlay) {
            e.preventDefault()
          }
        }}
      >
        <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
          <SheetHeader className="border-b px-6 py-4">
            <SheetTitle>
              {isEdit
                ? `Edit ${objectLabel.toLowerCase()}`
                : `New ${objectLabel.toLowerCase()}`}
            </SheetTitle>
            <SheetDescription>
              Fields come from this workspace&apos;s schema.
            </SheetDescription>
          </SheetHeader>

          <div className="scrollbar-thin flex-1 space-y-4 overflow-y-auto p-6">
            {generalError && (
              <Alert variant="destructive">
                <TriangleAlertIcon className="size-4" aria-hidden="true" />
                <AlertDescription>{generalError}</AlertDescription>
              </Alert>
            )}

            {editable.map((attribute) => {
              const id = `record-${attribute.slug}`
              const fieldError = errors[attribute.slug]

              return (
                <Field
                  key={attribute.id}
                  data-invalid={fieldError ? true : undefined}
                >
                  <FieldLabel htmlFor={id}>
                    {attribute.title}
                    {attribute.isRequired && (
                      <span className="text-destructive"> *</span>
                    )}
                  </FieldLabel>

                  <AttributeInput
                    id={id}
                    attribute={attribute}
                    value={values[attribute.slug]}
                    onChange={(next) => set(attribute.slug, next)}
                    disabled={submitting}
                  />

                  {fieldError && <FieldError>{fieldError}</FieldError>}
                </Field>
              )
            })}
          </div>

          <SheetFooter className="gap-2 border-t bg-muted/40 px-6 py-4 sm:space-x-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !canSubmit}>
              {submitting ? (
                <>
                  <Spinner className="mr-2 size-4" />
                  Saving…
                </>
              ) : isEdit ? (
                "Save changes"
              ) : (
                `Create ${objectLabel.toLowerCase()}`
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
