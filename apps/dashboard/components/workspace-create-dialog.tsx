"use client"

import * as React from "react"
import { PlusIcon, TriangleAlertIcon } from "@/components/ui/icons"

import { ApiError } from "@/lib/api"
import { ImageCropDialog } from "@/components/settings/image-crop-dialog"
import { ImageUploadBox } from "@/components/settings/image-upload-box"
import {
  createWorkspace,
  fetchWorkspaceLanguages,
  fetchWorkspaceTimezones,
  uploadWorkspaceLogo,
  type WorkspaceLanguage,
  type WorkspaceTimezone,
} from "@/components/settings/workspace-profile-api"
import { Alert, AlertDescription } from "@/components/reui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { SearchableDropdown } from "@/components/ui/searchable-dropdown"
import { Spinner } from "@/components/ui/spinner"

export function WorkspaceCreateDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (organizationId: number) => Promise<void>
}) {
  const [name, setName] = React.useState("")
  const [language, setLanguage] = React.useState("")
  const [timezone, setTimezone] = React.useState("")
  const [languages, setLanguages] = React.useState<WorkspaceLanguage[]>([])
  const [timezones, setTimezones] = React.useState<WorkspaceTimezone[]>([])
  const [pendingLogo, setPendingLogo] = React.useState<{
    file: File
    url: string
  } | null>(null)
  const [logo, setLogo] = React.useState<File | null>(null)
  const [logoPreviewUrl, setLogoPreviewUrl] = React.useState<string | null>(
    null
  )
  const [error, setError] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (!open) return

    void Promise.all([fetchWorkspaceLanguages(), fetchWorkspaceTimezones()])
      .then(([nextLanguages, nextTimezones]) => {
        setLanguages(nextLanguages)
        setTimezones(nextTimezones)
      })
      .catch(() => setError("Could not load workspace setup options."))
  }, [open])

  React.useEffect(() => {
    return () => {
      if (pendingLogo) URL.revokeObjectURL(pendingLogo.url)
    }
  }, [pendingLogo])

  React.useEffect(() => {
    return () => {
      if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl)
    }
  }, [logoPreviewUrl])

  function chooseLogo(event: React.ChangeEvent<HTMLInputElement>) {
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

    setError(null)
    setPendingLogo({ file, url: URL.createObjectURL(file) })
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setName("")
      setLanguage("")
      setTimezone("")
      setLogo(null)
      setLogoPreviewUrl(null)
      setPendingLogo(null)
      setError(null)
    }

    onOpenChange(nextOpen)
  }

  function removeLogo() {
    if (logoPreviewUrl) {
      URL.revokeObjectURL(logoPreviewUrl)
    }
    setLogo(null)
    setLogoPreviewUrl(null)
  }

  async function submit() {
    if (!name.trim() || !language || !timezone) return

    setSubmitting(true)
    setError(null)
    let workspaceCreated = false

    try {
      const workspace = await createWorkspace({
        name: name.trim(),
        locale: { language, timezone },
      })
      workspaceCreated = true
      await onCreated(workspace.id)

      if (logo) await uploadWorkspaceLogo(workspace.id, logo)

      handleOpenChange(false)
    } catch (submissionError) {
      const message =
        submissionError instanceof ApiError
          ? submissionError.message
          : "Could not create the workspace. Please try again."
      setError(
        workspaceCreated
          ? "Your workspace was created, but its logo could not be uploaded. You can add it in Workspace Settings."
          : message
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create workspace</DialogTitle>
          <DialogDescription>
            Set the shared defaults for your new workspace.
          </DialogDescription>
        </DialogHeader>
        {pendingLogo && (
          <ImageCropDialog
            open
            imageUrl={pendingLogo.url}
            fileName={pendingLogo.file.name}
            mimeType={pendingLogo.file.type}
            title="Crop workspace logo"
            previewLabel="Workspace logo crop preview"
            onOpenChange={(nextOpen) => {
              if (!nextOpen) setPendingLogo(null)
            }}
            onCrop={(file) => {
              setLogo(file)
              setLogoPreviewUrl(URL.createObjectURL(file))
              setPendingLogo(null)
            }}
          />
        )}
        <FieldGroup className="gap-4 py-2">
          {error && (
            <Alert variant="destructive">
              <TriangleAlertIcon aria-hidden="true" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Field>
            <FieldLabel htmlFor="new-workspace-name">Workspace name</FieldLabel>
            <Input
              id="new-workspace-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={submitting}
            />
          </Field>
          <Field data-disabled={submitting ? true : undefined}>
            <FieldLabel htmlFor="new-workspace-language">
              Default language
            </FieldLabel>
            <SearchableDropdown
              id="new-workspace-language"
              value={language}
              options={languages.map((option) => ({
                id: String(option.id),
                value: option.code,
                label: option.name,
              }))}
              placeholder="Select a language"
              searchPlaceholder="Search languages..."
              emptyMessage="No language found."
              disabled={submitting}
              onValueChange={setLanguage}
            />
          </Field>
          <Field data-disabled={submitting ? true : undefined}>
            <FieldLabel htmlFor="new-workspace-timezone">
              Default timezone
            </FieldLabel>
            <SearchableDropdown
              id="new-workspace-timezone"
              value={timezone}
              options={timezones.map((option) => ({
                id: String(option.id),
                value: option.zone_name,
                label: `${option.zone_name} (${option.gmt_offset_name})`,
              }))}
              placeholder="Select a timezone"
              searchPlaceholder="Search timezones..."
              emptyMessage="No timezone found."
              disabled={submitting}
              onValueChange={setTimezone}
            />
          </Field>
          <Field>
            <FieldLabel>
              Workspace logo{" "}
              <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <ImageUploadBox
              id="new-workspace-logo"
              accept="image/jpeg,image/png,image/webp"
              onChange={chooseLogo}
              disabled={submitting || pendingLogo !== null}
              uploading={submitting && logo !== null}
              readyToUpload={logo !== null && !submitting}
              previewUrl={logoPreviewUrl}
              fileName={logo?.name}
              onRemove={logo ? removeLogo : undefined}
              hint={
                logo ? `${logo.name} selected` : "PNG, JPG or WebP (max. 2 MB)"
              }
            />
          </Field>
        </FieldGroup>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={!name.trim() || !language || !timezone || submitting}
          >
            {submitting ? (
              <>
                <Spinner /> Creating…
              </>
            ) : (
              <>
                <PlusIcon data-icon="inline-start" /> Create workspace
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
