"use client"

import * as React from "react"
import {
  CoinsIcon,
  ZapIcon,
  UsersIcon,
  BotIcon,
  DollarSignIcon,
} from "@/components/ui/icons"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { TypographyH1, TypographyLead } from "@/components/ui/typography"
import { KpiCard } from "@/components/analytics/kpi-card"
import { CreditsSection } from "@/components/analytics/credits-section"
import { ActivitySection } from "@/components/analytics/activity-section"
import { CustomersSection } from "@/components/analytics/customers-section"
import { AgentsSection } from "@/components/analytics/agents-section"
import { FinanceSection } from "@/components/analytics/finance-section"
import { computeKpis, type Range } from "@/components/analytics/mock-data"

// ─── Range selector ───────────────────────────────────────────────────────────
const RANGES: { label: string; value: Range }[] = [
  { label: "7d", value: 7 },
  { label: "30d", value: 30 },
  { label: "90d", value: 90 },
]

function compact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

// ─── Component ────────────────────────────────────────────────────────────────
export function DashboardView() {
  const [range, setRange] = React.useState<Range>(30)
  const kpis = React.useMemo(() => computeKpis(range), [range])

  return (
    <div className="flex flex-1 flex-col overflow-auto bg-background scrollbar-thin">
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 lg:px-6">
        {/* ── Page header ───────────────────────────────────────────────── */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1">
            <TypographyH1 className="text-foreground">
              Dashboard
            </TypographyH1>
            <TypographyLead>
              Platform overview across AI usage, activity, customers, agents,
              and finance.
            </TypographyLead>
          </div>

          {/* Date range selector */}
          <div
            role="group"
            aria-label="Date range"
            className="flex items-center gap-1 rounded-lg border border-border bg-card p-1 self-start"
          >
            {RANGES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRange(r.value)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  range === r.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-pressed={range === r.value}
              >
                {r.label}
              </button>
            ))}
          </div>
        </header>

        {/* ── Global KPI strip ──────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <KpiCard
            label="Credits used"
            value={compact(kpis.totalCredits)}
            trend={kpis.creditsTrend}
            icon={CoinsIcon}
          />
          <KpiCard
            label="API requests"
            value={compact(kpis.totalRequests)}
            trend={kpis.requestsTrend}
            icon={ZapIcon}
          />
          <KpiCard
            label="New customers"
            value={String(kpis.newCustomers)}
            trend={kpis.customersTrend}
            icon={UsersIcon}
          />
          <KpiCard
            label="Avg active agents"
            value={String(kpis.avgAgents)}
            icon={BotIcon}
            description="agents per day"
          />
          <KpiCard
            label="USD balance"
            value={`$${compact(kpis.usdBalance)}`}
            icon={DollarSignIcon}
            description="current balance"
          />
        </div>

        <Separator />

        {/* ── Domain sections ───────────────────────────────────────────── */}
        <CreditsSection range={range} />
        <Separator />
        <ActivitySection range={range} />
        <Separator />
        <CustomersSection range={range} />
        <Separator />
        <AgentsSection range={range} />
        <Separator />
        <FinanceSection range={range} />
      </div>
    </div>
  )
}
