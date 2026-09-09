"use client"

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Handle, Position } from "@xyflow/react"
import type { ComponentProps } from "react"

export type NodeProps = ComponentProps<typeof Card> & {
  handles?: {
    target?: boolean
    source?: boolean
    condition?: boolean
  }
}

export const Node = ({ handles, className, children, ...props }: NodeProps) => (
  <Card
    className={cn(
      "node-container relative size-full h-auto w-sm gap-0 rounded-xl p-0 ring-0 overflow-visible",
      className
    )}
    {...props}
  >
    {handles?.target && <Handle position={Position.Left} type="target" />}
    {handles?.source && !handles?.condition && (
      <Handle position={Position.Right} type="source" />
    )}
    {handles?.condition && (
      <>
        <Handle
          id="true"
          position={Position.Right}
          type="source"
          style={{ top: "35%" }}
          className="top-[35%]"
        />
        <Handle
          id="false"
          position={Position.Right}
          type="source"
          style={{ top: "65%" }}
          className="top-[65%]"
        />
      </>
    )}
    {children}
  </Card>
)

export type NodeHeaderProps = ComponentProps<typeof CardHeader>

export const NodeHeader = ({ className, ...props }: NodeHeaderProps) => (
  <CardHeader
    className={cn("gap-0.5 rounded-t-md border-b bg-secondary p-3!", className)}
    {...props}
  />
)

export const NodeTitle = (props: ComponentProps<typeof CardTitle>) => (
  <CardTitle {...props} />
)

export const NodeDescription = (
  props: ComponentProps<typeof CardDescription>
) => <CardDescription {...props} />

export const NodeAction = (props: ComponentProps<typeof CardAction>) => (
  <CardAction {...props} />
)

export const NodeContent = ({
  className,
  ...props
}: ComponentProps<typeof CardContent>) => (
  <CardContent className={cn("p-3", className)} {...props} />
)

export const NodeFooter = ({
  className,
  ...props
}: ComponentProps<typeof CardFooter>) => (
  <CardFooter
    className={cn("rounded-b-md border-t bg-secondary p-3!", className)}
    {...props}
  />
)
