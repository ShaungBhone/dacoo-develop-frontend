import type { Metadata } from "next"

import { LegalDocumentPage } from "@/components/legal-document-page"
import { legalDocuments } from "@/lib/legal-documents"

export const metadata: Metadata = {
  title: `${legalDocuments.privacy.title} | Dacoo`,
  description: legalDocuments.privacy.description,
}

export default function PrivacyPage() {
  return <LegalDocumentPage document={legalDocuments.privacy} />
}
