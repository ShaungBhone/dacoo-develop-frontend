import type { ReactElement, ReactNode } from "react"
import { beforeEach, expect, it, vi } from "vitest"

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
vi.mock("./api", () => ({ updateConversation: vi.fn() }))
import { AssignMemberDialog } from "./assign-member-dialog"
import { updateConversation, type Conversation } from "./api"
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
beforeEach(() => {
  unmount()
  hooks.pending = []
  vi.resetAllMocks()
})
it("offers only human assignment and preserves the selected member", async () => {
  const onAssigned = vi.fn()
  const onOpenChange = vi.fn()
  const props = {
    open: true,
    onOpenChange,
    organizationId: 1,
    conversationId: "conversation",
    assignedToUserId: null,
    preselectedUserId: 2,
    members: [
      {
        id: 2,
        name: "Human teammate",
        email: "human@example.test",
        avatarUrl: null,
        isOwner: false,
      },
    ],
    onAssigned,
  }
  const tree = render(() => AssignMemberDialog(props))
  expect(text(tree)).not.toMatch(/Manion|Assign to AI|workspace AI/)
  vi.mocked(updateConversation).mockResolvedValue({
    id: "conversation",
  } as Conversation)
  await (button(tree, "Assign").props.onClick as () => Promise<void>)()
  expect(updateConversation).toHaveBeenCalledWith(1, "conversation", {
    assigned_to_user_id: 2,
  })
  expect(onAssigned).toHaveBeenCalled()
  expect(onOpenChange).toHaveBeenCalledWith(false)
})
