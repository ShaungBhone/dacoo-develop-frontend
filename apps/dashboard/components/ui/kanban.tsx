"use client"

import type { CSSProperties, ReactNode } from "react"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import type {
  DragEndEvent,
  DragStartEvent,
  Modifiers,
  UniqueIdentifier,
} from "@dnd-kit/core"
import {
  defaultDropAnimationSideEffects,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MeasuringStrategy,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  arrayMove,
  defaultAnimateLayoutChanges,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { createPortal } from "react-dom"

import { cn } from "@/lib/utils"

type KanbanContextValue = {
  columns: Record<string, unknown[]>
  setColumns: (columns: Record<string, unknown[]>) => void
  getItemId: (item: unknown) => string
  columnIds: string[]
  activeId: UniqueIdentifier | null
  isColumn: (id: UniqueIdentifier) => boolean
  findContainer: (id: UniqueIdentifier) => string | undefined
  modifiers?: Modifiers
}

const KanbanContext = createContext<KanbanContextValue | null>(null)
const ColumnHandleContext = createContext<ReturnType<
  typeof useSortable
> | null>(null)
const ItemHandleContext = createContext<ReturnType<typeof useSortable> | null>(
  null
)
const OverlayContext = createContext(false)

const measuring = { droppable: { strategy: MeasuringStrategy.Always } }
const dropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: { active: { opacity: "0.4" } },
  }),
}

function useKanbanContext() {
  const context = useContext(KanbanContext)
  if (!context) throw new Error("Kanban components must be used within Kanban.")
  return context
}

export interface KanbanMoveEvent {
  event: DragEndEvent
  activeContainer: string
  activeIndex: number
  overContainer: string
  overIndex: number
}

export interface KanbanRootProps<T> extends Omit<
  useRender.ComponentProps<"div">,
  "children"
> {
  value: Record<string, T[]>
  onValueChange: (value: Record<string, T[]>) => void
  getItemValue: (item: T) => string
  children: ReactNode
  onMove?: (event: KanbanMoveEvent) => void
  modifiers?: Modifiers
}

function Kanban<T>({
  value,
  onValueChange,
  getItemValue,
  children,
  className,
  render,
  onMove,
  modifiers,
  ...props
}: KanbanRootProps<T>) {
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null)
  const columnsRef = useRef(value)
  const getItemValueRef = useRef(getItemValue)
  const onMoveRef = useRef(onMove)
  useEffect(() => {
    columnsRef.current = value
    getItemValueRef.current = getItemValue
    onMoveRef.current = onMove
  }, [getItemValue, onMove, value])
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 10 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )
  const columnIds = useMemo(() => Object.keys(value), [value])
  const isColumn = useCallback(
    (id: UniqueIdentifier) => columnIds.includes(String(id)),
    [columnIds]
  )
  const findContainer = useCallback(
    (id: UniqueIdentifier) => {
      if (isColumn(id)) return String(id)
      return Object.keys(columnsRef.current).find((key) =>
        columnsRef.current[key].some(
          (item) => getItemValueRef.current(item) === id
        )
      )
    },
    [isColumn]
  )
  const moveItems = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over) return
      const columns = columnsRef.current
      if (isColumn(active.id) && isColumn(over.id)) {
        const order = arrayMove(
          Object.keys(columns),
          Object.keys(columns).indexOf(String(active.id)),
          Object.keys(columns).indexOf(String(over.id))
        )
        onValueChange(
          Object.fromEntries(order.map((key) => [key, columns[key]])) as Record<
            string,
            T[]
          >
        )
        return
      }
      if (isColumn(active.id)) return
      const activeContainer = findContainer(active.id)
      const overContainer = findContainer(over.id)
      if (!activeContainer || !overContainer) return
      const activeItems = columns[activeContainer]
      const activeIndex = activeItems.findIndex(
        (item) => getItemValueRef.current(item) === active.id
      )
      const overIndex = isColumn(over.id)
        ? columns[overContainer].length
        : columns[overContainer].findIndex(
            (item) => getItemValueRef.current(item) === over.id
          )
      if (onMoveRef.current) {
        onMoveRef.current({
          event,
          activeContainer,
          activeIndex,
          overContainer,
          overIndex,
        })
        return
      }
      if (activeContainer === overContainer) {
        if (activeIndex !== overIndex)
          onValueChange({
            ...columns,
            [activeContainer]: arrayMove(activeItems, activeIndex, overIndex),
          } as Record<string, T[]>)
        return
      }
      const nextActive = [...activeItems]
      const [item] = nextActive.splice(activeIndex, 1)
      const nextOver = [...columns[overContainer]]
      nextOver.splice(overIndex, 0, item)
      onValueChange({
        ...columns,
        [activeContainer]: nextActive,
        [overContainer]: nextOver,
      } as Record<string, T[]>)
    },
    [findContainer, isColumn, onValueChange]
  )
  const context = useMemo<KanbanContextValue>(
    () => ({
      columns: value as Record<string, unknown[]>,
      setColumns: onValueChange as (columns: Record<string, unknown[]>) => void,
      getItemId: getItemValue as (item: unknown) => string,
      columnIds,
      activeId,
      isColumn,
      findContainer,
      modifiers,
    }),
    [
      activeId,
      columnIds,
      findContainer,
      getItemValue,
      isColumn,
      modifiers,
      onValueChange,
      value,
    ]
  )

  return (
    <KanbanContext.Provider value={context}>
      <DndContext
        sensors={sensors}
        modifiers={modifiers}
        measuring={measuring}
        onDragStart={(event: DragStartEvent) => setActiveId(event.active.id)}
        onDragCancel={() => setActiveId(null)}
        onDragEnd={(event) => {
          setActiveId(null)
          moveItems(event)
        }}
      >
        {useRender({
          defaultTagName: "div",
          render,
          props: mergeProps<"div">(
            {
              "data-slot": "kanban",
              "data-dragging": activeId !== null,
              className: cn(activeId && "cursor-grabbing!", className),
              children,
            } as never,
            props
          ),
        })}
      </DndContext>
    </KanbanContext.Provider>
  )
}

