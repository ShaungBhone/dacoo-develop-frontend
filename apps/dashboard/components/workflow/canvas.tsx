"use client"

import type { Edge, Node, ReactFlowProps } from "@xyflow/react"
import { Background, BackgroundVariant, ReactFlow } from "@xyflow/react"
import type { ReactNode } from "react"

import "@xyflow/react/dist/style.css"

type CanvasProps<
  NodeType extends Node = Node,
  EdgeType extends Edge = Edge,
> = ReactFlowProps<NodeType, EdgeType> & {
  children?: ReactNode
}

const deleteKeyCode = ["Backspace", "Delete"]

export function Canvas<
  NodeType extends Node = Node,
  EdgeType extends Edge = Edge,
>({ children, ...props }: CanvasProps<NodeType, EdgeType>) {
  return (
    <ReactFlow<NodeType, EdgeType>
      deleteKeyCode={deleteKeyCode}
      fitView
      panOnDrag
      selectionOnDrag={false}
      zoomOnDoubleClick={false}
      {...props}
      proOptions={{ hideAttribution: true }}
    >
      <Background
        variant={BackgroundVariant.Dots}
        gap={16}
        size={1.2}
        color="var(--canvas-dot)"
        bgColor="var(--canvas)"
      />
      {children}
    </ReactFlow>
  )
}
