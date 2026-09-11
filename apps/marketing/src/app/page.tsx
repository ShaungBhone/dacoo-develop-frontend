import { AppShell } from "@/components/app-shell"
import HeroSection from "@/components/hero-section-3"

export default function HomePage() {
  return (
    <AppShell
      breadcrumbs={[
        { title: "Build Your Application" },
        { title: "Overview" },
      ]}
    >
      <HeroSection />
    </AppShell>
  )
}
