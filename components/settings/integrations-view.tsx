"use client"

import * as React from "react"
import type { SVGProps } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  BuildingIcon,
  CheckCircle2Icon,
  CopyIcon,
  ExternalLinkIcon,
  Link2Icon,
  LockIcon,
  MessageSquareIcon,
  SparklesIcon,
  TriangleAlertIcon,
} from "@/components/ui/icons"

import { useOrganization } from "@/contexts/organization-context"
import { ApiError } from "@/lib/api"
import {
  connectChannel,
  fetchIntegrations,
  type IntegrationProvider,
  type IntegrationsMeta,
  type IntegrationRecord,
} from "@/components/settings/integrations-api"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Spinner } from "@/components/ui/spinner"
import { Email } from "@/components/ui/svgs/email"
import { Facebook } from "@/components/ui/svgs/facebook"
import { Instagram } from "@/components/ui/svgs/instagram"
import { Messenger } from "@/components/ui/svgs/messenger"
import { Telegram } from "@/components/ui/svgs/telegram"
import { Viber } from "@/components/ui/svgs/viber"
import { Whatsapp } from "@/components/ui/svgs/whatsapp"
import { TypographyH3, TypographyMuted } from "@/components/ui/typography"
import { TelegramConnectDialog } from "@/components/settings/telegram-connect-dialog"
import { DisconnectChannelDialog } from "@/components/settings/disconnect-channel-dialog"

const PROVIDER_ICONS: Record<
  string,
  React.ComponentType<SVGProps<SVGSVGElement>>
> = {
  telegram: Telegram,
  viber: Viber,
  messenger: Messenger,
  instagram: Instagram,
  whatsapp: Whatsapp,
  email: Email,
  facebook: Facebook,
}

