import type { ReactElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import type { Attribute, RecordItem } from "./api"
import { buildRecordColumns } from "./record-table-columns"

vi.mock("@/contexts/currency-settings-context", () => ({
  useCurrencySettings: () => ({ settings: null }),
}))

function option(
  slug: string,
  title: string,
  color: string | null = null
): Attribute["selectOptions"][number] {
  return {
    id: `option-${slug}`,
    slug,
    title,
    color,
    position: 0,
    isArchived: false,
  }
}

function attribute(
  type: "select" | "status",
  overrides: Partial<Attribute> = {}
): Attribute {
  return {
    id: `attribute-${type}`,
    slug: type,
    title: type === "status" ? "Status" : "Category",
    type,
    isSystem: false,
    isCustom: true,
    isMultiselect: false,
    isRequired: false,
    isUnique: false,
    position: 0,
    selectOptions: [],
    config: null,
    ...overrides,
  }
}

function renderCell(field: Attribute, value: unknown): string {
  const record: RecordItem = {
    id: "record-1",
    object: "person",
    title: "Ada Lovelace",
    displayText: "Ada Lovelace",
    displayImageUrl: null,
    values: { [field.slug]: value },
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  }
  const column = buildRecordColumns({
    attributes: [field],
    currencySettings: null,
  }).find(
    (candidate) =>
      (candidate.meta as { attributeSlug?: string } | undefined)
        ?.attributeSlug === field.slug
  )

  if (!column || typeof column.cell !== "function") {
    throw new Error(`Missing cell renderer for ${field.slug}`)
  }

  return renderToStaticMarkup(
    column.cell({ row: { original: record } } as never) as ReactElement
  )
}

describe("record table option columns", () => {
  it.each(["status", "select"] as const)(
    "renders configured %s values as colored badges",
    (type) => {
      const markup = renderCell(
        attribute(type, {
          selectOptions: [option("qualified", "Qualified", "#3b82f6")],
        }),
        "qualified"
      )

      expect(markup).toContain('data-slot="badge"')
      expect(markup).toContain("Qualified")
      expect(markup).toContain("color:rgb(59 130 246)")
    }
  )

  it("uses the neutral badge for colorless and unknown options", () => {
    const field = attribute("status", {
      selectOptions: [option("new", "New")],
    })

    for (const value of ["new", "legacy"]) {
      const markup = renderCell(field, value)
      expect(markup).toContain('data-slot="badge"')
      expect(markup).toContain("border-border bg-muted text-muted-foreground")
    }
  })

  it("keeps empty option values as an em dash", () => {
    const markup = renderCell(attribute("status"), null)

    expect(markup).toContain("—")
    expect(markup).not.toContain('data-slot="badge"')
  })

  it("collapses multiselect overflow after three badges", () => {
    const field = attribute("select", {
      isMultiselect: true,
      selectOptions: [
        option("one", "One"),
        option("two", "Two"),
        option("three", "Three"),
        option("four", "Four"),
      ],
    })
    const markup = renderCell(field, ["one", "two", "three", "four"])

    expect(markup).toContain("One")
    expect(markup).toContain("Two")
    expect(markup).toContain("Three")
    expect(markup).not.toContain("Four")
    expect(markup).toContain("+1")
  })
})
