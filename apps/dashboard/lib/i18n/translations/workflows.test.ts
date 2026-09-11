import { describe, expect, it } from "vitest"

import { en } from "./en"
import { my } from "./my"

function translationKeys(
  value: Record<string, unknown>,
  prefix = ""
): string[] {
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key

    return typeof child === "object" && child !== null
      ? translationKeys(child as Record<string, unknown>, path)
      : [path]
  })
}

describe("workflow translations", () => {
  it("keeps the Burmese dictionary in sync with English", () => {
    expect(translationKeys(my.workflows).sort()).toEqual(
      translationKeys(en.workflows).sort()
    )
  })

  it("provides Burmese copy for the workflows page", () => {
    expect(my.common.workflows).toBe("အလုပ်စဉ်များ")
    expect(my.workflows.title).toBe("အလုပ်စဉ်များ")
    expect(my.workflows.createDialog.create).toBe("အလုပ်စဉ် ဖန်တီးရန်")
  })
})
