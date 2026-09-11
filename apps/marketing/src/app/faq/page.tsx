import { AppShell } from "@/components/app-shell"
import { FaqsSection } from "@/components/faqs-section"

export default function FaqPage() {
  return (
    <AppShell breadcrumbs={[{ title: "Help" }, { title: "FAQs" }]}>
      <FaqsSection />
    </AppShell>
  )
}
