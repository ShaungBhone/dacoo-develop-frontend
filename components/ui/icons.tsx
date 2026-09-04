"use client"

import * as React from "react"
import type { LucideIcon, LucideProps } from "lucide-react"

import { ActivityIcon as AnimatedActivityIcon } from "@/components/ui/activity"
import { ArrowRightIcon as AnimatedArrowRightIcon } from "@/components/ui/arrow-right"
import { BellIcon as AnimatedBellIcon } from "@/components/ui/bell"
import { BotIcon as AnimatedBotIcon } from "@/components/ui/bot"
import { ChevronDownIcon as AnimatedChevronDownIcon } from "@/components/ui/chevron-down"
import { ChevronRightIcon as AnimatedChevronRightIcon } from "@/components/ui/chevron-right"
import { ChevronUpIcon as AnimatedChevronUpIcon } from "@/components/ui/chevron-up"
import { CreditCardIcon as AnimatedCreditCardIcon } from "@/components/ui/credit-card"
import { FileTextIcon as AnimatedFileTextIcon } from "@/components/ui/file-text"
import { MessageSquareIcon as AnimatedMessageSquareIcon } from "@/components/ui/message-square"
import { PlusIcon as AnimatedPlusIcon } from "@/components/ui/plus"
import { SearchIcon as AnimatedSearchIcon } from "@/components/ui/search"
import { SettingsIcon as AnimatedSettingsIcon } from "@/components/ui/settings"
import { UserIcon as AnimatedUserIcon } from "@/components/ui/user"
import { UsersIcon as AnimatedUsersIcon } from "@/components/ui/users"
import { WalletIcon as AnimatedWalletIcon } from "@/components/ui/wallet"
import { XIcon as AnimatedXIcon } from "@/components/ui/x"
import { cn } from "@/lib/utils"

export * from "lucide-react"

type RegistryIcon = React.ComponentType<{
  className?: string
  size?: number
  style?: React.CSSProperties
}>

/**
 * Makes registry icons behave like Lucide icons within existing buttons,
 * menus, and inputs. The registry uses a div wrapper, so this adapter gives
 * that wrapper Lucide's expected sizing and safely ignores SVG-only props.
 */
function animated(RegistryIcon: RegistryIcon): LucideIcon {
  return React.forwardRef<SVGSVGElement, LucideProps>(function AnimatedIcon(
    {
      absoluteStrokeWidth,
      className,
      color,
      size,
      strokeWidth,
      style,
      ...props
    },
    ref
  ) {
    // Registry icons expose an animation handle rather than an SVG ref.
    // Keep Lucide-compatible props without forwarding SVG-only values to div.
    void absoluteStrokeWidth
    void strokeWidth
    void ref

    return (
      <RegistryIcon
        {...props}
        className={cn(
          "inline-flex size-4 shrink-0 align-middle [&>svg]:size-full",
          className
        )}
        size={typeof size === "number" ? size : undefined}
        style={{ color, ...style }}
      />
    )
  }) as LucideIcon
}

export const ActivityIcon = animated(AnimatedActivityIcon)
export const ArrowRightIcon = animated(AnimatedArrowRightIcon)
export const BellIcon = animated(AnimatedBellIcon)
export const BotIcon = animated(AnimatedBotIcon)
export const ChevronDownIcon = animated(AnimatedChevronDownIcon)
export const ChevronRightIcon = animated(AnimatedChevronRightIcon)
export const ChevronUpIcon = animated(AnimatedChevronUpIcon)
export const CreditCardIcon = animated(AnimatedCreditCardIcon)
export const FileTextIcon = animated(AnimatedFileTextIcon)
export const MessageSquareIcon = animated(AnimatedMessageSquareIcon)
export const PlusIcon = animated(AnimatedPlusIcon)
export const SearchIcon = animated(AnimatedSearchIcon)
export const SettingsIcon = animated(AnimatedSettingsIcon)
export const UserIcon = animated(AnimatedUserIcon)
export const UsersIcon = animated(AnimatedUsersIcon)
export const WalletIcon = animated(AnimatedWalletIcon)
export const XIcon = animated(AnimatedXIcon)
