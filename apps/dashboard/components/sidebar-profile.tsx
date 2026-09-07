"use client"

import * as React from "react"
import Link from "next/link"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useTranslation } from "@/contexts/language-context"
import { useOrganization } from "@/contexts/organization-context"
import { useAuth } from "@/contexts/auth-context"
import { WorkspaceCreateDialog } from "@/components/workspace-create-dialog"
import { initials } from "@/lib/utils"
import {
  Building2Icon,
  CheckIcon,
  ChevronsUpDownIcon,
  CreditCardIcon,
  PlusIcon,
  SettingsIcon,
  SparklesIcon,
} from "@/components/ui/icons"

export function SidebarProfile() {
  const {
    organizations,
    activeOrganization,
    activeOrganizationId,
    setActiveOrganizationId,
  } = useOrganization()
  const { user, refreshUser } = useAuth()
  const { t } = useTranslation()
  const { isMobile } = useSidebar()
  const [createOpen, setCreateOpen] = React.useState(false)
  const canCreateWorkspace = user?.can_create_organization ?? true

  const workspaceName =
    activeOrganization?.name || t("sidebar.personalWorkspace")

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                aria-label={t("userDropdown.workspace")}
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              />
            }
          >
            <Avatar className="relative rounded-md">
              {activeOrganization?.logo_url && (
                <AvatarImage
                  src={activeOrganization.logo_url}
                  alt={`${workspaceName} logo`}
                  className="rounded-md"
                />
              )}
              <AvatarFallback>{initials(workspaceName)}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{workspaceName}</span>
              <span className="truncate text-xs">
                {t("userDropdown.workspace")}
              </span>
            </div>
            <ChevronsUpDownIcon className="ml-auto" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-72"
            align="end"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              {t("userDropdown.workspace")}
            </DropdownMenuLabel>
            <DropdownMenuGroup>
              {organizations.length > 0 ? (
                organizations.map((organization) => (
                  <DropdownMenuItem
                    key={organization.id}
                    onSelect={() => setActiveOrganizationId(organization.id)}
                  >
                    <Avatar className="relative size-4 rounded-md">
                      {organization.logo_url && (
                        <AvatarImage
                          src={organization.logo_url}
                          alt={`${organization.name} logo`}
                          className="rounded-md"
                        />
                      )}
                      <AvatarFallback className="rounded-md">
                        <Building2Icon aria-hidden="true" />
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate">{organization.name}</span>
                    {organization.id === activeOrganizationId && (
                      <CheckIcon className="ml-auto" />
                    )}
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem disabled>
                  <Building2Icon />
                  <span className="truncate">
                    {t("sidebar.personalWorkspace")}
                  </span>
                  <CheckIcon className="ml-auto" />
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                disabled={!canCreateWorkspace}
                onSelect={(event) => {
                  event.preventDefault()
                  setCreateOpen(true)
                }}
              >
                <PlusIcon />
                {canCreateWorkspace
                  ? t("userDropdown.addWorkspace")
                  : `Workspace limit reached (${organizations.length}/${user?.organization_limit ?? organizations.length})`}
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/billing" />}>
                <SparklesIcon />
                {t("userDropdown.upgrade")}
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/settings" />}>
                <SettingsIcon />
                {t("common.settings")}
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/billing" />}>
                <CreditCardIcon />
                {t("common.billing")}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <WorkspaceCreateDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          onCreated={async (organizationId) => {
            await refreshUser()
            setActiveOrganizationId(organizationId)
          }}
        />
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
