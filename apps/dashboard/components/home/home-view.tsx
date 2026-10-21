"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  ArrowRightIcon,
  BellIcon,
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  GripVerticalIcon,
  LoaderCircleIcon,
  MessageSquareIcon,
  SearchIcon,
  SparklesIcon,
  WalletIcon,
  XIcon,
} from "lucide-react"
import { toast } from "sonner"
import { useActiveOrganization } from "@/hooks/use-active-organization"
import { ApiError } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Message, MessageContent } from "@/components/ai-elements/message"
import { HomepagePromptFrame } from "@/components/examples/c-frame-10"
import {
  Kanban,
  KanbanBoard,
  KanbanColumn,
  KanbanColumnContent,
  KanbanItem,
  KanbanItemHandle,
} from "@/components/ui/kanban"
import {
  fetchHome,
  sendHomeMessage,
  decideHomeAction,
  updateHomeItem,
  markHomeRead,
  type HomeItem,
  type HomeMessage,
  type HomeSnapshot,
  type HomeStatus,
  type HomeViewMode,
} from "./api"
import {
  boardItems,
  groupItems,
  statusChange,
  formatMoney,
  WORK_COLUMNS,
  FINANCE_COLUMNS,
} from "./board"

const kindLabels: Record<HomeItem["kind"], string> = {
  conversation: "Conversation",
  task: "Task",
  meeting: "Meeting",
  follow_up: "Follow-up",
  finance: "Finance",
  transaction: "Transaction",
}
function dateLabel(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}
function errorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Something went wrong. Please try again."
}

export function HomeView() {
  const organization = useActiveOrganization()
  if (!organization)
    return (
      <div className="p-8 text-sm text-muted-foreground">
        Choose a workspace to start your day.
      </div>
    )
  return (
    <HomeWorkspace key={organization.id} organizationId={organization.id} />
  )
}

