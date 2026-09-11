import Link from "next/link"
import {
  ArrowRightIcon,
  BotIcon,
  CheckCircle2Icon,
  Clock3Icon,
  Globe2Icon,
  MessageCircleIcon,
  SparklesIcon,
  UserRoundIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Conversation, ConversationContent } from "@/components/ai-elements/conversation"
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message"
import { Card } from "@/components/ui/card"

const benefits = [
  {
    icon: Clock3Icon,
    title: "Always-on answers",
    description: "Reply to customer questions any time, even outside business hours.",
  },
  {
    icon: Globe2Icon,
    title: "Shared context",
    description: "Use customer history and your team’s approved knowledge in every reply.",
  },
  {
    icon: UserRoundIcon,
    title: "Human handoff",
    description: "Bring in the right teammate when a conversation needs their care.",
  },
]

export function AiSupportSection() {
  return (
    <section className="flex min-h-0 flex-1 bg-muted/30 px-6 py-6 sm:px-10 sm:py-8 lg:px-16 xl:px-24">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(25rem,1.1fr)] lg:gap-14">
        <div className="max-w-xl">
          <p className="flex items-center gap-2 text-sm font-medium text-primary">
            <SparklesIcon className="size-4" /> Dacoo AI support
          </p>
          <h1 className="mt-3 text-balance font-serif text-3xl font-medium tracking-tight sm:text-4xl">
            Empowering <span className="text-muted-foreground">Marketing teams with</span> AI-driven solutions.
          </h1>
          <p className="mt-4 max-w-lg text-pretty leading-6 text-muted-foreground">
            Give every customer a fast, helpful answer in their language while your team stays in control of every conversation.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {benefits.map((benefit) => {
              const Icon = benefit.icon

              return (
                <div key={benefit.title} className="rounded-xl border bg-background/80 p-3 shadow-sm">
                  <Icon className="size-4 text-primary" aria-hidden="true" />
                  <h2 className="mt-2 text-sm font-medium">{benefit.title}</h2>
                  <p className="mt-1 text-xs leading-4 text-muted-foreground">{benefit.description}</p>
                </div>
              )
            })}
          </div>

          <Button className="mt-6" render={<Link href="/contact" />} nativeButton={false}>
            Talk to our team
            <ArrowRightIcon aria-hidden="true" />
          </Button>
        </div>

        <Card className="overflow-hidden border bg-background p-4 shadow-xl shadow-primary/5 sm:p-6" variant="outline">
          <div className="flex items-center justify-between gap-3 border-b pb-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <BotIcon className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">Dacoo AI Assistant</p>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" /> Online and ready to help
                </p>
              </div>
            </div>
            <span className="hidden rounded-full border bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground sm:inline-flex">
              Messenger
            </span>
          </div>

          <Conversation className="min-h-0" aria-label="AI customer-support conversation example">
            <ConversationContent className="gap-4 px-0 py-5">
              <Message from="user">
                <MessageContent className="rounded-2xl rounded-br-md text-sm leading-5">
                  <MessageResponse>
                    Hi! When will my order arrive? I need to know the delivery time and cost.
                  </MessageResponse>
                  <p className="text-right text-[11px] text-muted-foreground">Customer · just now</p>
                </MessageContent>
              </Message>

              <Message from="assistant">
                <MessageContent className="max-w-[92%] rounded-2xl rounded-bl-md border bg-background px-4 py-3 text-sm leading-5 shadow-sm">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-primary">
                    <SparklesIcon className="size-3" aria-hidden="true" /> AI reply
                  </span>
                  <MessageResponse>
                    Your order is on its way. Delivery in Yangon takes 1–2 days; outside the city, 3–5 days. Delivery is free for orders over 50,000 MMK.
                  </MessageResponse>
                </MessageContent>
              </Message>
            </ConversationContent>
          </Conversation>

          <div className="grid gap-3 border-t pt-4 sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span className="rounded-full border bg-muted/40 px-2.5 py-1">Order #1042</span>
              <span className="rounded-full border bg-muted/40 px-2.5 py-1">English</span>
              <span className="rounded-full border bg-muted/40 px-2.5 py-1">Shipping policy</span>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
              <CheckCircle2Icon className="size-4" aria-hidden="true" /> Resolved by AI
            </span>
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-xl bg-primary/5 px-3 py-2.5 text-xs text-muted-foreground">
            <MessageCircleIcon className="size-4 shrink-0 text-primary" aria-hidden="true" />
            Need a person? Route this conversation to the right teammate in one click.
          </div>
        </Card>
      </div>
    </section>
  )
}
