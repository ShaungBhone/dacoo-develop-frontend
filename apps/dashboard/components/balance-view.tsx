"use client"

import * as React from "react"
import Link from "next/link"
import {
  CircleAlertIcon,
  CreditCardIcon,
  LandmarkIcon,
  PlusIcon,
  Repeat2Icon,
  SearchIcon,
} from "@/components/ui/icons"

import { useActiveOrganization } from "@/hooks/use-active-organization"
import { useCurrencySettings } from "@/contexts/currency-settings-context"
import { ApiError } from "@/lib/api"
import { type CurrencySettings } from "@/components/settings/currency-api"
import { formatCurrencyAmount, formatCurrencyNumber } from "@/lib/currency"
import {
  fetchFxRate,
  fetchWallets,
  CREDIT_CURRENCY,
  type Wallet,
} from "@/components/billing-api"
import {
  AddMoneyDialog,
  type MoveFundsAction,
} from "@/components/add-money-dialog"
import { fetchCardOrders, type CardOrder } from "@/components/card-order-api"
import { OpenCardBalanceDialog } from "@/components/open-card-balance-dialog"
import { PaymentCard, isCardTheme } from "@/components/payment-card"
import { CurrencyFlag } from "@/components/currency-flag"
import {
  fetchTransactions,
  type Transaction,
} from "@/components/transactions-api"
import { TransactionList } from "@/components/transactions-view"
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/reui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Skeleton } from "@/components/ui/skeleton"
import { TypographyH4 } from "@/components/ui/typography"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

const currencyNames: Record<string, string> = {
  BND: "Brunei Dollar",
  EUR: "Euro",
  IDR: "Indonesian Rupiah",
  KHR: "Cambodian Riel",
  LAK: "Lao Kip",
  MMK: "Myanmar Kyat",
  MYR: "Malaysian Ringgit",
  PHP: "Philippine Peso",
  SGD: "Singapore Dollar",
  THB: "Thai Baht",
  USD: "US Dollar",
  VND: "Vietnamese Dong",
}

/* -------------------------------------------------------------------------- */
/*                                Sub-components                              */
/* -------------------------------------------------------------------------- */

function convertCurrency(
  amount: string,
  from: string,
  to: string,
  rates: Record<string, number>
): number | null {
  const value = parseFloat(amount)
  if (isNaN(value)) return null
  if (from === to) return value

  const rate = rates[from]
  return typeof rate === "number" && Number.isFinite(rate) ? value * rate : null
}

