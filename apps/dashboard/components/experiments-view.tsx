"use client"

import * as React from "react"
import {
  FlaskConicalIcon,
  PlusIcon,
  CheckCircle2Icon,
  Loader2Icon,
  AlertTriangleIcon,
  GitCompareIcon,
  XIcon,
  TrophyIcon,
} from "@/components/ui/icons"

import { cn } from "@/lib/utils"
import {
  TypographyH1,
  TypographyH4,
  TypographyLead,
} from "@/components/ui/typography"

/* -------------------------------------------------------------------------- */
/*                                  Demo data                                  */
/* -------------------------------------------------------------------------- */

type RunStatus = "completed" | "running" | "failed"

type Metrics = {
  faithfulness: number
  answerRelevance: number
  contextPrecision: number
  contextRecall: number
}

type Experiment = {
  id: string
  name: string
  dataset: string
  genModel: string
  embedModel: string
  topK: number
  rerank: boolean
  queries: number
  latencyMs: number
  status: RunStatus
  created: string
  metrics: Metrics
}

const EXPERIMENTS: Experiment[] = [
  {
    id: "exp-014",
    name: "rerank + top_k 6",
    dataset: "support-kb",
    genModel: "gpt-4o",
    embedModel: "text-embedding-3-large",
    topK: 6,
    rerank: true,
    queries: 120,
    latencyMs: 1340,
    status: "completed",
    created: "2h ago",
    metrics: {
      faithfulness: 0.94,
      answerRelevance: 0.91,
      contextPrecision: 0.88,
      contextRecall: 0.86,
    },
  },
  {
    id: "exp-013",
    name: "baseline top_k 4",
    dataset: "support-kb",
    genModel: "gpt-4o",
    embedModel: "text-embedding-3-large",
    topK: 4,
    rerank: false,
    queries: 120,
    latencyMs: 980,
    status: "completed",
    created: "3h ago",
    metrics: {
      faithfulness: 0.89,
      answerRelevance: 0.87,
      contextPrecision: 0.79,
      contextRecall: 0.74,
    },
  },
  {
    id: "exp-012",
    name: "mini model sweep",
    dataset: "support-kb",
    genModel: "gpt-4o-mini",
    embedModel: "text-embedding-3-small",
    topK: 5,
    rerank: true,
    queries: 120,
    latencyMs: 640,
    status: "completed",
    created: "5h ago",
    metrics: {
      faithfulness: 0.82,
      answerRelevance: 0.85,
      contextPrecision: 0.81,
      contextRecall: 0.77,
    },
  },
  {
    id: "exp-011",
    name: "product-docs eval",
    dataset: "product-docs",
    genModel: "gpt-4o",
    embedModel: "text-embedding-3-small",
    topK: 8,
    rerank: true,
    queries: 90,
    latencyMs: 1520,
    status: "running",
    created: "just now",
    metrics: {
      faithfulness: 0,
      answerRelevance: 0,
      contextPrecision: 0,
      contextRecall: 0,
    },
  },
  {
    id: "exp-010",
    name: "hybrid search trial",
    dataset: "sales-transcripts",
    genModel: "gpt-4o",
    embedModel: "text-embedding-3-large",
    topK: 6,
    rerank: false,
    queries: 60,
    latencyMs: 0,
    status: "failed",
    created: "1d ago",
    metrics: {
      faithfulness: 0,
      answerRelevance: 0,
      contextPrecision: 0,
      contextRecall: 0,
    },
  },
]

const METRIC_LABELS: { key: keyof Metrics; label: string }[] = [
  { key: "faithfulness", label: "Faithfulness" },
  { key: "answerRelevance", label: "Answer relevance" },
  { key: "contextPrecision", label: "Context precision" },
  { key: "contextRecall", label: "Context recall" },
]

/* -------------------------------------------------------------------------- */
/*                                  Component                                  */
/* -------------------------------------------------------------------------- */

