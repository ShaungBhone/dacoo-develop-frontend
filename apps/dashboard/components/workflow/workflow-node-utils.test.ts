import { describe, expect, it } from "vitest"

import {
  attachNodeCallbacks,
  BRANCH_HORIZONTAL_OFFSET,
  getChildNodePosition,
  getFrameBorderClassName,
  getFrameBorderStyle,
  getMissingConfigKeys,
  getProviderLabel,
  isLegacyHorizontalLayout,
  isNodeSetupComplete,
  layoutNodesTopToBottom,
  NODE_VERTICAL_GAP,
  ROOT_NODE_POSITION,
} from "./workflow-node-utils"

describe("getChildNodePosition", () => {
  it("places a child directly below its parent", () => {
    expect(getChildNodePosition({ x: 80, y: 160 })).toEqual({
      x: 80,
      y: 160 + NODE_VERTICAL_GAP,
    })
  })

  it("fans branches horizontally while keeping the flow top-to-bottom", () => {
    const parent = { x: 80, y: 160 }

    expect(getChildNodePosition(parent, "true")).toEqual({
      x: 80 - BRANCH_HORIZONTAL_OFFSET,
      y: 160 + NODE_VERTICAL_GAP,
    })
    expect(getChildNodePosition(parent, "false")).toEqual({
      x: 80 + BRANCH_HORIZONTAL_OFFSET,
      y: 160 + NODE_VERTICAL_GAP,
    })
  })

  it("leaves enough vertical clearance between nodes", () => {
    expect(NODE_VERTICAL_GAP).toBeGreaterThan(200)
  })

  it("falls back to the root anchor when there is no parent", () => {
    expect(getChildNodePosition()).toEqual({
      x: ROOT_NODE_POSITION.x,
      y: ROOT_NODE_POSITION.y + NODE_VERTICAL_GAP,
    })
    expect(getChildNodePosition(null, "false")).toEqual({
      x: ROOT_NODE_POSITION.x + BRANCH_HORIZONTAL_OFFSET,
      y: ROOT_NODE_POSITION.y + NODE_VERTICAL_GAP,
    })
  })
})

describe("setup state detection", () => {
  it("treats triggers as always configured", () => {
    expect(isNodeSetupComplete("trigger")).toBe(true)
    expect(getMissingConfigKeys("trigger", {})).toEqual([])
  })

  it("requires object_slug for actions", () => {
    expect(getMissingConfigKeys("action", {})).toEqual(["object_slug"])
    expect(isNodeSetupComplete("action", { object_slug: "deals" })).toBe(true)
  })

  it("requires field for conditions", () => {
    expect(getMissingConfigKeys("condition", {})).toEqual(["field"])
    expect(isNodeSetupComplete("condition", { field: "status" })).toBe(true)
  })

  it("requires prompt for AI steps", () => {
    expect(getMissingConfigKeys("ai", {})).toEqual(["prompt"])
    expect(isNodeSetupComplete("ai", { prompt: "Summarize" })).toBe(true)
  })

  it("requires both channel and message for channel steps", () => {
    expect(getMissingConfigKeys("channel", {})).toEqual(["channel", "message"])
    expect(getMissingConfigKeys("channel", { channel: "telegram" })).toEqual([
      "message",
    ])
    expect(
      isNodeSetupComplete("channel", { channel: "telegram", message: "Hi" })
    ).toBe(true)
  })

  it("treats blank and whitespace-only strings as missing", () => {
    expect(isNodeSetupComplete("ai", { prompt: "" })).toBe(false)
    expect(isNodeSetupComplete("ai", { prompt: "   " })).toBe(false)
    expect(isNodeSetupComplete("action", { object_slug: undefined })).toBe(
      false
    )
  })
})

describe("getProviderLabel", () => {
  it("derives the chip from the configured channel", () => {
    expect(getProviderLabel("channel", { channel: "telegram" })).toBe(
      "Telegram"
    )
    expect(getProviderLabel("channel", { channel: "WhatsApp" })).toBe(
      "WhatsApp"
    )
  })

  it("passes through an unknown channel value", () => {
    expect(getProviderLabel("channel", { channel: "matrix" })).toBe("matrix")
  })

  it("falls back to the node category", () => {
    expect(getProviderLabel("action", {}, "Lists")).toBe("Lists")
    expect(getProviderLabel("channel", {}, "Messaging")).toBe("Messaging")
  })

  it("falls back to the tone default when nothing else is set", () => {
    expect(getProviderLabel("trigger", {})).toBe("Triggers")
    expect(getProviderLabel("action", {})).toBe("Records")
    expect(getProviderLabel("condition", {})).toBe("Logic")
    expect(getProviderLabel("ai", {})).toBe("AI")
    expect(getProviderLabel("channel", {})).toBe("Messaging")
    expect(getProviderLabel("action", {}, "  ")).toBe("Records")
  })
})

describe("frame variants", () => {
  it("uses a solid frame for triggers and dashed for downstream steps", () => {
    expect(getFrameBorderStyle("trigger")).toBe("solid")
    expect(getFrameBorderClassName("trigger")).toBe("border-solid")

    for (const tone of ["action", "condition", "ai", "channel"] as const) {
      expect(getFrameBorderStyle(tone)).toBe("dashed")
      expect(getFrameBorderClassName(tone)).toBe("border-dashed")
    }
  })
})

