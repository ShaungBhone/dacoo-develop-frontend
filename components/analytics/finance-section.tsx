"use client"

import * as React from "react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"
import { DollarSignIcon, ArrowRightLeftIcon } from "@/components/ui/icons"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { KpiCard } from "@/components/analytics/kpi-card"
import {
  FINANCE_90,
  sliceDays,
  computeKpis,
  type Range,
} from "@/components/analytics/mock-data"

// ─── Chart configs ────────────────────────────────────────────────────────────
const balanceConfig: ChartConfig = {
  usd: { label: "USD", color: "var(--color-primary)" },
  eur: { label: "EUR", color: "var(--color-chart-1)" },
}

const txConfig: ChartConfig = {
  txVolume: { label: "Transactions", color: "var(--color-chart-3)" },
}

// ─── Formatters ───────────────────────────────────────────────────────────────
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })
}

function compact(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

// ─── Component ────────────────────────────────────────────────────────────────
interface FinanceSectionProps {
  range: Range
}

export function FinanceSection({ range }: FinanceSectionProps) {
  const data = sliceDays(FINANCE_90, range)
  const kpis = computeKpis(range)
  const tickInterval = Math.max(0, Math.floor(data.length / 6) - 1)

  const totalTx = data.reduce((s, d) => s + d.txVolume, 0)
  const latestEur = data[data.length - 1]?.eur ?? 0

  return (
    <section aria-labelledby="finance-heading" className="flex flex-col gap-4">
      <div>
        <h2
          id="finance-heading"
          className="text-sm font-semibold text-foreground"
        >
          Finance &amp; Wallets
        </h2>
        <p className="text-xs text-muted-foreground">
          Wallet balances over time and daily transaction volume.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Balance line chart */}
        <Card className="col-span-1 border border-border shadow-none ring-0 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Wallet balances
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <ChartContainer config={balanceConfig} className="h-52 w-full">
              <LineChart
                data={data}
                margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="3 3"
                  className="stroke-border/50"
                />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={fmtDate}
                  interval={tickInterval}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `$${compact(v)}`}
                  tick={{ fontSize: 11 }}
                  width={44}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(l) => fmtDate(String(l))}
                      indicator="line"
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Line
                  type="monotone"
                  dataKey="usd"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="eur"
                  stroke="var(--color-chart-1)"
                  strokeWidth={2}
                  dot={false}
                  strokeDasharray="4 2"
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Transaction bar chart + KPIs */}
        <Card className="border border-border shadow-none ring-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Transaction volume
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 pb-4">
            <ChartContainer config={txConfig} className="h-32 w-full">
              <BarChart
                data={data}
                margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                barSize={range === 7 ? 24 : range === 30 ? 8 : 4}
              >
                <XAxis dataKey="date" hide />
                <YAxis hide />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(l) => fmtDate(String(l))}
                      hideLabel={false}
                      indicator="dot"
                    />
                  }
                />
                <Bar
                  dataKey="txVolume"
                  fill="var(--color-chart-3)"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ChartContainer>

            {/* KPI strip */}
            <div className="grid grid-cols-2 gap-2 border-t border-border pt-4">
              <KpiCard
                label="USD balance"
                value={`$${compact(kpis.usdBalance)}`}
                icon={DollarSignIcon}
                description="current balance"
                className="rounded-xl"
              />
              <KpiCard
                label="EUR balance"
                value={`€${compact(latestEur)}`}
                icon={DollarSignIcon}
                description="current balance"
                className="rounded-xl"
              />
            </div>
            <KpiCard
              label="Total transactions"
              value={String(totalTx)}
              icon={ArrowRightLeftIcon}
              description={`across ${range} days`}
            />
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
