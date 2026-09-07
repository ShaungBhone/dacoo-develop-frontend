"use client"

import * as React from "react"
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { UsersIcon, UserMinusIcon } from "@/components/ui/icons"

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
  CUSTOMERS_90,
  CUSTOMER_STATUS,
  sliceDays,
  computeKpis,
  type Range,
} from "@/components/analytics/mock-data"

// ─── Chart configs ────────────────────────────────────────────────────────────
const composedConfig: ChartConfig = {
  newCustomers: { label: "New", color: "var(--color-chart-1)" },
  churned: { label: "Churned", color: "var(--color-destructive)" },
  cumActive: { label: "Total active", color: "var(--color-primary)" },
}

const STATUS_COLORS = [
  "var(--color-primary)",
  "var(--color-chart-1)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
]

const statusConfig: ChartConfig = Object.fromEntries(
  CUSTOMER_STATUS.map((s, i) => [
    s.status,
    { label: s.status, color: STATUS_COLORS[i] },
  ])
)

// ─── Formatters ───────────────────────────────────────────────────────────────
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })
}

// ─── Component ────────────────────────────────────────────────────────────────
interface CustomersSectionProps {
  range: Range
}

export function CustomersSection({ range }: CustomersSectionProps) {
  const data = sliceDays(CUSTOMERS_90, range)
  const kpis = computeKpis(range)
  const tickInterval = Math.max(0, Math.floor(data.length / 6) - 1)

  const totalStatusCount = CUSTOMER_STATUS.reduce((s, d) => s + d.value, 0)

  return (
    <section
      aria-labelledby="customers-heading"
      className="flex flex-col gap-4"
    >
      <div>
        <h2
          id="customers-heading"
          className="text-sm font-semibold text-foreground"
        >
          Customers
        </h2>
        <p className="text-xs text-muted-foreground">
          New signups, churn, and cumulative active customer base.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Composed chart — bars for new/churned, line for cumulative */}
        <Card className="col-span-1 border border-border shadow-none ring-0 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Acquisition &amp; churn
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <ChartContainer config={composedConfig} className="h-52 w-full">
              <ComposedChart
                data={data}
                margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
                barSize={range === 7 ? 26 : range === 30 ? 9 : 4}
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
                  yAxisId="left"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                  width={30}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                  width={40}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(l) => fmtDate(String(l))}
                      indicator="dot"
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar
                  yAxisId="left"
                  dataKey="newCustomers"
                  fill="var(--color-chart-1)"
                  radius={[2, 2, 0, 0]}
                />
                <Bar
                  yAxisId="left"
                  dataKey="churned"
                  fill="var(--color-destructive)"
                  radius={[2, 2, 0, 0]}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="cumActive"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Lifecycle donut + KPI strip */}
        <Card className="border border-border shadow-none ring-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Lifecycle breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 pb-4">
            <ChartContainer
              config={statusConfig}
              className="mx-auto h-36 w-full max-w-[180px]"
            >
              <PieChart>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      nameKey="status"
                      hideLabel
                      indicator="dot"
                    />
                  }
                />
                <Pie
                  data={CUSTOMER_STATUS}
                  dataKey="value"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius="54%"
                  outerRadius="78%"
                  paddingAngle={2}
                >
                  {CUSTOMER_STATUS.map((_, i) => (
                    <Cell key={i} fill={STATUS_COLORS[i]} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>

            {/* Legend */}
            <ul className="flex flex-col gap-2">
              {CUSTOMER_STATUS.map((s, i) => (
                <li
                  key={s.status}
                  className="flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ background: STATUS_COLORS[i] }}
                    />
                    <span className="text-muted-foreground">{s.status}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="font-medium tabular-nums">{s.value}</span>
                    <span className="text-muted-foreground">
                      ({Math.round((s.value / totalStatusCount) * 100)}%)
                    </span>
                  </div>
                </li>
              ))}
            </ul>

            {/* KPI strip */}
            <div className="grid grid-cols-2 gap-2 border-t border-border pt-4">
              <KpiCard
                label="New signups"
                value={String(kpis.newCustomers)}
                trend={kpis.customersTrend}
                icon={UsersIcon}
                className="rounded-xl"
              />
              <KpiCard
                label="Total active"
                value={String(
                  data[data.length - 1]?.cumActive ?? 0
                )}
                icon={UserMinusIcon}
                description="end of period"
                className="rounded-xl"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
