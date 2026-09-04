"use client"

import {
  Box as BoxIcon,
  BellIcon,
  BlocksIcon,
  Clock3Icon,
  CircleDollarSignIcon,
  CreditCardIcon,
  LayoutTemplateIcon,
  MessageSquareTextIcon,
  SettingsIcon,
  ShieldCheckIcon,
  TagIcon,
  UserRoundCheckIcon,
  UserRoundIcon,
  UsersIcon,
} from "@/components/ui/icons"
import type { LucideIcon } from "@/components/ui/icons"

export type SettingsTabSlug =
  | "general"
  | "teammate"
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
      { slug: "office-hours", label: "Office hours", icon: Clock3Icon },
      { slug: "security", label: "Security", icon: ShieldCheckIcon },
    ],
  },
  {
    label: "Inbox",
    tabs: [
      { slug: "assignments", label: "Assignments", icon: UserRoundCheckIcon },
      {
        slug: "saved-replies",
        label: "Saved replies",
        icon: MessageSquareTextIcon,
      },
    ],
  },
  {
    label: "Channels",
    tabs: [{ slug: "integrations", label: "Integration", icon: BlocksIcon }],
  },
  {
    label: "Subscription",
    tabs: [{ slug: "billing", label: "Billing", icon: CreditCardIcon }],
  },
  {
    label: "Data",
    tabs: [
      { slug: "objects", label: "Objects", icon: BoxIcon },
      { slug: "templates", label: "Templates", icon: LayoutTemplateIcon },
      { slug: "tags", label: "Tags", icon: TagIcon },
    ],
  },
  {
    label: "Personal",
    tabs: [
      { slug: "profile", label: "Profile", icon: UserRoundIcon },
      { slug: "notifications", label: "Notifications", icon: BellIcon },
    ],
  },
]

// Keep these query-string destinations available for existing deep links while
// presenting the streamlined grouped navigation above.
export const SETTINGS_TABS: readonly SettingsTabDefinition[] = [
  ...SETTINGS_TAB_GROUPS.flatMap((group) => group.tabs),
  { slug: "messenger", label: "Messenger", icon: BlocksIcon },
  { slug: "currency", label: "Currency", icon: CircleDollarSignIcon },
] as const
