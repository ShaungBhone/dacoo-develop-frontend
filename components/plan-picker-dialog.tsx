"use client"

import * as React from "react"
import { ArrowUpRightIcon, CircleAlertIcon } from "@/components/ui/icons"

import { cn } from "@/lib/utils"
import { ApiError } from "@/lib/api"
import { useCurrencySettings } from "@/contexts/currency-settings-context"
import { formatCurrencyAmount } from "@/lib/currency"
import type { CurrencySettings } from "@/components/settings/currency-api"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  fetchPlans,
  changePlan,
  formatRetention,
  type Plan,
  type PlanCurrency,
  type Subscription,
} from "@/components/billing-api"

function formatPrice(
  plan: Plan,
  currency: PlanCurrency,
  settings: CurrencySettings | null
): string {
  const amount = plan.prices[currency]
  const suffix = plan.interval === "monthly" ? "mo" : "yr"
  const price = currency === "USD" ? amount / 100 : amount
  return `${formatCurrencyAmount(price, currency, settings)}/${suffix}`
}

function formatCredits(plan: Plan): string | null {
  const credits = plan.limits?.credits_per_cycle
  if (credits === undefined) return null
  if (credits < 0) return "Unlimited credits/mo"
  return `${credits.toLocaleString()} credits/mo`
}

export function PlanPickerDialog({
  organizationId,
  currentPlanId,
  onClose,
  onChanged,
}: {
  organizationId: number
  currentPlanId: number
  onClose: () => void
  onChanged: (subscription: Subscription) => void
}) {
  const { settings: currencySettings } = useCurrencySettings()
  const [plans, setPlans] = React.useState<Plan[]>([])
  const [isLoadingPlans, setIsLoadingPlans] = React.useState(true)
  const [loadError, setLoadError] = React.useState<string | null>(null)
  const [selectedPlanId, setSelectedPlanId] =
    React.useState<number>(currentPlanId)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [submitError, setSubmitError] = React.useState<string | null>(null)
  // Plan prices are only computed in USD and MMK — an organization on any
  // other configured currency (e.g. the THB default) sees USD.
  const displayCurrency: PlanCurrency =
    currencySettings?.code === "MMK" ? "MMK" : "USD"

  const loadPlans = React.useCallback(async () => {
    setIsLoadingPlans(true)
    setLoadError(null)
    try {
      const list = await fetchPlans()
      setPlans(list)
    } catch (err) {
      setLoadError(
        err instanceof ApiError ? err.message : "Failed to load plans."
      )
    } finally {
      setIsLoadingPlans(false)
    }
  }, [])

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPlans()
  }, [loadPlans])

  async function handleConfirm() {
    if (selectedPlanId === currentPlanId) return
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const updated = await changePlan(organizationId, selectedPlanId)
      onChanged(updated)
      onClose()
    } catch (err) {
      setSubmitError(
        err instanceof ApiError ? err.message : "Failed to change plan."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedPlan = plans.find((p) => p.id === selectedPlanId)

  return (
    <Dialog
      open={true}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="max-w-lg gap-0 p-0">
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle>Change Plan</DialogTitle>
          <DialogDescription>
            Switching plans applies immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 p-5">
          {isLoadingPlans ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : loadError ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <CircleAlertIcon
                className="size-6 text-destructive"
                aria-hidden="true"
              />
              <p className="text-sm text-muted-foreground">{loadError}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={loadPlans}
              >
                Retry
              </Button>
            </div>
          ) : (
            <ToggleGroup
              type="single"
              value={String(selectedPlanId)}
              onValueChange={(val) => {
                if (val !== "") setSelectedPlanId(Number(val))
              }}
              orientation="vertical"
              spacing={2}
              className="w-full flex-col items-stretch gap-2"
            >
              {plans.map((plan) => (
                <ToggleGroupItem
                  key={plan.id}
                  value={String(plan.id)}
                  className={cn(
                    "flex h-auto items-center justify-between rounded-lg border border-border bg-background px-4 py-3 text-left transition-colors hover:bg-muted/40 data-[state=on]:border-primary data-[state=on]:bg-primary/10 data-[state=on]:text-foreground",
                    "w-full text-left"
                  )}
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        {plan.name}
                      </span>
                      {plan.id === currentPlanId && (
                        <Badge variant="secondary" className="shadow-none">
                          Current plan
                        </Badge>
                      )}
                    </div>
                    {formatCredits(plan) && (
                      <span className="text-xs font-normal text-muted-foreground">
                        {formatCredits(plan)}
                      </span>
                    )}
                    {formatRetention(plan) && (
                      <span className="text-xs font-normal text-muted-foreground">
                        {formatRetention(plan)}
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-base font-bold text-foreground tabular-nums">
                    {formatPrice(plan, displayCurrency, currencySettings)}
                  </span>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-border px-5 py-4">
          {submitError && (
            <p className="text-sm text-destructive">{submitError}</p>
          )}
          <Button
            type="button"
            size="lg"
            onClick={handleConfirm}
            disabled={
              isLoadingPlans || isSubmitting || selectedPlanId === currentPlanId
            }
            className="w-full"
          >
            {isSubmitting ? (
              <Spinner className="size-4" />
            ) : (
              <ArrowUpRightIcon data-icon="inline-start" aria-hidden="true" />
            )}
            {selectedPlanId === currentPlanId
              ? "Current Plan"
              : selectedPlan
                ? `Switch to ${selectedPlan.name}`
                : "Confirm Plan Change"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
