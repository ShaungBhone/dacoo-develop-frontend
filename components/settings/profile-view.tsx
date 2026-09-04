"use client"

import * as React from "react"
import {
  AlignCenterIcon,
  AlignLeftIcon,
  BoldIcon,
  CheckCircle2Icon,
  FileTextIcon,
  ItalicIcon,
  ListIcon,
  MailIcon,
  PaletteIcon,
  TriangleAlertIcon,
  Trash2Icon,
  UnderlineIcon,
  UserRoundIcon,
} from "@/components/ui/icons"

import { useAuth, type User } from "@/contexts/auth-context"
import { ApiError, apiFetch } from "@/lib/api"
import { ImageCropDialog } from "@/components/settings/image-crop-dialog"
import { ImageUploadBox } from "@/components/settings/image-upload-box"
import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Progress } from "@/components/ui/progress"
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
import { Textarea } from "@/components/ui/textarea"
import { TypographyH2, TypographyMuted } from "@/components/ui/typography"
import { cn } from "@/lib/utils"

const MAX_BIO_LENGTH = 1024

type PersonalDetailsDraft = {
  firstName: string
  lastName: string
  email: string
  photoName: string
  photoUrl: string | null
  role: string
  country: string
  timezone: string
  bio: string
}

type PendingPhoto = {
  file: File
  url: string
}

const DEFAULT_BIO =
  "I'm a Product Designer based in Melbourne, Australia. I specialise in UX/UI design, brand strategy, and Webflow development."

const PORTFOLIO_FILES = [
  {
    name: "Tech design requirements.pdf",
    meta: "200 KB of 200 KB",
    status: "Complete",
    progress: 100,
    extension: "PDF",
  },
  {
    name: "Dashboard recording.mp4",
    meta: "6.4 MB of 16 MB",
    status: "Uploading...",
    progress: 40,
    extension: "MP4",
  },
  {
    name: "Dashboard prototype FINAL.fig",
    meta: "3.4 MB of 4.2 MB",
    status: "Uploading...",
    progress: 80,
    extension: "FIG",
  },
] as const

function splitName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)

  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  }
}

function createDraft(user: User): PersonalDetailsDraft {
  const { firstName, lastName } = splitName(user.name)

  return {
    firstName,
    lastName,
    email: user.email,
    photoName: "",
    photoUrl: user.avatar_url ?? null,
    role: "Product Designer",
    country: "australia",
    timezone: "pst",
    bio: DEFAULT_BIO,
  }
}

function fullName(draft: PersonalDetailsDraft) {
  return [draft.firstName, draft.lastName].filter(Boolean).join(" ").trim()
}

function revokeObjectUrl(url: string | null) {
  if (url) {
    URL.revokeObjectURL(url)
  }
}

function draftEquals(left: PersonalDetailsDraft, right: PersonalDetailsDraft) {
  return (
    left.firstName === right.firstName &&
    left.lastName === right.lastName &&
    left.email === right.email &&
    left.photoName === right.photoName &&
    left.photoUrl === right.photoUrl &&
    left.role === right.role &&
    left.country === right.country &&
    left.timezone === right.timezone &&
    left.bio === right.bio
  )
}

function Row({
  title,
  description,
  required = false,
  children,
}: {
  title: string
  description?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:gap-8">
      <FieldContent className="md:max-w-70 md:flex-1">
        <FieldTitle>
          {title}
          {required && <span className="text-primary">*</span>}
        </FieldTitle>
        {description && <FieldDescription>{description}</FieldDescription>}
      </FieldContent>
      <div className="flex w-full min-w-0 flex-col gap-3 md:max-w-xl">
        {children}
      </div>
    </div>
  )
}

