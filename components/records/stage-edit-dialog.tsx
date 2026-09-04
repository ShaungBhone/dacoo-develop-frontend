"use client"

import * as React from "react"

import type { SelectOption } from "@/components/records/api"
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
import { StageColorPicker } from "@/components/records/stage-color-picker"

export interface StageEditDialogProps {
  stage: SelectOption | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (stageId: string, title: string, color?: string | null) => Promise<void>
}

export function StageEditDialog({
  stage,
  open,
  onOpenChange,
  onSave,
}: StageEditDialogProps) {
  const [title, setTitle] = React.useState(stage?.title ?? "")
  const [color, setColor] = React.useState<string>(stage?.color || "blue")
  const [saving, setSaving] = React.useState(false)
  const [saveError, setSaveError] = React.useState<string | null>(null)

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!stage || !title.trim() || saving) return
    setSaving(true)
    setSaveError(null)
    try {
      await onSave(stage.id, title.trim(), color)
      onOpenChange(false)
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "Unable to save this stage. Please try again."
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-0 sm:max-w-md">
        <form onSubmit={handleSave} className="flex flex-col">
          <DialogHeader className="gap-2 px-5 pt-5 pb-4 pr-12 text-left">
            <DialogTitle className="font-semibold">
              Edit status stage
            </DialogTitle>
            <DialogDescription>
              Rename the stage and choose a color.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="gap-5 border-t px-5 py-5">
            <Field className="gap-2">
              <FieldLabel htmlFor="stage-title">Stage name</FieldLabel>
              <Input
                id="stage-title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value)
                  setSaveError(null)
                }}
                placeholder="e.g. Qualified"
                autoFocus
                disabled={saving}
              />
            </Field>

            <Field className="gap-2">
              <FieldLabel>Color</FieldLabel>
              <StageColorPicker
                color={color}
                onChange={(value) => {
                  setColor(value)
                  setSaveError(null)
                }}
                disabled={saving}
                variant="field"
              />
            </Field>

            {saveError && <FieldError>{saveError}</FieldError>}
          </FieldGroup>

          <DialogFooter className="mx-0 mb-0 mt-0 flex-row items-center justify-end gap-2 rounded-b-xl border-t bg-background px-5 py-4">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => onOpenChange(false)}
              disabled={saving}
              className="min-w-24"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              size="lg"
              disabled={!title.trim() || saving}
              className="min-w-28"
            >
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
