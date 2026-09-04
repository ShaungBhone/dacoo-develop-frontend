import { redirect } from "next/navigation"

/**
 * Companies are records now. Kept as a redirect so existing links and
 * bookmarks still land somewhere sensible.
 */
export default function CompaniesPage() {
  redirect("/records/company")
}
