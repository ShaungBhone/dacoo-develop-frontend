import EnGettingStarted, { metadata as enGettingStarted } from "@/content/en/getting-started.mdx"
import EnInbox, { metadata as enInbox } from "@/content/en/inbox.mdx"
import EnContacts, { metadata as enContacts } from "@/content/en/contacts-companies.mdx"
import EnAgents, { metadata as enAgents } from "@/content/en/agents-knowledge.mdx"
import EnPlayground, { metadata as enPlayground } from "@/content/en/playground.mdx"
import EnReports, { metadata as enReports } from "@/content/en/reports-usage.mdx"
import EnFinance, { metadata as enFinance } from "@/content/en/finance.mdx"
import EnSettings, { metadata as enSettings } from "@/content/en/settings-integrations.mdx"
import MyGettingStarted, { metadata as myGettingStarted } from "@/content/my/getting-started.mdx"
import MyInbox, { metadata as myInbox } from "@/content/my/inbox.mdx"
import MyContacts, { metadata as myContacts } from "@/content/my/contacts-companies.mdx"
import MyAgents, { metadata as myAgents } from "@/content/my/agents-knowledge.mdx"
import MyPlayground, { metadata as myPlayground } from "@/content/my/playground.mdx"
import MyReports, { metadata as myReports } from "@/content/my/reports-usage.mdx"
import MyFinance, { metadata as myFinance } from "@/content/my/finance.mdx"
import MySettings, { metadata as mySettings } from "@/content/my/settings-integrations.mdx"

import type { DocEntry, DocMetadata, Locale } from "@/lib/content-types"

function entry(
  slug: string,
  component: DocEntry["component"],
  metadata: DocMetadata
): DocEntry {
  return { slug, component, ...metadata }
}

const entries: Record<Locale, DocEntry[]> = {
  en: [
    entry("getting-started", EnGettingStarted, enGettingStarted),
    entry("inbox", EnInbox, enInbox),
    entry("contacts-companies", EnContacts, enContacts),
    entry("agents-knowledge", EnAgents, enAgents),
    entry("playground", EnPlayground, enPlayground),
    entry("reports-usage", EnReports, enReports),
    entry("finance", EnFinance, enFinance),
    entry("settings-integrations", EnSettings, enSettings),
  ],
  my: [
    entry("getting-started", MyGettingStarted, myGettingStarted),
    entry("inbox", MyInbox, myInbox),
    entry("contacts-companies", MyContacts, myContacts),
    entry("agents-knowledge", MyAgents, myAgents),
    entry("playground", MyPlayground, myPlayground),
    entry("reports-usage", MyReports, myReports),
    entry("finance", MyFinance, myFinance),
    entry("settings-integrations", MySettings, mySettings),
  ],
}

export function allDocs(locale: Locale): DocEntry[] {
  return [...entries[locale]].sort((a, b) => a.order - b.order)
}

export function findDoc(locale: Locale, slug: string): DocEntry | undefined {
  return entries[locale].find((entry) => entry.slug === slug)
}

export function searchableDocs(locale: Locale) {
  return allDocs(locale).map(({ slug, title, description, group, order, searchText }) => ({
    slug,
    title,
    description,
    group,
    order,
    searchText,
  }))
}
