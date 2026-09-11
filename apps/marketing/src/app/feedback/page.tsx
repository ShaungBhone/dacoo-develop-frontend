import { MessageSquareHeartIcon } from "lucide-react"

import { AppShell } from "@/components/app-shell"
import { FeedbackForm } from "@/components/feedback-form"
import { Card } from "@/components/ui/card"

export default function FeedbackPage() {
  return (
    <AppShell
      breadcrumbs={[
        { title: "Feedback" },
      ]}
    >
      <section className="flex-1 bg-muted/30 px-6 py-12 sm:px-10 lg:flex lg:items-center lg:px-16 xl:px-24">
        <div className="mx-auto grid w-full max-w-5xl gap-14 lg:grid-cols-[minmax(0,0.8fr)_minmax(28rem,1.2fr)] lg:items-center lg:gap-20">
          <div className="max-w-md">
            <div className="flex size-11 items-center justify-center rounded-xl border bg-background text-primary shadow-sm">
              <MessageSquareHeartIcon className="size-5" aria-hidden="true" />
            </div>
            <h1 className="mt-7 text-balance font-serif text-4xl font-medium tracking-tight sm:text-5xl">
              Help shape what we build next.
            </h1>
            <p className="mt-6 text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
              Tell us what is working, what is getting in your way, or what you would like to see next. Every response goes directly to our product team.
            </p>
            <p className="mt-8 text-sm leading-6 text-muted-foreground">
              Feedback can be anonymous. Leave an email only if you would like us to follow up.
            </p>
          </div>
          <Card className="rounded-2xl border bg-background p-6 shadow-xl shadow-foreground/5 sm:p-10" variant="outline">
            <h2 className="text-2xl font-medium">Share feedback</h2>
            <p className="mt-3 text-sm text-muted-foreground">We read every submission and use them to prioritize improvements.</p>
            <div className="mt-8">
              <FeedbackForm />
            </div>
          </Card>
        </div>
      </section>
    </AppShell>
  )
}
