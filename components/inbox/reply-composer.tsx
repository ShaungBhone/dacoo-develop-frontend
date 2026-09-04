"use client"

import {
  ChevronDownIcon,
  MessageSquareIcon,
  PaperclipIcon,
  SmilePlusIcon,
  SparklesIcon,
  StickyNoteIcon,
} from "@/components/ui/icons"
import { useRef, useState } from "react"
import {
  Attachment,
  AttachmentInfo,
  AttachmentPreview,
  AttachmentRemove,
  Attachments,
} from "@/components/ai-elements/attachments"
import {
  PromptInput,
  PromptInputFooter,
  PromptInputHeader,
  PromptInputProvider,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  usePromptInputAttachments,
  usePromptInputController,
} from "@/components/ai-elements/prompt-input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ButtonGroup11 } from "@/components/shadcn-studio/button-group/button-group-11"
import { SavedReplyPicker } from "@/components/inbox/saved-reply-picker"
import type { AiHandlerState } from "./api"

export type MessageType = "reply" | "internal_note"

interface ReplyComposerProps {
  onSubmit: (
    content: string,
    type: MessageType,
    files: File[]
  ) => void | Promise<void>
  isLoading: boolean
  aiHandler: AiHandlerState
  aiStateReason: string | null
  onTakeOver: () => void | Promise<void>
}

const COMMON_EMOJI = ["👍", "🙏", "😊", "🎉", "❤️", "👀", "✅", "🚀"]

function EmojiButton() {
  const { textInput } = usePromptInputController()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            aria-label="Add emoji"
            size="icon-sm"
            type="button"
            variant="ghost"
          />
        }
      >
        <SmilePlusIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="grid w-auto grid-cols-4 gap-1 p-2"
      >
        {COMMON_EMOJI.map((emoji) => (
          <button
            key={emoji}
            type="button"
            className="rounded-md p-1.5 text-lg hover:bg-accent"
            onClick={() => textInput.setInput(`${textInput.value}${emoji}`)}
          >
            {emoji}
          </button>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function InsertSavedReplyButton({
  disabled,
  textareaRef,
}: {
  disabled: boolean
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
}) {
  const { textInput } = usePromptInputController()

  return (
    <SavedReplyPicker
      disabled={disabled}
      onSelect={(savedReply) => {
        const textarea = textareaRef.current
        const selectionStart =
          textarea?.selectionStart ?? textInput.value.length
        const selectionEnd = textarea?.selectionEnd ?? selectionStart
        const cursorPosition = selectionStart + savedReply.body.length

        textInput.setInput(
          `${textInput.value.slice(0, selectionStart)}${savedReply.body}${textInput.value.slice(selectionEnd)}`
        )

        window.requestAnimationFrame(() => {
          textarea?.focus()
          textarea?.setSelectionRange(cursorPosition, cursorPosition)
        })
      }}
    />
  )
}

function AttachButton() {
  const attachments = usePromptInputAttachments()

  return (
    <Button
      aria-label="Attach files"
      size="icon-sm"
      type="button"
      variant="ghost"
      onClick={() => attachments.openFileDialog()}
    >
      <PaperclipIcon />
    </Button>
  )
}

function AttachmentList() {
  const attachments = usePromptInputAttachments()

  if (attachments.files.length === 0) return null

  return (
    <PromptInputHeader className="px-1">
      <Attachments variant="inline">
        {attachments.files.map((file) => (
          <Attachment
            key={file.id}
            data={file}
            onRemove={() => attachments.remove(file.id)}
          >
            <AttachmentPreview />
            <AttachmentInfo />
            <AttachmentRemove />
          </Attachment>
        ))}
      </Attachments>
    </PromptInputHeader>
  )
}

interface SendTypeMenuProps {
  disabled: boolean
  value: MessageType
  onValueChange: (value: MessageType) => void
}

function SendTypeMenu({ disabled, value, onValueChange }: SendTypeMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            aria-label="Choose message type"
            disabled={disabled}
            size="icon"
            type="button"
          />
        }
      >
        <ChevronDownIcon data-icon="inline-start" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(nextValue) => onValueChange(nextValue as MessageType)}
        >
          <DropdownMenuRadioItem value="reply">
            <MessageSquareIcon />
            Reply
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="internal_note">
            <StickyNoteIcon />
            Internal note
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const blobUrlToFile = async (
  url: string,
  filename: string,
  mediaType: string
): Promise<File | null> => {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    return new File([blob], filename, { type: mediaType || blob.type })
  } catch {
    return null
  }
}

export function ReplyComposer({
  onSubmit,
  isLoading,
  aiHandler,
  aiStateReason,
  onTakeOver,
}: ReplyComposerProps) {
  const [messageType, setMessageType] = useState<MessageType>("reply")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const isInternalNote = messageType === "internal_note"

  if (aiHandler !== "human") {
    const isInsufficientCredit = aiStateReason === "insufficient_credit"
    const label =
      aiHandler === "needs-attention"
        ? isInsufficientCredit
          ? "Manion ran out of credits"
          : "Manion needs you to take over"
        : "Manion is responding…"

    return (
      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border bg-background px-5 py-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <SparklesIcon className="size-4 text-purple-600 dark:text-purple-400" />
          {label}
        </div>
        <Button onClick={() => onTakeOver()} size="sm" variant="outline">
          Take over
        </Button>
      </div>
    )
  }

  return (
    <div className="shrink-0 border-t border-border bg-background p-2">
      <PromptInputProvider>
        <PromptInput
          data-message-type={messageType}
          className={
            isInternalNote
              ? "[&_[data-slot=input-group]]:border-amber-200 [&_[data-slot=input-group]]:bg-amber-50 dark:[&_[data-slot=input-group]]:border-amber-700 dark:[&_[data-slot=input-group]]:bg-amber-950/30"
              : undefined
          }
          onSubmit={async ({ text, files }) => {
            if (!text.trim() && files.length === 0) return
            if (isLoading) return

            const convertedFiles: File[] = []
            for (const file of files) {
              const f = await blobUrlToFile(
                file.url,
                file.filename || "attachment",
                file.mediaType || ""
              )
              if (f) convertedFiles.push(f)
            }

            return onSubmit(text, messageType, convertedFiles)
          }}
        >
          <PromptInputTextarea
            ref={textareaRef}
            disabled={isLoading}
            placeholder={
              isInternalNote ? "Add an internal note…" : "Message contact"
            }
            className="min-h-14 px-3 pt-3 text-sm"
          />
          <AttachmentList />
          <PromptInputFooter>
            <PromptInputTools>
              <AttachButton />
              <EmojiButton />
              {!isInternalNote && (
                <InsertSavedReplyButton
                  disabled={isLoading}
                  textareaRef={textareaRef}
                />
              )}
            </PromptInputTools>
            <ButtonGroup11 aria-label="Send message">
              <PromptInputSubmit disabled={isLoading} size="sm">
                {isInternalNote ? "Add note" : "Send"}
              </PromptInputSubmit>
              <SendTypeMenu
                disabled={isLoading}
                value={messageType}
                onValueChange={setMessageType}
              />
            </ButtonGroup11>
          </PromptInputFooter>
        </PromptInput>
      </PromptInputProvider>
    </div>
  )
}
