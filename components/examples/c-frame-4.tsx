"use client"

import { type ChangeEvent, type FormEvent, useRef, useState } from "react"
import { PlusIcon, TriangleAlertIcon } from "lucide-react"
import { toast } from "sonner"

import { Frame, FramePanel } from "@/components/reui/frame"
import { Alert, AlertAction, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

const models = ["v0 Mini", "v0 1.5", "v0 Max"] as const
const projects = ["Project", "Website redesign", "Mobile app"] as const

type Model = (typeof models)[number]
type Project = (typeof projects)[number]

export function HomepagePromptFrame({
  embedded = false,
}: {
  embedded?: boolean
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [prompt, setPrompt] = useState("")
  const [model, setModel] = useState<Model>(models[0])
  const [project, setProject] = useState<Project>(projects[0])

  function submitPrompt(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault()

    const normalizedPrompt = prompt.trim()

    if (!normalizedPrompt) {
      toast.info("Enter a prompt first.")
      return
    }

    toast.success("Prompt submitted locally", {
      description: `${model} · ${project}`,
    })
  }

  function selectFiles(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files ?? [])

    if (selectedFiles.length === 0) {
      return
    }

    toast.success(
      selectedFiles.length === 1
        ? `${selectedFiles[0].name} attached`
        : `${selectedFiles.length} files attached`
    )

    event.target.value = ""
  }

  function showUpgradeMessage() {
    toast.info("Upgrade flow isn’t connected in this demo.")
  }

  return (
    <main
      className={cn(
        "bg-background px-4 pt-[35px] text-foreground",
        embedded ? "min-h-0 flex-1 overflow-y-auto" : "min-h-svh"
      )}
    >
      <section className="mx-auto w-full max-w-[690px]">
        <h1 className="text-center text-[2rem] leading-tight font-semibold tracking-[-0.035em]">
          What do you want to create?
        </h1>

        <Frame
          className="mt-[15px] w-full gap-0 overflow-hidden rounded-xl border-0 bg-zinc-100 p-0 shadow-none dark:bg-zinc-800"
          stacked
          dense
        >
          <FramePanel className="min-h-[106px] border-border bg-card p-3 shadow-none before:hidden sm:px-3.5">
            <form
              className="flex min-h-[78px] flex-col justify-between gap-2"
              onSubmit={submitPrompt}
            >
              <label className="sr-only" htmlFor="homepage-prompt">
                Ask v0 to build
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
                placeholder="Ask v0 to build..."
                className="min-h-11 w-full resize-none bg-transparent text-sm leading-5 outline-none placeholder:text-muted-foreground focus-visible:ring-0"
              />

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="sr-only"
                    onChange={selectFiles}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Attach files"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <PlusIcon />
                  </Button>

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
                        className="flex size-[18px] items-center justify-center rounded-[5px] border-2 border-muted-foreground/45"
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
                </div>

                <div className="ml-auto flex items-center gap-2">
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
                    <SelectContent align="end" alignItemWithTrigger={false}>
                      {projects.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    type="button"
                    size="sm"
                    onClick={showUpgradeMessage}
                    className="bg-zinc-900 px-3 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
                  >
                    Upgrade
                  </Button>
                </div>
              </div>
            </form>
          </FramePanel>

          <FramePanel
            fit
            className="border-0 bg-zinc-100 p-0 shadow-none before:hidden dark:bg-zinc-800"
          >
            <Alert className="min-h-[35px] grid-cols-[auto_minmax(0,1fr)] items-center gap-x-2 rounded-none border-0 bg-transparent px-3 py-1.5 text-muted-foreground shadow-none has-data-[slot=alert-action]:pr-3 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
              <TriangleAlertIcon className="size-4" />
              <AlertDescription className="text-sm text-pretty">
                You must be on a paid plan to use your purchased credit.
              </AlertDescription>
              <AlertAction className="static col-start-2 row-start-2 justify-self-start sm:col-start-3 sm:row-start-1 sm:justify-self-end">
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  onClick={showUpgradeMessage}
                  className="h-auto p-0 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Upgrade Plan
                </Button>
              </AlertAction>
            </Alert>
          </FramePanel>
        </Frame>
      </section>
    </main>
  )
}
