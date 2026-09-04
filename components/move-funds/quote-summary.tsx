import type { FxQuote } from "@/components/billing-api"

import { ErrorAlert } from "@/components/move-funds/error-alert"
import { formatAmount } from "@/components/move-funds/helpers"
import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert"
import { CircleAlertIcon } from "@/components/ui/icons"

export function QuoteSummary({
  quote,
  isLoading,
  error,
  from,
  to,
  estimate,
}: {
  quote: FxQuote | null
  isLoading: boolean
  error: string | null
  from: string
  to: string
  estimate: number | null
}) {
  if (isLoading)
    return (
      <p className="text-xs text-muted-foreground">
        Loading configured exchange rate…
      </p>
    )
  if (error) return <ErrorAlert message={error} />
  if (!quote || !from || !to) return null

  const sameCurrency = quote.source === "same_currency"
  const rate = sameCurrency
    ? "1:1 (same currency)"
    : `1 ${from} = ${Number(quote.rate).toFixed(4)} ${to}`

  return (
    <Alert className="flex items-center gap-3">
      <CircleAlertIcon className="size-4" />
      <div className="min-w-0 flex-1">
        <AlertTitle>
          {sameCurrency ? "Transfer rate" : "Configured exchange rate"}
        </AlertTitle>
        <AlertDescription className="font-mono text-xs">
          {rate}
        </AlertDescription>
        {estimate !== null && (
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            Estimated destination: {formatAmount(estimate)} {to}
          </p>
        )}
      </div>
    </Alert>
  )
}
