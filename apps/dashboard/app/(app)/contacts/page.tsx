import { redirect } from "next/navigation"

/**
 * People are records now. Kept as a redirect so existing links and bookmarks
 * still land somewhere sensible.
 */
export default function ContactsPage() {
  redirect("/records/person")
}
