"use client"

import * as React from "react"
import {
  ArrowDownLeftIcon,
  ArrowLeftRightIcon,
  ArrowUpRightIcon,
  CircleAlertIcon,
  ReceiptTextIcon,
} from "@/components/ui/icons"

import { ApiError } from "@/lib/api"
import { useActiveOrganization } from "@/hooks/use-active-organization"
import { useCurrencySettings } from "@/contexts/currency-settings-context"
import { type CurrencySettings } from "@/components/settings/currency-api"
import { formatCurrencyAmount } from "@/lib/currency"
import {
  fetchTransactions,
  type Transaction,
} from "@/components/transactions-api"
import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import {
  TypographyH1,
  TypographyH4,
  TypographyLead,
} from "@/components/ui/typography"

function formatAmount(
  amount: string,
  currencyCode: string,
  settings: CurrencySettings | null
): string {
  return formatCurrencyAmount(amount, currencyCode, settings)
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function dateGroupLabel(iso: string): string {
  const date = new Date(iso)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  if (date.toDateString() === today.toDateString()) return "Today"
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday"

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function groupByDate(
  transactions: Transaction[]
): { label: string; items: Transaction[] }[] {
  const groups: { label: string; items: Transaction[] }[] = []

  for (const transaction of transactions) {
    const label = dateGroupLabel(transaction.created_at)
    const group = groups.find((g) => g.label === label)
    if (group) {
      group.items.push(transaction)
    } else {
      groups.push({ label, items: [transaction] })
    }
  }

  return groups
}

function TransactionRow({
  transaction,
  currencySettings,
}: {
  transaction: Transaction
  currencySettings: CurrencySettings | null
}) {
  const isExchange = Boolean(transaction.reference?.includes("exchange"))
  const Icon = isExchange
    ? ArrowLeftRightIcon
    : transaction.type === "credit"
      ? ArrowDownLeftIcon
      : ArrowUpRightIcon
  const sign = transaction.type === "credit" ? "+" : "-"
  const iconColor = isExchange
    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
    : transaction.type === "credit"
      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      : "bg-rose-500/10 text-rose-600 dark:text-rose-400"

  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="flex min-w-0 items-center gap-4">
        <span
          className={`flex size-11 shrink-0 items-center justify-center rounded-full ${iconColor}`}
        >
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <span className="truncate text-base font-medium text-foreground">
            {transaction.description ?? transaction.model ?? "Transaction"}
          </span>
          <span className="text-sm text-muted-foreground">
            {formatDateTime(transaction.created_at)}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1 text-right">
        <span
          className={
            transaction.type === "credit"
              ? "font-mono text-base font-semibold text-emerald-600 tabular-nums dark:text-emerald-400"
              : "font-mono text-base font-semibold text-foreground tabular-nums"
          }
        >
          {sign}
          {formatAmount(
            transaction.amount,
            transaction.currency_code,
            currencySettings
          )}
        </span>
        {transaction.balance_after ? (
          <span className="font-mono text-sm text-muted-foreground tabular-nums">
            {formatAmount(
              transaction.balance_after,
              transaction.currency_code,
              currencySettings
            )}
          </span>
        ) : transaction.status ? (
          <Badge variant="secondary" className="capitalize">
            {transaction.status}
          </Badge>
        ) : null}
      </div>
    </div>
  )
}

function TransactionGroup({
  label,
  items,
  currencySettings,
}: {
  label: string
  items: Transaction[]
  currencySettings: CurrencySettings | null
}) {
  return (
    <div className="flex flex-col">
      <TypographyH4 className="pb-2 text-muted-foreground">
        {label}
      </TypographyH4>
      <div className="flex flex-col divide-y divide-border">
        {items.map((transaction) => (
          <TransactionRow
            key={transaction.id}
            transaction={transaction}
            currencySettings={currencySettings}
          />
        ))}
      </div>
    </div>
  )
}

export function TransactionList({
  transactions,
  currencySettings,
}: {
  transactions: Transaction[]
  currencySettings: CurrencySettings | null
}) {
  const groups = groupByDate(transactions)

  return (
    <div className="flex flex-col gap-8">
      {groups.map((group) => (
        <TransactionGroup
          key={group.label}
          label={group.label}
          items={group.items}
          currencySettings={currencySettings}
        />
      ))}
    </div>
  )
}

export function TransactionsView() {
  const organization = useActiveOrganization()
  const { settings: currencySettings } = useCurrencySettings()
  const [transactions, setTransactions] = React.useState<Transaction[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let cancelled = false

    async function run() {
      if (!organization) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const nextTransactions = await fetchTransactions(organization.id)

        if (!cancelled) {
          setTransactions(
            nextTransactions.sort(
              (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime()
            )
          )
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Failed to load transactions."
          )
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [organization])

  const groups = groupByDate(transactions)

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 p-6">
        <div className="flex flex-col gap-1">
          <TypographyH1 className="text-2xl text-foreground">
            Transactions
          </TypographyH1>
          <TypographyLead className="text-base">
            Review money movement across your organization.
          </TypographyLead>
        </div>

        {error && (
          <Alert variant="destructive">
            <CircleAlertIcon />
            <AlertTitle>Transactions could not load</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : groups.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ReceiptTextIcon />
              </EmptyMedia>
              <EmptyTitle>No transactions yet</EmptyTitle>
              <EmptyDescription>
                New organization transactions will appear here.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <TransactionList
            transactions={transactions}
            currencySettings={currencySettings}
          />
        )}
      </div>
    </div>
  )
}
