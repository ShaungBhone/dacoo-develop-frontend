import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

import { safeDocsReturnPath } from "@/lib/safe-return-path"

const apiUrl = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "https://srv1713705.hstgr.cloud"

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get("auth_token")?.value
  const locale = cookieStore.get("locale")?.value === "my" ? "my" : "en"
  const returnPath =
    safeDocsReturnPath(request.nextUrl.searchParams.get("return_path")) ??
    `/${locale}/getting-started`

  if (!token) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set(
      "next",
      `/docs/access?return_path=${encodeURIComponent(returnPath)}`
    )
    return NextResponse.redirect(loginUrl)
  }

  const response = await fetch(`${apiUrl}/api/docs/sso/tickets`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ return_path: returnPath }),
    cache: "no-store",
  })

  if (response.status === 401) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search)
    return NextResponse.redirect(loginUrl)
  }

  if (!response.ok) {
    return NextResponse.json(
      { message: "Documentation sign-in is temporarily unavailable." },
      { status: 502 }
    )
  }

  const data = (await response.json()) as { redirect_url: string }
  return NextResponse.redirect(data.redirect_url)
}
