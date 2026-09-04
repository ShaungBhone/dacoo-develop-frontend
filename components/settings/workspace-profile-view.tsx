"use client"

import * as React from "react"
import {
  Building2Icon,
  CheckIcon,
  LogOutIcon,
  TriangleAlertIcon,
  UserRoundCheckIcon,
} from "@/components/ui/icons"
import { toast } from "sonner"

import { useAuth } from "@/contexts/auth-context"
import { useOrganization } from "@/contexts/organization-context"
import { ApiError } from "@/lib/api"
import { ImageCropDialog } from "@/components/settings/image-crop-dialog"
import {
  fetchWorkspaceLanguages,
  fetchWorkspaceProfile,
  fetchWorkspaceTimezones,
  removeWorkspaceLogo,
  uploadWorkspaceLogo,
  updateWorkspaceProfile,
  leaveWorkspace,
  transferWorkspaceOwnership,
  type WorkspaceLanguage,
  type WorkspaceTimezone,
} from "@/components/settings/workspace-profile-api"
import { fetchMembers } from "@/components/organization/api"
import type { MemberRow } from "@/components/organization/data"
import { ImageUploadBox } from "@/components/settings/image-upload-box"
import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldTitle,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { SearchableDropdown } from "@/components/ui/searchable-dropdown"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { TypographyH2, TypographyMuted } from "@/components/ui/typography"

type WorkspaceDraft = {
  name: string
  language: string
  timezone: string
}

type PendingLogo = {
  file: File
  url: string
}

const EMPTY_DRAFT: WorkspaceDraft = {
  name: "",
  language: "",
  timezone: "",
}

function workspaceDraftEquals(left: WorkspaceDraft, right: WorkspaceDraft) {
  return (
    left.name === right.name &&
    left.language === right.language &&
    left.timezone === right.timezone
  )
}

function WorkspaceProfileSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  )
}

