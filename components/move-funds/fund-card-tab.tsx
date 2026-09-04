import * as React from "react"
import { ChevronDownIcon, CreditCardIcon, WalletIcon } from "@/components/ui/icons"

import { ApiError } from "@/lib/api"
import { type Wallet } from "@/components/billing-api"
import { fundCardWallet, type CardOrder } from "@/components/card-order-api"
import { ErrorAlert } from "@/components/move-funds/error-alert"
import {
  formatAmount,
  hasPositiveAmount,
} from "@/components/move-funds/helpers"
import { QuoteSummary } from "@/components/move-funds/quote-summary"
import { useFxQuote } from "@/components/move-funds/use-fx-quote"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Spinner } from "@/components/ui/spinner"

type SearchSelectOption = {
  value: string
  label: string
}

function SearchSelect({
  label,
  placeholder,
  value,
  options,
  onValueChange,
}: {
  label: string
  placeholder: string
  value: string
  options: SearchSelectOption[]
  onValueChange: (value: string) => void
}) {
  const [open, setOpen] = React.useState(false)
  const selectedOption = options.find((option) => option.value === value)

  return (
    <DropdownMenu modal={false} open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label={label}
            className="w-full justify-between font-normal"
          />
        }
      >
        <span className="truncate">{selectedOption?.label ?? placeholder}</span>
        <ChevronDownIcon data-icon="inline-end" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="p-0" align="start">
        <Command>
          <CommandInput placeholder={`Search ${label.toLowerCase()}`} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  data-checked={option.value === value}
                  onSelect={() => {
                    onValueChange(option.value)
                    setOpen(false)
                  }}
                >
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function FundCardTab({
  organizationId,
  wallets,
  cardOrders,
  eligibleCardOrders,
  isActive,
  onClose,
  onSuccess,
  onOpenCardBalance,
}: {
  organizationId: number
  wallets: Wallet[]
  cardOrders: CardOrder[]
  eligibleCardOrders: CardOrder[]
  isActive: boolean
  onClose: () => void
  onSuccess: (message: string) => void
  onOpenCardBalance?: () => void
}) {
  const [fundSource, setFundSource] = React.useState("")
  const [fundCardId, setFundCardId] = React.useState("")
  const [amount, setAmount] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const fiatWallets = React.useMemo(
    () => wallets.filter((wallet) => wallet.currency_code !== "CREDIT"),
    [wallets]
  )
  const activeCards = React.useMemo(
    () =>
      cardOrders.filter(
        (order) => order.status === "shipped" && order.wallet !== null
      ),
    [cardOrders]
  )
  const defaultCurrency = fiatWallets[0]?.currency_code ?? ""
  const selectedSource = fiatWallets.some(
    (wallet) => wallet.currency_code === fundSource
  )
    ? fundSource
    : defaultCurrency
  const selectedCardId = activeCards.some((card) => card.id === fundCardId)
    ? fundCardId
    : (activeCards[0]?.id ?? "")
  const selectedCard = activeCards.find((card) => card.id === selectedCardId)
  const quote = useFxQuote(
    selectedSource,
    selectedCard?.wallet?.currency_code ?? "",
    isActive
  )
  const estimate =
    quote.quote && hasPositiveAmount(amount)
      ? Number(amount) * Number(quote.quote.rate)
      : null

  async function handleFundCard(): Promise<void> {
    if (
      !selectedSource ||
      !selectedCard ||
      !hasPositiveAmount(amount) ||
      quote.error ||
      quote.isLoading
    )
      return

    setIsSubmitting(true)
    setError(null)
    try {
      const transfer = await fundCardWallet(
        organizationId,
        selectedCard.id,
        selectedSource,
        amount
      )
      onSuccess(
        `Funded card *${selectedCard.card?.last_four ?? ""} with ${formatAmount(transfer.to_amount)} ${transfer.to_wallet.currency_code}.`
      )
    } catch (reason) {
      setError(
        reason instanceof ApiError ? reason.message : "Card funding failed."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div hidden={!isActive} className="space-y-4 p-6">
      {activeCards.length > 0 &&
        eligibleCardOrders.length > 0 &&
        onOpenCardBalance && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/10 p-3">
            <p className="text-xs text-muted-foreground">
              Another issued card is ready for a balance.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={onOpenCardBalance}
            >
              <WalletIcon className="size-4" />
              Open a balance
            </Button>
          </div>
        )}
      {activeCards.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center text-sm text-muted-foreground">
          <CreditCardIcon className="size-8 opacity-50" />
          {eligibleCardOrders.length > 0 && onOpenCardBalance ? (
            <>
              <span>No card balances are available to fund yet.</span>
              <p className="max-w-xs text-xs">
                Open a balance for an issued card, then return here to add
                funds.
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={onOpenCardBalance}
              >
                <WalletIcon className="size-4" />
                Open a balance
              </Button>
            </>
          ) : (
            <>
              <span>No issued cards with an opened balance are available.</span>
              <p className="max-w-xs text-xs">
                You need a current issued card before you can open a balance and
                fund it.
              </p>
            </>
          )}
        </div>
      ) : (
        <>
          <QuoteSummary
            quote={quote.quote}
            isLoading={quote.isLoading}
            error={quote.error}
            from={selectedSource}
            to={selectedCard?.wallet?.currency_code ?? ""}
            estimate={estimate}
          />
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel>From wallet</FieldLabel>
              <SearchSelect
                label="From wallet"
                placeholder="Select a wallet"
                value={selectedSource}
                options={fiatWallets.map((wallet) => ({
                  value: wallet.currency_code,
                  label: `${wallet.currency_code} (${formatAmount(wallet.balance)})`,
                }))}
                onValueChange={setFundSource}
              />
            </Field>
            <Field>
              <FieldLabel>Destination card</FieldLabel>
              <SearchSelect
                label="Destination card"
                placeholder="Select a card"
                value={selectedCardId}
                options={activeCards.map((card) => ({
                  value: card.id,
                  label: `${card.purpose.trim() || card.design.name} (*${card.card?.last_four})`,
                }))}
                onValueChange={setFundCardId}
              />
            </Field>
          </FieldGroup>
          <Field>
            <FieldLabel htmlFor="fund-amount">Amount</FieldLabel>
            <Input
              id="fund-amount"
              type="number"
              min="0"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </Field>
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
              onClick={handleFundCard}
              disabled={
                isSubmitting ||
                !hasPositiveAmount(amount) ||
                quote.isLoading ||
                Boolean(quote.error) ||
                !quote.quote ||
                !selectedCard
              }
              className="flex-1"
            >
              {isSubmitting ? <Spinner className="size-4" /> : "Fund card"}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