function TotalBalanceHero({
  currencyWallets,
  cardBalances,
  primaryCurrency,
  fxRates,
  currencySettings,
  isLoadingWallets,
  canOpenBalance,
  openTileLabel,
  onOpenBalance,
  onMoveFundsAction,
}: {
  currencyWallets: Wallet[]
  cardBalances: CardOrder[]
  primaryCurrency: string
  fxRates: Record<string, number>
  currencySettings: CurrencySettings | null
  isLoadingWallets: boolean
  canOpenBalance: boolean
  openTileLabel: string
  onOpenBalance: () => void
  onMoveFundsAction: (action: MoveFundsAction) => void
}) {
  const total = React.useMemo(() => {
    let sum = 0
    for (const w of currencyWallets) {
      const converted = convertCurrency(
        w.balance,
        w.currency_code,
        primaryCurrency,
        fxRates
      )
      if (converted === null) return null
      sum += converted
    }
    for (const order of cardBalances) {
      if (order.wallet) {
        const converted = convertCurrency(
          order.wallet.balance,
          order.wallet.currency_code,
          primaryCurrency,
          fxRates
        )
        if (converted === null) return null
        sum += converted
      }
    }
    return sum
  }, [currencyWallets, cardBalances, primaryCurrency, fxRates])

  const formattedTotal =
    isLoadingWallets || total === null
      ? "—"
      : formatCurrencyAmount(
          total.toFixed(2),
          primaryCurrency,
          currencySettings
        )
  return (
    <section className="flex flex-col gap-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(27rem,0.95fr)_minmax(0,1fr)] lg:items-stretch">
        <div className="flex min-h-30 flex-col justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-muted-foreground">
              Total balances
            </p>
            <p className="font-mono text-3xl font-semibold tracking-tight tabular-nums">
              {formattedTotal}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {canOpenBalance ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onOpenBalance}
              >
                <PlusIcon data-icon="inline-start" />
                Open balance
              </Button>
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger render={<span className="w-fit" />}>
                    <Button type="button" variant="outline" size="sm" disabled>
                      <PlusIcon data-icon="inline-start" />
                      Open balance
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-56">
                    {openTileLabel === "No eligible cards"
                      ? "Issue a card without a balance, then return here to open its balance."
                      : openTileLabel}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onMoveFundsAction("deposit")}
            >
              <LandmarkIcon data-icon="inline-start" />
              Deposit
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onMoveFundsAction("exchange")}
            >
              <Repeat2Icon data-icon="inline-start" />
              Convert
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onMoveFundsAction("fund-card")}
            >
              <CreditCardIcon data-icon="inline-start" />
              Cards
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 content-start items-start gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {isLoadingWallets ? (
            <>
              <BalanceCardSkeleton />
              <BalanceCardSkeleton />
              <BalanceCardSkeleton />
            </>
          ) : currencyWallets.length > 0 ? (
            currencyWallets.map((wallet) => (
              <BalanceCard
                key={wallet.id}
                wallet={wallet}
                currencySettings={currencySettings}
              />
            ))
          ) : (
            <p className="col-span-full self-center text-sm text-muted-foreground">
              No balances yet.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

function BalanceCard({
  wallet,
  currencySettings,
}: {
  wallet: Wallet
  currencySettings: CurrencySettings | null
}) {
  return (
    <Card className="relative min-h-14 gap-0 rounded-lg py-0 shadow-none">
      <span
        aria-hidden="true"
        className="absolute inset-y-4 left-0 w-0.5 rounded-r-full bg-primary"
      />
      <CardContent className="flex h-full items-center justify-between gap-3 px-4 py-2.5">
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="text-xs font-medium text-muted-foreground">
            {currencyNames[wallet.currency_code] ?? wallet.currency_code}
          </p>
          <p className="flex items-baseline gap-1 font-mono text-lg leading-none font-semibold tracking-tight tabular-nums">
            {formatCurrencyNumber(wallet.balance, currencySettings)}
            <span className="text-xs font-medium text-foreground">
              {wallet.currency_code}
            </span>
          </p>
        </div>
        <CurrencyFlag currencyCode={wallet.currency_code} className="size-5" />
      </CardContent>
    </Card>
  )
}

function cardTitle(order: CardOrder): string {
  return order.purpose.trim() || order.design.name
}

function formatCardBalance(
  order: CardOrder,
  currencySettings: CurrencySettings | null
): string {
  const wallet = order.wallet
  if (!wallet) return ""

  return formatCurrencyAmount(
    wallet.balance,
    wallet.currency_code,
    currencySettings
  )
}

function isExpiryPast(expiryDate: string | null): boolean {
  if (!expiryDate) return false

  const [month, year] = expiryDate.split("/").map(Number)
  if (!month || !year) return false

  const expiry = new Date(2000 + year, month, 0, 23, 59, 59)
  return expiry.getTime() < Date.now()
}

function isCurrentIssuedCard(order: CardOrder): boolean {
  return (
    order.status === "shipped" &&
    order.card !== null &&
    !isExpiryPast(order.card.expiry_date)
  )
}

function CardBalanceCard({
  order,
  currencySettings,
}: {
  order: CardOrder
  currencySettings: CurrencySettings | null
}) {
  const wallet = order.wallet
  if (!wallet || !order.card) return null

  return (
    <PaymentCard
      theme={
        isCardTheme(order.design.theme) ? order.design.theme : "gray-strip"
      }
      title={cardTitle(order)}
      balance={formatCardBalance(order, currencySettings)}
      last4={order.card.last_four}
      expiry={order.card.expiry_date ?? undefined}
      cardholder={order.card.cardholder_name ?? undefined}
    />
  )
}

function BalanceCardSkeleton() {
  return (
    <Card className="min-h-19 gap-0 rounded-xl border-l-2 border-l-border py-0 shadow-none">
      <CardContent className="flex h-full flex-col justify-center gap-2 px-3 py-2.5">
        <Skeleton className="h-3 w-20 rounded-md" />
        <Skeleton className="h-5 w-28 rounded-md" />
      </CardContent>
    </Card>
  )
}

/* -------------------------------------------------------------------------- */
/*                               Main BalanceView                             */
/* -------------------------------------------------------------------------- */

export function BalanceView() {
  const organization = useActiveOrganization()
  const { settings: currencySettings } = useCurrencySettings()

  const [wallets, setWallets] = React.useState<Wallet[]>([])
  const [isLoadingWallets, setIsLoadingWallets] = React.useState(true)
  const [walletsError, setWalletsError] = React.useState<string | null>(null)

  const [cardOrders, setCardOrders] = React.useState<CardOrder[]>([])
  const [isLoadingCardOrders, setIsLoadingCardOrders] = React.useState(true)
  const [cardOrdersError, setCardOrdersError] = React.useState<string | null>(
    null
  )
  const [transactions, setTransactions] = React.useState<Transaction[]>([])
  const [isLoadingTransactions, setIsLoadingTransactions] = React.useState(true)
  const [transactionSearch, setTransactionSearch] = React.useState("")
  const [fxRates, setFxRates] = React.useState<Record<string, number>>({})

  const [moveFunds, setMoveFunds] = React.useState<{
    action: MoveFundsAction
    organizationId: number
  } | null>(null)
  const [openCardBalanceOrganizationId, setOpenCardBalanceOrganizationId] =
    React.useState<number | null>(null)

  const currencyWallets = React.useMemo(
    () => wallets.filter((w) => w.currency_code !== CREDIT_CURRENCY),
    [wallets]
  )

  const loadWallets = React.useCallback(async () => {
    if (!organization) return []
    return fetchWallets(organization.id)
  }, [organization])

  const loadCardOrders = React.useCallback(async () => {
    if (!organization) return []
    return fetchCardOrders(organization.id)
  }, [organization])

  React.useEffect(() => {
    let cancelled = false

    async function run() {
      setIsLoadingWallets(true)
      setWallets([])
      setWalletsError(null)
      try {
        const result = await loadWallets()
        if (!cancelled) setWallets(result)
      } catch (err) {
        if (!cancelled) {
          setWalletsError(
            err instanceof ApiError ? err.message : "Failed to load balances."
          )
        }
      } finally {
        if (!cancelled) setIsLoadingWallets(false)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [loadWallets])

  React.useEffect(() => {
    let cancelled = false

    async function run() {
      setIsLoadingCardOrders(true)
      setCardOrders([])
      setCardOrdersError(null)
      try {
        const result = await loadCardOrders()
        if (!cancelled) setCardOrders(result)
      } catch (err) {
        if (!cancelled) {
          setCardOrdersError(
            err instanceof ApiError
              ? err.message
              : "Failed to load organization cards."
          )
        }
      } finally {
        if (!cancelled) setIsLoadingCardOrders(false)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [loadCardOrders])

  React.useEffect(() => {
    let cancelled = false

    async function run() {
      if (!organization) {
        setTransactions([])
        setIsLoadingTransactions(false)
        return
      }

      setIsLoadingTransactions(true)
      try {
        const result = await fetchTransactions(organization.id)
        if (!cancelled) {
          setTransactions(
            result.sort(
              (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime()
            )
          )
        }
      } catch {
        if (!cancelled) setTransactions([])
      } finally {
        if (!cancelled) setIsLoadingTransactions(false)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [organization])

  async function reloadWallets() {
    setWallets(await loadWallets())
  }

  async function reloadCardOrders() {
    setCardOrdersError(null)
    setIsLoadingCardOrders(true)
    try {
      setCardOrders(await loadCardOrders())
    } catch (err) {
      setCardOrdersError(
        err instanceof ApiError
          ? err.message
          : "Failed to load organization cards."
      )
    } finally {
      setIsLoadingCardOrders(false)
    }
  }

  const currentIssuedCards = React.useMemo(
    () => cardOrders.filter(isCurrentIssuedCard),
    [cardOrders]
  )
  const eligibleCardOrders = React.useMemo(
    () => currentIssuedCards.filter((order) => order.wallet === null),
    [currentIssuedCards]
  )
  const cardBalances = React.useMemo(
    () => currentIssuedCards.filter((order) => order.wallet !== null),
    [currentIssuedCards]
  )
  const visibleTransactions = React.useMemo(() => {
    const query = transactionSearch.trim().toLowerCase()
    const matchingTransactions = query
      ? transactions.filter((transaction) =>
          [
            transaction.description,
            transaction.model,
            transaction.currency_code,
          ]
            .filter((value): value is string => Boolean(value))
            .some((value) => value.toLowerCase().includes(query))
        )
      : transactions

    return matchingTransactions.slice(0, 6)
  }, [transactionSearch, transactions])
  const primaryCurrency = currencySettings?.code?.toUpperCase() ?? "USD"
  const balanceCurrencies = React.useMemo(() => {
    const currencies = new Set(
      currencyWallets.map((wallet) => wallet.currency_code.toUpperCase())
    )

    for (const order of cardBalances) {
      if (order.wallet) currencies.add(order.wallet.currency_code.toUpperCase())
    }

    currencies.delete(primaryCurrency)
    return [...currencies].sort()
  }, [cardBalances, currencyWallets, primaryCurrency])

  React.useEffect(() => {
    let cancelled = false

    async function run() {
      if (balanceCurrencies.length === 0) {
        setFxRates({})
        return
      }

      setFxRates({})

      const results = await Promise.allSettled(
        balanceCurrencies.map(async (currency) => {
          const quote = await fetchFxRate(currency, primaryCurrency)
          const rate = Number(quote.rate)
          if (!Number.isFinite(rate) || rate <= 0) {
            throw new Error("Invalid FX rate")
          }
          return [currency, rate] as const
        })
      )

      if (cancelled) return

      const nextRates: Record<string, number> = {}
      results.forEach((result, index) => {
        const currency = balanceCurrencies[index]
        if (result.status === "fulfilled") {
          nextRates[currency] = result.value[1]
        }
      })

      setFxRates(nextRates)
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [balanceCurrencies, primaryCurrency])

  const canOpenCardBalance =
    !isLoadingCardOrders && !cardOrdersError && eligibleCardOrders.length > 0
  const openTileLabel = isLoadingCardOrders
    ? "Loading cards…"
    : cardOrdersError
      ? "Cards unavailable"
      : eligibleCardOrders.length > 0
        ? "Open a new balance"
        : "No eligible cards"

  return (
    <>
      <div className="min-h-0 flex-1 overflow-auto">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 p-6 sm:p-8">
          <TotalBalanceHero
            currencyWallets={currencyWallets}
            cardBalances={cardBalances}
            primaryCurrency={primaryCurrency}
            fxRates={fxRates}
            currencySettings={currencySettings}
            isLoadingWallets={isLoadingWallets}
            canOpenBalance={canOpenCardBalance}
            openTileLabel={openTileLabel}
            onOpenBalance={() =>
              setOpenCardBalanceOrganizationId(organization?.id ?? null)
            }
            onMoveFundsAction={(action) => {
              if (organization) {
                setMoveFunds({ action, organizationId: organization.id })
              }
            }}
          />

          {walletsError && (
            <p className="text-sm text-destructive">{walletsError}</p>
          )}

          <section className="flex flex-col gap-3">
            {cardOrdersError && (
              <Alert variant="destructive">
                <CircleAlertIcon aria-hidden="true" />
                <AlertTitle>Couldn&apos;t load organization cards</AlertTitle>
                <AlertDescription>{cardOrdersError}</AlertDescription>
                <AlertAction>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void reloadCardOrders()}
                  >
                    Retry
                  </Button>
                </AlertAction>
              </Alert>
            )}
          </section>

          <section className="mx-auto flex w-full max-w-5xl flex-col gap-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <TypographyH4 className="text-xl text-foreground">
                Transactions
              </TypographyH4>
              <InputGroup className="w-full sm:max-w-72">
                <InputGroupAddon>
                  <SearchIcon />
                </InputGroupAddon>
                <InputGroupInput
                  value={transactionSearch}
                  onChange={(event) => setTransactionSearch(event.target.value)}
                  placeholder="Search transactions"
                  aria-label="Search transactions"
                />
              </InputGroup>
            </div>

            {isLoadingTransactions ? (
              <div className="flex flex-col gap-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : visibleTransactions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No transactions match your search.
              </p>
            ) : (
              <TransactionList
                transactions={visibleTransactions}
                currencySettings={currencySettings}
              />
            )}

            <Button
              variant="link"
              className="w-fit px-0"
              nativeButton={false}
              render={<Link href="/transactions" />}
            >
              View all transactions
            </Button>
          </section>

          {(isLoadingCardOrders || cardBalances.length > 0) && (
            <section className="flex flex-col gap-4">
              <TypographyH4 className="text-foreground">
                Card balances
              </TypographyH4>
              <div className="flex flex-wrap gap-4">
                {isLoadingCardOrders ? (
                  <>
                    <BalanceCardSkeleton />
                    <BalanceCardSkeleton />
                  </>
                ) : (
                  cardBalances.map((order) => (
                    <CardBalanceCard
                      key={order.id}
                      order={order}
                      currencySettings={currencySettings}
                    />
                  ))
                )}
              </div>
            </section>
          )}
        </div>
      </div>

      {moveFunds &&
        moveFunds.organizationId === organization?.id &&
        organization && (
          <AddMoneyDialog
            organizationId={organization.id}
            wallets={wallets}
            initialAction={moveFunds.action}
            cardOrders={cardBalances}
            eligibleCardOrders={eligibleCardOrders}
            onClose={() => setMoveFunds(null)}
            onExchanged={() => {
              void reloadWallets()
              void reloadCardOrders()
            }}
            onOpenCardBalance={() =>
              setOpenCardBalanceOrganizationId(organization.id)
            }
          />
        )}

      {openCardBalanceOrganizationId === organization?.id && organization && (
        <OpenCardBalanceDialog
          organizationId={organization.id}
          cardOrders={eligibleCardOrders}
          onClose={() => setOpenCardBalanceOrganizationId(null)}
          onOpened={() => {
            void reloadCardOrders()
          }}
        />
      )}
    </>
  )
}
