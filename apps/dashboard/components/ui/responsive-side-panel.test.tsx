import { Children, type ReactElement, type ReactNode } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { ResizablePanelGroup } from "@/components/ui/resizable"
import { ResponsiveSidePanel } from "@/components/ui/responsive-side-panel"

const panelProps = {
  description: "Review the current draft.",
  id: "preview-panel",
  isMobile: false,
  onOpenChange: vi.fn(),
  title: "Preview and test",
}

describe("ResponsiveSidePanel", () => {
  it("renders the shared resizable panel and handle when open on desktop", () => {
    const markup = renderToStaticMarkup(
      <ResizablePanelGroup>
        <ResponsiveSidePanel {...panelProps} open>
          <div>Preview content</div>
        </ResponsiveSidePanel>
      </ResizablePanelGroup>
    )

    expect(markup).toContain('data-slot="resizable-handle"')
    expect(markup).toContain('data-slot="resizable-panel"')
    expect(markup).toContain("Preview content")
  })

  it("renders no desktop panel content when closed", () => {
    const markup = renderToStaticMarkup(
      <ResizablePanelGroup>
        <ResponsiveSidePanel {...panelProps} open={false}>
          <div>Preview content</div>
        </ResponsiveSidePanel>
      </ResizablePanelGroup>
    )

    expect(markup).not.toContain('data-slot="resizable-handle"')
    expect(markup).not.toContain("Preview content")
  })

  it("supports accessible full-bleed mobile content without a duplicate close button", () => {
    const sheet = ResponsiveSidePanel({
      ...panelProps,
      isMobile: true,
      open: true,
      mobileClassName: "gap-0 p-0",
      mobileHeaderClassName: "sr-only",
      showMobileCloseButton: false,
      children: <div>Preview content</div>,
    }) as ReactElement<{ children: ReactElement }>
    const sheetContent = sheet.props.children as ReactElement<{
      children: ReactNode
      className: string
      showCloseButton: boolean
    }>
    const [sheetHeader] = Children.toArray(
      sheetContent.props.children
    ) as ReactElement<{
      children: ReactNode
      className: string
    }>[]
    const [sheetTitle, sheetDescription] = Children.toArray(
      sheetHeader.props.children
    ) as ReactElement<{ children: string }>[]

    expect(sheetContent.props.className).toContain("gap-0 p-0")
    expect(sheetContent.props.showCloseButton).toBe(false)
    expect(sheetHeader.props.className).toBe("sr-only")
    expect(sheetTitle.props.children).toBe("Preview and test")
    expect(sheetDescription.props.children).toBe("Review the current draft.")
  })
})
