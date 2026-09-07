"use client"

import * as React from "react"
import { toast } from "sonner"

import { ApiError } from "@/lib/api"
import { cn } from "@/lib/utils"
import {
  createSelectOption,
  deleteAttribute,
  deleteSelectOption,
  updateAttribute,
  updateSelectOption,
  type Attribute,
  type SelectOption,
} from "@/components/records/api"
import {
  ATTRIBUTE_ICON_OPTIONS,
  getAttributeIcon,
} from "@/components/records/record-table-columns"
import {
  getSelectOptionSolidColor,
  selectOptionBadgeStyle,
} from "@/components/records/select-option-colors"
import { Badge } from "@/components/reui/badge"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  CheckIcon,
  PlusIcon,
  RotateCcwIcon,
  Trash2Icon,
  TriangleAlertIcon,
  XIcon,
} from "@/components/ui/icons"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

const PALETTE_COLORS = [
  { name: "Blue", hex: "#3b82f6" },
  { name: "Indigo", hex: "#6366f1" },
  { name: "Purple", hex: "#a855f7" },
  { name: "Pink", hex: "#ec4899" },
  { name: "Red", hex: "#ef4444" },
  { name: "Orange", hex: "#f97316" },
  { name: "Amber", hex: "#f59e0b" },
  { name: "Green", hex: "#22c55e" },
  { name: "Teal", hex: "#14b8a6" },
  { name: "Cyan", hex: "#06b6d4" },
  { name: "Slate", hex: "#64748b" },
]

export interface EditAttributeSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  attribute: Attribute | null
  organizationId: number | string | undefined
  objectId: string | undefined
  onSaved: (updated: Attribute) => void
  onDeleted?: (attributeId: string, slug: string) => void
}

