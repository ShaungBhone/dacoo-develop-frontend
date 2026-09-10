export type WorkflowTone = "trigger" | "action" | "condition" | "ai" | "channel"

export type WorkflowBranchId = "true" | "false"

export type WorkflowPosition = { x: number; y: number }

/** Vertical clearance between cards in the top-to-bottom workflow. */
export const NODE_VERTICAL_GAP = 180

/** True/False branches fan horizontally while continuing downward. */
export const BRANCH_HORIZONTAL_OFFSET = 190

/** Where the first node lands when there is no parent to anchor against. */
export const ROOT_NODE_POSITION: WorkflowPosition = { x: 250, y: 100 }

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
 * Detects if a saved workflow's nodes were arranged horizontally (left-to-right)
 * rather than vertically (top-to-bottom).
 */
export function isLegacyHorizontalLayout<
  TNode extends { id: string; position: WorkflowPosition },
  TEdge extends { source: string; target: string },
>(nodes: readonly TNode[], edges: readonly TEdge[]): boolean {
  if (nodes.length < 2 || edges.length === 0) return false

  const nodeMap = new Map(nodes.map((n) => [n.id, n]))
  let horizontalEdgeCount = 0
  let relevantEdgeCount = 0

  for (const edge of edges) {
    const src = nodeMap.get(edge.source)
    const tgt = nodeMap.get(edge.target)
    if (!src || !tgt) continue

    relevantEdgeCount++
    const dx = tgt.position.x - src.position.x
    const dy = Math.abs(tgt.position.y - src.position.y)

    // In horizontal layouts, target is placed to the right (dx > 120) with minimal vertical delta (dy < 120)
    if (dx > 120 && dy < 120) {
      horizontalEdgeCount++
    }
  }

  return relevantEdgeCount > 0 && horizontalEdgeCount / relevantEdgeCount >= 0.5
}

/**
 * Automatically arranges any set of workflow nodes and edges into a clean
 * top-to-bottom vertical layout, handling branches and multiple roots.
 */
export function layoutNodesTopToBottom<
  TNode extends { id: string; position: WorkflowPosition; data?: { tone?: string } },
  TEdge extends { source: string; target: string; sourceHandle?: string | null },
