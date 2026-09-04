import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const dateTimeFormat = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
})

const dateOnlyFormat = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
})

/** `YYYY-MM-DD` with no time component, as Laravel's `toDateString()` emits. */
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/

/**
 * Formats an ISO timestamp as a localized date (plus time when the value
 * actually carries one), or null if absent/invalid.
 *
 * Date-only input is deliberately handled apart from the general case. `new
 * Date("2026-08-20")` is parsed as UTC midnight, so rendering it with a time
 * would both invent a clock reading the API never sent and, west of UTC, show
 * the previous day. Formatting those in UTC keeps the calendar date intact.
 */
export function formatDateTime(value?: string | null): string | null {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  if (DATE_ONLY.test(value)) {
    return dateOnlyFormat.format(
      new Date(
        parsed.getUTCFullYear(),
        parsed.getUTCMonth(),
        parsed.getUTCDate()
      )
    )
  }
  return dateTimeFormat.format(parsed)
}

export function initials(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase()
}
