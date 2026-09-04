"use client"

import { usePathname } from "next/navigation"

import { RightSidebarTrigger } from "@/components/right-sidebar"

export function HeaderRightExtras() {
  const pathname = usePathname()

  return (
    <div className="ml-auto flex items-center gap-2">
      {pathname === "/dashboard" && <RightSidebarTrigger />}
    </div>
  )
}
