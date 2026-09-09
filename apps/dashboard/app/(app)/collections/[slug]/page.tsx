import * as React from "react"
import { CollectionDetailView } from "@/components/records/collection-detail-view"

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  return (
    <React.Suspense fallback={null}>
      <CollectionDetailView slug={slug} />
    </React.Suspense>
  )
}
