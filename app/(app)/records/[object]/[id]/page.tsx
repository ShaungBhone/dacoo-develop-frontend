import { RecordDetailView } from "@/components/records/record-detail-view"

/**
 * One record of any object — the built-in person and company, and anything a
 * workspace defines. Labels and fields come from the object's own schema.
 */
export default async function RecordDetailPage({
  params,
}: {
  params: Promise<{ object: string; id: string }>
}) {
  const { object, id } = await params

  return <RecordDetailView objectSlug={object} recordId={id} />
}
