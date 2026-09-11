import { CheckCircle2Icon } from "lucide-react"
import { Suspense } from "react"

import { AppShell } from "@/components/app-shell"
import { ContactForm } from "@/components/contact-form"
import { Card } from "@/components/ui/card"

const benefits = [
  "Multi-channel message routing",
  "Custom AI agents and workflows",
  "Tailored integrations for your stack",
  "Guided implementation support",
]

export default function ContactPage() {
  return (
    <AppShell
      breadcrumbs={[
        { title: "Sales" },
        { title: "Contact" },
      ]}
    >
      <section className="flex-1 bg-muted/30 px-6 py-12 sm:px-10 lg:flex lg:items-center lg:px-16 xl:px-24">
        <div className="mx-auto grid w-full max-w-6xl gap-14 lg:grid-cols-[minmax(0,0.85fr)_minmax(28rem,1.15fr)] lg:items-center lg:gap-20">
          <div className="max-w-md">
            <p className="text-sm font-medium text-muted-foreground">Sales</p>
            <h1 className="mt-7 text-balance font-serif text-4xl font-medium tracking-tight sm:text-5xl">
              Bring every customer conversation into one flow.
            </h1>
            <p className="mt-6 text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
              Talk with our team about a Dacoo workflow that routes messages, automates replies, and connects every customer channel.
            </p>
            <ul className="mt-9 space-y-4 text-sm">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-center gap-3">
                  <CheckCircle2Icon className="size-4 shrink-0 text-emerald-500" />
                  {benefit}
                </li>
              ))}
            </ul>
            <dl className="mt-12 space-y-6 text-sm" id="support">
              <div>
                <dt className="text-muted-foreground">Email</dt>
                <dd className="mt-1 font-medium">
                  <a className="hover:text-primary" href="mailto:sales@dacoo.co">sales@dacoo.co</a>
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Myanmar phone</dt>
                <dd className="mt-1 font-medium">
                  <a className="hover:text-primary" href="tel:+959405516253">+95 940 551 6253</a>
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Thailand phone</dt>
                <dd className="mt-1 font-medium">
                  <a className="hover:text-primary" href="tel:+66992658694">+66 992 658 694</a>
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Office</dt>
                <dd className="mt-1 font-medium">Kyaik Khauk Pagoda Road<br />Yangon, Myanmar</dd>
              </div>
            </dl>
          </div>
          <Card className="rounded-2xl border bg-background p-6 shadow-xl shadow-foreground/5 sm:p-10" variant="outline">
            <h2 className="text-2xl font-medium">Talk to our team</h2>
            <p className="mt-3 text-sm text-muted-foreground">Fill out the form and we&apos;ll be in touch within 24 hours.</p>
            <div className="mt-8">
              <Suspense fallback={null}>
                <ContactForm />
              </Suspense>
            </div>
          </Card>
        </div>
      </section>
    </AppShell>
  )
}
