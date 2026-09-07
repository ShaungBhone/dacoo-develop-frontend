import { describe, expect, it } from "vitest"

import { safeDocsReturnPath, safeReturnPath } from "@/lib/safe-return-path"

describe("safeReturnPath", () => {
  it("keeps same-origin paths and query strings", () => {
    expect(safeReturnPath("/docs/access?return_path=%2Fmy%2Finbox")).toBe(
      "/docs/access?return_path=%2Fmy%2Finbox"
    )
  })

  it.each([
    "https://evil.example/docs",
    "//evil.example/docs",
    "javascript:alert(1)",
    "docs/access",
  ])("rejects unsafe return value %s", (value) => {
    expect(safeReturnPath(value)).toBeNull()
  })
})

describe("safeDocsReturnPath", () => {
  it("accepts only routes in the bilingual guide manifest", () => {
    expect(safeDocsReturnPath("/my/settings-integrations")).toBe(
      "/my/settings-integrations"
    )
    expect(safeDocsReturnPath("/en/not-a-guide")).toBeNull()
    expect(safeDocsReturnPath("/fr/getting-started")).toBeNull()
  })
})
