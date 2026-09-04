"use client"

import * as React from "react"
import {
  CheckIcon,
  EyeIcon,
  EyeOffIcon,
  ImageIcon,
  MailIcon,
  PlusIcon,
  Trash2Icon,
  UploadCloudIcon,
  XIcon,
} from "@/components/ui/icons"

import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { PhoneInput } from "@/components/ui/phone-input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { TypographyH3, TypographyMuted } from "@/components/ui/typography"

const COUNTRIES = ["India", "Myanmar", "Singapore", "Thailand", "United States"]

const PASSWORD_REQUIREMENTS = [
  {
    text: "At least 12 characters",
    matches: (value: string) => value.length >= 12,
  },
  {
    text: "At least 1 lowercase letter",
    matches: (value: string) => /[a-z]/.test(value),
  },
  {
    text: "At least 1 uppercase letter",
    matches: (value: string) => /[A-Z]/.test(value),
  },
  { text: "At least 1 number", matches: (value: string) => /\d/.test(value) },
  {
    text: "At least 1 special character",
    matches: (value: string) => /[^A-Za-z0-9]/.test(value),
  },
]

type ConnectedAccount = {
  id: string
  name: string
  url: string
  description: string
}

const INITIAL_ACCOUNTS: ConnectedAccount[] = [
  { id: "google", name: "Google", url: "https://google.com", description: "" },
  { id: "slack", name: "Slack", url: "https://slack.com", description: "" },
]

function SectionHeading({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <TypographyH3>{title}</TypographyH3>
      <TypographyMuted>{description}</TypographyMuted>
    </div>
  )
}

function SavedNotice({ children }: { children: React.ReactNode }) {
  return (
    <Alert variant="success">
      <CheckIcon aria-hidden="true" />
      <AlertTitle>Saved locally</AlertTitle>
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  )
}

function PersonalInformation() {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null)
  const [avatarError, setAvatarError] = React.useState<string | null>(null)
  const [saved, setSaved] = React.useState(false)
  const [profile, setProfile] = React.useState({
    firstName: "John",
    lastName: "Doe",
    mobile: "+15551234567",
    country: "United States",
    gender: "",
  })

  React.useEffect(() => {
    return () => {
      if (avatarUrl) URL.revokeObjectURL(avatarUrl)
    }
  }, [avatarUrl])

  function updateProfile(field: keyof typeof profile, value: string) {
    setProfile((current) => ({ ...current, [field]: value }))
    setSaved(false)
  }

  function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/") || file.size > 1024 * 1024) {
      setAvatarError("Choose an image smaller than 1 MB.")
      event.target.value = ""
      return
    }

    setAvatarError(null)
    setSaved(false)
    setAvatarUrl((current) => {
      if (current) URL.revokeObjectURL(current)
      return URL.createObjectURL(file)
    })
  }

  function removeAvatar() {
    setAvatarUrl((current) => {
      if (current) URL.revokeObjectURL(current)
      return null
    })
    if (inputRef.current) inputRef.current.value = ""
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaved(true)
  }

  const initials =
    `${profile.firstName[0] ?? ""}${profile.lastName[0] ?? ""}`.toUpperCase() ||
    "JD"

  return (
    <section
      id="personal-information"
      className="grid grid-cols-1 gap-10 lg:grid-cols-3"
    >
      <SectionHeading
        title="Personal Information"
        description="Manage your personal information and role."
      />
      <div className="flex flex-col gap-6 lg:col-span-2">
        {saved && (
          <SavedNotice>
            Your profile changes are available for this browser session.
          </SavedNotice>
        )}
        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel>Your avatar</FieldLabel>
              <div className="flex flex-wrap items-center gap-4">
                <Avatar size="lg">
                  {avatarUrl && (
                    <AvatarImage src={avatarUrl} alt="Avatar preview" />
                  )}
                  <AvatarFallback>
                    {avatarUrl ? <ImageIcon aria-hidden="true" /> : initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    ref={inputRef}
                    className="sr-only"
                    id="settings-avatar"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => inputRef.current?.click()}
                  >
                    <UploadCloudIcon data-icon="inline-start" />
                    Upload avatar
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={removeAvatar}
                    disabled={!avatarUrl}
                    aria-label="Remove avatar"
                  >
                    <Trash2Icon />
                  </Button>
                </div>
              </div>
              <FieldDescription>Pick a photo up to 1 MB.</FieldDescription>
              {avatarError && (
                <FieldDescription className="text-destructive">
                  {avatarError}
                </FieldDescription>
              )}
            </Field>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="settings-first-name">
                  First name
                </FieldLabel>
                <Input
                  id="settings-first-name"
                  value={profile.firstName}
                  onChange={(event) =>
                    updateProfile("firstName", event.target.value)
                  }
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="settings-last-name">Last name</FieldLabel>
                <Input
                  id="settings-last-name"
                  value={profile.lastName}
                  onChange={(event) =>
                    updateProfile("lastName", event.target.value)
                  }
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="settings-mobile">Mobile</FieldLabel>
                <PhoneInput
                  id="settings-mobile"
                  value={profile.mobile}
                  onChange={(value) => updateProfile("mobile", value)}
                  defaultCountry="US"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="settings-country">Country</FieldLabel>
                <Select
                  value={profile.country}
                  onValueChange={(value) => updateProfile("country", value)}
                >
                  <SelectTrigger id="settings-country" className="w-full">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {COUNTRIES.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="settings-gender">Gender</FieldLabel>
                <Select
                  value={profile.gender}
                  onValueChange={(value) => updateProfile("gender", value)}
                >
                  <SelectTrigger id="settings-gender" className="w-full">
                    <SelectValue placeholder="Select a gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field data-disabled>
                <FieldLabel htmlFor="settings-role">Role</FieldLabel>
                <Input id="settings-role" value="User" disabled readOnly />
              </Field>
            </div>
          </FieldGroup>
          <div className="flex justify-end">
            <Button type="submit">Save changes</Button>
          </div>
        </form>
      </div>
    </section>
  )
}

