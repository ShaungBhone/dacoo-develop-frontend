"use client"

import * as React from "react"
import { useId } from "react"
import { UsersIcon, PlusIcon, MailIcon, TriangleAlertIcon } from "@/components/ui/icons"

import { ApiError } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { useOrganization } from "@/contexts/organization-context"
import {
  fetchAssignableRoles,
  fetchInvitations,
  fetchMembers,
  inviteMember,
  removeRow,
  updateMemberRole,
} from "@/components/organization/api"
import {
  type MemberRow,
  type OrgListRow,
  type RoleOption,
} from "@/components/organization/data"
import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { DataTable } from "@/components/data-table"
import { buildTeammateColumns } from "@/components/settings/teammate-table-columns"

const ROLE_DESCRIPTIONS: Record<string, string> = {
  admin: "Manage teammates, workspace settings, and customer conversations.",
  agent: "Work customer conversations and collaborate with the team.",
  member: "View the team, customer conversations, and contacts.",
  sale: "Manage leads, contacts, and customer conversations.",
  support: "Support customer conversations and manage contacts.",
}

function getRoleDescription(role: RoleOption) {
  return (
    ROLE_DESCRIPTIONS[role.name] ??
    `Give this teammate the ${role.label} access level.`
  )
}

function InviteDialog({
  open,
  onOpenChange,
  roles,
  onInvite,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  roles: RoleOption[]
  onInvite: (email: string, role?: string) => Promise<void>
}) {
  const [email, setEmail] = React.useState("")
  const [role, setRole] = React.useState<string>("")
  const roleGroupId = useId()
  const [submitting, setSubmitting] = React.useState(false)
  const [errors, setErrors] = React.useState<{
    email?: string
    role?: string
    general?: string
  }>({})

  React.useEffect(() => {
    if (open) {
      setEmail("")
      setRole(roles[0]?.name ?? "")
      setErrors({})
    }
  }, [open, roles])

  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  async function handleSubmit() {
    if (!valid) return
    setSubmitting(true)
    setErrors({})
    try {
      await onInvite(email, role || undefined)
      onOpenChange(false)
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors({
          email: err.errors?.email?.[0],
          role: err.errors?.role?.[0],
          general: err.errors ? undefined : err.message,
        })
      } else {
        setErrors({ general: "Failed to send invitation. Please try again." })
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-balance">Invite a member</DialogTitle>
          <DialogDescription>
            Send an invitation to join this organization.
          </DialogDescription>
        </DialogHeader>
        <FieldGroup className="gap-4 py-2">
          {errors.general && (
            <Alert variant="destructive">
              <TriangleAlertIcon className="size-4" aria-hidden="true" />
              <AlertDescription>{errors.general}</AlertDescription>
            </Alert>
          )}
          <Field data-invalid={errors.email ? true : undefined}>
            <FieldLabel htmlFor="invite-email">Email address</FieldLabel>
            <Input
              id="invite-email"
              type="email"
              name="email"
              autoComplete="email"
              spellCheck={false}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g., teammate@company.com…"
              aria-invalid={errors.email ? true : undefined}
            />
            {errors.email && <FieldError>{errors.email}</FieldError>}
          </Field>
          {roles.length > 0 && (
            <FieldSet>
              <FieldLegend variant="label">Role</FieldLegend>
              <FieldDescription>
                Choose the access level this teammate will receive.
              </FieldDescription>
              <RadioGroup
                value={role}
                onValueChange={setRole}
                aria-label="Choose a teammate role"
                className="gap-2"
              >
                {roles.map((option) => {
                  const optionId = `${roleGroupId}-${option.name}`
                  const descriptionId = `${optionId}-description`

                  return (
                    <div
                      key={option.name}
                      className="relative flex w-full gap-2 rounded-md border border-input p-4 outline-none has-data-checked:border-primary/50"
                    >
                      <RadioGroupItem
                        id={optionId}
                        value={option.name}
                        aria-describedby={descriptionId}
                        aria-invalid={errors.role ? true : undefined}
                        className="absolute top-4 right-4 size-5 [&_[data-slot=radio-group-indicator]>span]:size-2.5"
                      />
                      <div className="grid grow gap-2 pr-8">
                        <Label
                          htmlFor={optionId}
                          className="justify-between after:absolute after:inset-0"
                        >
                          {option.label}
                        </Label>
                        <p
                          id={descriptionId}
                          className="text-xs text-muted-foreground"
                        >
                          {getRoleDescription(option)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </RadioGroup>
              {errors.role && <FieldError>{errors.role}</FieldError>}
            </FieldSet>
          )}
        </FieldGroup>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!valid || submitting}>
            {submitting ? (
              <>
                <Spinner className="size-4" />
                Sending…
              </>
            ) : (
              <>
                <MailIcon className="size-4" aria-hidden="true" />
                Send invite
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ListSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-3 p-4">
      <Skeleton className="h-9 w-full max-w-sm rounded-lg" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className="h-10 w-full rounded-md" />
      ))}
    </div>
  )
}

function MembersSection({
  rows,
  roles,
  currentUserId,
  canManage,
  isLoading,
  onInvite,
  onRoleChange,
  onRemove,
}: {
  rows: OrgListRow[]
  roles: RoleOption[]
  currentUserId: number
  canManage: boolean
  isLoading: boolean
  onInvite: (email: string, role?: string) => Promise<void>
  onRoleChange: (member: MemberRow, role: string) => void
  onRemove: (row: OrgListRow) => void
}) {
  const [inviteOpen, setInviteOpen] = React.useState(false)

  const columns = React.useMemo(
    () =>
      buildTeammateColumns({
        roles,
        currentUserId,
        canManage,
        onRoleChange,
        onRemove,
      }),
    [roles, currentUserId, canManage, onRoleChange, onRemove]
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {isLoading ? (
        <ListSkeleton />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          searchPlaceholder="Search name or email…"
          searchableColumnIds={["name", "email", "role", "status"]}
          initialPageSize={20}
          columnsLabel="View"
          emptyMessage="No teammates yet. Invite someone to collaborate."
          getRowId={(row) => `${row.kind}-${row.id}`}
          toolbarActions={
            canManage ? (
              <Button type="button" onClick={() => setInviteOpen(true)}>
                <PlusIcon data-icon="inline-start" aria-hidden="true" />
                Invite
              </Button>
            ) : undefined
          }
          className="min-h-0 flex-1 gap-0"
          toolbarClassName="shrink-0 border-b border-border px-4 py-2"
          containerClassName="min-h-0 flex-1 overflow-auto relative"
          headerClassName="bg-muted"
          rowClassName="bg-background hover:bg-muted/40"
          footerClassName="shrink-0 border-t border-border px-4 py-2"
        />
      )}

      <InviteDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        roles={roles}
        onInvite={onInvite}
      />
    </div>
  )
}

export function TeamView() {
  const { user } = useAuth()
  const { activeOrganization, isOwner, can } = useOrganization()

  const organizationId = activeOrganization?.id ?? null

  // Managing members/invitations mirrors the backend's canManageMembers():
  // the owner, or a holder of any role-management permission.
  const canManage =
    isOwner || can("create:role") || can("update:role") || can("delete:role")

  const [rows, setRows] = React.useState<OrgListRow[]>([])
  const [roles, setRoles] = React.useState<RoleOption[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (organizationId === null) {
      return
    }

    let cancelled = false
    setIsLoading(true)
    setError(null)

    Promise.all([
      fetchMembers(organizationId),
      fetchInvitations(organizationId),
      fetchAssignableRoles(organizationId),
    ])
      .then(([members, invitations, roleOptions]) => {
        if (cancelled) return
        setRows([...members, ...invitations])
        setRoles(roleOptions)
      })
      .catch((err) => {
        if (cancelled) return
        setError(
          err instanceof ApiError ? err.message : "Failed to load members."
        )
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [organizationId])

  const handleInvite = React.useCallback(
    async (email: string, role?: string) => {
      if (organizationId === null) return
      const invitation = await inviteMember(organizationId, { email, role })
      setRows((prev) => [...prev, invitation])
    },
    [organizationId]
  )

  const handleRoleChange = React.useCallback(
    async (member: MemberRow, role: string) => {
      if (organizationId === null) return
      try {
        const updated = await updateMemberRole(organizationId, member.id, role)
        setRows((prev) =>
          prev.map((r) =>
            r.kind === "member" && r.id === member.id ? updated : r
          )
        )
      } catch (err) {
        setError(
          err instanceof ApiError ? err.message : "Failed to update the role."
        )
      }
    },
    [organizationId]
  )

  const handleRemove = React.useCallback(
    async (row: OrgListRow) => {
      if (organizationId === null) return
      try {
        await removeRow(organizationId, row)
        setRows((prev) =>
          prev.filter((r) => !(r.kind === row.kind && r.id === row.id))
        )
      } catch (err) {
        setError(
          err instanceof ApiError ? err.message : "Failed to remove the member."
        )
      }
    },
    [organizationId]
  )

  if (!user) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!activeOrganization) {
    return (
      <Empty className="min-h-96 border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <UsersIcon aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>No organization selected</EmptyTitle>
          <EmptyDescription>
            Select or create an organization from the workspace switcher to
            manage its team.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      {error && (
        <div className="shrink-0 p-4">
          <Alert variant="destructive">
            <TriangleAlertIcon className="size-4" aria-hidden="true" />
            <AlertTitle className="text-balance">
              Something went wrong
            </AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      <MembersSection
        rows={rows}
        roles={roles}
        currentUserId={user.id}
        canManage={canManage}
        isLoading={isLoading}
        onInvite={handleInvite}
        onRoleChange={handleRoleChange}
        onRemove={handleRemove}
      />
    </div>
  )
}
