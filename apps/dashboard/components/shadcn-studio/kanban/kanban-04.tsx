"use client"

import type { ComponentProps } from "react"
import { useMemo, useState } from "react"
import {
  CalendarClockIcon,
  ChevronDownIcon,
  GripVerticalIcon,
  MoreHorizontalIcon,
  PlusIcon,
} from "@/components/ui/icons"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Kanban,
  KanbanBoard,
  KanbanColumn,
  KanbanColumnContent,
  KanbanColumnHandle,
  KanbanItem,
  KanbanItemHandle,
  KanbanOverlay,
} from "@/components/ui/kanban"
import { cn } from "@/lib/utils"

type StageId = "new" | "qualified" | "proposal" | "negotiation" | "won"

type Deal = {
  id: string
  company: string
  contact: string
  value: number
  owner: string
  nextActivity: string
  source: string
  accent: string
}

const stageMeta: Record<StageId, { title: string; color: string }> = {
  new: { title: "New leads", color: "bg-sky-500" },
  qualified: { title: "Qualified", color: "bg-violet-500" },
  proposal: { title: "Proposal sent", color: "bg-amber-500" },
  negotiation: { title: "Negotiation", color: "bg-orange-500" },
  won: { title: "Closed won", color: "bg-emerald-500" },
}

const initialColumns: Record<StageId, Deal[]> = {
  new: [
    {
      id: "d-1",
      company: "Northstar Labs",
      contact: "Maya Chen",
      value: 18000,
      owner: "MC",
      nextActivity: "Follow up today",
      source: "Inbound",
      accent: "bg-sky-100 text-sky-700",
    },
    {
      id: "d-2",
      company: "Vercel Studios",
      contact: "Noah Williams",
      value: 9200,
      owner: "NW",
      nextActivity: "Intro call · Aug 8",
      source: "Referral",
      accent: "bg-violet-100 text-violet-700",
    },
  ],
  qualified: [
    {
      id: "d-3",
      company: "Acme Commerce",
      contact: "Aisha Rahman",
      value: 24500,
      owner: "AR",
      nextActivity: "Discovery · Aug 9",
      source: "Website",
      accent: "bg-rose-100 text-rose-700",
    },
    {
      id: "d-4",
      company: "Pine & Co.",
      contact: "Leo Martin",
      value: 12800,
      owner: "LM",
      nextActivity: "Send case study",
      source: "Outbound",
      accent: "bg-teal-100 text-teal-700",
    },
  ],
  proposal: [
    {
      id: "d-5",
      company: "Orbital Health",
      contact: "Sofia Patel",
      value: 36000,
      owner: "SP",
      nextActivity: "Proposal review · Aug 11",
      source: "Partner",
      accent: "bg-indigo-100 text-indigo-700",
    },
    {
      id: "d-6",
      company: "Bayside Works",
      contact: "Ethan Lee",
      value: 15750,
      owner: "EL",
      nextActivity: "Follow up tomorrow",
      source: "Inbound",
      accent: "bg-cyan-100 text-cyan-700",
    },
  ],
  negotiation: [
    {
      id: "d-7",
      company: "Fathom Systems",
      contact: "Iris Brooks",
      value: 48000,
      owner: "IB",
      nextActivity: "Legal review · Aug 12",
      source: "Referral",
      accent: "bg-fuchsia-100 text-fuchsia-700",
    },
  ],
  won: [
    {
      id: "d-8",
      company: "Tandem Foods",
      contact: "Owen Davis",
      value: 21400,
      owner: "OD",
      nextActivity: "Kickoff · Aug 14",
      source: "Inbound",
      accent: "bg-lime-100 text-lime-700",
    },
  ],
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
    notation: value >= 10000 ? "compact" : "standard",
  }).format(value)

