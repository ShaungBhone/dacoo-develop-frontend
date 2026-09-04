"use client"

import * as React from "react"
import { ArrowLeftRightIcon, CheckCircle2Icon } from "@/components/ui/icons"

import { type Wallet } from "@/components/billing-api"
import { type CardOrder } from "@/components/card-order-api"
import { DepositTab } from "@/components/move-funds/deposit-tab"
import { ExchangeTab } from "@/components/move-funds/exchange-tab"
import { FundCardTab } from "@/components/move-funds/fund-card-tab"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export type MoveFundsAction = "deposit" | "exchange" | "fund-card"

export function AddMoneyDialog({
  organizationId,
  wallets,
  initialAction,
  cardOrders = [],
  eligibleCardOrders = [],
  onClose,
  onExchanged,
  onOpenCardBalance,
}: {
  organizationId: number
  wallets: Wallet[]
  initialAction: MoveFundsAction
  cardOrders?: CardOrder[]
  eligibleCardOrders?: CardOrder[]
  onClose: () => void
  onExchanged: () => void
  onOpenCardBalance?: () => void
}) {
  const [successMessage, setSuccessMessage] = React.useState<string | null>(
    null
  )

  function handleSuccess(message: string): void {
    onExchanged()
    setSuccessMessage(message)
  }

  if (initialAction === "fund-card") {
    return (
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-h-[calc(100vh-2rem)] gap-0 overflow-y-auto p-0 sm:max-w-lg">
          <DialogHeader className="border-b border-border bg-muted/20 px-6 py-5 pr-14">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <ArrowLeftRightIcon className="size-5 text-primary" />
              Fund card
            </DialogTitle>
            <DialogDescription>
              Add money from an organization wallet to an issued card.
            </DialogDescription>
          </DialogHeader>

          {successMessage ? (
            <div className="flex flex-col items-center gap-4 p-8 text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
                <CheckCircle2Icon className="size-8" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                Transfer complete
              </h3>
              <p className="max-w-xs text-sm text-muted-foreground">
                {successMessage}
              </p>
              <Button onClick={onClose} className="mt-2">
                Done
              </Button>
            </div>
          ) : (
            <FundCardTab
              organizationId={organizationId}
              wallets={wallets}
              cardOrders={cardOrders}
              eligibleCardOrders={eligibleCardOrders}
              isActive
              onClose={onClose}
              onSuccess={handleSuccess}
              onOpenCardBalance={onOpenCardBalance}
            />
          )}
        </DialogContent>
      </Dialog>
    )
  }

  const title = initialAction === "deposit" ? "Deposit" : "Convert funds"
  const description =
    initialAction === "deposit"
      ? "View the available options for adding money to an organization wallet."
      : "Exchange funds between organization wallets."

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[calc(100vh-2rem)] gap-0 overflow-y-auto p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-border bg-muted/20 px-6 py-5 pr-14">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <ArrowLeftRightIcon className="size-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {successMessage ? (
          <div className="flex flex-col items-center gap-4 p-8 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
              <CheckCircle2Icon className="size-8" />
            </div>
            <h3 className="text-lg font-bold text-foreground">
              Transfer complete
            </h3>
            <p className="max-w-xs text-sm text-muted-foreground">
              {successMessage}
            </p>
            <Button onClick={onClose} className="mt-2">
              Done
            </Button>
          </div>
        ) : (
          <div>
            <DepositTab
              isActive={initialAction === "deposit"}
              onClose={onClose}
            />
            <ExchangeTab
              organizationId={organizationId}
              wallets={wallets}
              isActive={initialAction === "exchange"}
              onClose={onClose}
              onSuccess={handleSuccess}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
