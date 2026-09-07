import { createElement } from "react"

import type { Attribute } from "@/components/records/api"
import { getAttributeIcon } from "@/components/records/record-table-columns"

/**
 * An attribute's icon, resolved from its type, slug, and `config.icon`.
 *
 * The lookup lives here so both the field rows and the filter bar get the same
 * icon an attribute already has in the grid. `createElement` rather than JSX:
 * `getAttributeIcon` is a function call, so JSX would read as constructing a
 * component during render even though it only ever returns one of a fixed set
 * of module-level lucide icons.
 */
export function AttributeIcon({
  attribute,
  className,
}: {
  attribute: Attribute
  className?: string
}) {
  return createElement(
    getAttributeIcon(attribute.type, attribute.slug, attribute.config?.icon),
    { className }
  )
}