function HomeWorkspace({
  organizationId,
}: {
  organizationId: number | string
}) {
  const params = useSearchParams()
  const conversationId = params.get("conversation") ?? undefined
  const [snapshot, setSnapshot] = React.useState<HomeSnapshot | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [sending, setSending] = React.useState(false)
  const [busy, setBusy] = React.useState<string | null>(null)
  const [view, setView] = React.useState<HomeViewMode>("work")
  const [query, setQuery] = React.useState("")
  const [selected, setSelected] = React.useState<HomeItem | null>(null)
  const [prompt, setPrompt] = React.useState("")
  const [optimistic, setOptimistic] = React.useState<string | null>(null)
  const mounted = React.useRef(true)
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const latestLoad = React.useRef(0)

  const reload = React.useCallback(async () => {
    const revision = ++latestLoad.current
    const data = await fetchHome(organizationId)
    if (!mounted.current || revision !== latestLoad.current) return
    setSnapshot(data)
    setError(null)
    window.dispatchEvent(
      new CustomEvent("home-unread", {
        detail: { organizationId, count: data.unread_count },
      })
    )
  }, [organizationId])
  React.useEffect(() => {
    mounted.current = true
    const refresh = () => {
      if (!document.hidden)
        void reload().catch((cause) => {
          if (mounted.current) setError(errorMessage(cause))
        })
    }
    refresh()
    const timer = window.setInterval(refresh, 30000)
    document.addEventListener("visibilitychange", refresh)
    return () => {
      mounted.current = false
      window.clearInterval(timer)
      document.removeEventListener("visibilitychange", refresh)
    }
  }, [reload])
  React.useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    })
  }, [snapshot?.messages.length, sending])
  const items = snapshot?.items ?? []
  const visibleItems = boardItems(items, view, query)
  const columns = view === "work" ? WORK_COLUMNS : FINANCE_COLUMNS
  const grouped = groupItems(visibleItems)

  async function send(text: string) {
    if (!text.trim() || sending) return
    setSending(true)
    setOptimistic(text)
    setError(null)
    try {
      const response = await sendHomeMessage(
        organizationId,
        text,
        conversationId
      )
      if (!mounted.current) return
      setView(response.view)
      setPrompt("")
      await reload()
    } catch (cause) {
      if (mounted.current) {
        setError(errorMessage(cause))
        setPrompt(text)
      }
    } finally {
      if (mounted.current) {
        setSending(false)
        setOptimistic(null)
      }
    }
  }
  async function decide(message: HomeMessage, decision: "confirm" | "cancel") {
    setBusy(message.id)
    try {
      await decideHomeAction(organizationId, message.id, decision)
      if (!mounted.current) return
      await reload()
      toast.success(
        decision === "confirm" ? "Change saved" : "Proposal cancelled"
      )
    } catch (cause) {
      if (mounted.current) setError(errorMessage(cause))
    } finally {
      if (mounted.current) setBusy(null)
    }
  }
  async function changeItem(
    item: HomeItem,
    changes: { status?: HomeStatus; snoozed_until?: string; read?: boolean }
  ) {
    setBusy(item.id)
    try {
      await updateHomeItem(organizationId, item.id, changes)
      if (!mounted.current) return
      await reload()
      if (!changes.read) setSelected(null)
    } catch (cause) {
      if (mounted.current) setError(errorMessage(cause))
    } finally {
      if (mounted.current) setBusy(null)
    }
  }
  async function readAll() {
    try {
      await markHomeRead(organizationId)
      if (mounted.current) await reload()
    } catch (cause) {
      if (mounted.current) setError(errorMessage(cause))
    }
  }
  function renderMessage(message: HomeMessage) {
    const proposal = message.proposal
    return (
      <Message key={message.id} from={message.role}>
        <MessageContent>
          <p className="leading-relaxed whitespace-pre-wrap">{message.body}</p>
        </MessageContent>
        {!proposal && message.result?.conversation_id && (
          <Link
            href={`/inbox?conversation=${message.result.conversation_id}`}
            className="inline-flex items-center gap-2 text-sm text-primary"
          >
            Open conversation
            <ArrowRightIcon className="size-4" />
          </Link>
        )}
        {proposal && (
          <div className="max-w-xl rounded-xl border bg-card p-4 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium">
                {proposal.title || proposal.action.replaceAll("_", " ")}
              </span>
              <Badge variant="outline">{message.action_status}</Badge>
            </div>
            {proposal.description && (
              <p className="mt-2 text-muted-foreground">
                {proposal.description}
              </p>
            )}
            {proposal.starts_at && (
              <p className="mt-2 flex items-center gap-2">
                <CalendarIcon className="size-4" />
                {dateLabel(proposal.starts_at)}
              </p>
            )}
            {proposal.tag && <p className="mt-2">Tag: {proposal.tag}</p>}
            {proposal.status && (
              <p className="mt-2">
                New status:{" "}
                {WORK_COLUMNS[proposal.status as keyof typeof WORK_COLUMNS] ||
                  proposal.status}
              </p>
            )}
            {proposal.amount && (
              <p className="mt-2">
                {formatMoney(proposal.amount, proposal.currency || "USD")}
              </p>
            )}
            {proposal.fields?.map((field) => (
              <div key={field.key} className="mt-2 flex flex-wrap gap-2">
                <span className="text-muted-foreground capitalize">
                  {field.key}:
                </span>
                <span>
                  {String(
                    field.key === "name"
                      ? (proposal.before?.name ?? "Not saved")
                      : (proposal.before?.profile?.[field.key] ?? "Not saved")
                  )}
                </span>
                <ArrowRightIcon className="size-4" />
                <span className="font-medium">{field.value}</span>
              </div>
            ))}
            {message.action_status === "pending" && (
              <div className="mt-4 flex gap-2">
                <Button
                  size="sm"
                  disabled={busy !== null || sending}
                  onClick={() => void decide(message, "confirm")}
                >
                  <CheckIcon className="size-4" />
                  Confirm
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy !== null || sending}
                  onClick={() => void decide(message, "cancel")}
                >
                  Cancel
                </Button>
              </div>
            )}
            {message.result?.conversation_id && (
              <Link
                href={`/inbox?conversation=${message.result.conversation_id}`}
                className="mt-3 inline-flex items-center gap-1 text-primary"
              >
                Open conversation
                <ArrowRightIcon className="size-3" />
              </Link>
            )}
          </div>
        )}
      </Message>
    )
  }
  return (
    <HomepagePromptFrame
      embedded
      value={prompt}
      onValueChange={setPrompt}
      onSend={send}
      isSubmitting={sending}
      view={view}
      onViewChange={setView}
      conversation={
        <>
          {snapshot?.messages.length || sending ? (
            <div
              ref={scrollRef}
              className="flex max-h-96 flex-col gap-5 overflow-y-auto p-4 sm:p-5"
            >
              {snapshot?.messages.map(renderMessage)}
              {optimistic && (
                <Message from="user">
                  <MessageContent>{optimistic}</MessageContent>
                </Message>
              )}
              {sending && (
                <p
                  role="status"
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <LoaderCircleIcon className="size-4 animate-spin" />
                  Looking into your workspace…
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 px-5 py-4">
              {[
                "What needs my attention?",
                "Show my finances",
                "Plan a meeting",
                "Show upcoming follow-ups",
              ].map((text) => (
                <Button
                  key={text}
                  variant="outline"
                  size="sm"
                  onClick={() => setPrompt(text)}
                >
                  {text}
                </Button>
              ))}
            </div>
          )}
          {conversationId && (
            <div className="flex items-center justify-between gap-2 border-t px-5 py-2 text-xs text-muted-foreground">
              <span>Using the selected Inbox conversation as context</span>
              <Link href="/home" className="inline-flex items-center gap-1">
                <XIcon className="size-3" />
                Clear
              </Link>
            </div>
          )}
        </>
      }
      footer={
        <>
          <div className="flex min-w-0 items-start gap-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border">
              <SparklesIcon className="size-4" />
            </span>
            <div>
              <p className="text-sm font-medium">Your briefing</p>
              {snapshot ? (
                <p
                  className="text-xs leading-5 text-muted-foreground"
                  aria-live="polite"
                >
                  {snapshot.briefing}
                </p>
              ) : (
                <Skeleton className="mt-1 h-4 w-48" />
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void readAll()}
            disabled={!snapshot?.unread_count}
          >
            <BellIcon className="size-4" />
            {snapshot?.unread_count ?? 0} new · Mark read
          </Button>
        </>
      }
    >
      {error && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          <span>{error}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              void reload().catch((cause) => setError(errorMessage(cause)))
            }
          >
            Retry
          </Button>
        </div>
      )}
      {!!snapshot?.finance.length && (
        <section
          aria-label="Financial summary"
          className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
        >
          {snapshot.finance.map((wallet) => (
            <div key={wallet.id} className="rounded-xl border bg-card p-4">
              <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>{wallet.currency} · Available balance</span>
                <WalletIcon className="size-4" />
              </div>
              <p className="text-2xl font-semibold tabular-nums">
                {formatMoney(wallet.balance, wallet.currency)}
              </p>
              <div className="mt-4 flex justify-between gap-3 text-xs">
                <span className="text-muted-foreground">This month</span>
                <span>
                  Received {formatMoney(wallet.received, wallet.currency)}
                </span>
                <span>Spent {formatMoney(wallet.spent, wallet.currency)}</span>
              </div>
            </div>
          ))}
        </section>
      )}
      <section aria-label="Workspace board" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            className="flex rounded-lg border bg-muted/40 p-1"
            role="group"
            aria-label="Board view"
          >
            {(
              [
                ["work", "Your work"],
                ["finance", "Accounting"],
                ["transactions", "Transactions"],
              ] as const
            ).map(([mode, label]) => (
              <Button
                key={mode}
                variant={view === mode ? "secondary" : "ghost"}
                size="sm"
                aria-pressed={view === mode}
                onClick={() => setView(mode)}
              >
                {label}
              </Button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <SearchIcon className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
            <Input
              aria-label="Search board"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Find something…"
              className="pl-9"
            />
          </div>
        </div>
        {view !== "work" && (
          <p className="text-xs text-muted-foreground">
            Review and reconciliation states only. Moving a card never moves
            money or confirms a payment.
          </p>
        )}
        {!snapshot ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Object.keys(WORK_COLUMNS).map((key) => (
              <Skeleton key={key} className="h-64 rounded-xl" />
            ))}
          </div>
        ) : view === "transactions" ? (
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-muted/40">
                <tr>
                  {["Transaction", "Date", "Amount", "Review"].map((label) => (
                    <th key={label} className="px-4 py-3 font-medium">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleItems
                  .filter((item) => item.kind === "transaction")
                  .map((item) => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelected(item)}
                          className="text-left hover:underline"
                        >
                          {item.title}
                        </button>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                        {item.payload.recorded_at &&
                          dateLabel(item.payload.recorded_at)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap tabular-nums">
                        {item.payload.direction === "credit" ? "+" : "−"}
                        {formatMoney(
                          item.payload.amount || "0",
                          item.payload.currency || "USD"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {
                          FINANCE_COLUMNS[
                            item.status as keyof typeof FINANCE_COLUMNS
                          ]
                        }
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {!visibleItems.some((item) => item.kind === "transaction") && (
              <p className="p-8 text-center text-sm text-muted-foreground">
                No recorded transactions yet.
              </p>
            )}
          </div>
        ) : (
          <Kanban
            value={grouped}
            getItemValue={(item) => item.id}
            onValueChange={(next) => {
              if (busy) return
              const change = statusChange(items, next)
              if (change)
                void changeItem(change.item, { status: change.status })
            }}
          >
            <KanbanBoard className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Object.entries(columns).map(([status, label]) => (
                <KanbanColumn
                  key={status}
                  value={status}
                  className="min-h-48 rounded-xl border bg-muted/30 p-3"
                >
                  <div className="mb-3 flex items-center justify-between gap-2 px-1">
                    <h2 className="text-sm font-medium">{label}</h2>
                    <span className="rounded-md bg-background px-2 py-0.5 text-xs text-muted-foreground">
                      {grouped[status].length}
                    </span>
                  </div>
                  <KanbanColumnContent
                    value={status}
                    className="flex flex-col gap-3"
                  >
                    {grouped[status].map((item) => (
                      <KanbanItem
                        key={item.id}
                        value={item.id}
                        disabled={busy !== null}
                      >
                        <article className="rounded-xl border bg-card p-3 shadow-sm">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <Badge variant="outline" className="text-[10px]">
                              {kindLabels[item.kind]}
                            </Badge>
                            <KanbanItemHandle
                              render={
                                <button
                                  aria-label={`Move ${item.title}`}
                                  className="cursor-grab text-muted-foreground"
                                />
                              }
                            >
                              <GripVerticalIcon className="size-4" />
                            </KanbanItemHandle>
                          </div>
                          <button
                            className="w-full text-left"
                            onClick={() => {
                              setSelected(item)
                              if (!item.read_at)
                                void changeItem(item, { read: true })
                            }}
                          >
                            <p className="text-sm leading-snug font-medium">
                              {item.title}
                            </p>
                            {item.description && (
                              <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                                {item.description}
                              </p>
                            )}
                            {item.payload.amount && (
                              <p className="mt-3 text-lg font-semibold tabular-nums">
                                {formatMoney(
                                  item.payload.amount,
                                  item.payload.currency || "USD"
                                )}
                              </p>
                            )}
                          </button>
                          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            {item.priority === "urgent" && (
                              <Badge variant="destructive">Urgent</Badge>
                            )}
                            {item.due_at && (
                              <span className="inline-flex items-center gap-1">
                                <ClockIcon className="size-3" />
                                {dateLabel(item.due_at)}
                              </span>
                            )}
                            {item.conversation_id && (
                              <Link
                                href={`/inbox?conversation=${item.conversation_id}`}
                                className="ml-auto inline-flex items-center gap-1 text-primary"
                              >
                                <MessageSquareIcon className="size-3" />
                                Inbox
                              </Link>
                            )}
                          </div>
                        </article>
                      </KanbanItem>
                    ))}
                    {!grouped[status].length && (
                      <p className="py-8 text-center text-xs text-muted-foreground">
                        Nothing here yet
                      </p>
                    )}
                  </KanbanColumnContent>
                </KanbanColumn>
              ))}
            </KanbanBoard>
          </Kanban>
        )}
      </section>
      <p className="text-center text-xs text-muted-foreground">
        Your board stays in sync with Inbox. Meetings and reminders use your
        local timezone.
      </p>
      <Sheet
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
      >
        <SheetContent
          onPointerDownOutside={(event) => {
            if (
              (event.target as HTMLElement)?.getAttribute?.("data-slot") !==
              "sheet-overlay"
            )
              event.preventDefault()
          }}
          onInteractOutside={(event) => {
            if (
              (event.target as HTMLElement)?.getAttribute?.("data-slot") !==
              "sheet-overlay"
            )
              event.preventDefault()
          }}
        >
          <SheetHeader>
            <SheetTitle>{selected?.title}</SheetTitle>
            <SheetDescription>
              {selected?.description || "Work item details"}
            </SheetDescription>
          </SheetHeader>
          {selected && (
            <div className="flex flex-col gap-5 overflow-y-auto px-4 pb-6">
              <Badge variant="outline" className="self-start">
                {kindLabels[selected.kind]}
              </Badge>
              {selected.due_at && (
                <p className="text-sm">
                  Scheduled: {dateLabel(selected.due_at)}
                </p>
              )}
              {selected.payload.insights?.summary && (
                <p className="text-sm">{selected.payload.insights.summary}</p>
              )}
              {selected.payload.insights?.evidence && (
                <blockquote className="border-l-2 pl-3 text-sm text-muted-foreground">
                  {selected.payload.insights.evidence}
                </blockquote>
              )}
              {selected.payload.insights?.facts?.map((fact) => (
                <p key={fact.key} className="text-sm">
                  <span className="font-medium">{fact.key}: </span>
                  {fact.value}
                  <span className="ml-2 text-xs text-muted-foreground">
                    AI suggestion
                  </span>
                </p>
              ))}
              {selected.payload.insights?.meeting_suggestion && (
                <p className="text-sm">
                  Suggested meeting:{" "}
                  {selected.payload.insights.meeting_suggestion}
                </p>
              )}
              {selected.payload.amount && (
                <p className="text-2xl font-semibold">
                  {formatMoney(
                    selected.payload.amount,
                    selected.payload.currency || "USD"
                  )}
                </p>
              )}
              <Select
                value={selected.status}
                onValueChange={(value) => {
                  if (value)
                    void changeItem(selected, { status: value as HomeStatus })
                }}
                disabled={busy !== null}
              >
                <SelectTrigger aria-label="Work item status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(
                    selected.kind === "finance" ||
                      selected.kind === "transaction"
                      ? FINANCE_COLUMNS
                      : WORK_COLUMNS
                  ).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                disabled={busy !== null}
                onClick={() =>
                  void changeItem(selected, {
                    snoozed_until: new Date(Date.now() + 600000).toISOString(),
                  })
                }
              >
                <ClockIcon className="size-4" />
                Remind me in 10 minutes
              </Button>
              {["meeting", "follow_up", "task", "finance"].includes(
                selected.kind
              ) && (
                <Button
                  variant="outline"
                  disabled={busy !== null}
                  onClick={() =>
                    void changeItem(selected, { status: "cancelled" })
                  }
                >
                  Cancel item
                </Button>
              )}
              {selected.conversation_id && (
                <>
                  <Link
                    href={`/inbox?conversation=${selected.conversation_id}`}
                    className="inline-flex items-center gap-2 text-sm text-primary"
                  >
                    Open in Inbox
                    <ArrowRightIcon className="size-4" />
                  </Link>
                  <Link
                    href={`/home?conversation=${selected.conversation_id}`}
                    onClick={() => setSelected(null)}
                    className="inline-flex items-center gap-2 text-sm text-primary"
                  >
                    Ask AI about this customer
                    <SparklesIcon className="size-4" />
                  </Link>
                </>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </HomepagePromptFrame>
  )
}
