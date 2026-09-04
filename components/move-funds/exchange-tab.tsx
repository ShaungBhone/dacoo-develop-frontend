import * as React from "react"

import { ApiError } from "@/lib/api"
import { executeExchange, type Wallet } from "@/components/billing-api"
import { ErrorAlert } from "@/components/move-funds/error-alert"
import {
  formatAmount,
  hasPositiveAmount,
} from "@/components/move-funds/helpers"
import { QuoteSummary } from "@/components/move-funds/quote-summary"
import { useFxQuote } from "@/components/move-funds/use-fx-quote"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"

export function ExchangeTab({
  organizationId,
  wallets,
  isActive,
  onClose,
  onSuccess,
}: {
  organizationId: number
  wallets: Wallet[]
  isActive: boolean
  onClose: () => void
  onSuccess: (message: string) => void
}) {
  const [exchangeFrom, setExchangeFrom] = React.useState("")
  const [exchangeTo, setExchangeTo] = React.useState("")
  const [amount, setAmount] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const fiatWallets = React.useMemo(
    () => wallets.filter((wallet) => wallet.currency_code !== "CREDIT"),
    [wallets]
  )
  const defaultCurrency = fiatWallets[0]?.currency_code ?? ""
  const selectedFrom = fiatWallets.some(
    (wallet) => wallet.currency_code === exchangeFrom
  )
    ? exchangeFrom
    : defaultCurrency
  const selectedTo = fiatWallets.some(
    (wallet) =>
      wallet.currency_code === exchangeTo &&
      wallet.currency_code !== selectedFrom
  )
    ? exchangeTo
    : (fiatWallets.find((wallet) => wallet.currency_code !== selectedFrom)
        ?.currency_code ?? "")
  const quote = useFxQuote(selectedFrom, selectedTo, isActive)
  const estimate =
    quote.quote && hasPositiveAmount(amount)
      ? Number(amount) * Number(quote.quote.rate)
      : null

  async function handleExchange(): Promise<void> {
    if (
      !selectedFrom ||
      !selectedTo ||
      !hasPositiveAmount(amount) ||
      quote.error ||
      quote.isLoading
    )
      return

    setIsSubmitting(true)
    setError(null)
    try {
      const exchange = await executeExchange(
        organizationId,
        selectedFrom,
        selectedTo,
        amount
      )
      onSuccess(
        `Converted ${formatAmount(exchange.from_amount)} ${selectedFrom} to ${formatAmount(exchange.to_amount)} ${selectedTo}.`
      )
    } catch (reason) {
      setError(
        reason instanceof ApiError
          ? reason.message
          : "Currency exchange failed."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div hidden={!isActive} className="space-y-4 p-6">
      {fiatWallets.length < 2 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          You need at least two organization wallets to exchange funds.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="exchange-from">From wallet</FieldLabel>
              <Select
                value={selectedFrom}
                onValueChange={(currency) => {
                  if (!currency) return
                  setExchangeFrom(currency)
                  if (currency === selectedTo) {
                    setExchangeTo(
                      fiatWallets.find(
                        (wallet) => wallet.currency_code !== currency
                      )?.currency_code ?? ""
                    )
                  }
                }}
              >
                <SelectTrigger id="exchange-from">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  {fiatWallets.map((wallet) => (
                    <SelectItem key={wallet.id} value={wallet.currency_code}>
                      {wallet.currency_code} (
                      {wallet.formatted_balance ?? wallet.balance})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="exchange-to">To wallet</FieldLabel>
              <Select
                value={selectedTo}
                onValueChange={(currency) => {
                  if (currency) setExchangeTo(currency)
                }}
              >
                <SelectTrigger id="exchange-to">
                  <SelectValue placeholder="Destination" />
                </SelectTrigger>
                <SelectContent>
                  {fiatWallets
                    .filter((wallet) => wallet.currency_code !== selectedFrom)
                    .map((wallet) => (
                      <SelectItem key={wallet.id} value={wallet.currency_code}>
                        {wallet.currency_code}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="exchange-amount">Amount</FieldLabel>
            <Input
              id="exchange-amount"
              type="number"
              min="0"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </Field>
          <QuoteSummary
            quote={quote.quote}
            isLoading={quote.isLoading}
            error={quote.error}
            from={selectedFrom}
            to={selectedTo}
            estimate={estimate}
          />
          {error && <ErrorAlert message={error} />}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleExchange}
              disabled={
                isSubmitting ||
                !hasPositiveAmount(amount) ||
                quote.isLoading ||
                Boolean(quote.error) ||
                !quote.quote ||
                quote.isSameCurrency
              }
              className="flex-1"
            >
              {isSubmitting ? <Spinner className="size-4" /> : "Convert"}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
