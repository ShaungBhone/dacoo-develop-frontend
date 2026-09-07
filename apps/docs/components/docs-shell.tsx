"use client"

import { DacooLogo, buttonClassName } from "@dacoo/ui"
import {
  BookOpen,
  ChevronRight,
  ExternalLink,
  Menu,
  Moon,
  Search,
  Sun,
  X,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { useEffect, useMemo, useState } from "react"

import type { Locale } from "@/lib/content-types"
import { searchDocs, type SearchableDoc } from "@/lib/search"

type DocsUser = { name: string; email: string }

const copy = {
  en: { search: "Search the guide", back: "Back to Dacoo", menu: "Guide navigation", signOut: "Sign out", noResults: "No results", onThisPage: "On this page" },
  my: { search: "လမ်းညွှန်တွင် ရှာရန်", back: "Dacoo သို့ပြန်ရန်", menu: "လမ်းညွှန်မီနူး", signOut: "ထွက်ရန်", noResults: "ရှာမတွေ့ပါ", onThisPage: "ဤစာမျက်နှာတွင်" },
} as const

export function DocsShell({
  locale,
  user,
  docs,
  dashboardUrl,
  children,
}: {
  locale: Locale
  user: DocsUser
  docs: SearchableDoc[]
  dashboardUrl: string
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [query, setQuery] = useState("")

  const matches = useMemo(() => searchDocs(docs, query, locale), [docs, locale, query])

  const groups = useMemo(
    () =>
      docs.reduce<Record<string, SearchableDoc[]>>((result, doc) => {
        result[doc.group] ??= []
        result[doc.group].push(doc)
        return result
      }, {}),
    [docs]
  )

  const otherLocale: Locale = locale === "en" ? "my" : "en"
  const translatedPath = pathname.replace(/^\/(en|my)/, `/${otherLocale}`)

  const navigation = (
    <nav aria-label={copy[locale].menu} className="flex flex-col gap-6">
      {Object.entries(groups).map(([group, pages]) => (
        <div key={group} className="flex flex-col gap-1">
          <p className="px-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {group}
          </p>
          {pages.map((page) => {
            const href = `/${locale}/${page.slug}`
            const active = pathname === href
            return (
              <Link
                key={page.slug}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {page.title}
              </Link>
            )
          })}
        </div>
      ))}
    </nav>
  )

  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
          <button
            type="button"
            className="rounded-lg p-2 hover:bg-muted lg:hidden"
            aria-label={copy[locale].menu}
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="size-5" />
          </button>
          <Link href={`/${locale}/getting-started`} className="flex items-center gap-2 font-semibold">
            <DacooLogo className="size-8 text-primary" />
            <span>Dacoo Guide</span>
          </Link>
          <div className="relative ml-auto w-full max-w-md">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={copy[locale].search}
              className="h-9 w-full rounded-lg border bg-muted/50 pr-3 pl-9 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
            {query && (
              <div className="absolute top-11 right-0 left-0 rounded-xl border bg-card p-2 shadow-xl">
                {matches.length ? matches.map((page) => (
                  <button
                    type="button"
                    key={page.slug}
                    onClick={() => {
                      setQuery("")
                      router.push(`/${locale}/${page.slug}`)
                    }}
                    className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left hover:bg-muted"
                  >
                    <span>
                      <span className="block text-sm font-medium">{page.title}</span>
                      <span className="line-clamp-1 block text-xs text-muted-foreground">{page.description}</span>
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </button>
                )) : (
                  <p className="px-3 py-4 text-center text-sm text-muted-foreground">{copy[locale].noResults}</p>
                )}
              </div>
            )}
          </div>
          <Link href={translatedPath} className={buttonClassName()}>
            {otherLocale === "my" ? "မြန်မာ" : "EN"}
          </Link>
          <button
            type="button"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="rounded-lg border p-2 hover:bg-muted"
            aria-label="Toggle theme"
          >
            <Sun className="size-4 dark:hidden" />
            <Moon className="hidden size-4 dark:block" />
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)_190px]">
        <aside className="sticky top-16 hidden h-[calc(100svh-4rem)] overflow-y-auto border-r px-4 py-8 lg:block">
          {navigation}
          <a href={dashboardUrl} className="mt-8 flex items-center gap-2 px-3 text-sm text-muted-foreground hover:text-foreground">
            <ExternalLink className="size-4" /> {copy[locale].back}
          </a>
        </aside>
        <main className="min-w-0 px-5 py-10 sm:px-8 lg:px-12 lg:py-14">{children}</main>
        <aside className="sticky top-16 hidden h-[calc(100svh-4rem)] border-l px-5 py-8 xl:block">
          <OnThisPage pathname={pathname} label={copy[locale].onThisPage} />
          <div className="mt-8 border-t pt-5 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">{user.name}</p>
            <p className="truncate">{user.email}</p>
            <form action="/auth/logout" method="post">
              <button className="mt-3 hover:text-foreground">{copy[locale].signOut}</button>
            </form>
          </div>
        </aside>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-black/40" aria-label="Close menu" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-[min(86vw,320px)] overflow-y-auto bg-background p-5 shadow-2xl">
            <div className="mb-8 flex items-center justify-between">
              <span className="flex items-center gap-2 font-semibold"><BookOpen className="size-5 text-primary" /> Dacoo Guide</span>
              <button className="rounded-lg p-2 hover:bg-muted" onClick={() => setMobileOpen(false)}><X className="size-5" /></button>
            </div>
            {navigation}
          </aside>
        </div>
      )}
    </div>
  )
}

function OnThisPage({ pathname, label }: { pathname: string; label: string }) {
  const [headings, setHeadings] = useState<Array<{ id: string; label: string }>>([])
  const [active, setActive] = useState("")

  useEffect(() => {
    const found = Array.from(document.querySelectorAll<HTMLHeadingElement>("main h2, main h3"))
      .filter((heading) => heading.id)
      .map((heading) => ({ id: heading.id, label: heading.textContent ?? heading.id }))
    queueMicrotask(() => setHeadings(found))
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting)
        if (visible) setActive(visible.target.id)
      },
      { rootMargin: "-80px 0px -75%" }
    )
    found.forEach(({ id }) => {
      const heading = document.getElementById(id)
      if (heading) observer.observe(heading)
    })
    return () => observer.disconnect()
  }, [pathname])

  return (
    <div>
      {headings.length > 0 && <p className="mb-3 text-xs font-semibold uppercase tracking-wide">{label}</p>}
      <nav className="flex flex-col gap-2">
        {headings.map((heading) => (
          <a key={heading.id} href={`#${heading.id}`} className={`text-xs leading-5 ${active === heading.id ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
            {heading.label}
          </a>
        ))}
      </nav>
    </div>
  )
}
