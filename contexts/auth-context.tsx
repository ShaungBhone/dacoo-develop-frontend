"use client"

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react"
import { useRouter, usePathname } from "next/navigation"
import { apiFetch, ApiError } from "@/lib/api"
import { getCookie, setCookie, deleteCookie } from "@/lib/cookies"

export type Organization = {
  id: number
  name: string
  slug: string
  owner_id: number
  logo_url?: string | null
  /** The authenticated user's role within this organization (null if none). */
  role?: string | null
  /** The Shield permission keys the authenticated user holds in this org. */
  permissions?: string[]
  /** Whether the authenticated user owns this organization. */
  is_owner?: boolean
}

export type User = {
  id: number
  name: string
  email: string
  avatar_url: string | null
  onboarding_completed: boolean
  organizations?: Organization[]
  organization_limit?: number
  can_create_organization?: boolean
}

type AuthContextType = {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<User | null>
  completeOnboarding: () => Promise<User>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)
const ONBOARDING_COOKIE = "onboarding_completed"

function syncOnboardingCookie(user: User) {
  setCookie(ONBOARDING_COOKIE, user.onboarding_completed ? "1" : "0", 7)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setTokenState] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Initialize and check token
  useEffect(() => {
    async function initAuth() {
      const activeToken = getCookie("auth_token")
      if (!activeToken) {
        setIsLoading(false)
        // If they are on a protected page, redirect to login
        if (pathname && pathname !== "/login" && pathname !== "/register") {
          router.push("/login")
        }
        return
      }

      setTokenState(activeToken)
      try {
        const userData = await apiFetch<User>("/api/user")
        setUser(userData)
        syncOnboardingCookie(userData)

        if (!userData.onboarding_completed && pathname !== "/onboarding") {
          router.replace("/onboarding")
        } else if (
          userData.onboarding_completed &&
          (pathname === "/login" || pathname === "/onboarding")
        ) {
          router.replace("/home")
        }
      } catch (error) {
        // Only treat a genuine 401 as an invalid/expired token. Any other
        // failure (network, CORS, TLS, API down) must NOT destroy a valid
        // session — otherwise a transient error on hard refresh logs the user
        // out. Keep the token in state so they stay logged in.
        if (error instanceof ApiError && error.status === 401) {
          console.error("Auth token rejected (401), logging out:", error)
          deleteCookie("auth_token")
          deleteCookie(ONBOARDING_COOKIE)
          setTokenState(null)
          setUser(null)
          if (pathname && pathname !== "/login" && pathname !== "/register") {
            router.push("/login")
          }
        } else {
          console.warn("Could not validate token (keeping session):", error)
        }
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [pathname, router])

  // Login handler
  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const res = await apiFetch<{ token: string; user: User }>("/api/login", {
        method: "POST",
        body: { email, password, device_name: "web-dashboard" },
      })

      // Store in cookies and state
      setCookie("auth_token", res.token, 7) // 7 days expiration
      setTokenState(res.token)
      setUser(res.user)
      syncOnboardingCookie(res.user)

      router.replace(res.user.onboarding_completed ? "/home" : "/onboarding")
    } catch (error) {
      setIsLoading(false)
      throw error
    }
  }

  // Logout handler
  const logout = async () => {
    setIsLoading(true)
    try {
      if (token) {
        // Race the API call against an 800ms timeout so a hanging request never blocks logout
        await Promise.race([
          apiFetch("/api/logout", { method: "POST" }),
          new Promise((resolve) => setTimeout(resolve, 800)),
        ])
      }
    } catch (error) {
      console.error("Logout request failed:", error)
    } finally {
      deleteCookie("auth_token")
      deleteCookie(ONBOARDING_COOKIE)
      setTokenState(null)
      setUser(null)
      setIsLoading(false)
      if (typeof window !== "undefined") {
        window.location.assign("/login")
      }
    }
  }

  const refreshUser = async () => {
    try {
      const userData = await apiFetch<User>("/api/user")
      setUser(userData)
      syncOnboardingCookie(userData)
      return userData
    } catch (error) {
      console.error("Failed to refresh user:", error)
      return null
    }
  }

  const completeOnboarding = async () => {
    const userData = await apiFetch<User>("/api/onboarding/complete", {
      method: "POST",
    })
    setUser(userData)
    syncOnboardingCookie(userData)
    return userData
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        refreshUser,
        completeOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
