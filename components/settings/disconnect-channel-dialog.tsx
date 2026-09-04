"use client"

import * as React from "react"

import { ApiError } from "@/lib/api"
import { disconnectIntegration } from "@/components/settings/integrations-api"
import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
    <Dialog open onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent className="max-w-md gap-0 p-0">
        <DialogHeader className="px-5 py-4">
          <DialogTitle>Disconnect {providerName}?</DialogTitle>
          <DialogDescription>
            Your organization will stop sending and receiving messages through this
            channel. Existing conversations and contacts will remain in your workspace.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="px-5 pt-4">
            <Alert variant="destructive" className="py-2">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        <DialogFooter className="flex-col border-t border-border px-5 py-4 sm:flex-col">
          <Button
            variant="destructive"
            onClick={handleDisconnect}
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Spinner className="size-4" aria-hidden="true" />
                Disconnecting…
              </>
            ) : (
              "Disconnect"
            )}
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
