"use client"

import * as React from "react"

import { ApiError } from "@/lib/api"
import { normalizeDomain } from "@/lib/domain"
import { cn } from "@/lib/utils"
import {
  fetchCustomAttributes,
  fetchLocationResults,
  type Attribute,
  type AttributeValues,
  type LocationSearchResult,
} from "@/components/records/api"
import { formatLocationLabel } from "@/components/records/location-value"
import { socialPlatformFor } from "@/components/records/social-attributes"
import { Alert, AlertDescription } from "@/components/reui/alert"
import {
  DateSelector,
  formatDateValue,
  type DateSelectorValue,
} from "@/components/reui/date-selector"
import { CalendarIcon, MapPinIcon, PlusIcon } from "@/components/ui/icons"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { format, parseISO } from "date-fns"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxSeparator,
  ComboboxTrigger,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { PhoneInput } from "@/components/reui/phone-input"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"

interface CustomFieldsProps {
  organizationId: number | string
  /** Which object's attributes to render — "person" or "company". */
  objectSlug: string
  values: AttributeValues
  onChange: (values: AttributeValues) => void
  disabled?: boolean
  /** Server-side validation errors keyed by attribute slug. */
  errors?: Record<string, string>
  /** Load only while the containing sheet is open. */
  enabled?: boolean
}

/**
 * Renders a workspace's user-defined fields from the attribute schema.
 *
 * Nothing here is hard-coded per field — the input is chosen from the
 * attribute's type, which is why adding an attribute in settings makes it
 * appear in the form with no frontend change.
 */
export function CustomFields({
  organizationId,
  objectSlug,
  values,
  onChange,
  disabled,
  errors = {},
  enabled = true,
}: CustomFieldsProps) {
  const [attributes, setAttributes] = React.useState<Attribute[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!enabled) return

    let cancelled = false

    void Promise.resolve().then(() => {
      if (cancelled) return

      setLoading(true)
      setError(null)

      return fetchCustomAttributes(organizationId, objectSlug)
        .then((list) => {
          if (!cancelled) setAttributes(list)
        })
        .catch((err) => {
          if (cancelled) return
          setError(
            err instanceof ApiError
              ? err.message
              : "Failed to load custom fields."
          )
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    })

    return () => {
      cancelled = true
    }
  }, [enabled, organizationId, objectSlug])

  const set = (slug: string, value: unknown) => {
    onChange({ ...values, [slug]: value })
  }

  if (!enabled) return null

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
        <Spinner className="size-4" />
        Loading custom fields…
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  // A workspace with no custom attributes shouldn't see an empty section.
  if (attributes.length === 0) return null

  return (
    <div className="space-y-5 border-t pt-5">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Custom fields
      </p>

      {attributes.map((attribute) => {
        const id = `custom-${attribute.slug}`
        const value = values[attribute.slug]
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
              value={value}
              onChange={(next) => set(attribute.slug, next)}
              disabled={disabled}
              invalid={Boolean(fieldError)}
            />

            {fieldError && (
              <FieldError id={`${id}-error`}>{fieldError}</FieldError>
            )}
          </Field>
        )
      })}
    </div>
  )
}