export type KanbanBoardProps = useRender.ComponentProps<"div">
function KanbanBoard({ className, render, ...props }: KanbanBoardProps) {
  const { columnIds } = useKanbanContext()
  return (
    <SortableContext items={columnIds} strategy={rectSortingStrategy}>
      {useRender({
        defaultTagName: "div",
        render,
        props: mergeProps<"div">(
          {
            "data-slot": "kanban-board",
            className: cn("grid auto-rows-fr gap-4", className),
            children: props.children,
          } as never,
          props
        ),
      })}
    </SortableContext>
  )
}

export interface KanbanColumnProps extends useRender.ComponentProps<"div"> {
  value: string
  disabled?: boolean
}
function KanbanColumn({
  value,
  className,
  render,
  disabled,
  ...props
}: KanbanColumnProps) {
  const overlay = useContext(OverlayContext)
  const sortable = useSortable({
    id: value,
    disabled: disabled || overlay,
    animateLayoutChanges: (args) =>
      defaultAnimateLayoutChanges({ ...args, wasDragging: true }),
  })
  const style: CSSProperties = {
    transition: sortable.transition,
    transform: CSS.Transform.toString(sortable.transform),
  }
  return (
    <ColumnHandleContext.Provider value={sortable}>
      {useRender({
        defaultTagName: "div",
        render,
        props: mergeProps<"div">(
          {
            "data-slot": "kanban-column",
            "data-value": value,
            "data-dragging": overlay || sortable.isDragging,
            ref: overlay ? undefined : sortable.setNodeRef,
            style: overlay ? undefined : style,
            className: cn(
              "group/kanban-column flex flex-col",
              sortable.isDragging && "opacity-50",
              disabled && "opacity-50",
              className
            ),
            children: props.children,
          } as never,
          props
        ),
      })}
    </ColumnHandleContext.Provider>
  )
}

