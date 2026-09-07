import { readdir, readFile } from "node:fs/promises"
import path from "node:path"

import { describe, expect, it } from "vitest"

import { searchDocs } from "@/lib/search"

const contentRoot = path.resolve(process.cwd(), "content")

async function files(locale: "en" | "my") {
  return (await readdir(path.join(contentRoot, locale)))
    .filter((file) => file.endsWith(".mdx"))
    .sort()
}

describe("documentation content", () => {
  it("keeps English and Burmese routes in parity", async () => {
    expect(await files("my")).toEqual(await files("en"))
  })

  it("provides complete metadata and unique ordering", async () => {
    for (const locale of ["en", "my"] as const) {
      const orders: number[] = []
      for (const filename of await files(locale)) {
        const source = await readFile(path.join(contentRoot, locale, filename), "utf8")
        expect(source).toMatch(/title:\s*".+"/)
        expect(source).toMatch(/description:\s*".+"/)
        expect(source).toMatch(/group:\s*".+"/)
        expect(source).toMatch(/searchText:\s*".+"/)
        const order = source.match(/order:\s*(\d+)/)?.[1]
        expect(order).toBeTruthy()
        orders.push(Number(order))
        expect(source).not.toMatch(/\]\(\/(?!en\/|my\/|media\/)/)
      }
      expect(new Set(orders).size).toBe(orders.length)
    }
  })

  it("searches both Latin and Burmese text by substring", () => {
    const docs = [{
      slug: "inbox",
      title: "Inbox",
      description: "ဖောက်သည်စကားပြောဆိုမှုများ",
      group: "Customer operations",
      order: 1,
      searchText: "messages reply priority",
    }]

    expect(searchDocs(docs, "reply", "en")).toHaveLength(1)
    expect(searchDocs(docs, "ဖောက်သည်", "my")).toHaveLength(1)
    expect(searchDocs(docs, "missing", "en")).toHaveLength(0)
  })
})
