"use client"

import * as React from "react"
import {
  DatabaseIcon,
  FileTextIcon,
  SearchIcon,
  PlusIcon,
  Loader2Icon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  LayersIcon,
  BarChart2Icon,
  CoinsIcon,
  ClockIcon,
  UploadIcon,
  SparklesIcon,
  WandSparklesIcon,
  RotateCwIcon,
  BotIcon,
  XIcon,
} from "@/components/ui/icons"

import { cn } from "@/lib/utils"
import { ApiError } from "@/lib/api"
import { useRouter } from "next/navigation"
import { useActiveOrganization } from "@/hooks/use-active-organization"
import { useIsMobile } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  TypographyH1,
  TypographyH4,
  TypographyLead,
} from "@/components/ui/typography"
import { DataTable } from "@/components/data-table"
import type { ColumnDef } from "@tanstack/react-table"
import type { DataGridFeatures } from "@/components/reui/data-grid/data-grid"
import { DatasetsFilterRail } from "@/components/rag/datasets-filter-rail"
import { DatasetInsightsContent } from "@/components/rag/dataset-statistics"
import {
  createDataset,
  fetchDatasets,
  fetchDocuments,
  generateDocumentDraft,
  uploadDocument,
  retryDocumentIngestion,
  type DatasetSummary,
  type DocStatus,
  type DocumentSummary,
} from "@/components/rag/api"

const POLL_INTERVAL_MS = 2500
const ALLOWED_EXTENSIONS = ".md,.markdown,.txt,.mdx,.csv,.json,.xlsx"

/* -------------------------------------------------------------------------- */
/*                               Columns builder                              */
/* -------------------------------------------------------------------------- */

