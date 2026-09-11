import type { Metadata } from "next"

import { LegalDocumentPage } from "@/components/legal-document-page"
import { legalDocuments } from "@/lib/legal-documents"

export const metadata: Metadata = {
  title: "Cookies | Dacoo",
  description: legalDocuments.cookies.description,
}

export default function CookiesPage() {
  return <LegalDocumentPage document={legalDocuments.cookies} />
}
