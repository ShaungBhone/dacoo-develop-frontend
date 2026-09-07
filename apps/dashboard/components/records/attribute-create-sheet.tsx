"use client"

import * as React from "react"
import { toast } from "sonner"

import { ApiError } from "@/lib/api"
import { cn } from "@/lib/utils"
import {
  createAttribute,
  type Attribute,
  type AttributeType,
} from "@/components/records/api"
import { AttributeInput } from "@/components/records/custom-fields"
import { ATTRIBUTE_TYPE_OPTIONS } from "@/components/records/attribute-types"
import { Alert, AlertDescription } from "@/components/reui/alert"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Spinner } from "@/components/ui/spinner"
import { useCurrencySettings } from "@/contexts/currency-settings-context"
import {
  fetchCurrencies,
  type Currency,
} from "@/components/settings/currency-api"

/** Which of the engine's attribute types a workspace can create. */
const CREATABLE_TYPES = ATTRIBUTE_TYPE_OPTIONS.map((option) => ({
  ...option,
  value: option.type,
}))

type TypeItem = (typeof CREATABLE_TYPES)[number]

export interface AttributeCreateSheetProps {
  organizationId: number | string
  objectId: string
  /** Singular noun of the owning object, used in the description. */
  objectSingular: string
  /** Pre-picked type, e.g. from a picker step. Still changeable in the form. */
  initialType?: AttributeType
  onClose: () => void
  onCreated?: (attribute: Attribute) => void | Promise<void>
}

