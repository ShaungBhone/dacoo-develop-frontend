import {
  BellIcon,
  BriefcaseBusinessIcon,
  ChartNoAxesCombinedIcon,
  Clock3Icon,
  LandmarkIcon,
  MailIcon,
  MapPinIcon,
  UsersIcon,
  WalletCardsIcon,
  type LucideIcon,
} from "@/components/ui/icons"
import type { ViberMenuIcon } from "@/components/settings/viber-experience-api"

export const VIBER_MENU_ICON_OPTIONS: Array<{
  value: ViberMenuIcon
  label: string
  icon: LucideIcon
}> = [
  { value: "wallet-cards", label: "Balance", icon: WalletCardsIcon },
  { value: "landmark", label: "Bank or ATM", icon: LandmarkIcon },
  { value: "users", label: "Customers", icon: UsersIcon },
  { value: "mail", label: "Messages", icon: MailIcon },
  { value: "map-pin", label: "Location", icon: MapPinIcon },
  { value: "clock", label: "Hours", icon: Clock3Icon },
  { value: "chart", label: "Rates", icon: ChartNoAxesCombinedIcon },
  { value: "bell", label: "Notifications", icon: BellIcon },
  { value: "briefcase", label: "Services", icon: BriefcaseBusinessIcon },
]

export function viberMenuIconOption(icon: ViberMenuIcon | null) {
  return VIBER_MENU_ICON_OPTIONS.find((option) => option.value === icon)
}
