import { NextRequest, NextResponse } from "next/server"

import { apiUrl, dashboardUrl, docsCookieName } from "@/lib/auth-config"
import { isDocsPath } from "@/lib/content-types"

function accessRedirect(request: NextRequest) {
  const requestedPath = isDocsPath(request.nextUrl.pathname)
    ? request.nextUrl.pathname
    : "/en/getting-started"
  const url = new URL("/docs/access", dashboardUrl)
  url.searchParams.set("return_path", requestedPath)
  return NextResponse.redirect(url)
}

export async function proxy(request: NextRequest) {
  const token = request.cookies.get(docsCookieName)?.value
  if (!token) return accessRedirect(request)

  const response = await fetch(`${apiUrl}/api/docs/session`, {
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    cache: "no-store",
  }).catch(() => null)

  if (!response?.ok) {
    const redirect = accessRedirect(request)
    redirect.cookies.delete(docsCookieName)
    return redirect
  }

  const payload = (await response.json()) as {
    data: { name: string; email: string }
  }
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-docs-user", encodeURIComponent(JSON.stringify(payload.data)))

  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|auth/callback).*)"],
}