describe("attachNodeCallbacks", () => {
  const saved = [
    { id: "a", position: { x: 137, y: 42 }, data: { title: "A" } },
    { id: "b", position: { x: -80, y: 903 }, data: { title: "B" } },
  ]

  it("preserves saved and manually dragged positions", () => {
    const callbacks = { onDelete: () => {} }
    const attached = attachNodeCallbacks(saved, callbacks)

    expect(attached.map((node) => node.position)).toEqual([
      { x: 137, y: 42 },
      { x: -80, y: 903 },
    ])
    expect(attached.map((node) => node.id)).toEqual(["a", "b"])
  })

  it("adds the callbacks without dropping existing data", () => {
    const onDelete = () => {}
    const [first] = attachNodeCallbacks(saved, { onDelete })

    expect(first.data.title).toBe("A")
    expect(first.data.onDelete).toBe(onDelete)
  })

  it("does not mutate the nodes it is given", () => {
    const snapshot = JSON.stringify(saved)
    attachNodeCallbacks(saved, { onDelete: () => {} })
    expect(JSON.stringify(saved)).toBe(snapshot)
  })
})

describe("isLegacyHorizontalLayout", () => {
  it("detects horizontal chaining when target nodes are placed to the right", () => {
    const horizontalNodes = [
      { id: "1", position: { x: 50, y: 200 } },
      { id: "2", position: { x: 380, y: 200 } },
      { id: "3", position: { x: 710, y: 200 } },
    ]
    const edges = [
      { source: "1", target: "2" },
      { source: "2", target: "3" },
    ]

    expect(isLegacyHorizontalLayout(horizontalNodes, edges)).toBe(true)
  })

  it("returns false when nodes flow top to bottom", () => {
    const verticalNodes = [
      { id: "1", position: { x: 250, y: 100 } },
      { id: "2", position: { x: 250, y: 380 } },
      { id: "3", position: { x: 250, y: 660 } },
    ]
    const edges = [
      { source: "1", target: "2" },
      { source: "2", target: "3" },
    ]

    expect(isLegacyHorizontalLayout(verticalNodes, edges)).toBe(false)
  })

  it("handles empty or single node graphs without error", () => {
    expect(isLegacyHorizontalLayout([], [])).toBe(false)
    expect(isLegacyHorizontalLayout([{ id: "1", position: { x: 0, y: 0 } }], [])).toBe(false)
  })
})

describe("layoutNodesTopToBottom", () => {
  it("arranges a linear chain of nodes top to bottom with vertical gap", () => {
    const nodes = [
      { id: "trigger", position: { x: 50, y: 200 }, data: { tone: "trigger" } },
      { id: "ai", position: { x: 380, y: 200 }, data: { tone: "ai" } },
      { id: "action", position: { x: 710, y: 200 }, data: { tone: "action" } },
    ]
    const edges = [
      { source: "trigger", target: "ai" },
      { source: "ai", target: "action" },
    ]

    const arranged = layoutNodesTopToBottom(nodes, edges)

    expect(arranged[0].position.y).toBe(ROOT_NODE_POSITION.y)
    expect(arranged[1].position.y).toBe(ROOT_NODE_POSITION.y + NODE_VERTICAL_GAP)
    expect(arranged[2].position.y).toBe(ROOT_NODE_POSITION.y + 2 * NODE_VERTICAL_GAP)
    expect(arranged[0].position.x).toBe(ROOT_NODE_POSITION.x)
    expect(arranged[1].position.x).toBe(ROOT_NODE_POSITION.x)
    expect(arranged[2].position.x).toBe(ROOT_NODE_POSITION.x)
  })

  it("fans condition branches left for true and right for false", () => {
    const nodes = [
      { id: "cond", position: { x: 0, y: 0 }, data: { tone: "condition" } },
      { id: "true-step", position: { x: 0, y: 0 }, data: { tone: "action" } },
      { id: "false-step", position: { x: 0, y: 0 }, data: { tone: "action" } },
    ]
    const edges = [
      { source: "cond", target: "true-step", sourceHandle: "true" },
      { source: "cond", target: "false-step", sourceHandle: "false" },
    ]

    const arranged = layoutNodesTopToBottom(nodes, edges)
    const condNode = arranged.find((n) => n.id === "cond")!
    const trueNode = arranged.find((n) => n.id === "true-step")!
    const falseNode = arranged.find((n) => n.id === "false-step")!

    expect(condNode.position.y).toBe(ROOT_NODE_POSITION.y)
    expect(trueNode.position.y).toBe(ROOT_NODE_POSITION.y + NODE_VERTICAL_GAP)
    expect(falseNode.position.y).toBe(ROOT_NODE_POSITION.y + NODE_VERTICAL_GAP)

    expect(trueNode.position.x).toBe(condNode.position.x - BRANCH_HORIZONTAL_OFFSET)
    expect(falseNode.position.x).toBe(condNode.position.x + BRANCH_HORIZONTAL_OFFSET)
  })

  it("returns empty or single nodes unchanged", () => {
    expect(layoutNodesTopToBottom([])).toEqual([])
    const single = [{ id: "1", position: { x: 10, y: 20 } }]
    expect(layoutNodesTopToBottom(single)).toEqual([
      { id: "1", position: ROOT_NODE_POSITION },
    ])
  })
})
