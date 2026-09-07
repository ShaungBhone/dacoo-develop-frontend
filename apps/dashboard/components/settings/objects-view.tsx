"use client"

import * as React from "react"
import {
  AlertTriangleIcon,
  BoxIcon,
  ChevronLeftIcon,
  PlusIcon,
  RefreshCwIcon,
  SettingsIcon,
  TableIcon,
  Trash2Icon,
  ImageIcon,
  HashIcon,
} from "@/components/ui/icons"
import { toast } from "sonner"

import { ApiError } from "@/lib/api"
import { cn } from "@/lib/utils"
import { useActiveOrganization } from "@/hooks/use-active-organization"
import { DataTable } from "@/components/data-table"
import {
  buildAttributeColumns,
  buildObjectColumns,
} from "@/components/settings/objects-table-columns"
import {
  createObject,
  deleteAttribute,
  fetchObjects,
  updateObject,
  updateStandardObjectActivation,
  type Attribute,
  type RecordObject,
} from "@/components/records/api"
import { AttributeCreateSheet } from "@/components/records/attribute-create-sheet"
import { getAttributeIcon } from "@/components/records/record-table-columns"
import {
  Cascader,
  CascaderContent,
  CascaderEmpty,
  CascaderList,
  CascaderPanel,
  CascaderStatus,
  CascaderTrigger,
} from "@/components/reui/cascader/cascader"
import { CascaderFooter } from "@/components/reui/cascader/cascader-footer"
import { CascaderItems } from "@/components/reui/cascader/cascader-item"
import { CascaderBreadcrumb, CascaderInput, CascaderNav } from "@/components/reui/cascader/cascader-nav"
import type { CascaderActionItem, CascaderNode } from "@/components/reui/cascader/cascader-types"
import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert"
import {
  ObjectGlyph,
  OBJECT_COLOR_NAMES,
  OBJECT_ICON_COLORS,
  OBJECT_ICON_NAMES,
} from "@/components/records/object-icon"
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
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"

function ObjectsTableSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-3 p-4">
      <Skeleton className="h-9 w-full max-w-sm rounded-lg" />
      {[0, 1, 2, 3, 4, 5].map((row) => (
        <Skeleton key={row} className="h-10 w-full rounded-md" />
      ))}
    </div>
  )
}

/**
 * Manage the workspace's objects and their attributes.
 *
 * Two levels, like Attio: a list of objects, and a drill-down showing one
 * object's attributes. System attributes are shown but locked — their slug and
 * type are the contract every stored value was written against.
 */
export function ObjectsView() {
  const organization = useActiveOrganization()

  const [objects, setObjects] = React.useState<RecordObject[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [selectedSlug, setSelectedSlug] = React.useState<string | null>(null)

  const load = React.useCallback(() => {
    if (!organization) return Promise.resolve()
    return fetchObjects(organization.id, { includeInactiveStandard: true })
      .then((list) => {
        setObjects(list)
        setError(null)
      })
      .catch((err) => {
        setError(
          err instanceof ApiError ? err.message : "Failed to load objects."
        )
      })
  }, [organization])

  React.useEffect(() => {
    if (!organization) return
    load().finally(() => setIsLoading(false))
  }, [organization, load])

  if (!organization) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-muted-foreground">No active organization.</p>
      </div>
    )
  }

  const selected =
    objects.find((object) => object.slug === selectedSlug) ?? null

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      {error && (
        <div className="shrink-0 p-4">
          <Alert variant="destructive">
            <AlertTriangleIcon className="size-4" aria-hidden="true" />
            <AlertTitle className="text-balance">
              Something went wrong
            </AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={() => void load()}>
                <RefreshCwIcon className="mr-2 size-3.5" /> Retry
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {isLoading ? (
        <ObjectsTableSkeleton />
      ) : selected ? (
        <AttributesPanel
          organizationId={organization.id}
          object={selected}
          onBack={() => setSelectedSlug(null)}
          onChanged={() => void load()}
        />
      ) : (
        <ObjectsPanel
          organizationId={organization.id}
          objects={objects}
          onOpen={setSelectedSlug}
          onChanged={() => void load()}
          canManageActivation={
            Boolean(organization.is_owner) ||
            Boolean(organization.permissions?.includes("update:organization"))
          }
        />
      )}
    </div>
  )
}

