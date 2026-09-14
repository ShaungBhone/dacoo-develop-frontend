"use client"

import * as React from "react"
import Image from "next/image"
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
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/reui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Bubble, BubbleContent } from "@/components/ui/bubble"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { Message, MessageContent } from "@/components/ui/message"
import { SearchableDropdown } from "@/components/ui/searchable-dropdown"
import { ImageCropDialog } from "@/components/settings/image-crop-dialog"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
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

const MENU_ACTIONS: { value: ViberMenuAction; label: string }[] = [
  { value: "reply", label: "Automation" },
  { value: "open_url", label: "URL" },
  { value: "share-phone", label: "Share phone" },
  { value: "handoff", label: "Handoff" },
]

const RESPONSE_TYPES: { value: ViberResponseType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "menu", label: "Main menu" },
  { value: "carousel", label: "Carousel" },
  { value: "handoff", label: "Human handoff" },
]

const CARD_ACTIONS: { value: ViberCardAction; label: string }[] = [
  { value: "reply", label: "Automation" },
  { value: "open_url", label: "URL" },
  { value: "handoff", label: "Handoff" },
]

export const VIBER_CAROUSEL_IMAGE_REQUIREMENTS = {
  width: 800,
  height: 450,
  maxBytes: 500 * 1024,
  acceptedTypes: ["image/jpeg", "image/png"],
} as const

type PendingCarouselImage = {
  cardId: string
  url: string
}

