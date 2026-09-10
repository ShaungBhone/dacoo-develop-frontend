"use client"

import { cn } from "@/lib/utils"
import {
  ControlButton,
  Controls as ControlsPrimitive,
  useReactFlow,
  useStore,
  useStoreApi,
} from "@xyflow/react"
import {
  LockIcon,
  MaximizeIcon,
  MinusIcon,
  PlusIcon,
  UnlockIcon,
} from "lucide-react"
import type { ComponentProps } from "react"

export type ControlsProps = ComponentProps<typeof ControlsPrimitive>

// React Flow's stylesheet forces `fill: currentColor` and a 12px max size onto
// every button svg. Lucide icons are stroke-drawn with fill="none" as a
// presentation attribute, which CSS beats — so they render as solid blobs and
// get clamped below their intended size. Neutralize both, then size the icons
// ourselves so the built-in and custom buttons match.
// The `!` matters: React Flow's selector has the same specificity as the
// compiled arbitrary variant, and its stylesheet is injected after Tailwind's,
// so without importance it wins the tie on source order.
const iconReset =
  "[&_button>svg]:size-4! [&_button>svg]:max-w-none! [&_button>svg]:max-h-none! [&_button>svg]:fill-none! [&_button>svg]:stroke-current"

const selector = (s: {
  transform: [number, number, number]
  minZoom: number
  maxZoom: number
  nodesDraggable: boolean
  nodesConnectable: boolean
  elementsSelectable: boolean
}) => ({
  isInteractive:
    s.nodesDraggable || s.nodesConnectable || s.elementsSelectable,
  minZoomReached: s.transform[2] <= s.minZoom,
  maxZoomReached: s.transform[2] >= s.maxZoom,
})

export const Controls = ({ className, children, ...props }: ControlsProps) => {
  const { zoomIn, zoomOut, fitView } = useReactFlow()
  const store = useStoreApi()
  const { isInteractive, minZoomReached, maxZoomReached } = useStore(selector)

  const toggleInteractivity = () => {
    store.setState({
      nodesDraggable: !isInteractive,
      nodesConnectable: !isInteractive,
      elementsSelectable: !isInteractive,
    })
    props.onInteractiveChange?.(!isInteractive)
  }

  return (
    <ControlsPrimitive
      showZoom={false}
      showFitView={false}
      showInteractive={false}
      className={cn(
        "gap-px overflow-hidden rounded-md border bg-card p-1 shadow-none!",
        "[&>button]:size-7 [&>button]:rounded-md [&>button]:border-none! [&>button]:bg-transparent! [&>button]:text-muted-foreground [&>button]:hover:bg-secondary! [&>button]:hover:text-foreground",
        "[&>button:disabled]:opacity-40",
        iconReset,
        className
      )}
      {...props}
    >
      <ControlButton
        onClick={() => zoomIn()}
        disabled={maxZoomReached}
        title="Zoom in"
        aria-label="Zoom in"
      >
        <PlusIcon />
      </ControlButton>
      <ControlButton
        onClick={() => zoomOut()}
        disabled={minZoomReached}
        title="Zoom out"
        aria-label="Zoom out"
      >
        <MinusIcon />
      </ControlButton>
      <ControlButton
        onClick={() => fitView(props.fitViewOptions)}
        title="Fit view"
        aria-label="Fit view"
      >
        <MaximizeIcon />
      </ControlButton>
      <ControlButton
        onClick={toggleInteractivity}
        title={isInteractive ? "Lock canvas" : "Unlock canvas"}
        aria-label={isInteractive ? "Lock canvas" : "Unlock canvas"}
      >
        {isInteractive ? <UnlockIcon /> : <LockIcon />}
      </ControlButton>
      {children}
    </ControlsPrimitive>
  )
}

export { ControlButton }
