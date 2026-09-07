import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { allDocs, findDoc } from "@/lib/content"
import { isLocale } from "@/lib/content-types"

type PageProps = { params: Promise<{ locale: string; slug: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params
  if (!isLocale(locale)) return {}
  const doc = findDoc(locale, slug)
  return doc ? { title: doc.title, description: doc.description } : {}
}

export default async function GuidePage({ params }: PageProps) {
  const { locale, slug } = await params
  if (!isLocale(locale)) notFound()
  const doc = findDoc(locale, slug)
  if (!doc) notFound()

  const docs = allDocs(locale)
  const index = docs.findIndex((entry) => entry.slug === slug)
  const previous = docs[index - 1]
  const next = docs[index + 1]
  const Content = doc.component
  const labels = locale === "my"
    ? { previous: "ယခင်စာမျက်နှာ", next: "နောက်စာမျက်နှာ" }
    : { previous: "Previous", next: "Next" }

  return (
    <article className="mx-auto max-w-3xl">
      <p className="mb-4 text-sm font-medium text-primary">{doc.group}</p>
      <div className="docs-prose"><Content /></div>
      <nav className="mt-16 grid gap-3 border-t pt-8 sm:grid-cols-2">
        {previous ? (
          <Link href={`/${locale}/${previous.slug}`} className="rounded-xl border p-4 hover:bg-muted">
            <span className="block text-xs text-muted-foreground">{labels.previous}</span>
            <span className="mt-1 block font-medium">{previous.title}</span>
          </Link>
        ) : <span />}
        {next && (
          <Link href={`/${locale}/${next.slug}`} className="rounded-xl border p-4 text-right hover:bg-muted">
            <span className="block text-xs text-muted-foreground">{labels.next}</span>
            <span className="mt-1 block font-medium">{next.title}</span>
          </Link>
        )}
      </nav>
    </article>
  )
}