export function EditAttributeSheet({
  open,
  onOpenChange,
  attribute,
  organizationId,
  objectId,
  onSaved,
  onDeleted,
}: EditAttributeSheetProps) {
  // Form State
  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [iconKey, setIconKey] = React.useState<string>("")
  const [isRequired, setIsRequired] = React.useState(false)
  const [isUnique, setIsUnique] = React.useState(false)

  // Options State (for Select / Status types)
  const [options, setOptions] = React.useState<SelectOption[]>([])
  const [newOptionTitle, setNewOptionTitle] = React.useState("")
  const [newOptionColor, setNewOptionColor] = React.useState<string>(
    PALETTE_COLORS[0].hex
  )
  const [editingOptionId, setEditingOptionId] = React.useState<string | null>(
    null
  )
  const [editingOptionTitle, setEditingOptionTitle] = React.useState("")

  // Async States
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [optionActionId, setOptionActionId] = React.useState<string | null>(null)

  // Delete Confirmation Dialog State
  const [confirmDeleteOpen, setConfirmDeleteOpen] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)

  // Initialize form when attribute changes
  React.useEffect(() => {
    if (attribute && open) {
      setTitle(attribute.title)
      const existingConfig =
        (attribute.config as Record<string, unknown> | null) ?? null
      setDescription(
        typeof existingConfig?.description === "string"
          ? existingConfig.description
          : ""
      )
      const configIcon = existingConfig?.icon
      setIconKey(typeof configIcon === "string" ? configIcon : "")
      setIsRequired(attribute.isRequired ?? false)
      setIsUnique(attribute.isUnique ?? false)
      setOptions(attribute.selectOptions ?? [])
      setError(null)
      setNewOptionTitle("")
      setEditingOptionId(null)
    }
  }, [attribute, open])

  const isSelectOrStatus =
    attribute?.type === "select" || attribute?.type === "status"

  const HeaderIcon = attribute
    ? getAttributeIcon(attribute.type, attribute.slug, iconKey || undefined)
    : null

  const handleSave = async () => {
    if (!attribute || !organizationId || !objectId) return
    if (!title.trim()) {
      setError("Attribute name is required.")
      return
    }

    setSaving(true)
    setError(null)

    const existingConfig =
      (attribute.config as Record<string, unknown> | null) ?? {}
    const nextConfig: Record<string, unknown> = {
      ...existingConfig,
      description: description.trim() ? description.trim() : undefined,
    }

    if (iconKey.trim() !== "") {
      nextConfig.icon = iconKey
    } else {
      delete nextConfig.icon
    }

    try {
      const updated = await updateAttribute(
        organizationId,
        objectId,
        attribute.id,
        {
          title: title.trim(),
          isRequired,
          isUnique,
          config: Object.keys(nextConfig).length > 0 ? nextConfig : null,
        }
      )
      onSaved(updated)
      onOpenChange(false)
      toast.success(`Saved "${updated.title}" attribute`)
    } catch (err) {
      setError(
        err instanceof ApiError
          ? (err.errors?.title?.[0] ?? err.message)
          : "Failed to update attribute."
      )
    } finally {
      setSaving(false)
    }
  }

  const handleAddOption = async () => {
    if (!attribute || !organizationId || !objectId) return
    const trimmed = newOptionTitle.trim()
    if (!trimmed) return

    setOptionActionId("new")
    try {
      const res = await createSelectOption(
        organizationId,
        objectId,
        attribute.id,
        {
          title: trimmed,
          color: newOptionColor,
        }
      )
      setOptions((prev) => [...prev, res.option])
      onSaved(res.attribute)
      setNewOptionTitle("")
      // Rotate next color
      const nextIdx =
        (PALETTE_COLORS.findIndex((c) => c.hex === newOptionColor) + 1) %
        PALETTE_COLORS.length
      setNewOptionColor(PALETTE_COLORS[nextIdx].hex)
      toast.success(`Added option "${res.option.title}"`)
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to add option."
      )
    } finally {
      setOptionActionId(null)
    }
  }

  const handleUpdateOptionColor = async (
    option: SelectOption,
    newColor: string
  ) => {
    if (!attribute || !organizationId || !objectId) return
    setOptionActionId(option.id)
    try {
      const res = await updateSelectOption(
        organizationId,
        objectId,
        attribute.id,
        option.id,
        {
          color: newColor,
        }
      )
      setOptions((prev) =>
        prev.map((opt) => (opt.id === option.id ? res.option : opt))
      )
      onSaved(res.attribute)
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update option color."
      )
    } finally {
      setOptionActionId(null)
    }
  }

  const handleSaveOptionTitle = async (option: SelectOption) => {
    if (!attribute || !organizationId || !objectId) return
    const trimmed = editingOptionTitle.trim()
    if (!trimmed || trimmed === option.title) {
      setEditingOptionId(null)
      return
    }

    setOptionActionId(option.id)
    try {
      const res = await updateSelectOption(
        organizationId,
        objectId,
        attribute.id,
        option.id,
        {
          title: trimmed,
        }
      )
      setOptions((prev) =>
        prev.map((opt) => (opt.id === option.id ? res.option : opt))
      )
      onSaved(res.attribute)
      setEditingOptionId(null)
      toast.success(`Updated option "${res.option.title}"`)
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to rename option."
      )
    } finally {
      setOptionActionId(null)
    }
  }

  const handleDeleteOption = async (option: SelectOption) => {
    if (!attribute || !organizationId || !objectId) return
    setOptionActionId(option.id)
    try {
      await deleteSelectOption(
        organizationId,
        objectId,
        attribute.id,
        option.id
      )
      setOptions((prev) => prev.filter((opt) => opt.id !== option.id))
      toast.success(`Deleted option "${option.title}"`)
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete option."
      )
    } finally {
      setOptionActionId(null)
    }
  }

  const handleDeleteAttribute = async () => {
    if (!attribute || !organizationId || !objectId) return
    setDeleting(true)
    try {
      await deleteAttribute(organizationId, objectId, attribute.id)
      setConfirmDeleteOpen(false)
      onOpenChange(false)
      onDeleted?.(attribute.id, attribute.slug)
      toast.success(`Deleted "${attribute.title}" attribute`)
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete attribute."
      )
    } finally {
      setDeleting(false)
    }
  }

  if (!attribute) return null

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="inset-y-3! right-3! h-[calc(100vh-1.5rem)]! w-[calc(100%-1.5rem)]! sm:max-w-lg! flex flex-col gap-0 rounded-2xl border border-border shadow-2xl p-0 overflow-hidden"
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
          {/* Header */}
          <SheetHeader className="border-b px-6 py-4 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              {HeaderIcon && (
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border bg-muted/40">
                  <HeaderIcon className="size-4 text-foreground" />
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <SheetTitle className="text-base truncate">
                  {attribute.title}
                </SheetTitle>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Badge variant="outline" className="capitalize text-[11px] h-5">
                    {attribute.type}
                  </Badge>
                  {attribute.isSystem && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] h-4.5 px-1.5 text-muted-foreground"
                    >
                      System
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </SheetHeader>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* General Section */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                General
              </h3>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Attribute Name
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Column name"
                  disabled={attribute.isSystem || saving}
                  className="h-8 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Description
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a helpful description or guidance for this field..."
                  disabled={attribute.isSystem || saving}
                  className="text-xs min-h-[70px] resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Icon
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {ATTRIBUTE_ICON_OPTIONS.map((opt) => {
                    const OptIcon = opt.icon
                    const isSelected =
                      iconKey === opt.key ||
                      (!iconKey && opt.key === attribute.type)
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setIconKey(opt.key)}
                        disabled={attribute.isSystem || saving}
                        title={opt.label}
                        className={cn(
                          "flex size-9 items-center justify-center rounded-lg border transition-colors hover:bg-muted cursor-pointer",
                          isSelected
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-input bg-transparent text-muted-foreground"
                        )}
                      >
                        <OptIcon className="size-4" />
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Select / Status Options Section */}
            {isSelectOrStatus && (
              <div className="space-y-4 border-t pt-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Options
                  </h3>
                  <span className="text-[11px] text-muted-foreground">
                    {options.length} {options.length === 1 ? "option" : "options"}
                  </span>
                </div>

                {/* Option List */}
                <div className="space-y-1.5">
                  {options.map((opt) => {
                    const tint = selectOptionBadgeStyle(opt.color)
                    const isEditing = editingOptionId === opt.id
                    const isBusy = optionActionId === opt.id

                    return (
                      <div
                        key={opt.id}
                        className="flex items-center gap-2 p-1.5 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors"
                      >
                        {/* Color Dropdown */}
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <button
                                type="button"
                                className="size-6 shrink-0 rounded-md border flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
                                style={{
                                  backgroundColor:
                                    getSelectOptionSolidColor(opt.color) ??
                                    "#64748b",
                                }}
                                title="Change color"
                              />
                            }
                          />
                          <DropdownMenuContent className="p-2 w-48">
                            <div className="grid grid-cols-4 gap-1.5">
                              {PALETTE_COLORS.map((c) => (
                                <button
                                  key={c.hex}
                                  type="button"
                                  onClick={() =>
                                    handleUpdateOptionColor(opt, c.hex)
                                  }
                                  className="size-7 rounded-md border flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
                                  style={{ backgroundColor: c.hex }}
                                  title={c.name}
                                >
                                  {opt.color === c.hex && (
                                    <CheckIcon className="size-3.5 text-white stroke-2" />
                                  )}
                                </button>
                              ))}
                            </div>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Title Display / Edit */}
                        {isEditing ? (
                          <Input
                            value={editingOptionTitle}
                            onChange={(e) =>
                              setEditingOptionTitle(e.target.value)
                            }
                            onBlur={() => handleSaveOptionTitle(opt)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault()
                                void handleSaveOptionTitle(opt)
                              } else if (e.key === "Escape") {
                                setEditingOptionId(null)
                              }
                            }}
                            autoFocus
                            disabled={isBusy}
                            className="h-7 text-xs flex-1"
                          />
                        ) : (
                          <span
                            onClick={() => {
                              setEditingOptionId(opt.id)
                              setEditingOptionTitle(opt.title)
                            }}
                            className={cn(
                              "text-xs font-medium px-2 py-0.5 rounded border flex-1 truncate cursor-pointer hover:opacity-80",
                              tint.className
                            )}
                            style={tint.style}
                          >
                            {opt.title}
                          </span>
                        )}

                        {/* Actions */}
                        {isBusy ? (
                          <Spinner className="size-3.5 text-muted-foreground mr-1" />
                        ) : (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => handleDeleteOption(opt)}
                            className="size-6 text-muted-foreground hover:text-destructive"
                            title="Delete option"
                          >
                            <XIcon className="size-3.5" />
                          </Button>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Add Option Form */}
                <div className="flex gap-2 pt-1">
                  {/* Selected Color Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <button
                          type="button"
                          className="size-8 shrink-0 rounded-lg border flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
                          style={{ backgroundColor: newOptionColor }}
                          title="Pick color for new option"
                        />
                      }
                    />
                    <DropdownMenuContent className="p-2 w-48">
                      <div className="grid grid-cols-4 gap-1.5">
                        {PALETTE_COLORS.map((c) => (
                          <button
                            key={c.hex}
                            type="button"
                            onClick={() => setNewOptionColor(c.hex)}
                            className="size-7 rounded-md border flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
                            style={{ backgroundColor: c.hex }}
                            title={c.name}
                          >
                            {newOptionColor === c.hex && (
                              <CheckIcon className="size-3.5 text-white stroke-2" />
                            )}
                          </button>
                        ))}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Input
                    value={newOptionTitle}
                    onChange={(e) => setNewOptionTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        void handleAddOption()
                      }
                    }}
                    placeholder="New option name..."
                    disabled={optionActionId === "new"}
                    className="h-8 text-xs flex-1"
                  />

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddOption}
                    disabled={
                      !newOptionTitle.trim() || optionActionId === "new"
                    }
                    className="h-8 text-xs px-3"
                  >
                    {optionActionId === "new" ? (
                      <Spinner className="size-3" />
                    ) : (
                      <PlusIcon className="size-3.5" />
                    )}
                    Add
                  </Button>
                </div>
              </div>
            )}

            {/* Validation Rules Section */}
            {!attribute.isSystem && (
              <div className="space-y-4 border-t pt-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Rules &amp; Validation
                </h3>

                <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/10">
                  <div className="space-y-0.5 pr-2">
                    <p className="text-xs font-medium text-foreground">
                      Required field
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      New records cannot be saved without a value for this field.
                    </p>
                  </div>
                  <Switch
                    checked={isRequired}
                    onCheckedChange={setIsRequired}
                    disabled={saving}
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/10">
                  <div className="space-y-0.5 pr-2">
                    <p className="text-xs font-medium text-foreground">
                      Unique values
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Every record must have a distinct value for this field.
                    </p>
                  </div>
                  <Switch
                    checked={isUnique}
                    onCheckedChange={setIsUnique}
                    disabled={saving}
                  />
                </div>
              </div>
            )}

            {/* Danger Zone */}
            {!attribute.isSystem && (
              <div className="space-y-3 border-t pt-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-destructive">
                  Danger Zone
                </h3>
                <div className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                  <div className="space-y-0.5 pr-2">
                    <p className="text-xs font-medium text-destructive">
                      Delete this attribute
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Permanently removes this attribute and all its recorded data.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => setConfirmDeleteOpen(true)}
                    className="h-8 text-xs shrink-0"
                  >
                    <Trash2Icon className="size-3.5 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            )}

            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          {/* Footer */}
          <SheetFooter className="border-t bg-muted/40 px-6 py-3 flex flex-row items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="default"
              onClick={handleSave}
              disabled={saving || !title.trim() || attribute.isSystem}
            >
              {saving && <Spinner className="size-3.5 mr-1.5" />}
              Save changes
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <TriangleAlertIcon className="size-5 shrink-0" />
              Delete Attribute
            </DialogTitle>
            <DialogDescription className="pt-2 text-xs">
              Are you sure you want to delete{" "}
              <strong className="text-foreground">{attribute.title}</strong>?
              This will permanently delete this attribute and all stored values
              across all records. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmDeleteOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteAttribute}
              disabled={deleting}
            >
              {deleting ? <Spinner className="size-3.5 mr-1.5" /> : null}
              Delete attribute
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
