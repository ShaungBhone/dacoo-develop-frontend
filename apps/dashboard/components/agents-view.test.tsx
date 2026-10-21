import type { ReactElement, ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { toast } from "sonner"

const state = vi.hoisted(() => ({
  cells: [] as unknown[],
  cursor: 0,
  effects: [] as (() => unknown)[],
}))

vi.mock("react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react")>()),
  useState: (initial: unknown) => {
    const index = state.cursor++
    if (!(index in state.cells)) {
      state.cells[index] = typeof initial === "function" ? initial() : initial
    }
    return [
      state.cells[index],
      (next: unknown) => {
        state.cells[index] =
          typeof next === "function" ? next(state.cells[index]) : next
      },
    ]
  },
  useEffect: (effect: () => unknown) => state.effects.push(effect),
  useMemo: (compute: () => unknown) => compute(),
  useCallback: (callback: unknown) => callback,
}))
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))
vi.mock("@/hooks/use-active-organization", () => ({
  useActiveOrganization: () => ({ id: 1 }),
}))
vi.mock("@/hooks/use-mobile", () => ({ useIsMobile: () => false }))
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock("@/components/rag/api", () => ({
  fetchAgents: vi.fn(),
  fetchDatasets: vi.fn().mockResolvedValue([]),
  fetchAgentTeams: vi.fn().mockResolvedValue([]),
  updateAgent: vi.fn(),
  deleteAgent: vi.fn(),
  createAgentTeam: vi.fn(),
  updateAgentTeam: vi.fn(),
  deleteAgentTeam: vi.fn(),
}))

import { AgentsView, buildAgentColumns } from "./agents-view"
import { fetchAgents, updateAgent, type AgentSummary } from "./rag/api"

type Element = ReactElement<Record<string, unknown>>
function elements(node: ReactNode): Element[] {
  if (Array.isArray(node)) return node.flatMap(elements)
  if (!node || typeof node !== "object" || !("props" in node)) return []
  const element = node as Element
  return [element, ...elements(element.props.children as ReactNode)]
}
function text(node: ReactNode): string {
  if (Array.isArray(node)) return node.map(text).join("")
  if (typeof node === "string") return node
  if (node && typeof node === "object" && "props" in node) {
    return text((node as Element).props.children as ReactNode)
  }
  return ""
}
function render() {
  state.cursor = 0
  state.effects = []
  const tree = AgentsView()
  return elements(tree).find((element) => Array.isArray(element.props.columns))!
}
function statusAction(table: Element, agent: AgentSummary) {
  const columns = table.props.columns as ReturnType<typeof buildAgentColumns>
  const cell = columns.find((column) => column.id === "actions")!.cell
  const tree = (cell as (props: unknown) => ReactNode)({
    row: { original: agent },
  })
  return elements(tree).find((element) =>
    /^(Activate|Deactivate) agent$/.test(text(element))
  )!
}
const settle = () => new Promise((resolve) => setTimeout(resolve, 0))
const draft = {
  id: "agent1",
  name: "Support",
  description: "Customer support",
  status: "draft",
  isPrimary: false,
  agentTeamId: null,
  messageCount: 0,
} as AgentSummary

async function load(agents: AgentSummary[]) {
  vi.mocked(fetchAgents).mockResolvedValue(agents)
  render()
  state.effects[0]()
  await settle()
  return render()
}

beforeEach(() => {
  state.cells = []
  state.cursor = 0
  vi.clearAllMocks()
})

describe("agent activation menu", () => {
  it("activates an ability without selecting a primary agent", async () => {
    const table = await load([draft])
    const active = { ...draft, status: "active" as const, isPrimary: false }
    vi.mocked(updateAgent).mockResolvedValue(active)
    vi.mocked(fetchAgents).mockResolvedValue([active])
    await (statusAction(table, draft).props.onClick as () => Promise<void>)()

    expect(updateAgent).toHaveBeenCalledWith(1, draft.id, {
      status: "active",
    })
    expect(render().props.data).toEqual([active])
    expect(text(statusAction(render(), active))).toBe("Deactivate agent")
    expect(toast.success).toHaveBeenCalledWith("Agent activated")
  })

  it("reactivates an inactive agent without replacing the existing primary", async () => {
    const primary = {
      ...draft,
      id: "primary",
      status: "active" as const,
      isPrimary: true,
    }
    const inactive = { ...draft, status: "inactive" as const }
    const table = await load([primary, inactive])
    vi.mocked(updateAgent).mockResolvedValue({ ...inactive, status: "active" })
    await (statusAction(table, inactive).props.onClick as () => Promise<void>)()
    expect(updateAgent).toHaveBeenCalledWith(1, inactive.id, {
      status: "active",
    })
  })

  it("deactivates the primary and reloads the server-selected replacement", async () => {
    const primary = { ...draft, status: "active" as const, isPrimary: true }
    const replacement = { ...primary, id: "replacement" }
    const table = await load([primary, { ...replacement, isPrimary: false }])
    const inactive = { ...draft, status: "inactive" as const }
    vi.mocked(updateAgent).mockResolvedValue(inactive)
    vi.mocked(fetchAgents).mockResolvedValue([inactive, replacement])
    await (statusAction(table, primary).props.onClick as () => Promise<void>)()
    expect(updateAgent).toHaveBeenCalledWith(1, primary.id, {
      status: "inactive",
    })
    expect(render().props.data).toEqual([inactive, replacement])
    expect(toast.success).toHaveBeenCalledWith("Agent deactivated")
  })

  it("disables changes while saving and preserves the draft if the API fails", async () => {
    const table = await load([draft])
    let rejectUpdate!: (reason: Error) => void
    vi.mocked(updateAgent).mockReturnValue(
      new Promise((_, reject) => {
        rejectUpdate = reject
      })
    )
    const saving = (
      statusAction(table, draft).props.onClick as () => Promise<void>
    )()
    expect(statusAction(render(), draft).props.disabled).toBe(true)
    rejectUpdate(new Error("Request failed"))
    await saving
    expect(render().props.data).toEqual([draft])
    expect(statusAction(render(), draft).props.disabled).toBe(false)
    expect(toast.error).toHaveBeenCalled()
    expect(toast.success).not.toHaveBeenCalled()
  })
})