function ObjectsPanel({
  organizationId,
  objects,
  onOpen,
  onChanged,
  canManageActivation,
}: {
  organizationId: number | string
  objects: RecordObject[]
  onOpen: (slug: string) => void
  onChanged: () => void
  canManageActivation: boolean
}) {
  const [creating, setCreating] = React.useState(false)
  const [deactivateTarget, setDeactivateTarget] =
    React.useState<RecordObject | null>(null)
  const [activationPendingId, setActivationPendingId] = React.useState<
    string | null
  >(null)

  const setActivation = React.useCallback(
    async (object: RecordObject, isActive: boolean) => {
      setActivationPendingId(object.id)
      try {
        await updateStandardObjectActivation(
          organizationId,
          object.id,
          isActive
        )
        toast.success(
          `${object.pluralNoun} ${isActive ? "activated" : "deactivated"}`
        )
        window.dispatchEvent(new Event("record-objects-changed"))
        onChanged()
        setDeactivateTarget(null)
      } catch (err) {
        toast.error(
          err instanceof ApiError
            ? err.message
            : `Failed to ${isActive ? "activate" : "deactivate"} this object.`
        )
      } finally {
        setActivationPendingId(null)
      }
    },
    [onChanged, organizationId]
  )

  const columns = React.useMemo(
    () =>
      buildObjectColumns({
        onOpen: (obj) => onOpen(obj.slug),
        onActivate: (obj) => void setActivation(obj, true),
        onDeactivate: setDeactivateTarget,
        canManageActivation,
      }),
    [canManageActivation, onOpen, setActivation]
  )

  const handleOpenCreate = React.useCallback(() => {
    setCreating(true)
  }, [])

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key.toLowerCase() === "c" || e.key.toLowerCase() === "n") &&
        !["INPUT", "TEXTAREA", "SELECT"].includes(
          (e.target as HTMLElement)?.tagName
        )
      ) {
        e.preventDefault()
        handleOpenCreate()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleOpenCreate])

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      <DataTable
        columns={columns}
        data={objects}
        searchPlaceholder="Search objects…"
        searchableColumnIds={["pluralNoun", "singularNoun", "slug"]}
        initialPageSize={20}
        columnsLabel="View"
        emptyMessage="No objects match your search."
        getRowId={(obj) => String(obj.id)}
        onRowClick={(obj) => {
          if (obj.isActive) onOpen(obj.slug)
        }}
        toolbarActions={
          <Button type="button" onClick={handleOpenCreate}>
            <PlusIcon data-icon="inline-start" aria-hidden="true" />
            New custom object
          </Button>
        }
        className="min-h-0 flex-1 gap-0"
        toolbarClassName="shrink-0 border-b border-border px-4 py-2"
        containerClassName="min-h-0 flex-1 overflow-auto relative"
        headerClassName="bg-muted"
        rowClassName="bg-background hover:bg-muted/40 cursor-pointer"
        footerClassName="shrink-0 border-t border-border px-4 py-2"
      />

      {creating && (
        <CreateObjectDialog
          organizationId={organizationId}
          onClose={() => setCreating(false)}
          onCreated={onChanged}
        />
      )}

      {deactivateTarget && (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open && activationPendingId === null) setDeactivateTarget(null)
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                Deactivate {deactivateTarget.pluralNoun}?
              </DialogTitle>
              <DialogDescription>
                This hides its records, attributes, and views throughout the
                workspace. Nothing is deleted, and everything returns when you
                reactivate the object.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={activationPendingId !== null}
                onClick={() => setDeactivateTarget(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={activationPendingId !== null}
                onClick={() => void setActivation(deactivateTarget, false)}
              >
                {activationPendingId !== null && (
                  <Spinner className="mr-2 size-4" />
                )}
                Deactivate object
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

function AttributesPanel({
  organizationId,
  object,
  onBack,
  onChanged,
}: {
  organizationId: number | string
  object: RecordObject
  onBack: () => void
  onChanged: () => void
}) {
  const [creating, setCreating] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<Attribute | null>(null)
  const [tab, setTab] = React.useState<"configuration" | "appearance" | "attributes">(
    "configuration"
  )

  const attributeColumns = React.useMemo(
    () =>
      buildAttributeColumns({
        onDelete: setDeleteTarget,
      }),
    []
  )

  const handleOpenCreate = React.useCallback(() => {
    setCreating(true)
  }, [])

  React.useEffect(() => {
    if (object.isSystem && tab === "appearance") setTab("configuration")
  }, [object.isSystem, tab])

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        tab === "attributes" &&
        (e.key.toLowerCase() === "c" || e.key.toLowerCase() === "n") &&
        !["INPUT", "TEXTAREA", "SELECT"].includes(
          (e.target as HTMLElement)?.tagName
        )
      ) {
        e.preventDefault()
        handleOpenCreate()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [tab, handleOpenCreate])

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      <div className="shrink-0 space-y-4 border-b border-border px-4 pt-4 pb-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="-ml-2 text-muted-foreground"
        >
          <ChevronLeftIcon data-icon="inline-start" aria-hidden="true" />
          Back
        </Button>

        <div className="flex items-start gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <BoxIcon className="size-5" aria-hidden="true" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold tracking-tight">
                {object.pluralNoun}
              </h2>
              <Badge variant={object.isSystem ? "secondary" : "outline"}>
                {object.isSystem ? "Standard" : "Custom"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Manage object attributes and configuration settings
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {[
            { id: "configuration", label: "Configuration", icon: SettingsIcon },
            ...(!object.isSystem ? [{ id: "appearance", label: "Appearance", icon: ImageIcon }] : []),
            {
              id: "attributes",
              label: "Attributes",
              icon: TableIcon,
              count: object.attributes.length,
            },
          ].map(({ id, label, icon: Icon, ...rest }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id as "configuration" | "appearance" | "attributes")}
              className={cn(
                "-mb-[13px] flex items-center gap-2 border-b-2 px-3 py-1.5 text-sm transition-colors",
                tab === id
                  ? "border-primary font-medium text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              {label}
              {"count" in rest && (
                <span className="text-xs text-muted-foreground tabular-nums">
                  {rest.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {tab === "configuration" && (
        <div className="min-h-0 flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-2xl">
            <ConfigurationPanel
              organizationId={organizationId}
              object={object}
              onSaved={onChanged}
            />
          </div>
        </div>
      )}

      {!object.isSystem && tab === "appearance" && (
        <div className="min-h-0 flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-4xl">
            <AppearancePanel
              organizationId={organizationId}
              object={object}
              onSaved={onChanged}
            />
          </div>
        </div>
      )}

      {tab === "attributes" && (
        <div className="flex min-h-0 flex-1 flex-col">
          <DataTable
            columns={attributeColumns}
            data={object.attributes}
            searchPlaceholder="Search attributes…"
            searchableColumnIds={["title", "type"]}
            initialPageSize={20}
            columnsLabel="View"
            emptyMessage="No attributes found for this object."
            getRowId={(attr) => String(attr.id)}
            toolbarActions={
              <Button type="button" onClick={handleOpenCreate}>
                <PlusIcon data-icon="inline-start" aria-hidden="true" />
                Create attribute
              </Button>
            }
            className="min-h-0 flex-1 gap-0"
            toolbarClassName="shrink-0 border-b border-border px-4 py-2"
            containerClassName="min-h-0 flex-1 overflow-auto relative"
            headerClassName="bg-muted"
            rowClassName="bg-background hover:bg-muted/40"
            footerClassName="shrink-0 border-t border-border px-4 py-2"
          />
        </div>
      )}

      {creating && (
        <AttributeCreateSheet
          organizationId={organizationId}
          objectId={object.id}
          objectSingular={object.singularNoun}
          onClose={() => setCreating(false)}
          onCreated={onChanged}
        />
      )}

      {deleteTarget && (
        <DeleteAttributeDialog
          organizationId={organizationId}
          object={object}
          attribute={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={onChanged}
        />
      )}
    </div>
  )
}

function CreateObjectDialog({
  organizationId,
  onClose,
  onCreated,
}: {
  organizationId: number | string
  onClose: () => void
  onCreated: () => void
}) {
  const [singular, setSingular] = React.useState("")
  const [plural, setPlural] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await createObject(organizationId, {
        singularNoun: singular.trim(),
        pluralNoun: plural.trim() || `${singular.trim()}s`,
      })
      toast.success(`Object "${singular.trim()}" created`)
      onCreated()
      onClose()
    } catch (err) {
      setError(
        err instanceof ApiError
          ? (err.errors?.slug?.[0] ?? err.message)
          : "Failed to create the object."
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !submitting && !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>New custom object</DialogTitle>
            <DialogDescription>
              Records of this object get their own attributes and list.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Field>
              <FieldLabel htmlFor="object-singular">
                Singular name <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="object-singular"
                value={singular}
                onChange={(e) => setSingular(e.target.value)}
                placeholder="Invoice"
                disabled={submitting}
                autoFocus
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="object-plural">Plural name</FieldLabel>
              <Input
                id="object-plural"
                value={plural}
                onChange={(e) => setPlural(e.target.value)}
                placeholder="Invoices"
                disabled={submitting}
              />
            </Field>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !singular.trim()}>
              {submitting && <Spinner className="mr-2 size-4" />}
              Create object
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DeleteAttributeDialog({
  organizationId,
  object,
  attribute,
  onClose,
  onDeleted,
}: {
  organizationId: number | string
  object: RecordObject
  attribute: Attribute
  onClose: () => void
  onDeleted: () => void
}) {
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  return (
    <Dialog open onOpenChange={(open) => !submitting && !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <AlertTriangleIcon className="size-4" aria-hidden="true" />
            </span>
            Delete attribute
          </DialogTitle>
          <DialogDescription>
            Delete{" "}
            <span className="font-medium text-foreground">
              {attribute.title}
            </span>
            ? Every value stored against it is removed too, including history.
            This cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={submitting}
            onClick={async () => {
              setSubmitting(true)
              setError(null)
              try {
                await deleteAttribute(organizationId, object.id, attribute.id)
                toast.success(`Attribute "${attribute.title}" deleted`)
                onDeleted()
                onClose()
              } catch (err) {
                setError(
                  err instanceof ApiError ? err.message : "Failed to delete."
                )
              } finally {
                setSubmitting(false)
              }
            }}
          >
            {submitting ? <Spinner /> : <Trash2Icon aria-hidden="true" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * The object's General settings — the words used to describe one and many, and
 * its slug.
 */
function AppearancePanel({
  organizationId,
  object,
  onSaved,
}: {
  organizationId: number | string
  object: RecordObject
  onSaved: () => void
}) {
  const [createType, setCreateType] = React.useState<"text" | "number" | "image" | null>(null)
  const [pending, setPending] = React.useState(false)
  const textAttributes = object.attributes.filter(
    (attribute) => attribute.type === "text" || attribute.type === "number"
  )
  const imageAttributes = object.attributes.filter(
    (attribute) => attribute.type === "image"
  )

  const save = async (
    field: "recordTextAttributeId" | "recordImageAttributeId",
    attributeId: string | null
  ) => {
    setPending(true)
    try {
      await updateObject(organizationId, object.id, { [field]: attributeId })
      toast.success("Record appearance updated")
      onSaved()
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Couldn’t update record appearance.")
    } finally {
      setPending(false)
    }
  }

  const create = async (attribute: Attribute) => {
    const field = attribute.type === "image" ? "recordImageAttributeId" : "recordTextAttributeId"
    await save(field, attribute.id)
  }

  const selectedText = object.attributes.find((attribute) => attribute.id === object.recordTextAttributeId)
  const selectedImage = object.attributes.find((attribute) => attribute.id === object.recordImageAttributeId)

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div>
        <h3 className="text-base font-semibold">Record label</h3>
        <p className="text-sm text-muted-foreground">Define the attributes used to identify records.</p>
        <div className="mt-6 space-y-5">
          <AppearanceAttributePicker
            label="Record name"
            placeholder="Record ID (default)"
            attributes={textAttributes}
            selectedId={object.recordTextAttributeId}
            createTypes={["text", "number"]}
            includeRecordId
            disabled={pending}
            onChange={(id) => void save("recordTextAttributeId", id)}
            onCreateType={setCreateType}
          />
          <p className="-mt-2 text-xs text-muted-foreground">Choose a Text or Number attribute. If none is selected, records show their Record ID.</p>
          <AppearanceAttributePicker
            label="Record image"
            placeholder="Choose an image attribute…"
            attributes={imageAttributes}
            selectedId={object.recordImageAttributeId}
            createTypes={["image"]}
            disabled={pending}
            onChange={(id) => void save("recordImageAttributeId", id)}
            onCreateType={setCreateType}
          />
        </div>
      </div>
      <div className="rounded-2xl border bg-muted/20 p-8">
        <div className="mx-auto max-w-56 rounded-xl border bg-background p-3 shadow-sm">
          <div className="flex items-center gap-2 border-b pb-2">
            <span className="flex size-5 items-center justify-center rounded bg-primary/15 text-primary"><ObjectGlyph icon={object.icon} color={object.iconColor} className="size-3" /></span>
            <span className="truncate text-sm font-medium">{object.singularNoun.toLowerCase()}</span>
          </div>
          <div className="flex items-center gap-2 pt-2">
            {selectedImage ? <span className="flex size-5 rounded bg-muted" /> : null}
            <span className="truncate text-sm">{selectedText?.title ?? "Record ID"}</span>
          </div>
        </div>
        <p className="mt-7 text-center text-sm font-medium text-muted-foreground">Preview</p>
      </div>
      {createType && (
        <AttributeCreateSheet
          organizationId={organizationId}
          objectId={object.id}
          objectSingular={object.singularNoun}
          initialType={createType}
          onClose={() => setCreateType(null)}
          onCreated={create}
        />
      )}
    </div>
  )
}

function AppearanceAttributePicker({
  label,
  placeholder,
  attributes,
  selectedId,
  createTypes,
  includeRecordId = false,
  disabled,
  onChange,
  onCreateType,
}: {
  label: string
  placeholder: string
  attributes: Attribute[]
  selectedId: string | null
  createTypes: Array<"text" | "number" | "image">
  includeRecordId?: boolean
  disabled: boolean
  onChange: (id: string | null) => void
  onCreateType: (type: "text" | "number" | "image") => void
}) {
  const selected = attributes.find((attribute) => attribute.id === selectedId)
  const items = React.useMemo<CascaderNode[]>(() => [
    ...(includeRecordId ? [{ value: "record-id", label: "Record ID", icon: <HashIcon className="size-4" /> }] : []),
    ...attributes.map((attribute) => {
      const Icon = getAttributeIcon(attribute.type, attribute.slug, attribute.config?.icon)
      return { value: attribute.id, label: attribute.title, icon: <Icon className="size-4" />, keywords: [attribute.slug] }
    }),
  ], [attributes, includeRecordId])
  const actions = React.useMemo<CascaderActionItem[]>(() => [{
    value: "create-attribute",
    label: "Create new attribute",
    icon: <PlusIcon className="size-4" />,
    items: createTypes.map((type) => ({
      value: `create-${type}`,
      label: type === "image" ? "Image" : type === "number" ? "Number" : "Text",
      onSelect: () => onCreateType(type),
    })),
  }], [createTypes, onCreateType])

  return <Field>
    <FieldLabel>{label}</FieldLabel>
    <Cascader items={items} value={selectedId ?? (includeRecordId ? "record-id" : "")} onValueChange={(value) => onChange(value === "record-id" ? null : value || null)} actions={actions}>
      <CascaderTrigger disabled={disabled} showIcon={false} render={<Button type="button" variant="outline" className="w-full justify-between font-normal"><span>{selected?.title ?? placeholder}</span></Button>} />
      <CascaderContent align="start" className="w-72"><CascaderPanel><CascaderNav><CascaderInput placeholder={`Search ${label.toLowerCase()}…`} /></CascaderNav><CascaderBreadcrumb /><CascaderEmpty /><CascaderList><CascaderItems /></CascaderList><CascaderFooter /><CascaderStatus /></CascaderPanel></CascaderContent>
    </Cascader>
  </Field>
}

function ConfigurationPanel({
  organizationId,
  object,
  onSaved,
}: {
  organizationId: number | string
  object: RecordObject
  onSaved: () => void
}) {
  const [singular, setSingular] = React.useState(object.singularNoun)
  const [plural, setPlural] = React.useState(object.pluralNoun)
  const [slug, setSlug] = React.useState(object.slug)
  const [icon, setIcon] = React.useState(object.icon)
  const [iconColor, setIconColor] = React.useState(object.iconColor)
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const dirty =
    singular !== object.singularNoun ||
    plural !== object.pluralNoun ||
    slug !== object.slug ||
    icon !== object.icon ||
    iconColor !== object.iconColor

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await updateObject(organizationId, object.id, {
        singularNoun: singular.trim(),
        pluralNoun: plural.trim(),
        icon,
        iconColor,
        slug: object.isSystem || slug === object.slug ? undefined : slug.trim(),
      })
      toast.success("Object updated")
      onSaved()
    } catch (err) {
      setError(
        err instanceof ApiError
          ? (err.errors?.slug?.[0] ??
              err.errors?.singular_noun?.[0] ??
              err.message)
          : "Failed to save the object."
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <div>
        <h3 className="font-medium">General</h3>
        <p className="text-sm text-muted-foreground">
          Set words to describe a single and multiple objects of this type
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Field>
        <FieldLabel>Icon</FieldLabel>
        <div className="flex items-center gap-3">
          <ObjectGlyph icon={icon} color={iconColor} className="size-7" />
          <div className="flex flex-wrap gap-1.5">
            {OBJECT_COLOR_NAMES.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setIconColor(name)}
                disabled={submitting}
                aria-label={name}
                aria-pressed={iconColor === name}
                className={cn(
                  "size-5 rounded-full transition-transform",
                  OBJECT_ICON_COLORS[name].swatch,
                  iconColor === name
                    ? "ring-2 ring-foreground/40 ring-offset-2 ring-offset-background"
                    : "hover:scale-110"
                )}
              />
            ))}
          </div>
        </div>

        <div className="mt-2 grid grid-cols-10 gap-1.5 rounded-lg border border-border p-2">
          {OBJECT_ICON_NAMES.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setIcon(name)}
              disabled={submitting}
              aria-label={name}
              aria-pressed={icon === name}
              className={cn(
                "flex size-8 items-center justify-center rounded-md transition-colors",
                icon === name
                  ? "bg-accent text-accent-foreground ring-1 ring-foreground/20"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
              )}
            >
              <ObjectGlyph
                icon={name}
                color={icon === name ? iconColor : undefined}
              />
            </button>
          ))}
        </div>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="object-plural-noun">Plural noun</FieldLabel>
          <Input
            id="object-plural-noun"
            value={plural}
            onChange={(e) => setPlural(e.target.value)}
            placeholder="Companies"
            disabled={submitting}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="object-singular-noun">Singular noun</FieldLabel>
          <Input
            id="object-singular-noun"
            value={singular}
            onChange={(e) => setSingular(e.target.value)}
            placeholder="Company"
            disabled={submitting}
          />
        </Field>
      </div>

      <Field>
        <FieldLabel htmlFor="object-slug">Slug</FieldLabel>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">/</span>
          <Input
            id="object-slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            disabled={submitting || object.isSystem}
            className="font-mono text-sm"
          />
        </div>
        {object.isSystem ? (
          <FieldDescription>
            You can&apos;t change the slug of a system object
          </FieldDescription>
        ) : (
          <FieldDescription>
            Used in the API and in links. Changing it breaks existing references
            to this object.
          </FieldDescription>
        )}
      </Field>

      <div className="flex justify-end border-t border-border pt-4">
        <Button
          type="submit"
          disabled={submitting || !dirty || !singular.trim() || !plural.trim()}
        >
          {submitting && <Spinner className="mr-2 size-4" />}
          Save changes
        </Button>
      </div>
    </form>
  )
}
