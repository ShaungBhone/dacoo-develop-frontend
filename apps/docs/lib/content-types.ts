export type Locale = "en" | "my"

export type DocMetadata = {
  title: string
  description: string
  group: string
  order: number
  searchText: string
}

export type DocEntry = DocMetadata & {
  slug: string
  component: ComponentType
}

export const locales: Locale[] = ["en", "my"]
export const docsSlugs = [
  "getting-started",
  "inbox",
  "contacts-companies",
  "agents-knowledge",
  "playground",
  "reports-usage",
  "finance",
  "settings-integrations",
] as const

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale)
}

export function isDocsPath(value: string): boolean {
  const match = value.match(/^\/(en|my)\/([a-z0-9-]+)$/)

  return Boolean(match && docsSlugs.includes(match[2] as (typeof docsSlugs)[number]))
}
import type { ComponentType } from "react"
