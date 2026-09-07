import type { CurrencySettings } from "@/components/settings/currency-api"

export function formatCurrencyNumber(
  amount: string | number,
  settings: CurrencySettings | null
): string {
  const value = Number(amount)
  if (!Number.isFinite(value)) return String(amount)

  const decimals = settings?.decimals ?? 2
  const decimalSeparator = settings?.decimal_separator ?? "."
  const thousandsSeparator = settings?.thousands_separator ?? ","
  const [whole = "0", fraction = ""] = Math.abs(value)
    .toFixed(decimals)
    .split(".")
  const groupedWhole = whole.replace(
    /\B(?=(\d{3})+(?!\d))/g,
    thousandsSeparator
  )
  const formatted =
    decimals === 0
      ? groupedWhole
      : `${groupedWhole}${decimalSeparator}${fraction}`

  return value < 0 ? `-${formatted}` : formatted
}

export function formatCurrencyAmount(
  amount: string | number,
  currencyCode: string | null | undefined,
  settings: CurrencySettings | null
): string {
  const formatted = formatCurrencyNumber(amount, settings)
  const code = currencyCode?.toUpperCase()
  const usesConfiguredSymbol =
    Boolean(settings?.symbol) &&
    Boolean(settings?.code) &&
    settings?.code?.toUpperCase() === code

  if (!usesConfiguredSymbol) return code ? `${formatted} ${code}` : formatted

  return settings?.position === "after"
    ? `${formatted}${settings.symbol}`
    : `${settings?.symbol}${formatted}`
}
