"use client"

import * as React from "react"
import Image from "next/image"
import {
  type LocalizedText,
  type ViberAutomation,
  type ViberCarouselCard,
  type ViberExperienceRevision,
  type ViberLocale,
  type ViberMenuButton,
} from "./viber-experience-api"
import {
  BotIcon,
  Clock3Icon,
  ExternalLinkIcon,
  FlaskConicalIcon,
  HeadphonesIcon,
  ImageIcon,
  KeyboardIcon,
  LayoutGridIcon,
  RotateCcwIcon,
  SendIcon,
  XIcon,
} from "@/components/ui/icons"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Bubble, BubbleContent } from "@/components/ui/bubble"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Field } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageGroup,
  MessageHeader,
} from "@/components/ui/message"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

function localized(
  value: LocalizedText | null | undefined,
  locale: ViberLocale
): string {
  return value?.[locale] ?? value?.en ?? ""
}

type ChatMessage = {
  id: string
  sender: "bot" | "user" | "system"
  text?: string
  time: string
  automation?: ViberAutomation
  isHandoff?: boolean
}

type ViberMobilePreviewProps = {
  revision: ViberExperienceRevision
  locale: ViberLocale
  automation?: ViberAutomation
  className?: string
  onClose?: () => void
  sendTest?: {
    conversations: { id: string; label: string }[]
    activeConversationId: string | null
    remainingSeconds: number
    disabled: boolean
    status: "idle" | "starting" | "stopping"
    onStart: (conversationId: string) => Promise<boolean>
    onStop: () => Promise<boolean>
  }
}

type PreviewActionResult = {
  automation?: ViberAutomation
  externalUrl?: string
  isHandoff?: boolean
  responseText?: string
  userText: string
}

function buildInitialMessages(
  welcomeText: string,
  automation: ViberAutomation | undefined,
  locale: ViberLocale
): ChatMessage[] {
  const initialMsgs: ChatMessage[] = [
    {
      id: "welcome",
      sender: "bot",
      text:
        welcomeText ||
        "Welcome to our Viber service! How can we help you today?",
      time: "Just now",
    },
  ]

  if (automation) {
    initialMsgs.push({
      id: `auto-${automation.id ?? "focused"}`,
      sender: "bot",
      text: localized(automation.response_text, locale),
      automation,
      isHandoff: automation.response_type === "handoff",
      time: "Just now",
    })
  }

  return initialMsgs
}

function findMatchingAutomation(
  revision: ViberExperienceRevision,
  locale: ViberLocale,
  query: string
): ViberAutomation | undefined {
  const clean = query.trim().toLowerCase()
  if (!clean) return undefined

  return revision.automations.find((item) => {
    if (!item.is_enabled) return false
    const triggers = item.triggers?.[locale] ?? item.triggers?.en ?? []

    return triggers.some((trigger) => trigger.trim().toLowerCase() === clean)
  })
}

export function safeViberPreviewUrl(value: string): string | null {
  try {
    const url = new URL(value)

    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null
  } catch {
    return null
  }
}

export function resolveViberCarouselAction(
  revision: ViberExperienceRevision,
  locale: ViberLocale,
  card: ViberCarouselCard
): PreviewActionResult {
  const userText = localized(card.cta_label, locale) || "Open"

  if (card.action_type === "open_url") {
    const externalUrl = safeViberPreviewUrl(
      localized(card.action_value, locale)
    )

    return { userText, ...(externalUrl ? { externalUrl } : {}) }
  }

  const handoffText =
    localized(revision.handoff_text, locale) ||
    "An agent has been notified and will be with you shortly."

  if (card.action_type === "handoff") {
    return { userText, responseText: handoffText, isHandoff: true }
  }

  const trigger = localized(card.action_value, locale) || userText
  const matched = findMatchingAutomation(revision, locale, trigger)

  if (matched) {
    const isHandoff = matched.response_type === "handoff"

    return {
      userText,
      automation: matched,
      responseText:
        localized(matched.response_text, locale) ||
        (isHandoff ? handoffText : undefined),
      isHandoff,
    }
  }

  return {
    userText,
    responseText:
      localized(revision.fallback_text, locale) ||
      "Sorry, I didn't quite catch that. Please try another message.",
  }
}

