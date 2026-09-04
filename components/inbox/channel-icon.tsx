import * as React from "react"
import type { SVGProps } from "react"
import { MessageCircleIcon } from "@/components/ui/icons"
import { Email } from "@/components/ui/svgs/email"
import { Facebook } from "@/components/ui/svgs/facebook"
import { Instagram } from "@/components/ui/svgs/instagram"
import { LinkedIn } from "@/components/ui/svgs/linkedin"
import { Messenger } from "@/components/ui/svgs/messenger"
import { Telegram } from "@/components/ui/svgs/telegram"
import { TikTok } from "@/components/ui/svgs/tiktok"
import { Viber } from "@/components/ui/svgs/viber"
import { Whatsapp } from "@/components/ui/svgs/whatsapp"
import { X as XLogo } from "@/components/ui/svgs/x"

export interface ChannelMeta {
  key: string
  Icon: React.ComponentType<SVGProps<SVGSVGElement>>
  label: string
  className: string
  bannerGradient: string
}

export const CHANNEL_META: Record<string, ChannelMeta> = {
  messenger: {
    key: "messenger",
    Icon: Messenger,
    label: "Messenger",
    className: "text-[#0084FF]",
    bannerGradient: "from-blue-600 via-sky-500 to-indigo-300",
  },
  whatsapp: {
    key: "whatsapp",
    Icon: Whatsapp,
    label: "WhatsApp",
    className: "text-[#25D366]",
    bannerGradient: "from-emerald-600 via-emerald-500 to-teal-300",
  },
  instagram: {
    key: "instagram",
    Icon: Instagram,
    label: "Instagram",
    className: "text-[#E1306C]",
    bannerGradient: "from-pink-600 via-rose-500 to-orange-300",
  },
  facebook: {
    key: "facebook",
    Icon: Facebook,
    label: "Facebook",
    className: "text-[#0866FF]",
    bannerGradient: "from-blue-600 via-sky-500 to-indigo-300",
  },
  telegram: {
    key: "telegram",
    Icon: Telegram,
    label: "Telegram",
    className: "text-[#24A1DE]",
    bannerGradient: "from-sky-600 via-cyan-500 to-blue-300",
  },
  email: {
    key: "email",
    Icon: Email,
    label: "Email",
    className: "text-slate-500",
    bannerGradient: "from-slate-600 via-slate-500 to-blue-300",
  },
  viber: {
    key: "viber",
    Icon: Viber,
    label: "Viber",
    className: "text-[#7360F2]",
    bannerGradient: "from-violet-600 via-purple-500 to-indigo-300",
  },
  tiktok: {
    key: "tiktok",
    Icon: TikTok,
    label: "TikTok",
    className: "text-foreground",
    bannerGradient: "from-neutral-800 via-neutral-700 to-rose-300",
  },
  linkedin: {
    key: "linkedin",
    Icon: LinkedIn,
    label: "LinkedIn",
    className: "text-[#0A66C2]",
    bannerGradient: "from-sky-700 via-blue-600 to-indigo-300",
  },
  x: {
    key: "x",
    Icon: XLogo,
    label: "X",
    className: "text-foreground",
    bannerGradient: "from-neutral-800 via-neutral-700 to-neutral-500",
  },
  twitter: {
    key: "twitter",
    Icon: XLogo,
    label: "X",
    className: "text-foreground",
    bannerGradient: "from-neutral-800 via-neutral-700 to-neutral-500",
  },
}

export const DEFAULT_CHANNEL_META: ChannelMeta = {
  key: "chat",
  Icon: MessageCircleIcon,
  label: "Chat",
  className: "text-muted-foreground",
  bannerGradient: "from-primary/90 via-primary/60 to-violet-300/80",
}

export function getChannelMeta(provider?: string | null): ChannelMeta {
  if (!provider) return DEFAULT_CHANNEL_META
  const normalized = provider.toLowerCase().trim()
  return CHANNEL_META[normalized] ?? DEFAULT_CHANNEL_META
}
