/* -------------------------------------------------------------------------- */
/*                    Organization members & invitations types                */
/* -------------------------------------------------------------------------- */

/** An assignable role option, sourced from the backend role catalog. */
export type RoleOption = {
  name: string
  label: string
}

/** Detailed role model with granted permissions and active member counts. */
export type RoleDetail = {
  id: string
  name: string
  label: string
  description: string | null
  is_system: boolean
  is_owner: boolean
  assignable: boolean
  members_count: number
  permission_keys: string[]
  permissions: { key: string; label: string; enabled: boolean }[]
}

/** An item in the permission catalog with key, title, and descriptive summary. */
export type PermissionItem = {
  key: string
  label: string
  description: string
}

/** A functional module grouping related permissions for the permission matrix. */
export type PermissionModule = {
  key: string
  label: string
  description: string
  permissions: PermissionItem[]
}

/** An active organization member (backed by a real user account). */
export type MemberRow = {
  kind: "member"
  /** Raw integer user id (the User model has no Sqids route key). */
  id: number
  name: string
  email: string
  avatarUrl: string
  role: string | null
  isOwner: boolean
  status: string
}

/** A pending invitation that has not yet been accepted. */
export type InvitationRow = {
  kind: "invitation"
  /** Sqids-encoded invitation id. */
  id: string
  name: string
  email: string
  role: string | null
  status: string
}

/** A row in the members list — either an active member or a pending invite. */
export type OrgListRow = MemberRow | InvitationRow

/** Human-friendly fallback label for a role name. */
export function roleLabel(role: string | null, roles: RoleOption[]): string {
  if (!role) {
    return "—"
  }
  const match = roles.find((r) => r.name === role)
  if (match) {
    return match.label
  }
  return role.charAt(0).toUpperCase() + role.slice(1)
}
