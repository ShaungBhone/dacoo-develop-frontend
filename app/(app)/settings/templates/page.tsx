import { redirect } from "next/navigation"

export default function SettingsTemplatesPage() {
  redirect("/settings?tab=templates")
}
