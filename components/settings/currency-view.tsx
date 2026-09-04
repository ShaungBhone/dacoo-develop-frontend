"use client"

import * as React from "react"
import {
  BuildingIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  SearchIcon,
  TriangleAlertIcon,
} from "@/components/ui/icons"

import { useOrganization } from "@/contexts/organization-context"
import { useCurrencySettings } from "@/contexts/currency-settings-context"
import { ApiError } from "@/lib/api"
import {
  type Currency,
  type CurrencySettings,
  fetchCurrencies,
  fetchCurrencySettings,
  resetCurrencySettings,
  SUPPORTED_CURRENCY_CODES,
  updateCurrencySettings,
} from "@/components/settings/currency-api"
import { CurrencyFlag } from "@/components/currency-flag"
import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

function formatPreview(form: CurrencySettings): string {
  const decimals = Math.min(Math.max(form.decimals, 0), 4)
  const [integerPart, fractionPart] = Math.abs(1234.5)
    .toFixed(decimals)
    .split(".")
  const grouped = integerPart.replace(
    /\B(?=(\d{3})+(?!\d))/g,
    form.thousands_separator || ""
  )
  const formatted = fractionPart
    ? `${grouped}${form.decimal_separator || "."}${fractionPart}`
    : grouped

  return form.position === "after"
    ? `${formatted}${form.symbol}`
    : `${form.symbol}${formatted}`
}

