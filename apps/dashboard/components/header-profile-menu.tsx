"use client"

import Link from "next/link"
import {
  BellIcon,
  ChevronsUpDownIcon,
  LogOutIcon,
  UserIcon,
} from "@/components/ui/icons"

import {
  ProfileBurmeseFontMenu,
  ProfileLanguageMenu,
} from "@/components/language-switcher"
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useAuth } from "@/contexts/auth-context"
import { useTranslation } from "@/contexts/language-context"
import { initials } from "@/lib/utils"

export function HeaderProfileMenu() {
  const { user, logout } = useAuth()
  const { t } = useTranslation()
  const { isMobile } = useSidebar()
  const name = user?.name || "User"
  const email = user?.email || ""
  const avatar = user?.avatar_url ?? null

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                aria-label={t("userDropdown.openProfileMenu")}
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              />
            }
          >
            <Avatar className="relative h-8 w-8 rounded-md">
              {avatar && (
                <AvatarImage src={avatar} alt={name} className="rounded-md" />
              )}
              <AvatarFallback>{initials(name)}</AvatarFallback>
              <AvatarBadge
                aria-hidden="true"
                className="-top-1 -right-1 bg-green-500 group-data-[collapsible=icon]:hidden"
              />
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{name}</span>
              <span className="truncate text-xs text-muted-foreground">
                {email}
              </span>
            </div>
            <ChevronsUpDownIcon className="ml-auto" aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-64"
            align="end"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex min-w-0 items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="relative size-8 rounded-md">
                  {avatar && (
                    <AvatarImage
                      src={avatar}
                      alt={name}
                      className="rounded-md"
                    />
                  )}
                  <AvatarFallback>{initials(name)}</AvatarFallback>
                  <AvatarBadge
                    aria-hidden="true"
                    className="-top-1 -right-1 bg-green-500"
                  />
                </Avatar>
                <div className="grid min-w-0 flex-1 leading-tight">
                  <span className="truncate font-medium">{name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem render={<Link href="/settings?tab=profile" />}>
                <UserIcon />
                {t("userDropdown.profile")}
              </DropdownMenuItem>
              <ProfileLanguageMenu label={t("userDropdown.language")} />
              <ProfileBurmeseFontMenu />
              <DropdownMenuItem>
                <BellIcon />
                {t("userDropdown.notifications")}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                variant="destructive"
                className="cursor-pointer"
                onClick={() => {
                  logout()
                }}
              >
                <LogOutIcon />
                {t("common.logout")}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
