"use client"

import * as React from "react"
import type { PanelImperativeHandle } from "react-resizable-panels"

import { ApiError } from "@/lib/api"
import { useActiveOrganization } from "@/hooks/use-active-organization"
import {
  generateOpeningMessage,
  runDatasetQuery,
  type AgentSummary,
} from "@/components/rag/api"
import { streamText } from "@/components/rag/retrieval"
import { DatabaseIcon, RotateCcwIcon, XIcon } from "@/components/ui/icons"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Bubble, BubbleContent } from "@/components/ui/bubble"
import { Button } from "@/components/ui/button"
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageGroup,
  MessageHeader,
} from "@/components/ui/message"
import { ResizablePanel } from "@/components/ui/resizable"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input"

type TestMessage = {
  id: string
  role: "user" | "agent"
  body: string
  at: string
}

type GeneratedOpening = {
  key: string | null
  message: string | null
}

function timeLabel(timestamp: string) {
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp))
}

// The query API returns a structured report; the chat panel shows it as one
// plain bubble, so flatten summary + every bullet into a single string. Same
// shape the playground console uses before streaming.
function flattenAnswer(structured: {
  summary: { text: string }
  sections: { bullets: { text: string }[] }[]
}): string {
  return [
    structured.summary.text,
    ...structured.sections.flatMap((s) => s.bullets).map((b) => b.text),
  ]
    .filter(Boolean)
    .join(" ")
}

interface AgentTestChatProps {
  agent: AgentSummary
  onClose?: () => void
  isMobile?: boolean
  panelRef?: React.RefObject<PanelImperativeHandle | null>
  onResize?: (size: { asPercentage: number }) => void
  openMobile?: boolean
  onOpenMobileChange?: (open: boolean) => void
}

