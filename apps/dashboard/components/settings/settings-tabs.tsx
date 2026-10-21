"use client"

import {
  BlocksIcon,
  MessageSquareTextIcon,
  SettingsIcon,
  ShieldIcon,
  TagIcon,
  UserRoundIcon,
  UsersIcon,
} from "@/components/ui/icons"
import type { LucideIcon } from "@/components/ui/icons"

export type SettingsTabSlug =
  | "general"
  | "teammate"
  | "roles"
  | "office-hours"
  | "security"
  | "assignments"
  | "saved-replies"
  | "messenger"
  | "billing"
  | "tags"
  | "objects"
  | "templates"
  | "profile"
  | "notifications"
  | "integrations"
  | "currency"

type SettingsTabDefinition = {
  slug: SettingsTabSlug
  label: string
  icon: LucideIcon
}

export const SETTINGS_TAB_GROUPS: readonly {
  label: string
  tabs: readonly SettingsTabDefinition[]
}[] = [
  {
    label: "Workspace",
    tabs: [
      { slug: "general", label: "General", icon: SettingsIcon },
      { slug: "teammate", label: "Teammates", icon: UsersIcon },
      { slug: "roles", label: "Roles", icon: ShieldIcon },
    ],
  },
  {
    label: "Messaging",
    tabs: [
      { slug: "integrations", label: "Connections", icon: BlocksIcon },
      {
        slug: "saved-replies",
        label: "Saved replies",
        icon: MessageSquareTextIcon,
      },
      { slug: "tags", label: "Tags", icon: TagIcon },
    ],
  },
  {
    label: "Account",
    tabs: [{ slug: "profile", label: "Profile", icon: UserRoundIcon }],
  },
]
export const SETTINGS_TABS: readonly SettingsTabDefinition[] =
  SETTINGS_TAB_GROUPS.flatMap((group) => group.tabs)
