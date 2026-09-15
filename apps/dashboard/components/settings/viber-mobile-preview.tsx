"use client"

import * as React from "react"
import Image from "next/image"
import {
  type LocalizedText,
  type ViberAutomation,
  type ViberExperienceRevision,
  type ViberLocale,
  type ViberMenuButton,
} from "./viber-experience-api"
import { Viber } from "@/components/ui/svgs/viber"
import {
  CheckCheckIcon,
  ChevronLeftIcon,
  ExternalLinkIcon,
  HeadphonesIcon,
  ImageIcon,
  KeyboardIcon,
  LayoutGridIcon,
  MicIcon,
  PlusIcon,
  RotateCcwIcon,
  SendIcon,
  SmileIcon,
} from "@/components/ui/icons"
import { Button } from "@/components/ui/button"
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

export function ViberMobilePreview({
  revision,
  locale,
  automation,
  className,
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
  const [isKeyboardDocked, setIsKeyboardDocked] = React.useState(
    revision.menu_buttons.length > 0
  )
  const messagesEndRef = React.useRef<HTMLDivElement>(null)
  const counterRef = React.useRef(1)

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

  // Find matching automation for a given query
  const findMatchingAutomation = (
    query: string
  ): ViberAutomation | undefined => {
    const clean = query.trim().toLowerCase()
    if (!clean) return undefined

    return revision.automations.find((a) => {
      if (!a.is_enabled) return false
      const triggers = a.triggers?.[locale] ?? a.triggers?.en ?? []
      return triggers.some((t) => t.trim().toLowerCase() === clean)
    })
  }

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
      const matched = findMatchingAutomation(triggerValue)

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
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    const text = inputText.trim()
    if (!text) return

    const userMsg: ChatMessage = {
      id: getNextId("user"),
      sender: "user",
      text,
      time: "Just now",
    }

    // Search for trigger
    const matched = findMatchingAutomation(text)
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

  return (
    <div
      className={cn(
        "relative mx-auto flex h-[620px] w-full max-w-[380px] flex-col overflow-hidden rounded-2xl border border-border/80 bg-[#ECEEF5] text-zinc-900 shadow-xl dark:border-zinc-800 dark:bg-[#1C1C22] dark:text-zinc-100",
        className
      )}
    >
      {/* 1. Authentic Viber Purple Top App Bar */}
      <div className="flex h-14 shrink-0 items-center justify-between bg-[#7360F2] px-2 text-white shadow-sm">
        <div className="flex items-center gap-2 overflow-hidden">
          <button
            type="button"
            className="flex size-7 items-center justify-center rounded-full transition-colors hover:bg-white/10"
            aria-label="Back"
          >
            <ChevronLeftIcon className="size-5" />
          </button>

          <div className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/30">
            <Viber className="size-5 text-white" />
            <span
              className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-[#7360F2] bg-emerald-400"
              title="Online"
            />
          </div>

          <div className="min-w-0 flex-1 leading-tight">
            <div className="flex items-center gap-1">
              <span className="truncate text-xs font-semibold text-white">
                Viber Bot
              </span>
              <span className="rounded bg-white/20 px-1 py-0.2 text-[9px] font-medium tracking-wide uppercase text-white">
                Bot
              </span>
            </div>
            <p className="text-[10px] text-white/80">Online</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={handleResetChat}
            className="size-8 p-0 text-white hover:bg-white/15 hover:text-white"
            title="Reset preview conversation"
            aria-label="Reset conversation"
          >
            <RotateCcwIcon className="size-4" />
          </Button>
          <div className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-medium uppercase text-white">
            {locale}
          </div>
        </div>
      </div>

      {/* 2. Viber Chat Feed (Soft Lilac Wallpaper) */}
      <div className="scrollbar-thin flex flex-1 flex-col overflow-y-auto p-3 space-y-3">
        {/* Date separator pill */}
        <div className="my-1 flex justify-center">
          <span className="rounded-full bg-black/10 px-3 py-0.5 text-[11px] font-medium text-zinc-600 dark:bg-white/10 dark:text-zinc-300">
            Today
          </span>
        </div>

        {/* Message list */}
        {messages.map((msg) => {
          if (msg.sender === "user") {
            return (
              <div
                key={msg.id}
                className="flex max-w-[82%] flex-col items-end self-end"
              >
                <div className="relative rounded-2xl rounded-br-xs bg-[#E3DFFC] px-3.5 py-2 text-xs text-[#2B1C6D] shadow-sm dark:bg-[#5C4BD9]/40 dark:text-purple-100">
                  <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                  <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-[#7360F2] dark:text-purple-300">
                    <span>{msg.time}</span>
                    <CheckCheckIcon className="size-3.5" />
                  </div>
                </div>
              </div>
            )
          }

          // Bot message
          return (
            <div
              key={msg.id}
              className="flex max-w-[85%] flex-col items-start self-start space-y-2"
            >
              {msg.text ? (
                <div className="relative rounded-2xl rounded-bl-xs bg-white px-3.5 py-2 text-xs text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100">
                  <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                  <span className="mt-1 block text-right text-[10px] text-zinc-400">
                    {msg.time}
                  </span>
                </div>
              ) : null}

              {/* Carousel cards if attached */}
              {msg.automation?.response_type === "carousel" &&
              msg.automation.cards.length > 0 ? (
                <div className="flex w-full snap-x gap-2 overflow-x-auto pb-1">
                  {msg.automation.cards.map((card, idx) => (
                    <div
                      key={card.id ?? idx}
                      className="w-48 shrink-0 snap-start overflow-hidden rounded-xl border border-border/80 bg-white shadow-sm dark:bg-zinc-800"
                    >
                      {card.image_url ? (
                        <Image
                          src={card.image_url}
                          alt={localized(card.title, locale) || "Card image"}
                          width={192}
                          height={108}
                          unoptimized
                          className="aspect-video w-full object-cover"
                        />
                      ) : (
                        <div className="flex aspect-video items-center justify-center bg-zinc-100 text-zinc-400 dark:bg-zinc-700">
                          <ImageIcon className="size-6" />
                        </div>
                      )}
                      <div className="p-2.5">
                        <h4 className="truncate text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                          {localized(card.title, locale) || "Card title"}
                        </h4>
                        {localized(card.description, locale) ? (
                          <p className="line-clamp-2 mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                            {localized(card.description, locale)}
                          </p>
                        ) : null}
                        <Button
                          type="button"
                          size="sm"
                          className="mt-2 h-7 w-full bg-[#7360F2] text-[11px] font-medium text-white hover:bg-[#6250E0]"
                        >
                          {localized(card.cta_label, locale) || "Open"}
                          {card.action_type === "open_url" ? (
                            <ExternalLinkIcon className="ml-1 size-3" />
                          ) : null}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {/* Handoff banner */}
              {msg.isHandoff ? (
                <div className="flex items-center gap-2 rounded-xl border border-purple-200 bg-purple-50/90 px-3 py-2 text-[11px] text-purple-900 shadow-sm dark:border-purple-800/60 dark:bg-purple-950/40 dark:text-purple-200">
                  <HeadphonesIcon className="size-4 shrink-0 text-[#7360F2]" />
                  <span>Transferred to human support team.</span>
                </div>
              ) : null}
            </div>
          )
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. Docked Viber Bot Keyboard Area */}
      {isKeyboardDocked && revision.menu_buttons.length > 0 ? (
        <div className="shrink-0 border-t border-zinc-200/90 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-1.5 flex items-center justify-between px-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              Bot Menu
            </span>
            <button
              type="button"
              onClick={() => setIsKeyboardDocked(false)}
              className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium text-[#7360F2] hover:bg-purple-50 dark:hover:bg-purple-950/40"
              title="Switch to message typing"
            >
              <KeyboardIcon className="size-3.5" />
              <span>Type text</span>
            </button>
          </div>

          <div
            className={cn(
              "grid gap-1.5",
              revision.menu_buttons.length === 1 ? "grid-cols-1" : "grid-cols-2"
            )}
          >
            {revision.menu_buttons.map((button, index) => {
              const label = localized(button.label, locale) || "Button"
              const customBg = button.background_color

              return (
                <button
                  key={button.id ?? index}
                  type="button"
                  onClick={() => handleButtonClick(button)}
                  style={customBg ? { backgroundColor: customBg } : undefined}
                  className={cn(
                    "flex h-9 items-center justify-center rounded-lg px-2 text-center text-xs font-medium shadow-xs transition-all active:scale-[0.98]",
                    customBg
                      ? "text-white"
                      : "bg-[#7360F2] text-white hover:bg-[#6250E0]"
                  )}
                >
                  <span className="truncate">{label}</span>
                </button>
              )
            })}
          </div>
        </div>
      ) : null}

      {/* 4. Viber Bottom Action / Input Bar */}
      <div className="shrink-0 border-t border-zinc-200/90 bg-white px-2 py-1.5 dark:border-zinc-800 dark:bg-zinc-900">
        <form
          onSubmit={handleSendMessage}
          className="flex items-center gap-1.5"
        >
          {revision.menu_buttons.length > 0 && !isKeyboardDocked ? (
            <button
              type="button"
              onClick={() => setIsKeyboardDocked(true)}
              className="flex size-8 shrink-0 items-center justify-center rounded-full text-[#7360F2] transition-colors hover:bg-purple-50 dark:hover:bg-purple-950/50"
              title="Show Viber bot menu"
              aria-label="Show bot menu"
            >
              <LayoutGridIcon className="size-4.5" />
            </button>
          ) : (
            <button
              type="button"
              className="flex size-8 shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-200"
              aria-label="Add attachment"
            >
              <PlusIcon className="size-4.5" />
            </button>
          )}

          <div className="relative flex flex-1 items-center">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type a message..."
              className="h-8 w-full rounded-full bg-zinc-100 px-3.5 pr-8 text-xs text-zinc-900 placeholder:text-zinc-400 outline-hidden transition-all focus:bg-white focus:ring-1 focus:ring-[#7360F2] dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:bg-zinc-900"
            />
            <button
              type="button"
              className="absolute right-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              aria-label="Insert sticker or emoji"
            >
              <SmileIcon className="size-4" />
            </button>
          </div>

          {inputText.trim() ? (
            <button
              type="submit"
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#7360F2] text-white shadow-xs transition-colors hover:bg-[#6250E0]"
              aria-label="Send message"
            >
              <SendIcon className="size-4" />
            </button>
          ) : (
            <button
              type="button"
              className="flex size-8 shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-200"
              aria-label="Voice message"
            >
              <MicIcon className="size-4.5" />
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
