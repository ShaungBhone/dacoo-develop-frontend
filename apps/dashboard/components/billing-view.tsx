"use client"

import * as React from "react"
import {
  ArrowUpRightIcon,
  CircleAlertIcon,
  CircleCheckIcon,
  CreditCardIcon,
  DownloadIcon,
  FileTextIcon,
  HistoryIcon,
  MailIcon,
} from "@/components/ui/icons"

import { ApiError } from "@/lib/api"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { useActiveOrganization } from "@/hooks/use-active-organization"
import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  TypographyH1,
  TypographyLead,
  TypographyMuted,
} from "@/components/ui/typography"
import { PlanPickerDialog } from "@/components/plan-picker-dialog"
import {
  fetchSubscription,
  formatRetention,
  type Subscription,
} from "@/components/billing-api"

export function BillingView({ embedded = false }: { embedded?: boolean }) {
  const organization = useActiveOrganization()
  const { user } = useAuth()
  const [subscription, setSubscription] = React.useState<Subscription | null>(
    null
  )
  const [isLoadingSubscription, setIsLoadingSubscription] = React.useState(true)
  const [subscriptionError, setSubscriptionError] = React.useState<
    string | null
  >(null)
  const [planPickerOpen, setPlanPickerOpen] = React.useState(false)

  const loadSubscription = React.useCallback(async () => {
    if (!organization) {
      setIsLoadingSubscription(false)
      return
    }

    setIsLoadingSubscription(true)
    setSubscriptionError(null)
    try {
      const nextSubscription = await fetchSubscription(organization.id)
      setSubscription(nextSubscription)
    } catch (err) {
      setSubscriptionError(
        err instanceof ApiError ? err.message : "Failed to load subscription."
      )
    } finally {
      setIsLoadingSubscription(false)
    }
  }, [organization])

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSubscription()
  }, [loadSubscription])

  const handlePlanChanged = React.useCallback((next: Subscription) => {
    setSubscription(next)
    setPlanPickerOpen(false)
  }, [])

  if (!organization) {
    return (
      <div
        className={cn(
          "flex items-center justify-center",
          embedded ? "py-16" : "min-h-[calc(100vh-8rem)] p-6"
        )}
      >
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CreditCardIcon />
            </EmptyMedia>
            <EmptyTitle>No organization selected</EmptyTitle>
            <EmptyDescription>
              Select a workspace before viewing billing details.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    )
  }

  return (
    <>
      <div className={cn("flex flex-col", !embedded && "flex-1 overflow-auto")}>
        <div
          className={cn(
            "mx-auto flex w-full max-w-7xl flex-col gap-6",
            !embedded && "p-4 sm:p-6 lg:p-8"
          )}
        >
          {!embedded && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-1">
                <TypographyH1>Billing</TypographyH1>
                <TypographyLead>
                  Manage your billing and payment details.
                </TypographyLead>
              </div>
            </div>
          )}

          {subscriptionError && (
            <Alert variant="destructive">
              <CircleAlertIcon />
              <AlertTitle>Some billing details could not load</AlertTitle>
              <AlertDescription>{subscriptionError}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <CurrentPlanCard
              subscription={subscription}
              isLoading={isLoadingSubscription}
              onChangePlan={() => setPlanPickerOpen(true)}
            />
            <PaymentMethodCard email={user?.email ?? "billing@example.com"} />
          </div>
        </div>
      </div>

      {planPickerOpen && (
        <PlanPickerDialog
          organizationId={organization.id}
          currentPlanId={subscription?.plan.id ?? 0}
          onClose={() => setPlanPickerOpen(false)}
          onChanged={handlePlanChanged}
        />
      )}
    </>
  )
}

function CurrentPlanCard({
  subscription,
  isLoading,
  onChangePlan,
}: {
  subscription: Subscription | null
  isLoading: boolean
  onChangePlan: () => void
}) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    )
  }

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Current plan</CardTitle>
          <CardDescription>No active subscription found.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onChangePlan}>Choose plan</Button>
        </CardContent>
      </Card>
    )
  }

  const plan = subscription.plan
  const featurePreview = plan.features.slice(0, 3)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Current plan</CardTitle>
        <CardDescription>
          This is the plan currently attached to your workspace.
        </CardDescription>
        <CardAction>
          <SubscriptionStatusBadge status={subscription.status} />
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-heading text-xl font-medium">{plan.name}</h2>
              <Badge variant="secondary" className="capitalize">
                {plan.interval}
              </Badge>
            </div>
            <p className="text-3xl font-medium tracking-normal">
              {formatPlanPrice(plan.price)}
              <span className="text-sm font-normal text-muted-foreground">
                /{plan.interval === "yearly" ? "yr" : "mo"}
              </span>
            </p>
          </div>
          <Button onClick={onChangePlan} className="gap-2">
            Change plan
            <ArrowUpRightIcon />
          </Button>
        </div>

        {(featurePreview.length > 0 || formatRetention(plan)) && (
          <div className="grid gap-2 text-sm text-muted-foreground">
            {featurePreview.map((feature) => (
              <div key={feature} className="flex items-center gap-2">
                <CircleCheckIcon className="size-4 text-primary" />
                <span>{feature}</span>
              </div>
            ))}
            {formatRetention(plan) && (
              <div className="flex items-center gap-2">
                <HistoryIcon className="size-4 text-primary" />
                <span>{formatRetention(plan)}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t">
        <TypographyMuted>
          Plan changes use the existing plan picker and subscription flow.
        </TypographyMuted>
      </CardFooter>
    </Card>
  )
}

function PaymentMethodCard({ email }: { email: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment method</CardTitle>
        <CardDescription>
          Payment editing will be connected when a payment endpoint is
          available.
        </CardDescription>
        <CardAction>
          <Button variant="outline" disabled>
            Edit
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg border p-4">
          <div className="flex size-10 items-center justify-center rounded-md border bg-muted/50">
            <CreditCardIcon className="size-5" />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="font-medium">Visa ending in 1234</p>
            <p className="text-sm text-muted-foreground">Expiry 06/2028</p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-lg border p-4">
          <div className="flex size-10 items-center justify-center rounded-md border bg-muted/50">
            <MailIcon className="size-5" />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="font-medium">Billing email</p>
            <p className="truncate text-sm text-muted-foreground">{email}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function SubscriptionStatusBadge({
  status,
}: {
  status: Subscription["status"]
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "capitalize",
        status === "active" &&
          "border-emerald-200 bg-emerald-50 text-emerald-700",
        status !== "active" && "border-amber-200 bg-amber-50 text-amber-700"
      )}
    >
      {status}
    </Badge>
  )
}

function formatPlanPrice(price: number) {
  const amount = price / 100

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount)
}
