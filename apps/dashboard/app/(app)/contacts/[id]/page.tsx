import { ContactProfileView } from "@/components/contact-profile-view"

export default async function ContactProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <ContactProfileView contactId={id} />
}
