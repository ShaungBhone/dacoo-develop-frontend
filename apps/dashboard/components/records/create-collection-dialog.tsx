"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  ClipboardListIcon,
  FolderIcon,
  StarIcon,
  TagIcon,
  RocketIcon,
  TargetIcon,
  PackageIcon,
  UsersIcon,
  BriefcaseIcon,
  CheckIcon,
  type LucideIcon,
} from "@/components/ui/icons"
import { useActiveOrganization } from "@/hooks/use-active-organization"
import { fetchObjects, type RecordObject } from "@/components/records/api"
import { ObjectGlyph } from "@/components/records/object-icon"
import {
  createCollection,
  type Collection,
} from "@/components/records/collections-api"
import { cn } from "@/lib/utils"

const COLLECTION_ICONS: Array<{ key: string; icon: LucideIcon; label: string }> = [
  { key: "clipboard-list", icon: ClipboardListIcon, label: "Clipboard" },
  { key: "folder", icon: FolderIcon, label: "Folder" },
  { key: "star", icon: StarIcon, label: "Star" },
  { key: "tag", icon: TagIcon, label: "Tag" },
  { key: "rocket", icon: RocketIcon, label: "Rocket" },
  { key: "target", icon: TargetIcon, label: "Target" },
  { key: "package", icon: PackageIcon, label: "Package" },
  { key: "users", icon: UsersIcon, label: "Users" },
  { key: "briefcase", icon: BriefcaseIcon, label: "Briefcase" },
]

const COLOR_OPTIONS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
]

interface CreateCollectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultObjectId?: string
  onCreated?: (collection: Collection) => void
}

export function CreateCollectionDialog({
  open,
  onOpenChange,
  defaultObjectId,
  onCreated,
}: CreateCollectionDialogProps) {
  const router = useRouter()
  const organization = useActiveOrganization()

  const [objects, setObjects] = React.useState<RecordObject[]>([])
  const [selectedObjectId, setSelectedObjectId] = React.useState<string>("")
  const [loadingObjects, setLoadingObjects] = React.useState(false)
  const [name, setName] = React.useState("")
  const [selectedIcon, setSelectedIcon] = React.useState("clipboard-list")
  const [iconColor, setIconColor] = React.useState("#3b82f6")
  const [iconPickerOpen, setIconPickerOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Fetch available objects
  React.useEffect(() => {
    if (!organization?.id || !open) return

    let isMounted = true
    Promise.resolve().then(() => {
      if (isMounted) setLoadingObjects(true)
    })
    fetchObjects(organization.id)
      .then((loaded) => {
        if (!isMounted) return
        const active = loaded.filter((o) => o.isActive && !o.isHidden)
        setObjects(active)
        setSelectedObjectId((prev) => {
          if (defaultObjectId && active.some((o) => o.id === defaultObjectId)) {
            return defaultObjectId
          }
          if (prev && active.some((o) => o.id === prev)) {
            return prev
          }
          const people = active.find((o) => o.slug === "person")
          return people?.id ?? active[0]?.id ?? ""
        })
      })
      .catch((err) => {
        console.error("Failed to load objects", err)
      })
      .finally(() => {
        if (isMounted) setLoadingObjects(false)
      })

    return () => {
      isMounted = false
    }
  }, [organization?.id, open, defaultObjectId])

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setName("")
      setIsSubmitting(false)
    }
    onOpenChange(nextOpen)
  }

  const handleCreate = async () => {
    if (!organization?.id || !selectedObjectId || !name.trim() || isSubmitting) {
      return
    }

    setIsSubmitting(true)
    try {
      const created = await createCollection(organization.id, {
        objectId: selectedObjectId,
        name: name.trim(),
        icon: selectedIcon,
        iconColor,
      })

      toast.success(`Collection "${created.name}" created`)
      window.dispatchEvent(new CustomEvent("record-collections-changed"))

      setName("")
      onOpenChange(false)
      if (onCreated) {
        onCreated(created)
      } else {
        router.push(`/collections/${created.slug}`)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create collection"
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const CurrentIcon =
    COLLECTION_ICONS.find((i) => i.key === selectedIcon)?.icon ??
    ClipboardListIcon

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create collection</DialogTitle>
        </DialogHeader>

        <FieldGroup className="gap-4 py-2">
          {/* Target Object Selector */}
          <Field>
            <FieldLabel>Target object</FieldLabel>
            {loadingObjects ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-18 rounded-lg" />
                ))}
              </div>
            ) : objects.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {objects.map((obj) => {
                  const isSelected = selectedObjectId === obj.id
                  return (
                    <button
                      key={obj.id}
                      type="button"
                      onClick={() => setSelectedObjectId(obj.id)}
                      className={cn(
                        "flex flex-col items-center justify-center p-3 rounded-lg border text-center transition-all cursor-pointer relative",
                        isSelected
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                          : "border-border/60 hover:border-border hover:bg-muted/40"
                      )}
                    >
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 size-3.5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                          <CheckIcon className="size-2 stroke-[3]" />
                        </div>
                      )}
                      <div className="mb-1.5">
                        <ObjectGlyph
                          icon={obj.icon}
                          color={obj.iconColor}
                          className="size-5"
                        />
                      </div>
                      <span className="text-xs font-medium text-foreground truncate w-full">
                        {obj.pluralNoun}
                      </span>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                No active record objects available.
              </div>
            )}
          </Field>

          {/* Collection Name & Icon Input */}
          <Field>
            <FieldLabel htmlFor="collection-name">Collection name</FieldLabel>
            <div className="flex items-center gap-2">
              <Popover open={iconPickerOpen} onOpenChange={setIconPickerOpen}>
                <PopoverTrigger
                  render={
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-9 shrink-0 border-border hover:bg-muted cursor-pointer"
                    />
                  }
                >
                  <CurrentIcon className="size-4.5" style={{ color: iconColor }} />
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2" align="start">
                  <div className="grid grid-cols-5 gap-1">
                    {COLLECTION_ICONS.map((item) => {
                      const Icon = item.icon
                      const isPicked = selectedIcon === item.key
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => {
                            setSelectedIcon(item.key)
                            setIconPickerOpen(false)
                          }}
                          className={cn(
                            "flex items-center justify-center size-8 rounded-md hover:bg-muted transition-colors cursor-pointer",
                            isPicked && "bg-primary/10 text-primary"
                          )}
                          title={item.label}
                        >
                          <Icon className="size-4" />
                        </button>
                      )
                    })}
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t mt-2 px-1">
                    {COLOR_OPTIONS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setIconColor(c)}
                        className={cn(
                          "size-5 rounded-full border-2 transition-transform cursor-pointer",
                          iconColor === c ? "border-foreground scale-110" : "border-transparent"
                        )}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              <Input
                id="collection-name"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleCreate()
                  }
                }}
                placeholder="e.g. Leads, VIP Clients, Delivery Fleet"
                disabled={isSubmitting}
              />
            </div>
          </Field>
        </FieldGroup>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleCreate}
            disabled={!name.trim() || !selectedObjectId || isSubmitting}
          >
            {isSubmitting ? "Creating…" : "Create collection"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
