"use client"

import React, {
  createContext,
  useContext,
  useEffect,
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
  /** Whether the current user holds the given Shield permission in the active org. */
  can: (permission: string) => boolean
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(
  undefined
)

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const organizations = user?.organizations ?? []
  const [activeOrganizationId, setActiveOrganizationIdState] = useState<
    number | null
  >(null)

  useEffect(() => {
    if (organizations.length === 0) {
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

  const can = (permission: string): boolean =>
    activeOrganization?.permissions?.includes(permission) ?? false

  return (
    <OrganizationContext.Provider
      value={{
        organizations,
        activeOrganization,
        activeOrganizationId,
        setActiveOrganizationId,
        isOwner,
        can,
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
