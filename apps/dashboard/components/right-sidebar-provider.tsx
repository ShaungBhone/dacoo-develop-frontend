"use client"

import * as React from "react"
import type { PanelImperativeHandle } from "react-resizable-panels"

import { useIsMobile } from "@/hooks/use-mobile"

const SHORTCUT_KEY = "j"

type RightSidebarContextValue = {
  panelRef: React.RefObject<PanelImperativeHandle | null>
  open: boolean
  setOpen: (open: boolean) => void
  toggle: () => void
  isMobile: boolean
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  /** Internal: bound by <RightSidebar> to mirror panel collapse state into `open`. */
  _onPanelCollapse: () => void
  _onPanelExpand: () => void
}

const RightSidebarContext =
  React.createContext<RightSidebarContextValue | null>(null)

export function useRightSidebar() {
  const ctx = React.useContext(RightSidebarContext)
  if (!ctx) {
    throw new Error(
      "useRightSidebar must be used within a RightSidebarProvider."
    )
  }
  return ctx
}

export function RightSidebarProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const panelRef = React.useRef<PanelImperativeHandle | null>(null)
  const [open, setOpenState] = React.useState(true)
  const isMobile = useIsMobile()
  const [openMobile, setOpenMobile] = React.useState(false)

  const setOpen = React.useCallback(
    (value: boolean) => {
      if (isMobile) {
        setOpenMobile(value)
        return
      }
      const panel = panelRef.current
      if (!panel) {
        setOpenState(value)
        return
      }
      if (value) panel.expand()
      else panel.collapse()
    },
    [isMobile]
  )

  const toggle = React.useCallback(() => {
    if (isMobile) {
      setOpenMobile((prev) => !prev)
      return
    }
    const panel = panelRef.current
    if (!panel) {
      setOpenState((prev) => !prev)
      return
    }
    if (panel.isCollapsed()) panel.expand()
    else panel.collapse()
  }, [isMobile])

  const _onPanelCollapse = React.useCallback(() => setOpenState(false), [])
  const _onPanelExpand = React.useCallback(() => setOpenState(true), [])

  React.useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (
        event.key?.toLowerCase() === SHORTCUT_KEY &&
        (event.metaKey || event.ctrlKey)
      ) {
        event.preventDefault()
        toggle()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [toggle])

  const value = React.useMemo<RightSidebarContextValue>(
    () => ({
      panelRef,
      open,
      setOpen,
      toggle,
      isMobile,
      openMobile,
      setOpenMobile,
      _onPanelCollapse,
      _onPanelExpand,
    }),
    [
      open,
      setOpen,
      toggle,
      isMobile,
      openMobile,
      _onPanelCollapse,
      _onPanelExpand,
    ]
  )

  return (
    <RightSidebarContext.Provider value={value}>
      {children}
    </RightSidebarContext.Provider>
  )
}