export interface KanbanColumnHandleProps extends useRender.ComponentProps<"div"> {
  cursor?: boolean
}
function KanbanColumnHandle({
  className,
  render,
  cursor = true,
  ...props
}: KanbanColumnHandleProps) {
  const sortable = useContext(ColumnHandleContext)
  return useRender({
    defaultTagName: "div",
    render,
    props: mergeProps<"div">(
      {
        "data-slot": "kanban-column-handle",
        suppressHydrationWarning: true,
        ...sortable?.attributes,
        ...sortable?.listeners,
        className: cn(
          "opacity-0 transition-opacity group-hover/kanban-column:opacity-100",
          cursor && "cursor-grab!",
          className
        ),
        children: props.children,
      } as never,
      props
    ),
  })
}

export interface KanbanItemProps extends useRender.ComponentProps<"div"> {
  value: string
  disabled?: boolean
}
function KanbanItem({
  value,
  className,
  render,
  disabled,
  ...props
}: KanbanItemProps) {
  const overlay = useContext(OverlayContext)
  const sortable = useSortable({
    id: value,
    disabled: disabled || overlay,
    animateLayoutChanges: (args) =>
      defaultAnimateLayoutChanges({ ...args, wasDragging: true }),
  })
  const style: CSSProperties = {
    transition: sortable.transition,
    transform: CSS.Transform.toString(sortable.transform),
  }
  return (
    <ItemHandleContext.Provider value={sortable}>
      {useRender({
        defaultTagName: "div",
        render,
        props: mergeProps<"div">(
          {
            "data-slot": "kanban-item",
            "data-value": value,
            "data-dragging": overlay || sortable.isDragging,
            suppressHydrationWarning: true,
            ref: overlay ? undefined : sortable.setNodeRef,
            style: overlay ? undefined : style,
            ...sortable.attributes,
            className: cn(
              sortable.isDragging && "opacity-50",
              disabled && "opacity-50",
              className
            ),
            children: props.children,
          } as never,
          props
        ),
      })}
    </ItemHandleContext.Provider>
  )
}

export interface KanbanItemHandleProps extends useRender.ComponentProps<"div"> {
  cursor?: boolean
}
function KanbanItemHandle({
  className,
  render,
  cursor = true,
  ...props
}: KanbanItemHandleProps) {
  const sortable = useContext(ItemHandleContext)
  return useRender({
    defaultTagName: "div",
    render,
    props: mergeProps<"div">(
      {
        "data-slot": "kanban-item-handle",
        ...sortable?.listeners,
        className: cn(cursor && "cursor-grab!", className),
        children: props.children,
      } as never,
      props
    ),
  })
}

export interface KanbanColumnContentProps extends useRender.ComponentProps<"div"> {
  value: string
}
function KanbanColumnContent({
  value,
  className,
  render,
  ...props
}: KanbanColumnContentProps) {
  const { columns, getItemId } = useKanbanContext()
  const itemIds = columns[value].map(getItemId)
  return (
    <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
      {useRender({
        defaultTagName: "div",
        render,
        props: mergeProps<"div">(
          {
            "data-slot": "kanban-column-content",
            className: cn("flex flex-col gap-2", className),
            children: props.children,
          } as never,
          props
        ),
      })}
    </SortableContext>
  )
}

export interface KanbanOverlayProps extends Omit<
  React.ComponentProps<typeof DragOverlay>,
  "children"
> {
  children?:
    | ReactNode
    | ((params: {
        value: UniqueIdentifier
        variant: "column" | "item"
      }) => ReactNode)
}
function KanbanOverlay({ children, className, ...props }: KanbanOverlayProps) {
  const { activeId, isColumn, modifiers } = useKanbanContext()
  if (typeof document === "undefined") return null
  const content =
    activeId && children
      ? typeof children === "function"
        ? children({
            value: activeId,
            variant: isColumn(activeId) ? "column" : "item",
          })
        : children
      : null
  return createPortal(
    <DragOverlay
      dropAnimation={dropAnimation}
      modifiers={modifiers}
      className={cn(activeId && "cursor-grabbing", className)}
      {...props}
    >
      <OverlayContext.Provider value>{content}</OverlayContext.Provider>
    </DragOverlay>,
    document.body
  )
}

export {
  Kanban,
  KanbanBoard,
  KanbanColumn,
  KanbanColumnContent,
  KanbanColumnHandle,
  KanbanItem,
  KanbanItemHandle,
  KanbanOverlay,
}
