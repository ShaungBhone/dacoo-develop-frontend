"use client"

import * as React from "react"
import {
  CheckIcon,
  ClockIcon,
  CoinsIcon,
  CopyIcon,
  FileTextIcon,
  ListChecksIcon,
  SearchIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TargetIcon,
  TerminalIcon,
  TriangleAlertIcon,
} from "@/components/ui/icons"

import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtSearchResult,
  ChainOfThoughtSearchResults,
  ChainOfThoughtStep,
} from "@/components/ai-elements/chain-of-thought"
import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockCopyButton,
  CodeBlockFilename,
  CodeBlockHeader,
  CodeBlockTitle,
} from "@/components/ai-elements/code-block"
import {
  InlineCitation,
  InlineCitationCard,
  InlineCitationCardBody,
  InlineCitationCardTrigger,
  InlineCitationCarousel,
  InlineCitationCarouselContent,
  InlineCitationCarouselHeader,
  InlineCitationCarouselIndex,
  InlineCitationCarouselItem,
  InlineCitationCarouselNext,
  InlineCitationCarouselPrev,
  InlineCitationQuote,
  InlineCitationSource,
} from "@/components/ai-elements/inline-citation"
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
} from "@/components/ai-elements/message"
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "@/components/ai-elements/sources"
import { cn } from "@/lib/utils"
import type {
  ContextBudget,
  Retrieved,
  RunResult,
} from "@/components/rag/retrieval"

