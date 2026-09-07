"use client"

import * as React from "react"
import { PlusCircleIcon, WalletIcon } from "@/components/ui/icons"

import { OrderCardFlow } from "@/components/order-card-flow"
import {
  fetchCardOrders,
  type CardOrder,
  type CardOrderStatus,
} from "@/components/card-order-api"
import { OpenCardBalanceDialog } from "@/components/open-card-balance-dialog"
import {
  PaymentCard,
  isCardTheme,
  type CardTheme,
} from "@/components/payment-card"
import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { TypographyH1, TypographyH4 } from "@/components/ui/typography"
import { useActiveOrganization } from "@/hooks/use-active-organization"
import { useCurrencySettings } from "@/contexts/currency-settings-context"
import { type CurrencySettings } from "@/components/settings/currency-api"
import { formatCurrencyAmount } from "@/lib/currency"

/* -------------------------------------------------------------------------- */
/*                               Issued Card Helpers                          */
/* -------------------------------------------------------------------------- */

function isExpiryPast(expiryDate: string | null): boolean {
  if (!expiryDate) return false

  const [month, year] = expiryDate.split("/").map(Number)
  if (!month || !year) return false

  const expiry = new Date(2000 + year, month, 0, 23, 59, 59)
  return expiry.getTime() < Date.now()
}

function issuedCards(orders: CardOrder[]): CardOrder[] {
  return orders.filter(
    (order) => order.status === "shipped" && order.card !== null
  )
}

function formatWalletBalance(
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

const PREMIUM_THEMES: CardTheme[] = [
  "transparent-gradient",
  "brand-dark",
  "brand-light",
  "gray-dark",
]

const ACTIVE_ORDER_STATUSES = new Set<CardOrderStatus>([
  "pending_review",
  "approved",
  "processing",
])

const ORDER_STATUS_DETAILS: Record<
  CardOrderStatus,
  {
    label: string
    description: string
    variant: "default" | "secondary" | "destructive" | "outline"
  }
> = {
  pending_review: {
    label: "Pending review",
    description: "Your order is awaiting admin review.",
    variant: "secondary",
  },
  approved: {
    label: "Approved",
    description: "Your order has been accepted and will be prepared.",
    variant: "default",
  },
  processing: {
    label: "Processing",
    description: "Your card is being prepared.",
    variant: "outline",
  },
  shipped: {
    label: "Shipped",
    description: "Your card has been issued and is available below.",
    variant: "default",
  },
  rejected: {
    label: "Rejected",
    description: "Your order was not approved.",
    variant: "destructive",
  },
  cancelled: {
    label: "Cancelled",
    description: "This order has been cancelled.",
    variant: "outline",
  },
}

function cardTitle(order: CardOrder): string {
  return order.purpose.trim() || order.design.name
}

function themeTitle(theme: CardTheme): string {
  return theme
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function formatOrderDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"

  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
    date
  )
}

function OrderStatusBadge({ status }: { status: CardOrderStatus }) {
  const details = ORDER_STATUS_DETAILS[status]

  return <Badge variant={details.variant}>{details.label}</Badge>
}

