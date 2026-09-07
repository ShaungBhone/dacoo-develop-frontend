"use client"

import * as React from "react"
import { FileTextIcon, LayersIcon } from "@/components/ui/icons"

import { RailHeading } from "@/components/rag/primitives"
import type { Retrieved } from "@/components/rag/retrieval"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type ChunkField = { key: string; value: string }

// Matches "Header: " labels (e.g. "SKU:", "Stock Quantity:", "Weight (kg):").
const CHUNK_KEY_RE = /([A-Z][A-Za-z0-9]*(?:\s[A-Za-z0-9()]+){0,3}):\s+/g

/**
 * Spreadsheet-derived chunks are "Header: value" pairs joined by " | " within
 * a row (see DocumentTextExtractor::formatRow on the backend), but row
 * boundaries collapse to a single space during chunking (DocumentChunker
 * normalizes all whitespace, including the newlines between rows) — so the
 * last field of one row runs directly into the first field of the next
 * (e.g. "Supplier: Acme Co. Name: Widget"), with no delimiter between them.
 * Splitting on " | " alone would glue those two fields into one. Instead
 * this scans for "Header: " labels directly and takes each value as
 * everything up to the next label, trimming a leftover " |" row-internal
 * separator off the end. A key reappearing signals a new row started.
 * Returns null for chunks that don't look like this shape (too few labels,
 * or the labels don't account for most of the text), so normal prose falls
 * back to plain text.
 */
function parseSpreadsheetChunk(
  text: string
): { sheet?: string; records: ChunkField[][] } | null {
  const sheetMatch = text.match(/^Sheet:\s*(\S+)\s+/)
  const sheet = sheetMatch?.[1]
  const rest = sheetMatch ? text.slice(sheetMatch[0].length) : text

  const matches = [...rest.matchAll(CHUNK_KEY_RE)]
  if (matches.length < 3) return null

  const fields: ChunkField[] = []
  let matchedChars = 0

  for (const [i, match] of matches.entries()) {
    const key = match[1].trim()
    const valueStart = match.index + match[0].length
    const valueEnd = matches[i + 1]?.index ?? rest.length
    const value = rest
      .slice(valueStart, valueEnd)
      .replace(/\|\s*$/, "")
      .trim()

    if (!value) return null

    fields.push({ key, value })
    matchedChars += match[0].length + value.length
  }

  // Guard against false positives on ordinary prose that happens to contain
  // a few "Word: " colons — real spreadsheet rows are almost entirely labels.
  if (matchedChars / rest.length < 0.6) return null

  const records: ChunkField[][] = []
  let current: ChunkField[] = []
  let seenKeys = new Set<string>()

  for (const field of fields) {
    if (seenKeys.has(field.key)) {
      records.push(current)
      current = []
      seenKeys = new Set()
    }
    seenKeys.add(field.key)
    current.push(field)
  }
  if (current.length > 0) records.push(current)

  return records.length > 0 ? { sheet, records } : null
}

function FieldValue({ value }: { value: string }) {
  if (/^https?:\/\//.test(value)) {
    return (
      <dd className="min-w-0 text-xs break-words">
        <a
          href={value}
          target="_blank"
          rel="noreferrer"
          className="text-primary underline underline-offset-2"
        >
          {value}
        </a>
      </dd>
    )
  }

  return (
    <dd className="min-w-0 text-xs break-words text-foreground/90">{value}</dd>
  )
}

function ChunkTextView({ text }: { text: string }) {
  const parsed = React.useMemo(() => parseSpreadsheetChunk(text), [text])

  if (!parsed) {
    return (
      <p className="text-sm leading-6 whitespace-pre-wrap text-foreground/90">
        {text}
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {parsed.sheet && (
        <span className="w-fit rounded-full bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
          Sheet: {parsed.sheet}
        </span>
      )}
      {parsed.records.map((record, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-lg border border-border"
        >
          <dl className="divide-y divide-border">
            {record.map((field) => (
              <div
                key={field.key}
                className="grid grid-cols-[minmax(0,9rem)_1fr] items-baseline gap-3 px-3 py-2 odd:bg-muted/20"
              >
                <dt className="truncate text-xs font-medium text-muted-foreground">
                  {field.key}
                </dt>
                <FieldValue value={field.value} />
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  )
}

export function ChunksList({ chunks }: { chunks: Retrieved[] }) {
  const [selectedChunk, setSelectedChunk] = React.useState<Retrieved | null>(
    null
  )

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <RailHeading icon={<LayersIcon className="size-3.5" />}>
          Retrieved chunks
        </RailHeading>
        <span className="text-xs text-muted-foreground">
          {chunks.length} {chunks.length === 1 ? "source" : "sources"}
        </span>
      </div>

      {chunks.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
          No chunks crossed the retrieval threshold for this query.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {chunks.map((chunk, idx) => (
            <li
              id={`retrieved-${chunk.id}`}
              key={chunk.id}
              className="scroll-mt-4 rounded-lg border border-border bg-background/60"
            >
              <button
                type="button"
                onClick={() => setSelectedChunk(chunk)}
                className="w-full rounded-lg px-3 py-3 text-left transition-colors hover:border-primary/40 hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
              >
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded bg-primary/10 font-mono text-[10px] font-semibold text-primary">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <FileTextIcon className="size-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate font-mono text-xs font-medium">
                        {chunk.source}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] leading-4 text-muted-foreground">
                      {[
                        chunk.path,
                        chunk.page != null ? `p. ${chunk.page}` : null,
                        chunk.tokens != null ? `${chunk.tokens} tok` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-xs font-semibold text-primary">
                    {chunk.score.toFixed(3)}
                  </span>
                </div>
                <p className="mt-2 line-clamp-4 text-xs leading-5 text-foreground/80">
                  {chunk.text}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={selectedChunk != null}
        onOpenChange={(open) => !open && setSelectedChunk(null)}
      >
        <DialogContent className="flex max-h-[calc(100%-4rem)] flex-col gap-0 overflow-hidden p-0 sm:max-h-[min(640px,80vh)] sm:max-w-xl">
          {selectedChunk && (
            <>
              <DialogHeader className="contents space-y-0 text-left">
                <DialogTitle className="flex items-center gap-2 border-b border-border px-6 py-4 text-base">
                  <FileTextIcon className="size-4 shrink-0 text-muted-foreground" />
                  <span className="truncate font-mono">
                    {selectedChunk.source}
                  </span>
                </DialogTitle>
                <div className="overflow-y-auto">
                  <DialogDescription render={<div className="px-6 py-4" />}>
                    <p className="mb-4 text-xs text-muted-foreground">
                      {[
                        selectedChunk.path,
                        selectedChunk.page != null
                          ? `p. ${selectedChunk.page}`
                          : null,
                        selectedChunk.tokens != null
                          ? `${selectedChunk.tokens} tok`
                          : null,
                        `score ${selectedChunk.score.toFixed(3)}`,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    <ChunkTextView text={selectedChunk.text} />
                  </DialogDescription>
                </div>
              </DialogHeader>
              <DialogFooter className="border-t border-border px-6 py-4 sm:items-center">
                <DialogClose
                  render={<Button type="button" variant="outline" />}
                >
                  Close
                </DialogClose>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}
