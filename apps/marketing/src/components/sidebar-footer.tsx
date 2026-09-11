import Link from "next/link"
import { ArrowUpRightIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

export function SidebarFooterContent() {
  return (
    <div className="rounded-xl border border-sidebar-border bg-white p-3">
      <p className="text-sm font-medium">Build with Dacoo</p>
      <p className="mt-1 text-xs leading-5 text-sidebar-foreground/70">
        Turn every customer conversation into a smarter workflow.
      </p>
      <Button
        className="mt-3 w-full justify-between"
        size="sm"
        render={<Link href="/contact" />}
        nativeButton={false}
      >
        Talk to our team
        <ArrowUpRightIcon aria-hidden="true" />
      </Button>
    </div>
  )
}

export function LegalFooterContent() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground sm:justify-between">
      <p>
        © 2026 Dacoo. All rights reserved.
      </p>

      <nav aria-label="Legal and social" className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
        <Link className="rounded-sm hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href="/privacy">
          Privacy
        </Link>
        <span aria-hidden="true">·</span>
        <Link className="rounded-sm hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href="/terms">
          Terms
        </Link>
        <span aria-hidden="true">·</span>
        <Link className="rounded-sm hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href="/cookies">
          Cookies
        </Link>
        <span aria-hidden="true">·</span>
        <Link className="rounded-sm hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href="/security">
          Security
        </Link>
        <span aria-hidden="true">·</span>
        <span
          aria-label="LinkedIn — coming soon"
          className="inline-flex size-3.5 cursor-not-allowed items-center justify-center"
          role="img"
          title="LinkedIn — coming soon"
        >
          <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V8.98h3.42v1.57h.05c.48-.9 1.64-1.85 3.37-1.85 3.61 0 4.27 2.37 4.27 5.46v6.29ZM5.34 7.41a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14Zm1.78 13.04H3.56V8.98h3.56v11.47Z" />
          </svg>
        </span>
      </nav>
    </div>
  )
}
