import { NextRequest, NextResponse } from "next/server"

import { apiUrl, dashboardUrl, docsCookieName } from "@/lib/auth"
import { isDocsPath } from "@/lib/content-types"

export async function GET(request: NextRequest) {
  const ticket = request.nextUrl.searchParams.get("ticket")
  if (!ticket) return failedAccess()

  const response = await fetch(`${apiUrl}/api/docs/sso/exchange`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ ticket }),
    cache: "no-store",
  }).catch(() => null)

  if (!response?.ok) return failedAccess()

  const data = (await response.json()) as {
    token: string
    return_path: string
    expires_in: number
  }
  const returnPath = isDocsPath(data.return_path)
    ? data.return_path
    : "/en/getting-started"
  const redirect = NextResponse.redirect(new URL(returnPath, request.nextUrl.origin))
  redirect.cookies.set(docsCookieName, data.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: data.expires_in,
  })
  return redirect
}

function failedAccess() {
  const url = new URL("/docs/access", dashboardUrl)
  url.searchParams.set("return_path", "/en/getting-started")
  url.searchParams.set("error", "invalid_ticket")
  return NextResponse.redirect(url)
}
