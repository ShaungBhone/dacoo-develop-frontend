"use client"

import {
  BookmarkIcon,
  BoxIcon,
  BriefcaseIcon,
  Building2Icon,
  CalendarIcon,
  ClipboardListIcon,
  CreditCardIcon,
  FileTextIcon,
  FlagIcon,
  GlobeIcon,
  Grid2x2Icon,
  HandshakeIcon,
  HeartIcon,
  LayersIcon,
  LifeBuoyIcon,
  MailIcon,
  MapPinIcon,
  MessageSquareIcon,
  PackageIcon,
  PhoneIcon,
  ReceiptIcon,
  ShoppingCartIcon,
  StarIcon,
  StoreIcon,
  TagIcon,
  TargetIcon,
  TruckIcon,
  UserIcon,
  UsersIcon,
  WrenchIcon,
  type LucideIcon,
} from "@/components/ui/icons"

import { cn } from "@/lib/utils"

/**
 * The icons a workspace may pick, keyed by the name the server stores.
 *
 * Deliberately a fixed map rather than a dynamic lookup on lucide's exports:
 * it keeps the bundle tree-shakeable and guarantees every stored name renders
 * something. Keep in sync with `object_icons` in config/crm.php.
 */
export const OBJECT_ICONS: Record<string, LucideIcon> = {
  box: BoxIcon,
  "building-2": Building2Icon,
  user: UserIcon,
  users: UsersIcon,
  handshake: HandshakeIcon,
  briefcase: BriefcaseIcon,
  "file-text": FileTextIcon,
  receipt: ReceiptIcon,
  package: PackageIcon,
  "shopping-cart": ShoppingCartIcon,
  "credit-card": CreditCardIcon,
  calendar: CalendarIcon,
  "clipboard-list": ClipboardListIcon,
  target: TargetIcon,
  flag: FlagIcon,
  star: StarIcon,
  heart: HeartIcon,
  bookmark: BookmarkIcon,
  tag: TagIcon,
  layers: LayersIcon,
  "grid-2x2": Grid2x2Icon,
  globe: GlobeIcon,
  "map-pin": MapPinIcon,
  phone: PhoneIcon,
  mail: MailIcon,
  "message-square": MessageSquareIcon,
  "life-buoy": LifeBuoyIcon,
  wrench: WrenchIcon,
  truck: TruckIcon,
  store: StoreIcon,
}

/**
 * Colour per object, as a text colour for the glyph and a solid swatch for the
 * picker dots.
 *
 * Written out in full because Tailwind only keeps classes it can see as
 * complete strings — building them by interpolation would compile to nothing.
 *
 * Keep in sync with `object_icon_colors` in config/crm.php.
 */
export const OBJECT_ICON_COLORS: Record<
  string,
  { swatch: string; text: string }
> = {
  blue: { swatch: "bg-blue-500", text: "text-blue-600 dark:text-blue-400" },
  indigo: { swatch: "bg-indigo-500", text: "text-indigo-600 dark:text-indigo-400" },
  purple: { swatch: "bg-purple-500", text: "text-purple-600 dark:text-purple-400" },
  pink: { swatch: "bg-pink-500", text: "text-pink-600 dark:text-pink-400" },
  red: { swatch: "bg-red-500", text: "text-red-600 dark:text-red-400" },
  orange: { swatch: "bg-orange-500", text: "text-orange-600 dark:text-orange-400" },
  amber: { swatch: "bg-amber-500", text: "text-amber-600 dark:text-amber-400" },
  green: { swatch: "bg-green-500", text: "text-green-600 dark:text-green-400" },
  teal: { swatch: "bg-teal-500", text: "text-teal-600 dark:text-teal-400" },
  cyan: { swatch: "bg-cyan-500", text: "text-cyan-600 dark:text-cyan-400" },
  slate: { swatch: "bg-slate-500", text: "text-slate-600 dark:text-slate-400" },
}

export const OBJECT_ICON_NAMES = Object.keys(OBJECT_ICONS)
export const OBJECT_COLOR_NAMES = Object.keys(OBJECT_ICON_COLORS)

/**
 * An object's icon: the glyph tinted with the object's colour, with no
 * background behind it.
 */
export function ObjectGlyph({
  icon,
  color,
  className,
}: {
  icon: string | null | undefined
  /** Omit to inherit the surrounding text colour. */
  color?: string | null
  className?: string
}) {
  const Icon = OBJECT_ICONS[icon ?? "box"] ?? BoxIcon
  const tint = color ? OBJECT_ICON_COLORS[color]?.text : undefined

  return <Icon className={cn("size-4 shrink-0", tint, className)} aria-hidden="true" />
}
