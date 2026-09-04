"use client"

import * as React from "react"
import type { SVGProps } from "react"
import {
  BuildingIcon,
  ExternalLinkIcon,
  Link2Icon,
  TriangleAlertIcon,
} from "@/components/ui/icons"

import { useOrganization } from "@/contexts/organization-context"
import { ApiError } from "@/lib/api"
import {
  fetchIntegrations,
  type IntegrationProvider,
} from "@/components/settings/integrations-api"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert"
import { Card, CardFooter, CardHeader } from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Email } from "@/components/ui/svgs/email"
import { Instagram } from "@/components/ui/svgs/instagram"
import { Messenger } from "@/components/ui/svgs/messenger"
import { Telegram } from "@/components/ui/svgs/telegram"
import { Viber } from "@/components/ui/svgs/viber"
import { Whatsapp } from "@/components/ui/svgs/whatsapp"
import { TypographyH3, TypographyMuted } from "@/components/ui/typography"
import { TelegramConnectDialog } from "@/components/settings/telegram-connect-dialog"
import { TelegramDisconnectDialog } from "@/components/settings/telegram-disconnect-dialog"

type IntegrationChannel = {
  id: string
  name: string
  description: string
  icon: React.ComponentType<SVGProps<SVGSVGElement>>
  connected: boolean
}

const STATIC_CHANNELS: IntegrationChannel[] = [
  {
    id: "email",
    name: "Email",
    description: "Send and receive customer conversations over email.",
    icon: Email,
    connected: true,
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    description: "Chat with customers on WhatsApp from the shared inbox.",
    icon: Whatsapp,
    connected: true,
  },
  {
    id: "instagram",
    name: "Instagram",
    description: "Reply to DMs and comments without leaving the inbox.",
    icon: Instagram,
    connected: false,
  },
  {
    id: "facebook",
    name: "Messenger",
    description: "Manage Facebook Messenger conversations in one place.",
    icon: Messenger,
    connected: true,
  },
  {
    id: "viber",
    name: "Viber",
    description: "Connect Viber to message and support customers.",
    icon: Viber,
    connected: false,
  },
]

const TELEGRAM_CHANNEL: IntegrationChannel = {
  id: "telegram",
  name: "Telegram",
  description: "Bring Telegram chats into your shared inbox.",
  icon: Telegram,
  connected: false,
}

function IntegrationCard({
  channel,
  connected,
  disabled,
  onConnectedChange,
}: {
  channel: IntegrationChannel
  connected: boolean
  disabled?: boolean
  onConnectedChange: (connected: boolean) => void
}) {
  const Icon = channel.icon

  return (
    <Card
      size="sm"
      className="gap-2 rounded-3xl border bg-muted/20 p-1 shadow-none [--card-spacing:0px]"
    >
      <CardHeader className="min-h-34 gap-4 rounded-2xl border bg-card p-4 shadow-xs">
        <div className="flex items-start justify-between gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border bg-background p-0.5 shadow-xs">
            <Icon className="size-9" />
          </div>
          <ExternalLinkIcon
            className="mt-1 size-4 text-muted-foreground"
            aria-hidden="true"
          />
        </div>
        <TypographyMuted>{channel.description}</TypographyMuted>
      </CardHeader>
      <CardFooter className="justify-between px-2 pb-2">
        <Button
          type="button"
          size="sm"
          variant={connected ? "outline" : "default"}
          disabled={disabled}
          onClick={() => onConnectedChange(!connected)}
        >
          {!connected && <Link2Icon data-icon="inline-start" />}
          {connected ? "Disconnect" : "Connect"}
        </Button>
        <Switch
          checked={connected}
          onCheckedChange={onConnectedChange}
          disabled={disabled}
          aria-label={`${connected ? "Disconnect" : "Connect"} ${channel.name}`}
        />
      </CardFooter>
    </Card>
  )
}

export function IntegrationsView() {
  const { activeOrganizationId } = useOrganization()

  if (!activeOrganizationId) {
    return (
      <Empty className="py-16">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <BuildingIcon aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>No organization selected</EmptyTitle>
          <EmptyDescription>
            Select or create an organization to manage its integrations.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <IntegrationsGrid
      key={activeOrganizationId}
      organizationId={activeOrganizationId}
    />
  )
}

function IntegrationsGrid({ organizationId }: { organizationId: number }) {
  const [loading, setLoading] = React.useState(true)
  const [telegramConnected, setTelegramConnected] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [dialog, setDialog] = React.useState<"connect" | "disconnect" | null>(
    null
  )

  React.useEffect(() => {
    let ignore = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const integrations = await fetchIntegrations(organizationId)
        if (ignore) return
        const telegram = integrations.find(
          (integration: IntegrationProvider) =>
            integration.provider === "telegram"
        )
        setTelegramConnected(telegram?.connected ?? false)
      } catch (err) {
        if (!ignore) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Failed to load integrations."
          )
        }
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    load()

    return () => {
      ignore = true
    }
  }, [organizationId])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <TypographyH3>Integrations</TypographyH3>
        <TypographyMuted>
          Enhance your workspace by linking external tools for communication,
          payments, and automation.
        </TypographyMuted>
      </div>

      {error && (
        <Alert variant="destructive">
          <TriangleAlertIcon aria-hidden="true" />
          <AlertTitle>Couldn&apos;t load integrations</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <Skeleton className="h-48 w-full rounded-[min(var(--radius-4xl),24px)]" />
        ) : (
          <IntegrationCard
            channel={TELEGRAM_CHANNEL}
            connected={telegramConnected}
            onConnectedChange={(next) =>
              setDialog(next ? "connect" : "disconnect")
            }
          />
        )}
        {STATIC_CHANNELS.map((channel) => (
          <IntegrationCard
            key={channel.id}
            channel={channel}
            connected={channel.connected}
            disabled
            onConnectedChange={() => {}}
          />
        ))}
      </div>

      {dialog === "connect" && (
        <TelegramConnectDialog
          organizationId={organizationId}
          onClose={() => setDialog(null)}
          onConnected={() => setTelegramConnected(true)}
        />
      )}

      {dialog === "disconnect" && (
        <TelegramDisconnectDialog
          organizationId={organizationId}
          onClose={() => setDialog(null)}
          onDisconnected={() => setTelegramConnected(false)}
        />
      )}
    </div>
  )
}
