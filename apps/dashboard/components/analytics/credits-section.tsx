"use client"

import * as React from "react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { CoinsIcon, ZapIcon } from "@/components/ui/icons"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { KpiCard } from "@/components/analytics/kpi-card"
import {
  CREDITS_90,
  MODEL_SPLIT,
  sliceDays,
  computeKpis,
  type Range,
} from "@/components/analytics/mock-data"

// ─── Chart configs ────────────────────────────────────────────────────────────
const areaConfig: ChartConfig = {
  credits: { label: "Credits", color: "var(--color-primary)" },
  requests: { label: "Requests", color: "var(--color-chart-1)" },
}

const MODEL_COLORS = [
  "var(--color-primary)",
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
]

const donutConfig: ChartConfig = Object.fromEntries(
  MODEL_SPLIT.map((m, i) => [
    m.model,
    { label: m.model, color: MODEL_COLORS[i] },
  ])
)

// ─── Formatters ───────────────────────────────────────────────────────────────
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })
}

function compact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

// ─── Component ────────────────────────────────────────────────────────────────
interface CreditsSectionProps {
  range: Range
}

export function CreditsSection({ range }: CreditsSectionProps) {
  const data = sliceDays(CREDITS_90, range)
  const kpis = computeKpis(range)
  const tickInterval = Math.max(0, Math.floor(data.length / 6) - 1)

  return (
    <section aria-labelledby="credits-heading" className="flex flex-col gap-4">
      <div>
        <h2
          id="credits-heading"
          className="text-sm font-semibold text-foreground"
        >
          AI Credits &amp; Models
        </h2>
        <p className="text-xs text-muted-foreground">
          Daily credits consumed and distribution across models.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Area chart — spans 2 of 3 columns */}
        <Card className="col-span-1 border border-border shadow-none ring-0 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Daily usage</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <ChartContainer config={areaConfig} className="h-52 w-full">
              <AreaChart
                data={data}
                margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="gradCredits"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="var(--color-primary)"
                      stopOpacity={0.28}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-primary)"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                  <linearGradient
                    id="gradRequests"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="var(--color-chart-1)"
                      stopOpacity={0.2}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-chart-1)"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>
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
                  tickFormatter={compact}
                  tick={{ fontSize: 11 }}
                  width={36}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(l) => fmtDate(String(l))}
                      indicator="dot"
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="credits"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  fill="url(#gradCredits)"
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="requests"
                  stroke="var(--color-chart-1)"
                  strokeWidth={1.5}
                  fill="url(#gradRequests)"
                  dot={false}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Model donut + legend */}
        <Card className="border border-border shadow-none ring-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">By model</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 pb-4">
            <ChartContainer
              config={donutConfig}
              className="mx-auto h-36 w-full max-w-[180px]"
            >
              <PieChart>
                <ChartTooltip
                  content={
                    <ChartTooltipContent nameKey="model" hideLabel indicator="dot" />
                  }
                />
                <Pie
                  data={MODEL_SPLIT}
                  dataKey="credits"
                  nameKey="model"
                  cx="50%"
                  cy="50%"
                  innerRadius="54%"
                  outerRadius="78%"
                  paddingAngle={2}
                >
                  {MODEL_SPLIT.map((_, i) => (
                    <Cell key={i} fill={MODEL_COLORS[i]} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>

            {/* Manual legend */}
            <ul className="flex flex-col gap-2">
              {MODEL_SPLIT.map((m, i) => (
                <li
                  key={m.model}
                  className="flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ background: MODEL_COLORS[i] }}
                    />
                    <span className="truncate text-muted-foreground">
                      {m.model}
                    </span>
                  </div>
                  <span className="shrink-0 font-mono font-medium tabular-nums">
                    {compact(m.credits)}
                  </span>
                </li>
              ))}
            </ul>

            {/* Summary KPI strip */}
            <div className="grid grid-cols-2 gap-2 border-t border-border pt-4">
              <KpiCard
                label="Total credits"
                value={compact(kpis.totalCredits)}
                trend={kpis.creditsTrend}
                icon={CoinsIcon}
                className="rounded-xl"
              />
              <KpiCard
                label="Requests"
                value={compact(kpis.totalRequests)}
                trend={kpis.requestsTrend}
                icon={ZapIcon}
                className="rounded-xl"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
