import { AppShell } from "@/components/app-shell"
import { DatasetFeatures } from "@/components/dataset-features"

export default function FeaturesPage() {
  return (
    <AppShell breadcrumbs={[{ title: "Features" }]} insetClassName="[&>main]:flex [&>main]:flex-col">
      <DatasetFeatures />
    </AppShell>
  )
}
