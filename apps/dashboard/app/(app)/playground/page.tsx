"use client"

import { DashboardConsole } from "@/components/rag/dashboard-console"
import { RagProvider } from "@/components/rag/rag-context"
import { RightSidebar } from "@/components/right-sidebar"
import { useRightSidebar } from "@/components/right-sidebar-provider"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

export default function PlaygroundPage() {
  const { isMobile } = useRightSidebar()

  if (isMobile) {
    return (
      <RagProvider>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <div className="flex scrollbar-thin h-full min-w-0 flex-col gap-4 overflow-auto px-4 pt-4">
            <DashboardConsole />
          </div>
        </div>
        <RightSidebar />
      </RagProvider>
    )
  }

  return (
    <RagProvider>
      <ResizablePanelGroup
        orientation="horizontal"
        className="min-h-0 min-w-0 flex-1 overflow-hidden"
      >
        <ResizablePanel
          id="playground-main"
          defaultSize="75%"
          minSize="40%"
          className="min-w-0"
        >
          <div className="flex scrollbar-thin h-full min-w-0 flex-col gap-4 overflow-auto px-4 pt-4">
            <DashboardConsole />
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <RightSidebar />
      </ResizablePanelGroup>
    </RagProvider>
  )
}
