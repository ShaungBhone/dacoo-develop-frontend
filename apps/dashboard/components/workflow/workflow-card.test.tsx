import { createElement, type ReactElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

/**
 * The canvas node is exercised without a DOM: `@xyflow/react` is stubbed so the
 * component can be called directly (for its element tree) and rendered to
 * static markup (for the merged class names).
 */
const connections = vi.hoisted(() => ({
  current: [] as { sourceHandle?: string | null }[],
}))

vi.mock("@xyflow/react", () => ({
  Handle: (props: Record<string, unknown>) => createElement("div", props),
  Position: { Top: "top", Bottom: "bottom", Left: "left", Right: "right" },
  useNodeConnections: () => connections.current,
}))

const { WorkflowCard } = await import("./workflow-card")

type CardProps = Parameters<typeof WorkflowCard>[0]
type CardData = CardProps["data"]

type ElementLike = {
  props: Record<string, unknown>
}

function collectElements(
  node: unknown,
  out: ElementLike[] = []
): ElementLike[] {
  if (Array.isArray(node)) {
    for (const child of node) collectElements(child, out)
    return out
  }
  if (!node || typeof node !== "object") return out

  const element = node as Partial<ElementLike>
  if (!element.props) return out

  out.push(element as ElementLike)
  if (element.props.render) collectElements(element.props.render, out)
  return collectElements(element.props.children, out)
}

function renderTree(data: CardData, selected = false) {
  const tree = WorkflowCard({
    id: "node-1",
    data,
    selected,
  } as CardProps) as ReactElement

  return collectElements(tree)
}

function findByLabel(elements: ElementLike[], label: string) {
  return elements.find((element) => element.props["aria-label"] === label)
}

function click(element: ElementLike | undefined) {
  expect(element).toBeDefined()
  const onClick = element?.props.onClick as
    ((event: { stopPropagation: () => void }) => void) | undefined
  expect(onClick).toBeTypeOf("function")
  onClick?.({ stopPropagation: () => {} })
}

function markup(data: CardData, selected = false) {
  return renderToStaticMarkup(
    createElement(
      WorkflowCard as never,
      {
        id: "node-1",
        data,
        selected,
      } as never
    )
  )
}

const triggerData = {
  title: "Message received",
  tone: "trigger",
  handles: { target: false, source: true },
} satisfies CardData

const actionData = {
  title: "Create record",
  tone: "action",
  handles: { target: true, source: true },
  config: { object_slug: "deals" },
} satisfies CardData

beforeEach(() => {
  connections.current = []
})

describe("frame variants", () => {
  it("renders a frame with header, panel, and footer", () => {
    const html = markup(actionData)
    expect(html).toContain('data-slot="frame"')
    expect(html).toContain('data-slot="frame-panel"')
    expect(html).toContain('data-slot="frame-panel-header"')
    expect(html).toContain('data-slot="frame-panel-footer"')
  })

  it("does not add a ring on hover or keyboard focus to the frame", () => {
    const elements = renderTree(actionData)
    const frame = elements.find(
      (element) => element.props["aria-label"] === actionData.title
    )
    const className = String(frame?.props.className || "")
    expect(className).not.toContain("hover:ring")
    expect(className).not.toContain("focus-visible:ring")
  })

  it("uses a ring when selected", () => {
    expect(markup(actionData, true)).toContain("ring-1 ring-ring")
  })

  it("reveals the action rail on hover and focus-within", () => {
    const html = markup(actionData)
    expect(html).toContain("group-hover/node:opacity-100")
    expect(html).toContain("group-focus-within/node:opacity-100")
  })

  it("connects incoming and outgoing edges vertically", () => {
    const elements = renderTree(actionData)

    expect(
      elements.find((element) => element.props.type === "target")?.props
        .position
    ).toBe("top")
    expect(
      elements.find((element) => element.props.type === "source")?.props
        .position
    ).toBe("bottom")
  })

  it("shows the derived provider chip in the footer", () => {
    expect(
      markup({
        title: "Notify",
        tone: "channel",
        config: { channel: "telegram", message: "hi" },
      } satisfies CardData)
    ).toContain("Telegram")
  })
})

describe("action rail", () => {
  it("wires Add next, Duplicate and Delete to their callbacks", () => {
    const onAddStep = vi.fn()
    const onDuplicate = vi.fn()
    const onDelete = vi.fn()

    const elements = renderTree({
      ...actionData,
      onAddStep,
      onDuplicate,
      onDelete,
    })

    click(findByLabel(elements, "Add next step"))
    click(findByLabel(elements, "Duplicate step"))
    click(findByLabel(elements, "Delete step"))

    expect(onAddStep).toHaveBeenCalledWith("node-1")
    expect(onDuplicate).toHaveBeenCalledWith("node-1")
    expect(onDelete).toHaveBeenCalledWith("node-1")
  })

  it("omits controls whose callback is not provided", () => {
    const elements = renderTree(actionData)

    expect(findByLabel(elements, "Add next step")).toBeUndefined()
    expect(findByLabel(elements, "Duplicate step")).toBeUndefined()
    expect(findByLabel(elements, "Delete step")).toBeUndefined()
  })
})

describe("trigger mock run", () => {
  it("calls onTestRun from the trigger affordance", () => {
    const onTestRun = vi.fn()
    const elements = renderTree({ ...triggerData, onTestRun })
    const button = elements.find(
      (element) => element.props["aria-label"] === "Run trigger with mock data"
    )

    click(button)
    expect(onTestRun).toHaveBeenCalledWith("node-1")
  })

  it("is not offered on non-trigger steps", () => {
    const html = markup({ ...actionData, onTestRun: vi.fn() })
    expect(html).not.toContain("Run trigger with mock data")
  })
})

describe("configuration state", () => {
  it("offers a configure button in the action rail when onConfigure is provided", () => {
    const onConfigure = vi.fn()
    const elements = renderTree({
      title: "AI step",
      tone: "ai",
      config: {},
      onConfigure,
    } satisfies CardData)

    const button = elements.find(
      (element) => element.props["aria-label"] === "Configure this step"
    )

    click(button)
    expect(onConfigure).toHaveBeenCalledWith("node-1")
  })

  it("omits the configure button when onConfigure is not provided", () => {
    const html = markup({ ...actionData, onConfigure: undefined })
    expect(html).not.toContain("Configure this step")
  })

  it("opens the inspector when the frame itself is double-clicked", () => {
    const onConfigure = vi.fn()
    const elements = renderTree({ ...actionData, onConfigure })
    const frame = elements.find(
      (element) => element.props["aria-label"] === actionData.title
    )

    expect(frame?.props.role).toBe("button")
    const onDoubleClick = frame?.props.onDoubleClick as
      | ((event: { stopPropagation: () => void }) => void)
      | undefined
    onDoubleClick?.({ stopPropagation: () => {} })
    expect(onConfigure).toHaveBeenCalledWith("node-1")
  })
})

describe("condition branches", () => {
  const conditionData = {
    title: "Check status",
    tone: "condition",
    handles: { target: true, source: true, condition: true },
    config: { field: "status" },
  } satisfies CardData

  it("adds branch-specific steps from unconnected outputs", () => {
    const onAddStep = vi.fn()
    const elements = renderTree({ ...conditionData, onAddStep })

    click(findByLabel(elements, "Add step if true"))
    click(findByLabel(elements, "Add step if false"))

    expect(onAddStep).toHaveBeenNthCalledWith(1, "node-1", "true")
    expect(onAddStep).toHaveBeenNthCalledWith(2, "node-1", "false")
  })

  it("drops the Add control for a branch that is already connected", () => {
    connections.current = [{ sourceHandle: "true" }]
    const elements = renderTree({ ...conditionData, onAddStep: vi.fn() })

    expect(findByLabel(elements, "Add step if true")).toBeUndefined()
    expect(findByLabel(elements, "Add step if false")).toBeDefined()
  })

  it("does not offer the rail Add on a branching node", () => {
    const elements = renderTree({ ...conditionData, onAddStep: vi.fn() })
    expect(findByLabel(elements, "Add next step")).toBeUndefined()
  })

  it("places both branch handles along the bottom of the condition", () => {
    const elements = renderTree(conditionData)
    const branchHandles = elements.filter(
      (element) =>
        element.props.type === "source" &&
        (element.props.id === "true" || element.props.id === "false")
    )

    expect(branchHandles).toHaveLength(2)
    expect(
      branchHandles.every((handle) => handle.props.position === "bottom")
    ).toBe(true)
  })
})
