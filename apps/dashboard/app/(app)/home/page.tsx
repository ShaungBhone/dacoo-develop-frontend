import { HomepagePromptFrame } from "@/components/examples/c-frame-10"

export const metadata = {
  title: "Home",
  description: "What do you want to create?",
}

export default function HomePage() {
  return <HomepagePromptFrame embedded />
}