function DealCard({
  deal,
  isOverlay,
  ...props
}: Omit<ComponentProps<typeof KanbanItem>, "value" | "children"> & {
  deal: Deal
  isOverlay?: boolean
}) {
  const content = (
    <article className="rounded-xl border bg-card p-3.5 text-card-foreground shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <Avatar className={cn("size-9", deal.accent)}>
            <AvatarFallback className="font-semibold">
              {deal.company.slice(0, 1)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold">{deal.company}</h3>
            <p className="truncate text-xs text-muted-foreground">
              {deal.contact}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={`More options for ${deal.company}`}
        >
          <MoreHorizontalIcon />
        </Button>
      </div>
      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">Deal value</p>
          <p className="mt-0.5 text-lg font-semibold tracking-tight">
            {formatCurrency(deal.value)}
          </p>
        </div>
        <Badge variant="secondary" className="font-normal">
          {deal.source}
        </Badge>
      </div>
      <div className="mt-3 flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <CalendarClockIcon className="size-3.5" />
          {deal.nextActivity}
        </span>
        <span className="rounded-full bg-muted px-2 py-1 font-medium text-foreground">
          {deal.owner}
        </span>
      </div>
    </article>
  )

  return (
    <KanbanItem value={deal.id} {...props}>
      {isOverlay ? content : <KanbanItemHandle>{content}</KanbanItemHandle>}
    </KanbanItem>
  )
}

function DealColumn({
  value,
  deals,
  isOverlay,
  ...props
}: Omit<ComponentProps<typeof KanbanColumn>, "children" | "value"> & {
  value: StageId
  deals: Deal[]
  isOverlay?: boolean
}) {
  const meta = stageMeta[value]
  const total = deals.reduce((sum, deal) => sum + deal.value, 0)

  return (
    <KanbanColumn value={value} {...props}>
      <section className="flex min-h-full flex-col rounded-2xl bg-muted/60 p-2.5">
        <header className="flex items-center justify-between gap-2 px-1.5 pb-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={cn("size-2 rounded-full", meta.color)} />
              <h2 className="truncate text-sm font-semibold">{meta.title}</h2>
              <span className="text-xs text-muted-foreground">
                {deals.length}
              </span>
            </div>
            <p className="mt-1 pl-4 text-xs font-medium text-muted-foreground">
              {formatCurrency(total)}
            </p>
          </div>
          <KanbanColumnHandle
            render={(handleProps) => (
              <Button
                {...handleProps}
                size="icon-xs"
                variant="ghost"
                aria-label={`Move ${meta.title} column`}
              >
                <GripVerticalIcon />
              </Button>
            )}
          />
        </header>
        <KanbanColumnContent value={value} className="min-h-80 gap-2.5">
          {deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} isOverlay={isOverlay} />
          ))}
        </KanbanColumnContent>
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 justify-start text-muted-foreground"
        >
          <PlusIcon />
          Add deal
        </Button>
      </section>
    </KanbanColumn>
  )
}

export default function DealsBoard() {
  const [columns, setColumns] = useState<Record<string, Deal[]>>(initialColumns)
  const pipelineValue = useMemo(
    () =>
      Object.values(columns)
        .flat()
        .reduce((sum, deal) => sum + deal.value, 0),
    [columns]
  )

  return (
    <div className="flex size-full min-h-0 flex-col overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:px-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">Deals</h1>
            <Badge variant="secondary">
              {Object.values(columns).flat().length}
            </Badge>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {formatCurrency(pipelineValue)} in active pipeline
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            Sales pipeline
            <ChevronDownIcon />
          </Button>
          <Button size="sm">
            <PlusIcon />
            Add deal
          </Button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-4 sm:p-6">
        <Kanban
          value={columns}
          onValueChange={setColumns}
          getItemValue={(deal) => deal.id}
          className="min-h-full min-w-375"
        >
          <KanbanBoard className="grid min-h-full grid-cols-[repeat(5,minmax(15rem,1fr))] gap-4">
            {Object.entries(columns).map(([stageId, deals]) => (
              <DealColumn
                key={stageId}
                value={stageId as StageId}
                deals={deals}
              />
            ))}
          </KanbanBoard>
          <KanbanOverlay>
            {({ value, variant }) => {
              const active = String(value)
              if (variant === "column")
                return (
                  <DealColumn
                    value={active as StageId}
                    deals={columns[active] ?? []}
                    isOverlay
                  />
                )
              const deal = Object.values(columns)
                .flat()
                .find((item) => item.id === active)
              return deal ? <DealCard deal={deal} isOverlay /> : null
            }}
          </KanbanOverlay>
        </Kanban>
      </div>
    </div>
  )
}
