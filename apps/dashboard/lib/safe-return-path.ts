export function safeReturnPath(value: string | null | undefined): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null

  try {
    const url = new URL(value, "https://dashboard.dacoo.co")
    return url.origin === "https://dashboard.dacoo.co"
      ? `${url.pathname}${url.search}`
      : null
  } catch {
    return null
  }
}

const docsSlugs = new Set([
  "getting-started",
  "inbox",
  "contacts-companies",
  "agents-knowledge",
  "playground",
  "reports-usage",
  "finance",
  "settings-integrations",
])

export function safeDocsReturnPath(value: string | null | undefined): string | null {
  const match = value?.match(/^\/(en|my)\/([a-z0-9-]+)$/)

  return match && docsSlugs.has(match[2]) ? value! : null
}
