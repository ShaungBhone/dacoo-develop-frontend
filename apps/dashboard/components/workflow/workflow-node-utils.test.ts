import { describe, expect, it } from "vitest"

import {
  attachNodeCallbacks,
  BRANCH_HORIZONTAL_OFFSET,
  getChildNodePosition,
  getFrameBorderClassName,
  getFrameBorderStyle,
  getMissingConfigKeys,
  getProviderLabel,
  isNodeSetupComplete,
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
