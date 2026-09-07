"use client"

import * as React from "react"
import {
  PlusIcon,
  CoinsIcon,
  AlertTriangleIcon,
  CpuIcon,
  BrainIcon,
  SparklesIcon,
  ZapIcon,
  GaugeIcon,
  HardDriveIcon,
} from "@/components/ui/icons"

import { cn } from "@/lib/utils"
import { ApiError } from "@/lib/api"
import { useActiveOrganization } from "@/hooks/use-active-organization"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertTitle, AlertDescription } from "@/components/reui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  fetchWallets,
  fetchUsageByModel,
  fetchAiCreditSummary,
  CREDIT_CURRENCY,
  type Wallet,
  type ModelUsage,
  type AiCreditSummary,
} from "@/components/billing-api"
import { TypographyH1, TypographyLead } from "@/components/ui/typography"

/* -------------------------------------------------------------------------- */
/*                               Helpers / sub-components                      */
/* -------------------------------------------------------------------------- */

const MODEL_ICONS = [ZapIcon, CpuIcon, BrainIcon, SparklesIcon]
const MODEL_COLORS = [
  "bg-primary",
  "bg-chart-1",
  "bg-chart-3",
  "bg-chart-5",
  "bg-chart-2",
  "bg-chart-4",
]

function formatBalance(wallet: Wallet): string {
  const num = parseFloat(wallet.balance)
  if (isNaN(num)) return wallet.balance

  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const units = ["KB", "MB", "GB", "TB"]
  let value = bytes / 1024
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit++
  }
  return `${value.toFixed(value >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`
}

