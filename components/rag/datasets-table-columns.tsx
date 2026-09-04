"use client"

import type { ColumnDef } from "@tanstack/react-table"
import type { DataGridFeatures } from "@/components/reui/data-grid/data-grid"
import {
  DataGridTableRowSelect,
  DataGridTableRowSelectAll,
} from "@/components/reui/data-grid/data-grid-table"
import { DatabaseIcon } from "@/components/ui/icons"

import { cn } from "@/lib/utils"
import type { DatasetSummary } from "@/components/rag/api"
import { Badge } from "@/components/ui/badge"

const headerClassName =
  "px-3 py-1 text-xs font-medium tracking-wide text-muted-foreground"
const cellClassName = "px-3 py-2 align-middle"

/**
 * Width of the leading checkbox column, pinned through `size`/`minSize`/
 * `maxSize` so the fixed table layout cannot hand it any of the slack.
 */
const SELECT_COLUMN_WIDTH = 36

/**
 * Status pill for a collection.
 *
 * The class strings are the ones already used for dataset status in
 * `collection-insight-widget.tsx`, kept in step deliberately: the same value
 * should not read as two different things in two places. Extracting a shared
 * component would touch more surface than this change is scoped to.
 */
function DatasetStatusBadge({ status }: { status: DatasetSummary["status"] }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "shrink-0 px-1.5 py-0.5 text-[10px] capitalize",
        status === "ready"
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : status === "failed"
            ? "border-red-500/30 bg-red-500/10 text-red-600"
            : "border-border bg-muted text-muted-foreground"
      )}
    >
      {status}
    </Badge>
  )
}

/**
 * Columns for the Knowledge Base collection picker on the agent settings page.
 *
 * Selection is owned by the caller (the agent's `datasetIds` draft), so there
 * is no row-actions column and nothing here mutates: the checkbox cells report
 * to the table, and the table reports out through `onRowSelectionChange`.
 */
export function buildDatasetColumns(): ColumnDef<
  DataGridFeatures,
  DatasetSummary
>[] {
  return [
    {
      id: "select",
      enableSorting: false,
      enableHiding: false,
      enableResizing: false,
      size: SELECT_COLUMN_WIDTH,
      minSize: SELECT_COLUMN_WIDTH,
      maxSize: SELECT_COLUMN_WIDTH,
      header: () => <DataGridTableRowSelectAll />,
      cell: ({ row }) => <DataGridTableRowSelect row={row} />,
      meta: {
        headerTitle: "Select",
        // Not symmetric with the other columns on purpose. The grid's head
        // cell already carries `[&:has([role=checkbox])]:pe-0`, so matching
        // `px-3` here would offset the header checkbox from the body ones.
        headerClassName: "px-0 py-1",
        cellClassName: "px-0 py-2 align-middle",
      },
    },
    {
      id: "name",
      accessorKey: "name",
      header: "Collection",
      // The widest column: with `table-fixed` the residual space is not shared
      // out automatically, so the name has to claim it explicitly or every
      // column sits at TanStack's 150px default and the table under-fills.
      size: 260,
      minSize: 160,
      cell: ({ row }) => (
        <div className="flex min-w-0 items-center gap-2">
          <DatabaseIcon className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate font-medium">{row.original.name}</span>
        </div>
      ),
      meta: { headerTitle: "Collection", headerClassName, cellClassName },
    },
    {
      id: "status",
      accessorKey: "status",
      header: "Status",
      size: 110,
      cell: ({ row }) => <DatasetStatusBadge status={row.original.status} />,
      meta: { headerTitle: "Status", headerClassName, cellClassName },
    },
    {
      id: "documentsCount",
      accessorKey: "documentsCount",
      header: () => <div className="text-right">Documents</div>,
      size: 110,
      cell: ({ row }) => {
        const count = row.original.documentsCount
        return (
          <div className="text-right tabular-nums">
            {/*
              An absent count is not a count of zero. The list endpoint does
              not populate `documentsCount`, so rendering 0 would claim the
              collection is empty when the value simply was not sent.
            */}
            {count === undefined ? "—" : count.toLocaleString()}
          </div>
        )
      },
      meta: { headerTitle: "Documents", headerClassName, cellClassName },
    },
    {
      id: "embedModel",
      accessorKey: "embedModel",
      header: "Embed model",
      size: 150,
      cell: ({ row }) => (
        <div className="truncate text-muted-foreground">
          {row.original.embedModel || "—"}
        </div>
      ),
      meta: { headerTitle: "Embed model", headerClassName, cellClassName },
    },
  ]
}
