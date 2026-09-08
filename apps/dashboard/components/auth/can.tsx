"use client"

import React, { ReactNode } from "react"
import { useOrganization } from "@/contexts/organization-context"

type CanProps = {
  /** A single permission key to check */
  permission?: string
  /** An array of permission keys to check */
  permissions?: string[]
  /** When checking an array of permissions, require all or at least one (defaults to 'all') */
  match?: "all" | "any"
  /** Content to display when authorized */
  children: ReactNode
  /** Optional fallback content when not authorized */
  fallback?: ReactNode
}

/**
 * Conditionally render UI elements based on the current user's permissions
 * within the active organization.
 */
export function Can({
  permission,
  permissions,
  match = "all",
  children,
  fallback = null,
}: CanProps) {
  const { can, canAny, canAll } = useOrganization()

  let isAllowed = false

  if (permission) {
    isAllowed = can(permission)
  } else if (permissions && permissions.length > 0) {
    isAllowed = match === "any" ? canAny(permissions) : canAll(permissions)
  } else {
    isAllowed = true
  }

  if (!isAllowed) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