function IntegrationCard({
  provider,
  meta,
  connecting,
  onConnect,
  onDisconnect,
  onUpgrade,
}: {
  provider: IntegrationProvider
  meta: IntegrationsMeta | null
  connecting: boolean
  onConnect: () => void
  onDisconnect: () => void
  onUpgrade: () => void
}) {
  const Icon = PROVIDER_ICONS[provider.provider] ?? MessageSquareIcon
  const isConnected = provider.connected
  const isAllowedByPlan = provider.is_allowed_by_plan
  const canConnectMore = meta ? meta.can_connect_more : true
  const viberDeepLink = provider.integration?.viber_deep_link
  const [copied, setCopied] = React.useState(false)

  async function copyViberLink() {
    if (!viberDeepLink) return

    await navigator.clipboard.writeText(viberDeepLink)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2_000)
  }

  return (
    <Card
      size="sm">
      <div>
        <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border bg-muted/40">
            <Icon className="size-9" />
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {isConnected ? (
              <Badge
                variant="outline"
                className="gap-1 border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              >
                <CheckCircle2Icon className="size-3" />
                Connected
              </Badge>
            ) : !isAllowedByPlan ? (
              <Badge
                variant="outline"
                className="gap-1 border-amber-500/30 text-amber-600 dark:text-amber-400"
              >
                <LockIcon className="size-3" />
                {provider.min_plan_name ?? "Upgrade"}
              </Badge>
            ) : !canConnectMore ? (
              <Badge variant="destructive" className="text-xs">
                Limit reached
              </Badge>
            ) : null}
            <ExternalLinkIcon
              className="size-4 text-muted-foreground"
              aria-hidden="true"
            />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-1 pb-4">
          <CardTitle className="text-base font-semibold">
            {provider.name}
          </CardTitle>
          <CardDescription className="text-sm leading-relaxed">
            {provider.description}
          </CardDescription>
          {provider.provider === "viber" && viberDeepLink && (
            <div className="mt-3 rounded-md border bg-muted/30 p-3">
              <p className="text-sm font-medium">Organization Viber link</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Share this link with customers. Messages started from it go to
                this organization only.
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-3 gap-1.5"
                onClick={copyViberLink}
              >
                {copied ? (
                  <CheckCircle2Icon className="size-3.5" />
                ) : (
                  <CopyIcon className="size-3.5" />
                )}
                {copied ? "Copied" : "Copy Viber link"}
              </Button>
            </div>
          )}
        </CardContent>
      </div>
      <CardFooter className="justify-between">
        {isConnected ? (
          <>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onDisconnect}
            >
              Disconnect
            </Button>
            <Switch
              checked={true}
              onCheckedChange={onDisconnect}
              aria-label={`Disconnect ${provider.name}`}
            />
          </>
        ) : !isAllowedByPlan ? (
          <>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onUpgrade}
              className="gap-1 text-xs"
            >
              <SparklesIcon className="size-3.5 text-amber-500" />
              Upgrade to connect
            </Button>
            <Switch
              checked={false}
              disabled
              aria-label={`Upgrade required for ${provider.name}`}
            />
          </>
        ) : !canConnectMore ? (
          <>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onUpgrade}
              className="gap-1 text-xs"
            >
              <SparklesIcon className="size-3.5 text-primary" />
              Limit reached
            </Button>
            <Switch
              checked={false}
              disabled
              aria-label={`Channel limit reached for ${provider.name}`}
            />
          </>
        ) : (
          <>
            <Button
              type="button"
              size="sm"
              variant="default"
              disabled={connecting}
              onClick={onConnect}
              className="gap-1"
            >
              {connecting ? (
                <Spinner className="size-3.5" />
              ) : (
                <Link2Icon data-icon="inline-start" className="size-3.5" />
              )}
              {connecting ? "Connecting…" : "Connect"}
            </Button>
            <Switch
              checked={false}
              disabled={connecting}
              onCheckedChange={onConnect}
              aria-label={`Connect ${provider.name}`}
            />
          </>
        )}
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
  const router = useRouter()
  const searchParams = useSearchParams()

  const [loading, setLoading] = React.useState(true)
  const [integrations, setIntegrations] = React.useState<IntegrationProvider[]>(
    []
  )
  const [meta, setMeta] = React.useState<IntegrationsMeta | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [notice, setNotice] = React.useState<{
    type: "success" | "error"
    title: string
    message: string
  } | null>(null)

  const [connectingProvider, setConnectingProvider] = React.useState<
    string | null
  >(null)
  const [telegramDialogOpen, setTelegramDialogOpen] = React.useState(false)
  const [disconnectTarget, setDisconnectTarget] =
    React.useState<IntegrationProvider | null>(null)

  const load = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchIntegrations(organizationId)
      setIntegrations(res.data)
      setMeta(res.meta)
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to load integrations."
      )
    } finally {
      setLoading(false)
    }
  }, [organizationId])

  React.useEffect(() => {
    load()
  }, [load])

  // Handle OAuth callback status from query parameters
  React.useEffect(() => {
    const status = searchParams.get("status")
    const providerParam = searchParams.get("provider")
    const msg = searchParams.get("message")

    if (status === "success") {
      setNotice({
        type: "success",
        title: "Channel connected",
        message:
          msg ?? `Successfully connected ${providerParam ?? "the channel"}.`,
      })
      router.replace("/settings?tab=integrations")
      load()
    } else if (status === "error") {
      setNotice({
        type: "error",
        title: "Connection failed",
        message: msg ?? "Could not authorize channel.",
      })
      router.replace("/settings?tab=integrations")
    }
  }, [searchParams, router, load])

  async function handleConnect(provider: IntegrationProvider) {
    if (provider.provider === "telegram") {
      setTelegramDialogOpen(true)
      return
    }

    setConnectingProvider(provider.provider)
    setError(null)
    setNotice(null)

    try {
      const res = await connectChannel(organizationId, provider.provider)

      if ("requires_oauth" in res && res.requires_oauth && res.connect_url) {
        // Redirect the user to Meta OAuth
        window.location.href = res.connect_url
        return
      }

      // One-click or instantaneous connection (e.g. Viber)
      setNotice({
        type: "success",
        title: "Channel connected",
        message: `${provider.name} connected successfully!`,
      })
      await load()
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : `Failed to connect ${provider.name}.`
      )
    } finally {
      setConnectingProvider(null)
    }
  }

  function handleUpgrade() {
    router.push("/settings?tab=billing")
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <TypographyH3>Integrations</TypographyH3>
        <TypographyMuted>
          Enhance your workspace by linking external communication channels to
          your shared inbox.
        </TypographyMuted>
      </div>

      {notice && (
        <Alert
          variant={notice.type === "success" ? "default" : "destructive"}
          className="border-emerald-500/20 bg-emerald-500/5 text-emerald-950 dark:text-emerald-100"
        >
          <CheckCircle2Icon className="size-4 text-emerald-600 dark:text-emerald-400" />
          <AlertTitle>{notice.title}</AlertTitle>
          <AlertDescription>{notice.message}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <TriangleAlertIcon aria-hidden="true" />
          <AlertTitle>Notice</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {meta && (
        <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">Active Channels</span>
              <Badge variant="secondary" className="font-mono text-xs">
                {meta.plan_name} Plan
              </Badge>
              {meta.channels_limit === -1 ? (
                <Badge
                  variant="outline"
                  className="border-emerald-500/30 text-xs text-emerald-600 dark:text-emerald-400"
                >
                  Unlimited
                </Badge>
              ) : !meta.can_connect_more ? (
                <Badge variant="destructive" className="text-xs">
                  Limit reached
                </Badge>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">
              {meta.channels_limit === -1
                ? `${meta.channels_count} channels connected. Your plan includes unlimited channels.`
                : `${meta.channels_count} of ${meta.channels_limit} channels connected.`}
            </p>
          </div>
          {meta.channels_limit !== -1 && !meta.can_connect_more && (
            <Button
              variant="default"
              size="sm"
              onClick={handleUpgrade}
              className="shrink-0 gap-1.5"
            >
              <SparklesIcon className="size-3.5" />
              Upgrade plan
            </Button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Skeleton
                key={i}
                className="h-48 w-full rounded-[min(var(--radius-4xl),24px)]"
              />
            ))
          : integrations.map((provider) => (
              <IntegrationCard
                key={provider.provider}
                provider={provider}
                meta={meta}
                connecting={connectingProvider === provider.provider}
                onConnect={() => handleConnect(provider)}
                onDisconnect={() => setDisconnectTarget(provider)}
                onUpgrade={handleUpgrade}
              />
            ))}
      </div>

      {telegramDialogOpen && (
        <TelegramConnectDialog
          organizationId={organizationId}
          onClose={() => setTelegramDialogOpen(false)}
          onConnected={(_record: IntegrationRecord) => {
            setTelegramDialogOpen(false)
            setNotice({
              type: "success",
              title: "Channel connected",
              message: "Telegram connected successfully!",
            })
            load()
          }}
        />
      )}

      {disconnectTarget && (
        <DisconnectChannelDialog
          organizationId={organizationId}
          provider={disconnectTarget.provider}
          providerName={disconnectTarget.name}
          onClose={() => setDisconnectTarget(null)}
          onDisconnected={() => {
            setDisconnectTarget(null)
            setNotice({
              type: "success",
              title: "Channel disconnected",
              message: `${disconnectTarget.name} was disconnected.`,
            })
            load()
          }}
        />
      )}
    </div>
  )
}
