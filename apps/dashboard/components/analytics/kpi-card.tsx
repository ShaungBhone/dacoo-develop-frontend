"use client"

import * as React from "react"
import { ArrowUpIcon, ArrowDownIcon } from "@/components/ui/icons"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

interface KpiCardProps {
  label: string
  value: string
  trend?: number // signed percent change vs prior period
  description?: string
  icon?: React.ComponentType<{ className?: string }>
  className?: string
}

export function KpiCard({
  label,
  value,
  trend,
  description,
  icon: Icon,
  className,
}: KpiCardProps) {
  const positive = trend !== undefined && trend >= 0

  return (
    <Card
      className={cn(
        "border border-border shadow-none ring-0",
        className
      )}
    >
      <CardContent className="flex flex-col gap-2 p-4">
        {/* Label row */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </span>
          {Icon && (
            <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted">
              <Icon className="size-3.5 text-muted-foreground" aria-hidden="true" />
            </div>
          )}
        </div>

        {/* Value */}
        <p className="font-mono text-2xl font-bold tracking-tight tabular-nums text-foreground">
          {value}
        </p>

        {/* Trend or description */}
        {trend !== undefined ? (
          <div
            className={cn(
              "flex items-center gap-1 text-xs font-medium",
              positive ? "text-primary" : "text-destructive"
            )}
          >
            {positive ? (
              <ArrowUpIcon className="size-3 shrink-0" aria-hidden="true" />
            ) : (
              <ArrowDownIcon className="size-3 shrink-0" aria-hidden="true" />
            )}
            <span>{Math.abs(trend)}% vs prev period</span>
          </div>
        ) : description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </CardContent>
    </Card>
  )
}