function EmailAndPassword() {
  const [email, setEmail] = React.useState("john.doe@example.com")
  const [currentPassword, setCurrentPassword] = React.useState("")
  const [newPassword, setNewPassword] = React.useState("")
  const [confirmation, setConfirmation] = React.useState("")
  const [visible, setVisible] = React.useState(false)
  const [saved, setSaved] = React.useState(false)
  const strength = PASSWORD_REQUIREMENTS.filter((requirement) =>
    requirement.matches(newPassword)
  ).length
  const passwordType = visible ? "text" : "password"

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaved(true)
  }

  return (
    <section
      id="email-password"
      className="grid grid-cols-1 gap-10 lg:grid-cols-3"
    >
      <SectionHeading
        title="Email & Password"
        description="Manage your email and password settings."
      />
      <div className="flex flex-col gap-6 lg:col-span-2">
        {saved && (
          <SavedNotice>
            Your email and password changes are available for this browser
            session.
          </SavedNotice>
        )}
        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="settings-email">Email</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id="settings-email"
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value)
                    setSaved(false)
                  }}
                  required
                />
                <InputGroupAddon align="inline-end">
                  <MailIcon aria-hidden="true" />
                </InputGroupAddon>
              </InputGroup>
            </Field>
            <Field>
              <FieldLabel htmlFor="settings-current-password">
                Current password
              </FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id="settings-current-password"
                  type={passwordType}
                  value={currentPassword}
                  onChange={(event) => {
                    setCurrentPassword(event.target.value)
                    setSaved(false)
                  }}
                  required
                />
                <InputGroupAddon align="inline-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setVisible((current) => !current)}
                    aria-label={visible ? "Hide passwords" : "Show passwords"}
                  >
                    {visible ? <EyeOffIcon /> : <EyeIcon />}
                  </Button>
                </InputGroupAddon>
              </InputGroup>
            </Field>
            <Field>
              <FieldLabel htmlFor="settings-new-password">
                New password
              </FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id="settings-new-password"
                  type={passwordType}
                  value={newPassword}
                  onChange={(event) => {
                    setNewPassword(event.target.value)
                    setSaved(false)
                  }}
                  required
                />
                <InputGroupAddon align="inline-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setVisible((current) => !current)}
                    aria-label={visible ? "Hide passwords" : "Show passwords"}
                  >
                    {visible ? <EyeOffIcon /> : <EyeIcon />}
                  </Button>
                </InputGroupAddon>
              </InputGroup>
              <div
                className="flex h-1 gap-1"
                aria-label={`${strength} of ${PASSWORD_REQUIREMENTS.length} password requirements met`}
              >
                {PASSWORD_REQUIREMENTS.map((requirement, index) => (
                  <span
                    key={requirement.text}
                    className={cn(
                      "flex-1 rounded-full bg-border",
                      index < strength && "bg-primary"
                    )}
                  />
                ))}
              </div>
              <div className="flex flex-col gap-1">
                {PASSWORD_REQUIREMENTS.map((requirement) => {
                  const met = requirement.matches(newPassword)
                  return (
                    <p
                      key={requirement.text}
                      className={cn(
                        "flex items-center gap-2 text-xs text-muted-foreground",
                        met && "text-foreground"
                      )}
                    >
                      {met ? (
                        <CheckIcon aria-hidden="true" />
                      ) : (
                        <XIcon aria-hidden="true" />
                      )}
                      {requirement.text}
                    </p>
                  )
                })}
              </div>
            </Field>
            <Field
              data-invalid={Boolean(
                confirmation && confirmation !== newPassword
              )}
            >
              <FieldLabel htmlFor="settings-confirm-password">
                Confirm new password
              </FieldLabel>
              <Input
                id="settings-confirm-password"
                type={passwordType}
                value={confirmation}
                onChange={(event) => {
                  setConfirmation(event.target.value)
                  setSaved(false)
                }}
                aria-invalid={Boolean(
                  confirmation && confirmation !== newPassword
                )}
                required
              />
              {confirmation && confirmation !== newPassword && (
                <FieldDescription>Passwords do not match.</FieldDescription>
              )}
            </Field>
          </FieldGroup>
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={
                !currentPassword ||
                !newPassword ||
                newPassword !== confirmation ||
                strength !== PASSWORD_REQUIREMENTS.length
              }
            >
              Save changes
            </Button>
          </div>
        </form>
      </div>
    </section>
  )
}

