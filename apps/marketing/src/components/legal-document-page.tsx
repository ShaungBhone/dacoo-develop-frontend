import { AppShell } from "@/components/app-shell"
import type { LegalDocument } from "@/lib/legal-documents"

export function LegalDocumentPage({ document }: { document: LegalDocument }) {
  return (
    <AppShell breadcrumbs={[{ title: "Legal" }, { title: document.title }]}>
      <main className="flex-1 bg-muted/30 px-6 py-12 sm:px-10 lg:px-16 xl:px-24">
        <article className="mx-auto w-full max-w-3xl pb-12">
          <header className="border-b pb-8">
            <p className="text-sm font-medium text-muted-foreground">Legal</p>
            <h1 className="mt-4 text-balance font-serif text-4xl font-medium tracking-tight sm:text-5xl">
              {document.title}
            </h1>
            <p className="mt-4 text-sm text-muted-foreground">
              Last updated: {document.lastUpdated}
            </p>
          </header>

          {document.intro.map((paragraph) => (
            <p key={paragraph} className="mt-6 leading-7 text-muted-foreground">
              {paragraph}
            </p>
          ))}

          {document.sections.map((section, index) => (
            <section key={section.heading} className="mt-10 scroll-mt-24">
              <h2 className="text-xl font-medium tracking-tight">
                {index + 1}. {section.heading}
              </h2>
              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph} className="mt-3 leading-7 text-muted-foreground">
                  {paragraph}
                </p>
              ))}
              {section.items && (
                <ul className="mt-3 list-disc space-y-2 pl-6 leading-7 text-muted-foreground">
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </article>
      </main>
    </AppShell>
  )
}
