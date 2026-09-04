"use client"

import * as React from "react"
import {
  RocketIcon,
  BrainIcon,
  TerminalSquareIcon,
  DatabaseIcon,
  FlaskConicalIcon,
  ScrollTextIcon,
  KeyRoundIcon,
  SearchIcon,
  type LucideIcon,
} from "@/components/ui/icons"

import { cn } from "@/lib/utils"
import { useDocsSearch } from "@/contexts/docs-search-context"
import {
  TypographyH1,
  TypographyH2,
  TypographyLead,
  TypographyMuted,
} from "@/components/ui/typography"

/* -------------------------------------------------------------------------- */
/*                                   Data                                      */
/* -------------------------------------------------------------------------- */

type Section = {
  id: string
  label: string
  icon: LucideIcon
}

const SECTIONS: Section[] = [
  { id: "getting-started", label: "Getting started", icon: RocketIcon },
  { id: "concepts", label: "Core concepts", icon: BrainIcon },
  { id: "playground", label: "Playground", icon: TerminalSquareIcon },
  { id: "datasets", label: "Datasets", icon: DatabaseIcon },
  { id: "experiments", label: "Experiments", icon: FlaskConicalIcon },
  { id: "logs", label: "Logs", icon: ScrollTextIcon },
  { id: "api", label: "API access", icon: KeyRoundIcon },
]

/* -------------------------------------------------------------------------- */
/*                                  Component                                  */
/* -------------------------------------------------------------------------- */

