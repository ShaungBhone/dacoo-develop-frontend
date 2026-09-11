import type { Metadata } from "next"

import { LegalDocumentPage } from "@/components/legal-document-page"
import { legalDocuments } from "@/lib/legal-documents"

export const metadata: Metadata = {
  title: `${legalDocuments.terms.title} | Dacoo`,
  description: legalDocuments.terms.description,
}

export default function TermsPage() {
  return <LegalDocumentPage document={legalDocuments.terms} />
}
