import { describe, expect, it } from "vitest"

import type { Attribute } from "./api"
import {
  beginRecordCellEditing,
  createRecordCellEdit,
  formatRecordCellValue,
  isRecordAttributeEditable,
  parseRecordCellValue,
} from "./record-cell-editing"

function attribute(
  type: Attribute["type"],
  overrides: Partial<Attribute> = {}
): Attribute {
  return {
    id: "attribute-1",
    slug: "field",
    title: "Field",
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

describe("record spreadsheet cell editing", () => {
  it("hides the grid selection outline while a custom editor is open", () => {
    const attributes = new Set<string>()
    const viewport = {
      hasAttribute: (name: string) => attributes.has(name),
      setAttribute: (name: string) => attributes.add(name),
      removeAttribute: (name: string) => attributes.delete(name),
    }
    const cell = {
      closest: () => viewport,
    } as unknown as HTMLElement

    const finishEditing = beginRecordCellEditing(cell)

    expect(attributes.has("data-cell-editing")).toBe(true)

    finishEditing()

    expect(attributes.has("data-cell-editing")).toBe(false)
  })

  it("parses numeric and checkbox values", () => {
    expect(parseRecordCellValue(attribute("currency"), "$1,250.50")).toBe(
      1250.5
    )
    expect(parseRecordCellValue(attribute("checkbox"), "yes")).toBe(true)
    expect(parseRecordCellValue(attribute("checkbox"), "no")).toBe(false)
    expect(parseRecordCellValue(attribute("checkbox"), "maybe")).toBeUndefined()
  })

  it("maps select labels to their persisted slugs", () => {
    const status = attribute("status", {
      selectOptions: [
        {
          id: "option-1",
          slug: "in-progress",
          title: "In progress",
          color: null,
          position: 0,
          isArchived: false,
        },
      ],
    })

    expect(parseRecordCellValue(status, "In progress")).toBe("in-progress")
    expect(parseRecordCellValue(status, "Unknown")).toBeUndefined()
    expect(formatRecordCellValue(status, "in-progress", null)).toBe(
      "In progress"
    )
  })

  it("normalizes single and multi-value domains", () => {
    expect(
      parseRecordCellValue(attribute("domain"), "HTTPS://Acme.test/")
    ).toBe("acme.test")
    expect(
      parseRecordCellValue(
        attribute("domain", { isMultiselect: true }),
        "acme.test, example.test acme.test"
      )
    ).toEqual(["acme.test", "example.test"])
  })

  it("maps every type to an editor or an explicit read-only rule", () => {
    const types: Attribute["type"][] = [
      "actor-reference",
      "checkbox",
      "currency",
      "date",
      "domain",
      "email-address",
      "interaction",
      "image",
      "location",
      "number",
      "personal-name",
      "phone-number",
      "rating",
      "record-reference",
      "select",
      "status",
      "tags",
      "text",
      "timestamp",
    ]

    for (const type of types) {
      const field = attribute(type)
      expect(Boolean(createRecordCellEdit(field, null))).toBe(
        isRecordAttributeEditable(field)
      )
    }

    expect(createRecordCellEdit(attribute("interaction"), null)).toBeUndefined()
    expect(
      createRecordCellEdit(attribute("record-reference"), null)?.batchEditable
    ).toBe(false)
    expect(
      createRecordCellEdit(attribute("actor-reference"), null)?.batchEditable
    ).toBe(false)
    expect(createRecordCellEdit(attribute("text"), null)?.batchEditable).toBe(
      true
    )
  })

  it("keeps generated attributes read-only", () => {
    for (const slug of [
      "record-id",
      "created-at",
      "created-by",
      "last-seen-at",
    ]) {
      expect(
        createRecordCellEdit(attribute("text", { slug }), null)
      ).toBeUndefined()
    }
  })
})
