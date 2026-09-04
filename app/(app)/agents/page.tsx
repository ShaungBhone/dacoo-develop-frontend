import { Suspense } from "react"
import { AgentsView } from "@/components/agents-view"
import { Spinner } from "@/components/ui/spinner"

export default function AgentsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] flex-1 flex-col items-center justify-center">
          <Spinner className="size-8 animate-spin text-primary" />
          <p className="mt-2 text-sm font-medium text-muted-foreground">
            Loading Agents...
          </p>
        </div>
      }
    >
      <AgentsView />
    </Suspense>
  )
}