export function AnswerPanel({
  result,
  isStreaming,
  streamedText,
  contextBudget,
}: {
  result: RunResult
  isStreaming: boolean
  streamedText: string
  contextBudget?: ContextBudget
}) {
  const [tab, setTab] = React.useState<"answer" | "prompt">("answer")
  const [copied, setCopied] = React.useState(false)

  function copyAnswer() {
    const allBullets = result.structured.sections.flatMap((s) => s.bullets)
    const text = [
      result.structured.summary.text,
      ...allBullets.map((b) => b.text),
    ].join("\n")

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    })
  }

  const metrics = [
    { label: "Latency", value: `${result.latencyMs} ms`, icon: ClockIcon },
    {
      label: "Tokens",
      value: result.tokens.toLocaleString(),
      icon: CoinsIcon,
    },
    {
      label: "Faithfulness",
      value: result.faithfulness != null ? `${result.faithfulness}%` : "—",
      icon: ShieldCheckIcon,
    },
    {
      label: "Answer relevance",
      value: result.relevance != null ? `${result.relevance}%` : "—",
      icon: TargetIcon,
    },
  ]

  const streamedWords = new Set(streamedText.split(" ").filter(Boolean))

  function isTextVisible(text: string): boolean {
    if (!isStreaming) return true
    const firstWord = text.split(" ")[0]
    return streamedWords.has(firstWord ?? "")
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="sticky top-0 z-10 flex flex-col gap-3 border-b border-border bg-background pt-1 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-1">
          {(["answer", "prompt"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "flex h-8 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors",
                tab === t
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t === "answer" ? (
                <SparklesIcon className="size-3.5" />
              ) : (
                <TerminalIcon className="size-3.5" />
              )}
              {t === "answer" ? "Answer" : "Prompt"}
              {t === "prompt" && contextBudget?.isOver && (
                <span
                  className="flex items-center gap-0.5 rounded bg-destructive/15 px-1 py-px font-mono text-[9px] font-bold text-destructive"
                  title="Context window exceeded"
                >
                  <TriangleAlertIcon className="size-2.5" />
                  Over
                </span>
              )}
            </button>
          ))}
          <span className="ml-1 rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
            {result.model}
          </span>
        </div>

        {tab === "answer" && (
          <MessageActions className="shrink-0">
            <MessageAction
              disabled={isStreaming}
              label={copied ? "Copied answer" : "Copy answer"}
              onClick={copyAnswer}
              tooltip={copied ? "Copied" : "Copy answer"}
            >
              {copied ? (
                <CheckIcon className="size-3.5 text-primary" />
              ) : (
                <CopyIcon className="size-3.5" />
              )}
            </MessageAction>
          </MessageActions>
        )}
      </div>

      {tab === "answer" && (
        <div className="flex flex-col gap-4">
          <Sources className="mb-1 text-muted-foreground">
            <SourcesTrigger
              className="w-fit rounded-md px-0 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
              count={result.chunks.length}
            >
              <span>Sources</span>
              <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                {result.chunks.length}
              </span>
            </SourcesTrigger>
            <SourcesContent className="w-full flex-row flex-wrap gap-2">
              {result.chunks.map((chunk) => (
                <Source
                  key={chunk.id}
                  href={`#retrieved-${chunk.id}`}
                  title={chunk.source}
                  target="_self"
                  className="group inline-flex max-w-full items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-foreground transition-colors hover:border-primary/40 hover:bg-muted/50 hover:text-primary sm:max-w-[18rem]"
                >
                  <FileTextIcon className="size-3 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                  <span className="flex min-w-0 items-center gap-1.5 font-mono">
                    <span className="min-w-0 truncate text-xs font-medium">
                      {chunk.source}
                    </span>
                    <span className="shrink-0 text-[11px] font-semibold text-muted-foreground group-hover:text-primary">
                      {chunk.score.toFixed(3)}
                    </span>
                  </span>
                </Source>
              ))}
            </SourcesContent>
          </Sources>

          <Message from="assistant" className="max-w-full">
            <MessageContent className="w-full gap-0 overflow-visible">
              <AnswerTrace
                isStreaming={isStreaming}
                isTextVisible={isTextVisible}
                result={result}
              />
            </MessageContent>
          </Message>

          <div
            className={cn(
              "grid grid-cols-2 gap-3 border-t border-border pt-2 transition-opacity duration-500 md:grid-cols-4",
              isStreaming ? "opacity-0" : "opacity-100"
            )}
          >
            {metrics.map((m) => (
              <div
                key={m.label}
                className="flex min-w-0 items-center gap-2 rounded-lg border border-border px-3 py-2"
              >
                <m.icon className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="font-mono text-sm leading-tight font-semibold">
                    {m.value}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground uppercase">
                    {m.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "prompt" && (
        <div className="flex flex-col gap-3">
          <p className="mb-3 text-xs text-pretty text-muted-foreground">
            The exact context window sent to the model: system prompt, retrieved
            chunks, and user query.
          </p>

          {contextBudget && (
            <ContextBudgetMeter contextBudget={contextBudget} />
          )}

          <CodeBlock
            code={result.promptPreview}
            language="markdown"
            className="max-h-[520px]"
          >
            <CodeBlockHeader>
              <CodeBlockTitle>
                <TerminalIcon className="size-3.5" />
                <CodeBlockFilename>retrieval-prompt.txt</CodeBlockFilename>
              </CodeBlockTitle>
              <CodeBlockActions>
                <CodeBlockCopyButton
                  aria-label="Copy prompt preview"
                  className="size-7"
                />
              </CodeBlockActions>
            </CodeBlockHeader>
          </CodeBlock>
        </div>
      )}
    </section>
  )
}

function AnswerTrace({
  result,
  isStreaming,
  isTextVisible,
}: {
  result: RunResult
  isStreaming: boolean
  isTextVisible: (text: string) => boolean
}) {
  const topChunk = result.chunks[0]
  const answerStatus = isStreaming ? "active" : "complete"

  return (
    <ChainOfThought className="space-y-3" defaultOpen>
      <ChainOfThoughtHeader>Retrieval reasoning</ChainOfThoughtHeader>
      <ChainOfThoughtContent>
        <ChainOfThoughtStep
          icon={SearchIcon}
          label="Search indexed sources"
          description={
            result.chunks.length > 0
              ? `Matched ${result.chunks.length} source${result.chunks.length === 1 ? "" : "s"} for "${result.query}".`
              : `No indexed source crossed the threshold for "${result.query}".`
          }
          status="complete"
        >
          <ChainOfThoughtSearchResults>
            {result.chunks.length > 0 ? (
              result.chunks.map((chunk) => (
                <ChainOfThoughtSearchResult key={chunk.id}>
                  {chunk.source} · {chunk.score.toFixed(3)}
                </ChainOfThoughtSearchResult>
              ))
            ) : (
              <ChainOfThoughtSearchResult>
                No matching source
              </ChainOfThoughtSearchResult>
            )}
          </ChainOfThoughtSearchResults>
        </ChainOfThoughtStep>

        <ChainOfThoughtStep
          icon={ListChecksIcon}
          label="Rank evidence"
          description={
            topChunk
              ? `Top source: ${topChunk.source}${topChunk.path ? `, ${topChunk.path}` : ""}${topChunk.page != null ? `, page ${topChunk.page}` : ""}.`
              : "No evidence was available to rank."
          }
          status="complete"
        />

        <ChainOfThoughtStep
          icon={SparklesIcon}
          label="Compose cited answer"
          description="Answer text is generated from the retrieved chunks and keeps citations attached to claims."
          status={answerStatus}
        >
          <div className="border-l border-border pl-3">
            <p className="text-sm leading-7 text-foreground">
              {result.structured.summary.text}
              {isStreaming && (
                <span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] animate-pulse rounded-sm bg-primary" />
              )}
              {result.structured.summary.cite != null && !isStreaming && (
                <Citation
                  n={result.structured.summary.cite}
                  chunk={result.chunks[result.structured.summary.cite - 1]}
                />
              )}
            </p>

            {result.structured.sections.map((section) => (
              <div
                key={section.heading}
                className={cn(
                  "mt-5 transition-opacity duration-300",
                  isStreaming && !isTextVisible(section.bullets[0]?.text ?? "")
                    ? "opacity-0"
                    : "opacity-100"
                )}
              >
                <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase">
                  {section.heading}
                </p>
                <ul className="flex flex-col gap-2">
                  {section.bullets.map((bullet, bi) => (
                    <li
                      key={`${section.heading}-${bi}`}
                      className={cn(
                        "flex items-start gap-2 text-sm leading-6 text-foreground/90 transition-opacity duration-200",
                        isStreaming && !isTextVisible(bullet.text)
                          ? "opacity-0"
                          : "opacity-100"
                      )}
                    >
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary/60" />
                      <span>
                        {bullet.text}
                        {bullet.cite != null && !isStreaming && (
                          <Citation
                            n={bullet.cite}
                            chunk={result.chunks[bullet.cite - 1]}
                          />
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {result.structured.sourceNote && !isStreaming && (
              <p className="mt-4 text-xs text-muted-foreground">
                {result.structured.sourceNote}
              </p>
            )}
          </div>
        </ChainOfThoughtStep>
      </ChainOfThoughtContent>
    </ChainOfThought>
  )
}

function ContextBudgetMeter({
  contextBudget,
}: {
  contextBudget: ContextBudget
}) {
  return (
    <div
      className={cn(
        "mb-4 flex flex-col gap-2 rounded-lg border px-3 py-3",
        contextBudget.isOver
          ? "border-destructive/40 bg-destructive/5"
          : contextBudget.pct > 0.8
            ? "border-amber-500/40 bg-amber-500/5"
            : "border-border bg-muted/30"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {contextBudget.isOver && (
            <TriangleAlertIcon className="size-3.5 text-destructive" />
          )}
          <span
            className={cn(
              "text-xs font-semibold",
              contextBudget.isOver
                ? "text-destructive"
                : contextBudget.pct > 0.8
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-foreground"
            )}
          >
            {contextBudget.isOver
              ? "Context window exceeded"
              : "Context window usage"}
          </span>
        </div>
        <span className="font-mono text-xs text-muted-foreground">
          {contextBudget.usedTokens.toLocaleString()} /{" "}
          {contextBudget.limitTokens.toLocaleString()} tok
        </span>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            contextBudget.isOver
              ? "bg-destructive"
              : contextBudget.pct > 0.8
                ? "bg-amber-500"
                : "bg-primary"
          )}
          style={{
            width: `${Math.min(100, contextBudget.pct * 100).toFixed(1)}%`,
          }}
        />
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        {[
          { label: "System", value: contextBudget.systemTokens },
          { label: "Chunks", value: contextBudget.chunkTokens },
          { label: "Query", value: contextBudget.queryTokens },
        ].map((row) => (
          <span key={row.label} className="text-[11px] text-muted-foreground">
            {row.label}:{" "}
            <span className="font-mono font-medium text-foreground/70">
              {row.value.toLocaleString()}
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}

function Citation({ n, chunk }: { n: number; chunk?: Retrieved }) {
  if (!chunk) {
    return (
      <span className="mx-1 inline-flex rounded-full bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
        {n}
      </span>
    )
  }

  return (
    <InlineCitation className="mx-1">
      <InlineCitationCard>
        <InlineCitationCardTrigger
          aria-label={`Source ${n}: ${chunk.source}`}
          className="max-w-36 translate-y-[-1px] cursor-pointer truncate px-1.5 py-0 font-mono text-[10px]"
          sources={[sourceUrl(chunk)]}
        />
        <InlineCitationCardBody className="w-80 overflow-hidden">
          <InlineCitationCarousel>
            <InlineCitationCarouselHeader>
              <InlineCitationCarouselPrev />
              <InlineCitationCarouselNext />
              <InlineCitationCarouselIndex>
                Source {n}
              </InlineCitationCarouselIndex>
            </InlineCitationCarouselHeader>
            <InlineCitationCarouselContent>
              <InlineCitationCarouselItem>
                <InlineCitationSource
                  title={chunk.source}
                  url={
                    [
                      chunk.path,
                      chunk.page != null ? `p. ${chunk.page}` : null,
                      chunk.tokens != null ? `${chunk.tokens} tok` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ") || undefined
                  }
                  description={`Score ${chunk.score.toFixed(3)}`}
                />
                <InlineCitationQuote>{chunk.text}</InlineCitationQuote>
              </InlineCitationCarouselItem>
            </InlineCitationCarouselContent>
          </InlineCitationCarousel>
        </InlineCitationCardBody>
      </InlineCitationCard>
    </InlineCitation>
  )
}

function sourceUrl(chunk: Retrieved): string {
  return `https://${chunk.source}`
}
