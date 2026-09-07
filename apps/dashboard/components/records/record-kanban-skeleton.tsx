import * as React from "react"
import { Skeleton } from "@/components/ui/skeleton"

export function RecordKanbanSkeleton() {
  return (
    <div className="min-h-0 flex-1 overflow-hidden bg-muted/15 p-4 flex flex-col">
      <div className="flex flex-row items-stretch gap-4 min-h-full flex-1 w-fit min-w-full">
        {[
          { titleWidth: "w-24", cards: 3 },
          { titleWidth: "w-28", cards: 2 },
          { titleWidth: "w-20", cards: 1 },
          { titleWidth: "w-24", cards: 0 },
        ].map((col, colIndex) => (
          <div
            key={colIndex}
            className="h-full min-h-full flex flex-col w-72 sm:w-80 min-w-72 max-w-sm flex-1 shrink-0 bg-muted/40 border border-border/80 rounded-xl p-2.5"
          >
            {/* Column Header Skeleton */}
            <div className="flex flex-row items-center gap-2 pb-3 pt-1 px-1">
              <Skeleton className="size-2.5 rounded-full shrink-0" />
              <Skeleton className={`h-4 ${col.titleWidth} rounded-md`} />
              <Skeleton className="h-4 w-6 ml-auto rounded-full" />
            </div>

            {/* Cards Skeleton */}
            <div className="flex flex-col gap-2.5 flex-1">
              {Array.from({ length: col.cards }).map((_, cardIndex) => (
                <div
                  key={cardIndex}
                  className="rounded-xl border border-border/50 bg-card p-3 shadow-2xs space-y-2.5"
                >
                  <div className="flex items-center gap-2">
                    <Skeleton className="size-6 rounded-full shrink-0" />
                    <Skeleton className="h-4 w-28 rounded-md" />
                  </div>
                  <div className="space-y-1.5 pt-1">
                    <Skeleton className="h-3 w-16 rounded" />
                    <Skeleton className="h-3 w-32 rounded" />
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Add button Skeleton */}
            <Skeleton className="h-9 w-full mt-2 rounded-lg opacity-60" />
          </div>
        ))}
      </div>
    </div>
  )
}