export function AgentTestChat({
  agent,
  onClose,
  isMobile = false,
  panelRef,
  onResize,
  openMobile,
  onOpenMobileChange,
}: AgentTestChatProps) {
  const organization = useActiveOrganization()
  const [messages, setMessages] = React.useState<TestMessage[]>([])
  const [isRunning, setIsRunning] = React.useState(false)
  const [streamedText, setStreamedText] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [openingVersion, setOpeningVersion] = React.useState(0)
  const [generatedOpening, setGeneratedOpening] =
    React.useState<GeneratedOpening>({ key: null, message: null })
  const stopStreamRef = React.useRef<(() => void) | null>(null)
  const scrollContainerRef = React.useRef<HTMLDivElement | null>(null)

  const datasetId = agent.datasetIds?.[0]
  const canSend = Boolean(organization && datasetId)
  const firstMessageMode =
    agent.messages.firstMessageMode ?? "assistant-speaks-first"
  const isChatVisible = !isMobile || Boolean(openMobile)
  const usesGeneratedOpening =
    firstMessageMode === "assistant-speaks-first-with-model-generated-message"
  const openingRequestKey = [
    organization?.id,
    agent.name,
    agent.system,
    agent.persona.tone,
    agent.persona.language,
    openingVersion,
  ].join(":")
  const shouldGenerateOpening = Boolean(
    organization && isChatVisible && usesGeneratedOpening
  )
  const isGeneratingOpening =
    shouldGenerateOpening && generatedOpening.key !== openingRequestKey

  let openingMessage: string | null = null
  if (firstMessageMode === "assistant-speaks-first") {
    openingMessage = agent.messages.greeting || null
  } else if (
    usesGeneratedOpening &&
    generatedOpening.key === openingRequestKey
  ) {
    openingMessage = generatedOpening.message
  }

  React.useEffect(() => {
    if (!organization || !isChatVisible || !usesGeneratedOpening) return

    const controller = new AbortController()

    void generateOpeningMessage(
      organization.id,
      {
        name: agent.name,
        system: agent.system,
        tone: agent.persona.tone,
        language: agent.persona.language,
      },
      controller.signal
    )
      .then((message) => {
        setGeneratedOpening({ key: openingRequestKey, message })
      })
      .catch((cause) => {
        if (controller.signal.aborted) return
        setGeneratedOpening({
          key: openingRequestKey,
          message: agent.messages.greeting || null,
        })
        setError(
          cause instanceof ApiError
            ? `Couldn’t generate a first message. ${cause.message}`
            : "Couldn’t generate a first message. Using the saved first message instead."
        )
      })

    return () => controller.abort()
  }, [
    agent.messages.greeting,
    agent.name,
    agent.persona.language,
    agent.persona.tone,
    agent.system,
    isChatVisible,
    openingRequestKey,
    organization,
    usesGeneratedOpening,
  ])

  // Stop any in-flight typing animation when the panel unmounts, otherwise the
  // interval keeps firing setState on a dead component.
  React.useEffect(() => {
    return () => stopStreamRef.current?.()
  }, [])

  React.useEffect(() => {
    const el = scrollContainerRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, streamedText])

  const handleSend = React.useCallback(
    async (text: string) => {
      const query = text.trim()
      if (!query || isRunning || !organization || !datasetId) return

      stopStreamRef.current?.()
      setStreamedText("")
      setError(null)
      setIsRunning(true)

      const now = new Date().toISOString()
      setMessages((prev) => [
        ...prev,
        { id: `u-${now}-${prev.length}`, role: "user", body: query, at: now },
      ])

      try {
        const response = await runDatasetQuery(organization.id, datasetId, {
          query,
          system_prompt: agent.system || "",
        })

        const commit = (body: string) => {
          const at = new Date().toISOString()
          setMessages((prev) => [
            ...prev,
            { id: `a-${at}-${prev.length}`, role: "agent", body, at },
          ])
          setStreamedText("")
        }

        setIsRunning(false)

        // Nothing in the sources was relevant — this is exactly what the
        // agent's fallback message is configured for, so show that instead of
        // an ungrounded answer, and skip the typing animation.
        if (!response.grounded) {
          commit(agent.messages.fallback || flattenAnswer(response.structured))
          return
        }

        const fullText = flattenAnswer(response.structured)
        stopStreamRef.current = streamText(
          fullText,
          (partial) => setStreamedText(partial),
          () => {
            stopStreamRef.current = null
            commit(fullText)
          }
        )
      } catch (err) {
        setIsRunning(false)
        setError(
          err instanceof ApiError ? err.message : "The query failed. Try again."
        )
      }
    },
    [agent.messages.fallback, agent.system, datasetId, isRunning, organization]
  )

  const handleReset = React.useCallback(() => {
    stopStreamRef.current?.()
    stopStreamRef.current = null
    setMessages([])
    setStreamedText("")
    setError(null)
    setIsRunning(false)
    if (usesGeneratedOpening) setOpeningVersion((version) => version + 1)
  }, [usesGeneratedOpening])

  const agentInitial = agent.name.slice(0, 1).toUpperCase()

  const renderAgentBubble = (key: string, body: string, at: string | null) => (
    <Message key={key} align="start">
      <MessageAvatar>
        <Avatar className="size-8">
          <AvatarFallback>{agentInitial}</AvatarFallback>
        </Avatar>
      </MessageAvatar>
      <MessageContent>
        <MessageHeader>{agent.name}</MessageHeader>
        <Bubble align="start" variant="outline">
          <BubbleContent>
            <p className="whitespace-pre-wrap">{body}</p>
          </BubbleContent>
        </Bubble>
        {at ? (
          <MessageFooter>
            <span suppressHydrationWarning>{timeLabel(at)}</span>
          </MessageFooter>
        ) : null}
      </MessageContent>
    </Message>
  )

  const content = (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background">
      <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border px-4">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-sm font-semibold">Test chat</span>
          <span className="truncate text-xs text-muted-foreground">
            {datasetId
              ? `Answers from ${agent.datasetIds?.length} source${
                  agent.datasetIds?.length === 1 ? "" : "s"
                }`
              : "No knowledge source selected"}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Reset conversation"
            disabled={
              messages.length === 0 &&
              !streamedText &&
              (!usesGeneratedOpening || isGeneratingOpening)
            }
            onClick={handleReset}
            className="text-muted-foreground hover:text-foreground"
          >
            <RotateCcwIcon className="size-4" />
          </Button>
          {onClose ? (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Close test chat"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <XIcon className="size-4" />
            </Button>
          ) : null}
        </div>
      </header>

      <div
        ref={scrollContainerRef}
        className="scrollbar-thin min-h-0 flex-1 overflow-y-auto bg-muted/50"
      >
        <div className="flex w-full flex-col gap-6 px-4 py-6">
          <MessageGroup className="gap-6">
            {/* The opening is not part of `messages` so Reset starts fresh. */}
            {openingMessage
              ? renderAgentBubble("opening", openingMessage, null)
              : null}

            {messages.map((message) =>
              message.role === "agent" ? (
                renderAgentBubble(message.id, message.body, message.at)
              ) : (
                <Message key={message.id} align="end">
                  <MessageContent>
                    <Bubble align="end" variant="default">
                      <BubbleContent>
                        <p className="whitespace-pre-wrap">{message.body}</p>
                      </BubbleContent>
                    </Bubble>
                    <MessageFooter>
                      <span suppressHydrationWarning>
                        {timeLabel(message.at)}
                      </span>
                    </MessageFooter>
                  </MessageContent>
                </Message>
              )
            )}

            {streamedText
              ? renderAgentBubble("streaming", streamedText, null)
              : null}

            {isRunning || isGeneratingOpening ? (
              <Message align="start">
                <MessageAvatar>
                  <Avatar className="size-8">
                    <AvatarFallback>{agentInitial}</AvatarFallback>
                  </Avatar>
                </MessageAvatar>
                <MessageContent>
                  <Bubble align="start" variant="outline">
                    <BubbleContent>
                      <span className="text-muted-foreground">
                        {isGeneratingOpening
                          ? "Writing first message…"
                          : "Thinking…"}
                      </span>
                    </BubbleContent>
                  </Bubble>
                </MessageContent>
              </Message>
            ) : null}
          </MessageGroup>
        </div>
      </div>

      {!canSend ? (
        <div className="flex shrink-0 items-start gap-2 border-t border-border bg-background px-4 py-3 text-xs text-muted-foreground">
          <DatabaseIcon className="mt-px size-3.5 shrink-0" />
          <span>Select at least one knowledge source to test this agent.</span>
        </div>
      ) : null}

      {error ? (
        <p className="shrink-0 px-4 pt-2 text-xs text-destructive">{error}</p>
      ) : null}

      <div className="shrink-0 border-t border-border bg-background p-2">
        <PromptInput
          onSubmit={async ({ text }) => {
            if (!text.trim() || !canSend || isRunning || isGeneratingOpening)
              return
            await handleSend(text)
          }}
        >
          <PromptInputTextarea
            disabled={!canSend || isRunning || isGeneratingOpening}
            placeholder="Ask this agent something…"
            className="min-h-14 px-3 pt-3 text-sm"
          />
          <PromptInputFooter>
            <div />
            <PromptInputSubmit
              disabled={!canSend || isRunning || isGeneratingOpening}
              size="sm"
              status={
                isRunning || isGeneratingOpening ? "submitted" : undefined
              }
            >
              Send
            </PromptInputSubmit>
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={onOpenMobileChange}>
        <SheetContent
          side="right"
          showCloseButton={false}
          className="bg-background p-0"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Test chat</SheetTitle>
            <SheetDescription>
              Send test messages to this agent.
            </SheetDescription>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <ResizablePanel
      id="agent-test-chat"
      defaultSize="30%"
      minSize="22%"
      maxSize="45%"
      className="min-w-0"
      panelRef={panelRef}
      onResize={onResize}
    >
      {content}
    </ResizablePanel>
  )
}