function DomainInput({
  id,
  value,
  onChange,
  disabled,
  invalid,
  multiple = false,
}: {
  id: string
  value: unknown
  onChange: (val: unknown) => void
  disabled?: boolean
  invalid?: boolean
  /**
   * Whether the attribute holds a list. Company `domain` does; a person's
   * `website` does not, and sending it an array fails the API's `string` rule.
   */
  multiple?: boolean
}) {
  const [inputValue, setInputValue] = React.useState("")
  const anchorRef = useComboboxAnchor()

  const domains = (() => {
    if (!value) return []
    if (Array.isArray(value)) return value.map(String).filter(Boolean)
    if (typeof value === "string") {
      const trimmed = value.trim()
      if (!trimmed) return []
      if (trimmed.startsWith("[")) {
        try {
          const parsed = JSON.parse(trimmed)
          if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean)
        } catch {
          // ignore
        }
      }
      return trimmed
        .split(/[\s,]+/)
        .map((s) => s.trim())
        .filter(Boolean)
    }
    return []
  })()
  const [createdItems, setCreatedItems] = React.useState<string[]>([])
  const items = [
    ...domains,
    ...createdItems.filter(
      (item) =>
        !domains.some((domain) => domain.toLowerCase() === item.toLowerCase())
    ),
  ]

  const updateDomains = (nextDomains: string[]) => {
    // A list attribute takes the array as-is. Joining with ", " — which is what
    // this did while `domain` was still a single column — reaches the API as one
    // unparseable hostname, gets normalized to null, and silently saves nothing.
    if (multiple) {
      onChange(nextDomains)
      return
    }

    onChange(nextDomains[0] ?? null)
  }

  const cleanDomain = (domain: string) => normalizeDomain(domain)

  const query = inputValue.trim()
  const normalizedQuery = query.toLowerCase()
  const filteredDomains = !normalizedQuery
    ? items
    : items.filter((domain) => domain.toLowerCase().includes(normalizedQuery))
  const hasExactMatch = items.some(
    (domain) => domain.toLowerCase() === normalizedQuery
  )
  const showCreateRow = query.length > 0 && !hasExactMatch
  const listItems = showCreateRow
    ? [...filteredDomains, query]
    : filteredDomains

  const handleValueChange = (next: string[], reason: string) => {
    const removedDomain = domains.some(
      (domain) =>
        !next.some(
          (nextDomain) => nextDomain.toLowerCase() === domain.toLowerCase()
        )
    )
    const addedDomain = next.some(
      (nextDomain) =>
        !domains.some(
          (domain) => domain.toLowerCase() === nextDomain.toLowerCase()
        )
    )

    // Combobox options are also selectable values. Re-selecting an existing
    // domain would therefore toggle it off, while chip removal deliberately
    // uses its own `chip-remove-press` event. Keep duplicate selections as-is.
    if (reason === "item-press" && removedDomain && !addedDomain) {
      setInputValue("")
      return
    }

    const invalidDomain = next.find((domain) => !cleanDomain(domain))
    if (invalidDomain) {
      toast.error(`“${invalidDomain}” is not a valid domain.`)
      setInputValue("")
      return
    }

    const nextDomains = next
      .map(cleanDomain)
      .filter(Boolean)
      .filter(
        (domain, index, allDomains) =>
          allDomains.findIndex(
            (existing) => existing.toLowerCase() === domain.toLowerCase()
          ) === index
      )
    const added = nextDomains.filter(
      (domain) =>
        !items.some(
          (existing) => existing.toLowerCase() === domain.toLowerCase()
        )
    )

    if (added.length > 0) {
      setCreatedItems((previousItems) => [...previousItems, ...added])
    }

    // A single-value attribute replaces rather than appends, so the UI never
    // shows two chips where only the first would survive the save.
    updateDomains(
      multiple ? nextDomains : added.length > 0 ? [added.at(-1)!] : nextDomains
    )
    setInputValue("")
  }

  return (
    <Combobox
      items={listItems}
      multiple
      value={domains}
      onValueChange={(next, eventDetails) =>
        handleValueChange(next, eventDetails.reason)
      }
      inputValue={inputValue}
      onInputValueChange={setInputValue}
      autoHighlight
      disabled={disabled}
    >
      <ComboboxChips ref={anchorRef} data-invalid={invalid || undefined}>
        <ComboboxValue>
          {domains.map((domain) => (
            <ComboboxChip key={domain}>{domain}</ComboboxChip>
          ))}
        </ComboboxValue>
        <ComboboxChipsInput
          id={id}
          placeholder="Add domain..."
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? `${id}-error` : undefined}
        />
      </ComboboxChips>
      <ComboboxContent anchor={anchorRef}>
        <ComboboxEmpty>No matching domains.</ComboboxEmpty>
        <ComboboxList>
          {(domain: string) => {
            const isCreateRow =
              showCreateRow &&
              domain === query &&
              !items.some(
                (existing) => existing.toLowerCase() === domain.toLowerCase()
              )

            return (
              <ComboboxItem key={domain} value={domain}>
                {isCreateRow ? (
                  <span className="flex items-center gap-2">
                    <PlusIcon className="text-muted-foreground" />
                    Add new domain &ldquo;{domain}&rdquo;
                  </span>
                ) : (
                  domain
                )}
              </ComboboxItem>
            )
          }}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}

