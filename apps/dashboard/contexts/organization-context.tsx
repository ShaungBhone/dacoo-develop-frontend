"use client"

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react"
import { useAuth, type Organization } from "@/contexts/auth-context"
import { getCookie, setCookie } from "@/lib/cookies"

const ACTIVE_ORG_COOKIE = "active_org_id"

type OrganizationContextType = {
  organizations: Organization[]
  activeOrganization: Organization | null
  activeOrganizationId: number | null
  setActiveOrganizationId: (id: number) => void
  /** Whether the current user owns the active organization. */
  isOwner: boolean
  /** Whether the current user is an admin or owner. */
  isAdmin: boolean
  /** Check if the current user has a specific permission in the active organization. */
  can: (permission: string) => boolean
  /** Check if the current user has any of the specified permissions. */
  canAny: (permissions: string[]) => boolean
  /** Check if the current user has all of the specified permissions. */
  canAll: (permissions: string[]) => boolean
  /** Whether the active organization's plan allows managing custom roles and permissions. */
  canManageCustomRoles: boolean
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(
  undefined
)

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const organizations = useMemo(
    () => user?.organizations ?? [],
    [user?.organizations]
  )
  const [activeOrganizationId, setActiveOrganizationIdState] = useState<
    number | null
  >(null)

  useEffect(() => {
    if (organizations.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveOrganizationIdState(null)
      return
    }

    const cookieValue = getCookie(ACTIVE_ORG_COOKIE)
    const cookieId = cookieValue ? Number(cookieValue) : null
    const cookieIsValid =
      cookieId !== null && organizations.some((org) => org.id === cookieId)

    setActiveOrganizationIdState((current) => {
      if (current !== null && organizations.some((org) => org.id === current)) {
        return current
      }
      return cookieIsValid ? cookieId : organizations[0].id
    })
  }, [organizations])

  const setActiveOrganizationId = (id: number) => {
    setActiveOrganizationIdState(id)
    setCookie(ACTIVE_ORG_COOKIE, String(id), 365)
  }

  const activeOrganization =
    organizations.find((org) => org.id === activeOrganizationId) ?? null

  const isOwner = activeOrganization?.is_owner ?? false
  const isAdmin = isOwner || activeOrganization?.role === "admin"
  const canManageCustomRoles = activeOrganization?.can_manage_custom_roles ?? false

  const can = (permission: string): boolean => {
    if (isOwner) {
      return true
    }
    return activeOrganization?.permissions?.includes(permission) ?? false
  }

  const canAny = (permissions: string[]): boolean => {
    if (isOwner) {
      return true
    }
    return permissions.some(
      (p) => activeOrganization?.permissions?.includes(p) ?? false
    )
  }

  const canAll = (permissions: string[]): boolean => {
    if (isOwner) {
      return true
    }
    return permissions.every(
      (p) => activeOrganization?.permissions?.includes(p) ?? false
    )
  }

  return (
    <OrganizationContext.Provider
      value={{
        organizations,
        activeOrganization,
        activeOrganizationId,
        setActiveOrganizationId,
        isOwner,
        isAdmin,
        can,
        canAny,
        canAll,
        canManageCustomRoles,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  )
}

export function useOrganization() {
  const context = useContext(OrganizationContext)
  if (context === undefined) {
    throw new Error(
      "useOrganization must be used within an OrganizationProvider"
    )
  }
  return context
}
