"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  BracesIcon,
  DatabaseIcon,
  FileTextIcon,
  LayersIcon,
} from "@/components/ui/icons"

import type { DocumentSummary } from "@/components/rag/api"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

type BreakdownMetric = "documents" | "chunks" | "tokens"

type BreakdownRow = {
  type: string
  documents: number
  chunks: number
  tokens: number
}

const METRIC_LABELS: Record<BreakdownMetric, string> = {
  documents: "Documents",
  chunks: "Chunks",
  tokens: "Tokens",
}

function normalizeDocumentType(type: string) {
  const normalized = type.trim().replace(/^\./, "")
  return normalized ? normalized.toUpperCase() : "OTHER"
}

function isBreakdownMetric(value: string): value is BreakdownMetric {
  return value === "documents" || value === "chunks" || value === "tokens"
}

function DatasetMetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: number
  icon: React.ComponentType<React.ComponentProps<"svg">>
}) {
  return (
    <Card size="sm">
      <CardHeader className="flex flex-row items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-4" />
        </div>
        <div className="min-w-0">
          <CardDescription>{label}</CardDescription>
          <CardTitle className="font-mono text-xl tabular-nums">
            {value.toLocaleString()}
          </CardTitle>
        </div>
      </CardHeader>
    </Card>
  )
}

export function DatasetInsightsContent({
  documents,
}: {
  documents: DocumentSummary[]
}) {
  const [metric, setMetric] = React.useState<BreakdownMetric>("chunks")

  const totals = React.useMemo(
    () =>
      documents.reduce(
        (summary, document) => ({
          documents: summary.documents + 1,
          chunks: summary.chunks + document.chunks,
          tokens: summary.tokens + document.tokens,
        }),
        { documents: 0, chunks: 0, tokens: 0 }
      ),
    [documents]
  )

  const breakdown = React.useMemo(() => {
    const grouped = new Map<string, BreakdownRow>()

    for (const document of documents) {
      const type = normalizeDocumentType(document.type)
      const current = grouped.get(type) ?? {
        type,
        documents: 0,
        chunks: 0,
        tokens: 0,
      }

      current.documents += 1
      current.chunks += document.chunks
      current.tokens += document.tokens
      grouped.set(type, current)
    }

    const sorted = Array.from(grouped.values()).sort(
      (a, b) => b[metric] - a[metric]
    )
    const remaining = sorted.slice(6)

    if (remaining.length === 0) return sorted

    return [
      ...sorted.slice(0, 6),
      remaining.reduce(
        (summary, row) => ({
          type: "OTHER TYPES",
          documents: summary.documents + row.documents,
          chunks: summary.chunks + row.chunks,
          tokens: summary.tokens + row.tokens,
        }),
        { type: "OTHER TYPES", documents: 0, chunks: 0, tokens: 0 }
      ),
    ]
  }, [documents, metric])

  const chartConfig = React.useMemo(
    () =>
      ({
        [metric]: {
          label: METRIC_LABELS[metric],
          color: "var(--chart-1)",
        },
      }) satisfies ChartConfig,
    [metric]
  )

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <DatasetMetricCard
          label="Documents"
          value={totals.documents}
          icon={FileTextIcon}
        />
        <DatasetMetricCard
          label="Chunks"
          value={totals.chunks}
          icon={LayersIcon}
        />
        <DatasetMetricCard
          label="Tokens"
          value={totals.tokens}
          icon={BracesIcon}
        />
      </div>

      <Card size="sm">
        <CardHeader className="flex flex-col gap-3 sm:grid">
          <div>
            <CardTitle>Content by document type</CardTitle>
            <CardDescription>
              Compare the selected metric across the collection’s file types.
            </CardDescription>
          </div>
          <CardAction>
            <ToggleGroup
              type="single"
              value={metric}
              onValueChange={(value) => {
                if (isBreakdownMetric(value)) setMetric(value)
              }}
              variant="outline"
              size="sm"
              spacing={0}
              aria-label="Breakdown metric"
            >
              {(Object.keys(METRIC_LABELS) as BreakdownMetric[]).map(
                (option) => (
                  <ToggleGroupItem key={option} value={option}>
                    {METRIC_LABELS[option]}
                  </ToggleGroupItem>
                )
              )}
            </ToggleGroup>
          </CardAction>
        </CardHeader>
        <CardContent>
          {breakdown.length === 0 ? (
            <Empty className="min-h-48 border bg-background p-6">
              <EmptyHeader>
                <EmptyMedia variant="outline">
                  <DatabaseIcon className="size-5" />
                </EmptyMedia>
                <EmptyTitle className="text-sm">
                  No document statistics yet
                </EmptyTitle>
                <EmptyDescription className="text-xs">
                  Upload a source document to see its content breakdown.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <ChartContainer
              config={chartConfig}
              className="min-h-56 w-full"
              style={{ height: Math.max(224, breakdown.length * 44) }}
            >
              <BarChart
                accessibilityLayer
                data={breakdown}
                layout="vertical"
                margin={{ top: 4, right: 16, bottom: 4, left: 0 }}
              >
                <CartesianGrid
                  horizontal={false}
                  className="stroke-border/50"
                />
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) => Number(value).toLocaleString()}
                />
                <YAxis
                  dataKey="type"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                  width={72}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      indicator="dot"
                      labelFormatter={(label) => String(label)}
                    />
                  }
                />
                <Bar
                  dataKey={metric}
                  fill={`var(--color-${metric})`}
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