function UsageBar({ pct, tone }: { pct: number; tone: "primary" | "amber" }) {
  const clamped = Math.min(100, Math.max(0, pct))
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={cn(
          "h-full rounded-full transition-all",
          tone === "amber" && clamped >= 90 ? "bg-destructive" : "bg-primary"
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}

/* --------------------------- Allowance + storage --------------------------- */

function PlanUsagePanel({ summary }: { summary: AiCreditSummary }) {
  const { credits, storage } = summary

  const creditsPct =
    credits.unlimited || !credits.allotted
      ? 0
      : Math.round(((credits.consumed ?? 0) / credits.allotted) * 100)

  const storagePct =
    storage.unlimited || !storage.limit_bytes
      ? 0
      : Math.round((storage.used_bytes / storage.limit_bytes) * 100)

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card className="border border-border shadow-none ring-0">
        <CardContent className="flex flex-col gap-3 p-5">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-md bg-primary/10">
              <GaugeIcon className="size-4 text-primary" aria-hidden="true" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              AI credit allowance
            </span>
          </div>

          {credits.unlimited ? (
            <span className="font-mono text-2xl font-bold tracking-tight tabular-nums">
              Unlimited
            </span>
          ) : (
            <>
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-2xl font-bold tracking-tight tabular-nums">
                  {(credits.remaining ?? 0).toLocaleString()}
                </span>
                <span className="text-sm text-muted-foreground">
                  of {(credits.allotted ?? 0).toLocaleString()} left
                </span>
              </div>
              <UsageBar pct={creditsPct} tone="amber" />
              <span className="text-xs text-muted-foreground">
                Resets{" "}
                {credits.period_end
                  ? formatDate(credits.period_end)
                  : "monthly"}
                . Overage draws from your wallet.
              </span>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="border border-border shadow-none ring-0">
        <CardContent className="flex flex-col gap-3 p-5">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-md bg-primary/10">
              <HardDriveIcon
                className="size-4 text-primary"
                aria-hidden="true"
              />
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              Storage
            </span>
          </div>

          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-2xl font-bold tracking-tight tabular-nums">
              {formatBytes(storage.used_bytes)}
            </span>
            <span className="text-sm text-muted-foreground">
              {storage.unlimited || !storage.limit_bytes
                ? "used"
                : `of ${formatBytes(storage.limit_bytes)}`}
            </span>
          </div>

          {storage.unlimited || !storage.limit_bytes ? (
            <span className="text-xs text-muted-foreground">
              Unlimited storage on your plan.
            </span>
          ) : (
            <>
              <UsageBar pct={storagePct} tone="amber" />
              <span className="text-xs text-muted-foreground">
                Attachments and knowledge-base files count toward your limit.
              </span>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/* -------------------------------- Wallet card ------------------------------ */

function CreditsWalletCard({
  wallet,
  onTopUp,
}: {
  wallet: Wallet
  onTopUp: () => void
}) {
  return (
    <Card className="relative overflow-hidden border border-border shadow-none ring-0">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-md bg-primary/10">
                <CoinsIcon className="size-4 text-primary" aria-hidden="true" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                Credits Wallet
              </span>
              {wallet.low_balance && (
                <Badge
                  variant="destructive"
                  className="gap-1 text-xs shadow-none"
                >
                  <AlertTriangleIcon className="size-3" aria-hidden="true" />
                  Low balance
                </Badge>
              )}
            </div>

            <div className="flex flex-col gap-0.5">
              <span className="font-mono text-4xl font-bold tracking-tight text-foreground tabular-nums">
                {formatBalance(wallet)}
              </span>
              <span className="text-sm text-muted-foreground">
                Credit available
              </span>
            </div>
          </div>

          <Button onClick={onTopUp} size="sm" className="shrink-0">
            <PlusIcon aria-hidden="true" />
            Top up
          </Button>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Last updated{" "}
          <time dateTime={wallet.updated_at}>
            {formatDate(wallet.updated_at)}
          </time>
        </p>
      </CardContent>
    </Card>
  )
}

/* ----------------------------- Model usage cards --------------------------- */

function ModelUsageCard({
  usage,
  pct,
  colorIndex,
}: {
  usage: ModelUsage
  pct: number
  colorIndex: number
}) {
  const Icon = MODEL_ICONS[colorIndex % MODEL_ICONS.length]
  const color = MODEL_COLORS[colorIndex % MODEL_COLORS.length]

  return (
    <Card className="gap-0 border border-border py-0 shadow-none ring-0">
      <CardContent className="flex flex-col gap-4 p-4">
        <div className="flex items-start justify-between">
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <Icon
                className="size-3.5 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <span className="truncate font-mono text-xs text-muted-foreground">
                {usage.model}
              </span>
            </div>
            <span className="font-mono text-xl font-bold tracking-tight text-foreground tabular-nums">
              {usage.credits_used.toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground">credits used</span>
          </div>
          <Badge variant="secondary" className="font-mono shadow-none">
            {pct}%
          </Badge>
        </div>

        <div className="flex flex-col gap-1">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full transition-all", color)}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">
            <span className="font-mono font-medium text-foreground tabular-nums">
              {usage.requests.toLocaleString()}
            </span>{" "}
            requests
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

/* -------------------------------------------------------------------------- */
/*                               Main AiUsageView                             */
/* -------------------------------------------------------------------------- */

export function AiUsageView() {
  const organization = useActiveOrganization()

  const [wallets, setWallets] = React.useState<Wallet[]>([])
  const [isLoadingWallets, setIsLoadingWallets] = React.useState(true)
  const [walletsError, setWalletsError] = React.useState<string | null>(null)

  const [modelUsage, setModelUsage] = React.useState<ModelUsage[]>([])
  const [isLoadingUsage, setIsLoadingUsage] = React.useState(false)
  const [usagePeriod, setUsagePeriod] = React.useState<"month" | "all">("month")

  const [topUpNoticeOpen, setTopUpNoticeOpen] = React.useState(false)

  const [creditSummary, setCreditSummary] =
    React.useState<AiCreditSummary | null>(null)

  const creditsWallet = wallets.find((w) => w.currency_code === CREDIT_CURRENCY)
  const loadWallets = React.useCallback(async () => {
    if (!organization) return
    setIsLoadingWallets(true)
    setWalletsError(null)
    try {
      const data = await fetchWallets(organization.id)
      setWallets(data)
    } catch (err) {
      setWalletsError(
        err instanceof ApiError ? err.message : "Failed to load wallets."
      )
    } finally {
      setIsLoadingWallets(false)
    }
  }, [organization])

  const loadCreditSummary = React.useCallback(async () => {
    if (!organization) return
    try {
      const data = await fetchAiCreditSummary(organization.id)
      setCreditSummary(data)
    } catch {
      // Non-critical fallback
    }
  }, [organization])

  React.useEffect(() => {
    void Promise.resolve().then(() => {
      void loadWallets()
      void loadCreditSummary()
    })
  }, [loadWallets, loadCreditSummary])

  React.useEffect(() => {
    let cancelled = false

    async function run() {
      if (!organization || !creditsWallet) return
      setIsLoadingUsage(true)
      try {
        const usage = await fetchUsageByModel(
          organization.id,
          creditsWallet.id,
          usagePeriod
        )
        if (!cancelled) setModelUsage(usage)
      } catch {
        if (!cancelled) setModelUsage([])
      } finally {
        if (!cancelled) setIsLoadingUsage(false)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [organization, creditsWallet, usagePeriod])

  const totalCreditsUsed = modelUsage.reduce((s, m) => s + m.credits_used, 0)

  if (!organization) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-muted-foreground">No active organisation.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <TypographyH1 className="text-foreground">AI Usage</TypographyH1>
          <TypographyLead>
            Manage AI credits and see usage by model.
          </TypographyLead>
        </div>
      </div>

      {walletsError ? (
        <Alert variant="destructive">
          <AlertTriangleIcon className="size-4" />
          <AlertTitle>Failed to load credits</AlertTitle>
          <AlertDescription>{walletsError}</AlertDescription>
        </Alert>
      ) : isLoadingWallets ? (
        <Card className="border border-border shadow-none ring-0">
          <CardContent className="flex flex-col gap-4 p-6">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-3 w-24" />
          </CardContent>
        </Card>
      ) : creditsWallet ? (
        <CreditsWalletCard
          wallet={creditsWallet}
          onTopUp={() => setTopUpNoticeOpen(true)}
        />
      ) : (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CoinsIcon />
            </EmptyMedia>
            <EmptyTitle>No credits wallet found</EmptyTitle>
            <EmptyDescription>
              Your organisation does not have a credits wallet yet.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {creditSummary && <PlanUsagePanel summary={creditSummary} />}

      {!isLoadingWallets && creditsWallet && (
        <section
          aria-labelledby="usage-heading"
          className="flex flex-col gap-4"
        >
          <div className="flex items-center justify-between gap-4">
            <h2
              id="usage-heading"
              className="text-sm font-semibold text-foreground"
            >
              Usage by model
            </h2>
            <Select
              value={usagePeriod}
              onValueChange={(v) => setUsagePeriod(v as "month" | "all")}
            >
              <SelectTrigger className="h-8 w-36 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">This month</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoadingUsage ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="border border-border shadow-none">
                  <CardContent className="flex flex-col gap-3 p-4">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-7 w-20" />
                    <Skeleton className="h-2 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : modelUsage.length === 0 ? (
            <Empty className="rounded-lg border border-border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <CoinsIcon />
                </EmptyMedia>
                <EmptyTitle>No usage data</EmptyTitle>
                <EmptyDescription>
                  No model usage recorded for this period.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {modelUsage.map((m, i) => {
                const pct =
                  totalCreditsUsed > 0
                    ? Math.round((m.credits_used / totalCreditsUsed) * 100)
                    : 0
                return (
                  <ModelUsageCard
                    key={m.model}
                    usage={m}
                    pct={pct}
                    colorIndex={i}
                  />
                )
              })}
            </div>
          )}
        </section>
      )}

      <Dialog open={topUpNoticeOpen} onOpenChange={setTopUpNoticeOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Credit top-ups are unavailable</DialogTitle>
            <DialogDescription>
              AI credits are provided by your plan. Contact your organization
              administrator if you need a plan or billing change.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={() => setTopUpNoticeOpen(false)}>Done</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
