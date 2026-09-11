"use client"

import Link from "next/link"
import type { ComponentType, SVGProps } from "react"

import { Button } from "@/components/ui/button"
import { Email } from "@/components/ui/svgs/email"
import { Instagram } from "@/components/ui/svgs/instagram"
import { Messenger } from "@/components/ui/svgs/messenger"
import { Telegram } from "@/components/ui/svgs/telegram"
import { Tiktok } from "@/components/ui/svgs/tiktok"
import { Viber } from "@/components/ui/svgs/viber"
import { Whatsapp } from "@/components/ui/svgs/whatsapp"
import { LogoIcon } from "@/components/logo"
import { cn } from "@/lib/utils"

type Channel = {
  name: string
  Icon: ComponentType<SVGProps<SVGSVGElement>>
  position: string
}

const channels: Channel[] = [
  {
    name: "Messenger",
    Icon: Messenger,
    position: "left-[8%] top-[9%]",
  },
  {
    name: "Telegram",
    Icon: Telegram,
    position: "left-0 top-1/2 -translate-y-1/2",
  },
  {
    name: "TikTok",
    Icon: Tiktok,
    position: "bottom-[9%] left-[8%]",
  },
  {
    name: "Viber",
    Icon: Viber,
    position: "right-[8%] top-[9%]",
  },
  {
    name: "Email",
    Icon: Email,
    position: "bottom-[9%] right-[8%]",
  },
  {
    name: "WhatsApp",
    Icon: Whatsapp,
    position: "right-0 top-1/2 -translate-y-1/2",
  },
  {
    name: "Instagram",
    Icon: Instagram,
    position: "left-1/2 top-0 -translate-x-1/2",
  },
]

const connections = [
  { path: "M480 195 H381 Q365 195 365 179 V79 Q365 63 349 63 H100", delay: "0s" },
  { path: "M480 195 H346 Q330 195 330 211 V219 Q330 235 314 235 H156 Q140 235 140 219 V211 Q140 195 124 195 H28", delay: "0.45s" },
  { path: "M480 195 H381 Q365 195 365 211 V311 Q365 327 349 327 H100", delay: "0.9s" },
  { path: "M480 195 H579 Q595 195 595 179 V79 Q595 63 611 63 H860", delay: "0.25s" },
  { path: "M480 195 H579 Q595 195 595 211 V311 Q595 327 611 327 H860", delay: "0.7s" },
  { path: "M480 195 H614 Q630 195 630 211 V219 Q630 235 646 235 H804 Q820 235 820 219 V211 Q820 195 836 195 H932", delay: "1.1s" },
  { path: "M480 195 V32", delay: "1.35s" },
]

function ChannelCard({ channel, className }: { channel: Channel; className?: string }) {
  const { Icon } = channel

  return (
    <div
      className={cn(
        "flex size-14 items-center justify-center rounded-2xl border bg-background shadow-sm",
        className
      )}
      role="img"
      aria-label={channel.name}
    >
      <Icon className="size-8" aria-hidden="true" />
    </div>
  )
}

export function IntegrationSection() {
  return (
    <section className="border-t bg-muted/30 px-6 py-10 sm:px-10 lg:px-16 lg:py-14 xl:px-24">
      <div className="mx-auto w-full max-w-6xl">
        <div className="relative mx-auto hidden h-[340px] max-w-4xl md:block" aria-label="Dacoo connected to seven customer channels">
          <div className="integration-dot-field absolute inset-[12%_18%] rounded-[3rem]" aria-hidden="true" />

          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox="0 0 960 390"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {connections.map((connection) => (
              <g key={connection.path}>
                <path
                  d={connection.path}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeOpacity="0.35"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary"
                />
                <circle r="3.5" fill="currentColor" className="integration-signal-motion text-primary">
                  <animateMotion
                    dur="3.6s"
                    begin={connection.delay}
                    repeatCount="indefinite"
                    path={connection.path}
                  />
                </circle>
              </g>
            ))}
          </svg>

          {channels.map((channel) => (
            <ChannelCard key={channel.name} channel={channel} className={cn("absolute", channel.position)} />
          ))}

          <div className="absolute left-1/2 top-1/2 z-10 flex size-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-3xl border border-primary/25 bg-background p-4 shadow-xl shadow-primary/10">
            <LogoIcon className="size-full" />
          </div>
        </div>

        <div className="mx-auto grid max-w-sm grid-cols-3 items-center gap-4 md:hidden" aria-label="Dacoo connected to seven customer channels">
          <ChannelCard channel={channels[0]} className="justify-self-end" />
          <ChannelCard channel={channels[6]} className="justify-self-center" />
          <ChannelCard channel={channels[3]} className="justify-self-start" />
          <ChannelCard channel={channels[1]} className="col-start-1 justify-self-end" />
          <div className="col-start-2 flex size-20 items-center justify-center justify-self-center rounded-3xl border border-primary/25 bg-background p-3 shadow-lg shadow-primary/10">
            <LogoIcon className="size-full" />
          </div>
          <ChannelCard channel={channels[5]} className="col-start-3 justify-self-start" />
          <ChannelCard channel={channels[2]} className="col-start-1 justify-self-end" />
          <ChannelCard channel={channels[4]} className="col-start-3 justify-self-start" />
        </div>

        <div className="mx-auto mt-8 max-w-xl text-center">
          <p className="text-sm font-medium text-primary">Connected where your customers are</p>
          <h1 className="mt-4 text-balance font-serif text-3xl font-medium tracking-tight sm:text-4xl">
            Every customer channel, one inbox.
          </h1>
          <p className="mt-5 text-pretty leading-7 text-muted-foreground">
            Bring messages from the channels your customers already use into one calm, coordinated workspace for your team.
          </p>
          <Button className="mt-7" render={<Link href="/contact" />} nativeButton={false}>
            Talk to our team
          </Button>
        </div>
      </div>
    </section>
  )
}
