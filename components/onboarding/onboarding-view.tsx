"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  LoaderCircleIcon,
  TriangleAlertIcon,
} from "@/components/ui/icons"

import { AuthSplitShell } from "@/components/auth/auth-split-shell"
import {
  OnboardingPreview,
  type OnboardingPreviewData,
} from "@/components/onboarding/onboarding-preview"
import { ImageCropDialog } from "@/components/settings/image-crop-dialog"
import { ImageUploadBox } from "@/components/settings/image-upload-box"
import {
  createWorkspace,
  fetchWorkspaceLanguages,
  fetchWorkspaceProfile,
  fetchWorkspaceTimezones,
  updateWorkspaceProfile,
  uploadWorkspaceLogo,
  type WorkspaceLanguage,
  type WorkspaceTimezone,
} from "@/components/settings/workspace-profile-api"
import {
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "@/components/reui/stepper"
import { Alert, AlertDescription } from "@/components/reui/alert"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { SearchableDropdown } from "@/components/ui/searchable-dropdown"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/contexts/auth-context"
import { useTranslation } from "@/contexts/language-context"
import { useOrganization } from "@/contexts/organization-context"
import { ApiError, apiFetch } from "@/lib/api"

type Step = "profile" | "workspace"

const ONBOARDING_STEPS: { id: Step; title: string }[] = [
  { id: "profile", title: "Profile" },
  { id: "workspace", title: "Workspace" },
]

type PendingImage = {
  file: File
  url: string
  target: "avatar" | "workspace"
}

type ProfileDraft = {
  name: string
  email: string
  avatarFile: File | null
  avatarUrl: string | null
  originalAvatarUrl: string | null
}

type WorkspaceDraft = {
  name: string
  language: string
  timezone: string
  logoFile: File | null
  logoUrl: string | null
  originalLogoUrl: string | null
}

const EMPTY_PROFILE: ProfileDraft = {
  name: "",
  email: "",
  avatarFile: null,
  avatarUrl: null,
  originalAvatarUrl: null,
}

const EMPTY_WORKSPACE: WorkspaceDraft = {
  name: "",
  language: "",
  timezone: "",
  logoFile: null,
  logoUrl: null,
  originalLogoUrl: null,
}

function isObjectUrl(value: string | null) {
  return value?.startsWith("blob:") ?? false
}

function validateImage(file: File) {
  return (
    ["image/jpeg", "image/png", "image/webp"].includes(file.type) &&
    file.size <= 2 * 1024 * 1024
  )
}

export function OnboardingView() {
  const router = useRouter()
  const { locale } = useTranslation()
  const {
    user,
    isLoading: authLoading,
    refreshUser,
    completeOnboarding,
  } = useAuth()
  const { activeOrganization, setActiveOrganizationId } = useOrganization()
  const selectedOrganization =
    activeOrganization ?? user?.organizations?.[0] ?? null
  const selectedOrganizationId = selectedOrganization?.id ?? null
  const userId = user?.id ?? null
  const workspaceLoadKey = selectedOrganizationId ?? "new"
  const canEditWorkspace =
    selectedOrganization === null ||
    selectedOrganization.is_owner === true ||
    selectedOrganization.role === "admin"

  const [step, setStep] = React.useState<Step>("profile")
  const [profile, setProfile] = React.useState<ProfileDraft>(EMPTY_PROFILE)
  const [workspace, setWorkspace] =
    React.useState<WorkspaceDraft>(EMPTY_WORKSPACE)
  const [languages, setLanguages] = React.useState<WorkspaceLanguage[]>([])
  const [timezones, setTimezones] = React.useState<WorkspaceTimezone[]>([])
  const [pendingImage, setPendingImage] = React.useState<PendingImage | null>(
    null
  )
  const [loadedWorkspaceKey, setLoadedWorkspaceKey] = React.useState<
    number | "new" | null
  >(null)
  const [saving, setSaving] = React.useState(false)
  const [skipping, setSkipping] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = React.useState<
    Record<string, string[]>
  >({})
  const initializedProfileRef = React.useRef(false)

  React.useEffect(() => {
    if (!user || initializedProfileRef.current) return

    initializedProfileRef.current = true
    setProfile({
      name: user.name,
      email: user.email,
      avatarFile: null,
      avatarUrl: user.avatar_url,
      originalAvatarUrl: user.avatar_url,
    })
  }, [user])

  React.useEffect(() => {
    if (userId === null) return

    let cancelled = false

    const profileRequest = selectedOrganizationId
      ? fetchWorkspaceProfile(selectedOrganizationId)
      : Promise.resolve(null)

    void Promise.all([
      profileRequest,
      fetchWorkspaceLanguages(),
      fetchWorkspaceTimezones(),
    ])
      .then(([workspaceProfile, nextLanguages, nextTimezones]) => {
        if (cancelled) return

        setLanguages(nextLanguages)
        setTimezones(nextTimezones)

        const savedLocale = workspaceProfile?.settings?.workspace?.locale
        const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
        const defaultTimezone = nextTimezones.some(
          (option) => option.zone_name === browserTimezone
        )
          ? browserTimezone
          : (nextTimezones.find((option) => option.zone_name === "Asia/Bangkok")
              ?.zone_name ?? "")

        setWorkspace({
          name: workspaceProfile?.name ?? "",
          language: savedLocale?.language ?? locale,
          timezone: savedLocale?.timezone ?? defaultTimezone,
          logoFile: null,
          logoUrl: workspaceProfile?.logo_url ?? null,
          originalLogoUrl: workspaceProfile?.logo_url ?? null,
        })
        setError(null)
      })
      .catch((loadError) => {
        if (cancelled) return
        setError(
          loadError instanceof ApiError
            ? loadError.message
            : "Could not load workspace setup options."
        )
      })
      .finally(() => {
        if (!cancelled) setLoadedWorkspaceKey(workspaceLoadKey)
      })

    return () => {
      cancelled = true
    }
  }, [locale, selectedOrganizationId, userId, workspaceLoadKey])

  React.useEffect(() => {
    return () => {
      if (isObjectUrl(profile.avatarUrl)) {
        URL.revokeObjectURL(profile.avatarUrl!)
      }
      if (isObjectUrl(workspace.logoUrl)) {
        URL.revokeObjectURL(workspace.logoUrl!)
      }
      if (pendingImage) {
        URL.revokeObjectURL(pendingImage.url)
      }
    }
  }, [pendingImage, profile.avatarUrl, workspace.logoUrl])

  const previewData: OnboardingPreviewData = {
    name: profile.name,
    email: profile.email,
    avatarUrl: profile.avatarUrl,
    workspaceName: workspace.name,
    workspaceLogoUrl: workspace.logoUrl,
    language: workspace.language,
    timezone: workspace.timezone,
  }
  const loadingWorkspace = loadedWorkspaceKey !== workspaceLoadKey

  function updateProfile(update: Partial<ProfileDraft>) {
    setProfile((current) => ({ ...current, ...update }))
    setError(null)
    setFieldErrors({})
  }

  function updateWorkspace(update: Partial<WorkspaceDraft>) {
    setWorkspace((current) => ({ ...current, ...update }))
    setError(null)
    setFieldErrors({})
  }

  function chooseImage(
    event: React.ChangeEvent<HTMLInputElement>,
    target: PendingImage["target"]
  ) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return

    if (!validateImage(file)) {
      setError("Choose a PNG, JPG, or WebP image smaller than 2 MB.")
      return
    }

    setError(null)
    setPendingImage({ file, target, url: URL.createObjectURL(file) })
  }

  function closeCropDialog() {
    if (pendingImage) URL.revokeObjectURL(pendingImage.url)
    setPendingImage(null)
  }

  function acceptCrop(file: File) {
    const previewUrl = URL.createObjectURL(file)

    if (pendingImage?.target === "avatar") {
      if (isObjectUrl(profile.avatarUrl))
        URL.revokeObjectURL(profile.avatarUrl!)
      updateProfile({ avatarFile: file, avatarUrl: previewUrl })
    } else {
      if (isObjectUrl(workspace.logoUrl)) {
        URL.revokeObjectURL(workspace.logoUrl!)
      }
      updateWorkspace({ logoFile: file, logoUrl: previewUrl })
    }

    closeCropDialog()
  }

  function removeAvatarDraft() {
    if (isObjectUrl(profile.avatarUrl)) URL.revokeObjectURL(profile.avatarUrl!)
    updateProfile({
      avatarFile: null,
      avatarUrl: profile.originalAvatarUrl,
    })
  }

  function removeWorkspaceLogoDraft() {
    if (isObjectUrl(workspace.logoUrl)) {
      URL.revokeObjectURL(workspace.logoUrl!)
    }
    updateWorkspace({
      logoFile: null,
      logoUrl: workspace.originalLogoUrl,
    })
  }

  function continueToWorkspace(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!event.currentTarget.reportValidity()) return

    setStep("workspace")
    setError(null)
    setFieldErrors({})
  }

  function workspaceIsValid() {
    if (!canEditWorkspace) return true

    const nextErrors: Record<string, string[]> = {}
    if (!workspace.name.trim()) {
      nextErrors.name = ["The workspace name is required."]
    }
    if (!workspace.language) {
      nextErrors.language = ["Choose a default language."]
    }
    if (!workspace.timezone) {
      nextErrors.timezone = ["Choose a default timezone."]
    }

    setFieldErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function uploadAvatar() {
    if (!profile.avatarFile) return

    const body = new FormData()
    body.append("avatar", profile.avatarFile)
    await apiFetch("/api/v1/profile/avatar", { method: "PATCH", body })
  }

  async function finishOnboarding(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!workspaceIsValid()) return

    setSaving(true)
    setError(null)
    setFieldErrors({})

    try {
      await apiFetch("/api/user", {
        method: "PUT",
        body: { name: profile.name.trim(), email: profile.email.trim() },
      })
      await uploadAvatar()

      let workspaceId = selectedOrganization?.id ?? null
      if (selectedOrganization && canEditWorkspace) {
        await updateWorkspaceProfile(selectedOrganization.id, {
          name: workspace.name.trim(),
          locale: {
            language: workspace.language,
            timezone: workspace.timezone,
          },
        })
      } else if (!selectedOrganization) {
        const createdWorkspace = await createWorkspace({
          name: workspace.name.trim(),
          locale: {
            language: workspace.language,
            timezone: workspace.timezone,
          },
        })
        workspaceId = createdWorkspace.id
        setActiveOrganizationId(createdWorkspace.id)
      }

      if (workspaceId && workspace.logoFile && canEditWorkspace) {
        await uploadWorkspaceLogo(workspaceId, workspace.logoFile)
      }

      await completeOnboarding()
      await refreshUser()
      router.replace("/dashboard")
    } catch (submissionError) {
      if (submissionError instanceof ApiError) {
        setError(submissionError.message)
        setFieldErrors(submissionError.errors ?? {})
      } else {
        setError("Could not finish onboarding. Please try again.")
      }
    } finally {
      setSaving(false)
    }
  }

  async function skipOnboarding() {
    setSkipping(true)
    setError(null)

    try {
      await completeOnboarding()
      router.replace("/dashboard")
    } catch (skipError) {
      setError(
        skipError instanceof ApiError
          ? skipError.message
          : "Could not skip onboarding. Please try again."
      )
      setSkipping(false)
    }
  }

  const form =
    authLoading || !user ? (
      <div className="flex min-h-80 items-center justify-center">
        <Spinner className="size-5" />
      </div>
    ) : (
      <div className="flex flex-col gap-7">
        <div className="flex items-center">
          <Stepper
            value={step === "profile" ? 1 : 2}
            onValueChange={(value) => {
              if (value !== 1 || step !== "workspace") return

              setStep("profile")
              setError(null)
              setFieldErrors({})
            }}
            indicators={{
              completed: <CheckIcon className="size-3.5" />,
              loading: <LoaderCircleIcon className="size-3.5 animate-spin" />,
            }}
            className="w-full max-w-64"
            aria-label="Onboarding progress"
          >
            <StepperNav>
              {ONBOARDING_STEPS.map((onboardingStep, index) => (
                <StepperItem
                  key={onboardingStep.id}
                  step={index + 1}
                  disabled={
                    onboardingStep.id === "workspace" && step === "profile"
                  }
                  loading={onboardingStep.id === "workspace" && saving}
                  className="relative"
                >
                  <StepperTrigger className="justify-start gap-1.5">
                    <StepperIndicator>{index + 1}</StepperIndicator>
                    <StepperTitle>{onboardingStep.title}</StepperTitle>
                  </StepperTrigger>

                  {ONBOARDING_STEPS.length > index + 1 && (
                    <StepperSeparator className="group-data-[state=completed]/step:bg-primary md:mx-2.5" />
                  )}
                </StepperItem>
              ))}
            </StepperNav>
          </Stepper>
        </div>

        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {step === "profile"
              ? "Set up your profile"
              : "Shape your workspace"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {step === "profile"
              ? "Add the details your teammates will see across Dacoo."
              : canEditWorkspace
                ? "Choose the shared defaults for your team."
                : "Review the workspace you’ve been invited to."}
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <TriangleAlertIcon aria-hidden="true" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {step === "profile" ? (
          <form onSubmit={continueToWorkspace} className="flex flex-col gap-6">
            <FieldGroup className="gap-4">
              <Field data-invalid={!!fieldErrors.name}>
                <FieldLabel htmlFor="onboarding-name">Name</FieldLabel>
                <Input
                  id="onboarding-name"
                  value={profile.name}
                  onChange={(event) =>
                    updateProfile({ name: event.target.value })
                  }
                  autoComplete="name"
                  required
                  disabled={saving || skipping}
                  aria-invalid={!!fieldErrors.name}
                />
                {fieldErrors.name && (
                  <FieldError>{fieldErrors.name[0]}</FieldError>
                )}
              </Field>

              <Field data-invalid={!!fieldErrors.email}>
                <FieldLabel htmlFor="onboarding-email">Email</FieldLabel>
                <Input
                  id="onboarding-email"
                  type="email"
                  value={profile.email}
                  onChange={(event) =>
                    updateProfile({ email: event.target.value })
                  }
                  autoComplete="email"
                  required
                  disabled={saving || skipping}
                  aria-invalid={!!fieldErrors.email}
                />
                {fieldErrors.email && (
                  <FieldError>{fieldErrors.email[0]}</FieldError>
                )}
              </Field>

              <Field>
                <FieldLabel>
                  Profile photo{" "}
                  <span className="text-muted-foreground">(optional)</span>
                </FieldLabel>
                <ImageUploadBox
                  id="onboarding-avatar"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => chooseImage(event, "avatar")}
                  disabled={saving || skipping || pendingImage !== null}
                  readyToUpload={profile.avatarFile !== null}
                  previewUrl={profile.avatarUrl}
                  fileName={
                    profile.avatarFile?.name ??
                    (profile.avatarUrl ? "Profile photo" : null)
                  }
                  onRemove={profile.avatarFile ? removeAvatarDraft : undefined}
                  hint="PNG, JPG or WebP (max. 2 MB)"
                />
              </Field>
            </FieldGroup>

            <Field className="gap-2">
              <Button
                type="submit"
                className="w-full"
                disabled={saving || skipping}
              >
                Continue
                <ArrowRightIcon data-icon="inline-end" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                disabled={saving || skipping}
                onClick={() => void skipOnboarding()}
              >
                {skipping && <Spinner data-icon="inline-start" />}
                Skip setup
              </Button>
            </Field>
          </form>
        ) : (
          <form onSubmit={finishOnboarding} className="flex flex-col gap-6">
            {loadingWorkspace ? (
              <div className="flex min-h-52 items-center justify-center">
                <Spinner className="size-5" />
              </div>
            ) : (
              <FieldGroup className="gap-4">
                {!canEditWorkspace && (
                  <Alert>
                    <AlertDescription>
                      Only workspace owners and admins can change these shared
                      settings. You can still finish your profile setup.
                    </AlertDescription>
                  </Alert>
                )}

                <Field data-invalid={!!fieldErrors.name}>
                  <FieldLabel htmlFor="onboarding-workspace-name">
                    Workspace name
                  </FieldLabel>
                  <Input
                    id="onboarding-workspace-name"
                    value={workspace.name}
                    onChange={(event) =>
                      updateWorkspace({ name: event.target.value })
                    }
                    disabled={!canEditWorkspace || saving || skipping}
                    aria-invalid={!!fieldErrors.name}
                  />
                  {fieldErrors.name && (
                    <FieldError>{fieldErrors.name[0]}</FieldError>
                  )}
                </Field>

                <Field data-invalid={!!fieldErrors.language}>
                  <FieldLabel htmlFor="onboarding-language">
                    Default language
                  </FieldLabel>
                  <SearchableDropdown
                    id="onboarding-language"
                    value={workspace.language}
                    options={languages.map((option) => ({
                      id: String(option.id),
                      value: option.code,
                      label: option.name,
                    }))}
                    placeholder="Select a language"
                    searchPlaceholder="Search languages..."
                    emptyMessage="No language found."
                    disabled={!canEditWorkspace || saving || skipping}
                    onValueChange={(language) => updateWorkspace({ language })}
                  />
                  {fieldErrors.language && (
                    <FieldError>{fieldErrors.language[0]}</FieldError>
                  )}
                </Field>

                <Field data-invalid={!!fieldErrors.timezone}>
                  <FieldLabel htmlFor="onboarding-timezone">
                    Default timezone
                  </FieldLabel>
                  <SearchableDropdown
                    id="onboarding-timezone"
                    value={workspace.timezone}
                    options={timezones.map((option) => ({
                      id: String(option.id),
                      value: option.zone_name,
                      label: `${option.zone_name} (${option.gmt_offset_name})`,
                    }))}
                    placeholder="Select a timezone"
                    searchPlaceholder="Search timezones..."
                    emptyMessage="No timezone found."
                    disabled={!canEditWorkspace || saving || skipping}
                    onValueChange={(timezone) => updateWorkspace({ timezone })}
                  />
                  {fieldErrors.timezone && (
                    <FieldError>{fieldErrors.timezone[0]}</FieldError>
                  )}
                </Field>

                <Field>
                  <FieldLabel>
                    Workspace logo{" "}
                    <span className="text-muted-foreground">(optional)</span>
                  </FieldLabel>
                  <ImageUploadBox
                    id="onboarding-workspace-logo"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => chooseImage(event, "workspace")}
                    disabled={
                      !canEditWorkspace ||
                      saving ||
                      skipping ||
                      pendingImage !== null
                    }
                    readyToUpload={workspace.logoFile !== null}
                    previewUrl={workspace.logoUrl}
                    fileName={
                      workspace.logoFile?.name ??
                      (workspace.logoUrl ? "Workspace logo" : null)
                    }
                    onRemove={
                      workspace.logoFile ? removeWorkspaceLogoDraft : undefined
                    }
                    hint="PNG, JPG or WebP (max. 2 MB)"
                  />
                  <FieldDescription>
                    This appears in the workspace switcher and live preview.
                  </FieldDescription>
                </Field>
              </FieldGroup>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={saving || skipping}
                onClick={() => {
                  setStep("profile")
                  setError(null)
                  setFieldErrors({})
                }}
              >
                <ArrowLeftIcon />
                Back
              </Button>
              <Button
                type="submit"
                disabled={loadingWorkspace || saving || skipping}
              >
                {saving ? (
                  <>
                    <Spinner />
                    Finishing…
                  </>
                ) : (
                  <>
                    Finish
                    <CheckIcon />
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    )

  return (
    <>
      {pendingImage && (
        <ImageCropDialog
          open
          imageUrl={pendingImage.url}
          fileName={pendingImage.file.name}
          mimeType={pendingImage.file.type}
          title={
            pendingImage.target === "avatar"
              ? "Crop profile photo"
              : "Crop workspace logo"
          }
          previewLabel={
            pendingImage.target === "avatar"
              ? "Profile photo crop preview"
              : "Workspace logo crop preview"
          }
          onOpenChange={(open) => {
            if (!open) closeCropDialog()
          }}
          onCrop={acceptCrop}
        />
      )}

      <AuthSplitShell
        showcase={<OnboardingPreview data={previewData} />}
        contentClassName="max-w-md"
      >
        {form}
      </AuthSplitShell>
    </>
  )
}
