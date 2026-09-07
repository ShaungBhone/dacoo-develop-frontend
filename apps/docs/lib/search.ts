import type { DocMetadata, Locale } from "@/lib/content-types"

export type SearchableDoc = Omit<DocMetadata, "searchText"> & {
  slug: string
  searchText: string
}

export function searchDocs(docs: SearchableDoc[], query: string, locale: Locale) {
  const normalized = query.trim().toLocaleLowerCase(locale)
  if (!normalized) return []

  return docs
    .filter((doc) =>
      `${doc.title} ${doc.description} ${doc.searchText}`
        .toLocaleLowerCase(locale)
        .includes(normalized)
    )
    .slice(0, 6)
}
