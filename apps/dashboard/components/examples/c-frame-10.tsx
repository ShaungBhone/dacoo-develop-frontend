"use client"

import { type FormEvent, type ReactNode, useState } from "react"
import {
  ArrowUpIcon,
  LoaderCircleIcon,
  PlusIcon,
  SparklesIcon,
} from "lucide-react"
import { Frame, FrameFooter, FramePanel } from "@/components/reui/frame"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/contexts/auth-context"
import type { HomeViewMode } from "@/components/home/api"
import { cn } from "@/lib/utils"

type HomepagePromptFrameProps = {
  embedded?: boolean
  value?: string
  onValueChange?: (value: string) => void
  onSend?: (text: string) => Promise<void> | void
  isSubmitting?: boolean
  view?: HomeViewMode
  onViewChange?: (view: HomeViewMode) => void
  conversation?: ReactNode
  footer?: ReactNode
  children?: ReactNode
}

const views = {
  work: "Your work",
  finance: "Accounting",
  transactions: "Transactions",
} as const

export function HomepagePromptFrame({
  embedded = false,
  value,
  onValueChange,
  onSend,
  isSubmitting = false,
  view = "work",
  onViewChange,
  conversation,
  footer,
  children,
}: HomepagePromptFrameProps) {
  const { user } = useAuth()
  const [localPrompt, setLocalPrompt] = useState("")
  const [submitError, setSubmitError] = useState<string | null>(null)
  const prompt = value ?? localPrompt
  const updatePrompt = onValueChange ?? setLocalPrompt

  async function submitPrompt(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault()
    const text = prompt.trim()
    if (!text || isSubmitting || !onSend) return
    setSubmitError(null)
    try {
      await onSend(text)
      if (value === undefined) setLocalPrompt("")
    } catch {
      setSubmitError(
        "Couldn’t send your message. Your draft is still here—please try again."
      )
    }
  }

  return (
    <main
      className={cn(
        "bg-background px-4 pt-9 pb-8 text-foreground sm:pt-14",
        embedded ? "min-h-0 flex-1 overflow-y-auto" : "min-h-svh"
      )}
    >
      <section className="mx-auto w-full max-w-180" aria-label="Home assistant">
        <div className="mx-auto max-w-xl text-center">
          <h1 className="text-3xl leading-tight font-semibold tracking-[-0.04em] sm:text-[2.25rem]">
            Good morning, {user?.name ?? "there"}
          </h1>
        </div>
        <Frame
          spacing="sm"
          className="mt-7 w-full rounded-2xl border-border/80 bg-muted/35 shadow-[0_18px_55px_-36px_rgba(0,0,0,0.45)] dark:bg-muted/20"
        >
          {conversation}
          <FramePanel className="min-h-40 border-border/80 bg-card pb-0 shadow-sm before:hidden">
            <form
              className="flex min-h-32 flex-col justify-between gap-5"
              onSubmit={(event) => void submitPrompt(event)}
            >
              <label className="sr-only" htmlFor="homepage-prompt">
                Ask Dacoo
              </label>
              <textarea
                id="homepage-prompt"
                value={prompt}
                onChange={(event) => updatePrompt(event.target.value)}
                onKeyDown={(event) => {
                  if (
                    (event.metaKey || event.ctrlKey) &&
                    event.key === "Enter"
                  ) {
                    event.preventDefault()
                    void submitPrompt()
                  }
                }}
                disabled={isSubmitting}
                placeholder="Ask, plan, or tell me what to take care of…"
                className="min-h-20 w-full resize-none bg-transparent text-sm leading-6 outline-none placeholder:text-muted-foreground focus-visible:ring-0 sm:text-[15px]"
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex min-w-0 flex-wrap items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Add attachment"
                    title="Attachments are not available yet"
                    disabled
                  >
                    <PlusIcon />
                  </Button>
                  <span
                    aria-hidden="true"
                    className="mx-1 h-4 w-px bg-border"
                  />
                  <span className="inline-flex items-center gap-2 px-1.5 text-sm text-muted-foreground">
                    <span
                      aria-hidden="true"
                      className="flex size-4.5 items-center justify-center rounded-[5px] border-2 border-muted-foreground/45"
                    >
                      <span className="size-1.5 rounded-full bg-muted-foreground/55" />
                    </span>
                    Dacoo AI
                  </span>
                  <Select
                    value={view}
                    onValueChange={(next) => {
                      if (next && next in views)
                        onViewChange?.(next as HomeViewMode)
                    }}
                  >
                    <SelectTrigger
                      aria-label="Board view"
                      size="sm"
                      className="border-0 bg-transparent px-1.5 text-muted-foreground shadow-none hover:bg-muted hover:text-foreground dark:bg-transparent dark:hover:bg-muted"
                    >
                      <SelectValue>{views[view]}</SelectValue>
                    </SelectTrigger>
                    <SelectContent align="start" alignItemWithTrigger={false}>
                      {Object.entries(views).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="submit"
                  size="icon-lg"
                  aria-label="Submit prompt"
                  disabled={isSubmitting || !prompt.trim() || !onSend}
                >
                  {isSubmitting ? (
                    <LoaderCircleIcon className="animate-spin" />
                  ) : (
                    <ArrowUpIcon />
                  )}
                </Button>
              </div>
            </form>
          </FramePanel>
          <FrameFooter className="gap-3 pb-2 sm:flex-row sm:items-center sm:justify-between">
            {footer ?? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <SparklesIcon className="size-4" />
                Changes are previewed before saving.
              </div>
            )}
          </FrameFooter>
        </Frame>
        {submitError && (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {submitError}
          </p>
        )}
      </section>
      {children && (
        <div className="mx-auto mt-8 flex w-full max-w-7xl flex-col gap-7">
          {children}
        </div>
      )}
    </main>
  )
}
