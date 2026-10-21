import type { HomeItem, HomeStatus, HomeViewMode } from "./api"

export const WORK_COLUMNS = {
  attention: "Needs attention",
  planned: "Planned",
  progress: "In progress",
  done: "Done",
} as const
export const FINANCE_COLUMNS = {
  attention: "To review",
  planned: "Awaiting action",
  progress: "Reviewed",
  done: "Reconciled",
} as const
export function boardItems(
  items: HomeItem[],
  view: HomeViewMode,
  query = "",
  now = Date.now()
): HomeItem[] {
  return items
    .filter((item) => {
      if (
        item.status === "cancelled" ||
        (item.snoozed_until && Date.parse(item.snoozed_until) > now)
      )
        return false
      const financial = item.kind === "finance" || item.kind === "transaction"
      if ((view === "work" && financial) || (view !== "work" && !financial))
        return false
      return `${item.title} ${item.description ?? ""}`
        .toLowerCase()
        .includes(query.toLowerCase())
    })
    .sort(
      (a, b) =>
        Number(b.priority === "urgent") - Number(a.priority === "urgent") ||
        (a.due_at ? Date.parse(a.due_at) : Infinity) -
          (b.due_at ? Date.parse(b.due_at) : Infinity)
    )
}
export function groupItems(items: HomeItem[]): Record<string, HomeItem[]> {
  return Object.fromEntries(
    Object.keys(WORK_COLUMNS).map((status) => [
      status,
      items.filter((item) => item.status === status),
    ])
  )
}
export function statusChange(
  items: HomeItem[],
  next: Record<string, HomeItem[]>
): { item: HomeItem; status: HomeStatus } | null {
  for (const [status, cards] of Object.entries(next)) {
    if (!(status in WORK_COLUMNS)) continue
    for (const item of cards) {
      const original = items.find((candidate) => candidate.id === item.id)
      if (original && original.status !== status)
        return { item: original, status: status as HomeStatus }
    }
  }
  return null
}
export function formatMoney(amount: string, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(Number(amount))
  } catch {
    return `${amount} ${currency}`
  }
}