function WorkspaceRow({
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

export function WorkspaceProfileView() {
  const { refreshUser } = useAuth()
  const { activeOrganization, isOwner, setActiveOrganizationId } =
    useOrganization()
  const organizationId = activeOrganization?.id ?? null
  const canEdit = isOwner || activeOrganization?.role === "admin"
  const [draft, setDraft] = React.useState<WorkspaceDraft>(EMPTY_DRAFT)
  const [savedDraft, setSavedDraft] =
    React.useState<WorkspaceDraft>(EMPTY_DRAFT)
  const [languages, setLanguages] = React.useState<WorkspaceLanguage[]>([])
  const [timezones, setTimezones] = React.useState<WorkspaceTimezone[]>([])
  const previewLogoUrlRef = React.useRef<string | null>(null)
  const pendingLogoUrlRef = React.useRef<string | null>(null)
  const [logoUrl, setLogoUrl] = React.useState<string | null>(null)
  const [logoFileName, setLogoFileName] = React.useState<string | null>(null)
  const [logoUploadError, setLogoUploadError] = React.useState<string | null>(
    null
  )
  const [logoRetryFile, setLogoRetryFile] = React.useState<File | null>(null)
  const [pendingLogo, setPendingLogo] = React.useState<PendingLogo | null>(null)
  const [loadedOrganizationId, setLoadedOrganizationId] = React.useState<
    number | null
  >(null)
  const [saving, setSaving] = React.useState(false)
  const [uploadingLogo, setUploadingLogo] = React.useState(false)
  const [removingLogo, setRemovingLogo] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [saved, setSaved] = React.useState(false)
  const [members, setMembers] = React.useState<MemberRow[]>([])
  const [transferOpen, setTransferOpen] = React.useState(false)
  const [leaveOpen, setLeaveOpen] = React.useState(false)
  const [nextOwnerId, setNextOwnerId] = React.useState("")
  const [membershipSaving, setMembershipSaving] = React.useState(false)
  const dirty = !workspaceDraftEquals(draft, savedDraft)

  React.useEffect(() => {
    return () => {
      if (previewLogoUrlRef.current) {
        URL.revokeObjectURL(previewLogoUrlRef.current)
      }
      if (pendingLogoUrlRef.current) {
        URL.revokeObjectURL(pendingLogoUrlRef.current)
      }
    }
  }, [])

  React.useEffect(() => {
    if (organizationId === null) return

    let cancelled = false

    Promise.all([
      fetchWorkspaceProfile(organizationId),
      fetchWorkspaceLanguages(),
      fetchWorkspaceTimezones(),
    ])
      .then(([profile, nextLanguages, nextTimezones]) => {
        if (cancelled) return

        const locale = profile.settings?.workspace?.locale
        const nextDraft = {
          name: profile.name,
          language: locale?.language ?? "",
          timezone: locale?.timezone ?? "",
        }
        setDraft(nextDraft)
        setSavedDraft(nextDraft)
        setLanguages(nextLanguages)
        setTimezones(nextTimezones)
        setLogoUrl(profile.logo_url)
        setError(null)
        setSaved(false)
      })
      .catch((loadError) => {
        if (cancelled) return
        setError(
          loadError instanceof ApiError
            ? loadError.message
            : "Failed to load workspace settings."
        )
      })
      .finally(() => {
        if (!cancelled) setLoadedOrganizationId(organizationId)
      })

    return () => {
      cancelled = true
    }
  }, [organizationId])

  React.useEffect(() => {
    if (organizationId === null || !isOwner) {
      return
    }

    void fetchMembers(organizationId)
      .then((nextMembers) => {
        setMembers(
          nextMembers.filter(
            (member) => !member.isOwner && member.status === "active"
          )
        )
      })
      .catch(() => setMembers([]))
  }, [organizationId, isOwner])

  function updateDraft(update: Partial<WorkspaceDraft>) {
    setDraft((current) => ({ ...current, ...update }))
    setSaved(false)
    setError(null)
  }

  function handleCancel() {
    setDraft(savedDraft)
    setSaved(false)
    setError(null)
  }

  function handleLogoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""

    if (organizationId === null || !file || !canEdit) return

    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 2 * 1024 * 1024
    ) {
      const message = "Choose a PNG, JPG, or WebP image smaller than 2 MB."
      setLogoUploadError(message)
      setError(null)
      toast.error("Couldn’t select workspace logo", {
        description: message,
      })
      return
    }

    if (pendingLogoUrlRef.current) {
      URL.revokeObjectURL(pendingLogoUrlRef.current)
    }

    const url = URL.createObjectURL(file)
    pendingLogoUrlRef.current = url
    setPendingLogo({ file, url })
    setLogoFileName(file.name)
    setLogoUploadError(null)
    setLogoRetryFile(null)
    setError(null)
    setSaved(false)
  }

  function discardPendingLogo() {
    if (pendingLogoUrlRef.current) {
      URL.revokeObjectURL(pendingLogoUrlRef.current)
      pendingLogoUrlRef.current = null
    }
    setPendingLogo(null)
  }

  async function handleLogoCrop(file: File) {
    discardPendingLogo()

    if (organizationId === null || !canEdit) return

    const previousLogoUrl = logoUrl
    const previewLogoUrl = URL.createObjectURL(file)
    if (previewLogoUrlRef.current) {
      URL.revokeObjectURL(previewLogoUrlRef.current)
    }
    previewLogoUrlRef.current = previewLogoUrl
    setLogoUrl(previewLogoUrl)
    setUploadingLogo(true)
    setError(null)
    setLogoUploadError(null)
    setSaved(false)

    try {
      const profile = await uploadWorkspaceLogo(organizationId, file)
      URL.revokeObjectURL(previewLogoUrl)
      previewLogoUrlRef.current = null
      setLogoUrl(profile.logo_url)
      setLogoRetryFile(null)
      await refreshUser()
      toast.success("Workspace logo uploaded", {
        description: "Your new logo is now visible across the workspace.",
      })
    } catch (uploadError) {
      URL.revokeObjectURL(previewLogoUrl)
      previewLogoUrlRef.current = null
      setLogoUrl(previousLogoUrl)
      const message =
        uploadError instanceof ApiError
          ? uploadError.message
          : "Failed to upload workspace logo."
      setLogoUploadError(message)
      setLogoRetryFile(file)
      toast.error("Couldn’t upload workspace logo", {
        description: message,
      })
    } finally {
      setUploadingLogo(false)
    }
  }

  async function handleLogoRemove() {
    if (organizationId === null || !canEdit || uploadingLogo || removingLogo) {
      return
    }

    setRemovingLogo(true)
    setError(null)
    setLogoUploadError(null)
    setSaved(false)

    try {
      const profile = await removeWorkspaceLogo(organizationId)
      setLogoUrl(profile.logo_url)
      setLogoFileName(null)
      setLogoRetryFile(null)
      await refreshUser()
      toast.success("Workspace logo removed", {
        description: "The workspace is now using its default logo.",
      })
    } catch (removeError) {
      const message =
        removeError instanceof ApiError
          ? removeError.message
          : "Failed to remove workspace logo."
      setLogoUploadError(message)
      toast.error("Couldn’t remove workspace logo", {
        description: message,
      })
    } finally {
      setRemovingLogo(false)
    }
  }

  function clearFailedLogo() {
    setLogoFileName(null)
    setLogoUploadError(null)
    setLogoRetryFile(null)
  }

  async function handleSave() {
    if (organizationId === null || !canEdit || uploadingLogo || removingLogo) {
      return
    }

    setSaving(true)
    setSaved(false)
    setError(null)

    try {
      const profile = await updateWorkspaceProfile(organizationId, {
        name: draft.name.trim(),
        locale: { language: draft.language, timezone: draft.timezone },
      })
      const locale = profile.settings?.workspace?.locale
      const nextDraft = {
        name: profile.name,
        language: locale?.language ?? draft.language,
        timezone: locale?.timezone ?? draft.timezone,
      }
      setDraft(nextDraft)
      setSavedDraft(nextDraft)
      await refreshUser()
      setSaved(true)
      window.setTimeout(() => setSaved(false), 2500)
    } catch (saveError) {
      setError(
        saveError instanceof ApiError
          ? saveError.message
          : "Failed to save workspace settings."
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleTransferOwnership() {
    if (organizationId === null || !nextOwnerId) return

    setMembershipSaving(true)
    setError(null)
    try {
      await transferWorkspaceOwnership(organizationId, Number(nextOwnerId))
      await refreshUser()
      setTransferOpen(false)
      setSaved(true)
      window.setTimeout(() => setSaved(false), 2500)
    } catch (transferError) {
      setError(
        transferError instanceof ApiError
          ? transferError.message
          : "Failed to transfer workspace ownership."
      )
    } finally {
      setMembershipSaving(false)
    }
  }

  async function handleLeave() {
    if (organizationId === null) return

    setMembershipSaving(true)
    setError(null)
    try {
      await leaveWorkspace(organizationId)
      const user = await refreshUser()
      const fallback = user?.organizations?.find(
        (organization) => organization.id !== organizationId
      )
      if (fallback) setActiveOrganizationId(fallback.id)
      setLeaveOpen(false)
    } catch (leaveError) {
      setError(
        leaveError instanceof ApiError
          ? leaveError.message
          : "Failed to leave workspace."
      )
    } finally {
      setMembershipSaving(false)
    }
  }

  if (organizationId === null) {
    return (
      <Empty className="py-16">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Building2Icon aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>No workspace selected</EmptyTitle>
          <EmptyDescription>
            Select a workspace from the profile menu to manage its settings.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  if (loadedOrganizationId !== organizationId) {
    return <WorkspaceProfileSkeleton />
  }

  return (
    <div className="flex flex-col gap-6">
      {pendingLogo && (
        <ImageCropDialog
          open
          imageUrl={pendingLogo.url}
          fileName={pendingLogo.file.name}
          mimeType={pendingLogo.file.type}
          title="Crop workspace logo"
          previewLabel="Workspace logo crop preview"
          onOpenChange={(open) => {
            if (!open) discardPendingLogo()
          }}
          onCrop={handleLogoCrop}
        />
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <TypographyH2 className="text-balance">
            Workspace settings
          </TypographyH2>
          <TypographyMuted>
            Manage the shared details and defaults for{" "}
            {activeOrganization?.name}.
          </TypographyMuted>
        </div>
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={!dirty || saving || uploadingLogo || removingLogo}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={
              !canEdit ||
              !dirty ||
              saving ||
              uploadingLogo ||
              removingLogo ||
              !draft.name.trim() ||
              !draft.language ||
              !draft.timezone
            }
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

      {error && (
        <Alert variant="destructive">
          <TriangleAlertIcon aria-hidden="true" />
          <AlertTitle>Couldn&apos;t update workspace</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {saved && (
        <Alert variant="success">
          <CheckIcon aria-hidden="true" />
          <AlertTitle>Workspace updated</AlertTitle>
          <AlertDescription>
            Your changes are now applied to this workspace.
          </AlertDescription>
        </Alert>
      )}

      <Separator />

      <FieldGroup className="gap-6">
        <WorkspaceRow
          title="Workspace logo"
          description="This will be displayed across your workspace."
        >
          <Field
            data-disabled={
              !canEdit || uploadingLogo || removingLogo ? true : undefined
            }
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Avatar className="size-16 bg-white dark:bg-white" size="lg">
                {logoUrl && <AvatarImage src={logoUrl} alt="Workspace logo" />}
                <AvatarFallback>
                  <Building2Icon aria-hidden="true" />
                </AvatarFallback>
              </Avatar>
              <ImageUploadBox
                id="workspace-logo"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleLogoChange}
                disabled={
                  !canEdit ||
                  uploadingLogo ||
                  saving ||
                  pendingLogo !== null ||
                  removingLogo
                }
                uploading={uploadingLogo}
                removing={removingLogo}
                previewUrl={logoUrl}
                fileName={logoFileName ?? (logoUrl ? "Workspace logo" : null)}
                error={logoUploadError}
                onRetry={
                  logoRetryFile
                    ? () => handleLogoCrop(logoRetryFile)
                    : undefined
                }
                onRemove={
                  logoUploadError
                    ? clearFailedLogo
                    : logoUrl
                      ? handleLogoRemove
                      : logoFileName
                        ? clearFailedLogo
                        : undefined
                }
                hint="PNG, JPG or WebP (max. 2 MB)"
                className="flex-1 border-primary/60"
              />
            </div>
          </Field>
        </WorkspaceRow>

        <Separator />

        <WorkspaceRow
          title="Workspace name"
          description="This name appears in the workspace switcher and shared areas."
          required
        >
          <Field
            data-disabled={
              !canEdit || saving || uploadingLogo ? true : undefined
            }
          >
            <Input
              id="workspace-name"
              value={draft.name}
              onChange={(event) => updateDraft({ name: event.target.value })}
              required
              disabled={!canEdit || saving || uploadingLogo}
            />
          </Field>
        </WorkspaceRow>

        <Separator />

        <WorkspaceRow
          title="Default language"
          description="Used as the shared language default. Each member keeps their own app language."
          required
        >
          <SearchableDropdown
            value={draft.language}
            options={languages.map((language) => ({
              id: String(language.id),
              value: language.code,
              label: language.name,
            }))}
            placeholder="Select a default language"
            searchPlaceholder="Search languages..."
            emptyMessage="No language found."
            disabled={!canEdit || saving || uploadingLogo}
            onValueChange={(language) => updateDraft({ language })}
          />
        </WorkspaceRow>

        <Separator />

        <WorkspaceRow
          title="Default timezone"
          description="Used for shared workspace dates and time-based activity."
          required
        >
          <SearchableDropdown
            value={draft.timezone}
            options={timezones.map((timezone) => ({
              id: String(timezone.id),
              value: timezone.zone_name,
              label: `${timezone.zone_name} (${timezone.gmt_offset_name})`,
            }))}
            placeholder="Select a default timezone"
            searchPlaceholder="Search timezones..."
            emptyMessage="No timezone found."
            disabled={!canEdit || saving || uploadingLogo}
            onValueChange={(timezone) => updateDraft({ timezone })}
          />
        </WorkspaceRow>
      </FieldGroup>

      <Separator />

      <div className="flex flex-col gap-4 rounded-2xl border border-destructive/30 p-4">
        <div className="flex flex-col gap-1">
          <FieldTitle>Workspace membership</FieldTitle>
          <FieldDescription>
            {isOwner
              ? "Transfer ownership before you can leave this workspace."
              : "Leave this workspace and remove your access to its teams and shared resources."}
          </FieldDescription>
        </div>
        <div className="flex flex-wrap gap-3">
          {isOwner && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setTransferOpen(true)}
              disabled={members.length === 0}
            >
              <UserRoundCheckIcon /> Transfer ownership
            </Button>
          )}
          {!isOwner && (
            <Button
              type="button"
              variant="destructive"
              onClick={() => setLeaveOpen(true)}
            >
              <LogOutIcon /> Leave workspace
            </Button>
          )}
        </div>
        {isOwner && members.length === 0 && (
          <FieldError>
            Invite or add an active member before transferring ownership.
          </FieldError>
        )}
      </div>

      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer workspace ownership</DialogTitle>
            <DialogDescription>
              The new owner will have full workspace control. You will become an
              administrator and can leave afterward.
            </DialogDescription>
          </DialogHeader>
          <Field>
            <FieldTitle>New owner</FieldTitle>
            <div className="mt-2">
              <SearchableDropdown
                value={nextOwnerId}
                options={members.map((member) => ({
                  id: String(member.id),
                  value: String(member.id),
                  label: `${member.name} (${member.email})`,
                }))}
                placeholder="Select a member"
                searchPlaceholder="Search members..."
                emptyMessage="No member found."
                disabled={membershipSaving}
                onValueChange={setNextOwnerId}
              />
            </div>
          </Field>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTransferOpen(false)}
              disabled={membershipSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleTransferOwnership}
              disabled={!nextOwnerId || membershipSaving}
            >
              {membershipSaving ? (
                <>
                  <Spinner /> Transferring…
                </>
              ) : (
                "Transfer ownership"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={leaveOpen} onOpenChange={setLeaveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave workspace?</DialogTitle>
            <DialogDescription>
              You will lose access to this workspace, its teams, and its shared
              resources. This cannot be undone by you.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setLeaveOpen(false)}
              disabled={membershipSaving}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleLeave}
              disabled={membershipSaving}
            >
              {membershipSaving ? (
                <>
                  <Spinner /> Leaving…
                </>
              ) : (
                "Leave workspace"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {!canEdit && (
        <FieldError>
          Only workspace owners and administrators can update these settings.
        </FieldError>
      )}
    </div>
  )
}
