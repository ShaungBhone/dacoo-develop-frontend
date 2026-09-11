import { AppShell } from "@/components/app-shell"
import { PricingComparison } from "@/components/pricing-comparison"
import { PricingPlans } from "@/components/pricing-plans"

export default function PricingPage() {
  return (
    <AppShell
      breadcrumbs={[
        { title: "Sales" },
        { title: "Pricing" },
      ]}
    >
      <PricingPlans />
      <PricingComparison />
    </AppShell>
  )
}
