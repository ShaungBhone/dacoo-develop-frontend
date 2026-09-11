"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import Echo from "laravel-echo"
import Pusher from "pusher-js"
import { useAuth } from "./auth-context"
import { getCookie } from "@/lib/cookies"

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://srv1713705.hstgr.cloud"

interface EchoContextType {
  echo: Echo<"reverb"> | null
  isConnected: boolean
}

const EchoContext = createContext<EchoContextType>({
  echo: null,
  isConnected: false,
})

function getReverbConfig() {
  const hostWithPort = API_BASE_URL.replace(/https?:\/\//, "")
  const host = hostWithPort.split(":")[0]
  const isHttps = API_BASE_URL.startsWith("https")

  // If HTTPS, use standard wss port 443 (Herd/Valet reverse proxy)
  // If HTTP, default to Reverb port 8080
  const wsPort = isHttps ? 443 : 8080
  const wssPort = isHttps ? 443 : 8080

  return { host, wsPort, wssPort, isHttps }
}

export function EchoProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const [echoInstance, setEchoInstance] = useState<Echo<"reverb"> | null>(
    null
  )
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const token = getCookie("auth_token")

    if (isLoading || !user || !token) {
      if (echoInstance) {
        echoInstance.disconnect()
        setEchoInstance(null)
        setIsConnected(false)
      }
      return
    }

    const { host, wsPort, wssPort, isHttps } = getReverbConfig()
    const reverbKey = process.env.NEXT_PUBLIC_REVERB_APP_KEY ?? "maychat"

    const pusherClient = new Pusher(reverbKey, {
      // pusher-js requires a non-null `cluster`, but Reverb derives its host
      // from `wsHost` instead, so the value itself is unused here.
      cluster: "",
      wsHost: host,
      wsPort,
      wssPort,
      forceTLS: isHttps,
      enabledTransports: ["ws", "wss"],
      disableStats: true,
      authEndpoint: `${API_BASE_URL}/api/v1/broadcasting/auth`,
      auth: {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      },
    })

    const echo = new Echo({
      broadcaster: "reverb",
      key: reverbKey,
      client: pusherClient,
    })

    setEchoInstance(echo)

    pusherClient.connection.bind("connected", () => setIsConnected(true))
    pusherClient.connection.bind("disconnected", () => setIsConnected(false))
    pusherClient.connection.bind("failed", () => setIsConnected(false))

    return () => {
      echo.disconnect()
      setEchoInstance(null)
      setIsConnected(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isLoading])

  return (
    <EchoContext.Provider value={{ echo: echoInstance, isConnected }}>
      {children}
    </EchoContext.Provider>
  )
}

export function useEcho() {
  return useContext(EchoContext)
}
