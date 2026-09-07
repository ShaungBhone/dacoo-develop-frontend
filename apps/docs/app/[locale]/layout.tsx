import { headers } from "next/headers"
import { notFound } from "next/navigation"

import { DocsShell } from "@/components/docs-shell"
import { dashboardUrl } from "@/lib/auth"
import { searchableDocs } from "@/lib/content"
import { isLocale } from "@/lib/content-types"

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const encodedUser = (await headers()).get("x-docs-user")
  const user = encodedUser
    ? (JSON.parse(decodeURIComponent(encodedUser)) as { name: string; email: string })
    : { name: "Dacoo customer", email: "" }

  return (
    <DocsShell locale={locale} user={user} docs={searchableDocs(locale)} dashboardUrl={dashboardUrl}>
      {children}
    </DocsShell>
  )
}
