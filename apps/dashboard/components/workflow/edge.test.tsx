import { createElement } from "react"
import { describe, expect, it, vi } from "vitest"

/**
 * `@xyflow/react` is stubbed so the edge component can be called directly and
 * its element tree inspected without a canvas or a DOM.
 */
vi.mock("@xyflow/react", () => {
  const node = {
    internals: {
      positionAbsolute: { x: 0, y: 0 },
      handleBounds: {
        source: [
          { id: null, position: "bottom", x: 0, y: 0, width: 8, height: 8 },
        ],
        target: [
          { id: null, position: "top", x: 0, y: 0, width: 8, height: 8 },
        ],
      },
    },
  }

  return {
    BaseEdge: (props: Record<string, unknown>) => createElement("path", props),
    EdgeLabelRenderer: (props: { children?: unknown }) =>
      createElement("div", null, props.children as never),
    getSmoothStepPath: () => ["M0,0", 50, 60] as const,
    Position: { Top: "top", Bottom: "bottom", Left: "left", Right: "right" },
    useInternalNode: () => node,
  }
})

const { Edge } = await import("./edge")

type ElementLike = { props: Record<string, unknown> }

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
  return collectElements(element.props.children, out)
}

function renderEdge(props: Record<string, unknown>) {
  const Animated = Edge.Animated as unknown as (
    props: Record<string, unknown>
  ) => unknown
  return collectElements(Animated(props))
}

const baseProps = {
  id: "e1",
  source: "node-1",
  target: "node-2",
  sourceHandleId: null,
  targetHandleId: null,
}

describe("edge midpoint Add", () => {
  it("adds a step from the source node", () => {
    const onAddStep = vi.fn()
    const elements = renderEdge({ ...baseProps, data: { onAddStep } })
    const button = elements.find(
      (element) => element.props["aria-label"] === "Add step here"
    )

    expect(button).toBeDefined()
    ;(
      button?.props.onClick as (event: { stopPropagation: () => void }) => void
    )({ stopPropagation: () => {} })

    expect(onAddStep).toHaveBeenCalledWith("node-1", undefined)
  })

  it("carries the branch through when the edge leaves a condition output", () => {
    const onAddStep = vi.fn()
    const elements = renderEdge({
      ...baseProps,
      sourceHandleId: "false",
      data: { onAddStep },
    })
    const button = elements.find(
      (element) => element.props["aria-label"] === "Add step here"
    )

    ;(
      button?.props.onClick as (event: { stopPropagation: () => void }) => void
    )({ stopPropagation: () => {} })

    expect(onAddStep).toHaveBeenCalledWith("node-1", "false")
  })

  it("renders no Add control when no callback is injected", () => {
    const elements = renderEdge({ ...baseProps, data: {} })
    expect(
      elements.find(
        (element) => element.props["aria-label"] === "Add step here"
      )
    ).toBeUndefined()
  })
})
