export interface LocationValue {
  city?: string | null
  state?: string | null
  country?: string | null
  display_address?: string | null
}

/** Turn the stored location object into the compact label used throughout records. */
export function formatLocationLabel(value: unknown): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null

  const location = value as LocationValue
  if (
    typeof location.display_address === "string" &&
    location.display_address
  ) {
    return location.display_address
  }

  const parts = [location.city, location.state, location.country].filter(
    (part): part is string => typeof part === "string" && part.length > 0
  )

  return parts.length > 0 ? parts.join(", ") : null
}
