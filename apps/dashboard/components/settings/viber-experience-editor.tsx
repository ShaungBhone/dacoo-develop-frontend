"use client"

import * as React from "react"
import Image from "next/image"
import { toast } from "sonner"
import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  FileTextIcon,
  ImageIcon,
  ListIcon,
  MessageSquareIcon,
  PanelLeftIcon,
  PanelRightIcon,
  PlusIcon,
  SaveIcon,
  SettingsIcon,
  SlidersHorizontalIcon,
  Trash2Icon,
  TriangleAlertIcon,
  UploadIcon,
  WorkflowIcon,
  type LucideIcon,
} from "@/components/ui/icons"

import { ApiError } from "@/lib/api"
import { cn } from "@/lib/utils"
import { fetchConversations, type Conversation } from "@/components/inbox/api"
import { useIsMobile } from "@/hooks/use-mobile"
import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import {
  Frame,
  FrameDescription,
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
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
import { ImageCropDialog } from "@/components/settings/image-crop-dialog"
import { ViberMobilePreview } from "@/components/settings/viber-mobile-preview"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { ResponsiveSidePanel } from "@/components/ui/responsive-side-panel"
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

export type ViberSection =
  "overview" | "all" | "messages" | "menu" | "automations"

export const VIBER_SECTION_LABELS: Record<ViberSection, string> = {
  overview: "Overview",
  all: "All Settings",
  messages: "Messages",
  menu: "Main Menu",
  automations: "Automations",
}

export function enabledLocalesAfterChange(
  enabledLocales: ViberLocale[],
  localeToUpdate: ViberLocale,
  isEnabled: boolean
): ViberLocale[] {
  return LOCALES.filter((option) =>
    isEnabled
      ? [...enabledLocales, localeToUpdate].includes(option.value)
      : enabledLocales.includes(option.value) && option.value !== localeToUpdate
  ).map((option) => option.value)
}

export type ViberRevisionSummary = {
  isComplete: boolean
  enabledLocaleLabels: string[]
  defaultLocaleLabel: string
  menuButtonCount: number
  enabledAutomationCount: number
}

export function viberRevisionSummary(
  revision: ViberExperienceRevision
): ViberRevisionSummary {
  const enabledLocales = revision.enabled_locales

  return {
    isComplete: enabledLocales.every((item) => localeComplete(revision, item)),
    enabledLocaleLabels: LOCALES.filter((item) =>
      enabledLocales.includes(item.value)
    ).map((item) => item.label),
    defaultLocaleLabel: selectLabel(LOCALES, revision.default_locale),
    menuButtonCount: revision.menu_buttons.length,
    enabledAutomationCount: revision.automations.filter(
      (automation) => automation.is_enabled
    ).length,
  }
}

function ViberSettingsNav({
  section,
  onSectionChange,
  revision,
  className,
}: {
  section: ViberSection
  onSectionChange: (section: ViberSection) => void
  revision: ViberExperienceRevision
  className?: string
}) {
  const items: Array<{
    key: ViberSection
    label: string
    icon: LucideIcon
    count?: number
  }> = [
    {
      key: "overview",
      label: VIBER_SECTION_LABELS.overview,
      icon: FileTextIcon,
    },
    {
      key: "all",
      label: VIBER_SECTION_LABELS.all,
      icon: SlidersHorizontalIcon,
    },
    {
      key: "messages",
      label: VIBER_SECTION_LABELS.messages,
      icon: MessageSquareIcon,
    },
    {
      key: "menu",
      label: VIBER_SECTION_LABELS.menu,
      icon: ListIcon,
      count: revision.menu_buttons.length,
    },
    {
      key: "automations",
      label: VIBER_SECTION_LABELS.automations,
      icon: WorkflowIcon,
      count: revision.automations.filter((automation) => automation.is_enabled)
        .length,
    },
  ]

  return (
    <nav
      aria-label="Viber configuration sections"
      className={cn("flex flex-col gap-0.5", className)}
    >
      {items.map((item) => {
        const Icon = item.icon
        const isActive = section === item.key

        return (
          <button
            key={item.key}
            type="button"
            aria-current={isActive ? "page" : undefined}
            onClick={() => onSectionChange(item.key)}
            className={cn(
              "flex h-9 w-full cursor-pointer items-center gap-2 rounded-md px-2 text-sm transition-colors",
              isActive
                ? "bg-muted font-medium text-foreground"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <Icon
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <span className="min-w-0 flex-1 truncate text-start">
              {item.label}
            </span>
            {typeof item.count === "number" ? (
              <span className="shrink-0 text-xs font-normal text-muted-foreground tabular-nums">
                {item.count}
              </span>
            ) : null}
          </button>
        )
      })}
    </nav>
  )
}

function ViberOverview({
  experience,
  revision,
  summary,
}: {
  experience: ViberExperience
  revision: ViberExperienceRevision
  summary: ViberRevisionSummary
}) {
  const statusLabel = experience.published ? "Published" : "Draft only"

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-6 @4xl/viber:grid-cols-[minmax(0,1fr)_24rem]">
      <Frame>
        <FrameHeader>
          <FrameTitle>Publishing readiness</FrameTitle>
          <FrameDescription>
            A quick check of the content required for every enabled language.
          </FrameDescription>
        </FrameHeader>
        <FramePanel className="flex min-h-64 items-center justify-center">
          <div className="flex max-w-lg flex-col items-center gap-4 text-center">
            <div
              className={cn(
                "flex size-14 items-center justify-center rounded-full",
                summary.isComplete
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
              )}
            >
              {summary.isComplete ? (
                <CheckCircle2Icon className="size-7" />
              ) : (
                <TriangleAlertIcon className="size-7" />
              )}
            </div>
            <div className="space-y-1.5">
              <h2 className="text-xl font-semibold tracking-tight">
                {summary.isComplete
                  ? "Ready to publish"
                  : "Configuration needs attention"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {summary.isComplete
                  ? "All enabled languages have the messages and automation content required for publishing."
                  : "Complete the messages, menu actions, and enabled automations for every enabled language."}
              </p>
            </div>
          </div>
        </FramePanel>
        <FrameFooter className="flex-row items-center justify-between">
          <span className="text-sm text-muted-foreground">Current draft</span>
          <Badge variant={summary.isComplete ? "outline" : "secondary"}>
            {summary.isComplete ? "Complete" : "Incomplete"}
          </Badge>
        </FrameFooter>
      </Frame>

      <Frame>
        <FrameHeader>
          <FrameTitle>Configuration summary</FrameTitle>
          <FrameDescription>The active draft at a glance.</FrameDescription>
        </FrameHeader>
        <FramePanel fit className="p-0">
          <Table>
            <TableBody>
              <TableRow>
                <TableCell className="text-muted-foreground">Status</TableCell>
                <TableCell className="text-right font-medium">
                  {statusLabel}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-muted-foreground">
                  Default language
                </TableCell>
                <TableCell className="text-right font-medium">
                  {summary.defaultLocaleLabel}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-muted-foreground">
                  Enabled languages
                </TableCell>
                <TableCell className="text-right font-medium">
                  {summary.enabledLocaleLabels.join(", ")}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-muted-foreground">
                  Menu buttons
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {summary.menuButtonCount}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-muted-foreground">
                  Enabled automations
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {summary.enabledAutomationCount}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </FramePanel>
        <FrameFooter>
          <span className="text-xs text-muted-foreground">
            Draft updated {revision.updated_at ? "recently" : "in this editor"}.
          </span>
        </FrameFooter>
      </Frame>
    </div>
  )
}

function GeneralMessagesSection({
  revision,
  locale,
  canManage,
  onChange,
}: {
  revision: ViberExperienceRevision
  locale: ViberLocale
  canManage: boolean
  onChange: (
    field: "welcome_text" | "menu_text" | "fallback_text" | "handoff_text",
    value: string
  ) => void
}) {
  const fields = [
    [
      "welcome_text",
      "Welcome message",
      "Sent when a customer opens the Viber bot.",
    ],
    ["menu_text", "Menu message", "Shown with the main menu."],
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

  return (
    <Frame>
      <FrameHeader>
        <FrameTitle>General messages</FrameTitle>
        <FrameDescription>
          Edit the core conversation copy for the selected language.
        </FrameDescription>
      </FrameHeader>
      <FramePanel>
        <FieldGroup className="grid gap-4 sm:grid-cols-2">
          {fields.map(([field, label, hint]) => (
            <Field key={field}>
              <FieldLabel htmlFor={`${field}-${locale}`}>{label}</FieldLabel>
              <Textarea
                id={`${field}-${locale}`}
                value={localized(revision[field], locale)}
                disabled={!canManage}
                onChange={(event) => onChange(field, event.target.value)}
              />
              <FieldDescription>{hint}</FieldDescription>
            </Field>
          ))}
        </FieldGroup>
      </FramePanel>
      <FrameFooter className="flex-row items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {selectLabel(LOCALES, locale)} content
        </span>
        <Badge
          variant={localeComplete(revision, locale) ? "outline" : "secondary"}
        >
          {localeComplete(revision, locale) ? "Complete" : "Incomplete"}
        </Badge>
      </FrameFooter>
    </Frame>
  )
}

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
  const isMobile = useIsMobile()
  const [experience, setExperience] = React.useState<ViberExperience | null>(
    null
  )
  const [draft, setDraft] = React.useState<ViberExperienceRevision | null>(null)
  const [locale, setLocale] = React.useState<ViberLocale>("en")
  const [section, setSection] = React.useState<ViberSection>("overview")
  const [navigationOpen, setNavigationOpen] = React.useState(false)
  const [previewOpen, setPreviewOpen] = React.useState(false)
  const [conversations, setConversations] = React.useState<Conversation[]>([])
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

  async function startPreview(conversationId: string): Promise<boolean> {
    if (!conversationId || previewConversationId) return false
    const saved = await save()
    if (!saved) return false
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
      return true
    } catch (previewError) {
      setError(messageFor(previewError, "Failed to start the Viber preview."))
      return false
    } finally {
      setBusy(null)
    }
  }

  async function stopPreview(): Promise<boolean> {
    if (!previewConversationId) return false
    setBusy("stop-preview")
    try {
      await stopViberPreview(organizationId, previewConversationId)
      setPreviewExpiresAt(null)
      setPreviewConversationId(null)
      toast.success("Preview session stopped.")
      return true
    } catch (previewError) {
      setError(messageFor(previewError, "Failed to stop the preview."))
      return false
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
  const summary = viberRevisionSummary(draft)
  const allComplete = summary.isComplete
  const currentAutomation = draft.automations[0]

  function setLocaleEnabled(
    localeToUpdate: ViberLocale,
    isEnabled: boolean
  ): void {
    const selectedLocales = enabledLocalesAfterChange(
      enabledLocales,
      localeToUpdate,
      isEnabled
    )

    if (selectedLocales.length === 0) return

    if (!selectedLocales.includes(locale)) {
      setLocale(selectedLocales[0]!)
    }

    setDraft((current) =>
      current
        ? {
            ...current,
            enabled_locales: selectedLocales,
            default_locale: selectedLocales.includes(current.default_locale)
              ? current.default_locale
              : selectedLocales[0]!,
          }
        : current
    )
  }

  const sectionContent =
    section === "overview" ? (
      <ViberOverview
        experience={experience}
        revision={draft}
        summary={summary}
      />
    ) : section === "all" ? (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <GeneralMessagesSection
          revision={draft}
          locale={locale}
          canManage={canManage}
          onChange={updateLocalized}
        />
        <MenuSection
          draft={draft}
          locale={locale}
          canManage={canManage}
          setDraft={setDraft}
        />
        <AutomationSection
          draft={draft}
          locale={locale}
          canManage={canManage}
          setDraft={setDraft}
          onExperience={setExperience}
          organizationId={organizationId}
        />
      </div>
    ) : section === "messages" ? (
      <div className="mx-auto w-full max-w-4xl">
        <GeneralMessagesSection
          revision={draft}
          locale={locale}
          canManage={canManage}
          onChange={updateLocalized}
        />
      </div>
    ) : section === "menu" ? (
      <div className="mx-auto w-full max-w-4xl">
        <MenuSection
          draft={draft}
          locale={locale}
          canManage={canManage}
          setDraft={setDraft}
        />
      </div>
    ) : (
      <div className="mx-auto w-full max-w-4xl">
        <AutomationSection
          draft={draft}
          locale={locale}
          canManage={canManage}
          setDraft={setDraft}
          onExperience={setExperience}
          organizationId={organizationId}
        />
      </div>
    )

  const languageSettings = (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            aria-label="Language settings"
          />
        }
      >
        <SettingsIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-52">
        <DropdownMenuLabel>Available to customers</DropdownMenuLabel>
        {LOCALES.map((option) => {
          const isEnabled = enabledLocales.includes(option.value)

          return (
            <DropdownMenuCheckboxItem
              key={option.value}
              checked={isEnabled}
              disabled={isEnabled && enabledLocales.length === 1}
              onSelect={(event) => event.preventDefault()}
              onCheckedChange={(checked) =>
                setLocaleEnabled(option.value, checked)
              }
            >
              {option.label}
            </DropdownMenuCheckboxItem>
          )
        })}
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Default language</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={draft.default_locale}
          onValueChange={(value) =>
            setDraft({ ...draft, default_locale: value as ViberLocale })
          }
        >
          {enabledLocaleOptions.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  const localeSelect = (
    <Select
      items={enabledLocaleOptions}
      value={locale}
      onValueChange={(value) => setLocale(value as ViberLocale)}
    >
      <SelectTrigger aria-label="Message language" className="w-28">
        <SelectValue>{selectLabel(enabledLocaleOptions, locale)}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {enabledLocaleOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {localeComplete(draft, option.value) ? (
                <CheckCircle2Icon />
              ) : (
                <TriangleAlertIcon />
              )}
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )

  const previewPanel = (
    <div className="h-full min-h-0 overflow-hidden">
      {draft ? (
        <ViberMobilePreview
          key={`${locale}-${currentAutomation?.id ?? "overview"}`}
          revision={draft}
          locale={locale}
          automation={currentAutomation}
          onClose={() => setPreviewOpen(false)}
          sendTest={
            canManage
              ? {
                  conversations: conversations.map((conversation) => ({
                    id: String(conversation.id),
                    label: conversation.customer.displayName,
                  })),
                  activeConversationId: previewConversationId,
                  remainingSeconds,
                  disabled: busy !== null,
                  status:
                    busy === "preview"
                      ? "starting"
                      : busy === "stop-preview"
                        ? "stopping"
                        : "idle",
                  onStart: startPreview,
                  onStop: stopPreview,
                }
              : undefined
          }
        />
      ) : null}
    </div>
  )

  const mobileContent = (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-background px-4 py-2 sm:hidden">
        <Sheet open={navigationOpen} onOpenChange={setNavigationOpen}>
          <SheetTrigger render={<Button variant="outline" size="sm" />}>
            <PanelLeftIcon data-icon="inline-start" />
            {VIBER_SECTION_LABELS[section]}
          </SheetTrigger>
          <SheetContent side="left">
            <SheetHeader>
              <SheetTitle>Viber configuration</SheetTitle>
              <SheetDescription>
                Choose a section to configure the Viber experience.
              </SheetDescription>
            </SheetHeader>
            <ViberSettingsNav
              section={section}
              onSectionChange={(next) => {
                setSection(next)
                setNavigationOpen(false)
              }}
              revision={draft}
              className="px-4 pb-6"
            />
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-1">
          {localeSelect}
          {canManage ? languageSettings : null}
        </div>
      </div>
      <div className="@container/viber flex scrollbar-thin min-h-0 min-w-0 flex-1 flex-col overflow-y-auto p-4 lg:p-6">
        {error ? (
          <Alert variant="destructive" className="mb-6">
            <TriangleAlertIcon />
            <AlertTitle>Viber configuration needs attention</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        {sectionContent}
      </div>
    </div>
  )

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background text-foreground">
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-background px-2 lg:px-4">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={onBack}
            className="shrink-0"
          >
            <ArrowLeftIcon />
            <span className="sr-only">Back to integrations</span>
          </Button>
          <div className="flex min-w-0 flex-col gap-0.5">
            <div className="flex min-w-0 items-center gap-2 whitespace-nowrap">
              <div className="flex min-w-0 items-center gap-1.5 text-sm">
                <button
                  type="button"
                  onClick={onBack}
                  className="cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
                >
                  Integrations
                </button>
                <span className="text-muted-foreground/60">/</span>
                <span className="truncate font-semibold">Viber</span>
              </div>
              <Badge variant={experience.published ? "outline" : "secondary"}>
                {experience.published ? "Published" : "Draft only"}
              </Badge>
            </div>
            <p className="hidden truncate text-xs whitespace-nowrap text-muted-foreground sm:block">
              {canManage
                ? "Configure messages, menu actions, automations, and testing."
                : "Published configuration. Manage integrations permission is required to edit."}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 whitespace-nowrap">
          <div className="hidden items-center gap-1 sm:flex">
            {localeSelect}
            {canManage ? languageSettings : null}
          </div>
          {canManage ? (
            <ButtonGroup aria-label="Viber draft actions">
              <Button
                type="button"
                variant="outline"
                onClick={() => void save()}
                disabled={busy !== null}
              >
                {busy === "save" ? <Spinner /> : <SaveIcon />}
                <span className="hidden lg:inline">Save draft</span>
                <span className="sr-only lg:hidden">Save draft</span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label="More Viber draft actions"
                      disabled={busy !== null}
                    />
                  }
                >
                  {busy === "publish" ? <Spinner /> : <ChevronDownIcon />}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36">
                  <DropdownMenuItem
                    disabled={busy !== null || !allComplete}
                    onClick={() => void publish()}
                  >
                    <UploadIcon />
                    Publish
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </ButtonGroup>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            aria-label="Toggle Viber preview"
            aria-pressed={previewOpen}
            className="aria-pressed:bg-muted"
            onClick={() => setPreviewOpen((open) => !open)}
          >
            <PanelRightIcon />
          </Button>
        </div>
      </header>

      {isMobile ? (
        <>
          {mobileContent}
          <ResponsiveSidePanel
            id="viber-preview-panel"
            isMobile
            open={previewOpen}
            onOpenChange={setPreviewOpen}
            title="Preview and test"
            description="Review this draft and send it to an existing Viber contact."
            mobileClassName="gap-0 p-0"
            mobileHeaderClassName="sr-only"
            showMobileCloseButton={false}
          >
            {previewPanel}
          </ResponsiveSidePanel>
        </>
      ) : (
        <ResizablePanelGroup
          key={previewOpen ? "preview-open" : "preview-closed"}
          className="min-h-0 flex-1 overflow-hidden"
        >
          <ResizablePanel
            id="viber-settings-nav-panel"
            defaultSize="18%"
            minSize="14%"
            maxSize="26%"
            className="min-w-0"
          >
            <aside className="flex h-full flex-col bg-sidebar">
              <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto p-3">
                <ViberSettingsNav
                  section={section}
                  onSectionChange={setSection}
                  revision={draft}
                />
              </div>
            </aside>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel
            id="viber-settings-content-panel"
            defaultSize={previewOpen ? "52%" : "82%"}
            minSize="35%"
            className="min-h-0 min-w-0"
          >
            {mobileContent}
          </ResizablePanel>
          <ResponsiveSidePanel
            id="viber-preview-panel"
            isMobile={false}
            open={previewOpen}
            onOpenChange={setPreviewOpen}
            title="Preview and test"
            description="Review this draft and send it to an existing Viber contact."
          >
            {previewPanel}
          </ResponsiveSidePanel>
        </ResizablePanelGroup>
      )}
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
    <Frame>
      <FrameHeader className="flex-row items-start justify-between gap-4">
        <div>
          <FrameTitle>Main menu</FrameTitle>
          <FrameDescription>
            Automation, website, phone sharing, or human handoff actions.
          </FrameDescription>
        </div>
        {canManage ? (
          <Button
            type="button"
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
        ) : null}
      </FrameHeader>
      <FramePanel>
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
      </FramePanel>
      <FrameFooter className="flex-row items-center justify-between">
        <span className="text-sm text-muted-foreground">Menu actions</span>
        <span className="text-sm font-medium tabular-nums">
          {draft.menu_buttons.length}
        </span>
      </FrameFooter>
    </Frame>
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
      <Frame>
        <FrameHeader className="flex-row items-start justify-between gap-4">
          <div>
            <FrameTitle>Trigger automations</FrameTitle>
            <FrameDescription>
              Triggers use exact matching after case and whitespace
              normalization.
            </FrameDescription>
          </div>
          {canManage ? (
            <Button
              type="button"
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
          ) : null}
        </FrameHeader>
        <FramePanel>
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
                                    variant="ghost"
                                    onClick={() => void removeImage(card.id)}
                                  >
                                    Remove image
                                  </Button>
                                ) : null}
                                <Button
                                  type="button"
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
        </FramePanel>
        <FrameFooter className="flex-row items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Enabled automations
          </span>
          <span className="text-sm font-medium tabular-nums">
            {
              draft.automations.filter((automation) => automation.is_enabled)
                .length
            }
          </span>
        </FrameFooter>
      </Frame>
    </>
  )
}
