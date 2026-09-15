"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { ResizableHandle, ResizablePanel } from "@/components/ui/resizable"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

type ResponsiveSidePanelProps = {
  children: React.ReactNode
  className?: string
  defaultSize?: string
  description: string
  id: string
  isMobile: boolean
  maxSize?: string
  minSize?: string
  mobileClassName?: string
  mobileHeaderClassName?: string
  onOpenChange: (open: boolean) => void
  open: boolean
  showMobileCloseButton?: boolean
  title: string
}

function isSheetOverlay(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  return (
    target.getAttribute("data-slot") === "sheet-overlay" ||
    target.classList.contains("bg-black/30")
  )
}

export function ResponsiveSidePanel({
  children,
  className,
  defaultSize = "30%",
  description,
  id,
  isMobile,
  maxSize = "40%",
  minSize = "22%",
  mobileClassName,
  mobileHeaderClassName,
  onOpenChange,
  open,
  showMobileCloseButton = true,
  title,
}: ResponsiveSidePanelProps) {
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className={cn("w-full sm:max-w-md", mobileClassName)}
          showCloseButton={showMobileCloseButton}
          onPointerDownOutside={(event) => {
            if (!isSheetOverlay(event.target)) {
              event.preventDefault()
            }
          }}
          onInteractOutside={(event) => {
            if (!isSheetOverlay(event.target)) {
              event.preventDefault()
            }
          }}
        >
          <SheetHeader className={mobileHeaderClassName}>
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription>{description}</SheetDescription>
          </SheetHeader>
          {children}
        </SheetContent>
      </Sheet>
    )
  }

  if (!open) {
    return null
  }

  return (
    <>
      <ResizableHandle withHandle />
      <ResizablePanel
        id={id}
        defaultSize={defaultSize}
        minSize={minSize}
        maxSize={maxSize}
        className={cn("min-h-0 min-w-72", className)}
      >
        {children}
      </ResizablePanel>
    </>
  )
}
