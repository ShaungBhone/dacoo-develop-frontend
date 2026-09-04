"use client"

import * as React from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"
import { BotIcon, MessageSquareIcon, ClockIcon, ActivityIcon } from "@/components/ui/icons"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { KpiCard } from "@/components/analytics/kpi-card"
import {
  AGENTS_90,
  sliceDays,
  type Range,
} from "@/components/analytics/mock-data"

// ─── Chart config ─────────────────────────────────────────────────────────────
const barConfig: ChartConfig = {
  messages: { label: "Messages", color: "var(--color-chart-2)" },
  activeAgents: { label: "Active agents", color: "var(--color-primary)" },
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
interface AgentsSectionProps {
  range: Range
}

export function AgentsSection({ range }: AgentsSectionProps) {
  const data = sliceDays(AGENTS_90, range)
  const tickInterval = Math.max(0, Math.floor(data.length / 6) - 1)

  const totalMessages = data.reduce((s, d) => s + d.messages, 0)
  const avgActiveAgents = Math.round(
    data.reduce((s, d) => s + d.activeAgents, 0) / data.length
  )
  const avgResponseMs = Math.round(
    data.reduce((s, d) => s + d.avgResponseMs, 0) / data.length
  )
  const peakMessages = Math.max(...data.map((d) => d.messages))

  return (
    <section aria-labelledby="agents-heading" className="flex flex-col gap-4">
      <div>
        <h2
          id="agents-heading"
          className="text-sm font-semibold text-foreground"
        >
          Agents
        </h2>
        <p className="text-xs text-muted-foreground">
          Message throughput and active agent counts over time.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Bar chart — messages per day */}
        <Card className="col-span-1 border border-border shadow-none ring-0 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Messages per day
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
                <Bar
                  dataKey="messages"
                  fill="var(--color-chart-2)"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* KPI column */}
        <div className="flex flex-col gap-3">
          <KpiCard
            label="Total messages"
            value={compact(totalMessages)}
            icon={MessageSquareIcon}
            description={`across ${range} days`}
          />
          <KpiCard
            label="Avg active agents"
            value={String(avgActiveAgents)}
            icon={BotIcon}
            description="agents online per day"
          />
          <KpiCard
            label="Avg response"
            value={`${avgResponseMs} ms`}
            icon={ClockIcon}
            description="mean response latency"
          />
          <KpiCard
            label="Peak messages"
            value={compact(peakMessages)}
            icon={ActivityIcon}
            description="highest single day"
          />
        </div>
      </div>
    </section>
  )
}