export function ExperimentsView() {
  const [selected, setSelected] = React.useState<string[]>([])

  const completed = EXPERIMENTS.filter((e) => e.status === "completed")

  // Best run by average of the four quality metrics.
  const best = completed.reduce<Experiment | null>((top, e) => {
    const avg =
      (e.metrics.faithfulness +
        e.metrics.answerRelevance +
        e.metrics.contextPrecision +
        e.metrics.contextRecall) /
      4
    if (!top) return e
    const topAvg =
      (top.metrics.faithfulness +
        top.metrics.answerRelevance +
        top.metrics.contextPrecision +
        top.metrics.contextRecall) /
      4
    return avg > topAvg ? e : top
  }, null)

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length >= 3
          ? prev
          : [...prev, id]
    )
  }

  const compareRuns = EXPERIMENTS.filter((e) => selected.includes(e.id))

  return (
    <div className="flex flex-1 flex-col overflow-auto bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 lg:px-6">
        {/* Header */}
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1">
            <TypographyH1>Experiments</TypographyH1>
            <TypographyLead>
              Evaluation runs scoring retrieval configs against a dataset.
              Select up to three to compare.
            </TypographyLead>
          </div>
          <button
            type="button"
            className="flex shrink-0 items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <PlusIcon className="size-4" />
            New experiment
          </button>
        </header>

        {/* Summary strip */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Summary label="Total runs" value={String(EXPERIMENTS.length)} />
          <Summary label="Completed" value={String(completed.length)} />
          <Summary
            label="Best faithfulness"
            value={best ? best.metrics.faithfulness.toFixed(2) : "—"}
          />
          <Summary label="Top run" value={best ? best.id : "—"} mono />
        </div>

        {/* Experiments table */}
        <section className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="hidden grid-cols-[auto_1.5fr_repeat(4,1fr)_auto] items-center gap-4 border-b border-border px-4 py-2.5 text-xs font-medium tracking-wide text-muted-foreground uppercase lg:grid">
            <span className="w-5" />
            <span>Experiment</span>
            {METRIC_LABELS.map((m) => (
              <span key={m.key} className="text-right">
                {m.label}
              </span>
            ))}
            <span className="w-16 text-right">Status</span>
          </div>

          <ul>
            {EXPERIMENTS.map((exp) => {
              const isChecked = selected.includes(exp.id)
              const isBest = best?.id === exp.id
              const done = exp.status === "completed"
              return (
                <li
                  key={exp.id}
                  className={cn(
                    "grid grid-cols-1 gap-3 border-b border-border px-4 py-3 transition-colors last:border-b-0 lg:grid-cols-[auto_1.5fr_repeat(4,1fr)_auto] lg:items-center lg:gap-4",
                    isChecked && "bg-primary/5"
                  )}
                >
                  <label className="flex items-center gap-2 lg:w-5">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={!done && !isChecked}
                      onChange={() => toggle(exp.id)}
                      className="size-4 accent-primary disabled:opacity-40"
                    />
                    <span className="text-xs text-muted-foreground lg:hidden">
                      Compare
                    </span>
                  </label>

                  <div className="flex min-w-0 flex-col">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-foreground">
                        {exp.name}
                      </span>
                      {isBest && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                          <TrophyIcon className="size-3" />
                          Best
                        </span>
                      )}
                    </span>
                    <span className="truncate font-mono text-xs text-muted-foreground">
                      {exp.id} · {exp.dataset} · {exp.genModel} · top_k{" "}
                      {exp.topK}
                      {exp.rerank ? " · rerank" : ""}
                    </span>
                  </div>

                  {METRIC_LABELS.map((m) => (
                    <div key={m.key} className="lg:text-right">
                      <MetricCell value={exp.metrics[m.key]} done={done} />
                    </div>
                  ))}

                  <div className="lg:w-16 lg:text-right">
                    <StatusBadge status={exp.status} />
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      </div>

      {/* Compare drawer */}
      {compareRuns.length >= 2 && (
        <CompareBar runs={compareRuns} onClear={() => setSelected([])} />
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                Small parts                                  */
/* -------------------------------------------------------------------------- */

function Summary({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2.5">
      <p
        className={cn(
          "text-sm leading-tight font-semibold",
          mono && "font-mono"
        )}
      >
        {value}
      </p>
      <p className="mt-0.5 truncate text-[11px] tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
    </div>
  )
}

function MetricCell({ value, done }: { value: number; done: boolean }) {
  if (!done) {
    return <span className="font-mono text-sm text-muted-foreground">—</span>
  }
  return (
    <div className="flex items-center gap-2 lg:justify-end">
      <span className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-muted lg:block">
        <span
          className="block h-full rounded-full bg-primary"
          style={{ width: `${Math.round(value * 100)}%` }}
        />
      </span>
      <span className="font-mono text-sm font-medium text-foreground">
        {value.toFixed(2)}
      </span>
    </div>
  )
}

function StatusBadge({ status }: { status: RunStatus }) {
  if (status === "running") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
        <Loader2Icon className="size-3 animate-spin" />
        Running
      </span>
    )
  }
  if (status === "failed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
        <AlertTriangleIcon className="size-3" />
        Failed
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
      <CheckCircle2Icon className="size-3 text-primary" />
      Done
    </span>
  )
}

function CompareBar({
  runs,
  onClear,
}: {
  runs: Experiment[]
  onClear: () => void
}) {
  return (
    <div className="sticky bottom-0 z-10 border-t border-border bg-card/95 backdrop-blur">
      <div className="mx-auto w-full max-w-7xl px-4 py-4 lg:px-6">
        <div className="mb-3 flex items-center justify-between">
          <TypographyH4 className="flex items-center gap-2">
            <GitCompareIcon className="size-4 text-primary" />
            Comparing {runs.length} runs
          </TypographyH4>
          <button
            type="button"
            onClick={onClear}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <XIcon className="size-3.5" />
            Clear
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="text-left text-xs tracking-wide text-muted-foreground uppercase">
                <th className="pb-2 font-medium">Metric</th>
                {runs.map((r) => (
                  <th
                    key={r.id}
                    className="pb-2 text-right font-mono font-medium text-foreground normal-case"
                  >
                    {r.id}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {METRIC_LABELS.map((m) => {
                const best = Math.max(...runs.map((r) => r.metrics[m.key]))
                return (
                  <tr key={m.key} className="border-t border-border">
                    <td className="py-2 text-muted-foreground">{m.label}</td>
                    {runs.map((r) => {
                      const v = r.metrics[m.key]
                      const isBest = v === best && v > 0
                      return (
                        <td
                          key={r.id}
                          className={cn(
                            "py-2 text-right font-mono",
                            isBest
                              ? "font-semibold text-primary"
                              : "text-foreground"
                          )}
                        >
                          {v > 0 ? v.toFixed(2) : "—"}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
              <tr className="border-t border-border">
                <td className="py-2 text-muted-foreground">Latency</td>
                {runs.map((r) => (
                  <td
                    key={r.id}
                    className="py-2 text-right font-mono text-foreground"
                  >
                    {r.latencyMs > 0 ? `${r.latencyMs} ms` : "—"}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
