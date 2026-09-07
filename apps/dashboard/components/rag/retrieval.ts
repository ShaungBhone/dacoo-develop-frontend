export type Doc = {
  id: string
  source: string
  path?: string | null
  page?: number | null
  tokens?: number
  text: string
}

const STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "of",
  "to",
  "in",
  "is",
  "are",
  "for",
  "on",
  "with",
  "how",
  "what",
  "do",
  "does",
  "can",
  "i",
  "my",
  "we",
  "you",
  "it",
  "be",
  "by",
  "at",
  "as",
  "this",
  "that",
  "from",
  "your",
  "when",
  "which",
  "applies",
  "apply",
  "handled",
  "standard",
])

export function tokenize(input: string): string[] {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t))
}

export type Retrieved = Doc & { score: number }

export type ReportSection = {
  heading: string
  bullets: Array<{ text: string; cite?: number | null }>
}

export type StructuredAnswer = {
  summary: { text: string; cite?: number | null }
  sections: ReportSection[]
  sourceNote: string
}

// Renders the exact context window that was (or would be) sent to the model,
// for the "Prompt" inspection tab. Purely a local presentation helper — chunks
// come back from the real query response, this just formats them for display.
export function buildPromptPreview(
  query: string,
  chunks: Retrieved[],
  model: string,
  systemPrompt: string
): string {
  const context = chunks
    .map(
      (c, i) =>
        `--- Chunk ${i + 1} | ${c.source}${c.path ? ` | ${c.path}` : ""}${c.page ? ` | p.${c.page}` : ""} ---\n${c.text}`
    )
    .join("\n\n")

  return [
    `[system]`,
    systemPrompt,
    ``,
    `[context]`,
    context || "(no chunk citations available)",
    ``,
    `[user]`,
    query,
    ``,
    `[model: ${model}]`,
  ].join("\n")
}

// Fakes token-by-token streaming over already-complete text for the typing
// effect in the answer panel. The backend returns the full answer in one
// response (no SSE), so this is purely a client-side presentation layer.
export function streamText(
  fullText: string,
  onChunk: (partial: string) => void,
  onDone: () => void,
  wordsPerTick = 4,
  intervalMs = 28
): () => void {
  const words = fullText.split(" ")
  let index = 0
  const id = setInterval(() => {
    index += wordsPerTick
    if (index >= words.length) {
      onChunk(fullText)
      onDone()
      clearInterval(id)
    } else {
      onChunk(words.slice(0, index).join(" "))
    }
  }, intervalMs)
  return () => clearInterval(id)
}

export type RunResult = {
  query: string
  structured: StructuredAnswer
  promptPreview: string
  chunks: Retrieved[]
  latencyMs: number
  tokens: number
  // null when there's no basis to estimate these (e.g. no chunks were
  // returned for citation) — render as "—" rather than a fabricated number.
  faithfulness: number | null
  relevance: number | null
  model: string
  // false when no chunk cleared the relevance floor — render a "no results"
  // state instead of a normal answer.
  grounded: boolean
}

// Context limits per model (in tokens). Keys match the OpenRouter `vendor/model`
// slugs served by the backend's `ai.chat_models` catalog.
export const MODEL_CONTEXT_LIMITS: Record<string, number> = {
  "openai/gpt-4o-mini": 128_000,
  "openai/gpt-4o": 128_000,
  "anthropic/claude-sonnet-4.5": 200_000,
  "google/gemini-2.5-flash": 1_048_576,
  "google/gemini-2.5-pro": 1_048_576,
  "deepseek/deepseek-chat": 64_000,
  "x-ai/grok-4": 256_000,
}

export const DEFAULT_CONTEXT_LIMIT = 128_000

export type ContextBudget = {
  systemTokens: number
  chunkTokens: number
  queryTokens: number
  usedTokens: number
  limitTokens: number
  pct: number
  isOver: boolean
}

export function computeContextBudget(
  query: string,
  chunks: Doc[],
  model: string,
  systemPrompt: string
): ContextBudget {
  const systemTokens = Math.ceil(systemPrompt.split(/\s+/).length * 1.35)
  const chunkTokens = chunks.reduce((sum, c) => sum + (c.tokens ?? 0), 0)
  const queryTokens = Math.max(4, Math.ceil(tokenize(query).length * 1.35))
  const usedTokens = systemTokens + chunkTokens + queryTokens
  const limitTokens = MODEL_CONTEXT_LIMITS[model] ?? DEFAULT_CONTEXT_LIMIT
  const pct = Math.min(1, usedTokens / limitTokens)
  return {
    systemTokens,
    chunkTokens,
    queryTokens,
    usedTokens,
    limitTokens,
    pct,
    isOver: usedTokens > limitTokens,
  }
}