export function selectLabel<Value extends string>(
  options: ReadonlyArray<{ value: Value; label: string }>,
  value: Value
): string {
  return options.find((option) => option.value === value)?.label ?? value
}

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
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  const enabledLocales = draft.enabled_locales
  const enabledLocaleOptions = LOCALES.filter((item) =>
    enabledLocales.includes(item.value)
  )
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
            <ArrowLeftIcon data-icon="inline-start" />
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
              {busy === "save" ? <Spinner data-icon="inline-start" /> : null}
              Save draft
            </Button>
            <Button
              type="button"
              onClick={() => void publish()}
              disabled={busy !== null || !allComplete}
            >
              {busy === "publish" ? <Spinner data-icon="inline-start" /> : null}
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
                  <CheckCircle2Icon />
                ) : (
                  <TriangleAlertIcon />
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
                  <CardContent>
                    <FieldGroup className="grid gap-4 sm:grid-cols-2">
                      <FieldSet className="sm:col-span-2">
                        <FieldLegend variant="label">
                          Enabled languages
                        </FieldLegend>
                        <FieldDescription>
                          Choose the languages customers can use, then select a
                          default.
                        </FieldDescription>
                        <FieldGroup className="flex-row flex-wrap items-end gap-3">
                          <Field className="flex-1">
                            <FieldLabel htmlFor="viber-enabled-locales">
                              Languages
                            </FieldLabel>
                            <ToggleGroup
                              id="viber-enabled-locales"
                              type="multiple"
                              variant="outline"
                              value={enabledLocales}
                              disabled={!canManage}
                              onValueChange={(value) => {
                                const selected = Array.isArray(value)
                                  ? (value as ViberLocale[])
                                  : value
                                    ? ([value] as ViberLocale[])
                                    : []
                                if (selected.length === 0) return
                                if (!selected.includes(locale)) {
                                  setLocale(selected[0]!)
                                }
                                setDraft((current) =>
                                  current
                                    ? {
                                        ...current,
                                        enabled_locales: selected,
                                        default_locale: selected.includes(
                                          current.default_locale
                                        )
                                          ? current.default_locale
                                          : selected[0]!,
                                      }
                                    : current
                                )
                              }}
                            >
                              {LOCALES.map((option) => (
                                <ToggleGroupItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </ToggleGroupItem>
                              ))}
                            </ToggleGroup>
                          </Field>
                          <Field className="w-32 flex-none">
                            <FieldLabel htmlFor="viber-default-locale">
                              Default
                            </FieldLabel>
                            <Select
                              items={enabledLocaleOptions}
                              value={draft.default_locale}
                              disabled={!canManage}
                              onValueChange={(value) =>
                                setDraft({
                                  ...draft,
                                  default_locale: value as ViberLocale,
                                })
                              }
                            >
                              <SelectTrigger
                                id="viber-default-locale"
                                className="w-full"
                              >
                                <SelectValue>
                                  {selectLabel(
                                    enabledLocaleOptions,
                                    draft.default_locale
                                  )}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  {enabledLocaleOptions.map((option) => (
                                    <SelectItem
                                      key={option.value}
                                      value={option.value}
                                    >
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                          </Field>
                        </FieldGroup>
                      </FieldSet>
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
                        <Field key={field}>
                          <FieldLabel htmlFor={`${field}-${item.value}`}>
                            {label}
                          </FieldLabel>
                          <Textarea
                            id={`${field}-${item.value}`}
                            value={localized(draft[field], item.value)}
                            disabled={!canManage}
                            onChange={(event) =>
                              updateLocalized(field, event.target.value)
                            }
                          />
                          <FieldDescription>{hint}</FieldDescription>
                        </Field>
                      ))}
                    </FieldGroup>
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
                    <CardContent>
                      <FieldGroup>
                        <Field>
                          <FieldLabel htmlFor="viber-preview-conversation">
                            Viber conversation
                          </FieldLabel>
                          <SearchableDropdown
                            id="viber-preview-conversation"
                            options={conversations.map((conversation) => ({
                              id: String(conversation.id),
                              value: String(conversation.id),
                              label: conversation.customer.displayName,
                            }))}
                            placeholder="Select a conversation"
                            searchPlaceholder="Search conversations..."
                            emptyMessage="No Viber conversations yet."
                            value={conversationId}
                            disabled={previewExpiresAt !== null}
                            onValueChange={setConversationId}
                          />
                        </Field>
                        {previewExpiresAt ? (
                          <Alert>
                            <Clock3Icon />
                            <AlertTitle>Preview active</AlertTitle>
                            <AlertDescription>
                              {Math.ceil(remainingSeconds / 60)} minutes left
                              for this contact.
                            </AlertDescription>
                            <AlertAction>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => void stopPreview()}
                                disabled={busy !== null}
                              >
                                Stop
                              </Button>
                            </AlertAction>
                          </Alert>
                        ) : (
                          <Button
                            type="button"
                            className="w-full"
                            onClick={() => void startPreview()}
                            disabled={!conversationId || busy !== null}
                          >
                            {busy === "preview" ? (
                              <Spinner data-icon="inline-start" />
                            ) : (
                              <SendIcon data-icon="inline-start" />
                            )}
                            Send draft to contact
                          </Button>
                        )}
                      </FieldGroup>
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
      <CardHeader>
        <CardTitle>Main menu</CardTitle>
        <CardDescription>
          Automation, website, phone sharing, or human handoff actions.
        </CardDescription>
        {canManage ? (
          <CardAction>
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
              <PlusIcon data-icon="inline-start" />
              Add button
            </Button>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent>
        <FieldGroup>
          {draft.menu_buttons.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <PlusIcon />
                </EmptyMedia>
                <EmptyTitle>No menu buttons</EmptyTitle>
                <EmptyDescription>
                  Add a button so customers can start common actions.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : null}
          {draft.menu_buttons.map((button, index) => (
            <FieldGroup
              key={button.id ?? index}
              className="grid gap-2 rounded-xl border p-3 sm:grid-cols-[1fr_150px_1fr_auto]"
            >
              <Field>
                <FieldLabel className="sr-only">Button label</FieldLabel>
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
              </Field>
              <Field>
                <FieldLabel className="sr-only">Action type</FieldLabel>
                <Select
                  items={MENU_ACTIONS}
                  value={button.action_type}
                  disabled={!canManage}
                  onValueChange={(value) =>
                    setDraft((current) =>
                      current
                        ? {
                            ...current,
                            menu_buttons: current.menu_buttons.map(
                              (item, itemIndex) =>
                                itemIndex === index
                                  ? {
                                      ...item,
                                      action_type: value as ViberMenuAction,
                                    }
                                  : item
                            ),
                          }
                        : current
                    )
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {selectLabel(MENU_ACTIONS, button.action_type)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {MENU_ACTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel className="sr-only">Action value</FieldLabel>
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
              </Field>
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
                  <Trash2Icon data-icon="inline-start" />
                  <span className="sr-only">Remove menu button</span>
                </Button>
              ) : null}
            </FieldGroup>
          ))}
        </FieldGroup>
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
  const pendingImageUrlRef = React.useRef<string | null>(null)
  const [pendingImage, setPendingImage] =
    React.useState<PendingCarouselImage | null>(null)

  React.useEffect(
    () => () => {
      if (pendingImageUrlRef.current) {
        URL.revokeObjectURL(pendingImageUrlRef.current)
      }
    },
    []
  )

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

  function closePendingImage(): void {
    if (pendingImageUrlRef.current) {
      URL.revokeObjectURL(pendingImageUrlRef.current)
      pendingImageUrlRef.current = null
    }
    setPendingImage(null)
  }

  function chooseImage(cardId: string | undefined, file: File): void {
    if (!cardId) {
      toast.info("Save the draft once before uploading this card image.")
      return
    }

    if (
      !VIBER_CAROUSEL_IMAGE_REQUIREMENTS.acceptedTypes.some(
        (type) => type === file.type
      )
    ) {
      toast.error("Choose a JPEG or PNG image.")
      return
    }

    closePendingImage()
    const url = URL.createObjectURL(file)
    pendingImageUrlRef.current = url
    setPendingImage({ cardId, url })
  }

  async function upload(cardId: string, file: File): Promise<boolean> {
    try {
      const experience = await uploadViberCardImage(
        organizationId,
        cardId,
        file
      )
      onExperience(experience)
      setDraft(experience.draft)
      toast.success("Card image uploaded.")
      return true
    } catch (error) {
      toast.error(messageFor(error, "Image upload failed."))
      return false
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
    <>
      {pendingImage ? (
        <ImageCropDialog
          open
          imageUrl={pendingImage.url}
          fileName={`carousel-card-${pendingImage.cardId}.jpg`}
          mimeType="image/jpeg"
          title="Crop carousel image"
          previewLabel="Viber carousel image crop preview"
          description="Drag to position and use the slider to zoom. The uploaded image will be cropped to 800 × 450 px."
          outputWidth={VIBER_CAROUSEL_IMAGE_REQUIREMENTS.width}
          outputHeight={VIBER_CAROUSEL_IMAGE_REQUIREMENTS.height}
          cropShape="rectangle"
          maxFileSizeBytes={VIBER_CAROUSEL_IMAGE_REQUIREMENTS.maxBytes}
          onOpenChange={(open) => {
            if (!open) closePendingImage()
          }}
          onCrop={async (file) => {
            if (await upload(pendingImage.cardId, file)) {
              closePendingImage()
            }
          }}
        />
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>Trigger automations</CardTitle>
          <CardDescription>
            Triggers use exact matching after case and whitespace normalization.
          </CardDescription>
          {canManage ? (
            <CardAction>
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
                <PlusIcon data-icon="inline-start" />
                Add automation
              </Button>
            </CardAction>
          ) : null}
        </CardHeader>
        <CardContent>
          <FieldGroup>
            {draft.automations.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <PlusIcon />
                  </EmptyMedia>
                  <EmptyTitle>No automations</EmptyTitle>
                  <EmptyDescription>
                    Add an exact-match trigger and choose its response.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : null}
            {draft.automations.map((automation, index) => (
              <FieldGroup
                key={automation.id ?? index}
                className="gap-3 rounded-xl border p-4"
              >
                <div className="grid gap-2 sm:grid-cols-[1fr_170px_auto_auto] sm:items-center">
                  <Field>
                    <FieldLabel className="sr-only">Automation name</FieldLabel>
                    <Input
                      value={automation.name}
                      disabled={!canManage}
                      onChange={(event) =>
                        update(index, { name: event.target.value })
                      }
                    />
                  </Field>
                  <Field>
                    <FieldLabel className="sr-only">Response type</FieldLabel>
                    <Select
                      items={RESPONSE_TYPES}
                      value={automation.response_type}
                      disabled={!canManage}
                      onValueChange={(value) =>
                        update(index, {
                          response_type: value as ViberResponseType,
                        })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue>
                          {selectLabel(
                            RESPONSE_TYPES,
                            automation.response_type
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {RESPONSE_TYPES.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field orientation="horizontal">
                    <Switch
                      id={`automation-enabled-${index}`}
                      checked={automation.is_enabled}
                      disabled={!canManage}
                      onCheckedChange={(checked) =>
                        update(index, { is_enabled: checked })
                      }
                    />
                    <FieldLabel htmlFor={`automation-enabled-${index}`}>
                      Enabled
                    </FieldLabel>
                  </Field>
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
                      <Trash2Icon data-icon="inline-start" />
                      <span className="sr-only">Remove automation</span>
                    </Button>
                  ) : null}
                </div>
                <FieldGroup className="grid gap-3 sm:grid-cols-2">
                  <Field>
                    <FieldLabel>Triggers, one per line</FieldLabel>
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
                  </Field>
                  {automation.response_type === "text" ||
                  automation.response_type === "carousel" ? (
                    <Field>
                      <FieldLabel>Response text</FieldLabel>
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
                    </Field>
                  ) : null}
                </FieldGroup>
                {automation.response_type === "text" ? (
                  <Field orientation="horizontal">
                    <Switch
                      id={`automation-show-menu-${index}`}
                      checked={automation.show_menu}
                      disabled={!canManage}
                      onCheckedChange={(checked) =>
                        update(index, { show_menu: checked })
                      }
                    />
                    <FieldLabel htmlFor={`automation-show-menu-${index}`}>
                      Show the main menu after this response
                    </FieldLabel>
                  </Field>
                ) : null}
                {automation.response_type === "carousel" ? (
                  <FieldGroup className="gap-3">
                    <Separator />
                    <div className="flex items-center justify-between">
                      <FieldTitle>Carousel cards</FieldTitle>
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
                          <PlusIcon data-icon="inline-start" />
                          Add card
                        </Button>
                      ) : null}
                    </div>
                    {automation.cards.length === 0 ? (
                      <Empty>
                        <EmptyHeader>
                          <EmptyMedia variant="icon">
                            <ImageIcon />
                          </EmptyMedia>
                          <EmptyTitle>No carousel cards</EmptyTitle>
                          <EmptyDescription>
                            Add a card, save the draft, then upload its image.
                          </EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    ) : null}
                    {automation.cards.map((card, cardIndex) => (
                      <FieldGroup
                        key={card.id ?? cardIndex}
                        className="grid gap-3 rounded-lg bg-muted/30 p-3 sm:grid-cols-[120px_1fr]"
                      >
                        <div className="flex aspect-video items-center justify-center overflow-hidden rounded-lg border bg-background">
                          {card.image_url ? (
                            <Image
                              src={card.image_url}
                              alt={
                                localized(card.title, locale) ||
                                "Carousel card image"
                              }
                              width={120}
                              height={68}
                              unoptimized
                              className="size-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="size-7 text-muted-foreground" />
                          )}
                        </div>
                        <FieldGroup className="grid gap-2 sm:grid-cols-2">
                          <Field>
                            <FieldLabel className="sr-only">
                              Card title
                            </FieldLabel>
                            <Input
                              value={localized(card.title, locale)}
                              disabled={!canManage}
                              placeholder="Title"
                              onChange={(event) =>
                                update(index, {
                                  cards: automation.cards.map(
                                    (item, itemIndex) =>
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
                          </Field>
                          <Field>
                            <FieldLabel className="sr-only">
                              CTA label
                            </FieldLabel>
                            <Input
                              value={localized(card.cta_label, locale)}
                              disabled={!canManage}
                              placeholder="CTA label"
                              onChange={(event) =>
                                update(index, {
                                  cards: automation.cards.map(
                                    (item, itemIndex) =>
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
                          </Field>
                          <Field>
                            <FieldLabel className="sr-only">
                              Card action type
                            </FieldLabel>
                            <Select
                              items={CARD_ACTIONS}
                              value={card.action_type}
                              disabled={!canManage}
                              onValueChange={(value) =>
                                update(index, {
                                  cards: automation.cards.map(
                                    (item, itemIndex) =>
                                      itemIndex === cardIndex
                                        ? {
                                            ...item,
                                            action_type:
                                              value as ViberCardAction,
                                          }
                                        : item
                                  ),
                                })
                              }
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue>
                                  {selectLabel(CARD_ACTIONS, card.action_type)}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  {CARD_ACTIONS.map((option) => (
                                    <SelectItem
                                      key={option.value}
                                      value={option.value}
                                    >
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                          </Field>
                          <Field>
                            <FieldLabel className="sr-only">
                              Card action value
                            </FieldLabel>
                            <Input
                              value={localized(card.action_value, locale)}
                              disabled={!canManage}
                              placeholder="URL or trigger"
                              onChange={(event) =>
                                update(index, {
                                  cards: automation.cards.map(
                                    (item, itemIndex) =>
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
                          </Field>
                          <Field className="sm:col-span-2">
                            <FieldLabel className="sr-only">
                              Card description
                            </FieldLabel>
                            <Textarea
                              value={localized(card.description, locale)}
                              disabled={!canManage}
                              placeholder="Description"
                              onChange={(event) =>
                                update(index, {
                                  cards: automation.cards.map(
                                    (item, itemIndex) =>
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
                          </Field>
                          {canManage ? (
                            <Field className="sm:col-span-2">
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  render={<label />}
                                  nativeButton={false}
                                >
                                  <ImageIcon data-icon="inline-start" />
                                  Choose &amp; crop image
                                  <input
                                    type="file"
                                    accept={VIBER_CAROUSEL_IMAGE_REQUIREMENTS.acceptedTypes.join(
                                      ","
                                    )}
                                    className="sr-only"
                                    onChange={(event) => {
                                      const file = event.target.files?.[0]
                                      event.target.value = ""
                                      if (file) chooseImage(card.id, file)
                                    }}
                                  />
                                </Button>
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
                                        (_, itemIndex) =>
                                          itemIndex !== cardIndex
                                      ),
                                    })
                                  }
                                >
                                  <Trash2Icon data-icon="inline-start" />
                                  Remove card
                                </Button>
                              </div>
                              <FieldDescription>
                                Recommended: 800 × 450 px (16:9). JPEG or PNG,
                                maximum 500 KB. You can reposition and crop
                                after choosing a file.
                                {!card.id
                                  ? " Save the draft before uploading."
                                  : ""}
                              </FieldDescription>
                            </Field>
                          ) : null}
                        </FieldGroup>
                      </FieldGroup>
                    ))}
                  </FieldGroup>
                ) : null}
              </FieldGroup>
            ))}
          </FieldGroup>
        </CardContent>
      </Card>
    </>
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
    <Card>
      <CardHeader>
        <CardTitle>Live Viber preview</CardTitle>
        <CardDescription>
          Draft · {locale === "my" ? "Burmese" : "English"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 bg-muted/40 py-4">
        <Message align="start">
          <MessageContent>
            <Bubble variant="outline" align="start">
              <BubbleContent>
                {localized(revision.welcome_text, locale) || "Welcome message"}
              </BubbleContent>
            </Bubble>
          </MessageContent>
        </Message>
        <div className="grid grid-cols-2 gap-2">
          {revision.menu_buttons.map((button, index) => (
            <Button
              key={button.id ?? index}
              type="button"
              size="sm"
              variant="secondary"
              disabled
            >
              {localized(button.label, locale) || "Button"}
            </Button>
          ))}
        </div>
        {automation?.response_type === "text" ? (
          <Message align="start">
            <MessageContent>
              <Bubble variant="outline" align="start">
                <BubbleContent>
                  {localized(automation.response_text, locale) ||
                    "Automation response"}
                </BubbleContent>
              </Bubble>
            </MessageContent>
          </Message>
        ) : null}
        {automation?.response_type === "carousel" ? (
          <div className="flex snap-x gap-2 overflow-x-auto pb-2">
            {automation.cards.map((card, index) => (
              <Card
                key={card.id ?? index}
                size="sm"
                className="w-56 shrink-0 snap-start"
              >
                {card.image_url ? (
                  <Image
                    src={card.image_url}
                    alt={localized(card.title, locale) || "Carousel card image"}
                    width={224}
                    height={126}
                    unoptimized
                    className="aspect-video w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-video items-center justify-center bg-muted">
                    <ImageIcon />
                  </div>
                )}
                <CardHeader>
                  <CardTitle>
                    {localized(card.title, locale) || "Card title"}
                  </CardTitle>
                  <CardDescription>
                    {localized(card.description, locale)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button type="button" size="sm" className="w-full" disabled>
                    {localized(card.cta_label, locale) || "Open"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