function ConnectedAccounts() {
  const [accounts, setAccounts] =
    React.useState<ConnectedAccount[]>(INITIAL_ACCOUNTS)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [appName, setAppName] = React.useState("")
  const [appUrl, setAppUrl] = React.useState("")
  const [description, setDescription] = React.useState("")

  function resetForm() {
    setAppName("")
    setAppUrl("")
    setDescription("")
  }

  function connectAccount() {
    const name = appName.trim()
    const url = appUrl.trim()
    if (!name || !url) return
    setAccounts((current) => [
      ...current,
      {
        id: `${name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
        name,
        url,
        description: description.trim(),
      },
    ])
    resetForm()
    setDialogOpen(false)
  }

  return (
    <section
      id="connected-accounts"
      className="grid grid-cols-1 gap-10 lg:grid-cols-3"
    >
      <SectionHeading
        title="Connect Accounts"
        description="Manage your connected accounts."
      />
      <div className="flex flex-col gap-4 lg:col-span-2">
        <div className="flex flex-wrap items-center gap-3">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="flex h-8 items-center gap-2 rounded-xl border px-2 text-sm"
            >
              <Avatar size="sm">
                <AvatarFallback>
                  {account.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium">{account.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={`Disconnect ${account.name}`}
                onClick={() =>
                  setAccounts((current) =>
                    current.filter((item) => item.id !== account.id)
                  )
                }
              >
                <XIcon />
              </Button>
            </div>
          ))}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger render={<Button type="button" variant="outline" />}>
              <PlusIcon data-icon="inline-start" />
              Add app
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Connect new app</DialogTitle>
                <DialogDescription>
                  Add a local integration by providing its details.
                </DialogDescription>
              </DialogHeader>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="integration-name">App name</FieldLabel>
                  <Input
                    id="integration-name"
                    value={appName}
                    onChange={(event) => setAppName(event.target.value)}
                    placeholder="e.g. Zoom"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="integration-url">
                    App URL or integration key
                  </FieldLabel>
                  <Input
                    id="integration-url"
                    value={appUrl}
                    onChange={(event) => setAppUrl(event.target.value)}
                    placeholder="https://app.example.com"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="integration-description">
                    Description
                  </FieldLabel>
                  <Input
                    id="integration-description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Optional notes"
                  />
                </Field>
              </FieldGroup>
              <DialogFooter>
                <DialogClose
                  render={
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetForm}
                    />
                  }
                >
                  Cancel
                </DialogClose>
                <Button
                  type="button"
                  onClick={connectAccount}
                  disabled={!appName.trim() || !appUrl.trim()}
                >
                  Connect
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <p className="text-sm text-muted-foreground">
          Connected accounts allow you to keep local integration details in this
          browser session.
        </p>
      </div>
    </section>
  )
}

function SocialUrls() {
  const [urls, setUrls] = React.useState(["", "", ""])
  const [saved, setSaved] = React.useState(false)

  function updateUrl(index: number, value: string) {
    setUrls((current) =>
      current.map((url, currentIndex) => (currentIndex === index ? value : url))
    )
    setSaved(false)
  }

  return (
    <section
      id="social-urls"
      className="grid grid-cols-1 gap-10 lg:grid-cols-3"
    >
      <SectionHeading
        title="Social URLs"
        description="Manage your social URLs."
      />
      <div className="flex flex-col gap-6 lg:col-span-2">
        {saved && (
          <SavedNotice>
            Your social URLs are available for this browser session.
          </SavedNotice>
        )}
        <form
          className="flex flex-col gap-6"
          onSubmit={(event) => {
            event.preventDefault()
            setSaved(true)
          }}
        >
          <FieldGroup>
            {urls.map((url, index) => (
              <Field key={index}>
                <FieldLabel className="sr-only" htmlFor={`social-url-${index}`}>
                  Social URL {index + 1}
                </FieldLabel>
                <Input
                  id={`social-url-${index}`}
                  type="url"
                  placeholder="Link to social profile"
                  value={url}
                  onChange={(event) => updateUrl(index, event.target.value)}
                />
              </Field>
            ))}
          </FieldGroup>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setUrls((current) => [...current, ""])
                setSaved(false)
              }}
            >
              <PlusIcon data-icon="inline-start" />
              Add URL
            </Button>
            <Button type="submit">Save changes</Button>
          </div>
        </form>
      </div>
    </section>
  )
}

function DangerZone() {
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [deletionRequested, setDeletionRequested] = React.useState(false)

  return (
    <section
      id="danger-zone"
      className="grid grid-cols-1 gap-10 lg:grid-cols-3"
    >
      <SectionHeading
        title="Danger Zone"
        description="Delete your account permanently. This local demo does not send any deletion request."
      />
      <div className="flex flex-col gap-4 lg:col-span-2">
        {deletionRequested && (
          <SavedNotice>
            Your local deletion request was recorded. No account was deleted.
          </SavedNotice>
        )}
        <Card>
          <CardHeader>
            <CardTitle>Delete account</CardTitle>
            <CardDescription>
              Delete your account permanently. This action cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-end">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger
                render={<Button type="button" variant="destructive" />}
              >
                <Trash2Icon data-icon="inline-start" />
                Delete
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete account</DialogTitle>
                  <DialogDescription>
                    This is a presentational settings page. Confirming only
                    records a local request.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose
                    render={<Button type="button" variant="outline" />}
                  >
                    Cancel
                  </DialogClose>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => {
                      setDeletionRequested(true)
                      setDialogOpen(false)
                    }}
                  >
                    <Trash2Icon data-icon="inline-start" />
                    Delete account
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

export function AccountSettingsPanel() {
  return (
    <div className="flex flex-col gap-10">
      <PersonalInformation />
      <Separator />
      <EmailAndPassword />
      <Separator />
      <ConnectedAccounts />
      <Separator />
      <SocialUrls />
      <Separator />
      <DangerZone />
    </div>
  )
}
