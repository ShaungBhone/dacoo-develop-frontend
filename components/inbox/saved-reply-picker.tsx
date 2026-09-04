"use client"

import * as React from "react"
import {
  MessageSquareTextIcon,
  RefreshCwIcon,
  TriangleAlertIcon,
} from "@/components/ui/icons"

import { ApiError } from "@/lib/api"
import { useOrganization } from "@/contexts/organization-context"
import {
  fetchSavedReplies,
  type SavedReply,
} from "@/components/settings/saved-replies-api"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Spinner } from "@/components/ui/spinner"

export function SavedReplyPicker({
  disabled,
  onSelect,
}: {
  disabled: boolean
  onSelect: (savedReply: SavedReply) => void
}) {
  const { activeOrganizationId } = useOrganization()
  const [open, setOpen] = React.useState(false)
  const [savedReplies, setSavedReplies] = React.useState<SavedReply[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [reloadKey, setReloadKey] = React.useState(0)

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (nextOpen) {
      setLoading(true)
      setError(null)
    }
  }

  React.useEffect(() => {
    if (!open || activeOrganizationId === null) return

    let cancelled = false
    fetchSavedReplies(activeOrganizationId)
      .then((records) => {
        if (!cancelled) setSavedReplies(records)
      })
      .catch((caughtError) => {
        if (!cancelled) {
          setError(
            caughtError instanceof ApiError
              ? caughtError.message
              : "Couldn’t load saved replies."
          )
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [activeOrganizationId, open, reloadKey])

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={disabled || activeOrganizationId === null}
            aria-label="Insert a saved reply"
          />
        }
      >
        <MessageSquareTextIcon aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80 p-0">
        <Command className="rounded-2xl">
          <CommandInput placeholder="Search saved replies…" autoFocus />
          <CommandList>
            {loading ? (
              <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-muted-foreground">
                <Spinner />
                Loading replies…
              </div>
            ) : error ? (
              <div className="flex flex-col items-center gap-3 px-4 py-6 text-center text-sm">
                <TriangleAlertIcon className="size-5 text-destructive" />
                <p className="text-muted-foreground">{error}</p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setLoading(true)
                    setError(null)
                    setReloadKey((current) => current + 1)
                  }}
                >
                  <RefreshCwIcon aria-hidden="true" />
                  Retry
                </Button>
              </div>
            ) : (
              <>
                <CommandEmpty>No saved replies found.</CommandEmpty>
                <CommandGroup>
                  {savedReplies.map((savedReply) => (
                    <CommandItem
                      key={savedReply.id}
                      value={`${savedReply.title} ${savedReply.body}`}
                      className="items-start py-2"
                      onSelect={() => {
                        onSelect(savedReply)
                        setOpen(false)
                      }}
                    >
                      <MessageSquareTextIcon className="mt-0.5 size-4 text-muted-foreground" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">
                          {savedReply.title}
                        </span>
                        <span className="line-clamp-2 text-xs whitespace-pre-line text-muted-foreground">
                          {savedReply.body}
                        </span>
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
