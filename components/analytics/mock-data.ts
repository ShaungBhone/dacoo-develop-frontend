// Analytics mock data — 90 daily data points for each domain.
// Generated deterministically via a seeded XORshift32 PRNG so values are
// stable across renders.

export type Range = 7 | 30 | 90

// ─── Seeded PRNG ──────────────────────────────────────────────────────────────
function makeRng(seed: number) {
  let x = seed >>> 0
  return () => {
    x ^= x << 13
    x ^= x >> 17
    x ^= x << 5
    return (x >>> 0) / 4294967295
  }
}

// ─── Date helpers ─────────────────────────────────────────────────────────────
const TODAY = new Date("2026-07-17")

function isoDate(daysAgo: number): string {
  const d = new Date(TODAY)
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().slice(0, 10)
}

const DATES_90 = Array.from({ length: 90 }, (_, i) => isoDate(89 - i))

function weekdayFactor(date: string): number {
  const day = new Date(date).getDay()
  return day === 0 || day === 6 ? 0.45 : 1
}

// ─── AI Credits ───────────────────────────────────────────────────────────────
export interface CreditsDay {
  date: string
  credits: number
  requests: number
}

const rngCredits = makeRng(42)
export const CREDITS_90: CreditsDay[] = DATES_90.map((date, i) => {
  const trend = 0.8 + (i / 89) * 0.55
  const wf = weekdayFactor(date)
  return {
    date,
    credits: Math.round((600 + rngCredits() * 1200) * trend * wf),
    requests: Math.round((30 + rngCredits() * 180) * trend * wf),
  }
})

export interface ModelSplit {
  model: string
  credits: number
}

export const MODEL_SPLIT: ModelSplit[] = [
  { model: "gpt-4o", credits: 41200 },
  { model: "claude-3-5-sonnet", credits: 28700 },
  { model: "llama-3-70b", credits: 17400 },
  { model: "gemini-pro", credits: 8900 },
]

// ─── Activity ─────────────────────────────────────────────────────────────────
export interface ActivityDay {
  date: string
  success: number
  warning: number
  error: number
  latencyMs: number
  faithfulness: number
}

const rngActivity = makeRng(99)
export const ACTIVITY_90: ActivityDay[] = DATES_90.map((date, i) => {
  const trend = 0.85 + (i / 89) * 0.4
  const wf = weekdayFactor(date)
  const total = Math.round((60 + rngActivity() * 220) * trend * wf)
  const sr = 0.85 + rngActivity() * 0.1
  const wr = 0.035 + rngActivity() * 0.055
  const success = Math.round(total * sr)
  const warning = Math.round(total * wr)
  const error = Math.max(0, total - success - warning)
  return {
    date,
    success,
    warning,
    error,
    latencyMs: Math.round(180 + rngActivity() * 620),
    faithfulness: parseFloat((0.74 + rngActivity() * 0.22).toFixed(2)),
  }
})

// ─── Customers ────────────────────────────────────────────────────────────────
export interface CustomerDay {
  date: string
  newCustomers: number
  churned: number
  cumActive: number
}

const rngCustomers = makeRng(77)
export const CUSTOMERS_90: CustomerDay[] = (() => {
  let cum = 148
  return DATES_90.map((date) => {
    const wf = weekdayFactor(date)
    const newCustomers = Math.round((2 + rngCustomers() * 14) * wf)
    const churned = Math.round(rngCustomers() * 2 * wf)
    cum = cum + newCustomers - churned
    return { date, newCustomers, churned, cumActive: cum }
  })
})()

export interface CustomerStatus {
  status: string
  value: number
}

export const CUSTOMER_STATUS: CustomerStatus[] = [
  { status: "Active", value: 314 },
  { status: "Lead", value: 147 },
  { status: "Churned", value: 49 },
  { status: "Inactive", value: 36 },
]

// ─── Agents ───────────────────────────────────────────────────────────────────
export interface AgentDay {
  date: string
  messages: number
  activeAgents: number
  avgResponseMs: number
}

