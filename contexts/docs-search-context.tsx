"use client"

import React, { createContext, useContext, useState } from "react"

type DocsSearchContextType = {
  query: string
  setQuery: (q: string) => void
  activeSectionId: string
  setActiveSectionId: (id: string) => void
}

const DocsSearchContext = createContext<DocsSearchContextType | undefined>(
  undefined
)

export function DocsSearchProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [query, setQuery] = useState("")
  const [activeSectionId, setActiveSectionId] = useState("getting-started")

  return (
    <DocsSearchContext.Provider
      value={{
        query,
        setQuery,
        activeSectionId,
        setActiveSectionId,
      }}
    >
      {children}
    </DocsSearchContext.Provider>
  )
}

export function useDocsSearch() {
  const context = useContext(DocsSearchContext)
  if (context === undefined) {
    throw new Error("useDocsSearch must be used within a DocsSearchProvider")
  }
  return context
}
