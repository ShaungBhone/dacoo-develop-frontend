"use client"

import * as React from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import { cn } from "@/lib/utils"

const SortableItemContext = React.createContext<ReturnType<
  typeof useSortable
> | null>(null)

interface SortableProps<T> {
  value: T[]
  onValueChange: (value: T[]) => void
  getItemValue: (item: T) => string
  strategy?: "vertical" | "rect"
  children: React.ReactNode
  className?: string
}

function Sortable<T>({
  value,
  onValueChange,
  getItemValue,
  strategy = "vertical",
  children,
  className,
}: SortableProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const items = React.useMemo(
    () => value.map(getItemValue),
    [value, getItemValue]
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = items.indexOf(String(active.id))
      const newIndex = items.indexOf(String(over.id))
      if (oldIndex !== -1 && newIndex !== -1) {
        onValueChange(arrayMove(value, oldIndex, newIndex))
      }
    }
  }

  const sortingStrategy =
    strategy === "rect" ? rectSortingStrategy : verticalListSortingStrategy

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items} strategy={sortingStrategy}>
        <div className={className}>{children}</div>
      </SortableContext>
    </DndContext>
  )
}

interface SortableItemProps extends React.ComponentProps<"div"> {
  value: string
}

function SortableItem({
  value,
  className,
  children,
  ...props
}: SortableItemProps) {
  const sortable = useSortable({ id: value })
  const { setNodeRef, transform, transition, isDragging } = sortable

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  }

  return (
    <SortableItemContext.Provider value={sortable}>
      <div
        ref={setNodeRef}
        style={style}
        className={cn(isDragging && "z-50 shadow-md", className)}
        {...props}
      >
        {children}
      </div>
    </SortableItemContext.Provider>
  )
}

function SortableItemHandle({
  className,
  children,
  ...props
}: React.ComponentProps<"button">) {
  const sortable = React.useContext(SortableItemContext)
  if (!sortable) return null

  const { attributes, listeners } = sortable

  return (
    <button
      type="button"
      className={cn(
        "cursor-grab touch-none select-none active:cursor-grabbing outline-none",
        className
      )}
      {...attributes}
      {...listeners}
      {...props}
    >
      {children}
    </button>
  )
}

export { Sortable, SortableItem, SortableItemHandle }