const rngAgents = makeRng(31)
export const AGENTS_90: AgentDay[] = DATES_90.map((date, i) => {
  const trend = 0.88 + (i / 89) * 0.35
  const wf = weekdayFactor(date)
  return {
    date,
    messages: Math.round((100 + rngAgents() * 600) * trend * wf),
    activeAgents: Math.round(7 + rngAgents() * 8),
    avgResponseMs: Math.round(110 + rngAgents() * 420),
  }
})

// ─── Finance ──────────────────────────────────────────────────────────────────
export interface FinanceDay {
  date: string
  usd: number
  eur: number
  txVolume: number
}

const rngFinance = makeRng(13)
export const FINANCE_90: FinanceDay[] = (() => {
  let usd = 5000
  let eur = 2100
  return DATES_90.map((date) => {
    const wf = weekdayFactor(date)
    usd = Math.round(usd - rngFinance() * 28 * wf)
    eur = Math.round(eur - rngFinance() * 14 * wf)
    return {
      date,
      usd: Math.max(0, usd),
      eur: Math.max(0, eur),
      txVolume: Math.round((5 + rngFinance() * 40) * wf),
    }
  })
})()

// ─── Slice helper ─────────────────────────────────────────────────────────────
export function sliceDays<T>(data: T[], range: Range): T[] {
  return data.slice(-range)
}

function sum(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0)
}

// ─── Summary KPIs ─────────────────────────────────────────────────────────────
export interface DashboardKpis {
  totalCredits: number
  totalRequests: number
  newCustomers: number
  avgAgents: number
  usdBalance: number
  avgFaithfulness: number
  totalActivityReqs: number
  avgLatencyMs: number
  creditsTrend: number
  requestsTrend: number
  customersTrend: number
}

export function computeKpis(range: Range): DashboardKpis {
  const credits = sliceDays(CREDITS_90, range)
  const activity = sliceDays(ACTIVITY_90, range)
  const customers = sliceDays(CUSTOMERS_90, range)
  const agents = sliceDays(AGENTS_90, range)
  const finance = sliceDays(FINANCE_90, range)

  const totalCredits = sum(credits.map((d) => d.credits))
  const totalRequests = sum(credits.map((d) => d.requests))
  const newCustomers = sum(customers.map((d) => d.newCustomers))
  const avgAgents = Math.round(
    sum(agents.map((d) => d.activeAgents)) / agents.length
  )
  const usdBalance = finance[finance.length - 1]?.usd ?? 0
  const avgFaithfulness = parseFloat(
    (sum(activity.map((d) => d.faithfulness)) / activity.length).toFixed(2)
  )
  const totalActivityReqs = sum(
    activity.map((d) => d.success + d.warning + d.error)
  )
  const avgLatencyMs = Math.round(
    sum(activity.map((d) => d.latencyMs)) / activity.length
  )

  // Trends vs the prior period of the same length
  const prevLen = Math.min(range, CREDITS_90.length - range)
  const prevCreditsSlice = CREDITS_90.slice(
    CREDITS_90.length - range - prevLen,
    CREDITS_90.length - range
  )
  const prevCustSlice = CUSTOMERS_90.slice(
    CUSTOMERS_90.length - range - prevLen,
    CUSTOMERS_90.length - range
  )

  const prevTotalCredits = sum(prevCreditsSlice.map((d) => d.credits))
  const prevTotalReqs = sum(prevCreditsSlice.map((d) => d.requests))
  const prevNewCust = sum(prevCustSlice.map((d) => d.newCustomers))

  const pct = (curr: number, prev: number) =>
    prev > 0 ? Math.round(((curr - prev) / prev) * 100) : 0

  return {
    totalCredits,
    totalRequests,
    newCustomers,
    avgAgents,
    usdBalance,
    avgFaithfulness,
    totalActivityReqs,
    avgLatencyMs,
    creditsTrend: pct(totalCredits, prevTotalCredits),
    requestsTrend: pct(totalRequests, prevTotalReqs),
    customersTrend: pct(newCustomers, prevNewCust),
  }
}
