"use client"

import * as React from "react"
import {
  SparklesIcon,
  RefreshCwIcon,
  InfoIcon,
  WandSparklesIcon,
} from "@/components/ui/icons"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { TypographyH4 } from "@/components/ui/typography"
import type {
  ContactInsights,
  InsightsState,
} from "@/components/contacts/data"
import { formatRelative } from "@/components/contacts/format"

interface InsightsPanelProps {
  state: InsightsState
  insights: ContactInsights | null
  onRefresh: () => void
}

export function InsightsPanel({
  state,
  insights,
  onRefresh,
}: InsightsPanelProps) {
  const isGenerating = state === "generating"

  return (
    <section className="flex flex-col overflow-hidden rounded-xl border border-primary/25 bg-gradient-to-b from-primary/[0.06] to-card">
      {/* Header */}
      <header className="flex items-center justify-between gap-2 border-b border-primary/15 px-5 py-3.5">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary/10">
            <SparklesIcon className="size-4 text-primary" aria-hidden="true" />
          </div>
          <TypographyH4 className="text-foreground">
            AI Contact Insights
          </TypographyH4>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isGenerating}
          className="bg-card/60"
        >
          {isGenerating ? (
            <Spinner className="size-4" data-icon="inline-start" />
          ) : (
            <RefreshCwIcon data-icon="inline-start" aria-hidden="true" />
          )}
          {isGenerating ? "Generating…" : "Refresh insights"}
        </Button>
      </header>

      {/* Body */}
      <div className="p-5">
        {state === "pending" && <PendingState onRefresh={onRefresh} />}
        {state === "generating" && <GeneratingState />}
        {state === "ready" && insights && <ReadyState insights={insights} />}
      </div>
    </section>
  )
}

/* ------------------------------- Pending -------------------------------- */

function PendingState({ onRefresh }: { onRefresh: () => void }) {
  return (
    <Empty className="border-0 p-4">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <WandSparklesIcon />
        </EmptyMedia>
        <EmptyTitle>No insights generated yet</EmptyTitle>
        <EmptyDescription>
          Generate an AI summary of this contact&apos;s preferences and
          behavior based on their chat history.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button type="button" onClick={onRefresh}>
          <SparklesIcon data-icon="inline-start" aria-hidden="true" />
          Generate insights
        </Button>
      </EmptyContent>
    </Empty>
  )
}

/* ------------------------------ Generating ------------------------------ */

function GeneratingState() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true" aria-live="polite">
      <div className="flex items-center gap-2 text-sm text-primary">
        <Spinner className="size-4" />
        <span className="animate-pulse font-medium">
          Analyzing chat history…
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-[92%]" />
        <Skeleton className="h-3.5 w-3/4" />
      </div>

      <div className="flex flex-col gap-2.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex items-start gap-3 rounded-lg border border-border/60 p-3"
          >
            <Skeleton className="size-8 shrink-0 rounded-md" />
            <div className="flex w-full flex-col gap-1.5">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* -------------------------------- Ready --------------------------------- */

function ReadyState({ insights }: { insights: ContactInsights }) {
  return (
    <div className="flex flex-col gap-5">
      {/* Summary */}
      <p className="text-sm leading-relaxed text-pretty text-foreground">
        {insights.summary}
      </p>

      {/* Preferences */}
      <div className="flex flex-col gap-2.5">
        <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Detected preferences
        </h3>
        <ul className="flex flex-col gap-2">
          {insights.preferences.map((pref, i) => (
            <li
              key={i}
              className="flex flex-col gap-1 rounded-lg border border-border bg-card p-3"
            >
              <span className="w-fit rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                {pref.category}
              </span>
              <span className="text-sm leading-relaxed text-pretty text-foreground/90">
                {pref.detail}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Caveat */}
      <div className="flex items-start gap-2 rounded-lg bg-muted/50 px-3 py-2.5">
        <InfoIcon
          className="mt-0.5 size-3.5 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
        <p className="text-xs leading-relaxed text-muted-foreground">
          Inferred by AI from {insights.basedOnConversations} recent
          conversations — limited chat history may not reflect the full picture.
          Verify before acting. Updated {formatRelative(insights.generatedAt)}.
        </p>
      </div>
    </div>
  )
}