>(
  nodes: readonly TNode[],
  edges: readonly TEdge[] = []
): TNode[] {
  if (nodes.length === 0) return []
  if (nodes.length === 1) {
    return [{ ...nodes[0], position: ROOT_NODE_POSITION }]
  }

  const nodeMap = new Map(nodes.map((n) => [n.id, n]))
  const outgoing = new Map<string, { target: string; sourceHandle?: string | null }[]>()
  const incoming = new Map<string, { source: string; sourceHandle?: string | null }[]>()

  for (const node of nodes) {
    outgoing.set(node.id, [])
    incoming.set(node.id, [])
  }

  for (const edge of edges) {
    if (nodeMap.has(edge.source) && nodeMap.has(edge.target)) {
      outgoing.get(edge.source)!.push({ target: edge.target, sourceHandle: edge.sourceHandle })
      incoming.get(edge.target)!.push({ source: edge.source, sourceHandle: edge.sourceHandle })
    }
  }

  // Find root nodes (in-degree === 0), prioritizing triggers
  let roots = nodes.filter((n) => (incoming.get(n.id)?.length ?? 0) === 0)
  if (roots.length === 0) {
    roots = [nodes[0]]
  }
  roots.sort((a, b) => {
    if (a.data?.tone === "trigger" && b.data?.tone !== "trigger") return -1
    if (b.data?.tone === "trigger" && a.data?.tone !== "trigger") return 1
    return 0
  })

  // Compute topological depths
  const depthMap = new Map<string, number>()
  for (const root of roots) {
    depthMap.set(root.id, 0)
  }

  const queue = [...roots.map((r) => r.id)]
  const visitedEdge = new Set<string>()

  while (queue.length > 0) {
    const currentId = queue.shift()!
    const currentDepth = depthMap.get(currentId) ?? 0
    const children = outgoing.get(currentId) ?? []

    for (const child of children) {
      const existingDepth = depthMap.get(child.target)
      const newDepth = currentDepth + 1
      if (existingDepth === undefined || newDepth > existingDepth) {
        depthMap.set(child.target, newDepth)
      }
      const edgeKey = `${currentId}->${child.target}`
      if (!visitedEdge.has(edgeKey)) {
        visitedEdge.add(edgeKey)
        queue.push(child.target)
      }
    }
  }

  // Handle any disconnected nodes not reachable from roots
  let maxDepth = 0
  for (const d of depthMap.values()) {
    if (d > maxDepth) maxDepth = d
  }
  for (const node of nodes) {
    if (!depthMap.has(node.id)) {
      maxDepth++
      depthMap.set(node.id, maxDepth)
    }
  }

  // Group nodes by depth
  const layers = new Map<number, string[]>()
  for (const [nodeId, depth] of depthMap.entries()) {
    if (!layers.has(depth)) layers.set(depth, [])
    layers.get(depth)!.push(nodeId)
  }

  const sortedDepths = Array.from(layers.keys()).sort((a, b) => a - b)
  const positionMap = new Map<string, WorkflowPosition>()

  for (const depth of sortedDepths) {
    const layerNodeIds = layers.get(depth)!
    const y = ROOT_NODE_POSITION.y + depth * NODE_VERTICAL_GAP

    if (depth === 0) {
      // Roots layout
      const count = layerNodeIds.length
      layerNodeIds.forEach((id, index) => {
        const xOffset = (index - (count - 1) / 2) * 360
        positionMap.set(id, {
          x: Math.round(ROOT_NODE_POSITION.x + xOffset),
          y,
        })
      })
    } else {
      // Downstream nodes layout
      const parentGroups = new Map<string, string[]>()
      const unparented: string[] = []

      for (const id of layerNodeIds) {
        const inc = incoming.get(id) ?? []
        if (inc.length > 0) {
          const parentId = inc[0].source
          if (!parentGroups.has(parentId)) parentGroups.set(parentId, [])
          parentGroups.get(parentId)!.push(id)
        } else {
          unparented.push(id)
        }
      }

      for (const [parentId, childIds] of parentGroups.entries()) {
        const parentPos = positionMap.get(parentId) ?? ROOT_NODE_POSITION

        if (childIds.length === 1) {
          const childId = childIds[0]
          const edgeInfo = incoming.get(childId)?.find((e) => e.source === parentId)
          if (edgeInfo?.sourceHandle === "true") {
            positionMap.set(childId, {
              x: parentPos.x - BRANCH_HORIZONTAL_OFFSET,
              y,
            })
          } else if (edgeInfo?.sourceHandle === "false") {
            positionMap.set(childId, {
              x: parentPos.x + BRANCH_HORIZONTAL_OFFSET,
              y,
            })
          } else {
            positionMap.set(childId, { x: parentPos.x, y })
          }
        } else {
          // Multiple children from same parent (e.g., condition True and False)
          const trueChild = childIds.find(
            (id) => incoming.get(id)?.some((e) => e.source === parentId && e.sourceHandle === "true")
          )
          const falseChild = childIds.find(
            (id) => incoming.get(id)?.some((e) => e.source === parentId && e.sourceHandle === "false")
          )

          if (trueChild && falseChild && childIds.length === 2) {
            positionMap.set(trueChild, {
              x: parentPos.x - BRANCH_HORIZONTAL_OFFSET,
              y,
            })
            positionMap.set(falseChild, {
              x: parentPos.x + BRANCH_HORIZONTAL_OFFSET,
              y,
            })
          } else {
            const count = childIds.length
            childIds.forEach((id, index) => {
              const xOffset = (index - (count - 1) / 2) * 360
              positionMap.set(id, {
                x: Math.round(parentPos.x + xOffset),
                y,
              })
            })
          }
        }
      }

      // Any unparented nodes in this layer
      if (unparented.length > 0) {
        unparented.forEach((id, index) => {
          positionMap.set(id, {
            x: ROOT_NODE_POSITION.x + (index + 1) * 360,
            y,
          })
        })
      }
    }
  }

  return nodes.map((node) => ({
    ...node,
    position: positionMap.get(node.id) ?? node.position,
  }))
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
