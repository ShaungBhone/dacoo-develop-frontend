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
  // SidebarGroupAction,
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
  WorkflowIcon,
  // PlusIcon, // For Collections (commented out for now)
  // FolderIcon,
} from "@/components/ui/icons"

import { useActiveOrganization } from "@/hooks/use-active-organization"
import { fetchObjects, type RecordObject } from "@/components/records/api"
import { ObjectGlyph } from "@/components/records/object-icon"
// Collections feature - commented out for now, to be re-enabled in future
// import { fetchCollections, type Collection } from "@/components/records/collections-api"
// import { CreateCollectionDialog } from "@/components/records/create-collection-dialog"

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
        { title: "Workflows", url: "/workflows", icon: <WorkflowIcon /> },
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
  // Collections feature - commented out for now, to be re-enabled in future
  // const [collections, setCollections] = React.useState<Collection[]>([])
  // const [createDialogOpen, setCreateDialogOpen] = React.useState(false)

  const loadObjects = React.useCallback(() => {
    if (!organization) return

    fetchObjects(organization.id)
      .then(setObjects)
      .catch(() => {
        // A sidebar is not the place to surface a schema error; the Objects
        // settings screen reports it properly.
      })
  }, [organization])

  // const loadCollections = React.useCallback(() => {
  //   if (!organization) return
  //   fetchCollections(organization.id)
  //     .then(setCollections)
  //     .catch(() => {})
  // }, [organization])

  // The Records group is generated from the workspace's own schema
  React.useEffect(() => {
    loadObjects()
    // loadCollections()
    window.addEventListener("record-templates-installed", loadObjects)
    window.addEventListener("record-objects-changed", loadObjects)
    // window.addEventListener("record-collections-changed", loadCollections)
    return () => {
      window.removeEventListener("record-templates-installed", loadObjects)
      window.removeEventListener("record-objects-changed", loadObjects)
      // window.removeEventListener("record-collections-changed", loadCollections)
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

  // Collections group - commented out for now, to be re-enabled in future
  /*
  const collectionsGroup = React.useMemo(
    () => ({
      group: "Collections",
      action: (
        <SidebarGroupAction
          title="Create Collection"
          onClick={() => setCreateDialogOpen(true)}
          className="cursor-pointer"
        >
          <PlusIcon className="size-3" />
          <span className="sr-only">Create Collection</span>
        </SidebarGroupAction>
      ),
      items: collections.map((col) => ({
        title: col.name,
        url: `/collections/${col.slug}`,
        icon: (
          <FolderIcon
            className="size-4 shrink-0"
            style={{ color: col.iconColor ?? undefined }}
          />
        ),
      })),
    }),
    [collections]
  )
  */

  const translatedNavGroups = React.useMemo(() => {
    return data.navGroups.map((group) => ({
      group: t(`sidebar.groups.${group.groupKey}`, {
        defaultValue: group.defaultGroup,
      }),
      items: group.items.map((item) => ({
        ...item,
        title: t(`common.${item.title.toLowerCase()}`, {
          defaultValue: item.title,
        }),
      })),
    }))
  }, [t])

  const navGroups = React.useMemo(() => {
    const [workspaceGroup, communicationGroup, ...restGroups] = translatedNavGroups
    return [
      workspaceGroup,
      communicationGroup,
      recordsGroup,
      // collectionsGroup, // Temporarily commented out for future release
      ...restGroups,
    ].filter(Boolean)
  }, [recordsGroup, translatedNavGroups])

  return (
    <>
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

      {/* <CreateCollectionDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      /> */}
    </>
  )
}
