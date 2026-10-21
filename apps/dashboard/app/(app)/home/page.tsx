import { Suspense } from "react"
import { HomeView } from "@/components/home/home-view"

export const metadata = {
  title: "Home",
  description: "Your AI assistant, work board, and financial overview",
}
export default function HomePage() {
  return (
    <Suspense>
      <HomeView />
    </Suspense>
  )
}
