import * as React from "react"
import { notFound, redirect } from "next/navigation"
import { RecordsListView } from "@/components/records-list-view"

/**
 * The list for any object — the built-in person and company, and anything a
 * workspace defines. Labels come from the object's own nouns.
 */
export default async function ObjectRecordsPage({
  params,
}: {
  params: Promise<{ object: string }>
}) {
  const { object } = await params

  return (
    <React.Suspense fallback={null}>
      <RecordsListView objectSlug={object} />
    </React.Suspense>
  )
}
