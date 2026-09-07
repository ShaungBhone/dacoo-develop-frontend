import { NextResponse } from "next/server"

import { apiUrl, dashboardUrl, docsCookieName, docsToken } from "@/lib/auth"

export async function POST() {
  const token = await docsToken()
  if (token) {
    await fetch(`${apiUrl}/api/docs/session`, {
      method: "DELETE",
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      cache: "no-store",
    }).catch(() => null)
  }

  const response = NextResponse.redirect(dashboardUrl, 303)
  response.cookies.delete(docsCookieName)
  return response
}
