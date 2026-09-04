"use client"

import * as React from "react"
import { DatabaseIcon, PlusIcon, Loader2Icon, SearchIcon, XIcon } from "@/components/ui/icons"
import { cn } from "@/lib/utils"
import type { DatasetSummary } from "@/components/rag/api"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

interface DatasetsFilterRailProps {
  datasets: DatasetSummary[]
  activeId: string | null
  onSelect: (id: string) => void
  onNewDataset: () => void
  className?: string
}

export function DatasetsFilterRail({
  datasets,
  activeId,
  onSelect,
  onNewDataset,
  className,
}: DatasetsFilterRailProps) {
  const [search, setSearch] = React.useState("")

  const filteredDatasets = React.useMemo(() => {
    if (!search.trim()) return datasets
    return datasets.filter((d) =>
      d.name.toLowerCase().includes(search.trim().toLowerCase())
    )
  }, [datasets, search])

  return (
    <div className={cn("flex flex-col h-full justify-between gap-2 p-2", className)}>
      <div className="flex flex-col gap-2 min-h-0 flex-1 overflow-y-auto">
        {/* Search & New Action Header */}
        <div className="flex items-center gap-1 px-1 py-1 shrink-0">
          <InputGroup className="flex-1">
            <InputGroupAddon>
              <SearchIcon className="size-3.5 text-muted-foreground" />
            </InputGroupAddon>
            <InputGroupInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search collections…"
              className="h-8 text-xs"
            />
            {search && (
              <InputGroupButton
                variant="ghost"
                size="icon-xs"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                <XIcon className="size-3" />
              </InputGroupButton>
            )}
          </InputGroup>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onNewDataset}
            title="New collection"
            className="size-8 shrink-0 text-primary hover:bg-primary/10"
          >
            <PlusIcon className="size-4" />
          </Button>
        </div>

        {datasets.length === 0 ? (
          <Empty className="p-4 my-2 text-center">
            <EmptyHeader>
              <EmptyMedia variant="outline">
                <DatabaseIcon className="size-4" />
              </EmptyMedia>
              <EmptyTitle className="text-xs font-semibold">No collections</EmptyTitle>
              <EmptyDescription className="text-[11px]">
                Create your first knowledge collection.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent className="mt-1">
              <Button size="sm" variant="outline" onClick={onNewDataset} className="h-7 text-xs">
                <PlusIcon className="mr-1 size-3" />
                New collection
              </Button>
            </EmptyContent>
          </Empty>
        ) : filteredDatasets.length === 0 ? (
          <p className="px-3 py-4 text-center text-xs text-muted-foreground">
            No collections match &quot;{search}&quot;.
          </p>
        ) : (
          <nav aria-label="Datasets filter" className="flex flex-col gap-0.5 min-h-0 flex-1 overflow-y-auto">
            {filteredDatasets.map((dataset) => {
              const isActive = dataset.id === activeId
              return (
                <button
                  key={dataset.id}
                  type="button"
                  aria-current={isActive ? "true" : undefined}
                  onClick={() => onSelect(dataset.id)}
                  className={cn(
                    "flex items-center gap-2.5 border-l-2 px-3 py-2.5 text-left text-sm transition-colors rounded-r-md cursor-pointer",
                    isActive
                      ? "border-l-primary bg-primary/10 font-medium text-primary"
                      : "border-l-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  )}
                >
                  <DatabaseIcon
                    className={cn(
                      "size-4 shrink-0",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                  <span className="min-w-0 flex-1 truncate text-xs font-medium">
                    {dataset.name}
                  </span>
                  <span
                    className={cn(
                      "shrink-0 text-xs tabular-nums",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {dataset.documentsCount ?? 0}
                  </span>
                  {dataset.status !== "ready" && (
                    <Loader2Icon className="size-3 shrink-0 animate-spin text-primary ml-1" />
                  )}
                </button>
              )
            })}
          </nav>
        )}
      </div>
    </div>
  )
}