function PortfolioFile({ file }: { file: (typeof PORTFOLIO_FILES)[number] }) {
  return (
    <div className="relative flex gap-3 rounded-xl border bg-background p-4">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
        <FileTextIcon aria-hidden="true" className="text-muted-foreground" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2 pr-8">
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="truncate text-sm font-medium">{file.name}</p>
          <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{file.meta}</span>
            <span aria-hidden="true">•</span>
            <span
              className={cn(
                "font-medium",
                file.status === "Complete" && "text-primary"
              )}
            >
              {file.status}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Progress value={file.progress} />
          <span className="w-10 shrink-0 text-right text-sm font-medium">
            {file.progress}%
          </span>
        </div>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="absolute top-2 right-2"
        aria-label={`Remove ${file.name}`}
      >
        <Trash2Icon />
      </Button>
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-7 w-36" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  )
}

export function ProfileView() {
  const { user, isLoading } = useAuth()

  if (isLoading || !user) {
    return <ProfileSkeleton />
  }

  return <ProfileForm key={user.id} user={user} />
}

function ProfileForm({ user }: { user: User }) {
  const { refreshUser } = useAuth()
  const photoInputId = React.useId()
  const portfolioInputId = React.useId()
  const objectUrlsRef = React.useRef<Set<string>>(new Set())
  const pendingPhotoUrlRef = React.useRef<string | null>(null)
  const [draft, setDraft] = React.useState<PersonalDetailsDraft>(() =>
    createDraft(user)
  )
  const [savedDraft, setSavedDraft] = React.useState<PersonalDetailsDraft>(() =>
    createDraft(user)
  )
  const [saving, setSaving] = React.useState(false)
  const [uploadingPhoto, setUploadingPhoto] = React.useState(false)
  const [pendingPhoto, setPendingPhoto] = React.useState<PendingPhoto | null>(
    null
  )
  const [saved, setSaved] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = React.useState<
    Record<string, string[]>
  >({})

  React.useEffect(() => {
    const objectUrls = objectUrlsRef.current

    return () => {
      objectUrls.forEach((url) => revokeObjectUrl(url))
      objectUrls.clear()
    }
  }, [])

  const dirty = !draftEquals(draft, savedDraft)
  const remainingCharacters = Math.max(0, MAX_BIO_LENGTH - draft.bio.length)

  function updateDraft(update: Partial<PersonalDetailsDraft>) {
    setDraft((current) => ({ ...current, ...update }))
    setSaved(false)
    setError(null)
  }

  function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""

    if (!file) return

    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 2 * 1024 * 1024
    ) {
      setError("Choose a PNG, JPG, or WebP image smaller than 2 MB.")
      return
    }

    discardPendingPhoto()

    const url = URL.createObjectURL(file)
    objectUrlsRef.current.add(url)
    pendingPhotoUrlRef.current = url
    setPendingPhoto({ file, url })
    setError(null)
    setSaved(false)
  }

  function discardPendingPhoto() {
    if (pendingPhotoUrlRef.current) {
      revokeObjectUrl(pendingPhotoUrlRef.current)
      objectUrlsRef.current.delete(pendingPhotoUrlRef.current)
      pendingPhotoUrlRef.current = null
    }
    setPendingPhoto(null)
  }

  async function handlePhotoCrop(file: File) {
    discardPendingPhoto()

    const previousPhotoUrl = draft.photoUrl
    const previewUrl = URL.createObjectURL(file)
    objectUrlsRef.current.add(previewUrl)
    setDraft((current) => ({
      ...current,
      photoName: file.name,
      photoUrl: previewUrl,
    }))
    setUploadingPhoto(true)
    setError(null)
    setSaved(false)

    try {
      const body = new FormData()
      body.append("avatar", file)
      const response = await apiFetch<{
        data: { avatar_url: string | null }
      }>("/api/v1/profile/avatar", {
        method: "PATCH",
        body,
      })

      revokeObjectUrl(previewUrl)
      objectUrlsRef.current.delete(previewUrl)
      setDraft((current) => ({
        ...current,
        photoName: "",
        photoUrl: response.data.avatar_url,
      }))
      setSavedDraft((current) => ({
        ...current,
        photoName: "",
        photoUrl: response.data.avatar_url,
      }))
      await refreshUser()
      setSaved(true)
      window.setTimeout(() => setSaved(false), 2500)
    } catch (uploadError) {
      revokeObjectUrl(previewUrl)
      objectUrlsRef.current.delete(previewUrl)
      setDraft((current) => ({
        ...current,
        photoName: "",
        photoUrl: previousPhotoUrl,
      }))
      setError(
        uploadError instanceof ApiError
          ? uploadError.message
          : "Failed to upload profile photo."
      )
    } finally {
      setUploadingPhoto(false)
    }
  }

  function handleCancel() {
    setDraft((current) => {
      if (current.photoUrl !== savedDraft.photoUrl) {
        revokeObjectUrl(current.photoUrl)
        if (current.photoUrl) {
          objectUrlsRef.current.delete(current.photoUrl)
        }
      }
      return { ...savedDraft }
    })
    setFieldErrors({})
    setError(null)
    setSaved(false)
  }

  async function handleSave() {
    if (uploadingPhoto) return

    setSaving(true)
    setSaved(false)
    setError(null)
    setFieldErrors({})

    try {
      await apiFetch("/api/user", {
        method: "PUT",
        body: { name: fullName(draft), email: draft.email },
      })
      await refreshUser()
      setSavedDraft({ ...draft })
      setSaved(true)
      window.setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      if (err instanceof ApiError && err.status === 422 && err.errors) {
        setFieldErrors(err.errors)
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong. Please try again."
        )
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {pendingPhoto && (
        <ImageCropDialog
          open
          imageUrl={pendingPhoto.url}
          fileName={pendingPhoto.file.name}
          mimeType={pendingPhoto.file.type}
          title="Crop profile photo"
          previewLabel="Profile photo crop preview"
          onOpenChange={(open) => {
            if (!open) discardPendingPhoto()
          }}
          onCrop={handlePhotoCrop}
        />
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <TypographyH2 className="text-balance">Personal info</TypographyH2>
          <TypographyMuted>
            Update your photo and personal details here.
          </TypographyMuted>
        </div>
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={!dirty || saving || uploadingPhoto}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!dirty || saving || uploadingPhoto}
          >
            {saving ? (
              <>
                <Spinner />
                Save
              </>
            ) : (
              "Save"
            )}
          </Button>
        </div>
      </div>

      <Separator />

      <FieldGroup className="gap-6">
        <Row title="Name" required>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field data-invalid={!!fieldErrors.name}>
              <FieldLabel htmlFor="profile-first-name" className="sr-only">
                First name
              </FieldLabel>
              <Input
                id="profile-first-name"
                name="given-name"
                autoComplete="given-name"
                value={draft.firstName}
                onChange={(event) =>
                  updateDraft({ firstName: event.target.value })
                }
                disabled={saving}
                aria-invalid={!!fieldErrors.name}
              />
            </Field>
            <Field data-invalid={!!fieldErrors.name}>
              <FieldLabel htmlFor="profile-last-name" className="sr-only">
                Last name
              </FieldLabel>
              <Input
                id="profile-last-name"
                name="family-name"
                autoComplete="family-name"
                value={draft.lastName}
                onChange={(event) =>
                  updateDraft({ lastName: event.target.value })
                }
                disabled={saving}
                aria-invalid={!!fieldErrors.name}
              />
            </Field>
          </div>
          {fieldErrors.name && <FieldError>{fieldErrors.name[0]}</FieldError>}
        </Row>

        <Separator />

        <Row title="Email address" required>
          <Field data-invalid={!!fieldErrors.email}>
            <InputGroup>
              <InputGroupAddon>
                <MailIcon />
              </InputGroupAddon>
              <InputGroupInput
                id="profile-email"
                name="email"
                type="email"
                autoComplete="email"
                value={draft.email}
                onChange={(event) => updateDraft({ email: event.target.value })}
                disabled={saving}
                aria-invalid={!!fieldErrors.email}
              />
            </InputGroup>
            {fieldErrors.email && (
              <FieldError>{fieldErrors.email[0]}</FieldError>
            )}
          </Field>
        </Row>

        <Separator />

        <Row
          title="Your photo"
          description="This will be displayed on your profile."
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Avatar className="size-16" size="lg">
              {draft.photoUrl && <AvatarImage src={draft.photoUrl} alt="" />}
              <AvatarFallback>
                <UserRoundIcon aria-hidden="true" />
              </AvatarFallback>
            </Avatar>
            <ImageUploadBox
              id={photoInputId}
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoChange}
              disabled={saving || uploadingPhoto || pendingPhoto !== null}
              uploading={uploadingPhoto}
              hint="PNG, JPG or WebP (max. 2 MB)"
              className="flex-1 border-primary/60"
            />
          </div>
        </Row>

        <Separator />

        <Row title="Role">
          <Input
            value={draft.role}
            onChange={(event) => updateDraft({ role: event.target.value })}
            disabled={saving}
          />
        </Row>

        <Separator />

        <Row title="Country">
          <Select
            value={draft.country}
            onValueChange={(country) => updateDraft({ country })}
            disabled={saving}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="australia">🇦🇺 Australia</SelectItem>
                <SelectItem value="myanmar">🇲🇲 Myanmar</SelectItem>
                <SelectItem value="singapore">🇸🇬 Singapore</SelectItem>
                <SelectItem value="thailand">🇹🇭 Thailand</SelectItem>
                <SelectItem value="united-states">🇺🇸 United States</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </Row>

        <Separator />

        <Row title="Timezone">
          <Select
            value={draft.timezone}
            onValueChange={(timezone) => updateDraft({ timezone })}
            disabled={saving}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="pst">
                  Pacific Standard Time (PST){" "}
                  <span className="text-muted-foreground">UTC-08:00</span>
                </SelectItem>
                <SelectItem value="mmt">
                  Myanmar Time (MMT){" "}
                  <span className="text-muted-foreground">UTC+06:30</span>
                </SelectItem>
                <SelectItem value="ict">
                  Indochina Time (ICT){" "}
                  <span className="text-muted-foreground">UTC+07:00</span>
                </SelectItem>
                <SelectItem value="sgt">
                  Singapore Time (SGT){" "}
                  <span className="text-muted-foreground">UTC+08:00</span>
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </Row>

        <Separator />

        <Row title="Bio" description="Write a short introduction." required>
          <Field>
            <div className="flex w-fit items-center gap-1 rounded-lg border bg-background p-1 shadow-sm">
              <Button type="button" variant="ghost" size="icon-sm">
                <BoldIcon />
              </Button>
              <Button type="button" variant="ghost" size="icon-sm">
                <ItalicIcon />
              </Button>
              <Button type="button" variant="ghost" size="icon-sm">
                <UnderlineIcon />
              </Button>
              <Separator orientation="vertical" className="h-5" />
              <Button type="button" variant="ghost" size="icon-sm">
                <PaletteIcon />
              </Button>
              <Separator orientation="vertical" className="h-5" />
              <Button type="button" variant="ghost" size="icon-sm">
                <AlignLeftIcon />
              </Button>
              <Button type="button" variant="ghost" size="icon-sm">
                <AlignCenterIcon />
              </Button>
              <Button type="button" variant="ghost" size="icon-sm">
                <ListIcon />
              </Button>
            </div>
            <Textarea
              value={draft.bio}
              onChange={(event) =>
                updateDraft({
                  bio: event.target.value.slice(0, MAX_BIO_LENGTH),
                })
              }
              disabled={saving}
              rows={6}
              className="min-h-40"
            />
            <FieldDescription>
              {remainingCharacters} characters left
            </FieldDescription>
          </Field>
        </Row>

        <Separator />

        <Row
          title="Portfolio projects"
          description="Share a few snippets of your work."
        >
          <ImageUploadBox id={portfolioInputId} onChange={() => undefined} />
          <div className="flex flex-col gap-3">
            {PORTFOLIO_FILES.map((file) => (
              <PortfolioFile key={file.name} file={file} />
            ))}
          </div>
        </Row>
      </FieldGroup>

      {error && (
        <Alert variant="destructive">
          <TriangleAlertIcon aria-hidden="true" />
          <AlertTitle>Couldn&apos;t update your profile</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {saved && (
        <Alert variant="success">
          <CheckCircle2Icon aria-hidden="true" />
          <AlertTitle>Saved</AlertTitle>
          <AlertDescription>Your details have been updated.</AlertDescription>
        </Alert>
      )}

      <Separator />

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={!dirty || saving}
        >
          Cancel
        </Button>
        <Button type="button" onClick={handleSave} disabled={!dirty || saving}>
          {saving ? (
            <>
              <Spinner />
              Save
            </>
          ) : (
            "Save"
          )}
        </Button>
      </div>
    </div>
  )
}
