import type { ReactNode } from "react"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type StatisticStatus = "within" | "exceed" | "observe" | "unknown"

export type StatisticsCardProps = {
  icon: ReactNode
  range: string
  status: StatisticStatus
  title: string
  value: string
  className?: string
}

const statusStyles: Record<StatisticStatus, string> = {
  within: "bg-primary",
  exceed: "bg-destructive",
  observe: "bg-chart-4",
  unknown: "bg-muted-foreground",
}

export default function StatisticsWithStatus({
  icon,
  range,
  status,
  title,
  value,
  className,
}: StatisticsCardProps) {
  return (
    <Card className={cn("flex flex-col gap-0 p-4 shadow-none", className)}>
      <CardHeader className="flex flex-row items-start gap-3 p-0">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="font-mono text-2xl leading-none font-semibold tabular-nums">
            {value}
          </span>
          <span className="text-sm font-medium">{title}</span>
        </div>
        <span
          aria-label={`Status: ${status}`}
          className={cn("mt-1.5 size-2 rounded-full", statusStyles[status])}
        />
      </CardHeader>
      <CardContent className="mt-auto p-0 pt-4">
        <span className="text-sm text-muted-foreground">{range}</span>
      </CardContent>
    </Card>
  )
}