export function TagInput({
  id,
  value,
  onChange,
  disabled,
  invalid,
  multiple = false,
  placeholder = "Add tag...",
}: {
  id?: string
  value: unknown
  onChange: (val: unknown) => void
  disabled?: boolean
  invalid?: boolean
  multiple?: boolean
  placeholder?: string
}) {
  const [inputValue, setInputValue] = React.useState("")
  const [createdItems, setCreatedItems] = React.useState<string[]>([])
  const anchorRef = useComboboxAnchor()

  const tags = (Array.isArray(value) ? value : value ? [value] : [])
    .map(String)
    .map((tag) => tag.trim())
    .filter(Boolean)
  const items = [
    ...tags,
    ...createdItems.filter(
      (item) => !tags.some((tag) => tag.toLowerCase() === item.toLowerCase())
    ),
  ]
  const query = inputValue.trim()
  const normalizedQuery = query.toLowerCase()
  const filteredTags = normalizedQuery
    ? items.filter((tag) => tag.toLowerCase().includes(normalizedQuery))
    : items
  const hasExactMatch = items.some(
    (tag) => tag.toLowerCase() === normalizedQuery
  )
  const showCreateRow = query.length > 0 && !hasExactMatch
  const listItems = showCreateRow ? [...filteredTags, query] : filteredTags

  const handleValueChange = (next: string[], reason: string) => {
    const removedTag = tags.some(
      (tag) =>
        !next.some((nextTag) => nextTag.toLowerCase() === tag.toLowerCase())
    )
    const addedTag = next.some(
      (nextTag) =>
        !tags.some((tag) => tag.toLowerCase() === nextTag.toLowerCase())
    )

    if (reason === "item-press" && removedTag && !addedTag) {
      setInputValue("")
      return
    }

    const nextTags = next
      .map((tag) => tag.trim())
      .filter(Boolean)
      .filter(
        (tag, index, allTags) =>
          allTags.findIndex(
            (existing) => existing.toLowerCase() === tag.toLowerCase()
          ) === index
      )
    const added = nextTags.filter(
      (tag) =>
        !items.some((existing) => existing.toLowerCase() === tag.toLowerCase())
    )

    if (added.length > 0) {
      setCreatedItems((previousItems) => [...previousItems, ...added])
    }

    onChange(
      multiple
        ? nextTags
        : added.length > 0
          ? added.at(-1)!
          : (nextTags[0] ?? null)
    )
    setInputValue("")
  }

  return (
    <Combobox
      items={listItems}
      multiple
      value={tags}
      onValueChange={(next, eventDetails) =>
        handleValueChange(next, eventDetails.reason)
      }
      inputValue={inputValue}
      onInputValueChange={setInputValue}
      autoHighlight
      disabled={disabled}
    >
      <ComboboxChips ref={anchorRef} data-invalid={invalid || undefined}>
        <ComboboxValue>
          {tags.map((tag) => (
            <ComboboxChip key={tag}>{tag}</ComboboxChip>
          ))}
        </ComboboxValue>
        <ComboboxChipsInput
          id={id}
          maxLength={255}
          placeholder="Add tag..."
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? `${id}-error` : undefined}
        />
      </ComboboxChips>
      <ComboboxContent anchor={anchorRef}>
        <ComboboxEmpty>No matching tags.</ComboboxEmpty>
        <ComboboxList>
          {(tag: string) => {
            const isCreateRow =
              showCreateRow &&
              tag === query &&
              !items.some(
                (existing) => existing.toLowerCase() === tag.toLowerCase()
              )

            return (
              <ComboboxItem key={tag} value={tag}>
                {isCreateRow ? (
                  <span className="flex items-center gap-2">
                    <PlusIcon className="text-muted-foreground" />
                    Add new tag &ldquo;{tag}&rdquo;
                  </span>
                ) : (
                  tag
                )}
              </ComboboxItem>
            )
          }}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}

