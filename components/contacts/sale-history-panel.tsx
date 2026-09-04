"use client"

import * as React from "react"
import type { ColumnDef } from "@tanstack/react-table"
import type { DataGridFeatures } from "@/components/reui/data-grid/data-grid"
import {
  DollarSignIcon,
  ShoppingBagIcon,
  TrendingUpIcon,
  ClockIcon,
} from "@/components/ui/icons"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/data-table"
import { DataTableColumnHeader } from "@/components/data-table-column-header"
import { TypographyH4 } from "@/components/ui/typography"
import type {
  Order,
  OrderStatus,
  SaleHistory,
} from "@/components/contacts/data"
import { formatCurrency, formatDate } from "@/components/contacts/format"

const STATUS_STYLES: Record<OrderStatus, string> = {
  paid: "bg-primary/10 text-primary",
  fulfilled:
    "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-400",
  pending: "bg-chart-3/15 text-chart-4 dark:text-chart-2",
  refunded: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  paid: "Paid",
  fulfilled: "Fulfilled",
  pending: "Pending",
  refunded: "Refunded",
  cancelled: "Cancelled",
}

export function SaleHistoryPanel({ sales }: { sales: SaleHistory }) {
  const stats = [
    {
      icon: DollarSignIcon,
      label: "Lifetime spend",
      value: formatCurrency(sales.lifetimeSpend),
    },
    {
      icon: ShoppingBagIcon,
      label: "Orders",
      value: sales.orderCount.toString(),
    },
    {
      icon: TrendingUpIcon,
      label: "Avg. order value",
      value: formatCurrency(sales.averageOrderValue),
    },
    {
      icon: ClockIcon,
      label: "Last order",
      value: formatDate(sales.lastOrderDate),
    },
  ]

  const columns = React.useMemo<ColumnDef<DataGridFeatures, Order>[]>(
    () => [
      {
        accessorKey: "number",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Order" />
        ),
        cell: ({ row }) => (
          <>
            <span className="font-mono text-sm font-medium text-foreground tabular-nums">
              {row.original.number}
            </span>
            <span className="mt-0.5 block text-xs text-muted-foreground sm:hidden">
              {formatDate(row.original.date)}
            </span>
          </>
        ),
        meta: {
          headerTitle: "Order",
          headerClassName:
            "px-5 py-1 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase",
          cellClassName: "px-5 py-3",
        },
      },
      {
        accessorKey: "date",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Date" />
        ),
        cell: ({ row }) => formatDate(row.original.date),
        meta: {
          headerTitle: "Date",
          headerClassName:
            "hidden px-4 py-1 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase sm:table-cell",
          cellClassName:
            "hidden px-4 py-3 text-sm text-muted-foreground sm:table-cell",
        },
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Status" />
        ),
        cell: ({ row }) => (
          <Badge
            className={cn(
              "border-transparent",
              STATUS_STYLES[row.original.status]
            )}
          >
            {STATUS_LABEL[row.original.status]}
          </Badge>
        ),
        meta: {
          headerTitle: "Status",
          headerClassName:
            "px-4 py-1 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase",
          cellClassName: "px-4 py-3",
        },
      },
      {
        accessorKey: "total",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title="Total"
            className="ml-auto"
          />
        ),
        cell: ({ row }) => formatCurrency(row.original.total),
        meta: {
          headerTitle: "Total",
          headerClassName:
            "px-5 py-1 text-right text-[11px] font-semibold tracking-wide text-muted-foreground uppercase",
          cellClassName:
            "px-5 py-3 text-right font-mono text-sm font-medium text-foreground tabular-nums",
        },
      },
    ],
    []
  )

  return (
    <section className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
      <header className="flex items-center justify-between gap-2 border-b border-border px-5 py-3.5">
        <TypographyH4 className="text-foreground">Sale history</TypographyH4>
        <span className="text-xs text-muted-foreground">
          {sales.orders.length} recent orders
        </span>
      </header>

      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-px bg-border lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col gap-1.5 bg-card p-4">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <s.icon className="size-3.5" aria-hidden="true" />
              <span className="text-xs">{s.label}</span>
            </div>
            <span className="font-mono text-lg font-semibold tracking-tight text-foreground tabular-nums">
              {s.value}
            </span>
          </div>
        ))}
      </div>

      {/* Orders table */}
      <div className="border-t border-border p-3">
        <DataTable
          columns={columns}
          data={sales.orders}
          searchPlaceholder="Search orders…"
          searchableColumnIds={["number", "status", "total"]}
          headerClassName="bg-muted/30"
          rowClassName="hover:bg-muted/20"
        />
      </div>
    </section>
  )
}
