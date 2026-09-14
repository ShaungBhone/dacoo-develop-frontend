import type { RecordSummary } from "@/components/records/api"

/** Normalize the singular or legacy list shape used by record references. */
export function asRecordSummary(value: unknown): RecordSummary | null {
  const entry = Array.isArray(value) ? value[0] : value

  if (
    entry &&
    typeof entry === "object" &&
    "id" in entry &&
    "title" in entry &&
    (typeof entry.id === "string" || typeof entry.id === "number") &&
    typeof entry.title === "string"
  ) {
    return { id: String(entry.id), title: entry.title }
  }

  return null
}

/** Return a display-safe label without coercing objects to `[object Object]`. */
export function recordReferenceLabel(value: unknown): string {
  const reference = asRecordSummary(value)

  if (reference) return reference.title
  if (value == null || typeof value === "object") return ""

  return String(value)
}
