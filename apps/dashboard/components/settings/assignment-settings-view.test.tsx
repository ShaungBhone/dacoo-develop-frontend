import type { ReactElement, ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { ApiError } from "@/lib/api"

const hooks = vi.hoisted(() => ({
  cells: [] as unknown[],
  cursor: 0,
  effects: new Map<number, { deps: unknown[]; cleanup?: () => void }>(),
  pending: [] as (() => void)[],
}))
vi.mock("react", async (original) => ({
  ...(await original<typeof import("react")>()),
  useState: (initial: unknown) => {
    const index = hooks.cursor++
    if (!(index in hooks.cells)) hooks.cells[index] = initial
    return [
      hooks.cells[index],
      (next: unknown) => {
        hooks.cells[index] =
          typeof next === "function" ? next(hooks.cells[index]) : next
      },
    ]
  },
  useRef: (initial: unknown) => {
    const index = hooks.cursor++
    if (!(index in hooks.cells)) hooks.cells[index] = { current: initial }
    return hooks.cells[index]
  },
  useCallback: (fn: unknown, deps: unknown[]) => {
    const index = hooks.cursor++
    const previous = hooks.cells[index] as
      { fn: unknown; deps: unknown[] } | undefined
    if (!previous || deps.some((dep, i) => !Object.is(dep, previous.deps[i])))
      hooks.cells[index] = { fn, deps }
    return (hooks.cells[index] as { fn: unknown }).fn
  },
  useEffect: (effect: () => (() => void) | undefined, deps: unknown[]) => {
    const index = hooks.cursor++
    const previous = hooks.effects.get(index)
    if (!previous || deps.some((dep, i) => !Object.is(dep, previous.deps[i]))) {
      hooks.pending.push(() => {
        previous?.cleanup?.()
        hooks.effects.set(index, { deps, cleanup: effect() })
      })
    }
  },
}))
const shared = vi.hoisted(() => ({
  settings: {
    auto_assign: false,
    auto_reply: false,
    default_model: null as string | null,
    follow_up_enabled: false,
  },
  isLoading: false,
  error: null as string | null,
  refresh: vi.fn(),
  publish: vi.fn(),
}))
vi.mock("@/contexts/workspace-ai-settings-context", async (original) => ({
  ...(await original<
    typeof import("@/contexts/workspace-ai-settings-context")
  >()),
  useWorkspaceAiSettings: () => shared,
}))
vi.mock("@/components/rag/api", () => ({
  fetchAgents: vi.fn(),
  fetchModelCatalog: vi.fn(),
  updateAiSettings: vi.fn(),
  fetchAiSettings: vi.fn(),
}))
import {
  fetchAgents,
  fetchModelCatalog,
  updateAiSettings,
  fetchAiSettings,
  type AiSettings,
  type AgentSummary,
} from "@/components/rag/api"
import { WorkspaceAiAssignment } from "./assignment-settings-view"
import { WorkspaceAiSettingsScope } from "@/contexts/workspace-ai-settings-context"
function render<T>(component: () => T): T {
  hooks.cursor = 0
  const value = component()
  hooks.pending.splice(0).forEach((effect) => effect())
  return value
}
function unmount() {
  hooks.effects.forEach((effect) => effect.cleanup?.())
  hooks.effects.clear()
  hooks.cells = []
}
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
  if (node && typeof node === "object" && "props" in node)
    return text((node as Element).props.children as ReactNode)
  return ""
}
function button(tree: ReactNode, label: string) {
  return elements(tree).find(
    (element) =>
      typeof element.props.onClick === "function" && text(element) === label
  )!
}
function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: Error) => void
  const promise = new Promise<T>((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}
const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

const settings = {
  auto_assign: false,
  auto_reply: false,
  default_model: null,
  follow_up_enabled: false,
}
beforeEach(() => {
  unmount()
  hooks.pending = []
  vi.resetAllMocks()
  Object.assign(shared, {
    settings: { ...settings },
    isLoading: false,
    error: null,
  })
  vi.mocked(fetchAgents).mockResolvedValue([
    { id: "active", name: "Support", status: "active" },
    { id: "draft", name: "Draft", status: "draft" },
  ] as AgentSummary[])
  vi.mocked(fetchModelCatalog).mockResolvedValue({
    chatModels: [{ id: "model", label: "Model label", provider: "provider" }],
    embeddingProviders: [],
  })
})
async function load() {
  render(() => WorkspaceAiAssignment({ organizationId: 1 }))
  await settle()
  return render(() => WorkspaceAiAssignment({ organizationId: 1 }))
}
function toggle(tree: ReactNode, enabled: boolean) {
  const element = elements(tree).find(
    (item) => item.props.id === "workspace-ai-assignment"
  )!
  ;(element.props.onCheckedChange as (value: boolean) => void)(enabled)
}
function scope() {
  return render(() =>
    WorkspaceAiSettingsScope({ organizationId: 1, children: null })
  ).props.value
}

describe("workspace assignment settings", () => {
  it("shows active agents and model defaults and waits for explicit Save", async () => {
    const tree = await load()
    expect(text(tree)).toContain("Enable Manion AI")
    expect(text(tree)).toContain("Manion AI")
    expect(text(tree)).not.toContain("Workspace AI")
    expect(text(tree)).toContain("Workspace default model")
    expect(
      elements(tree)
        .filter((item) => item.type === "li")
        .map(text)
    ).toEqual(["Support"])
    expect(text(tree)).toContain("Active abilities")
    expect(text(tree)).toContain("Support")
    expect(text(tree)).not.toContain("Primary agent")
    toggle(tree, true)
    expect(updateAiSettings).not.toHaveBeenCalled()
    const updated = render(() => WorkspaceAiAssignment({ organizationId: 1 }))
    const selects = elements(updated).filter(
      (item) => typeof item.props.onValueChange === "function"
    )
    ;(selects[0].props.onValueChange as (value: string) => void)("model")
    vi.mocked(updateAiSettings).mockResolvedValue({
      ...settings,
      auto_assign: true,
      auto_reply: true,
      default_model: "model",
    })
    ;(
      button(
        render(() => WorkspaceAiAssignment({ organizationId: 1 })),
        "Save"
      ).props.onClick as () => void
    )()
    await settle()
    expect(updateAiSettings).toHaveBeenCalledWith(1, {
      ...settings,
      auto_assign: true,
      auto_reply: true,
      default_model: "model",
    })
    expect(shared.publish).toHaveBeenCalledWith(
      expect.objectContaining({ default_model: "model" })
    )
  })
  it("preserves drafts on save failure and shows a retryable options error", async () => {
    let tree = await load()
    toggle(tree, true)
    vi.mocked(updateAiSettings).mockRejectedValue(
      new ApiError("Not allowed", 403)
    )
    ;(
      button(
        render(() => WorkspaceAiAssignment({ organizationId: 1 })),
        "Save"
      ).props.onClick as () => void
    )()
    await settle()
    expect(
      text(render(() => WorkspaceAiAssignment({ organizationId: 1 })))
    ).toContain("Not allowed")
    expect(shared.publish).not.toHaveBeenCalled()
    unmount()
    vi.mocked(fetchAgents).mockRejectedValueOnce(new Error("offline"))
    tree = await load()
    expect(text(tree)).toContain("Couldn't load assignment options")
    ;(button(tree, "Retry loading settings").props.onClick as () => void)()
    render(() => WorkspaceAiAssignment({ organizationId: 1 }))
    await settle()
    expect(
      text(render(() => WorkspaceAiAssignment({ organizationId: 1 })))
    ).toContain("Active abilities")
  })
  it("preserves unknown model IDs when the catalog is unavailable", async () => {
    shared.settings.default_model = "unknown/model"
    vi.mocked(fetchModelCatalog).mockRejectedValue(new Error("offline"))
    expect(text(await load())).toContain("unknown/model")
  })
  it("ignores completion after leaving a workspace", async () => {
    const tree = await load()
    toggle(tree, true)
    const pending = deferred<AiSettings>()
    vi.mocked(updateAiSettings).mockReturnValue(pending.promise)
    ;(
      button(
        render(() => WorkspaceAiAssignment({ organizationId: 1 })),
        "Save"
      ).props.onClick as () => void
    )()
    unmount()
    pending.resolve(settings)
    await settle()
    expect(shared.publish).not.toHaveBeenCalled()
  })
})

describe("shared workspace AI state", () => {
  it("refreshes on focus and immediately publishes saved settings to Inbox consumers", async () => {
    const listeners = new Map<string, () => void>()
    vi.stubGlobal("window", {
      addEventListener: (event: string, listener: () => void) =>
        listeners.set(event, listener),
      removeEventListener: vi.fn(),
    })
    vi.mocked(fetchAiSettings).mockResolvedValue(settings)
    scope()
    await settle()
    expect(scope().settings).toEqual(settings)
    vi.mocked(fetchAiSettings).mockResolvedValue({
      ...settings,
      auto_reply: true,
      auto_assign: true,
    })
    listeners.get("focus")!()
    await settle()
    expect(scope().settings?.auto_reply).toBe(true)
    scope().publish(settings)
    expect(scope().settings?.auto_reply).toBe(false)
  })
  it("ignores stale requests after a saved update or unmount", async () => {
    vi.stubGlobal("window", {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })
    const pending = deferred<AiSettings>()
    vi.mocked(fetchAiSettings).mockReturnValue(pending.promise)
    scope()
    await settle()
    scope().publish({ ...settings, auto_reply: true, auto_assign: true })
    pending.resolve(settings)
    await settle()
    expect(scope().settings?.auto_reply).toBe(true)
    unmount()
    expect(hooks.cells).toEqual([])
  })
})
