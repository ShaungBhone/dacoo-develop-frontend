import { type ReactElement, type ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { ApiError } from "@/lib/api"

// Exercise the controls' async event handlers using a small state harness,
// following the repository's element-tree tests without introducing a DOM runtime.
const state = vi.hoisted(() => ({
  cells: [] as unknown[],
  cursor: 0,
  effects: [] as (() => unknown)[],
}))
vi.mock("react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react")>()),
  useState: (initial: unknown) => {
    const index = state.cursor++
    if (!(index in state.cells)) state.cells[index] = initial
    return [
      state.cells[index],
      (next: unknown) => {
        state.cells[index] =
          typeof next === "function" ? next(state.cells[index]) : next
      },
    ]
  },
  useEffect: (effect: () => unknown) => {
    state.effects.push(effect)
  },
  useMemo: (compute: () => unknown) => compute(),
  useRef: (current: unknown) => ({ current }),
}))
vi.mock("@/components/rag/api", () => ({
  fetchAiSettings: vi.fn(),
  updateAiSettings: vi.fn(),
}))
import { WorkspaceAiAssignment } from "./assignment-settings-view"
import {
  fetchAiSettings,
  updateAiSettings,
  type AiSettings,
} from "@/components/rag/api"

type Element = ReactElement<Record<string, unknown>>
function elements(node: ReactNode): Element[] {
  if (Array.isArray(node)) return node.flatMap(elements)
  if (!node || typeof node !== "object" || !("props" in node)) return []
  const element = node as Element
  return [element, ...elements(element.props.children as ReactNode)]
}
function text(node: ReactNode): string {
  if (Array.isArray(node)) return node.map(text).join("")
  if (typeof node === "string" || typeof node === "number") return String(node)
  if (node && typeof node === "object" && "props" in node)
    return text((node as Element).props.children as ReactNode)
  return ""
}
function render<P>(component: (props: P) => ReactNode, props: P) {
  state.cursor = 0
  state.effects = []
  return component(props)
}
function click(tree: ReactNode, label: string) {
  const button = elements(tree).find(
    (item) => typeof item.props.onClick === "function" && text(item) === label
  )
  expect(button, label).toBeDefined()
  ;(button!.props.onClick as () => void)()
}
const settle = () => new Promise((resolve) => setTimeout(resolve, 0))
const aiSettings: AiSettings = {
  auto_assign: false,
  auto_reply: false,
  default_model: "model",
  follow_up_enabled: true,
  follow_up_after_days: 5,
}
beforeEach(() => {
  state.cells = []
  state.cursor = 0
  vi.clearAllMocks()
})

describe("workspace AI assignment settings", () => {
  const props = { organizationId: 1 }
  async function load() {
    render(WorkspaceAiAssignment, props)
    state.effects[0]()
    await settle()
    return render(WorkspaceAiAssignment, props)
  }

  it("loads and saves a single workspace-wide switch, preserving other settings", async () => {
    vi.mocked(fetchAiSettings).mockResolvedValue(aiSettings)
    const enabled = { ...aiSettings, auto_assign: true, auto_reply: true }
    vi.mocked(updateAiSettings).mockResolvedValue(enabled)
    const tree = await load()
    expect(text(tree)).toBe("Automatically assign conversations to AI")
    const toggle = elements(tree).find(
      (item) => item.props.id === "workspace-ai-assignment"
    )!
    ;(toggle.props.onCheckedChange as (checked: boolean) => void)(true)
    await settle()
    expect(updateAiSettings).toHaveBeenCalledWith(1, enabled)
    expect(
      elements(render(WorkspaceAiAssignment, props)).find(
        (item) => item.props.id === "workspace-ai-assignment"
      )?.props.checked
    ).toBe(true)
    vi.mocked(updateAiSettings).mockResolvedValue(aiSettings)
    const updatedToggle = elements(render(WorkspaceAiAssignment, props)).find(
      (item) => item.props.id === "workspace-ai-assignment"
    )!
    ;(updatedToggle.props.onCheckedChange as (checked: boolean) => void)(false)
    await settle()
    expect(updateAiSettings).toHaveBeenLastCalledWith(1, aiSettings)
  })

  it("keeps the old setting and displays save errors", async () => {
    vi.mocked(fetchAiSettings).mockResolvedValue(aiSettings)
    vi.mocked(updateAiSettings).mockRejectedValue(
      new ApiError("Insufficient balance. Add funds.", 422)
    )
    const tree = await load()
    const toggle = elements(tree).find(
      (item) => item.props.id === "workspace-ai-assignment"
    )!
    ;(toggle.props.onCheckedChange as (checked: boolean) => void)(true)
    await settle()
    const failed = render(WorkspaceAiAssignment, props)
    expect(text(failed)).toContain("Insufficient balance. Add funds.")
    expect(
      elements(failed).find(
        (item) => item.props.id === "workspace-ai-assignment"
      )?.props.checked
    ).toBe(false)
  })

  it("allows retrying a settings load failure", async () => {
    vi.mocked(fetchAiSettings)
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue(aiSettings)
    const tree = await load()
    click(tree, "Retry loading settings")
    await settle()
    expect(fetchAiSettings).toHaveBeenCalledTimes(2)
    expect(text(render(WorkspaceAiAssignment, props))).toBe(
      "Automatically assign conversations to AI"
    )
  })
})
