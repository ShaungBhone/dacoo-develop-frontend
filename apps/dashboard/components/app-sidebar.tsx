"use client"

import * as React from "react"

import { HeaderProfileMenu } from "@/components/header-profile-menu"
import { Navigation } from "@/components/navigation"
import { SidebarProfile } from "@/components/sidebar-profile"
import { useTranslation } from "@/contexts/language-context"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  BarChart3Icon,
  TerminalSquareIcon,
  DatabaseIcon,
  ActivityIcon,
  BotIcon,
  Ellipsis as EllipsisIcon,
  CreditCardIcon,
  CoinsIcon,
  MessageSquareIcon,
  WalletIcon,
  ArrowLeftRightIcon,
  HomeIcon,
} from "@/components/ui/icons"

import { useActiveOrganization } from "@/hooks/use-active-organization"
import { fetchObjects, type RecordObject } from "@/components/records/api"
import { ObjectGlyph } from "@/components/records/object-icon"
import { fetchConversations } from "@/components/inbox/api"

// Navigation groups data for the inbox chat application.
const data = {
  navGroups: [
    {
      groupKey: "general",
      defaultGroup: "Workspace",
      items: [
        { title: "Home", url: "/home", icon: <HomeIcon /> },
      ],
    },
    {
      groupKey: "communication",
      defaultGroup: "Communication",
      items: [
        { title: "Inbox", url: "/inbox", icon: <MessageSquareIcon /> },
        // { title: "Deals", url: "/deals", icon: <HandshakeIcon /> },
        { title: "Activity", url: "/activity", icon: <ActivityIcon /> },
      ],
    },
    {
      groupKey: "aiAndAutomation",
      defaultGroup: "Automations",
      items: [
        { title: "Agents", url: "/agents", icon: <BotIcon /> },
        { title: "Datasets", url: "/datasets", icon: <DatabaseIcon /> },
        {
          title: "Playground",
          url: "/playground",
          icon: <TerminalSquareIcon />,
        },
      ],
    },
    {
      groupKey: "overview",
      defaultGroup: "Overview",
      items: [
        {
          title: "Reports",
          url: "/dashboard",
          icon: <BarChart3Icon />,
        },
        { title: "Usage", url: "/ai-usage", icon: <CoinsIcon /> },
      ],
    },
    {
      groupKey: "finance",
      defaultGroup: "Finance",
      items: [
        { title: "Cards", url: "/cards", icon: <CreditCardIcon /> },
        { title: "Balance", url: "/balance", icon: <WalletIcon /> },
        {
          title: "Transactions",
          url: "/transactions",
          icon: <ArrowLeftRightIcon />,
        },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { t } = useTranslation()
  const organization = useActiveOrganization()
  const [objects, setObjects] = React.useState<RecordObject[]>([])
  const [conversationCount, setConversationCount] = React.useState<number | null>(
    null
  )

  React.useEffect(() => {
    let isCurrent = true

    if (!organization) {
      setConversationCount(null)
      return () => {
        isCurrent = false
      }
    }

    fetchConversations(organization.id)
      .then((conversations) => {
        if (isCurrent) setConversationCount(conversations.length)
      })
      .catch(() => {
        if (isCurrent) setConversationCount(null)
      })

    return () => {
      isCurrent = false
    }
  }, [organization])

  const loadObjects = React.useCallback(() => {
    if (!organization) return

    fetchObjects(organization.id)
      .then(setObjects)
      .catch(() => {
        // A sidebar is not the place to surface a schema error; the Objects
        // settings screen reports it properly.
      })
  }, [organization])

  // The Records group is generated from the workspace's own schema, so a
  // custom object appears in the sidebar the moment it is created.
  React.useEffect(() => {
    loadObjects()
    window.addEventListener("record-templates-installed", loadObjects)
    window.addEventListener("record-objects-changed", loadObjects)
    return () => {
      window.removeEventListener("record-templates-installed", loadObjects)
      window.removeEventListener("record-objects-changed", loadObjects)
    }
  }, [loadObjects])

  const recordsGroup = React.useMemo(
    () => ({
      group: "Records",
      items: [
        ...objects.map((object) => ({
          title: object.pluralNoun,
          url: `/records/${object.slug}`,
          icon: <ObjectGlyph icon={object.icon} color={object.iconColor} />,
        })),
        {
          title: "All objects",
          url: "/settings?tab=objects",
          icon: <EllipsisIcon />,
        },
      ],
    }),
    [objects]
  )

  const translatedNavGroups = React.useMemo(() => {
    return data.navGroups.map((group) => ({
      group: t(`sidebar.groups.${group.groupKey}`, {
        defaultValue: group.defaultGroup,
      }),
      items: group.items.map((item) => ({
        ...item,
        badge: item.url === "/inbox" ? conversationCount : undefined,
        title: t(`common.${item.title.toLowerCase()}`, {
          defaultValue: item.title,
        }),
      })),
    }))
  }, [conversationCount, t])

  const navGroups = React.useMemo(() => {
    const [workspaceGroup, communicationGroup, ...restGroups] = translatedNavGroups
    return [workspaceGroup, communicationGroup, recordsGroup, ...restGroups].filter(Boolean)
  }, [recordsGroup, translatedNavGroups])

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarProfile />
      </SidebarHeader>
      <SidebarContent>
        <Navigation navGroups={navGroups} />
      </SidebarContent>
      <SidebarFooter>
        <HeaderProfileMenu />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
