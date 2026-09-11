import { AppShell } from "@/components/app-shell"
import { AiSupportSection } from "@/components/ai-support-section"

export default function AiSupportPage() {
  return (
    <AppShell breadcrumbs={[{ title: "AI Support" }]} insetClassName="[&>main]:flex [&>main]:flex-col">
      <AiSupportSection />
    </AppShell>
  )
}