export function AttributeCreateSheet({
  organizationId,
  objectId,
  objectSingular,
  initialType = "text",
  onClose,
  onCreated,
}: AttributeCreateSheetProps) {
  const { settings: workspaceCurrency } = useCurrencySettings()
  const [title, setTitle] = React.useState("")
  const [type, setType] = React.useState<AttributeType>(initialType)
  const [options, setOptions] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [hasDefault, setHasDefault] = React.useState(false)
  const [defaultValue, setDefaultValue] = React.useState<unknown>(null)
  const [isRequired, setIsRequired] = React.useState(false)
  const [isUnique, setIsUnique] = React.useState(false)
  const [currencies, setCurrencies] = React.useState<Currency[]>([])
  const [currencyCode, setCurrencyCode] = React.useState("")
  const [currencyDisplay, setCurrencyDisplay] = React.useState<
    "code" | "symbol"
  >("code")
  const [currencyGrouping, setCurrencyGrouping] = React.useState<
    "default" | "none"
  >("default")
  const [currencyError, setCurrencyError] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const needsOptions = type === "select" || type === "status"
  const selectedTypeItem =
    CREATABLE_TYPES.find((option) => option.type === type) ??
    CREATABLE_TYPES[0]
  const selectedCurrency = currencies.find(
    (currency) => currency.code === currencyCode
  )
  const parsedOptions = options
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => ({ title: line }))
  const defaultAttribute: Attribute = {
    id: "new-attribute-default",
    slug: "default-value",
    title: title.trim() || "Default value",
    type,
    isSystem: false,
    isCustom: true,
    isMultiselect: false,
    isRequired,
    isUnique: false,
    position: 0,
    config: null,
    selectOptions: parsedOptions.map((option, position) => ({
      id: `new-option-${position}`,
      slug: option.title
        .toLowerCase()
        .replaceAll(/[^a-z0-9]+/g, "-")
        .replaceAll(/^-|-$/g, ""),
      title: option.title,
      color: null,
      position,
      isArchived: false,
    })),
  }

  React.useEffect(() => {
    if (type !== "currency" || currencies.length > 0) return

    fetchCurrencies()
      .then((list) => {
        setCurrencies(list)
        const preferred = workspaceCurrency?.code?.toUpperCase()
        setCurrencyCode(
          list.some((currency) => currency.code === preferred)
            ? preferred!
            : (list.find((currency) => currency.code === "USD")?.code ??
                list[0]?.code ??
                "")
        )
      })
      .catch((err) => {
        setCurrencyError(
          err instanceof ApiError ? err.message : "Unable to load currencies."
        )
      })
  }, [currencies.length, type, workspaceCurrency?.code])

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const created = await createAttribute(organizationId, objectId, {
        title: title.trim(),
        type,
        isRequired,
        isUnique,
        selectOptions: needsOptions ? parsedOptions : undefined,
        config: {
          ...(description.trim() ? { description: description.trim() } : {}),
          ...(hasDefault ? { default_value: defaultValue } : {}),
          ...(type === "currency"
            ? {
                currency_code: currencyCode,
                currency_display: currencyDisplay,
                currency_grouping: currencyGrouping,
              }
            : {}),
        },
      })
      toast.success(`Attribute "${title.trim()}" created`)
      await onCreated?.(created)
      onClose()
    } catch (err) {
      setError(
        err instanceof ApiError
          ? (err.errors?.slug?.[0] ?? err.errors?.title?.[0] ?? err.message)
          : "Failed to create the attribute."
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Sheet open onOpenChange={(open) => !submitting && !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full gap-0 p-0 sm:max-w-xl"
        onPointerDownOutside={(event) => {
          const target = event.target as HTMLElement | null
          const isOverlay =
            target?.getAttribute?.("data-slot") === "sheet-overlay" ||
            target?.classList?.contains("bg-black/30")
          if (!isOverlay) event.preventDefault()
        }}
        onInteractOutside={(event) => {
          const target = event.target as HTMLElement | null
          const isOverlay =
            target?.getAttribute?.("data-slot") === "sheet-overlay" ||
            target?.classList?.contains("bg-black/30")
          if (!isOverlay) event.preventDefault()
        }}
      >
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <SheetHeader>
            <SheetTitle>Create attribute</SheetTitle>
            <SheetDescription>
              Adds a field to every {objectSingular.toLowerCase()} record.
            </SheetDescription>
          </SheetHeader>

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto border-y border-border p-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Field>
              <FieldLabel htmlFor="attribute-title">
                Name <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="attribute-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Account tier"
                disabled={submitting}
                autoFocus
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="attribute-description">
                Description (optional)
              </FieldLabel>
              <textarea
                id="attribute-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                disabled={submitting}
                placeholder="Add a description for this attribute"
                className={cn(
                  "w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm",
                  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none"
                )}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="attribute-type">Type</FieldLabel>
              <Select
                value={selectedTypeItem}
                items={CREATABLE_TYPES}
                onValueChange={(next: TypeItem) => setType(next.type)}
                disabled={submitting}
              >
                <SelectTrigger id="attribute-type" className="w-full">
                  <SelectValue>
                    {(item: TypeItem) => {
                      const SelectedIcon = item?.icon
                      return (
                        <span className="flex items-center gap-2">
                          {SelectedIcon ? (
                            <SelectedIcon className="text-muted-foreground size-4" />
                          ) : null}
                          <span>{item?.label}</span>
                        </span>
                      )
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  <SelectGroup>
                    {CREATABLE_TYPES.map((option) => {
                      const TypeIcon = option.icon
                      return (
                        <SelectItem key={option.type} value={option}>
                          <TypeIcon className="text-muted-foreground size-4" />
                          {option.label}
                        </SelectItem>
                      )
                    })}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Type can&apos;t be changed once the attribute exists.
              </p>
            </Field>

            {needsOptions && (
              <Field>
                <FieldLabel htmlFor="attribute-options">
                  Options, one per line
                </FieldLabel>
                <textarea
                  id="attribute-options"
                  value={options}
                  onChange={(e) => setOptions(e.target.value)}
                  rows={4}
                  disabled={submitting}
                  placeholder={"Enterprise\nMid-market\nSMB"}
                  className={cn(
                    "w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm",
                    "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none"
                  )}
                />
                {options.trim() === "" && (
                  <FieldError>Add at least one option.</FieldError>
                )}
              </Field>
            )}

            <Field>
              <div className="flex items-center justify-between gap-3">
                <FieldLabel htmlFor="attribute-default">
                  Default value (optional)
                </FieldLabel>
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Checkbox
                    checked={hasDefault}
                    disabled={submitting || isUnique}
                    onCheckedChange={(checked) => {
                      setHasDefault(checked === true)
                      if (checked !== true) setDefaultValue(null)
                    }}
                  />
                  Use default
                </label>
              </div>
              {hasDefault ? (
                <AttributeInput
                  id="attribute-default"
                  attribute={defaultAttribute}
                  value={defaultValue}
                  onChange={setDefaultValue}
                  disabled={submitting}
                />
              ) : (
                <Input
                  id="attribute-default"
                  value=""
                  disabled
                  placeholder="Set a default value…"
                />
              )}
              {isUnique && (
                <FieldDescription>
                  A unique attribute cannot have a default value.
                </FieldDescription>
              )}
            </Field>

            <Field>
              <FieldLabel>Constraints</FieldLabel>
              <div className="space-y-3 pt-1">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={isRequired}
                    disabled={submitting}
                    onCheckedChange={(checked) =>
                      setIsRequired(checked === true)
                    }
                  />
                  Required
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={isUnique}
                    disabled={submitting}
                    onCheckedChange={(checked) => {
                      const next = checked === true
                      setIsUnique(next)
                      if (next) {
                        setHasDefault(false)
                        setDefaultValue(null)
                      }
                    }}
                  />
                  Unique
                </label>
              </div>
            </Field>

            {type === "currency" && (
              <div className="space-y-4 border-t border-border pt-5">
                <p className="text-sm font-medium">Currency configuration</p>
                {currencyError && <FieldError>{currencyError}</FieldError>}
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field className="sm:col-span-2">
                    <FieldLabel htmlFor="attribute-currency">
                      Currency <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Select
                      value={currencyCode}
                      onValueChange={setCurrencyCode}
                      disabled={submitting || currencies.length === 0}
                    >
                      <SelectTrigger id="attribute-currency">
                        <SelectValue
                          placeholder={
                            currencies.length === 0
                              ? "Loading currencies…"
                              : "Select currency"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((currency) => (
                          <SelectItem
                            key={currency.code}
                            value={currency.code}
                          >
                            {currency.name} ({currency.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel>
                      Display <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Select
                      value={currencyDisplay}
                      onValueChange={(value) =>
                        setCurrencyDisplay(value as "code" | "symbol")
                      }
                      disabled={submitting}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="code">Code</SelectItem>
                        <SelectItem value="symbol">Symbol</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel>Decimal places</FieldLabel>
                    <Input
                      value={
                        selectedCurrency
                          ? `${selectedCurrency.precision} decimal${selectedCurrency.precision === 1 ? "" : "s"}`
                          : "—"
                      }
                      disabled
                    />
                  </Field>
                  <Field className="sm:col-span-2">
                    <FieldLabel>
                      Grouping <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Select
                      value={currencyGrouping}
                      onValueChange={(value) =>
                        setCurrencyGrouping(value as "default" | "none")
                      }
                      disabled={submitting}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default</SelectItem>
                        <SelectItem value="none">No grouping</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </div>
            )}
          </div>

          <SheetFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                submitting ||
                !title.trim() ||
                (needsOptions && options.trim() === "") ||
                (type === "currency" &&
                  (!currencyCode || Boolean(currencyError)))
              }
            >
              {submitting && <Spinner className="mr-2 size-4" />}
              Create attribute
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
