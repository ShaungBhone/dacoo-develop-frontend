"use client"

import * as React from "react"
import { toast } from "sonner"

import type {
  Attribute,
  AttributeType,
  RecordItem,
} from "@/components/records/api"
import { AttributeCreateSheet } from "@/components/records/attribute-create-sheet"
import { ATTRIBUTE_TYPE_OPTIONS } from "@/components/records/attribute-types"
import {
  getAttributeIcon,
  getRecordAttributeColumnId,
} from "@/components/records/record-table-columns"
import { useDataGrid } from "@/components/reui/data-grid/data-grid"
import {
  Cascader,
  CascaderContent,
  CascaderEmpty,
  CascaderList,
  CascaderPanel,
  CascaderStatus,
  CascaderTrigger,
} from "@/components/reui/cascader/cascader"
import { CascaderFooter } from "@/components/reui/cascader/cascader-footer"
import { CascaderItems } from "@/components/reui/cascader/cascader-item"
import {
  CascaderBreadcrumb,
  CascaderInput,
  CascaderNav,
} from "@/components/reui/cascader/cascader-nav"
import type {
  CascaderActionItem,
  CascaderNode,
} from "@/components/reui/cascader/cascader-types"
import { PlusIcon } from "@/components/ui/icons"

const SHOW_PREFIX = "show:"

export interface AddColumnPopoverProps {
  organizationId: number | string
  objectId: string
  objectSingular: string
  attributes: Attribute[]
  primaryAttributeSlug?: string
  onAttributeCreated?: (newAttribute: Attribute) => Promise<void> | void
  onAddExistingAttribute?: (attribute: Attribute) => void
  trigger?: React.ReactNode
}

export function AddColumnPopover({
  organizationId,
  objectId,
  objectSingular,
  attributes,
  primaryAttributeSlug,
  onAttributeCreated,
  onAddExistingAttribute,
  trigger,
}: AddColumnPopoverProps) {
  const { table } = useDataGrid<RecordItem>()
  const [open, setOpen] = React.useState(false)
  const [createType, setCreateType] = React.useState<AttributeType | null>(null)

  const items = React.useMemo<CascaderNode[]>(() => {
    const attributeNodes: CascaderNode[] = attributes
      .filter((attr) => attr.slug !== "external-id")
      .map((attr) => {
        const IconComponent = getAttributeIcon(
          attr.type,
          attr.slug,
          attr.config?.icon
        )
        return {
          value: `${SHOW_PREFIX}${attr.slug}`,
          label: attr.title,
          icon: <IconComponent className="size-4" />,
          keywords: [attr.slug, attr.type],
        }
      })

    return attributeNodes
  }, [attributes])

  const actions = React.useMemo<CascaderActionItem[]>(
    () => [
      {
        value: "create-new-attribute",
        label: "Create new attribute",
        icon: <PlusIcon className="size-4" />,
        items: ATTRIBUTE_TYPE_OPTIONS.map((option) => {
          const TypeIcon = option.icon
          return {
            value: `create-new-attribute:${option.type}`,
            label: option.label,
            icon: <TypeIcon className="size-4" />,
            onSelect: () => {
              setOpen(false)
              setCreateType(option.type)
            },
          }
        }),
      },
    ],
    []
  )

  const labels = React.useMemo(
    () => ({
      empty: "No matching attributes found",
    }),
    []
  )

  const handleAddAttribute = (attribute: Attribute) => {
    const columnId = getRecordAttributeColumnId(
      attribute,
      primaryAttributeSlug
    )
    const col = table.getColumn(columnId)
    const isBaseHidden = !!col && !col.getIsVisible()

    if (isBaseHidden) {
      col.toggleVisibility(true)

      // Ensure it is added to columnOrder if an explicit order is currently active
      const currentOrder: string[] = table.state.columnOrder ?? []
      if (currentOrder.length > 0 && !currentOrder.includes(columnId)) {
        const newOrder = [...currentOrder]
        const addColIdx = newOrder.indexOf("add-column")
        if (addColIdx >= 0) {
          newOrder.splice(addColIdx, 0, columnId)
        } else {
          newOrder.push(columnId)
        }
        table.setColumnOrder(newOrder)
      }

      setOpen(false)
      toast.success(`Added ${attribute.title} column`)
      return
    }

    onAddExistingAttribute?.(attribute)
    setOpen(false)
    toast.success(`Added another ${attribute.title} column`)
  }

  const handleValueChange = (next: string) => {
    if (next.startsWith(SHOW_PREFIX)) {
      const slug = next.slice(SHOW_PREFIX.length)
      const attribute = attributes.find((attr) => attr.slug === slug)
      if (attribute) {
        handleAddAttribute(attribute)
      }
      return
    }
  }

  const handleAttributeCreated = async (newAttr: Attribute) => {
    if (onAttributeCreated) {
      await onAttributeCreated(newAttr)
    }

    // Automatically show the new column in table
    const col = table.getColumn(newAttr.slug)
    if (col) {
      col.toggleVisibility(true)
    }
  }

  return (
    <>
      <Cascader
        items={items}
        value=""
        onValueChange={handleValueChange}
        open={open}
        onOpenChange={setOpen}
        searchScope="deep"
        labels={labels}
        actions={actions}
      >
        <CascaderTrigger
          showIcon={false}
          render={
            trigger ? (
              (trigger as React.ReactElement)
            ) : (
              <button
                type="button"
                className="flex h-full w-full items-center gap-1.5 px-3 text-left text-muted-foreground/70 transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <PlusIcon className="size-3.5" aria-hidden="true" />
                <span>Add column</span>
              </button>
            )
          }
          {...(trigger ? null : { "aria-label": "Add column" })}
        />

        <CascaderContent
          align="start"
          side="bottom"
          sideOffset={4}
          className="w-72"
        >
          <CascaderPanel>
            <CascaderNav>
              <CascaderInput
                placeholder={`Search ${objectSingular.toLowerCase()} attributes...`}
              />
            </CascaderNav>
            <CascaderBreadcrumb />
            <CascaderEmpty />
            <CascaderList>
              <CascaderItems />
            </CascaderList>
            <CascaderFooter />
            <CascaderStatus />
          </CascaderPanel>
        </CascaderContent>
      </Cascader>

      {createType && (
        <AttributeCreateSheet
          organizationId={organizationId}
          objectId={objectId}
          objectSingular={objectSingular}
          initialType={createType}
          onClose={() => setCreateType(null)}
          onCreated={handleAttributeCreated}
        />
      )}
    </>
  )
}
