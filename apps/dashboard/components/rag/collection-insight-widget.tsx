'use client'

import * as React from 'react'
import { Bar, BarChart } from 'recharts'

import {
  TypographyH4,
  TypographyMuted,
} from '@/components/ui/typography'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { type ChartConfig, ChartContainer } from '@/components/ui/chart'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type { DatasetSummary } from '@/components/rag/api'

interface CollectionInsightWidgetProps {
  dataset: DatasetSummary | null
  documentsCount: number
  totalChunks: number
  totalTokens: number
  className?: string
}

function generateSparkline(value: number, keyName: string, variant: 'docs' | 'chunks' | 'tokens' = 'chunks') {
  const profiles = {
    docs: [0.35, 0.75, 0.45, 0.95, 0.65],
    chunks: [0.4, 0.85, 0.55, 1.0, 0.75],
    tokens: [0.3, 0.65, 0.4, 0.9, 0.6]
  }

  const ratios = profiles[variant]

  if (value <= 0) {
    return ratios.map((r, idx) => ({
      step: String(idx + 1),
      [keyName]: Math.round(r * 10)
    }))
  }

  const scale = Math.max(10, value)
  return ratios.map((r, idx) => ({
    step: String(idx + 1),
    [keyName]: Math.max(2, Math.round(scale * r))
  }))
}

const docsChartConfig = {
  docs: {
    label: 'Documents',
    color: 'color-mix(in oklab, var(--primary) 40%, transparent)'
  }
} satisfies ChartConfig

const chunksChartConfig = {
  chunks: {
    label: 'Chunks',
    color: 'var(--primary)'
  }
} satisfies ChartConfig

const tokensChartConfig = {
  tokens: {
    label: 'Tokens',
    color: 'color-mix(in oklab, var(--primary) 20%, transparent)'
  }
} satisfies ChartConfig

export function CollectionInsightWidget({
  dataset,
  documentsCount,
  totalChunks,
  totalTokens,
  className
}: CollectionInsightWidgetProps) {
  if (!dataset) return null

  const docsData = React.useMemo(() => generateSparkline(documentsCount, 'docs', 'docs'), [documentsCount])
  const chunksData = React.useMemo(() => generateSparkline(totalChunks, 'chunks', 'chunks'), [totalChunks])
  const tokensData = React.useMemo(() => generateSparkline(totalTokens, 'tokens', 'tokens'), [totalTokens])

  const docsColor = documentsCount > 0
    ? 'color-mix(in oklab, var(--primary) 40%, transparent)'
    : 'color-mix(in oklab, var(--muted-foreground) 15%, transparent)'

  const chunksColor = totalChunks > 0
    ? 'var(--primary)'
    : 'color-mix(in oklab, var(--muted-foreground) 15%, transparent)'

  const tokensColor = totalTokens > 0
    ? 'color-mix(in oklab, var(--primary) 25%, transparent)'
    : 'color-mix(in oklab, var(--muted-foreground) 15%, transparent)'

  return (
    <Card className={cn('gap-2.5 p-3 shadow-xs bg-card/80 border-border/80', className)}>
      <CardHeader className='flex justify-between gap-2 p-0 border-0'>
        <div className='flex flex-col gap-1 min-w-0 flex-1'>
          <div className='flex items-center justify-between gap-1.5'>
            <TypographyH4 className='truncate text-xs font-semibold text-foreground'>
              {dataset.name}
            </TypographyH4>
            <Badge
              variant='outline'
              className={cn(
                'shrink-0 text-[10px] capitalize px-1.5 py-0.5',
                dataset.status === 'ready'
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : dataset.status === 'failed'
                  ? 'border-red-500/30 bg-red-500/10 text-red-600'
                  : 'border-border bg-muted text-muted-foreground'
              )}
            >
              {dataset.status}
            </Badge>
          </div>
          <TypographyMuted className='text-[11px] line-clamp-2 leading-tight'>
            {dataset.description || 'No description provided.'}
          </TypographyMuted>
        </div>
      </CardHeader>

      <CardContent className='p-0 border-0'>
        <Separator />
      </CardContent>

      <CardContent className='space-y-2.5 p-0 border-0'>
        {/* Metric 1: Documents */}
        <div className='flex items-center justify-between gap-1'>
          <div className='flex flex-col gap-0.5 min-w-0'>
            <span className='text-[10px] text-muted-foreground uppercase tracking-wide'>
              Documents
            </span>
            <span className='text-sm font-semibold font-mono text-foreground'>
              {documentsCount.toLocaleString()}
            </span>
          </div>
          <ChartContainer config={docsChartConfig} className='min-h-9 max-w-14'>
            <BarChart accessibilityLayer data={docsData} barSize={5}>
              <Bar dataKey='docs' fill={docsColor} radius={2} />
            </BarChart>
          </ChartContainer>
        </div>

        {/* Metric 2: Total Chunks */}
        <div className='flex items-center justify-between gap-1'>
          <div className='flex flex-col gap-0.5 min-w-0'>
            <span className='text-[10px] text-muted-foreground uppercase tracking-wide'>
              Total Chunks
            </span>
            <span className='text-sm font-semibold font-mono text-foreground'>
              {totalChunks.toLocaleString()}
            </span>
          </div>
          <ChartContainer config={chunksChartConfig} className='min-h-9 max-w-14'>
            <BarChart accessibilityLayer data={chunksData} barSize={5}>
              <Bar dataKey='chunks' fill={chunksColor} radius={2} />
            </BarChart>
          </ChartContainer>
        </div>

        {/* Metric 3: Total Tokens */}
        <div className='flex items-center justify-between gap-1'>
          <div className='flex flex-col gap-0.5 min-w-0'>
            <span className='text-[10px] text-muted-foreground uppercase tracking-wide'>
              Total Tokens
            </span>
            <span className='text-sm font-semibold font-mono text-foreground'>
              {totalTokens.toLocaleString()}
            </span>
          </div>
          <ChartContainer config={tokensChartConfig} className='min-h-9 max-w-14'>
            <BarChart accessibilityLayer data={tokensData} barSize={5}>
              <Bar dataKey='tokens' fill={tokensColor} radius={2} />
            </BarChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export default CollectionInsightWidget
