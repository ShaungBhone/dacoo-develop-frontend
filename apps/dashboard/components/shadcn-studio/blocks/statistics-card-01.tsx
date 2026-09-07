import type { ReactNode } from "react"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type StatisticsCardProps = {
  icon: ReactNode
  value: string
  title: string
  changePercentage: string
  changeLabel?: string
  className?: string
}

export default function StatisticsCard({
  icon,
  value,
  title,
  changePercentage,
  changeLabel = "than last week",
  className,
}: StatisticsCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex min-w-0 flex-row items-center gap-2">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-sm bg-primary/10 text-primary">
          {icon}
        </div>
        <span className="min-w-0 truncate font-mono text-2xl tabular-nums">
          {value}
        </span>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <span className="text-base font-semibold">{title}</span>
        <p className="flex flex-wrap gap-2">
          <span
            className={cn(
              changePercentage.startsWith("-")
                ? "text-destructive"
                : "text-primary"
            )}
          >
            {changePercentage}
          </span>
          <span className="text-muted-foreground">{changeLabel}</span>
        </p>
      </CardContent>
    </Card>
  )
}
