"use client"

import * as React from "react"
import { PanelRightIcon } from "@/components/ui/icons"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarSeparator,
  SIDEBAR_WIDTH_MOBILE,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { ResizablePanel } from "@/components/ui/resizable"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { useRightSidebar } from "@/components/right-sidebar-provider"
import { ChunksList } from "@/components/rag/chunks-list"
import { ConfigRail } from "@/components/rag/config-rail"
import { KnowledgeBase } from "@/components/rag/knowledge-base"
import { useRag } from "@/components/rag/rag-context"

export function RightSidebarTrigger({
  className,
  onClick,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { toggle } = useRightSidebar()
  return (
    <Button
      data-slot="right-sidebar-trigger"
      variant="ghost"
      size="icon-sm"
      className={className}
      onClick={(event) => {
        onClick?.(event)
        toggle()
      }}
      {...props}
    >
      <PanelRightIcon />
      <span className="sr-only">Toggle Right Sidebar</span>
    </Button>
  )
}

function RightSidebarBody() {
  const { runResult } = useRag()

  return (
    <>
      <SidebarContent className="gap-5 px-3 py-4">
        <ConfigRail />
        {runResult && (
          <>
            <SidebarSeparator className="mx-0" />
            <ChunksList chunks={runResult.chunks} />
          </>
        )}
        <SidebarSeparator className="mx-0" />
        <KnowledgeBase />
      </SidebarContent>
      <SidebarFooter />
    </>
  )
}

export function RightSidebar() {
  const {
    panelRef,
    isMobile,
    openMobile,
    setOpenMobile,
    _onPanelCollapse,
    _onPanelExpand,
  } = useRightSidebar()

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetContent
          side="right"
          showCloseButton={false}
          className="w-(--sidebar-width) bg-sidebar p-0 text-sidebar-foreground"
          style={
            {
              "--sidebar-width": SIDEBAR_WIDTH_MOBILE,
            } as React.CSSProperties
          }
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Right Sidebar</SheetTitle>
            <SheetDescription>
              Displays the mobile right sidebar.
            </SheetDescription>
          </SheetHeader>
          <div className="flex h-full w-full flex-col">
            <RightSidebarBody />
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <ResizablePanel
      panelRef={panelRef}
      id="right-sidebar"
      defaultSize="25%"
      minSize="15%"
      maxSize="45%"
      collapsible
      collapsedSize="0%"
      onResize={(size) => {
        if (size.asPercentage <= 0) _onPanelCollapse()
        else _onPanelExpand()
      }}
      className="min-w-0"
      style={
        {
          "--sidebar-width": "100%",
        } as React.CSSProperties
      }
    >
      <Sidebar side="right" collapsible="none" className="h-full">
        <RightSidebarBody />
      </Sidebar>
    </ResizablePanel>
  )
}
