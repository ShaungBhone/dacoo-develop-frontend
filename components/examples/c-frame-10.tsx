"use client"

import {
  type ChangeEvent,
  type ComponentProps,
  type FormEvent,
  useRef,
  useState,
} from "react"
import {
  ArrowUpIcon,
  FileIcon,
  ImageIcon,
  PlusIcon,
  TriangleAlertIcon,
  XIcon,
} from "lucide-react"
import { toast } from "sonner"

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
import { cn } from "@/lib/utils"

const models = ["v0 Mini", "v0 1.5", "v0 Max"] as const
const projects = ["Project", "Website redesign", "Mobile app"] as const

type Model = (typeof models)[number]
type Project = (typeof projects)[number]

type Attachment = {
  id: string
  kind: "file" | "image"
  name: string
  size: number
}

function IconTile({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-lg border [&_svg]:size-4",
        className
      )}
      {...props}
    />
  )
}

function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size} B`
  }

  if (size < 1024 * 1024) {
    return `${Math.round(size / 1024)} KB`
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

export function HomepagePromptFrame({
  embedded = false,
}: {
  embedded?: boolean
}) {
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [prompt, setPrompt] = useState("")
  const [model, setModel] = useState<Model>(models[0])
  const [project, setProject] = useState<Project>(projects[0])
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const tokensRemaining = 0
  const isOutOfTokens = tokensRemaining === 0

  function submitPrompt(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault()

    if (isOutOfTokens) {
      toast.error("You’re out of tokens", {
        description: "Upgrade your plan to start a new creation.",
      })
      return
    }

    const normalizedPrompt = prompt.trim()

    if (!normalizedPrompt) {
      toast.info("Enter a prompt first.")
      return
    }

    toast.success("Prompt submitted locally", {
      description: `${model} · ${project}`,
    })
  }

  function selectAttachments(event: ChangeEvent<HTMLInputElement>) {
    const selectedAttachments = Array.from(event.target.files ?? []).map(
      (file) =>
        ({
          id: `${file.name}-${file.size}-${file.lastModified}`,
          kind: file.type.startsWith("image/") ? "image" : "file",
          name: file.name,
          size: file.size,
        }) satisfies Attachment
    )

    if (selectedAttachments.length === 0) {
      return
    }

    setAttachments((currentAttachments) => {
      const attachmentsById = new Map(
        currentAttachments.map((attachment) => [attachment.id, attachment])
      )

      for (const attachment of selectedAttachments) {
        attachmentsById.set(attachment.id, attachment)
      }

      return Array.from(attachmentsById.values())
    })

    event.target.value = ""
  }

  function removeAttachment(id: string) {
    setAttachments((currentAttachments) =>
      currentAttachments.filter((attachment) => attachment.id !== id)
    )
  }

  function showUpgradeMessage() {
    toast.info("Upgrade flow isn’t connected in this demo.")
  }

  return (
    <main
      className={cn(
        "bg-background px-4 pt-9 pb-8 text-foreground sm:pt-14",
        embedded ? "min-h-0 flex-1 overflow-y-auto" : "min-h-svh"
      )}
    >
      <section className="mx-auto w-full max-w-180">
        <div className="mx-auto max-w-xl text-center">
          <h1 className="text-3xl leading-tight font-semibold tracking-[-0.04em] sm:text-[2.25rem]">
            Good morning, {user?.name ?? "there"}
          </h1>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="sr-only"
          onChange={selectAttachments}
        />

        <Frame
          spacing="sm"
          className="mt-7 w-full rounded-2xl border-border/80 bg-muted/35 shadow-[0_18px_55px_-36px_rgba(0,0,0,0.45)] dark:bg-muted/20"
        >
          {attachments.length > 0 && (
            <>
              <div className="flex flex-wrap gap-2">
                {attachments.map((attachment) => {
                  const AttachmentIcon =
                    attachment.kind === "image" ? ImageIcon : FileIcon

                  return (
                    <div
                      key={attachment.id}
                      className="flex w-full min-w-0 items-center gap-2.5 rounded-lg border bg-background/75 px-3 py-2 sm:w-72"
                    >
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
                        <AttachmentIcon className="size-4 text-muted-foreground" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="mt-0.75 flex items-center justify-between gap-2">
                          <p className="inline-flex min-w-0 flex-1 flex-col justify-center gap-1 overflow-hidden font-medium">
                            <span className="truncate text-sm">
                              {attachment.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatFileSize(attachment.size)}
                            </span>
                          </p>
                          <div className="flex shrink-0 items-center gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label={`Remove ${attachment.name}`}
                              onClick={() => removeAttachment(attachment.id)}
                              className="size-6 text-muted-foreground hover:bg-transparent hover:opacity-100"
                            >
                              <XIcon className="size-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          <FramePanel className="min-h-40 border-border/80 bg-card pb-0 shadow-sm before:hidden">
            <form
              className="flex min-h-32 flex-col justify-between gap-5"
              onSubmit={submitPrompt}
            >
              <label className="sr-only" htmlFor="homepage-prompt">
                Describe what you want to create
              </label>
              <textarea
                id="homepage-prompt"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                onKeyDown={(event) => {
                  if (
                    (event.metaKey || event.ctrlKey) &&
                    event.key === "Enter"
                  ) {
                    event.preventDefault()
                    submitPrompt()
                  }
                }}
                placeholder="Describe the product, page, or experience you want to build…"
                className="min-h-20 w-full resize-none bg-transparent text-sm leading-6 outline-none placeholder:text-muted-foreground focus-visible:ring-0 sm:text-[15px]"
              />

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex min-w-0 flex-wrap items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Add attachment"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <PlusIcon />
                  </Button>
                  <span
                    aria-hidden="true"
                    className="mx-1 h-4 w-px bg-border"
                  />
                  <Select
                    value={model}
                    onValueChange={(value) => value && setModel(value as Model)}
                  >
                    <SelectTrigger
                      aria-label="Select model"
                      size="sm"
                      className="border-0 bg-transparent px-1.5 text-muted-foreground shadow-none hover:bg-muted hover:text-foreground dark:bg-transparent dark:hover:bg-muted"
                    >
                      <span
                        aria-hidden="true"
                        className="flex size-4.5 items-center justify-center rounded-[5px] border-2 border-muted-foreground/45"
                      >
                        <span className="size-1.5 rounded-full bg-muted-foreground/55" />
                      </span>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent align="start" alignItemWithTrigger={false}>
                      {models.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={project}
                    onValueChange={(value) =>
                      value && setProject(value as Project)
                    }
                  >
                    <SelectTrigger
                      aria-label="Select project"
                      size="sm"
                      className="border-0 bg-transparent px-1.5 text-muted-foreground shadow-none hover:bg-muted hover:text-foreground dark:bg-transparent dark:hover:bg-muted"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent align="start" alignItemWithTrigger={false}>
                      {projects.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="submit"
                  size="icon-lg"
                  aria-label="Submit prompt"
                  disabled={isOutOfTokens}
                >
                  <ArrowUpIcon />
                </Button>
              </div>
            </form>
          </FramePanel>

          <FrameFooter className="gap-3 pb-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-2.5">
              <IconTile
                aria-hidden="true"
                className="border-destructive/15 bg-destructive/10 text-destructive-foreground dark:border-destructive/25 dark:bg-destructive/15 dark:text-destructive"
              >
                <TriangleAlertIcon />
              </IconTile>
              <div>
                <p className="text-sm font-medium">You’re out of tokens</p>
                <p className="text-xs leading-5 text-muted-foreground">
                  Upgrade your plan to submit this prompt and keep creating.
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={showUpgradeMessage}>
              Upgrade plan
            </Button>
          </FrameFooter>
        </Frame>
      </section>
    </main>
  )
}
