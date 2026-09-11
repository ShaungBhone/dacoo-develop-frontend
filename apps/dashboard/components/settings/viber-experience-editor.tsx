"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  Clock3Icon,
  ImageIcon,
  PlusIcon,
  SendIcon,
  Trash2Icon,
  TriangleAlertIcon,
} from "@/components/ui/icons"

import { ApiError } from "@/lib/api"
import { fetchConversations, type Conversation } from "@/components/inbox/api"
import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Viber } from "@/components/ui/svgs/viber"
import {
  createViberDraft,
  fetchViberExperience,
  publishViberExperience,
  removeViberCardImage,
  saveViberDraft,
  startViberPreview,
  stopViberPreview,
  uploadViberCardImage,
  type LocalizedText,
  type ViberAutomation,
  type ViberCardAction,
  type ViberExperience,
  type ViberExperienceRevision,
  type ViberLocale,
  type ViberMenuAction,
  type ViberResponseType,
} from "@/components/settings/viber-experience-api"

const LOCALES: { value: ViberLocale; label: string }[] = [
  { value: "en", label: "English" },
  { value: "my", label: "Burmese" },
]

const selectClass =
  "h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"

function messageFor(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback
}

function localized(value: LocalizedText | null, locale: ViberLocale): string {
  return value?.[locale] ?? ""
}

export function localeComplete(
  revision: ViberExperienceRevision,
  locale: ViberLocale
): boolean {
  if (
    !localized(revision.welcome_text, locale).trim() ||
    !localized(revision.menu_text, locale).trim() ||
    !localized(revision.fallback_text, locale).trim() ||
    !localized(revision.handoff_text, locale).trim()
  ) {
    return false
  }

  if (
    revision.menu_buttons.some(
      (button) =>
        !localized(button.label, locale).trim() ||
        (button.action_type !== "share-phone" &&
          !localized(button.action_value, locale).trim())
    )
  ) {
    return false
  }

  return revision.automations
    .filter((automation) => automation.is_enabled)
    .every((automation) => {
      if (!(automation.triggers[locale] ?? []).some((item) => item.trim())) {
        return false
      }
      if (
        ["text", "carousel"].includes(automation.response_type) &&
        !localized(automation.response_text, locale).trim()
      ) {
        return false
      }
      return (
        automation.response_type !== "carousel" ||
        (automation.cards.length > 0 &&
          automation.cards.every(
            (card) =>
              Boolean(card.image_url) &&
              Boolean(localized(card.title, locale).trim()) &&
              Boolean(localized(card.cta_label, locale).trim()) &&
              Boolean(localized(card.action_value, locale).trim())
          ))
      )
    })
}

function emptyAutomation(locale: ViberLocale): ViberAutomation {
  return {
    name: "New automation",
    response_type: "text",
    triggers: { [locale]: [] },
    response_text: { [locale]: "" },
    show_menu: false,
    is_enabled: true,
    cards: [],
  }
}

