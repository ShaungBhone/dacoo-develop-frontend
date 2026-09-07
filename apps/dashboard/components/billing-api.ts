import { apiFetch, apiDownload } from "@/lib/api"

export type PlanInterval = "monthly" | "yearly"

/** Currencies the backend computes plan pricing in — see PlanPricingService. */
export type PlanCurrency = "USD" | "MMK"

export type Plan = {
  id: number
  name: string
  slug: string
  price: number
  currency: "USD"
  /** USD in cents, MMK in whole kyat (no meaningful subunit in everyday use). */
  prices: Record<PlanCurrency, number>
  interval: PlanInterval
  features: string[]
  limits: Record<string, number>
  is_active: boolean
}

export type SubscriptionStatus = "active" | "cancelled" | "expired"

export type Subscription = {
  id: number
  organization_id: number
  plan: Plan
  status: SubscriptionStatus
  starts_at: string | null
  ends_at: string | null
  cancelled_at: string | null
}

/**
 * Human-readable data-retention window for a plan, or null when the plan does
 * not define one. A value <= 0 (e.g. -1) means data is kept indefinitely.
 */
export function formatRetention(plan: Plan): string | null {
  const days = plan.limits?.retention_days
  if (days === undefined) return null
  if (days <= 0) return "Unlimited data retention"
  return `${days.toLocaleString()}-day data retention`
}

export async function fetchPlans(): Promise<Plan[]> {
  const res = await apiFetch<{ data: Plan[] }>("/api/v1/plans")
  return res.data
}

export async function fetchSubscription(
  organizationId: number
): Promise<Subscription> {
  const res = await apiFetch<{ data: Subscription }>(
    `/api/v1/organizations/${organizationId}/subscription`
  )
  return res.data
}

export async function changePlan(
  organizationId: number,
  planId: number
): Promise<Subscription> {
  const res = await apiFetch<{ data: Subscription }>(
    `/api/v1/organizations/${organizationId}/subscription`,
    { method: "PATCH", body: { plan_id: planId } }
  )
  return res.data
}

export const CREDIT_CURRENCY = "CREDIT"

export type Wallet = {
  id: string
  organization_id: number
  currency_code: string
  balance: string
  formatted_balance: string | null
  low_balance: boolean | null
  created_at: string
  updated_at: string
}

export type WalletTransaction = {
  id: number
  wallet_id: number
  type: "debit" | "credit"
  amount: string
  balance_after: string
  currency_exchange_id: string | null
  wallet_transfer_id: string | null
  description: string | null
  model: string | null
  created_at: string
}

export type FxQuote = {
  base: string
  quote: string
  rate: string
  source: string
}

export type ModelUsage = {
  model: string
  credits_used: number
  requests: number
}

export async function fetchWallets(organizationId: number): Promise<Wallet[]> {
  const res = await apiFetch<{ data: Wallet[] }>(
    `/api/v1/organizations/${organizationId}/wallets`
  )
  return res.data
}

export async function fetchFxRate(
  base: string,
  quote: string
): Promise<FxQuote> {
  const res = await apiFetch<{ data: FxQuote }>(
    `/api/v1/fx-rates/${base}/${quote}`
  )
  return res.data
}

export async function fetchWalletTransactions(
  organizationId: number,
  walletId: string
): Promise<WalletTransaction[]> {
  const res = await apiFetch<{ data: WalletTransaction[] }>(
    `/api/v1/organizations/${organizationId}/wallets/${walletId}/transactions`
  )
  return res.data
}

export async function fetchUsageByModel(
  organizationId: number,
  walletId: string,
  period: "month" | "all" = "month"
): Promise<ModelUsage[]> {
  const res = await apiFetch<{ data: ModelUsage[] }>(
    `/api/v1/organizations/${organizationId}/wallets/${walletId}/usage-by-model?period=${period}`
  )
  return res.data
}

export type AiCreditSummary = {
  credits: {
    unlimited: boolean
    allotted: number | null
    consumed: number | null
    remaining: number | null
    period_start: string | null
    period_end: string | null
  }
  storage: {
    used_bytes: number
    limit_bytes: number | null
    unlimited: boolean
  }
}

/**
 * This month's AI credit allowance (allotted / consumed / remaining) plus
 * storage usage against the plan's storage_gb limit — the hybrid billing model.
 */
export async function fetchAiCreditSummary(
  organizationId: number
): Promise<AiCreditSummary> {
  const res = await apiFetch<{ data: AiCreditSummary }>(
    `/api/v1/organizations/${organizationId}/ai-credits`
  )
  return res.data
}

export async function openWallet(
  organizationId: number,
  currencyCode: string
): Promise<Wallet> {
  const res = await apiFetch<{ data: Wallet }>(
    `/api/v1/organizations/${organizationId}/wallets`,
    { method: "POST", body: { currency_code: currencyCode } }
  )
  return res.data
}

export type CurrencyExchange = {
  id: string
  organization_id: number
  from_wallet: { id: string; currency_code: string }
  to_wallet: { id: string; currency_code: string }
  from_amount: string
  to_amount: string
  rate: string
  rate_source: string
  executed_by: number
  created_at: string
}

export async function executeExchange(
  organizationId: number,
  fromCurrency: string,
  toCurrency: string,
  amount: string
): Promise<CurrencyExchange> {
  const res = await apiFetch<{ data: CurrencyExchange }>(
    `/api/v1/organizations/${organizationId}/exchanges`,
    {
      method: "POST",
      body: { from_currency: fromCurrency, to_currency: toCurrency, amount },
    }
  )
  return res.data
}
