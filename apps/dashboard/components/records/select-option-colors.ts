import type { CSSProperties } from "react"

/**
 * How a select/status option's colour is applied to its pill.
 *
 * `SelectOption.color` is free-form on the backend and in practice holds a hex
 * value (`#3b82f6`), so the tint can't be a Tailwind class — those have to
 * exist at build time. Hex colours become inline styles instead: the colour
 * itself for text and border, and a heavily-diluted version for the fill, which
 * keeps the pill readable in both light and dark themes.
 *
 * Named colours from `config('crm.object_icon_colors')` are still understood,
 * so options seeded with a name rather than a hex don't fall back to grey.
 *
 * Kept in its own module so the record grid and the record detail page can't
 * drift apart on what a given option looks like.
 */
const NAMED_COLORS: Record<string, string> = {
  blue: "#3b82f6",
  indigo: "#6366f1",
  purple: "#a855f7",
  pink: "#ec4899",
  red: "#ef4444",
  orange: "#f97316",
  amber: "#f59e0b",
  green: "#22c55e",
  teal: "#14b8a6",
  cyan: "#06b6d4",
  slate: "#64748b",
}

/** Neutral chip for options with no colour, or a colour we can't parse. */
const FALLBACK_CLASSES =
  "border-border bg-muted text-muted-foreground dark:bg-input/30"

/** `#rgb` and `#rrggbb` to `r g b` channels, or null if it isn't a hex colour. */
function parseHex(value: string): string | null {
  const hex = value.trim().replace(/^#/, "")

  const expanded =
    hex.length === 3
      ? hex
          .split("")
          .map((char) => char + char)
          .join("")
      : hex

  if (!/^[0-9a-f]{6}$/i.test(expanded)) return null

  const int = Number.parseInt(expanded, 16)
  return `${(int >> 16) & 255} ${(int >> 8) & 255} ${int & 255}`
}

export interface SelectOptionStyle {
  className: string
  style?: CSSProperties
}

/**
 * Presentation for one option pill. Pair with `<Badge variant="outline">` so
 * the returned colour overrides the badge's own neutral surface.
 */
export function selectOptionBadgeStyle(
  color: string | null | undefined
): SelectOptionStyle {
  if (!color) return { className: FALLBACK_CLASSES }

  const channels = parseHex(NAMED_COLORS[color] ?? color)
  if (!channels) return { className: FALLBACK_CLASSES }

  return {
    className: "",
    style: {
      color: `rgb(${channels})`,
      backgroundColor: `rgb(${channels} / 0.14)`,
      borderColor: `rgb(${channels} / 0.4)`,
    },
  }
}

/**
 * Solid colour value for dot indicators, icons, or prominent accents.
 */
export function getSelectOptionSolidColor(
  color: string | null | undefined
): string | null {
  if (!color) return null
  const named = NAMED_COLORS[color]
  if (named) return named
  const channels = parseHex(color)
  if (channels) return `rgb(${channels})`
  return null
}
