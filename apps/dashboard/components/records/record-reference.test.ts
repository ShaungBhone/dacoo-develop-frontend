import { describe, expect, it } from "vitest"

import { asRecordSummary, recordReferenceLabel } from "./record-reference"

describe("record references", () => {
  const company = { id: "company-1", title: "Acme Inc" }

  it("reads the structured reference returned by the API", () => {
    expect(asRecordSummary(company)).toEqual(company)
    expect(asRecordSummary([company])).toEqual(company)
    expect(asRecordSummary({ id: 42, title: "Workspace owner" })).toEqual({
      id: "42",
      title: "Workspace owner",
    })
  })

  it("uses the title as the display label", () => {
    expect(recordReferenceLabel(company)).toBe("Acme Inc")
    expect(recordReferenceLabel("Legacy company")).toBe("Legacy company")
    expect(recordReferenceLabel({ id: "invalid" })).toBe("")
  })
})