const buildDocumentColumns = (
  onRetry: (documentId: string) => void,
  retryingId: string | null
): ColumnDef<DataGridFeatures, DocumentSummary>[] => [
  {
    accessorKey: "name",
    header: "Source Document",
    cell: ({ row }) => {
      const doc = row.original
      return (
        <div className="flex items-center gap-2.5">
          <FileTextIcon className="size-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <p className="truncate font-mono text-xs font-medium text-foreground">
              {doc.name}
            </p>
            <p className="text-[11px] text-muted-foreground uppercase">
              {doc.type || "Document"}
            </p>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "chunks",
    header: () => <div className="text-right">Chunks</div>,
    cell: ({ row }) => (
      <div className="text-right font-mono text-xs text-muted-foreground">
        {row.original.chunks.toLocaleString()}
      </div>
    ),
  },
  {
    accessorKey: "tokens",
    header: () => <div className="text-right">Tokens</div>,
    cell: ({ row }) => (
      <div className="text-right font-mono text-xs text-muted-foreground">
        {row.original.tokens.toLocaleString()}
      </div>
    ),
  },
  {
    accessorKey: "updated",
    header: () => <div className="text-right">Updated</div>,
    cell: ({ row }) => (
      <div className="text-right text-xs text-muted-foreground">
        {row.original.updated || "—"}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: () => <div className="text-center">Status</div>,
    cell: ({ row }) => {
      const status = row.original.status
      if (status === "indexing") {
        return (
          <div className="flex items-center justify-center">
            <Badge
              variant="outline"
              className="gap-1 border-primary/30 bg-primary/10 text-primary"
            >
              <Loader2Icon className="size-3 animate-spin" />
              Indexing
            </Badge>
          </div>
        )
      }
      if (status === "failed") {
        const isRetrying = retryingId === row.original.id
        return (
          <div className="flex items-center justify-center gap-1.5">
            <Badge
              variant="outline"
              className="gap-1 border-red-500/30 bg-red-500/10 text-red-600"
            >
              <AlertTriangleIcon className="size-3" />
              Failed
            </Badge>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => onRetry(row.original.id)}
              disabled={isRetrying}
              title="Retry ingestion"
            >
              <RotateCwIcon
                className={cn("size-3.5", isRetrying && "animate-spin")}
              />
            </Button>
          </div>
        )
      }
      return (
        <div className="flex items-center justify-center">
          <Badge
            variant="outline"
            className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          >
            <CheckCircle2Icon className="size-3" />
            Ready
          </Badge>
        </div>
      )
    },
  },
]

/* -------------------------------------------------------------------------- */
/*                                  Component                                  */
/* -------------------------------------------------------------------------- */

export function DatasetsView() {
  const organization = useActiveOrganization()
  const router = useRouter()
  const isMobile = useIsMobile()

  const [datasets, setDatasets] = React.useState<DatasetSummary[]>([])
  const [isLoadingDatasets, setIsLoadingDatasets] = React.useState(true)
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const [documents, setDocuments] = React.useState<DocumentSummary[]>([])
  const [generateOpen, setGenerateOpen] = React.useState(false)
  const [newDatasetOpen, setNewDatasetOpen] = React.useState(false)
  const [isUploading, setIsUploading] = React.useState(false)
  const [retryingId, setRetryingId] = React.useState<string | null>(null)
  const [insightsOpen, setInsightsOpen] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [newDatasetForAgent, setNewDatasetForAgent] =
    React.useState<DatasetSummary | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const active = datasets.find((d) => d.id === activeId) ?? null

  const loadDatasets = React.useCallback(async () => {
    if (!organization) return
    setIsLoadingDatasets(true)
    try {
      const list = await fetchDatasets(organization.id)
      setDatasets(list)
      setActiveId((current) =>
        current && list.some((d) => d.id === current)
          ? current
          : (list[0]?.id ?? null)
      )
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to load datasets."
      )
    } finally {
      setIsLoadingDatasets(false)
    }
  }, [organization])

  React.useEffect(() => {
    loadDatasets()
  }, [loadDatasets])

  const loadDocuments = React.useCallback(async () => {
    if (!organization || !activeId) {
      setDocuments([])
      return
    }
    try {
      setDocuments(await fetchDocuments(organization.id, activeId))
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to load documents."
      )
    }
  }, [organization, activeId])

  React.useEffect(() => {
    loadDocuments()
  }, [loadDocuments])

  // Ingestion runs in a queued job on the backend, so poll while any document
  // in the active dataset is still indexing rather than assuming a fixed delay.
  React.useEffect(() => {
    if (!documents.some((doc) => doc.status === "indexing")) return
    const id = setInterval(loadDocuments, POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [documents, loadDocuments])

  async function handleUpload(file: File) {
    if (!organization || !activeId) return
    setIsUploading(true)
    setError(null)
    try {
      const doc = await uploadDocument(organization.id, activeId, file)
      setDocuments((prev) => [doc, ...prev])
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Upload failed.")
    } finally {
      setIsUploading(false)
    }
  }

  const handleRetry = React.useCallback(
    async (documentId: string) => {
      if (!organization || !activeId) return
      setRetryingId(documentId)
      setError(null)
      try {
        const updatedDoc = await retryDocumentIngestion(
          organization.id,
          activeId,
          documentId
        )
        setDocuments((prev) =>
          prev.map((d) => (d.id === documentId ? updatedDoc : d))
        )
      } catch (err) {
        setError(
          err instanceof ApiError ? err.message : "Failed to retry ingestion."
        )
      } finally {
        setRetryingId(null)
      }
    },
    [organization, activeId]
  )

  function handleUploadClick() {
    fileInputRef.current?.click()
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (file) handleUpload(file)
  }

  async function handleCreateDataset(name: string, description: string) {
    if (!organization) return
    const created = await createDataset(organization.id, {
      name,
      description: description || undefined,
    })
    setDatasets((prev) => [created, ...prev])
    setActiveId(created.id)
    setNewDatasetOpen(false)
    setNewDatasetForAgent(created)
  }

  const columns = React.useMemo(
    () => buildDocumentColumns(handleRetry, retryingId),
    [handleRetry, retryingId]
  )

  const renderFilterRail = (className?: string) => (
    <DatasetsFilterRail
      className={className}
      datasets={datasets}
      activeId={activeId}
      onSelect={(id) => setActiveId(id)}
      onNewDataset={() => setNewDatasetOpen(true)}
    />
  )

  const detailColumn = (
    <div className="flex h-full min-w-0 flex-1 flex-col bg-background">
      {error && (
        <p className="m-4 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {!active ? (
        isLoadingDatasets ? (
          <div className="flex flex-1 items-center justify-center p-10 text-sm text-muted-foreground">
            Loading…
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center p-6">
            <Empty className="w-full max-w-md bg-card/40 p-8">
              <EmptyHeader>
                <EmptyMedia variant="outline">
                  <DatabaseIcon className="size-5" />
                </EmptyMedia>
                <EmptyTitle>Create a collection to get started</EmptyTitle>
                <EmptyDescription>
                  Knowledge collections hold your documents and vectors for RAG
                  retrieval.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent className="mt-2">
                <Button onClick={() => setNewDatasetOpen(true)}>
                  <PlusIcon data-icon="inline-start" />
                  New collection
                </Button>
              </EmptyContent>
            </Empty>
          </div>
        )
      ) : (
        <>
          <DataTable
            columns={columns}
            data={documents}
            searchPlaceholder="Search documents…"
            searchableColumnIds={["name", "type", "updated"]}
            initialPageSize={15}
            columnsLabel="View"
            emptyMessage={
              <Empty className="mx-auto my-8 max-w-sm border-dashed border-border bg-card/40 p-6">
                <EmptyHeader>
                  <EmptyMedia variant="outline">
                    <FileTextIcon className="size-5" />
                  </EmptyMedia>
                  <EmptyTitle className="text-sm font-semibold">
                    No documents found
                  </EmptyTitle>
                  <EmptyDescription className="text-xs">
                    Upload source files to populate this collection.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent className="mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleUploadClick}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <Loader2Icon
                        className="size-4 animate-spin"
                        data-icon="inline-start"
                      />
                    ) : (
                      <UploadIcon data-icon="inline-start" />
                    )}
                    Upload source
                  </Button>
                </EmptyContent>
              </Empty>
            }
            getRowId={(doc) => doc.id}
            toolbarActions={
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setInsightsOpen(true)}
                >
                  <BarChart2Icon data-icon="inline-start" />
                  Insights
                  <Badge variant="secondary">{documents.length}</Badge>
                </Button>
                <Button
                  type="button"
                  onClick={handleUploadClick}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Loader2Icon
                      className="size-4 animate-spin"
                      data-icon="inline-start"
                    />
                  ) : (
                    <UploadIcon data-icon="inline-start" />
                  )}
                  Upload source
                </Button>
              </div>
            }
            className="min-h-0 flex-1 gap-0"
            toolbarClassName="shrink-0 border-b border-border px-4 py-2"
            containerClassName="min-h-0 flex-1 overflow-auto relative"
            headerClassName="bg-muted"
            rowClassName="bg-background hover:bg-muted/40"
            footerClassName="shrink-0 border-t border-border px-4 py-2"
          />
          <Sheet open={insightsOpen} onOpenChange={setInsightsOpen}>
            <SheetContent
              side="right"
              className="w-full overflow-y-auto lg:max-w-[48rem] lg:min-w-[48rem]"
            >
              <SheetHeader className="border-b border-border pr-14">
                <SheetTitle>{active.name} insights</SheetTitle>
                <SheetDescription>
                  A live breakdown of this collection’s indexed content.
                </SheetDescription>
              </SheetHeader>
              <DatasetInsightsContent documents={documents} />
            </SheetContent>
          </Sheet>
        </>
      )}
    </div>
  )

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden bg-background text-foreground">
      {isMobile ? (
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="shrink-0 overflow-x-auto border-b border-border">
            {renderFilterRail("w-max flex-row")}
          </div>
          {detailColumn}
        </div>
      ) : (
        <ResizablePanelGroup className="min-h-0 flex-1 overflow-hidden">
          <ResizablePanel
            id="datasets-filter-rail"
            defaultSize="20%"
            minSize="14%"
            maxSize="32%"
            className="min-w-0"
          >
            <aside className="flex h-full flex-col bg-sidebar">
              <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
                {renderFilterRail()}
              </div>
            </aside>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel id="datasets-main" className="min-w-0">
            {detailColumn}
          </ResizablePanel>
        </ResizablePanelGroup>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_EXTENSIONS}
        className="hidden"
        onChange={handleFileSelected}
      />

      <NewDatasetModal
        open={newDatasetOpen}
        onClose={() => setNewDatasetOpen(false)}
        onCreate={handleCreateDataset}
      />

      {newDatasetForAgent && (
        <CreateAgentPromptModal
          dataset={newDatasetForAgent}
          onClose={() => setNewDatasetForAgent(null)}
          onConfirm={() => {
            const id = newDatasetForAgent.id
            setNewDatasetForAgent(null)
            router.push(`/agents/new?datasetId=${id}`)
          }}
        />
      )}

      {generateOpen && active && organization && (
        <GenerateDocDialog
          datasetName={active.name}
          organizationId={organization.id}
          datasetId={active.id}
          onClose={() => setGenerateOpen(false)}
          onSaved={(doc) => {
            setDocuments((prev) => [doc, ...prev])
            setGenerateOpen(false)
          }}
        />
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                              New dataset modal                              */
/* -------------------------------------------------------------------------- */

function NewDatasetModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean
  onClose: () => void
  onCreate: (name: string, description: string) => Promise<void>
}) {
  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || isSubmitting) return
    setIsSubmitting(true)
    try {
      await onCreate(name.trim(), description.trim())
      setName("")
      setDescription("")
    } catch {
      // Parent handles error
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <DatabaseIcon className="size-4" />
              </span>
              New collection
            </DialogTitle>
            <DialogDescription>
              A collection holds your knowledge documents and vectors for RAG.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <Field>
              <FieldLabel htmlFor="ds-name">
                Collection name <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="ds-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Product Knowledge Base"
                required
                autoFocus
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="ds-desc">Description</FieldLabel>
              <Textarea
                id="ds-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What kind of documents will be stored here? (optional)"
                rows={3}
              />
            </Field>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || isSubmitting}>
              {isSubmitting ? (
                <Spinner />
              ) : (
                <PlusIcon data-icon="inline-start" />
              )}
              Create collection
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/* -------------------------------------------------------------------------- */
/*                         Create Agent prompt modal                           */
/* -------------------------------------------------------------------------- */

function CreateAgentPromptModal({
  dataset,
  onClose,
  onConfirm,
}: {
  dataset: DatasetSummary
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <span className="flex size-8 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <BotIcon className="size-4" />
            </span>
            Dataset Created!
          </DialogTitle>
          <DialogDescription className="text-xs leading-relaxed text-muted-foreground">
            Would you like to automatically create an AI Agent tailored to query{" "}
            <span className="font-semibold text-foreground">
              {dataset.name}
            </span>
            ?
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex flex-row items-center justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Skip for now
          </Button>
          <Button size="sm" onClick={onConfirm}>
            <BotIcon data-icon="inline-start" />
            Create Agent
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* -------------------------------------------------------------------------- */
/*                                Small parts                                  */
/* -------------------------------------------------------------------------- */

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5">
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="font-mono text-sm leading-tight font-semibold">{value}</p>
        <p className="truncate text-[11px] tracking-wide text-muted-foreground uppercase">
          {label}
        </p>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                            Generate document dialog                         */
/* -------------------------------------------------------------------------- */

type GenStep = "input" | "generating" | "preview"

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "untitled"
  )
}

function GenerateDocDialog({
  datasetName,
  organizationId,
  datasetId,
  onClose,
  onSaved,
}: {
  datasetName: string
  organizationId: number
  datasetId: string
  onClose: () => void
  onSaved: (doc: DocumentSummary) => void
}) {
  const [step, setStep] = React.useState<GenStep>("input")
  const [title, setTitle] = React.useState("")
  const [topic, setTopic] = React.useState("")
  const [content, setContent] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)

  const canGenerate = title.trim().length > 0 && topic.trim().length > 0

  async function handleGenerate() {
    if (!canGenerate) return
    setStep("generating")
    setError(null)
    try {
      const draft = await generateDocumentDraft(organizationId, datasetId, {
        title: title.trim(),
        topic: topic.trim(),
      })
      setContent(draft.content)
      setStep("preview")
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to generate document."
      )
      setStep("input")
    }
  }

  async function handleSave() {
    setIsSaving(true)
    setError(null)
    try {
      const name = `${slugify(title)}.md`
      const file = new File([content], name, { type: "text/markdown" })
      const doc = await uploadDocument(organizationId, datasetId, file)
      onSaved(doc)
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to save document."
      )
      setIsSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex max-h-[85svh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="flex flex-row items-center gap-2 border-b border-border px-5 py-4">
          <span className="flex size-8 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <WandSparklesIcon className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <DialogTitle className="text-sm font-semibold">
              Generate with AI
            </DialogTitle>
            <DialogDescription className="truncate text-xs">
              Adds to{" "}
              <span className="font-mono text-foreground">{datasetName}</span>
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-5">
          {step === "input" && (
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="gen-title">Title</FieldLabel>
                <Input
                  id="gen-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. How to set up your device"
                  autoFocus
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="gen-topic">Topic</FieldLabel>
                <Textarea
                  id="gen-topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  rows={4}
                  placeholder="Describe what this document should cover — e.g. what's in the box, setup steps, and common troubleshooting tips."
                />
                <FieldDescription>
                  The AI writes the document for you — no need to write it by
                  hand.
                </FieldDescription>
              </Field>

              {error && <p className="text-sm text-destructive">{error}</p>}
            </FieldGroup>
          )}

          {step === "generating" && (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 py-12 text-center">
              <Spinner className="size-7 text-primary" />
              <p className="text-sm font-medium">Drafting your document…</p>
              <p className="max-w-xs text-xs text-pretty text-muted-foreground">
                Turning your topic into a ready-to-use document.
              </p>
            </div>
          )}

          {step === "preview" && (
            <div className="flex min-h-0 flex-1 flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <FieldLabel htmlFor="gen-content" className="text-xs">
                  Generated document · review &amp; edit
                </FieldLabel>
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs"
                  onClick={() => setStep("input")}
                >
                  Regenerate
                </Button>
              </div>
              <Textarea
                id="gen-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-64 flex-1 resize-none font-mono text-xs leading-relaxed"
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-row items-center justify-end gap-2 border-t border-border px-5 py-4">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>

          {step === "preview" ? (
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Spinner />
              ) : (
                <CheckCircle2Icon data-icon="inline-start" />
              )}
              Save to dataset
            </Button>
          ) : (
            <Button
              onClick={handleGenerate}
              disabled={!canGenerate || step === "generating"}
            >
              <SparklesIcon data-icon="inline-start" />
              Generate
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