export function CurrencyView() {
  const { activeOrganizationId, activeOrganization } = useOrganization()

  if (!activeOrganizationId) {
    return (
      <Empty className="py-16">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <BuildingIcon aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>No organization selected</EmptyTitle>
          <EmptyDescription>
            Select or create an organization to manage its currency settings.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <CurrencyForm
      key={activeOrganizationId}
      organizationId={activeOrganizationId}
      organizationName={activeOrganization?.name ?? "your organization"}
    />
  )
}

function CurrencyForm({
  organizationId,
  organizationName,
}: {
  organizationId: number
  organizationName: string
}) {
  const { setSettings: setWorkspaceCurrencySettings } = useCurrencySettings()
  const [loading, setLoading] = React.useState(true)
  const [currencies, setCurrencies] = React.useState<Currency[]>([])
  const [settings, setSettings] = React.useState<CurrencySettings | null>(null)
  const [form, setForm] = React.useState<CurrencySettings | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [resetting, setResetting] = React.useState(false)
  const [saved, setSaved] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = React.useState<
    Record<string, string[]>
  >({})
  const [currencyMenuOpen, setCurrencyMenuOpen] = React.useState(false)
  const [currencySearch, setCurrencySearch] = React.useState("")

  React.useEffect(() => {
    let ignore = false

    async function load() {
      setLoading(true)
      try {
        const [currencyList, currencySettings] = await Promise.all([
          fetchCurrencies(),
          fetchCurrencySettings(organizationId),
        ])
        if (ignore) return
        setCurrencies(currencyList)
        setSettings(currencySettings)
        setForm(currencySettings)
      } catch (err) {
        if (!ignore) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load currency settings."
          )
        }
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    load()

    return () => {
      ignore = true
    }
  }, [organizationId])

  if (loading || !form || !settings) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    )
  }

  const dirty =
    form.code !== settings.code ||
    form.symbol !== settings.symbol ||
    form.position !== settings.position ||
    form.decimals !== settings.decimals ||
    form.decimal_separator !== settings.decimal_separator ||
    (form.thousands_separator ?? "") !== (settings.thousands_separator ?? "")

  const supportedCurrencies = currencies.filter((currency) =>
    SUPPORTED_CURRENCY_CODES.has(currency.code)
  )
  const selectedCurrency = supportedCurrencies.find(
    (currency) => currency.code === form.code
  )
  const visibleCurrencies = supportedCurrencies.filter((currency) => {
    const query = currencySearch.trim().toLowerCase()
    return (
      query.length === 0 ||
      [currency.name, currency.code, currency.symbol]
        .join(" ")
        .toLowerCase()
        .includes(query)
    )
  })

  function updateForm(patch: Partial<CurrencySettings>) {
    setForm((current) => (current ? { ...current, ...patch } : current))
  }

  function handleCurrencyChange(code: string) {
    const currency = supportedCurrencies.find((c) => c.code === code)
    if (!currency) return

    updateForm({
      code: currency.code,
      symbol: currency.symbol,
      position: currency.symbol_first ? "before" : "after",
      decimals: currency.precision,
      decimal_separator: currency.decimal_mark,
      thousands_separator: currency.thousands_separator,
    })
  }

  function handleCancel() {
    setForm(settings)
    setFieldErrors({})
    setError(null)
  }

  async function handleSave() {
    if (!form) return

    setSaving(true)
    setSaved(false)
    setError(null)
    setFieldErrors({})

    try {
      const updated = await updateCurrencySettings(organizationId, form)
      setSettings(updated)
      setWorkspaceCurrencySettings(updated)
      setForm(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      if (err instanceof ApiError && err.status === 422 && err.errors) {
        setFieldErrors(err.errors)
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong. Please try again."
        )
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleReset() {
    setResetting(true)
    setSaved(false)
    setError(null)
    setFieldErrors({})

    try {
      const reset = await resetCurrencySettings(organizationId)
      setSettings(reset)
      setWorkspaceCurrencySettings(reset)
      setForm(reset)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      )
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <FieldGroup className="gap-5">
        <Field orientation="responsive" data-invalid={!!fieldErrors.code}>
          <FieldContent className="md:max-w-xs">
            <FieldLabel htmlFor="currency-code">Currency</FieldLabel>
            <FieldDescription>
              Sets the default symbol and formatting.
            </FieldDescription>
          </FieldContent>
          <div className="flex w-full flex-col gap-1 md:max-w-md">
            <DropdownMenu
              open={currencyMenuOpen}
              onOpenChange={(open) => {
                setCurrencyMenuOpen(open)
                if (!open) setCurrencySearch("")
              }}
            >
              <DropdownMenuTrigger
                render={
                  <Button
                    id="currency-code"
                    type="button"
                    variant="outline"
                    disabled={saving || resetting}
                    className="w-full justify-between font-normal"
                  />
                }
              >
                {selectedCurrency ? (
                  <span className="flex min-w-0 items-center gap-2 truncate">
                    <CurrencyFlag
                      currencyCode={selectedCurrency.code}
                      className="size-5"
                    />
                    <span className="truncate">
                      {selectedCurrency.name} ({selectedCurrency.code})
                    </span>
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    Select a currency
                  </span>
                )}
                <ChevronDownIcon data-icon="inline-end" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-80" align="start">
                <div
                  className="p-1 pb-0"
                  onKeyDown={(event) => event.stopPropagation()}
                >
                  <InputGroup className="h-8 bg-input/50">
                    <InputGroupInput
                      autoFocus
                      value={currencySearch}
                      onChange={(event) =>
                        setCurrencySearch(event.target.value)
                      }
                      placeholder="Search currencies"
                      aria-label="Search currencies"
                    />
                    <InputGroupAddon>
                      <SearchIcon />
                    </InputGroupAddon>
                  </InputGroup>
                </div>
                <DropdownMenuGroup>
                  <DropdownMenuRadioGroup
                    value={form.code ?? undefined}
                    onValueChange={(code) => {
                      handleCurrencyChange(code)
                      setCurrencyMenuOpen(false)
                    }}
                  >
                    {visibleCurrencies.length === 0 ? (
                      <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                        No supported currencies found.
                      </p>
                    ) : (
                      visibleCurrencies.map((currency) => (
                        <DropdownMenuRadioItem
                          key={currency.code}
                          value={currency.code}
                        >
                          <CurrencyFlag
                            currencyCode={currency.code}
                            className="size-5"
                          />
                          {currency.name} ({currency.code})
                        </DropdownMenuRadioItem>
                      ))
                    )}
                  </DropdownMenuRadioGroup>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            {fieldErrors.code && <FieldError>{fieldErrors.code[0]}</FieldError>}
          </div>
        </Field>

        <Separator />

        <Field orientation="responsive" data-invalid={!!fieldErrors.symbol}>
          <FieldContent className="md:max-w-xs">
            <FieldLabel htmlFor="currency-symbol">
              Symbol <span className="text-destructive">*</span>
            </FieldLabel>
            <FieldDescription>
              Shown next to every amount, e.g. $ or ฿.
            </FieldDescription>
          </FieldContent>
          <div className="flex w-full flex-col gap-1 md:max-w-md">
            <Input
              id="currency-symbol"
              value={form.symbol}
              onChange={(e) => updateForm({ symbol: e.target.value })}
              disabled={saving || resetting}
              maxLength={10}
              required
            />
            {fieldErrors.symbol && (
              <FieldError>{fieldErrors.symbol[0]}</FieldError>
            )}
          </div>
        </Field>

        <Separator />

        <Field orientation="responsive" data-invalid={!!fieldErrors.position}>
          <FieldContent className="md:max-w-xs">
            <FieldLabel htmlFor="currency-position">
              Symbol position <span className="text-destructive">*</span>
            </FieldLabel>
            <FieldDescription>
              Place the symbol before or after the amount.
            </FieldDescription>
          </FieldContent>
          <div className="flex w-full flex-col gap-1 md:max-w-md">
            <ToggleGroup
              id="currency-position"
              type="single"
              variant="outline"
              spacing={0}
              value={form.position}
              onValueChange={(value) => {
                if (value) updateForm({ position: value as "before" | "after" })
              }}
              disabled={saving || resetting}
            >
              <ToggleGroupItem value="before" className="flex-1">
                Before amount
              </ToggleGroupItem>
              <ToggleGroupItem value="after" className="flex-1">
                After amount
              </ToggleGroupItem>
            </ToggleGroup>
            {fieldErrors.position && (
              <FieldError>{fieldErrors.position[0]}</FieldError>
            )}
          </div>
        </Field>

        <Separator />

        <Field orientation="responsive" data-invalid={!!fieldErrors.decimals}>
          <FieldContent className="md:max-w-xs">
            <FieldLabel htmlFor="currency-decimals">
              Decimal places <span className="text-destructive">*</span>
            </FieldLabel>
            <FieldDescription>
              How many digits appear after the decimal point.
            </FieldDescription>
          </FieldContent>
          <div className="flex w-full flex-col gap-1 md:max-w-md">
            <Select
              value={String(form.decimals)}
              onValueChange={(value) => updateForm({ decimals: Number(value) })}
              disabled={saving || resetting}
            >
              <SelectTrigger id="currency-decimals" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {[0, 1, 2, 3, 4].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {fieldErrors.decimals && (
              <FieldError>{fieldErrors.decimals[0]}</FieldError>
            )}
          </div>
        </Field>

        <Separator />

        <Field
          orientation="responsive"
          data-invalid={!!fieldErrors.decimal_separator}
        >
          <FieldContent className="md:max-w-xs">
            <FieldLabel htmlFor="currency-decimal-separator">
              Decimal separator <span className="text-destructive">*</span>
            </FieldLabel>
            <FieldDescription>
              The character used before the decimal digits.
            </FieldDescription>
          </FieldContent>
          <div className="flex w-full flex-col gap-1 md:max-w-md">
            <Input
              id="currency-decimal-separator"
              value={form.decimal_separator}
              onChange={(e) =>
                updateForm({ decimal_separator: e.target.value })
              }
              disabled={saving || resetting}
              maxLength={1}
              className="max-w-24"
              required
            />
            {fieldErrors.decimal_separator && (
              <FieldError>{fieldErrors.decimal_separator[0]}</FieldError>
            )}
          </div>
        </Field>

        <Separator />

        <Field
          orientation="responsive"
          data-invalid={!!fieldErrors.thousands_separator}
        >
          <FieldContent className="md:max-w-xs">
            <FieldLabel htmlFor="currency-thousands-separator">
              Thousands separator
            </FieldLabel>
            <FieldDescription>
              The character used to group thousands. Leave blank for none.
            </FieldDescription>
          </FieldContent>
          <div className="flex w-full flex-col gap-1 md:max-w-md">
            <Input
              id="currency-thousands-separator"
              value={form.thousands_separator ?? ""}
              onChange={(e) =>
                updateForm({ thousands_separator: e.target.value })
              }
              disabled={saving || resetting}
              maxLength={1}
              className="max-w-24"
            />
            {fieldErrors.thousands_separator && (
              <FieldError>{fieldErrors.thousands_separator[0]}</FieldError>
            )}
          </div>
        </Field>

        <Separator />

        <Field orientation="responsive">
          <FieldContent className="md:max-w-xs">
            <FieldLabel>Preview</FieldLabel>
            <FieldDescription>
              How an amount will look with these settings.
            </FieldDescription>
          </FieldContent>
          <div className="flex w-full items-center md:max-w-md">
            <span className="rounded-md bg-muted px-3 py-1.5 font-mono text-sm">
              {formatPreview(form)}
            </span>
          </div>
        </Field>
      </FieldGroup>

      {error && (
        <Alert variant="destructive">
          <TriangleAlertIcon aria-hidden="true" />
          <AlertTitle>Couldn&apos;t update currency settings</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {saved && (
        <Alert variant="success">
          <CheckCircle2Icon aria-hidden="true" />
          <AlertTitle className="text-balance">Saved</AlertTitle>
          <AlertDescription>
            Currency settings have been updated.
          </AlertDescription>
        </Alert>
      )}

      <Separator />

      <div className="flex items-center justify-between gap-3">
        <Button
          variant="outline"
          onClick={handleReset}
          disabled={saving || resetting}
        >
          {resetting ? (
            <>
              <Spinner className="size-4" />
              Resetting…
            </>
          ) : (
            "Reset to default"
          )}
        </Button>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={!dirty || saving || resetting}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!dirty || saving || resetting}>
            {saving ? (
              <>
                <Spinner className="size-4" />
                Saving…
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
