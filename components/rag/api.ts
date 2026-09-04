import { apiFetch } from "@/lib/api"
import type { Retrieved, StructuredAnswer } from "@/components/rag/retrieval"
import type { QuerySuggestion } from "./data"

export type DocStatus = "ready" | "indexing" | "failed"

export type DocumentSummary = {
  id: string
  name: string
  type: string
  chunks: number
  tokens: number
  updated: string | null
  status: DocStatus
}

export type DatasetSummary = {
  id: string
  name: string
  description: string | null
  embedModel: string | null
  status: "pending" | "ready" | "failed"
  lastIndexed: string
  documentsCount?: number
  // Only present when the dataset was fetched with its documents eager
  // loaded (not the case for the list endpoint) — fetch separately via
  // fetchDocuments() instead of relying on this being populated.
  documents?: DocumentSummary[]
}

export type QueryResponse = {
  query: string
  structured: StructuredAnswer
  chunks: Retrieved[]
  latencyMs: number
  tokens: number
  model: string
  // false when no indexed chunk was relevant enough to answer from.
  grounded: boolean
}

export type ModelOption = {
  id: string
  label: string
  provider: string
}

export type EmbeddingProviderOption = {
  id: string
  label: string
}

export type ModelCatalog = {
  chatModels: ModelOption[]
  embeddingProviders: EmbeddingProviderOption[]
}

export async function fetchModelCatalog(): Promise<ModelCatalog> {
  return apiFetch<ModelCatalog>("/api/v1/ai/models")
}

export async function fetchDatasets(
  organizationId: number
): Promise<DatasetSummary[]> {
  const res = await apiFetch<{ data: DatasetSummary[] }>(
    `/api/v1/organizations/${organizationId}/datasets`
  )
  return res.data
}

export async function createDataset(
  organizationId: number,
  input: { name: string; description?: string; embed_provider?: string }
): Promise<DatasetSummary> {
  const res = await apiFetch<{ data: DatasetSummary }>(
    `/api/v1/organizations/${organizationId}/datasets`,
    { method: "POST", body: input }
  )
  return res.data
}

export async function fetchDocuments(
  organizationId: number,
  datasetId: string
): Promise<DocumentSummary[]> {
  const res = await apiFetch<{ data: DocumentSummary[] }>(
    `/api/v1/organizations/${organizationId}/datasets/${datasetId}/documents`
  )
  return res.data
}

export async function uploadDocument(
  organizationId: number,
  datasetId: string,
  file: File
): Promise<DocumentSummary> {
  const formData = new FormData()
  formData.append("file", file)
  const res = await apiFetch<{ data: DocumentSummary }>(
    `/api/v1/organizations/${organizationId}/datasets/${datasetId}/documents`,
    { method: "POST", body: formData }
  )
  return res.data
}

export async function retryDocumentIngestion(
  organizationId: number,
  datasetId: string,
  documentId: string
): Promise<DocumentSummary> {
  const res = await apiFetch<{ data: DocumentSummary }>(
    `/api/v1/organizations/${organizationId}/datasets/${datasetId}/documents/${documentId}/retry`,
    { method: "POST" }
  )
  return res.data
}

export async function generateDocumentDraft(
  organizationId: number,
  datasetId: string,
  input: { title: string; topic: string }
): Promise<{ title: string; content: string }> {
  return apiFetch(
    `/api/v1/organizations/${organizationId}/datasets/${datasetId}/documents/generate`,
    { method: "POST", body: input }
  )
}

export async function runDatasetQuery(
  organizationId: number,
  datasetId: string,
  input: { query: string; system_prompt?: string; model?: string }
): Promise<QueryResponse> {
  return apiFetch(
    `/api/v1/organizations/${organizationId}/datasets/${datasetId}/query`,
    { method: "POST", body: input }
  )
}

export async function fetchSuggestions(
  organizationId: number,
  datasetId: string,
  input: {
    systemPrompt: string
    agentLabel?: string
    lastQuery?: string | null
  },
  signal?: AbortSignal
): Promise<QuerySuggestion[]> {
  const res = await apiFetch<{ suggestions: QuerySuggestion[] }>(
    `/api/v1/organizations/${organizationId}/datasets/${datasetId}/suggestions`,
    {
      method: "POST",
      body: {
        system_prompt: input.systemPrompt,
        agent_label: input.agentLabel,
        last_query: input.lastQuery || undefined,
      },
      signal,
    }
  )
  return res.suggestions
}

