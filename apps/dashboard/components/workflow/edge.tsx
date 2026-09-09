"use client"

import type { EdgeProps, InternalNode, Node } from "@xyflow/react"
import {
  BaseEdge,
  getBezierPath,
  getSimpleBezierPath,
  Position,
  useInternalNode,
} from "@xyflow/react"

const Temporary = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
}: EdgeProps) => {
  const [edgePath] = getSimpleBezierPath({
    sourcePosition,
    sourceX,
    sourceY,
    targetPosition,
    targetX,
    targetY,
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
  const sourcePos = Position.Bottom
  const [sx, sy] = getHandleCoordsByPosition(source, sourcePos, sourceHandleId)
  const targetPos = Position.Top
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

  const [edgePath] = getBezierPath({
    sourcePosition: sourcePos,
    sourceX: sx,
    sourceY: sy,
    targetPosition: targetPos,
    targetX: tx,
    targetY: ty,
  })

  return (
    <>
      <BaseEdge
        id={id}
        markerEnd={markerEnd}
        path={edgePath}
        style={{
          stroke: "#22c55e",
          strokeWidth: 1.5,
          ...style,
        }}
      />
      <circle fill="#22c55e" r="3.5">
        <animateMotion dur="2.5s" path={edgePath} repeatCount="indefinite" />
      </circle>
    </>
  )
}

export const Edge = {
  Animated,
  Temporary,
}
