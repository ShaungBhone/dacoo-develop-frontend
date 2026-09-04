"use client"

import * as React from "react"
import { DatabaseIcon, FileTextIcon, Loader2Icon } from "@/components/ui/icons"

import { RailHeading } from "@/components/rag/primitives"
import { useRag } from "@/components/rag/rag-context"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const POLL_INTERVAL_MS = 2500

export function KnowledgeBase() {
  const {
    datasets,
    isLoadingDatasets,
    datasetId,
    setDatasetId,
    documents,
    isLoadingDocuments,
    refreshDocuments,
  } = useRag()

  // Ingestion runs in a queued job on the backend, so poll while any document
  // is still indexing rather than assuming a fixed completion delay.
  React.useEffect(() => {
    if (!documents.some((doc) => doc.status === "indexing")) return
    const id = setInterval(refreshDocuments, POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [documents, refreshDocuments])

  return (
    <section className="flex flex-col gap-3">
      <RailHeading icon={<DatabaseIcon className="size-3.5" />}>
        Knowledge base
      </RailHeading>

      <Select
        value={datasetId ?? ""}
        onValueChange={(val) => setDatasetId(val)}
        disabled={isLoadingDatasets || datasets.length === 0}
      >
        <SelectTrigger className="h-8 w-full text-xs">
          <SelectValue
            placeholder={
              isLoadingDatasets ? "Loading datasets…" : "No datasets yet"
            }
          />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {datasets.map((dataset) => (
              <SelectItem key={dataset.id} value={dataset.id}>
                {dataset.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      {isLoadingDocuments ? (
        <div className="flex items-center justify-center py-4">
          <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <ul className="flex flex-col gap-1">
          {documents.map((file) => (
            <li
              key={file.id}
              className="flex items-center gap-2 rounded-md px-1.5 py-1.5 text-sm transition-colors hover:bg-muted/50"
            >
              <FileTextIcon className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate font-mono text-xs text-foreground">
                {file.name}
              </span>
              {file.status === "indexing" ? (
                <Loader2Icon className="size-3.5 shrink-0 animate-spin text-primary" />
              ) : (
                <span className="shrink-0 font-mono text-xs text-muted-foreground">
                  {file.tokens}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
