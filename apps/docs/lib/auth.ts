import { cookies } from "next/headers"

export { apiUrl, dashboardUrl, docsCookieName } from "@/lib/auth-config"
import { docsCookieName } from "@/lib/auth-config"

export async function docsToken(): Promise<string | null> {
  return (await cookies()).get(docsCookieName)?.value ?? null
}
