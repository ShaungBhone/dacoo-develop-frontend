import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const cookieGet = vi.fn()

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: cookieGet }),
}))

import { GET } from "@/app/docs/access/route"

describe("documentation access bridge", () => {
  beforeEach(() => {
    cookieGet.mockImplementation((name: string) => {
      if (name === "auth_token") return { value: "dashboard-token" }
      if (name === "locale") return { value: "en" }

      return undefined
    })
  })

  it("returns a stable gateway error when ticket issuance fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 503 })))

    const response = await GET(
      new NextRequest("https://dashboard.localhost:3000/docs/access?return_path=%2Fen%2Finbox")
    )

    expect(response.status).toBe(502)
    await expect(response.json()).resolves.toEqual({
      message: "Documentation sign-in is temporarily unavailable.",
    })
  })

  it("falls back to a known guide when the requested slug is unsupported", async () => {
    const issueTicket = vi.fn().mockImplementation(async (_url, init: RequestInit) => {
      expect(JSON.parse(init.body as string)).toEqual({
        return_path: "/en/getting-started",
      })

      return Response.json({ redirect_url: "https://docs.dacoo.co/auth/callback?ticket=test" })
    })
    vi.stubGlobal("fetch", issueTicket)

    const response = await GET(
      new NextRequest("https://dashboard.localhost:3000/docs/access?return_path=%2Fen%2Fnot-a-guide")
    )

    expect(response.headers.get("location")).toBe(
      "https://docs.dacoo.co/auth/callback?ticket=test"
    )
  })
})
