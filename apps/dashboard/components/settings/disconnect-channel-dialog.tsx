"use client"

import * as React from "react"
import { AlertTriangleIcon } from "@/components/ui/icons"

import { ApiError } from "@/lib/api"
import { disconnectIntegration } from "@/components/settings/integrations-api"
import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Spinner } from "@/components/ui/spinner"

export function DisconnectChannelDialog({
  organizationId,
  provider,
  providerName,
  onClose,
  onDisconnected,
}: {
  organizationId: number
  provider: string
  providerName: string
  onClose: () => void
  onDisconnected: () => void
}) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function handleDisconnect() {
    setIsSubmitting(true)
    setError(null)

    try {
      await disconnectIntegration(organizationId, provider)
      onDisconnected()
      onClose()
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : `Failed to disconnect ${providerName}.`
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AlertDialog open onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <AlertDialogContent>
        <div className="flex items-start gap-3 py-1">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangleIcon className="size-5 text-destructive" />
          </div>
          <div className="flex flex-col justify-center gap-1">
            <AlertDialogTitle className="text-sm font-semibold">
              Disconnect {providerName}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Messages will stop, but existing conversations and contacts will remain.
            </AlertDialogDescription>
          </div>
        </div>

        {error && (
          <div>
            <Alert variant="destructive" className="py-2">
              <AlertTriangleIcon className="size-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleDisconnect}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Spinner className="size-4" aria-hidden="true" />
                Disconnecting…
              </>
            ) : (
              "Disconnect"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
