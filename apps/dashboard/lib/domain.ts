/**
 * Client-side mirror of the server's App\Support\Records\Hostname helper, used
 * to preview the company link before a contact is saved. The server remains
 * authoritative — it re-derives and re-checks everything on write.
 */

/**
 * Public mailbox providers, which never identify an employer.
 *
 * Source of truth is `config/crm.php` on the backend; this shorter list covers
 * the providers people actually type. A miss here only means the UI doesn't
 * preview a link the server would have refused anyway.
 */
const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "hotmail.com",
  "hotmail.co.uk",
  "outlook.com",
  "live.com",
  "msn.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "yahoo.com",
  "yahoo.co.uk",
  "yahoo.co.jp",
  "yahoo.co.in",
  "ymail.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
  "pm.me",
  "tutanota.com",
  "gmx.com",
  "gmx.de",
  "mail.com",
  "mail.ru",
  "zoho.com",
  "yandex.com",
  "yandex.ru",
  "qq.com",
  "163.com",
  "126.com",
  "naver.com",
  "hanmail.net",
  "daum.net",
])

const HOSTNAME = /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/

/**
 * Reduce a URL or bare domain to its hostname, or "" when there isn't a usable
 * one. Subdomains are kept; only a leading "www." is stripped.
 */
export function normalizeDomain(input: string | null | undefined): string {
  let value = (input ?? "").trim().toLowerCase()
  if (!value) return ""

  // Drop scheme, then userinfo, then anything from the first /, ? or #.
  value = value.replace(/^[a-z][a-z0-9+.-]*:\/\//, "")
  value = value.replace(/^[^@/]*@/, "")
  value = value.split(/[/?#]/)[0] ?? ""
  value = value.split(":")[0] ?? ""
  value = value.replace(/\.$/, "").replace(/^www\./, "")

  return HOSTNAME.test(value) ? value : ""
}

/** The normalized domain of an email address, or "" when there isn't one. */
export function domainFromEmail(email: string | null | undefined): string {
  const value = (email ?? "").trim()
  const at = value.lastIndexOf("@")
  return at === -1 ? "" : normalizeDomain(value.slice(at + 1))
}

/** Whether the domain belongs to a public mailbox provider. */
export function isFreeEmailDomain(domain: string): boolean {
  return FREE_EMAIL_DOMAINS.has(domain.toLowerCase())
}

/**
 * A reasonable company name guessed from a domain, for prefilling a create
 * action: "acme-corp.co.uk" → "Acme Corp".
 */
export function companyNameFromDomain(domain: string): string {
  const label = domain.split(".")[0] ?? ""
  return label
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ")
}
