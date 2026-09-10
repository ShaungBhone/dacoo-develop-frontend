export type WorkflowTone = "trigger" | "action" | "condition" | "ai" | "channel"

export type WorkflowBranchId = "true" | "false"

export type WorkflowPosition = { x: number; y: number }

/** Vertical clearance between cards in the top-to-bottom workflow. */
export const NODE_VERTICAL_GAP = 280

/** True/False branches fan horizontally while continuing downward. */
export const BRANCH_HORIZONTAL_OFFSET = 190

/** Where the first node lands when there is no parent to anchor against. */
export const ROOT_NODE_POSITION: WorkflowPosition = { x: 80, y: 160 }

/**
 * Places a newly added child below its parent. Branch children fan left (true)
 * or right (false) while continuing down the canvas.
 */
export function getChildNodePosition(
  parent?: WorkflowPosition | null,
  branchId?: WorkflowBranchId
): WorkflowPosition {
  const anchor = parent ?? ROOT_NODE_POSITION

  let x = anchor.x
  const y = anchor.y + NODE_VERTICAL_GAP

  if (branchId === "true") {
    x = anchor.x - BRANCH_HORIZONTAL_OFFSET
  } else if (branchId === "false") {
    x = anchor.x + BRANCH_HORIZONTAL_OFFSET
  }

  return { x, y }
}

/**
 * Config keys a step must have before it can actually run. Triggers carry their
 * own defaults, so they never report an incomplete setup.
 */
export const REQUIRED_CONFIG_KEYS: Record<WorkflowTone, readonly string[]> = {
  trigger: [],
  action: ["object_slug"],
  condition: ["field"],
  ai: ["prompt"],
  channel: ["channel", "message"],
}

function hasValue(value: unknown): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === "string") return value.trim().length > 0
  return true
}

export function getMissingConfigKeys(
  tone: WorkflowTone,
  config?: Record<string, unknown>
): string[] {
  return REQUIRED_CONFIG_KEYS[tone].filter((key) => !hasValue(config?.[key]))
}

export function isNodeSetupComplete(
  tone: WorkflowTone,
  config?: Record<string, unknown>
): boolean {
  return getMissingConfigKeys(tone, config).length === 0
}

const CHANNEL_PROVIDER_LABELS: Record<string, string> = {
  telegram: "Telegram",
  whatsapp: "WhatsApp",
  slack: "Slack",
  email: "Email",
  sms: "SMS",
}

const DEFAULT_PROVIDER_LABELS: Record<WorkflowTone, string> = {
  trigger: "Triggers",
  action: "Records",
  condition: "Logic",
  ai: "AI",
  channel: "Messaging",
}

/**
 * The footer chip: a configured channel wins, then the node's own category,
 * then the tone default. Nothing here is persisted — it is derived on render.
 */
export function getProviderLabel(
  tone: WorkflowTone,
  config?: Record<string, unknown>,
  category?: string
): string {
  if (tone === "channel") {
    const channel = config?.channel
    if (typeof channel === "string" && channel.trim().length > 0) {
      const key = channel.trim().toLowerCase()
      return CHANNEL_PROVIDER_LABELS[key] ?? channel.trim()
    }
  }

  if (category && category.trim().length > 0) {
    return category.trim()
  }

  return DEFAULT_PROVIDER_LABELS[tone]
}

/** Triggers start the flow with a solid frame; downstream steps are dashed. */
export function getFrameBorderStyle(tone: WorkflowTone): "solid" | "dashed" {
  return tone === "trigger" ? "solid" : "dashed"
}

export function getFrameBorderClassName(tone: WorkflowTone): string {
  return getFrameBorderStyle(tone) === "solid"
    ? "border-solid"
    : "border-dashed"
}

/**
 * Re-attaches the transient render callbacks to nodes coming back from the API.
 * Everything else — crucially `position` — is carried through untouched, so
 * saved and manually dragged layouts are never rearranged on load.
 */
export function attachNodeCallbacks<
  TNode extends { data: object; position: WorkflowPosition },
  TCallbacks extends object,
>(
  nodes: readonly TNode[],
  callbacks: TCallbacks
): (Omit<TNode, "data"> & { data: TNode["data"] & TCallbacks })[] {
  return nodes.map((node) => ({
    ...node,
    data: { ...node.data, ...callbacks },
  }))
}