export function ViberMobilePreview({
  revision,
  locale,
  automation,
  className,
  onClose,
  sendTest,
}: ViberMobilePreviewProps) {
  const welcomeText =
    localized(revision.welcome_text, locale) ||
    "Welcome to our Viber service! How can we help you today?"
  const fallbackText =
    localized(revision.fallback_text, locale) ||
    "Sorry, I didn't quite catch that. Please select an option from the menu below."
  const handoffText =
    localized(revision.handoff_text, locale) ||
    "An agent has been notified and will be with you shortly."

  const [messages, setMessages] = React.useState<ChatMessage[]>(() =>
    buildInitialMessages(welcomeText, automation, locale)
  )
  const [inputText, setInputText] = React.useState("")
  const [sendTestOpen, setSendTestOpen] = React.useState(false)
  const [pendingTestAction, setPendingTestAction] = React.useState<
    "starting" | "stopping" | null
  >(null)
  const [isKeyboardDocked, setIsKeyboardDocked] = React.useState(
    revision.menu_buttons.length > 0
  )
  const messagesEndRef = React.useRef<HTMLDivElement>(null)
  const counterRef = React.useRef(1)
  const activeTestConversation = sendTest?.conversations.find(
    (conversation) => conversation.id === sendTest.activeConversationId
  )
  const testStatus = pendingTestAction ?? sendTest?.status ?? "idle"

  const getNextId = (prefix: string) => {
    counterRef.current += 1
    return `${prefix}-${counterRef.current}`
  }

  // Reset chat action
  const handleResetChat = () => {
    setMessages(buildInitialMessages(welcomeText, automation, locale))
    setInputText("")
    setIsKeyboardDocked(revision.menu_buttons.length > 0)
  }

  // Auto-scroll to bottom of chat
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Handle menu button clicks
  const handleButtonClick = (button: ViberMenuButton) => {
    const label = localized(button.label, locale) || "Option"

    // 1. Add user message
    const userMsg: ChatMessage = {
      id: getNextId("user"),
      sender: "user",
      text: label,
      time: "Just now",
    }

    // 2. Determine bot response based on action_type
    let botMsg: ChatMessage | null = null

    if (button.action_type === "handoff") {
      botMsg = {
        id: getNextId("bot"),
        sender: "bot",
        text: handoffText,
        isHandoff: true,
        time: "Just now",
      }
    } else if (button.action_type === "open_url") {
      const url = localized(button.action_value, locale)
      botMsg = {
        id: getNextId("bot"),
        sender: "bot",
        text: url ? `Opening link: ${url}` : "Opening website...",
        time: "Just now",
      }
    } else if (button.action_type === "share-phone") {
      botMsg = {
        id: getNextId("bot"),
        sender: "bot",
        text: "Thank you for sharing your contact number.",
        time: "Just now",
      }
    } else {
      // "reply" or generic action: check for matching automation trigger
      const triggerValue = localized(button.action_value, locale) || label
      const matched = findMatchingAutomation(revision, locale, triggerValue)

      if (matched) {
        botMsg = {
          id: getNextId("bot"),
          sender: "bot",
          text: localized(matched.response_text, locale),
          automation: matched,
          isHandoff: matched.response_type === "handoff",
          time: "Just now",
        }
      } else {
        botMsg = {
          id: getNextId("bot"),
          sender: "bot",
          text: localized(revision.menu_text, locale) || `Selected: "${label}"`,
          time: "Just now",
        }
      }
    }

    setMessages((prev) => [...prev, userMsg, ...(botMsg ? [botMsg] : [])])
  }

  // Handle text input submit
  const handleSendMessage = (value: string) => {
    const text = value.trim()
    if (!text) return

    const userMsg: ChatMessage = {
      id: getNextId("user"),
      sender: "user",
      text,
      time: "Just now",
    }

    // Search for trigger
    const matched = findMatchingAutomation(revision, locale, text)
    let botMsg: ChatMessage

    if (matched) {
      botMsg = {
        id: getNextId("bot"),
        sender: "bot",
        text: localized(matched.response_text, locale),
        automation: matched,
        isHandoff: matched.response_type === "handoff",
        time: "Just now",
      }
    } else {
      botMsg = {
        id: getNextId("bot"),
        sender: "bot",
        text: fallbackText,
        time: "Just now",
      }
    }

    setMessages((prev) => [...prev, userMsg, botMsg])
    setInputText("")
  }

  const handleCarouselAction = (card: ViberCarouselCard) => {
    const result = resolveViberCarouselAction(revision, locale, card)
    const userMsg: ChatMessage = {
      id: getNextId("user"),
      sender: "user",
      text: result.userText,
      time: "Just now",
    }
    const hasResponse = Boolean(
      result.responseText || result.automation || result.isHandoff
    )
    const botMsg: ChatMessage | null = hasResponse
      ? {
          id: getNextId("bot"),
          sender: "bot",
          text: result.responseText,
          automation: result.automation,
          isHandoff: result.isHandoff,
          time: "Just now",
        }
      : null

    setMessages((current) => [...current, userMsg, ...(botMsg ? [botMsg] : [])])
  }

  const handleStartTest = async (conversationId: string) => {
    if (!sendTest) return

    setPendingTestAction("starting")
    try {
      const started = await sendTest.onStart(conversationId)
      if (started) {
        setSendTestOpen(false)
      }
    } finally {
      setPendingTestAction(null)
    }
  }

  const handleStopTest = async () => {
    if (!sendTest) return

    setPendingTestAction("stopping")
    try {
      await sendTest.onStop()
    } finally {
      setPendingTestAction(null)
    }
  }

  return (
    <div
      className={cn(
        "flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden bg-background text-foreground",
        className
      )}
    >
      <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <BotIcon className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">Automation preview</p>
            <p className="truncate text-xs text-muted-foreground">
              Viber · {locale.toUpperCase()}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            onClick={handleResetChat}
            title="Reset preview conversation"
            aria-label="Reset conversation"
          >
            <RotateCcwIcon className="size-4" />
          </Button>
          {onClose ? (
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              onClick={onClose}
              aria-label="Close automation preview"
            >
              <XIcon className="size-4" />
            </Button>
          ) : null}
        </div>
      </header>

      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto bg-muted/50">
        <MessageGroup className="gap-6 px-4 py-6">
          {messages.map((msg) => {
            if (msg.sender === "user") {
              return (
                <Message key={msg.id} align="end">
                  <MessageContent>
                    <Bubble align="end" variant="default">
                      <BubbleContent>
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      </BubbleContent>
                    </Bubble>
                    <MessageFooter>
                      <span>{msg.time}</span>
                    </MessageFooter>
                  </MessageContent>
                </Message>
              )
            }

            return (
              <Message key={msg.id} align="start">
                <MessageAvatar>
                  <Avatar className="size-8">
                    <AvatarFallback>
                      <BotIcon className="size-4" />
                    </AvatarFallback>
                  </Avatar>
                </MessageAvatar>
                <MessageContent>
                  <MessageHeader>Automation</MessageHeader>
                  {msg.text ? (
                    <Bubble variant="outline">
                      <BubbleContent>
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      </BubbleContent>
                    </Bubble>
                  ) : null}

                  {msg.automation?.response_type === "carousel" &&
                  msg.automation.cards.length > 0 ? (
                    <Carousel
                      opts={{
                        align: "center",
                        loop: msg.automation.cards.length > 1,
                      }}
                      className="w-full min-w-0"
                    >
                      <CarouselContent>
                        {msg.automation.cards.map((card, index) => {
                          const title =
                            localized(card.title, locale) || "Card title"
                          const description = localized(
                            card.description,
                            locale
                          )
                          const ctaLabel =
                            localized(card.cta_label, locale) || "Open"
                          const action = resolveViberCarouselAction(
                            revision,
                            locale,
                            card
                          )
                          const ctaContent = (
                            <>
                              {ctaLabel}
                              {card.action_type === "open_url" ? (
                                <ExternalLinkIcon data-icon="inline-end" />
                              ) : null}
                            </>
                          )

                          return (
                            <CarouselItem
                              key={card.id ?? index}
                              className="basis-[70%]"
                            >
                              <div className="h-full p-1">
                                <Card size="sm" className="h-full">
                                  {card.image_url ? (
                                    <Image
                                      src={card.image_url}
                                      alt={title}
                                      width={640}
                                      height={360}
                                      unoptimized
                                      className="aspect-video w-full object-cover"
                                    />
                                  ) : (
                                    <div className="flex aspect-video items-center justify-center bg-muted text-muted-foreground">
                                      <ImageIcon className="size-6" />
                                    </div>
                                  )}
                                  <CardHeader>
                                    <CardTitle>{title}</CardTitle>
                                  </CardHeader>
                                  {description ? (
                                    <CardContent>
                                      <p className="text-sm text-muted-foreground">
                                        {description}
                                      </p>
                                    </CardContent>
                                  ) : null}
                                  <CardFooter>
                                    {action.externalUrl ? (
                                      <Button
                                        size="sm"
                                        className="w-full"
                                        render={
                                          <a
                                            href={action.externalUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                          />
                                        }
                                        onClick={() =>
                                          handleCarouselAction(card)
                                        }
                                      >
                                        {ctaContent}
                                      </Button>
                                    ) : (
                                      <Button
                                        type="button"
                                        size="sm"
                                        className="w-full"
                                        disabled={
                                          card.action_type === "open_url"
                                        }
                                        onClick={() =>
                                          handleCarouselAction(card)
                                        }
                                      >
                                        {ctaContent}
                                      </Button>
                                    )}
                                  </CardFooter>
                                </Card>
                              </div>
                            </CarouselItem>
                          )
                        })}
                      </CarouselContent>
                      <CarouselPrevious className="left-2 bg-background/90" />
                      <CarouselNext className="right-2 bg-background/90" />
                    </Carousel>
                  ) : null}

                  {msg.isHandoff ? (
                    <div className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2 text-xs text-muted-foreground">
                      <HeadphonesIcon className="size-4 shrink-0" />
                      <span>Transferred to human support team.</span>
                    </div>
                  ) : null}
                  <MessageFooter>
                    <span>{msg.time}</span>
                  </MessageFooter>
                </MessageContent>
              </Message>
            )
          })}
        </MessageGroup>

        <div ref={messagesEndRef} />
      </div>

      {isKeyboardDocked && revision.menu_buttons.length > 0 ? (
        <div className="shrink-0 border-t border-border bg-background p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Menu actions
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsKeyboardDocked(false)}
              title="Switch to message typing"
            >
              <KeyboardIcon data-icon="inline-start" />
              Type message
            </Button>
          </div>

          <div
            className={cn(
              "grid gap-2",
              revision.menu_buttons.length === 1 ? "grid-cols-1" : "grid-cols-2"
            )}
          >
            {revision.menu_buttons.map((button, index) => {
              const label = localized(button.label, locale) || "Button"
              const customBg = button.background_color

              return (
                <Button
                  key={button.id ?? index}
                  type="button"
                  variant={customBg ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleButtonClick(button)}
                  style={customBg ? { backgroundColor: customBg } : undefined}
                  className={cn(
                    "w-full min-w-0",
                    customBg && "border-transparent text-white hover:opacity-90"
                  )}
                >
                  <span className="truncate">{label}</span>
                </Button>
              )
            })}
          </div>
        </div>
      ) : null}

      <div className="shrink-0 border-t border-border bg-background p-3">
        <form
          onSubmit={(event) => {
            event.preventDefault()
            handleSendMessage(inputText)
          }}
        >
          <Field className="gap-0">
            <InputGroup className="h-9 bg-background shadow-none">
              {revision.menu_buttons.length > 0 && !isKeyboardDocked ? (
                <InputGroupAddon align="inline-start">
                  <InputGroupButton
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setIsKeyboardDocked(true)}
                    title="Show menu actions"
                    aria-label="Show menu actions"
                  >
                    <LayoutGridIcon className="size-4" />
                  </InputGroupButton>
                </InputGroupAddon>
              ) : null}
              <InputGroupInput
                type="text"
                value={inputText}
                onChange={(event) => setInputText(event.currentTarget.value)}
                placeholder="Type a message..."
                autoComplete="off"
                className="h-9 text-sm"
              />
              <InputGroupAddon align="inline-end" className="gap-0.5">
                {sendTest ? (
                  <Popover open={sendTestOpen} onOpenChange={setSendTestOpen}>
                    <PopoverTrigger
                      render={
                        <InputGroupButton
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className={cn(
                            "relative",
                            sendTest.activeConversationId && "bg-muted"
                          )}
                          disabled={sendTest.disabled || testStatus !== "idle"}
                          aria-label={
                            testStatus === "starting"
                              ? "Sending test preview"
                              : testStatus === "stopping"
                                ? "Stopping test preview"
                                : sendTest.activeConversationId
                                  ? `Preview active, ${Math.ceil(sendTest.remainingSeconds / 60)} minutes remaining`
                                  : "Send test to Viber contact"
                          }
                          title="Send test to Viber contact"
                        />
                      }
                    >
                      {testStatus === "idle" ? (
                        sendTest.activeConversationId ? (
                          <Clock3Icon className="size-4" />
                        ) : (
                          <FlaskConicalIcon className="size-4" />
                        )
                      ) : (
                        <Spinner />
                      )}
                    </PopoverTrigger>
                    <PopoverContent side="top" align="end" className="w-72 p-0">
                      <PopoverHeader className="p-3 pb-1">
                        <PopoverTitle>Send test</PopoverTitle>
                        <PopoverDescription>
                          Test this saved draft with a Viber contact for 30
                          minutes.
                        </PopoverDescription>
                      </PopoverHeader>
                      {sendTest.activeConversationId ? (
                        <div className="flex flex-col gap-3 p-3 pt-1">
                          <div className="rounded-lg bg-muted p-3 text-foreground">
                            <div className="flex items-center gap-2 text-xs font-medium">
                              <Clock3Icon className="size-4 text-muted-foreground" />
                              Preview active
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {activeTestConversation?.label ?? "Viber contact"}
                              {" · "}
                              {Math.ceil(sendTest.remainingSeconds / 60)}{" "}
                              minutes left
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => void handleStopTest()}
                            disabled={
                              sendTest.disabled || testStatus !== "idle"
                            }
                          >
                            {testStatus === "stopping" ? <Spinner /> : null}
                            Stop preview
                          </Button>
                        </div>
                      ) : (
                        <Command className="rounded-none bg-transparent p-0">
                          <CommandInput placeholder="Search Viber conversations..." />
                          <CommandList>
                            <CommandEmpty>
                              No Viber conversations yet.
                            </CommandEmpty>
                            <CommandGroup>
                              {sendTest.conversations.map((conversation) => (
                                <CommandItem
                                  key={conversation.id}
                                  value={conversation.label}
                                  keywords={[conversation.id]}
                                  disabled={
                                    sendTest.disabled || testStatus !== "idle"
                                  }
                                  onSelect={() =>
                                    void handleStartTest(conversation.id)
                                  }
                                >
                                  {conversation.label}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      )}
                    </PopoverContent>
                  </Popover>
                ) : null}
                <InputGroupButton
                  type="submit"
                  variant="default"
                  size="icon-sm"
                  disabled={!inputText.trim()}
                  aria-label="Send message"
                >
                  <SendIcon className="size-4" />
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </Field>
        </form>
      </div>
    </div>
  )
}
