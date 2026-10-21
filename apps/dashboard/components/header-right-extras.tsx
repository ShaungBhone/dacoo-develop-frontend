"use client"

import * as React from "react"
import Link from "next/link"
import { BellIcon } from "lucide-react"
import { useActiveOrganization } from "@/hooks/use-active-organization"
import { Button } from "@/components/ui/button"
import { fetchHome } from "@/components/home/api"

export function HeaderRightExtras() {
  const organization = useActiveOrganization()
  const [unread, setUnread] = React.useState<{
    organizationId: number | string
    count: number
  } | null>(null)
  React.useEffect(() => {
    if (!organization) return
    let current = true
    const refresh = () => {
      if (document.hidden) return
      void fetchHome(organization.id)
        .then((data) => {
          if (current)
            setUnread({
              organizationId: organization.id,
              count: data.unread_count,
            })
        })
        .catch(() => {})
    }
    const update = (event: Event) => {
      const detail = (
        event as CustomEvent<{ organizationId: number | string; count: number }>
      ).detail
      if (detail.organizationId === organization.id) setUnread(detail)
    }
    refresh()
    const timer = window.setInterval(refresh, 30000)
    window.addEventListener("home-unread", update)
    return () => {
      current = false
      window.clearInterval(timer)
      window.removeEventListener("home-unread", update)
    }
  }, [organization])
  const count =
    unread?.organizationId === organization?.id ? (unread?.count ?? 0) : 0
  return (
    <div className="ml-auto">
      <Button
        variant="ghost"
        size="sm"
        nativeButton={false}
        render={<Link href="/home" />}
        aria-label={`${count} Home alerts`}
      >
        <BellIcon className="size-4" />
        {count > 0 && (
          <span className="rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">
            {count}
          </span>
        )}
      </Button>
    </div>
  )
}
