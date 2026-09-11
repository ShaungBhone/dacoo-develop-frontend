"use client"

import Link from "next/link"
import { CheckCircle2Icon, StarIcon } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type BillingPeriod = "monthly" | "yearly"

type Plan = {
  name: string
  description: string
  monthlyPrice?: number
  yearlyPrice?: number
  popular?: boolean
  features: string[]
}

const plans: Plan[] = [
  {
    name: "Basic",
    description: "For getting started",
    monthlyPrice: 20,
    yearlyPrice: 192,
    features: [
      "Unlimited team members",
      "1 channel",
      "2 GB storage",
      "1 organization",
      "Knowledge base",
      "AI auto-reply",
      "5,000 AI credits / month",
    ],
  },
  {
    name: "Growth",
    description: "For growing teams",
    monthlyPrice: 79,
    yearlyPrice: 756,
    features: [
      "Everything in Basic",
      "Up to 3 channels",
      "15 GB storage",
      "Up to 2 organizations",
      "File sharing",
      "30,000 AI credits / month",
    ],
  },
  {
    name: "Scale",
    description: "For scaling businesses",
    monthlyPrice: 249,
    yearlyPrice: 2388,
    popular: true,
    features: [
      "Everything in Growth",
      "All 7 channels",
      "75 GB storage",
      "Up to 5 organizations",
      "200,000 AI credits / month",
      "AI document drafting",
      "Priority support",
    ],
  },
  {
    name: "Enterprise",
    description: "For large organizations",
    monthlyPrice: 699,
    yearlyPrice: 6708,
    features: [
      "Everything in Scale",
      "Unlimited channels & storage",
      "Single sign-on (SSO)",
      "Audit logs",
      "Dedicated support",
    ],
  },
]

function annualSavings(plan: Plan) {
  if (!plan.monthlyPrice || !plan.yearlyPrice) return null

  return Math.round((1 - plan.yearlyPrice / (plan.monthlyPrice * 12)) * 100)
}

export function PricingPlans() {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly")

  return (
    <section className="bg-muted/30 px-6 py-12 sm:px-10 lg:px-16 lg:py-20 xl:px-24">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-muted-foreground">Pricing</p>
          <h1 className="mt-4 text-balance font-serif text-4xl font-medium tracking-tight sm:text-5xl">
            Plans that scale with you.
          </h1>
          <p className="mt-5 text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
            Simple, transparent pricing for every stage of your customer operations.
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Included AI credits reset monthly; extra usage draws from your wallet balance.
          </p>
        </div>

        <div className="mt-8 flex justify-center">
          <div className="inline-flex rounded-lg border bg-background p-1 shadow-xs" aria-label="Billing period">
            {(["monthly", "yearly"] as const).map((period) => (
              <button
                key={period}
                type="button"
                aria-pressed={billingPeriod === period}
                onClick={() => setBillingPeriod(period)}
                className={cn(
                  "rounded-md px-4 py-2 text-sm font-medium transition-colors",
                  billingPeriod === period
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {period === "monthly" ? "Monthly" : "Yearly"}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:items-stretch">
          {plans.map((plan) => {
            const monthlyEquivalent = plan.yearlyPrice ? plan.yearlyPrice / 12 : null
            const price = billingPeriod === "yearly" ? monthlyEquivalent : plan.monthlyPrice
            const savings = annualSavings(plan)

            return (
              <article
                key={plan.name}
                className={cn(
                  "relative flex flex-col rounded-2xl border bg-background p-7 shadow-sm sm:p-8",
                  plan.popular && "border-primary shadow-lg shadow-primary/10 lg:-translate-y-3"
                )}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                    <StarIcon className="size-3 fill-current" />
                    Most popular
                  </span>
                )}

                <div>
                  <h2 className="text-xl font-semibold">{plan.name}</h2>
                  <p className="mt-2 min-h-10 text-sm leading-5 text-muted-foreground">{plan.description}</p>
                  {price ? (
                    <div className="mt-7">
                      <p className="flex items-baseline gap-1">
                        <span className="text-5xl font-semibold tracking-tight">${price}</span>
                        <span className="text-sm text-muted-foreground">/ month</span>
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {billingPeriod === "yearly"
                          ? `$${plan.yearlyPrice} billed annually${savings ? ` · Save ${savings}%` : ""}`
                          : "Billed monthly"}
                      </p>
                    </div>
                  ) : (
                    <div className="mt-7">
                      <p className="text-5xl font-semibold tracking-tight">Custom</p>
                      <p className="mt-2 text-sm text-muted-foreground">Tailored annually with your team</p>
                    </div>
                  )}
                </div>

                <ul className="mt-8 space-y-3 border-t pt-7 text-sm">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-3">
                      <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="mt-8 w-full"
                  variant={plan.popular ? "default" : "outline"}
                  render={<Link href={`/contact?plan=${encodeURIComponent(plan.name)}`} />}
                  nativeButton={false}
                >
                  {plan.name === "Enterprise" ? "Contact us" : "Get started"}
                </Button>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