export function ViberExperienceEditor({
  organizationId,
  canManage,
  onBack,
}: {
  organizationId: number
  canManage: boolean
  onBack: () => void
}) {
  const [experience, setExperience] = React.useState<ViberExperience | null>(
    null
  )
  const [draft, setDraft] = React.useState<ViberExperienceRevision | null>(null)
  const [locale, setLocale] = React.useState<ViberLocale>("en")
  const [conversations, setConversations] = React.useState<Conversation[]>([])
  const [conversationId, setConversationId] = React.useState("")
  const [previewExpiresAt, setPreviewExpiresAt] = React.useState<string | null>(
    null
  )
  const [previewConversationId, setPreviewConversationId] = React.useState<
    string | null
  >(null)
  const [remainingSeconds, setRemainingSeconds] = React.useState(0)
  const [busy, setBusy] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let active = true
    async function load() {
      try {
        let current = await fetchViberExperience(organizationId)
        if (canManage && !current.draft) {
          current = await createViberDraft(organizationId)
        }
        if (!active) return
        setExperience(current)
        setDraft(current.draft ?? current.published)
        const preferred = (current.draft ?? current.published)?.default_locale
        if (preferred) setLocale(preferred)
        if (canManage) {
          const items = (await fetchConversations(organizationId)).filter(
            (conversation) => conversation.inbox.provider === "viber"
          )
          if (!active) return
          setConversations(items)
          setConversationId(items[0] ? String(items[0].id) : "")
        }
      } catch (loadError) {
        if (active)
          setError(
            messageFor(loadError, "Failed to load the Viber experience.")
          )
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [canManage, organizationId])

  React.useEffect(() => {
    if (!previewExpiresAt) return
    const update = () => {
      const seconds = Math.max(
        0,
        Math.ceil((new Date(previewExpiresAt).getTime() - Date.now()) / 1000)
      )
      setRemainingSeconds(seconds)
      if (seconds === 0) {
        setPreviewExpiresAt(null)
        setPreviewConversationId(null)
      }
    }
    update()
    const timer = window.setInterval(update, 1_000)
    return () => window.clearInterval(timer)
  }, [previewExpiresAt])

  const updateLocalized = React.useCallback(
    (
      field: "welcome_text" | "menu_text" | "fallback_text" | "handoff_text",
      value: string
    ) => {
      setDraft((current) =>
        current
          ? { ...current, [field]: { ...current[field], [locale]: value } }
          : current
      )
    },
    [locale]
  )

  async function save(): Promise<ViberExperience | null> {
    if (!draft || !canManage) return null
    setBusy("save")
    setError(null)
    try {
      const payload = {
        default_locale: draft.default_locale,
        enabled_locales: draft.enabled_locales,
        welcome_text: draft.welcome_text,
        menu_text: draft.menu_text,
        fallback_text: draft.fallback_text,
        handoff_text: draft.handoff_text,
        menu_buttons: draft.menu_buttons,
        automations: draft.automations,
      }
      const updated = await saveViberDraft(organizationId, payload)
      setExperience(updated)
      setDraft(updated.draft)
      toast.success("Viber draft saved.")
      return updated
    } catch (saveError) {
      setError(messageFor(saveError, "Failed to save the Viber draft."))
      return null
    } finally {
      setBusy(null)
    }
  }

  async function publish() {
    const saved = await save()
    if (!saved) return
    setBusy("publish")
    try {
      const updated = await publishViberExperience(organizationId)
      setExperience(updated)
      setDraft(updated.draft)
      toast.success("Viber experience published.")
    } catch (publishError) {
      setError(
        messageFor(
          publishError,
          "Publishing failed. Complete every enabled language and try again."
        )
      )
    } finally {
      setBusy(null)
    }
  }

  async function startPreview() {
    if (!conversationId) return
    const saved = await save()
    if (!saved) return
    setBusy("preview")
    try {
      const session = await startViberPreview(
        organizationId,
        conversationId,
        locale
      )
      setPreviewExpiresAt(session.expires_at)
      setPreviewConversationId(session.conversation_id)
      toast.success("Draft sent. This contact will use it for 30 minutes.")
    } catch (previewError) {
      setError(messageFor(previewError, "Failed to start the Viber preview."))
    } finally {
      setBusy(null)
    }
  }

  async function stopPreview() {
    if (!previewConversationId) return
    setBusy("stop-preview")
    try {
      await stopViberPreview(organizationId, previewConversationId)
      setPreviewExpiresAt(null)
      setPreviewConversationId(null)
      toast.success("Preview session stopped.")
    } catch (previewError) {
      setError(messageFor(previewError, "Failed to stop the preview."))
    } finally {
      setBusy(null)
    }
  }

  if (!experience || !draft) {
    return error ? (
      <Alert variant="destructive">
        <TriangleAlertIcon />
        <AlertTitle>Could not open Viber</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    ) : (
      <div className="space-y-4">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  const enabledLocales = draft.enabled_locales
  const allComplete = enabledLocales.every((item) =>
    localeComplete(draft, item)
  )
  const currentAutomation = draft.automations[0]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            size="icon-sm"
            variant="outline"
            onClick={onBack}
          >
            <ArrowLeftIcon />
            <span className="sr-only">Back to integrations</span>
          </Button>
          <div className="flex size-11 items-center justify-center rounded-xl border bg-muted/40">
            <Viber className="size-9" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">Viber experience</h2>
              <Badge variant={experience.published ? "outline" : "secondary"}>
                {experience.published ? "Published" : "Draft only"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {canManage
                ? "Build the greeting, menu, automations, cards, and handoff for this workspace."
                : "Published configuration. You need Manage integrations permission to edit."}
            </p>
          </div>
        </div>
        {canManage ? (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => void save()}
              disabled={busy !== null}
            >
              {busy === "save" ? <Spinner /> : null}
              Save draft
            </Button>
            <Button
              type="button"
              onClick={() => void publish()}
              disabled={busy !== null || !allComplete}
            >
              {busy === "publish" ? <Spinner /> : null}
              Publish
            </Button>
          </div>
        ) : null}
      </div>

      {error ? (
        <Alert variant="destructive">
          <TriangleAlertIcon />
          <AlertTitle>Viber configuration needs attention</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Tabs
        value={locale}
        onValueChange={(value) => setLocale(value as ViberLocale)}
      >
        <TabsList>
          {LOCALES.filter((item) => enabledLocales.includes(item.value)).map(
            (item) => (
              <TabsTrigger key={item.value} value={item.value}>
                {localeComplete(draft, item.value) ? (
                  <CheckCircle2Icon className="size-3.5 text-emerald-500" />
                ) : (
                  <TriangleAlertIcon className="size-3.5 text-amber-500" />
                )}
                {item.label}
              </TabsTrigger>
            )
          )}
        </TabsList>

        {LOCALES.map((item) => (
          <TabsContent key={item.value} value={item.value} className="mt-4">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="flex min-w-0 flex-col gap-5">
                <Card>
                  <CardHeader>
                    <CardTitle>Languages & general messages</CardTitle>
                    <CardDescription>
                      All enabled languages must be complete before publishing.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Enabled languages</Label>
                      <div className="flex flex-wrap gap-4 rounded-lg border p-3">
                        {LOCALES.map((option) => (
                          <label
                            key={option.value}
                            className="flex items-center gap-2 text-sm"
                          >
                            <Switch
                              checked={enabledLocales.includes(option.value)}
                              disabled={
                                !canManage ||
                                (option.value === draft.default_locale &&
                                  enabledLocales.length === 1)
                              }
                              onCheckedChange={(checked) => {
                                setDraft((current) => {
                                  if (!current) return current
                                  const next = checked
                                    ? [
                                        ...new Set([
                                          ...current.enabled_locales,
                                          option.value,
                                        ]),
                                      ]
                                    : current.enabled_locales.filter(
                                        (value) => value !== option.value
                                      )
                                  const defaultLocale = next.includes(
                                    current.default_locale
                                  )
                                    ? current.default_locale
                                    : (next[0] ?? "en")
                                  return {
                                    ...current,
                                    enabled_locales: next,
                                    default_locale: defaultLocale,
                                  }
                                })
                              }}
                            />
                            {option.label}
                          </label>
                        ))}
                        <label className="ml-auto flex items-center gap-2 text-sm">
                          Default
                          <select
                            className={selectClass + " w-28"}
                            value={draft.default_locale}
                            disabled={!canManage}
                            onChange={(event) =>
                              setDraft({
                                ...draft,
                                default_locale: event.target
                                  .value as ViberLocale,
                              })
                            }
                          >
                            {enabledLocales.map((value) => (
                              <option key={value} value={value}>
                                {value.toUpperCase()}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    </div>
                    {(
                      [
                        [
                          "welcome_text",
                          "Welcome message",
                          "Sent when a customer opens the Viber bot.",
                        ],
                        [
                          "menu_text",
                          "Menu message",
                          "Shown with the main menu.",
                        ],
                        [
                          "fallback_text",
                          "Fallback message",
                          "Used when no trigger matches and AI is off.",
                        ],
                        [
                          "handoff_text",
                          "Handoff message",
                          "Confirms that a person will take over.",
                        ],
                      ] as const
                    ).map(([field, label, hint]) => (
                      <div key={field} className="space-y-2">
                        <Label htmlFor={`${field}-${item.value}`}>
                          {label}
                        </Label>
                        <Textarea
                          id={`${field}-${item.value}`}
                          value={localized(draft[field], item.value)}
                          disabled={!canManage}
                          onChange={(event) =>
                            updateLocalized(field, event.target.value)
                          }
                        />
                        <p className="text-xs text-muted-foreground">{hint}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <MenuSection
                  draft={draft}
                  locale={item.value}
                  canManage={canManage}
                  setDraft={setDraft}
                />
                <AutomationSection
                  draft={draft}
                  locale={item.value}
                  canManage={canManage}
                  setDraft={setDraft}
                  onExperience={setExperience}
                  organizationId={organizationId}
                />
              </div>

              <div className="flex flex-col gap-5 xl:sticky xl:top-4 xl:self-start">
                <ViberPreview
                  revision={draft}
                  locale={item.value}
                  automation={currentAutomation}
                />
                {canManage ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Send test</CardTitle>
                      <CardDescription>
                        Activates this draft for one existing Viber contact for
                        30 minutes. Test handoff has no real side effects.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <select
                        className={selectClass}
                        value={conversationId}
                        disabled={previewExpiresAt !== null}
                        onChange={(event) =>
                          setConversationId(event.target.value)
                        }
                      >
                        {conversations.length === 0 ? (
                          <option value="">No Viber conversations yet</option>
                        ) : null}
                        {conversations.map((conversation) => (
                          <option
                            key={conversation.id}
                            value={String(conversation.id)}
                          >
                            {conversation.customer.displayName}
                          </option>
                        ))}
                      </select>
                      {previewExpiresAt ? (
                        <div className="flex items-center justify-between rounded-lg border border-violet-500/20 bg-violet-500/10 p-3 text-sm">
                          <span className="flex items-center gap-2">
                            <Clock3Icon className="size-4" />
                            Preview active · {Math.ceil(
                              remainingSeconds / 60
                            )}{" "}
                            min left
                          </span>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => void stopPreview()}
                            disabled={busy !== null}
                          >
                            Stop
                          </Button>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          className="w-full"
                          onClick={() => void startPreview()}
                          disabled={!conversationId || busy !== null}
                        >
                          {busy === "preview" ? <Spinner /> : <SendIcon />}
                          Send draft to contact
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ) : null}
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

function MenuSection({
  draft,
  locale,
  canManage,
  setDraft,
}: {
  draft: ViberExperienceRevision
  locale: ViberLocale
  canManage: boolean
  setDraft: React.Dispatch<React.SetStateAction<ViberExperienceRevision | null>>
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between">
        <div>
          <CardTitle>Main menu</CardTitle>
          <CardDescription>
            Automation, website, phone sharing, or human handoff actions.
          </CardDescription>
        </div>
        {canManage ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              setDraft((current) =>
                current
                  ? {
                      ...current,
                      menu_buttons: [
                        ...current.menu_buttons,
                        {
                          label: { [locale]: "New button" },
                          action_type: "reply",
                          action_value: { [locale]: "new button" },
                          background_color: "#7360F2",
                        },
                      ],
                    }
                  : current
              )
            }
          >
            <PlusIcon />
            Add button
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        {draft.menu_buttons.map((button, index) => (
          <div
            key={button.id ?? index}
            className="grid gap-2 rounded-xl border p-3 sm:grid-cols-[1fr_150px_1fr_auto]"
          >
            <Input
              value={localized(button.label, locale)}
              disabled={!canManage}
              placeholder="Button label"
              onChange={(event) =>
                setDraft((current) =>
                  current
                    ? {
                        ...current,
                        menu_buttons: current.menu_buttons.map(
                          (item, itemIndex) =>
                            itemIndex === index
                              ? {
                                  ...item,
                                  label: {
                                    ...item.label,
                                    [locale]: event.target.value,
                                  },
                                }
                              : item
                        ),
                      }
                    : current
                )
              }
            />
            <select
              className={selectClass}
              value={button.action_type}
              disabled={!canManage}
              onChange={(event) =>
                setDraft((current) =>
                  current
                    ? {
                        ...current,
                        menu_buttons: current.menu_buttons.map(
                          (item, itemIndex) =>
                            itemIndex === index
                              ? {
                                  ...item,
                                  action_type: event.target
                                    .value as ViberMenuAction,
                                }
                              : item
                        ),
                      }
                    : current
                )
              }
            >
              <option value="reply">Automation</option>
              <option value="open_url">URL</option>
              <option value="share-phone">Share phone</option>
              <option value="handoff">Handoff</option>
            </select>
            <Input
              value={localized(button.action_value, locale)}
              disabled={!canManage || button.action_type === "share-phone"}
              placeholder={
                button.action_type === "open_url"
                  ? "https://…"
                  : "Matching trigger"
              }
              onChange={(event) =>
                setDraft((current) =>
                  current
                    ? {
                        ...current,
                        menu_buttons: current.menu_buttons.map(
                          (item, itemIndex) =>
                            itemIndex === index
                              ? {
                                  ...item,
                                  action_value: {
                                    ...item.action_value,
                                    [locale]: event.target.value,
                                  },
                                }
                              : item
                        ),
                      }
                    : current
                )
              }
            />
            {canManage ? (
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                onClick={() =>
                  setDraft((current) =>
                    current
                      ? {
                          ...current,
                          menu_buttons: current.menu_buttons.filter(
                            (_, itemIndex) => itemIndex !== index
                          ),
                        }
                      : current
                  )
                }
              >
                <Trash2Icon />
                <span className="sr-only">Remove menu button</span>
              </Button>
            ) : null}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function AutomationSection({
  draft,
  locale,
  canManage,
  setDraft,
  organizationId,
  onExperience,
}: {
  draft: ViberExperienceRevision
  locale: ViberLocale
  canManage: boolean
  setDraft: React.Dispatch<React.SetStateAction<ViberExperienceRevision | null>>
  organizationId: number
  onExperience: (experience: ViberExperience) => void
}) {
  const update = (index: number, patch: Partial<ViberAutomation>) =>
    setDraft((current) =>
      current
        ? {
            ...current,
            automations: current.automations.map((item, itemIndex) =>
              itemIndex === index ? { ...item, ...patch } : item
            ),
          }
        : current
    )

  async function upload(cardId: string | undefined, file: File) {
    if (!cardId) {
      toast.info("Save the draft once before uploading this card image.")
      return
    }
    try {
      const experience = await uploadViberCardImage(
        organizationId,
        cardId,
        file
      )
      onExperience(experience)
      setDraft(experience.draft)
      toast.success("Card image uploaded.")
    } catch (error) {
      toast.error(messageFor(error, "Image upload failed."))
    }
  }

  async function removeImage(cardId: string | undefined) {
    if (!cardId) return
    try {
      const experience = await removeViberCardImage(organizationId, cardId)
      onExperience(experience)
      setDraft(experience.draft)
      toast.success("Card image removed.")
    } catch (error) {
      toast.error(messageFor(error, "Could not remove the image."))
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between">
        <div>
          <CardTitle>Trigger automations</CardTitle>
          <CardDescription>
            Triggers use exact matching after case and whitespace normalization.
          </CardDescription>
        </div>
        {canManage ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              setDraft((current) =>
                current
                  ? {
                      ...current,
                      automations: [
                        ...current.automations,
                        emptyAutomation(locale),
                      ],
                    }
                  : current
              )
            }
          >
            <PlusIcon />
            Add automation
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {draft.automations.map((automation, index) => (
          <div
            key={automation.id ?? index}
            className="space-y-3 rounded-xl border p-4"
          >
            <div className="grid gap-2 sm:grid-cols-[1fr_170px_auto_auto] sm:items-center">
              <Input
                value={automation.name}
                disabled={!canManage}
                onChange={(event) =>
                  update(index, { name: event.target.value })
                }
              />
              <select
                className={selectClass}
                value={automation.response_type}
                disabled={!canManage}
                onChange={(event) =>
                  update(index, {
                    response_type: event.target.value as ViberResponseType,
                  })
                }
              >
                <option value="text">Text</option>
                <option value="menu">Main menu</option>
                <option value="carousel">Carousel</option>
                <option value="handoff">Human handoff</option>
              </select>
              <label className="flex items-center gap-2 text-xs">
                <Switch
                  checked={automation.is_enabled}
                  disabled={!canManage}
                  onCheckedChange={(checked) =>
                    update(index, { is_enabled: checked })
                  }
                />
                Enabled
              </label>
              {canManage ? (
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  onClick={() =>
                    setDraft((current) =>
                      current
                        ? {
                            ...current,
                            automations: current.automations.filter(
                              (_, itemIndex) => itemIndex !== index
                            ),
                          }
                        : current
                    )
                  }
                >
                  <Trash2Icon />
                  <span className="sr-only">Remove automation</span>
                </Button>
              ) : null}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Triggers, one per line</Label>
                <Textarea
                  disabled={!canManage}
                  value={(automation.triggers[locale] ?? []).join("\n")}
                  onChange={(event) =>
                    update(index, {
                      triggers: {
                        ...automation.triggers,
                        [locale]: event.target.value
                          .split("\n")
                          .map((value) => value.trim())
                          .filter(Boolean),
                      },
                    })
                  }
                />
              </div>
              {automation.response_type === "text" ||
              automation.response_type === "carousel" ? (
                <div className="space-y-2">
                  <Label>Response text</Label>
                  <Textarea
                    disabled={!canManage}
                    value={localized(automation.response_text, locale)}
                    onChange={(event) =>
                      update(index, {
                        response_text: {
                          ...automation.response_text,
                          [locale]: event.target.value,
                        },
                      })
                    }
                  />
                </div>
              ) : null}
            </div>
            {automation.response_type === "text" ? (
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={automation.show_menu}
                  disabled={!canManage}
                  onCheckedChange={(checked) =>
                    update(index, { show_menu: checked })
                  }
                />
                Show the main menu after this response
              </label>
            ) : null}
            {automation.response_type === "carousel" ? (
              <div className="space-y-3 border-t pt-3">
                <div className="flex items-center justify-between">
                  <Label>Carousel cards</Label>
                  {canManage ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        update(index, {
                          cards: [
                            ...automation.cards,
                            {
                              title: { [locale]: "New card" },
                              description: { [locale]: "" },
                              cta_label: { [locale]: "Open" },
                              action_type: "open_url",
                              action_value: { [locale]: "https://" },
                              image_url: null,
                            },
                          ],
                        })
                      }
                    >
                      <PlusIcon />
                      Add card
                    </Button>
                  ) : null}
                </div>
                {automation.cards.map((card, cardIndex) => (
                  <div
                    key={card.id ?? cardIndex}
                    className="grid gap-3 rounded-lg bg-muted/30 p-3 sm:grid-cols-[120px_1fr]"
                  >
                    <div className="flex h-28 items-center justify-center overflow-hidden rounded-lg border bg-background">
                      {card.image_url ? (
                        <img
                          src={card.image_url}
                          alt=""
                          className="size-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="size-7 text-muted-foreground" />
                      )}
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Input
                        value={localized(card.title, locale)}
                        disabled={!canManage}
                        placeholder="Title"
                        onChange={(event) =>
                          update(index, {
                            cards: automation.cards.map((item, itemIndex) =>
                              itemIndex === cardIndex
                                ? {
                                    ...item,
                                    title: {
                                      ...item.title,
                                      [locale]: event.target.value,
                                    },
                                  }
                                : item
                            ),
                          })
                        }
                      />
                      <Input
                        value={localized(card.cta_label, locale)}
                        disabled={!canManage}
                        placeholder="CTA label"
                        onChange={(event) =>
                          update(index, {
                            cards: automation.cards.map((item, itemIndex) =>
                              itemIndex === cardIndex
                                ? {
                                    ...item,
                                    cta_label: {
                                      ...item.cta_label,
                                      [locale]: event.target.value,
                                    },
                                  }
                                : item
                            ),
                          })
                        }
                      />
                      <select
                        className={selectClass}
                        value={card.action_type}
                        disabled={!canManage}
                        onChange={(event) =>
                          update(index, {
                            cards: automation.cards.map((item, itemIndex) =>
                              itemIndex === cardIndex
                                ? {
                                    ...item,
                                    action_type: event.target
                                      .value as ViberCardAction,
                                  }
                                : item
                            ),
                          })
                        }
                      >
                        <option value="reply">Automation</option>
                        <option value="open_url">URL</option>
                        <option value="handoff">Handoff</option>
                      </select>
                      <Input
                        value={localized(card.action_value, locale)}
                        disabled={!canManage}
                        placeholder="URL or trigger"
                        onChange={(event) =>
                          update(index, {
                            cards: automation.cards.map((item, itemIndex) =>
                              itemIndex === cardIndex
                                ? {
                                    ...item,
                                    action_value: {
                                      ...item.action_value,
                                      [locale]: event.target.value,
                                    },
                                  }
                                : item
                            ),
                          })
                        }
                      />
                      <Textarea
                        className="sm:col-span-2"
                        value={localized(card.description, locale)}
                        disabled={!canManage}
                        placeholder="Description"
                        onChange={(event) =>
                          update(index, {
                            cards: automation.cards.map((item, itemIndex) =>
                              itemIndex === cardIndex
                                ? {
                                    ...item,
                                    description: {
                                      ...item.description,
                                      [locale]: event.target.value,
                                    },
                                  }
                                : item
                            ),
                          })
                        }
                      />
                      {canManage ? (
                        <div className="flex flex-wrap gap-2 sm:col-span-2">
                          <label className="inline-flex h-8 cursor-pointer items-center rounded-lg border px-3 text-sm hover:bg-accent">
                            <ImageIcon className="mr-2 size-4" />
                            Upload JPEG/PNG
                            <input
                              type="file"
                              accept="image/jpeg,image/png"
                              className="sr-only"
                              onChange={(event) => {
                                const file = event.target.files?.[0]
                                if (file) void upload(card.id, file)
                              }}
                            />
                          </label>
                          {card.image_url ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => void removeImage(card.id)}
                            >
                              Remove image
                            </Button>
                          ) : null}
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="ml-auto text-destructive"
                            onClick={() =>
                              update(index, {
                                cards: automation.cards.filter(
                                  (_, itemIndex) => itemIndex !== cardIndex
                                ),
                              })
                            }
                          >
                            <Trash2Icon />
                            Remove card
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function ViberPreview({
  revision,
  locale,
  automation,
}: {
  revision: ViberExperienceRevision
  locale: ViberLocale
  automation?: ViberAutomation
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-[#7360F2] text-white">
        <CardTitle>Live Viber preview</CardTitle>
        <CardDescription className="text-white/75">
          Draft · {locale === "my" ? "Burmese" : "English"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 bg-[#efeaf7] p-4 dark:bg-[#211d2b]">
        <div className="max-w-[88%] rounded-2xl rounded-bl-sm bg-white p-3 text-sm text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-100">
          {localized(revision.welcome_text, locale) || "Welcome message"}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {revision.menu_buttons.map((button, index) => (
            <div
              key={button.id ?? index}
              className="rounded-lg px-2 py-2 text-center text-xs font-semibold text-white"
              style={{ backgroundColor: button.background_color }}
            >
              {localized(button.label, locale) || "Button"}
            </div>
          ))}
        </div>
        {automation?.response_type === "text" ? (
          <div className="max-w-[88%] rounded-2xl rounded-bl-sm bg-white p-3 text-sm text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-100">
            {localized(automation.response_text, locale) ||
              "Automation response"}
          </div>
        ) : null}
        {automation?.response_type === "carousel" ? (
          <div className="flex snap-x gap-2 overflow-x-auto pb-2">
            {automation.cards.map((card, index) => (
              <div
                key={card.id ?? index}
                className="w-56 shrink-0 snap-start overflow-hidden rounded-xl bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-100"
              >
                {card.image_url ? (
                  <img
                    src={card.image_url}
                    alt=""
                    className="h-28 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-28 items-center justify-center bg-slate-100 dark:bg-slate-700">
                    <ImageIcon />
                  </div>
                )}
                <div className="space-y-1 p-3">
                  <p className="font-semibold">
                    {localized(card.title, locale) || "Card title"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {localized(card.description, locale)}
                  </p>
                  <div className="mt-2 rounded-md bg-[#7360F2] p-2 text-center text-xs font-semibold text-white">
                    {localized(card.cta_label, locale) || "Open"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
