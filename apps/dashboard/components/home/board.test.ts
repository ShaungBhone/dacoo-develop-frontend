import { describe, expect, it } from "vitest"
import { boardItems, groupItems, statusChange, FINANCE_COLUMNS } from "./board"
import type { HomeItem } from "./api"

const item = (overrides: Partial<HomeItem> = {}): HomeItem => ({
  id: "task1",
  kind: "task",
  title: "Call Sarah",
  description: null,
  status: "attention",
  priority: "normal",
  due_at: null,
  snoozed_until: null,
  read_at: null,
  conversation_id: null,
  payload: {},
  ...overrides,
})
describe("Home board", () => {
  it("keeps ledger entries separate from daily work", () => {
    const items = [
      item(),
      item({
        id: "ledger1",
        kind: "transaction",
        payload: { amount: "10", currency: "USD" },
      }),
    ]
    expect(boardItems(items, "work").map((card) => card.id)).toEqual(["task1"])
    expect(boardItems(items, "finance").map((card) => card.id)).toEqual([
      "ledger1",
    ])
  })
  it("hides cancelled and snoozed cards until the reminder is due", () => {
    const now = Date.parse("2026-10-21T10:00:00Z")
    const items = [
      item({ id: "cancelled", status: "cancelled" }),
      item({ id: "later", snoozed_until: "2026-10-21T10:10:00Z" }),
      item({ id: "due", snoozed_until: "2026-10-21T09:59:00Z" }),
    ]
    expect(boardItems(items, "work", "", now).map((card) => card.id)).toEqual([
      "due",
    ])
    expect(
      boardItems(items, "work", "", now + 660000).map((card) => card.id)
    ).toContain("later")
  })
  it("prioritizes urgent customer work then scheduled work", () => {
    const items = [
      item({ id: "normal" }),
      item({ id: "meeting", kind: "meeting", due_at: "2026-10-22T10:00:00Z" }),
      item({ id: "urgent", priority: "urgent" }),
    ]
    expect(boardItems(items, "work").map((card) => card.id)).toEqual([
      "urgent",
      "meeting",
      "normal",
    ])
  })
  it("searches both title and explanation without case sensitivity", () => {
    expect(
      boardItems(
        [item({ description: "Customer requested a refund" })],
        "work",
        "REFUND"
      )
    ).toHaveLength(1)
  })
  it("persists a status move without mutating financial amounts or meeting time", () => {
    const original = item({
      kind: "transaction",
      payload: { amount: "15.25", currency: "USD" },
      due_at: "2026-10-22T10:00:00Z",
    })
    const next = { ...groupItems([]), done: [original] }
    expect(statusChange([original], next)).toEqual({
      item: original,
      status: "done",
    })
    expect(original.payload.amount).toBe("15.25")
    expect(original.due_at).toBe("2026-10-22T10:00:00Z")
  })
  it("does not treat sorting cards in a column as a status change", () => {
    const items = [item(), item({ id: "task2" })]
    expect(
      statusChange(items, {
        ...groupItems([]),
        attention: [...items].reverse(),
      })
    ).toBeNull()
  })
  it("does not expose a paid transition for financial cards", () => {
    expect(Object.values(FINANCE_COLUMNS)).not.toContain("Paid")
  })
})
