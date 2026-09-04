"use client"

import * as React from "react"
import { AlertTriangleIcon } from "@/components/ui/icons"

import { ApiError } from "@/lib/api"
import {
  connectTelegram,
  type IntegrationRecord,
} from "@/components/settings/integrations-api"
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
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"

export function TelegramConnectDialog({
  organizationId,
  onClose,
  onConnected,
}: {
  organizationId: number
  onClose: () => void
  onConnected: (integration: IntegrationRecord) => void
}) {
  const [botToken, setBotToken] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [fieldError, setFieldError] = React.useState<string | null>(null)

  async function handleConnect() {
    if (!botToken.trim()) return

    setIsSubmitting(true)
    setError(null)
    setFieldError(null)

    try {
      const integration = await connectTelegram(organizationId, botToken.trim())
      onConnected(integration)
      onClose()
    } catch (err) {
      if (err instanceof ApiError && err.status === 422 && err.errors) {
        setFieldError(err.errors.bot_token?.[0] ?? err.message)
      } else {
        setError(
          err instanceof ApiError ? err.message : "Failed to connect Telegram."
        )
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent className="max-w-md gap-0 p-0">
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle>Connect Telegram</DialogTitle>
          <DialogDescription>
            Bring your Telegram bot into the shared inbox.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 p-5">
          <Field data-invalid={!!fieldError}>
            <FieldLabel htmlFor="telegram-bot-token">Bot token</FieldLabel>
            <FieldDescription>
              Open Telegram, message{" "}
              <span className="font-medium text-foreground">@BotFather</span>,
              create or select a bot, and paste the token it gives you.
            </FieldDescription>
            <Input
              id="telegram-bot-token"
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              placeholder="123456789:AAExampleTokenFromBotFather"
              autoComplete="off"
              disabled={isSubmitting}
            />
            {fieldError && <FieldError>{fieldError}</FieldError>}
          </Field>

          {error && (
            <Alert variant="destructive" className="py-2">
              <AlertTriangleIcon className="size-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex-col border-t border-border px-5 py-4 sm:flex-col">
          <Button
            onClick={handleConnect}
            disabled={isSubmitting || !botToken.trim()}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Spinner className="size-4" aria-hidden="true" />
                Connecting…
              </>
            ) : (
              "Connect"
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
