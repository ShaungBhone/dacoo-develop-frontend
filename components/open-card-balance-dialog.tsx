"use client"

import * as React from "react"
import { CircleAlertIcon, CircleDollarSignIcon } from "@/components/ui/icons"

import { ApiError } from "@/lib/api"
import {
  fetchCurrencies,
  SUPPORTED_CURRENCY_CODES,
  type Currency,
} from "@/components/settings/currency-api"
import { openCardBalance, type CardOrder } from "@/components/card-order-api"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Skeleton } from "@/components/ui/skeleton"

function cardLabel(cardOrder: CardOrder): string {
  const title = cardOrder.purpose.trim() || cardOrder.design.name
  return `${title} •••• ${cardOrder.card?.last_four ?? "—"}`
}

export function OpenCardBalanceDialog({
  organizationId,
  cardOrders,
  selectedCardOrderId,
  onClose,
  onOpened,
}: {
  organizationId: number
  cardOrders: CardOrder[]
  selectedCardOrderId?: string
  onClose: () => void
  onOpened: (order: CardOrder) => void
}) {
  const [currencies, setCurrencies] = React.useState<Currency[]>([])
  const [isLoadingCurrencies, setIsLoadingCurrencies] = React.useState(true)
  const [loadError, setLoadError] = React.useState<string | null>(null)
  const initialCardOrderId =
    selectedCardOrderId ??
    (cardOrders.length === 1 ? cardOrders[0]?.id : undefined)
  const [cardOrderId, setCardOrderId] = React.useState<string | undefined>(
    initialCardOrderId
  )
  const [currencyCode, setCurrencyCode] = React.useState<string | undefined>()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [submitError, setSubmitError] = React.useState<string | null>(null)
  const selectedCardOrder = cardOrders.find(
    (cardOrder) => cardOrder.id === cardOrderId
  )
  const shouldSelectCard = cardOrders.length > 1
  const supportedCurrencies = React.useMemo(
    () =>
      currencies.filter((currency) =>
        SUPPORTED_CURRENCY_CODES.has(currency.code)
      ),
    [currencies]
  )

  async function loadCurrencies() {
    setIsLoadingCurrencies(true)
    setLoadError(null)
    try {
      setCurrencies(await fetchCurrencies())
    } catch (err) {
      setLoadError(
        err instanceof ApiError ? err.message : "Failed to load currencies."
      )
    } finally {
      setIsLoadingCurrencies(false)
    }
  }

  React.useEffect(() => {
    let cancelled = false

    async function run() {
      try {
        const result = await fetchCurrencies()
        if (!cancelled) setCurrencies(result)
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            err instanceof ApiError ? err.message : "Failed to load currencies."
          )
        }
      } finally {
        if (!cancelled) setIsLoadingCurrencies(false)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [])

  async function handleConfirm() {
    if (!currencyCode || !selectedCardOrder) return

    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const updated = await openCardBalance(
        organizationId,
        selectedCardOrder.id,
        currencyCode
      )
      onOpened(updated)
      onClose()
    } catch (err) {
      setSubmitError(
        err instanceof ApiError ? err.message : "Failed to open a balance."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[85vh] max-w-sm flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b border-border px-5 py-4">
          <DialogTitle>Open a balance</DialogTitle>
          <DialogDescription>
            {shouldSelectCard
              ? "Choose the card and currency for this balance."
              : "Choose a currency for this balance."}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {isLoadingCurrencies ? (
            <Skeleton className="h-9 w-full" />
          ) : loadError ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <CircleAlertIcon
                className="size-6 text-destructive"
                aria-hidden="true"
              />
              <p className="text-sm text-muted-foreground">{loadError}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={loadCurrencies}
              >
                Retry
              </Button>
            </div>
          ) : (
            <FieldGroup>
              {shouldSelectCard && (
                <Field data-invalid={!!submitError}>
                  <FieldLabel htmlFor="card-balance-card">Card</FieldLabel>
                  <Select
                    value={cardOrderId}
                    onValueChange={(val) => setCardOrderId(val ?? undefined)}
                    disabled={isSubmitting}
                    aria-invalid={!!submitError}
                  >
                    <SelectTrigger id="card-balance-card" className="w-full">
                      <SelectValue placeholder="Select a card" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {cardOrders.map((cardOrder) => (
                          <SelectItem key={cardOrder.id} value={cardOrder.id}>
                            {cardLabel(cardOrder)}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
              )}
              <Field data-invalid={!!submitError}>
                <FieldLabel>Currency</FieldLabel>
                <RadioGroup
                  value={currencyCode}
                  onValueChange={setCurrencyCode}
                  disabled={isSubmitting}
                  aria-invalid={!!submitError}
                  aria-label="Choose a balance currency"
                  className="gap-2"
                >
                  {supportedCurrencies.map((currency) => (
                    <div
                      key={currency.code}
                      className="relative flex min-h-14 w-full items-center gap-3 rounded-xl border border-input bg-background px-3 py-2 shadow-xs transition-colors outline-none focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 hover:border-muted-foreground/40 has-data-checked:border-primary/50 has-data-checked:bg-primary/5"
                    >
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <CircleDollarSignIcon
                          className="size-4"
                          aria-hidden="true"
                        />
                      </span>
                      <div className="grid min-w-0 grow gap-0.5">
                        <Label
                          htmlFor={`card-balance-currency-${currency.code}`}
                          className="after:absolute after:inset-0"
                        >
                          {currency.code}
                        </Label>
                        <p
                          id={`card-balance-currency-${currency.code}-description`}
                          className="truncate text-sm text-muted-foreground"
                        >
                          {currency.name}
                        </p>
                      </div>
                      <RadioGroupItem
                        value={currency.code}
                        id={`card-balance-currency-${currency.code}`}
                        aria-describedby={`card-balance-currency-${currency.code}-description`}
                        className="ml-auto size-5 [&_[data-slot=radio-group-indicator]>span]:size-2.5"
                      />
                    </div>
                  ))}
                </RadioGroup>
                {submitError && <FieldError>{submitError}</FieldError>}
              </Field>
            </FieldGroup>
          )}
        </div>

        <DialogFooter className="shrink-0 border-t border-border px-5 py-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={
              !selectedCardOrder ||
              !currencyCode ||
              isSubmitting ||
              isLoadingCurrencies
            }
          >
            {isSubmitting ? "Opening…" : "Open balance"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