function OrderStatusCard({ order }: { order: CardOrder }) {
  const details = ORDER_STATUS_DETAILS[order.status]
  const showRejectionReason =
    order.status === "rejected" && Boolean(order.rejection_reason)

  return (
    <Card size="sm" className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="truncate">{cardTitle(order)}</CardTitle>
        <CardDescription>{order.number}</CardDescription>
        <CardAction>
          <OrderStatusBadge status={order.status} />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">{details.description}</p>
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-muted-foreground">Card design</span>
          <span className="truncate font-medium text-foreground">
            {order.design.name}
          </span>
        </div>
        {showRejectionReason && (
          <Alert variant="destructive">
            <AlertTitle>Reason for rejection</AlertTitle>
            <AlertDescription>{order.rejection_reason}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="border-t text-xs text-muted-foreground">
        Submitted {formatOrderDate(order.created_at)}
      </CardFooter>
    </Card>
  )
}

function IssuedCardTile({
  order,
  currencySettings,
  allowOpeningBalance,
  onOpenBalance,
}: {
  order: CardOrder
  currencySettings: CurrencySettings | null
  allowOpeningBalance: boolean
  onOpenBalance: (order: CardOrder) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <PaymentCard
        theme={
          isCardTheme(order.design.theme) ? order.design.theme : "gray-strip"
        }
        title={cardTitle(order)}
        balance={
          order.wallet
            ? formatWalletBalance(order, currencySettings)
            : undefined
        }
        last4={order.card!.last_four}
        expiry={order.card!.expiry_date ?? undefined}
        cardholder={order.card!.cardholder_name ?? undefined}
      />
      {allowOpeningBalance &&
        (order.wallet ? null : (
          <Button
            variant="ghost"
            size="sm"
            className="h-auto w-fit gap-1 px-0 text-xs text-primary hover:bg-transparent hover:text-primary/80"
            onClick={() => onOpenBalance(order)}
          >
            <WalletIcon className="size-3.5" />
            Open a balance
          </Button>
        ))}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                               Main CardsView                                */
/* -------------------------------------------------------------------------- */

export function CardsView() {
  const organization = useActiveOrganization()
  const { settings: currencySettings } = useCurrencySettings()
  const [orderOpen, setOrderOpen] = React.useState(false)
  const [orders, setOrders] = React.useState<CardOrder[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [balanceOrder, setBalanceOrder] = React.useState<CardOrder | null>(null)

  const loadOrders = React.useCallback(async () => {
    if (!organization) return []
    return fetchCardOrders(organization.id)
  }, [organization])

  const reloadOrders = React.useCallback(async () => {
    try {
      setOrders(await loadOrders())
    } catch {
      // Keep the last successfully loaded order statuses during a background refresh failure.
    }
  }, [loadOrders])

  React.useEffect(() => {
    let cancelled = false

    async function run() {
      try {
        const result = await loadOrders()
        if (!cancelled) setOrders(result)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [loadOrders])

  const cards = issuedCards(orders)
  const currentCards = cards.filter(
    (order) => !isExpiryPast(order.card!.expiry_date)
  )
  const pastCards = cards.filter((order) =>
    isExpiryPast(order.card!.expiry_date)
  )
  const nonShippedOrders = orders.filter((order) => order.status !== "shipped")
  const hasActiveOrders = orders.some((order) =>
    ACTIVE_ORDER_STATUSES.has(order.status)
  )

  React.useEffect(() => {
    if (!hasActiveOrders) return

    function refreshWhenVisible() {
      if (document.visibilityState === "visible") void reloadOrders()
    }

    const intervalId = window.setInterval(refreshWhenVisible, 30_000)
    document.addEventListener("visibilitychange", refreshWhenVisible)

    return () => {
      window.clearInterval(intervalId)
      document.removeEventListener("visibilitychange", refreshWhenVisible)
    }
  }, [hasActiveOrders, reloadOrders])

  return (
    <>
      <div className="flex flex-col gap-8 overflow-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <TypographyH1 className="text-foreground">Cards</TypographyH1>
          <Button
            variant="ghost"
            className="gap-1.5 text-primary hover:text-primary/80"
            onClick={() => setOrderOpen(true)}
          >
            <PlusCircleIcon className="size-4" />
            Order card
          </Button>
        </div>

        {!isLoading && nonShippedOrders.length > 0 && (
          <section className="flex flex-col gap-4">
            <TypographyH4 className="text-foreground">
              Order status
            </TypographyH4>
            <div className="flex flex-wrap gap-4">
              {nonShippedOrders.map((order) => (
                <OrderStatusCard key={order.id} order={order} />
              ))}
            </div>
          </section>
        )}

        {/* Current Cards */}
        <section className="flex flex-col gap-4">
          <TypographyH4 className="text-foreground">Current cards</TypographyH4>
          {!isLoading && currentCards.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You don&apos;t have any active cards yet.
            </p>
          ) : (
            <div className="flex flex-wrap gap-4">
              {currentCards.map((order) => (
                <IssuedCardTile
                  key={order.id}
                  order={order}
                  currencySettings={currencySettings}
                  allowOpeningBalance
                  onOpenBalance={setBalanceOrder}
                />
              ))}
            </div>
          )}
        </section>

        {/* Premium Cards */}
        <section className="flex flex-col gap-4">
          <TypographyH4 className="text-foreground">Premium cards</TypographyH4>
          <div className="flex flex-wrap gap-4">
            {PREMIUM_THEMES.map((theme) => (
              <PaymentCard
                key={theme}
                theme={theme}
                title={themeTitle(theme)}
              />
            ))}
          </div>
        </section>

        {/* Past Cards */}
        {pastCards.length > 0 && (
          <section className="flex flex-col gap-4">
            <TypographyH4 className="text-foreground">Past cards</TypographyH4>
            <div className="flex flex-wrap gap-4">
              {pastCards.map((order) => (
                <IssuedCardTile
                  key={order.id}
                  order={order}
                  currencySettings={currencySettings}
                  allowOpeningBalance={false}
                  onOpenBalance={() => {}}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Order Card Flow */}
      {orderOpen && (
        <OrderCardFlow
          onClose={() => {
            setOrderOpen(false)
            void reloadOrders()
          }}
        />
      )}

      {/* Open a Balance */}
      {balanceOrder && organization && (
        <OpenCardBalanceDialog
          organizationId={organization.id}
          cardOrders={[balanceOrder]}
          onClose={() => setBalanceOrder(null)}
          onOpened={(updated) => {
            setOrders((prev) =>
              prev.map((order) => (order.id === updated.id ? updated : order))
            )
          }}
        />
      )}
    </>
  )
}