type EmptyStatusOption = {
  type: "none"
  id: "__none__"
  slug: "__none__"
  title: string
  searchText: string
}

type StatusOptionItem = {
  type: "option"
  id: string
  slug: string
  title: string
  color: string | null
  searchText: string
}

type StatusSelectionItem = EmptyStatusOption | StatusOptionItem

function StatusDot({ color }: { color?: string | null }) {
  if (!color) return null
  return (
    <span
      aria-hidden="true"
      className="size-2.5 shrink-0 rounded-full"
      style={{ backgroundColor: color }}
    />
  )
}

function StatusTriggerSummary({
  selected,
  placeholder,
}: {
  selected: StatusOptionItem[]
  placeholder: string
}) {
  if (!selected.length) {
    return <span className="truncate text-muted-foreground">{placeholder}</span>
  }

  if (selected.length === 1) {
    const [first] = selected
    return (
      <span className="flex min-w-0 items-center gap-2">
        <StatusDot color={first.color} />
        <span className="truncate">{first.title}</span>
      </span>
    )
  }

  const visible = selected.slice(0, 3)
  const hiddenCount = selected.length - visible.length

  return (
    <span className="flex min-w-0 items-center gap-1.5">
      {visible.map((item) => (
        <span key={item.id} className="flex items-center gap-1 text-xs">
          <StatusDot color={item.color} />
          <span className="max-w-[90px] truncate">{item.title}</span>
        </span>
      ))}
      {hiddenCount > 0 && (
        <span className="ml-0.5 text-xs text-muted-foreground tabular-nums">
          +{hiddenCount}
        </span>
      )}
    </span>
  )
}

function StatusOptionRow({ option }: { option: StatusSelectionItem }) {
  if (option.type === "none") {
    return <span className="truncate">{option.title}</span>
  }

  return (
    <span className="flex min-w-0 items-center gap-2">
      <StatusDot color={option.color} />
      <span className="truncate">{option.title}</span>
    </span>
  )
}

