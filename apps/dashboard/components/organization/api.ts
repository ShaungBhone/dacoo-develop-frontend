import { apiFetch } from "@/lib/api"
import type {
  InvitationRow,
  MemberRow,
  OrgListRow,
  RoleOption,
} from "@/components/organization/data"

/* -------------------------------------------------------------------------- */
/*                              Raw backend shapes                            */
/* -------------------------------------------------------------------------- */

type RawMember = {
  id: number
  name: string
  email: string
  avatar_url: string | null
  role: string | null
  is_owner: boolean
  status: string | null
  joined_at: string | null
}

type RawInvitation = {
  id: string
  email: string | null
  role: string | null
  status: string
  invited_user: { id: number; name: string; avatar_url: string | null } | null
}

type RawRole = {
  name: string
  label: string
  assignable: boolean
  permissions: { key: string; label: string; enabled: boolean }[]
}

/* -------------------------------------------------------------------------- */
/*                                  Adapters                                  */
/* -------------------------------------------------------------------------- */

function mapMember(raw: RawMember): MemberRow {
  return {
    kind: "member",
    id: raw.id,
    name: raw.name,
    email: raw.email,
    avatarUrl: raw.avatar_url ?? "",
    role: raw.role,
    isOwner: raw.is_owner,
    status: raw.status ?? "active",
  }
}

function mapInvitation(raw: RawInvitation): InvitationRow {
  return {
    kind: "invitation",
    id: raw.id,
    name: raw.invited_user?.name ?? "",
    email: raw.email ?? "",
    role: raw.role,
    status: raw.status,
  }
}

/* -------------------------------------------------------------------------- */
/*                                   Reads                                    */
/* -------------------------------------------------------------------------- */

/** GET .../members — active organization members, each annotated with role. */
export async function fetchMembers(organizationId: number): Promise<MemberRow[]> {
  const res = await apiFetch<{ data: RawMember[] }>(
    `/api/v1/organizations/${organizationId}/members`
  )
  return res.data.map(mapMember)
}

/** GET .../invitations — pending workspace-level invitations. */
export async function fetchInvitations(
  organizationId: number
): Promise<InvitationRow[]> {
  const res = await apiFetch<{ data: RawInvitation[] }>(
    `/api/v1/organizations/${organizationId}/invitations`
  )
  return res.data
    .filter((invitation) => invitation.status === "pending")
    .map(mapInvitation)
}

/** GET .../roles — the role catalog; returns only the assignable roles. */
export async function fetchAssignableRoles(
  organizationId: number
): Promise<RoleOption[]> {
  const res = await apiFetch<{ data: RawRole[] }>(
    `/api/v1/organizations/${organizationId}/roles`
  )
  return res.data
    .filter((role) => role.assignable)
    .map((role) => ({ name: role.name, label: role.label }))
}

/* -------------------------------------------------------------------------- */
/*                                  Mutations                                 */
/* -------------------------------------------------------------------------- */

/** POST .../invitations — invite a user by email with an optional role. */
export async function inviteMember(
  organizationId: number,
  input: { email: string; role?: string }
): Promise<InvitationRow> {
  const res = await apiFetch<{ data: RawInvitation }>(
    `/api/v1/organizations/${organizationId}/invitations`,
    { method: "POST", body: input }
  )
  return mapInvitation(res.data)
}

/** DELETE .../invitations/{invitation} — revoke a pending invitation. */
export async function revokeInvitation(
  organizationId: number,
  invitationId: string
): Promise<void> {
  await apiFetch(
    `/api/v1/organizations/${organizationId}/invitations/${invitationId}`,
    { method: "DELETE" }
  )
}

/** PATCH .../members/{member} — change a member's organization role. */
export async function updateMemberRole(
  organizationId: number,
  memberId: number,
  role: string
): Promise<MemberRow> {
  const res = await apiFetch<{ data: RawMember }>(
    `/api/v1/organizations/${organizationId}/members/${memberId}`,
    { method: "PATCH", body: { role } }
  )
  return mapMember(res.data)
}

/** DELETE .../members/{member} — remove a member from the organization. */
export async function removeMember(
  organizationId: number,
  memberId: number
): Promise<void> {
  await apiFetch(
    `/api/v1/organizations/${organizationId}/members/${memberId}`,
    { method: "DELETE" }
  )
}

/** Remove a row regardless of whether it is a member or a pending invite. */
export async function removeRow(
  organizationId: number,
  row: OrgListRow
): Promise<void> {
  if (row.kind === "invitation") {
    await revokeInvitation(organizationId, row.id)
    return
  }
  await removeMember(organizationId, row.id)
}
