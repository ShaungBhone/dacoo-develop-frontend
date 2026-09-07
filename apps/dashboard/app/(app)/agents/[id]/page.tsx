import { Suspense } from "react"
import { AgentSettingsView } from "@/components/agent-settings-view"
import { Spinner } from "@/components/ui/spinner"

export default async function AgentSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] flex-1 items-center justify-center">
          <Spinner className="size-8 text-primary" />
        </div>
      }
    >
      <AgentSettingsView agentId={id} />
    </Suspense>
  )
}