function StatusSelectInput({
  id,
  attribute,
  value,
  onChange,
  disabled,
  invalid,
}: {
  id: string
  attribute: Attribute
  value: unknown
  onChange: (value: unknown) => void
  disabled?: boolean
  invalid?: boolean
}) {
  const options = React.useMemo<StatusOptionItem[]>(
    () =>
      attribute.selectOptions
        .filter((o) => !o.isArchived)
        .map((o) => ({
          type: "option",
          id: o.id,
          slug: o.slug,
          title: o.title,
          color: o.color,
          searchText: `${o.title} ${o.slug}`,
        })),
    [attribute.selectOptions]
  )

  const noOption = React.useMemo<EmptyStatusOption>(
    () => ({
      type: "none",
      id: "__none__",
      slug: "__none__",
      title: "None",
      searchText: "None clear remove empty",
    }),
    []
  )

  const selectionOptions = React.useMemo<StatusSelectionItem[]>(
    () => [noOption, ...options],
    [noOption, options]
  )

  const placeholder = `Select ${attribute.title.toLowerCase()}`

  if (attribute.isMultiselect) {
    const selectedSlugs = Array.isArray(value)
      ? value.map(String)
      : value == null || value === ""
        ? []
        : [String(value)]

    const selectedOptions = options.filter((o) =>
      selectedSlugs.includes(o.slug)
    )

    const handleMultiChange = (nextItems: StatusSelectionItem[]) => {
      if (nextItems.some((item) => item.type === "none")) {
        onChange(null)
        return
      }
      const realItems = nextItems.filter(
        (item): item is StatusOptionItem => item.type === "option"
      )
      onChange(realItems.length > 0 ? realItems.map((item) => item.slug) : null)
    }

    return (
      <Combobox
        multiple
        items={selectionOptions}
        value={selectedOptions}
        onValueChange={handleMultiChange}
        itemToStringValue={(item: StatusSelectionItem) =>
          item?.searchText ?? ""
        }
        isItemEqualToValue={(
          item: StatusSelectionItem,
          val: StatusSelectionItem
        ) => item.id === val.id}
        autoHighlight
        disabled={disabled}
      >
        <ComboboxTrigger
          className="w-full"
          render={
            <Button
              id={id}
              type="button"
              variant="outline"
              className="h-8 w-full justify-between font-normal"
              aria-invalid={invalid}
            />
          }
        >
          <ComboboxValue placeholder={placeholder}>
            {(selected: StatusOptionItem[]) => (
              <StatusTriggerSummary
                selected={selected ?? []}
                placeholder={placeholder}
              />
            )}
          </ComboboxValue>
        </ComboboxTrigger>

        <ComboboxContent className="z-50 max-w-(--anchor-width) min-w-(--anchor-width)">
          <ComboboxInput
            showTrigger={false}
            placeholder={`Search ${attribute.title.toLowerCase()}...`}
            className="mb-1"
          />
          <ComboboxEmpty>No options found.</ComboboxEmpty>
          <ComboboxList>
            <ComboboxItem value={noOption}>
              <StatusOptionRow option={noOption} />
            </ComboboxItem>
            <ComboboxSeparator />
            {options.map((item) => (
              <ComboboxItem key={item.id} value={item}>
                <StatusOptionRow option={item} />
              </ComboboxItem>
            ))}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    )
  }

  const selectedSlug = value == null || value === "" ? null : String(value)
  const selectedOption = selectedSlug
    ? (options.find((o) => o.slug === selectedSlug) ?? null)
    : null

  const handleSingleChange = (nextItem: StatusSelectionItem | null) => {
    if (!nextItem || nextItem.type === "none") {
      onChange(null)
    } else {
      onChange(nextItem.slug)
    }
  }

  return (
    <Combobox
      items={selectionOptions}
      value={selectedOption}
      onValueChange={handleSingleChange}
      itemToStringValue={(item: StatusSelectionItem) => item?.searchText ?? ""}
      isItemEqualToValue={(
        item: StatusSelectionItem,
        val: StatusSelectionItem
      ) => item.id === val.id}
      autoHighlight
      disabled={disabled}
    >
      <ComboboxTrigger
        className="w-full"
        render={
          <Button
            id={id}
            type="button"
            variant="outline"
            className="h-8 w-full justify-between font-normal"
            aria-invalid={invalid}
          />
        }
      >
        <ComboboxValue placeholder={placeholder}>
          {(selected: StatusSelectionItem | null) => {
            if (!selected || selected.type === "none") {
              return (
                <span className="truncate text-muted-foreground">
                  {placeholder}
                </span>
              )
            }
            return <StatusOptionRow option={selected} />
          }}
        </ComboboxValue>
      </ComboboxTrigger>

      <ComboboxContent className="z-50 max-w-(--anchor-width) min-w-(--anchor-width)">
        <ComboboxInput
          showTrigger={false}
          placeholder={`Search ${attribute.title.toLowerCase()}...`}
          className="mb-1"
        />
        <ComboboxEmpty>No options found.</ComboboxEmpty>
        <ComboboxList>
          <ComboboxItem value={noOption}>
            <StatusOptionRow option={noOption} />
          </ComboboxItem>
          <ComboboxSeparator />
          {options.map((item) => (
            <ComboboxItem key={item.id} value={item}>
              <StatusOptionRow option={item} />
            </ComboboxItem>
          ))}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}

interface LocationGroup {
  kind: LocationSearchResult["kind"]
  label: string
  items: LocationSearchResult[]
}

const LOCATION_GROUP_LABEL: Record<LocationSearchResult["kind"], string> = {
  city: "Cities",
  state: "States",
  country: "Countries",
}

/** Search and select a geographical city, state, or country. */
function LocationInput({
  id,
  value,
  onChange,
  disabled,
  invalid,
}: {
  id: string
  value: unknown
  onChange: (value: unknown) => void
  disabled?: boolean
  invalid?: boolean
}) {
  const [query, setQuery] = React.useState("")
  const [results, setResults] = React.useState<LocationSearchResult[]>([])
  const [loading, setLoading] = React.useState(false)
  const [searchError, setSearchError] = React.useState<string | null>(null)
  const selectedLabel = formatLocationLabel(value)

  const resetSearch = React.useCallback(() => {
    setQuery("")
    setResults([])
    setLoading(false)
    setSearchError(null)
  }, [])

  const handleInputValueChange = React.useCallback((next: string) => {
    setQuery(next)

    if (next.trim().length < 2) {
      setResults([])
      setLoading(false)
      setSearchError(null)
      return
    }

    setLoading(true)
    setSearchError(null)
  }, [])

  React.useEffect(() => {
    const search = query.trim()
    if (search.length < 2) return

    let current = true

    fetchLocationResults(search)
      .then((next) => {
        if (current) setResults(next)
      })
      .catch((error) => {
        if (!current) return
        setResults([])
        setSearchError(
          error instanceof ApiError
            ? error.message
            : "Could not search locations."
        )
      })
      .finally(() => {
        if (current) setLoading(false)
      })

    return () => {
      current = false
    }
  }, [query])

  const groups = React.useMemo<LocationGroup[]>(
    () =>
      (["city", "state", "country"] as const)
        .map((kind) => ({
          kind,
          label: LOCATION_GROUP_LABEL[kind],
          items: results.filter((result) => result.kind === kind),
        }))
        .filter((group) => group.items.length > 0),
    [results]
  )

  const choose = (result: LocationSearchResult | null) => {
    if (!result) return

    onChange({
      city: result.city,
      state: result.state,
      country: result.country,
      lat: result.lat,
      lng: result.lng,
    })
    resetSearch()
  }

  return (
    <Combobox
      items={results}
      value={null}
      onValueChange={choose}
      inputValue={query}
      onInputValueChange={handleInputValueChange}
      itemToStringValue={(result: LocationSearchResult) => result.title}
      disabled={disabled}
      autoHighlight
    >
      <ComboboxTrigger
        className="w-full"
        render={
          <Button
            id={id}
            type="button"
            variant="outline"
            className="h-8 w-full justify-between font-normal"
            aria-invalid={invalid}
            aria-describedby={invalid ? `${id}-error` : undefined}
          />
        }
      >
        <span className="flex min-w-0 items-center gap-2">
          <MapPinIcon className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate">
            {selectedLabel ?? "Select a city, state, or country"}
          </span>
        </span>
      </ComboboxTrigger>

      <ComboboxContent className="z-50 max-w-(--anchor-width) min-w-(--anchor-width)">
        <ComboboxInput
          showTrigger={false}
          placeholder="Search cities, states, or countries…"
          aria-label="Search locations"
          autoFocus
          className="mb-1"
        />

        {loading ? (
          <div className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
            <Spinner className="size-4" />
            Searching locations…
          </div>
        ) : searchError ? (
          <p className="px-3 py-3 text-sm text-destructive">{searchError}</p>
        ) : (
          <>
            <ComboboxEmpty>
              {query.trim().length < 2
                ? "Type at least 2 characters to search."
                : "No locations found."}
            </ComboboxEmpty>
            <ComboboxList>
              {groups.map((group) => (
                <ComboboxGroup key={group.kind} items={group.items}>
                  <ComboboxLabel>{group.label}</ComboboxLabel>
                  {group.items.map((option) => (
                    <ComboboxItem key={option.id} value={option}>
                      <MapPinIcon className="size-4 text-muted-foreground" />
                      <span className="truncate">{option.title}</span>
                    </ComboboxItem>
                  ))}
                </ComboboxGroup>
              ))}
            </ComboboxList>
          </>
        )}

        {selectedLabel ? (
          <>
            <ComboboxSeparator />
            <Button
              type="button"
              variant="ghost"
              className="m-1 w-[calc(100%-0.5rem)] justify-start"
              onClick={() => {
                onChange(null)
                resetSearch()
              }}
            >
              Clear location
            </Button>
          </>
        ) : null}
      </ComboboxContent>
    </Combobox>
  )
}

function parseDateToSelectorValue(val: unknown): DateSelectorValue | undefined {
  if (!val) return undefined
  if (typeof val === "string") {
    const trimmed = val.trim()
    if (!trimmed) return undefined
    const parsed = parseISO(trimmed)
    if (!isNaN(parsed.getTime())) {
      return {
        period: "day",
        operator: "is",
        startDate: parsed,
      }
    }
    const d = new Date(trimmed)
    if (!isNaN(d.getTime())) {
      return {
        period: "day",
        operator: "is",
        startDate: d,
      }
    }
  }
  return undefined
}

function DateSelectorInput({
  id,
  attribute,
  value,
  onChange,
  disabled,
  invalid,
}: {
  id: string
  attribute: Attribute
  value: unknown
  onChange: (value: unknown) => void
  disabled?: boolean
  invalid?: boolean
}) {
  const [open, setOpen] = React.useState(false)
  const initialSelectorValue = React.useMemo(
    () => parseDateToSelectorValue(value),
    [value]
  )
  const [internalValue, setInternalValue] = React.useState<
    DateSelectorValue | undefined
  >(initialSelectorValue)

  React.useEffect(() => {
    if (open) {
      setInternalValue(initialSelectorValue)
    }
  }, [open, initialSelectorValue])

  const displayText = React.useMemo(() => {
    if (!initialSelectorValue) return ""
    return formatDateValue(initialSelectorValue)
  }, [initialSelectorValue])

  const handleApply = () => {
    if (internalValue?.startDate) {
      onChange(format(internalValue.startDate, "yyyy-MM-dd"))
    } else {
      onChange(null)
    }
    setOpen(false)
  }

  const handleCancel = () => {
    setInternalValue(initialSelectorValue)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            className="h-8 w-full justify-start font-normal"
            aria-invalid={invalid}
            aria-describedby={invalid ? `${id}-error` : undefined}
          >
            <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
            <span
              className={cn(
                "truncate",
                !displayText && "text-muted-foreground"
              )}
            >
              {displayText || `Select ${attribute.title.toLowerCase()}...`}
            </span>
          </Button>
        }
      />
      <PopoverContent
        className="w-auto gap-3 p-0"
        align="start"
        sideOffset={4}
      >
        <div className="p-3">
          <DateSelector
            value={internalValue}
            onChange={setInternalValue}
            allowRange={false}
            label={attribute.title}
            inputHint="Try: 2025, Q4, 05/10/2025"
          />
        </div>
        <Separator className="p-0" />
        <div className="flex justify-end gap-2 p-3 pt-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button type="button" size="sm" onClick={handleApply}>
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function AttributeInput({
  id,
  attribute,
  value,
  onChange,
  disabled,
  invalid,
}: {
  id: string
  attribute: Attribute
  value: unknown
  onChange: (value: unknown) => void
  disabled?: boolean
  invalid?: boolean
}) {
  const text = value == null ? "" : String(value)

  // Social attributes are `text` on the wire — the backend cannot type them as
  // `domain` without normalising the profile path away — so the slug, not the
  // type, is what earns them URL treatment. Checked before the switch, matching
  // the precedence in `getAttributeIcon` and `RecordValueDisplay`.
  const socialPlatform = socialPlatformFor(attribute.slug)
  if (socialPlatform) {
    return (
      <Input
        id={id}
        type="url"
        value={text}
        onChange={(e) => onChange(e.target.value || null)}
        placeholder={socialPlatform.placeholder}
        disabled={disabled}
        aria-invalid={invalid}
      />
    )
  }

  switch (attribute.type) {
    case "image":
      return <Input id={id} type="file" accept="image/jpeg,image/png,image/webp" disabled={disabled} onChange={(event) => onChange(event.target.files?.[0] ?? null)} />
    case "checkbox":
      return (
        <Checkbox
          id={id}
          checked={value === true}
          onCheckedChange={(checked) => onChange(checked === true)}
          disabled={disabled}
        />
      )

    case "select":
    case "status":
      return (
        <StatusSelectInput
          id={id}
          attribute={attribute}
          value={value}
          onChange={onChange}
          disabled={disabled}
          invalid={invalid}
        />
      )

    case "phone-number":
      return (
        <PhoneInput
          id={id}
          value={text}
          onChange={(next) => onChange(next || null)}
        />
      )

    case "number":
    case "currency":
    case "rating":
      return (
        <Input
          id={id}
          type="number"
          step={
            attribute.type === "currency" &&
            Number.isInteger(attribute.config?.currency_decimal_places)
              ? 1 / 10 ** Number(attribute.config?.currency_decimal_places)
              : undefined
          }
          value={text}
          onChange={(e) =>
            onChange(e.target.value === "" ? null : Number(e.target.value))
          }
          disabled={disabled}
        />
      )

    case "date":
      return (
        <DateSelectorInput
          id={id}
          attribute={attribute}
          value={value}
          onChange={onChange}
          disabled={disabled}
          invalid={invalid}
        />
      )

    case "timestamp":
    case "interaction":
      return (
        <Input
          id={id}
          type="datetime-local"
          value={text}
          onChange={(e) => onChange(e.target.value || null)}
          disabled={disabled}
        />
      )

    case "email-address":
      return (
        <Input
          id={id}
          type="email"
          value={text}
          onChange={(e) => onChange(e.target.value || null)}
          placeholder="name@example.com"
          disabled={disabled}
        />
      )

    case "domain":
      return (
        <DomainInput
          id={id}
          value={value}
          onChange={onChange}
          disabled={disabled}
          invalid={invalid}
          multiple={attribute.isMultiselect}
        />
      )

    case "location":
      return (
        <LocationInput
          id={id}
          value={value}
          onChange={onChange}
          disabled={disabled}
          invalid={invalid}
        />
      )

    case "tags":
      return (
        <TagInput
          id={id}
          value={value}
          onChange={onChange}
          disabled={disabled}
          invalid={invalid}
          multiple={attribute.isMultiselect}
        />
      )

    // record-reference and actor-reference need a picker that Phase C brings
    // with the records table; until then they render read-only rather than
    // pretending to be editable text.
    case "record-reference":
    case "actor-reference":
      return (
        <Input
          id={id}
          value={text}
          readOnly
          disabled
          placeholder="Not editable yet"
        />
      )

    default:
      return (
        <Input
          id={id}
          value={text}
          onChange={(e) => onChange(e.target.value || null)}
          disabled={disabled}
        />
      )
  }
}
