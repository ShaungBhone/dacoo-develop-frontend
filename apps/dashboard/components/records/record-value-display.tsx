"use client"

import * as React from "react"
import { CheckIcon, MinusIcon } from "@/components/ui/icons"

import { cn } from "@/lib/utils"
import type { Attribute } from "@/components/records/api"
import { formatLocationLabel } from "@/components/records/location-value"
import { selectOptionBadgeStyle } from "@/components/records/select-option-colors"
import {
  socialHandle,
  socialHref,
  socialPlatformFor,
} from "@/components/records/social-attributes"
import { Badge } from "@/components/reui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useCurrencySettings } from "@/contexts/currency-settings-context"
import { formatCurrencyAttribute } from "@/components/records/currency-attribute"

/** How many chips to show before collapsing the rest into a "+N" pill. */
const CHIP_LIMIT = 3

function initialsFrom(value: string) {
  return (
    value
      .split(/[\s@._-]+/)
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  )
}

/** Coerce a value into the list form multiselect attributes use. */
function toList(value: unknown): unknown[] {
  if (value == null || value === "") return []
  return Array.isArray(value)
    ? value.filter((entry) => entry != null && entry !== "")
    : [value]
}

/**
 * An actor chip — avatar plus label in a pill, following the ReUI `c-avatar-26`
 * pattern. Rendered as a span rather than a button: there is no actor picker
 * yet, so it must not look pressable.
 */
function ActorChip({ value }: { value: string }) {
  return (
    <span className="inline-flex h-6 max-w-full items-center gap-1 rounded-full border border-border bg-background py-0.5 pr-2 pl-0.5 dark:bg-input/30">
      <Avatar className="size-5 shrink-0">
        <AvatarImage src="" alt="" />
        <AvatarFallback className="text-[0.6rem]">
          {initialsFrom(value)}
        </AvatarFallback>
      </Avatar>
      <span className="truncate text-xs text-foreground">{value}</span>
    </span>
  )
}

/**
 * Read-mode rendering of one attribute value, chosen from the attribute's type.
 *
 * Mirrors the write-mode `AttributeInput` in `custom-fields.tsx` — every type
 * that has an input has a display here, so a field never falls back to raw JSON.
 *
 * The one branch that is keyed on slug rather than type is the social block;
 * see `social-attributes.ts` for why those cannot be typed as `domain`.
 */
export function RecordValueDisplay({
  attribute,
  value,
  className,
}: {
  attribute: Attribute
  value: unknown
  className?: string
}) {
  const { settings: currencySettings } = useCurrencySettings()
  const entries = toList(value)

  if (entries.length === 0) {
    return (
      <span className={cn("text-sm text-muted-foreground/60", className)}>
        Set {attribute.title.toLowerCase()}
      </span>
    )
  }

  // Social attributes are `text`-typed, so the slug — not the type — is what
  // earns them link treatment. Matched before the switch, mirroring the same
  // precedence in `getAttributeIcon` so the icon and the value agree.
  const socialPlatform = socialPlatformFor(attribute.slug)
  if (socialPlatform) {
    const raw = String(entries[0])
    return (
      <a
        href={socialHref(raw)}
        target="_blank"
        rel="noreferrer noopener"
        title={raw}
        className={cn(
          "truncate text-sm text-primary underline underline-offset-2 hover:text-primary/80",
          className
        )}
      >
        {socialHandle(raw, socialPlatform)}
      </a>
    )
  }

  switch (attribute.type) {
    case "image": {
      const image = entries[0]
      const url = typeof image === "object" && image !== null && "url" in image && typeof image.url === "string" ? image.url : null
      return url ? <img src={url} alt="" className="size-6 rounded object-cover" /> : null
    }
    case "currency":
      return (
        <span className={cn("truncate text-sm text-foreground", className)}>
          {formatCurrencyAttribute(
            entries[0] as string | number,
            attribute,
            currencySettings
          )}
        </span>
      )

    case "checkbox":
      return (
        <span className={cn("inline-flex items-center text-sm", className)}>
          {value === true ? (
            <CheckIcon className="size-4 text-success" aria-label="Yes" />
          ) : (
            <MinusIcon
              className="size-4 text-muted-foreground"
              aria-label="No"
            />
          )}
        </span>
      )

    case "domain": {
      const href = String(entries[0])
      return (
        <a
          href={href.startsWith("http") ? href : `https://${href}`}
          target="_blank"
          rel="noreferrer noopener"
          className={cn(
            "truncate text-sm text-primary underline underline-offset-2 hover:text-primary/80",
            className
          )}
        >
          {href}
        </a>
      )
    }

    case "email-address":
      return (
        <a
          href={`mailto:${String(entries[0])}`}
          className={cn(
            "truncate text-sm text-primary underline underline-offset-2 hover:text-primary/80",
            className
          )}
        >
          {String(entries[0])}
        </a>
      )

    case "phone-number":
      return (
        <a
          href={`tel:${String(entries[0])}`}
          className={cn("truncate text-sm text-foreground", className)}
        >
          {String(entries[0])}
        </a>
      )

    case "location": {
      const label = formatLocationLabel(entries[0])
      return (
        <span className={cn("truncate text-sm text-foreground", className)}>
          {label ?? String(entries[0])}
        </span>
      )
    }

    case "actor-reference":
    case "record-reference": {
      const shown = entries.slice(0, CHIP_LIMIT)
      const overflow = entries.length - shown.length
      return (
        <span className={cn("flex flex-wrap items-center gap-1", className)}>
          {shown.map((entry, index) => (
            <ActorChip
              key={`${String(entry)}-${index}`}
              value={String(entry)}
            />
          ))}
          {overflow > 0 && (
            <Badge variant="outline" size="default" radius="full">
              +{overflow}
            </Badge>
          )}
        </span>
      )
    }

    case "select":
    case "status": {
      const shown = entries.slice(0, CHIP_LIMIT)
      const overflow = entries.length - shown.length
      return (
        <span className={cn("flex flex-wrap items-center gap-1", className)}>
          {shown.map((entry, index) => {
            const option = attribute.selectOptions?.find(
              (candidate) => candidate.slug === entry || candidate.id === entry
            )
            const tint = selectOptionBadgeStyle(option?.color)
            return (
              <Badge
                key={`${String(entry)}-${index}`}
                variant="outline"
                className={cn("max-w-[12rem] truncate", tint.className)}
                style={tint.style}
              >
                <span className="truncate">
                  {option?.title ?? String(entry)}
                </span>
              </Badge>
            )
          })}
          {overflow > 0 && <Badge variant="outline">+{overflow}</Badge>}
        </span>
      )
    }

    case "rating": {
      const rating = Number(entries[0])
      return (
        <span className={cn("text-sm text-foreground", className)}>
          {Number.isNaN(rating) ? String(entries[0]) : `${rating} / 5`}
        </span>
      )
    }

    case "timestamp":
    case "interaction": {
      const date = new Date(String(entries[0]))
      return (
        <span className={cn("text-sm text-foreground", className)}>
          {Number.isNaN(date.getTime())
            ? String(entries[0])
            : date.toLocaleString()}
        </span>
      )
    }

    case "date": {
      const date = new Date(String(entries[0]))
      return (
        <span className={cn("text-sm text-foreground", className)}>
          {Number.isNaN(date.getTime())
            ? String(entries[0])
            : date.toLocaleDateString()}
        </span>
      )
    }

    default:
      return (
        <span className={cn("truncate text-sm text-foreground", className)}>
          {entries.map((entry) => String(entry)).join(", ")}
        </span>
      )
  }
}
