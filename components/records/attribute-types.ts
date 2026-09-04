import type * as React from "react"

import type { AttributeType } from "@/components/records/api"
import {
  AlignLeftIcon,
  CalendarIcon,
  CheckSquareIcon,
  CircleDotIcon,
  CoinsIcon,
  GlobeIcon,
  ImageIcon,
  HashIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  StarIcon,
  TagIcon,
} from "@/components/ui/icons"

export interface AttributeTypeOption {
  type: AttributeType
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}

export const ATTRIBUTE_TYPE_OPTIONS: AttributeTypeOption[] = [
  {
    type: "image",
    label: "Image",
    description: "One uploaded image per record",
    icon: ImageIcon,
  },
  {
    type: "text",
    label: "Text",
    description: "Single-line or freeform text",
    icon: AlignLeftIcon,
  },
  {
    type: "number",
    label: "Number",
    description: "Numeric values, amounts, or counts",
    icon: HashIcon,
  },
  {
    type: "select",
    label: "Select",
    description: "Single option chosen from a custom list",
    icon: CircleDotIcon,
  },
  {
    type: "status",
    label: "Status",
    description: "Stage or pipeline status value",
    icon: CircleDotIcon,
  },
  {
    type: "currency",
    label: "Currency",
    description: "Financial values and monetary amounts",
    icon: CoinsIcon,
  },
  {
    type: "date",
    label: "Date",
    description: "Calendar date selector",
    icon: CalendarIcon,
  },
  {
    type: "timestamp",
    label: "Timestamp",
    description: "Date and time value",
    icon: CalendarIcon,
  },
  {
    type: "checkbox",
    label: "Checkbox",
    description: "True or false boolean flag",
    icon: CheckSquareIcon,
  },
  {
    type: "rating",
    label: "Rating",
    description: "1 to 5 star rating scale",
    icon: StarIcon,
  },
  {
    type: "domain",
    label: "Domain",
    description: "Website URLs or hostnames",
    icon: GlobeIcon,
  },
  {
    type: "email-address",
    label: "Email",
    description: "Email address with mailto action",
    icon: MailIcon,
  },
  {
    type: "phone-number",
    label: "Phone",
    description: "Phone number with international codes",
    icon: PhoneIcon,
  },
  {
    type: "location",
    label: "Location",
    description: "City, state, or country search",
    icon: MapPinIcon,
  },
  {
    type: "tags",
    label: "Tags",
    description: "Multiple tag labels",
    icon: TagIcon,
  },
]
