/** A company as rendered by the companies table. */
export interface CompanyListItem {
  id: string
  name: string
  slug: string
  logo: string
  /** Bare hostname, e.g. "acme.com". The company's identity — "" when unset. */
  domain: string
  /** Linkable form of the domain, derived server-side. "" when there is none. */
  websiteUrl: string
  email: string
  phone: string
  notes: string
  /** Workspace-defined attribute values, keyed by attribute slug. */
  values: Record<string, unknown>
  contactsCount: number
}

/**
 * The minimal shape the contact sheet's company picker needs. Kept separate
 * from CompanyListItem so the combobox doesn't depend on table-only fields.
 */
export interface CompanyOption {
  id: string
  name: string
  domain: string
}