export function DocsView() {
  const { setActiveSectionId } = useDocsSearch()

  // Highlight the section currently in view.
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActiveSectionId(visible[0].target.id)
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 }
    )

    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [setActiveSectionId])

  return (
    <div className="flex flex-1 flex-col overflow-auto bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-8 lg:px-8">
        {/* Content */}
        <main className="flex min-w-0 flex-1 flex-col gap-12">
          {/* Header */}
          <div>
            <span className="text-sm font-medium text-primary">User guide</span>
            <TypographyH1 className="mt-1 text-2xl text-balance">
              Everything you need to test and ship RAG
            </TypographyH1>
            <TypographyLead className="mt-2 max-w-2xl leading-7">
              Learn how to run retrieval queries, manage knowledge bases,
              compare configurations, and trace every answer back to its source.
              Each section maps to a tab in the playground.
            </TypographyLead>
          </div>

          <Doc id="getting-started" icon={RocketIcon} title="Getting started">
            <P>
              The RAG Playground is a workspace for testing retrieval-augmented
              generation against your own documents. A typical first session
              looks like this:
            </P>
            <Steps
              items={[
                "Open Datasets and confirm your documents are indexed.",
                "Switch to the Playground and type a question.",
                "Inspect the generated answer and its cited source chunks.",
                "Tune Top-K, temperature, and reranking until results look right.",
                "Save the configuration as an experiment to compare later.",
              ]}
            />
            <Callout>
              Everything in the playground runs against the active project shown
              in the top bar — switch projects from the
              <Code>acme / support-kb</Code> selector.
            </Callout>
          </Doc>

          <Doc id="concepts" icon={BrainIcon} title="Core concepts">
            <Term term="Chunk">
              A small slice of a source document (typically a few hundred
              tokens). Retrieval works over chunks, not whole files, so answers
              can cite a precise passage.
            </Term>
            <Term term="Embedding">
              A numeric vector representation of a chunk. The embedding model
              determines how semantic similarity is measured during retrieval.
            </Term>
            <Term term="Top-K">
              The number of highest-scoring chunks passed to the generation
              model as context. Higher values add recall but cost more tokens.
            </Term>
            <Term term="Reranking">
              An optional second pass that re-scores retrieved chunks with a
              dedicated model for sharper relevance ordering.
            </Term>
            <Term term="Faithfulness">
              How well the generated answer is grounded in the retrieved context
              — a key quality metric in Experiments.
            </Term>
          </Doc>

          <Doc id="playground" icon={TerminalSquareIcon} title="Playground">
            <P>
              The Playground is the retrieval testing console. Type a question
              in the query bar and press <Code>Run</Code> (or
              <Code>⌘/Ctrl + Enter</Code>) to execute a full retrieval and
              generation pass.
            </P>
            <P>
              The left rail holds the retrieval config: generation model,
              embedding model, Top-K, temperature, and reranking. Adjust these
              before running to see how results change.
            </P>
            <P>
              Generated answers include inline citation badges. Hover or focus
              any badge to preview the exact source chunk — file name, relevance
              score, page, and text — so you can trace each claim.
            </P>
          </Doc>

          <Doc id="datasets" icon={DatabaseIcon} title="Datasets">
            <P>
              Datasets are collections of indexed documents. Select a dataset on
              the left to view its stats: document count, total chunks, tokens,
              and the embedding model used to index it.
            </P>
            <P>
              The documents table shows the indexing status of each file.
              <Status label="Ready" /> means the file is searchable,
              <Status label="Indexing" /> means embeddings are being generated,
              and <Status label="Failed" /> flags a file that needs attention.
            </P>
          </Doc>

          <Doc id="experiments" icon={FlaskConicalIcon} title="Experiments">
            <P>
              Experiments is an evaluation leaderboard of saved runs. Each row
              captures a retrieval configuration and its quality metrics:
              faithfulness, answer relevance, context precision, and recall.
            </P>
            <P>
              Select up to three runs with the checkboxes to open the compare
              drawer and view their metrics side by side. The best-scoring run
              is marked so you can quickly promote a winning configuration.
            </P>
          </Doc>

          <Doc id="logs" icon={ScrollTextIcon} title="Logs">
            <P>
              Logs is a live stream of every query that hits your project.
              Filter by status or search the query text to find a specific
              request.
            </P>
            <P>
              Expand any row to see the full request detail: model, dataset,
              latency, token usage, chunks retrieved, and the resulting
              faithfulness score. Use it to debug slow or low-quality answers.
            </P>
          </Doc>

          <Doc id="api" icon={KeyRoundIcon} title="API access">
            <P>
              Once a configuration works in the playground, query it
              programmatically with your API key from Settings. Send a
              <Code>POST</Code> request with your question and retrieval
              parameters:
            </P>
            <CodeBlock>{`curl https://api.ragplayground.dev/v1/query \\
  -H "Authorization: Bearer $RAG_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "project": "support-kb",
    "query": "How is customer data encrypted?",
    "top_k": 6,
    "rerank": true
  }'`}</CodeBlock>
            <Callout>
              Keep your production key secret. Rotate keys from
              <Code>Settings → API keys</Code> if one is ever exposed.
            </Callout>
          </Doc>
        </main>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                Small parts                                  */
/* -------------------------------------------------------------------------- */

function Doc({
  id,
  icon: Icon,
  title,
  children,
}: {
  id: string
  icon: LucideIcon
  title: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-20">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="size-4" />
        </span>
        <TypographyH2>{title}</TypographyH2>
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <TypographyMuted className="max-w-2xl leading-7 text-pretty">
      {children}
    </TypographyMuted>
  )
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="mx-1 rounded bg-muted px-1.5 py-0.5 font-mono text-[13px] text-foreground">
      {children}
    </code>
  )
}

function Steps({ items }: { items: string[] }) {
  return (
    <ol className="flex max-w-2xl flex-col gap-3">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3">
          <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-[11px] font-semibold text-primary">
            {i + 1}
          </span>
          <span className="text-sm leading-6 text-pretty text-muted-foreground">
            {item}
          </span>
        </li>
      ))}
    </ol>
  )
}

function Term({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className="max-w-2xl rounded-lg border border-border bg-card p-4">
      <p className="font-mono text-sm font-medium text-foreground">{term}</p>
      <p className="mt-1 text-sm leading-6 text-pretty text-muted-foreground">
        {children}
      </p>
    </div>
  )
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-2xl rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm leading-6 text-pretty text-foreground">
      {children}
    </div>
  )
}

function Status({ label }: { label: string }) {
  return (
    <span className="mx-0.5 inline-flex items-center rounded bg-muted px-1.5 py-0.5 align-middle font-mono text-xs font-medium text-foreground">
      {label}
    </span>
  )
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="max-w-2xl overflow-x-auto rounded-lg border border-border bg-card p-4 font-mono text-[13px] leading-6 text-foreground">
      <code>{children}</code>
    </pre>
  )
}
