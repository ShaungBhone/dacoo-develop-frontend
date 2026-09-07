import * as React from "react"

import { ApiError } from "@/lib/api"
import { fetchFxRate, type FxQuote } from "@/components/billing-api"

export function useFxQuote(from: string, to: string, enabled = true) {
  const [quote, setQuote] = React.useState<FxQuote | null>(null)
  const [isLoadingQuote, setIsLoadingQuote] = React.useState(false)
  const [quoteError, setQuoteError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!enabled || !from || !to || from === to) return

    let isCurrent = true
    void Promise.resolve().then(async () => {
      if (!isCurrent) return

      setIsLoadingQuote(true)
      setQuoteError(null)
      setQuote(null)

      try {
        const nextQuote = await fetchFxRate(from, to)
        if (isCurrent) setQuote(nextQuote)
      } catch (reason) {
        if (isCurrent) {
          setQuoteError(
            reason instanceof ApiError
              ? reason.message
              : "Configured exchange rate is unavailable."
          )
        }
      } finally {
        if (isCurrent) setIsLoadingQuote(false)
      }
    })

    return () => {
      isCurrent = false
    }
  }, [enabled, from, to])

  const localQuote =
    from && from === to
      ? {
          base: from,
          quote: to,
          rate: "1.0000000000",
          source: "same_currency",
        }
      : null
  const remoteQuote = quote?.base === from && quote.quote === to ? quote : null
  const currentQuote = localQuote ?? remoteQuote

  return {
    quote: currentQuote,
    error: localQuote ? null : quoteError,
    isLoading: localQuote ? false : isLoadingQuote,
    isSameCurrency: currentQuote?.source === "same_currency",
  }
}