/**
 * A named grouping of agents. Purely organizational — it changes how agents are
 * listed and filtered, never how they behave. An agent belongs to at most one
 * team, and belonging to none is the normal starting state.
 */
export type AgentTeamSummary = {
  id: string
  name: string
  description: string | null
  icon: string | null
  iconColor: string | null
  position: number
  agentCount: number
  createdAt: string
}

export type AgentTeamInput = {
  name: string
  description?: string | null
  icon?: string | null
  icon_color?: string | null
  position?: number
}

export async function fetchAgentTeams(
  organizationId: number
): Promise<AgentTeamSummary[]> {
  const res = await apiFetch<{ data: AgentTeamSummary[] }>(
    `/api/v1/organizations/${organizationId}/agent-teams`
  )
  return res.data
}

export async function createAgentTeam(
  organizationId: number,
  input: AgentTeamInput
): Promise<AgentTeamSummary> {
  const res = await apiFetch<{ data: AgentTeamSummary }>(
    `/api/v1/organizations/${organizationId}/agent-teams`,
    { method: "POST", body: input }
  )
  return res.data
}

export async function updateAgentTeam(
  organizationId: number,
  teamId: string,
  input: Partial<AgentTeamInput>
): Promise<AgentTeamSummary> {
  const res = await apiFetch<{ data: AgentTeamSummary }>(
    `/api/v1/organizations/${organizationId}/agent-teams/${teamId}`,
    { method: "PUT", body: input }
  )
  return res.data
}

/**
 * Deleting a team does not delete its agents — they become unassigned.
 */
export async function deleteAgentTeam(
  organizationId: number,
  teamId: string
): Promise<void> {
  await apiFetch(
    `/api/v1/organizations/${organizationId}/agent-teams/${teamId}`,
    { method: "DELETE" }
  )
}

export type AgentSummary = {
  id: string
  name: string
  label: string // Required alias for compatibility
  description: string
  system: string
  isPrimary: boolean
  persona: {
    identity: string
    tone: "friendly" | "professional" | "concise" | "empathetic" | "casual"
    language: "match_customer" | "english" | "burmese"
  }
  messages: {
    firstMessageMode: AgentFirstMessageMode
    greeting: string
    fallback: string
  }
  activeGuidanceCount: number
  guidance: AgentGuidance[]
  status: "active" | "inactive" | "draft"
  messageCount: number
  datasetIds?: string[]
  datasets?: DatasetSummary[]
  agentTeamId: string | null
  // Only populated when the agent was fetched with its team eager loaded.
  agentTeam?: AgentTeamSummary | null
  createdAt: string
  // Optional: the API responses are spread through verbatim, so this arrives at
  // runtime if the backend resource exposes it. Absent until that is confirmed.
  updatedAt?: string
}

export type AgentFirstMessageMode =
  | "assistant-speaks-first"
  | "assistant-waits-for-user"
  | "assistant-speaks-first-with-model-generated-message"

export type AgentGuidance = {
  id: string
  title: string
  instruction: string
  isActive: boolean
  position: number
}

export type AgentUpdateInput = Partial<{
  name: string
  description: string | null
  system: string
  tone: AgentSummary["persona"]["tone"]
  language: AgentSummary["persona"]["language"]
  first_message_mode: AgentFirstMessageMode
  greeting: string
  fallback_message: string
  is_primary: boolean
  status: AgentSummary["status"]
  dataset_ids: string[]
  // `null` unassigns the agent from its team.
  agent_team_id: string | null
}>

export async function generateOpeningMessage(
  organizationId: number,
  input: {
    name: string
    system: string
    tone: AgentSummary["persona"]["tone"]
    language: AgentSummary["persona"]["language"]
  },
  signal?: AbortSignal
): Promise<string> {
  const response = await apiFetch<{ message: string }>(
    `/api/v1/organizations/${organizationId}/agents/opening-message`,
    { method: "POST", body: input, signal }
  )

  return response.message
}

export async function fetchAgents(
  organizationId: number
): Promise<AgentSummary[]> {
  const res = await apiFetch<{ data: AgentSummary[] }>(
    `/api/v1/organizations/${organizationId}/agents`
  )
  return res.data.map((agent) => ({
    ...agent,
    description: agent.description || "",
    label: agent.name, // Map name to label for compatibility
  }))
}

