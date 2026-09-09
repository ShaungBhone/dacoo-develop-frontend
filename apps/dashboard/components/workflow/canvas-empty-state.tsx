"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { LayoutTemplateIcon, RadioTowerIcon } from "lucide-react"

type CanvasEmptyStateProps = {
  onOpenTriggerSidebar: () => void
  onOpenTemplates: () => void
}

export function CanvasEmptyState({
  onOpenTriggerSidebar,
  onOpenTemplates,
}: CanvasEmptyStateProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-6">
      <div className="pointer-events-auto flex flex-col items-center gap-4 text-center max-w-sm">
        {/* Set a trigger in the sidebar card */}
        <button
          type="button"
          onClick={onOpenTriggerSidebar}
          className={cn(
            "group flex items-center gap-2.5 rounded-xl border-2 border-dashed border-sky-400/80 bg-background/80 px-6 py-3.5 shadow-xs backdrop-blur-xs",
            "hover:border-sky-500 hover:bg-sky-50/50 dark:hover:bg-sky-950/20 transition-all duration-150 cursor-pointer"
          )}
        >
          <span className="flex size-6 items-center justify-center rounded-md bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
            <RadioTowerIcon className="size-3.5" />
          </span>
          <span className="text-sm font-medium text-foreground group-hover:text-sky-700 dark:group-hover:text-sky-300">
            Set a trigger in the sidebar
          </span>
        </button>

        {/* OR Divider */}
        <div className="flex w-full items-center justify-center gap-3">
          <div className="h-px flex-1 bg-border/60" />
          <span className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground/70">
            OR
          </span>
          <div className="h-px flex-1 bg-border/60" />
        </div>

        {/* Start with a template button */}
        <Button
          type="button"
          variant="outline"
          onClick={onOpenTemplates}
          className="h-10 px-5 gap-2 rounded-xl bg-background hover:bg-muted/60 shadow-xs border-border text-sm font-medium"
        >
          <LayoutTemplateIcon className="size-4 text-muted-foreground" />
          Start with a template
        </Button>
      </div>
    </div>
  )
}
