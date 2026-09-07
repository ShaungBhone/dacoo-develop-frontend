import type { Attribute } from "@/components/records/api"
import type { CurrencySettings } from "@/components/settings/currency-api"

type CurrencyDisplay = "code" | "symbol"
type CurrencyGrouping = "default" | "none"

function text(value: unknown): string | null {
  return typeof value === "string" && value !== "" ? value : null
}

/** Format a fixed-currency attribute, with workspace settings for legacy fields. */
export function formatCurrencyAttribute(
  amount: string | number,
  attribute: Attribute,
  fallback: CurrencySettings | null
): string {
  const number = Number(amount)
  if (!Number.isFinite(number)) return String(amount)

  const config = attribute.config ?? {}
  const configured = Boolean(text(config.currency_code))
  const decimals = Number.isInteger(config.currency_decimal_places)
    ? Number(config.currency_decimal_places)
    : (fallback?.decimals ?? 2)
  const decimalMark =
    text(config.currency_decimal_mark) ?? fallback?.decimal_separator ?? "."
  const grouping =
    (text(config.currency_grouping) as CurrencyGrouping | null) ?? "default"
  const thousands =
    grouping === "none"
      ? ""
      : (text(config.currency_thousands_separator) ??
        fallback?.thousands_separator ??
        ",")
  const [whole = "0", fraction = ""] = Math.abs(number)
    .toFixed(decimals)
    .split(".")
  const grouped = thousands
    ? whole.replace(/\B(?=(\d{3})+(?!\d))/g, thousands)
    : whole
  const unsigned =
    decimals === 0 ? grouped : `${grouped}${decimalMark}${fraction}`
  const formatted = number < 0 ? `-${unsigned}` : unsigned

  if (!configured) {
    const code = fallback?.code?.toUpperCase()
    if (!code || !fallback?.symbol)
      return code ? `${formatted} ${code}` : formatted
    return fallback.position === "after"
      ? `${formatted}${fallback.symbol}`
      : `${fallback.symbol}${formatted}`
  }

  const display =
    (text(config.currency_display) as CurrencyDisplay | null) ?? "symbol"
  const code = text(config.currency_code)?.toUpperCase()
  if (display === "code") return code ? `${formatted} ${code}` : formatted

  const symbol = text(config.currency_symbol)
  if (!symbol) return code ? `${formatted} ${code}` : formatted
  return config.currency_symbol_first === false
    ? `${formatted}${symbol}`
    : `${symbol}${formatted}`
}
