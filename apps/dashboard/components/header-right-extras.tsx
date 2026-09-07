"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"

import { BookOpenIcon } from "@/components/ui/icons"
import { Button } from "@/components/ui/button"
import { RightSidebarTrigger } from "@/components/right-sidebar"

export function HeaderRightExtras() {
  const pathname = usePathname()

  return (
    <div className="ml-auto flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        render={<Link href="/docs/access" />}
        className="gap-1.5"
      >
        <BookOpenIcon />
        <span>Documentation</span>
      </Button>
      {pathname === "/dashboard" && <RightSidebarTrigger />}
    </div>
  )
}
