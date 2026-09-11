"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ChevronDownIcon, SearchIcon, SearchXIcon } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const categories = [
  { id: "all", label: "All" },
  { id: "getting-started", label: "Getting Started" },
  { id: "features", label: "Features" },
  { id: "billing", label: "Billing" },
  { id: "support", label: "Support" },
] as const

type FaqCategory = Exclude<(typeof categories)[number]["id"], "all">

type Faq = {
  id: number
  category: FaqCategory
  question: string
  answer: string
}

const faqs: Faq[] = [
  {
    id: 1,
    category: "getting-started",
    question: "How do I get started with Dacoo?",
    answer: "Simply fill out our contact form and our team will get back to you shortly to get you set up.",
  },
  {
    id: 2,
    category: "getting-started",
    question: "Which channels can I connect?",
    answer: "Dacoo brings Facebook Messenger, Instagram, WhatsApp, Viber, TikTok, Telegram, and Email together — seven channels, all managed from a single dashboard. More channels are on the way so you can reach every customer where they already are.",
  },
  {
    id: 3,
    category: "features",
    question: "How does the 24/7 AI customer support work?",
    answer: "Dacoo's AI assistant answers buyer questions instantly across every connected channel—in the customer's own language—so no message goes unanswered, even after hours. You can step in and take over any conversation whenever you want.",
  },
  {
    id: 4,
    category: "features",
    question: "Can my whole team work from one inbox?",
    answer: "Yes. Invite staff, set role-based permissions, and handle every conversation together from one shared inbox so nothing slips through the cracks.",
  },
  {
    id: 5,
    category: "features",
    question: "What are follow-up reminders?",
    answer: "Dacoo nudges you when a lead goes quiet so you never lose a sale to a forgotten reply, and surfaces hot new leads the moment they come in.",
  },
  {
    id: 6,
    category: "billing",
    question: "What plans and payment methods do you offer?",
    answer: "Choose Basic, Growth, or Scale to match your team, or contact us for an Enterprise plan. We accept major credit cards and local payment options, billed monthly or annually.",
  },
  {
    id: 10,
    category: "billing",
    question: "How does AI usage billing work?",
    answer: "Every plan includes a monthly allowance of AI credits that resets at the start of each billing period. If you use them all, extra AI usage draws from your prepaid wallet balance. When both are depleted the AI assistant pauses until you top up your wallet or upgrade — so there are never any surprise charges.",
  },
  {
    id: 7,
    category: "billing",
    question: "Can I change my plan anytime?",
    answer: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate your billing accordingly.",
  },
  {
    id: 8,
    category: "support",
    question: "How do I contact support or report an issue?",
    answer: "Use the in-app feedback button or email support@dacoo.co with details about the issue. Our team typically responds within 24 hours.",
  },
  {
    id: 9,
    category: "support",
    question: "Do you offer onboarding or training?",
    answer: "Yes. Guides, tutorials, and live webinars are available to everyone, and higher-tier plans include personalized onboarding sessions with our team.",
  },
]

export function FaqsSection() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeCategory, setActiveCategory] = useState<(typeof categories)[number]["id"]>("all")
  const [openFaqId, setOpenFaqId] = useState<number | null>(null)

  const filteredFaqs = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return faqs.filter((faq) => {
      const matchesCategory = activeCategory === "all" || faq.category === activeCategory
      const matchesSearch =
        normalizedSearch.length === 0 ||
        faq.question.toLowerCase().includes(normalizedSearch) ||
        faq.answer.toLowerCase().includes(normalizedSearch)

      return matchesCategory && matchesSearch
    })
  }, [activeCategory, searchTerm])

  return (
    <section className="min-h-full bg-background px-4 py-10 sm:px-6 sm:py-14 lg:px-10">
      <div className="mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border bg-background shadow-sm">
        <header className="border-b px-5 py-8 sm:px-8 sm:py-10">
          <h1 className="font-serif text-3xl font-medium tracking-tight sm:text-4xl">
            Frequently Asked Questions
          </h1>
          <p className="mt-4 max-w-2xl text-pretty leading-7 text-muted-foreground">
            Find answers to common questions about Dacoo. Can&apos;t find what you&apos;re looking for? Our support team is here to help.
          </p>

          <label className="relative mt-7 block max-w-md">
            <span className="sr-only">Search FAQs</span>
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search FAQs..."
              type="search"
              value={searchTerm}
            />
          </label>
        </header>

        <div aria-label="FAQ categories" className="flex gap-1 overflow-x-auto border-b px-3 pt-2 sm:px-5" role="toolbar">
          {categories.map((category) => {
            const isActive = activeCategory === category.id

            return (
              <button
                aria-pressed={isActive}
                className={cn(
                  "shrink-0 border-b-2 border-transparent px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                  isActive && "border-primary text-primary"
                )}
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                type="button"
              >
                {category.label}
              </button>
            )
          })}
        </div>

        {filteredFaqs.length > 0 ? (
          <div className="space-y-2 p-3 sm:p-5">
            {filteredFaqs.map((faq) => (
              <Collapsible
                className="rounded-lg border bg-card px-4 shadow-xs"
                key={faq.id}
                onOpenChange={(open) => setOpenFaqId(open ? faq.id : null)}
                open={openFaqId === faq.id}
              >
                <CollapsibleTrigger className="group flex w-full items-start justify-between gap-4 py-4 text-left text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <span>{faq.question}</span>
                  <ChevronDownIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-aria-expanded:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent className="pb-4 text-sm leading-6 text-muted-foreground">
                  {faq.answer}
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center px-5 py-16 text-center sm:px-8">
            <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <SearchXIcon className="size-5" />
            </span>
            <h2 className="mt-4 text-lg font-medium">No FAQs found matching your search.</h2>
            <Button className="mt-5" onClick={() => setSearchTerm("")} type="button" variant="outline">
              Clear search
            </Button>
          </div>
        )}

        <footer className="border-t px-5 py-6 text-sm text-muted-foreground sm:px-8">
          Can&apos;t find what you&apos;re looking for?{" "}
          <Link className="font-medium text-primary underline underline-offset-4 hover:text-primary/80" href="/contact#support">
            Contact Us
          </Link>
        </footer>
      </div>
    </section>
  )
}
