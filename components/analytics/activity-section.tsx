"use client"

import * as React from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"
import { ClockIcon, CheckCircle2Icon, ActivityIcon } from "@/components/ui/icons"

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
  ACTIVITY_90,
  sliceDays,
  computeKpis,
  type Range,
} from "@/components/analytics/mock-data"

// ─── Chart config ─────────────────────────────────────────────────────────────
const barConfig: ChartConfig = {
  success: { label: "Success", color: "var(--color-primary)" },
  warning: { label: "Warning", color: "var(--color-chart-1)" },
  error: { label: "Error", color: "var(--color-destructive)" },
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
interface ActivitySectionProps {
  range: Range
}

export function ActivitySection({ range }: ActivitySectionProps) {
  const data = sliceDays(ACTIVITY_90, range)
  const kpis = computeKpis(range)
  const tickInterval = Math.max(0, Math.floor(data.length / 6) - 1)

  // Success rate as a percentage
  const totalReqs = kpis.totalActivityReqs
  const successCount = data.reduce((s, d) => s + d.success, 0)
  const successRate =
    totalReqs > 0 ? Math.round((successCount / totalReqs) * 100) : 0

  return (
    <section aria-labelledby="activity-heading" className="flex flex-col gap-4">
      <div>
        <h2
          id="activity-heading"
          className="text-sm font-semibold text-foreground"
        >
          RAG Activity
        </h2>
        <p className="text-xs text-muted-foreground">
          Request volume broken down by outcome status.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Stacked bar chart */}
        <Card className="col-span-1 border border-border shadow-none ring-0 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Requests by status
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <ChartContainer config={barConfig} className="h-52 w-full">
              <BarChart
                data={data}
                margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
                barSize={range === 7 ? 28 : range === 30 ? 10 : 5}
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
                <ChartLegend content={<ChartLegendContent />} />
                <Bar
                  dataKey="success"
                  stackId="a"
                  fill="var(--color-primary)"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="warning"
                  stackId="a"
                  fill="var(--color-chart-1)"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="error"
                  stackId="a"
                  fill="var(--color-destructive)"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* KPI column */}
        <div className="flex flex-col gap-3">
          <KpiCard
            label="Total requests"
            value={compact(totalReqs)}
            icon={ActivityIcon}
            description={`across ${range} days`}
          />
          <KpiCard
            label="Avg latency"
            value={`${kpis.avgLatencyMs} ms`}
            icon={ClockIcon}
            description="mean response time"
          />
          <KpiCard
            label="Faithfulness"
            value={String(kpis.avgFaithfulness)}
            icon={CheckCircle2Icon}
            description="avg retrieval accuracy"
          />
          <KpiCard
            label="Success rate"
            value={`${successRate}%`}
            description="of requests succeeded"
          />
        </div>
      </div>
    </section>
  )
}
