"use client"

import { Button } from "@/components/ui/button"
import type { EdgeProps, InternalNode, Node } from "@xyflow/react"
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  Position,
  useInternalNode,
} from "@xyflow/react"
import { PlusIcon } from "lucide-react"

import type { WorkflowBranchId } from "./workflow-node-utils"

/**
 * Transient edge data — the Add-step callback is injected at render time and
 * stripped before the workflow is persisted.
 */
export type WorkflowEdgeData = {
  onAddStep?: (parentId: string, branchId?: WorkflowBranchId) => void
}

const Temporary = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition = Position.Right,
  targetPosition = Position.Left,
}: EdgeProps) => {
  const [edgePath] = getSmoothStepPath({
    sourcePosition,
    sourceX,
    sourceY,
    targetPosition,
    targetX,
    targetY,
    borderRadius: 16,
  })

  return (
    <BaseEdge
      className="stroke-1 stroke-ring"
      id={id}
      path={edgePath}
      style={{
        strokeDasharray: "5, 5",
      }}
    />
  )
}

const getHandleCoordsByPosition = (
  node: InternalNode<Node>,
  handlePosition: Position,
  handleId?: string | null
) => {
  const handleType =
    handlePosition === Position.Left || handlePosition === Position.Top
      ? "target"
      : "source"
  const handles = node.internals.handleBounds?.[handleType] || []
  let handle = handleId ? handles.find((h) => h.id === handleId) : null

  if (!handle) {
    handle = handles.find((h) => h.position === handlePosition) ?? handles[0]
  }

  if (!handle) {
    return [0, 0] as const
  }

  const offsetX = handle.width / 2
  const offsetY = handle.height / 2

  const x = node.internals.positionAbsolute.x + handle.x + offsetX
  const y = node.internals.positionAbsolute.y + handle.y + offsetY

  return [x, y] as const
}

const getEdgeParams = (
  source: InternalNode<Node>,
  target: InternalNode<Node>,
  sourceHandleId?: string | null,
  targetHandleId?: string | null
) => {
  const sourcePos = Position.Right
  const [sx, sy] = getHandleCoordsByPosition(source, sourcePos, sourceHandleId)
  const targetPos = Position.Left
  const [tx, ty] = getHandleCoordsByPosition(target, targetPos, targetHandleId)

  return {
    sourcePos,
    sx,
    sy,
    targetPos,
    tx,
    ty,
  }
}

const Animated = ({
  id,
  source,
  target,
  sourceHandleId,
  targetHandleId,
  markerEnd,
  style,
  data,
}: EdgeProps) => {
  const sourceNode = useInternalNode(source)
  const targetNode = useInternalNode(target)

  if (!sourceNode || !targetNode) {
    return null
  }

  const { sx, sy, tx, ty, sourcePos, targetPos } = getEdgeParams(
    sourceNode,
    targetNode,
    sourceHandleId,
    targetHandleId
  )

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourcePosition: sourcePos,
    sourceX: sx,
    sourceY: sy,
    targetPosition: targetPos,
    targetX: tx,
    targetY: ty,
    borderRadius: 16,
  })

  const onAddStep = (data as WorkflowEdgeData | undefined)?.onAddStep
  const strokeColor =
    style?.stroke && style.stroke !== "#22c55e" ? style.stroke : "var(--border)"

  return (
    <>
      <BaseEdge
        id={id}
        markerEnd={markerEnd}
        path={edgePath}
        style={{
          strokeWidth: 1.5,
          ...style,
          stroke: strokeColor,
        }}
      />
      {onAddStep && (
        <EdgeLabelRenderer>
          <Button
            size="xs"
            variant="outline"
            className="nodrag nopan pointer-events-auto absolute"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
            aria-label="Add step here"
            onClick={(event) => {
              event.stopPropagation()
              onAddStep(
                source,
                (sourceHandleId as WorkflowBranchId | null) ?? undefined
              )
            }}
          >
            <PlusIcon />
          </Button>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

export const Edge = {
  Animated,
  Temporary,
}
