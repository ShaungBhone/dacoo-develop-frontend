import type { Metadata } from "next"

import { LegalDocumentPage } from "@/components/legal-document-page"
import { legalDocuments } from "@/lib/legal-documents"

export const metadata: Metadata = {
  title: "Security | Dacoo",
  description: legalDocuments.security.description,
}

export default function SecurityPage() {
  return <LegalDocumentPage document={legalDocuments.security} />
}
