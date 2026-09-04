import { apiFetch } from "@/lib/api"

export type CurrencyPosition = "before" | "after"

export type CurrencySettings = {
  code: string | null
  symbol: string
  position: CurrencyPosition
  decimals: number
  decimal_separator: string
  thousands_separator: string | null
}

export type Currency = {
  id: number
  code: string
  name: string
  symbol: string
  symbol_native: string
  symbol_first: boolean
  precision: number
  decimal_mark: string
  thousands_separator: string | null
}

export const SUPPORTED_CURRENCY_CODES = new Set([
  "BND",
  "EUR",
  "IDR",
  "KHR",
  "LAK",
  "MMK",
  "MYR",
  "PHP",
  "SGD",
  "THB",
  "USD",
  "VND",
])

export async function fetchCurrencies(): Promise<Currency[]> {
  const res = await apiFetch<{ data: Currency[] }>("/api/v1/currencies")
  return res.data
}

export async function fetchCurrencySettings(
  organizationId: number
): Promise<CurrencySettings> {
  const res = await apiFetch<{ data: CurrencySettings }>(
    `/api/v1/organizations/${organizationId}/currency-settings`
  )
  return res.data
}

export async function updateCurrencySettings(
  organizationId: number,
  payload: CurrencySettings
): Promise<CurrencySettings> {
  const res = await apiFetch<{ data: CurrencySettings }>(
    `/api/v1/organizations/${organizationId}/currency-settings`,
    { method: "PUT", body: payload }
  )
  return res.data
}

export async function resetCurrencySettings(
  organizationId: number
): Promise<CurrencySettings> {
  const res = await apiFetch<{ data: CurrencySettings }>(
    `/api/v1/organizations/${organizationId}/currency-settings`,
    { method: "DELETE" }
  )
  return res.data
}
