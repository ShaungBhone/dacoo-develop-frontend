import { AppShell } from "@/components/app-shell"
import { ManionWorkflow } from "@/components/manion-workflow"

export default function WorkflowPage() {
  return (
    <AppShell
      breadcrumbs={[
        { title: "Playground", href: "/playground/workflow" },
        { title: "Workflow" },
      ]}
    >
      <ManionWorkflow />
    </AppShell>
  )
}