export async function createAgent(
  organizationId: number,
  input: {
    name: string
    description?: string
    system: string
    status: string
    tone?: AgentSummary["persona"]["tone"]
    language?: AgentSummary["persona"]["language"]
    first_message_mode?: AgentFirstMessageMode
    greeting?: string
    fallback_message?: string
    dataset_ids?: string[]
    agent_team_id?: string | null
  }
): Promise<AgentSummary> {
  const res = await apiFetch<{ data: AgentSummary }>(
    `/api/v1/organizations/${organizationId}/agents`,
    { method: "POST", body: input }
  )
  return {
    ...res.data,
    description: res.data.description || "",
    label: res.data.name,
  }
}

export async function fetchAgent(
  organizationId: number,
  agentId: string
): Promise<AgentSummary> {
  const res = await apiFetch<{ data: AgentSummary }>(
    `/api/v1/organizations/${organizationId}/agents/${agentId}`
  )
  return {
    ...res.data,
    description: res.data.description || "",
    label: res.data.name,
  }
}

export async function updateAgent(
  organizationId: number,
  agentId: string,
  input: AgentUpdateInput
): Promise<AgentSummary> {
  const res = await apiFetch<{ data: AgentSummary }>(
    `/api/v1/organizations/${organizationId}/agents/${agentId}`,
    { method: "PUT", body: input }
  )
  return {
    ...res.data,
    description: res.data.description || "",
    label: res.data.name,
  }
}

export async function createAgentGuidance(
  organizationId: number,
  agentId: string,
  input: { title: string; instruction: string; is_active?: boolean }
): Promise<AgentGuidance> {
  const res = await apiFetch<{ data: AgentGuidance }>(
    `/api/v1/organizations/${organizationId}/agents/${agentId}/guidance`,
    { method: "POST", body: input }
  )
  return res.data
}

export async function updateAgentGuidance(
  organizationId: number,
  agentId: string,
  guidanceId: string,
  input: Partial<{ title: string; instruction: string; is_active: boolean }>
): Promise<AgentGuidance> {
  const res = await apiFetch<{ data: AgentGuidance }>(
    `/api/v1/organizations/${organizationId}/agents/${agentId}/guidance/${guidanceId}`,
    { method: "PUT", body: input }
  )
  return res.data
}

export async function deleteAgentGuidance(
  organizationId: number,
  agentId: string,
  guidanceId: string
): Promise<void> {
  await apiFetch(
    `/api/v1/organizations/${organizationId}/agents/${agentId}/guidance/${guidanceId}`,
    { method: "DELETE" }
  )
}

export async function reorderAgentGuidance(
  organizationId: number,
  agentId: string,
  guidanceIds: string[]
): Promise<AgentGuidance[]> {
  const res = await apiFetch<{ data: AgentGuidance[] }>(
    `/api/v1/organizations/${organizationId}/agents/${agentId}/guidance/order`,
    { method: "PUT", body: { guidance_ids: guidanceIds } }
  )
  return res.data
}

export async function deleteAgent(
  organizationId: number,
  agentId: string
): Promise<void> {
  await apiFetch(`/api/v1/organizations/${organizationId}/agents/${agentId}`, {
    method: "DELETE",
  })
}

export type AiSettings = {
  auto_reply: boolean
  auto_assign: boolean
  default_model: string | null
}

export async function fetchAiSettings(
  organizationId: number
): Promise<AiSettings> {
  const res = await apiFetch<{ data: AiSettings }>(
    `/api/v1/organizations/${organizationId}/ai-settings`
  )
  return res.data
}

export async function updateAiSettings(
  organizationId: number,
  input: AiSettings
): Promise<AiSettings> {
  const res = await apiFetch<{ data: AiSettings }>(
    `/api/v1/organizations/${organizationId}/ai-settings`,
    { method: "PUT", body: input }
  )
  return res.data
}

export type ActivityStatus = "success" | "warning" | "error"

export type ActivityLogEntry = {
  id: string
  time: string
  query: string
  dataset: string
  model: string
  status: ActivityStatus
  latencyMs: number
  tokens: number
  chunks: number
  faithfulness: number | null
  note?: string
}

export type ActivityLogPage = {
  data: ActivityLogEntry[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export async function fetchActivityLogs(
  organizationId: number,
  params?: { status?: ActivityStatus; datasetId?: string; search?: string }
): Promise<ActivityLogPage> {
  const query = new URLSearchParams()
  if (params?.status) query.set("status", params.status)
  if (params?.datasetId) query.set("dataset_id", params.datasetId)
  if (params?.search) query.set("search", params.search)
  const qs = query.toString()
  return apiFetch<ActivityLogPage>(
    `/api/v1/organizations/${organizationId}/query-logs${qs ? `?${qs}` : ""}`
  )
}
