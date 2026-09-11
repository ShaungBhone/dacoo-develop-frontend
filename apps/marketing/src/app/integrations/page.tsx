import { AppShell } from "@/components/app-shell"
import { IntegrationSection } from "@/components/integration-section"

export default function IntegrationsPage() {
  return (
    <AppShell
      breadcrumbs={[
        { title: "Platform" },
        { title: "Integrations" },
      ]}
    >
      <IntegrationSection />
    </AppShell>
  )
}
