import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function proxy(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value
  const onboardingCompleted =
    request.cookies.get("onboarding_completed")?.value === "1"
  const { pathname } = request.nextUrl

  if (pathname === "/") {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url))
    }

    return NextResponse.redirect(
      new URL(onboardingCompleted ? "/home" : "/onboarding", request.url)
    )
  }

  if (
    !token &&
    (pathname.startsWith("/home") || pathname.startsWith("/dashboard") || pathname === "/onboarding")
  ) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (token && pathname === "/login") {
    return NextResponse.redirect(
      new URL(onboardingCompleted ? "/home" : "/onboarding", request.url)
    )
  }

  if (token && pathname === "/onboarding" && onboardingCompleted) {
    return NextResponse.redirect(new URL("/home", request.url))
  }

  if (token && (pathname.startsWith("/home") || pathname.startsWith("/dashboard")) && !onboardingCompleted) {
    return NextResponse.redirect(new URL("/onboarding", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/", "/home/:path*", "/dashboard/:path*", "/login", "/onboarding"],
}
