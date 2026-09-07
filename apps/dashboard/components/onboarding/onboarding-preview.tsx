"use client"

import { Component, useEffect, useState, type ReactNode } from "react"
import dynamic from "next/dynamic"
import {
  ActivityIcon,
  BarChart3Icon,
  BotIcon,
  ChevronRightIcon,
  DatabaseIcon,
  MessageSquareIcon,
  PanelLeftIcon,
  SearchIcon,
  SlidersHorizontalIcon,
  TerminalSquareIcon,
} from "@/components/ui/icons"
import { motion, useReducedMotion } from "motion/react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import GradualBlur from "@/components/react-bits/gradual-blur"
import { cn } from "@/lib/utils"

const Beams = dynamic(() => import("@/components/react-bits/beams"), {
  ssr: false,
  loading: () => null,
})

class PreviewEffectBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    return this.state.hasError ? null : this.props.children
  }
}

export type OnboardingPreviewData = {
  name: string
  email: string
  avatarUrl: string | null
  workspaceName: string
  workspaceLogoUrl: string | null
  language: string
  timezone: string
}

function initials(value: string) {
  const result = value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")

  return result || "D"
}

function AnimatedPreviewText({
  value,
  className,
}: {
  value: string
  className: string
}) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.p
      key={value}
      initial={shouldReduceMotion ? false : { filter: "blur(2px)", y: -6 }}
      animate={{ filter: "blur(0px)", y: 0 }}
      transition={{
        duration: shouldReduceMotion ? 0 : 0.32,
        ease: "easeOut",
      }}
      className={className}
    >
      {value}
    </motion.p>
  )
}

function supportsWebGl() {
  try {
    const canvas = document.createElement("canvas")
    const context = canvas.getContext("webgl2") ?? canvas.getContext("webgl")

    context?.getExtension("WEBGL_lose_context")?.loseContext()

    return Boolean(context)
  } catch {
    return false
  }
}

function useAnimatedPreviewBackground() {
  const [shouldAnimate, setShouldAnimate] = useState(false)

  useEffect(() => {
    const desktopQuery = window.matchMedia("(min-width: 1024px)")
    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    )
    const update = () => {
      const canAnimate = desktopQuery.matches && !reducedMotionQuery.matches

      setShouldAnimate(canAnimate && supportsWebGl())
    }

    desktopQuery.addEventListener("change", update)
    reducedMotionQuery.addEventListener("change", update)
    update()

    return () => {
      desktopQuery.removeEventListener("change", update)
      reducedMotionQuery.removeEventListener("change", update)
    }
  }, [])

  return shouldAnimate
}

const previewGroups = [
  {
    title: "Communication",
    items: [
      { title: "Inbox", icon: MessageSquareIcon, active: true },
      { title: "Activity", icon: ActivityIcon },
    ],
  },
  {
    title: "Automations",
    items: [
      { title: "Agents", icon: BotIcon },
      { title: "Datasets", icon: DatabaseIcon },
      { title: "Playground", icon: TerminalSquareIcon },
    ],
  },
  {
    title: "Overview",
    items: [{ title: "Reports", icon: BarChart3Icon }],
  },
]

const financeSkeletonWidths = ["w-12", "w-10", "w-14", "w-11"]

const leadStatusBadges = [
  { label: "New", className: "bg-emerald-500/10 text-emerald-700" },
  { label: "Qualified", className: "bg-indigo-500/10 text-indigo-700" },
  { label: "Follow-up", className: "bg-amber-500/10 text-amber-700" },
  { label: "Won", className: "bg-green-500/10 text-green-700" },
  { label: "Contacted", className: "bg-rose-500/10 text-rose-700" },
]

function PreviewMenuItem({
  title,
  icon: Icon,
  active = false,
  collapsible = false,
}: {
  title: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  active?: boolean
  collapsible?: boolean
}) {
  return (
    <div
      className={cn(
        "relative flex h-7 items-center gap-1.5 rounded-md px-2 text-[0.62rem] text-sidebar-foreground/70",
        active &&
          "overflow-visible border border-sidebar-border/60 bg-white font-medium text-sidebar-primary shadow-sm shadow-black/5 before:absolute before:top-1 before:bottom-1 before:-left-2 before:w-0.75 before:rounded-full before:bg-sidebar-primary"
      )}
    >
      <Icon className="size-4 shrink-0" strokeWidth={1.5} />
      <span className="truncate">{title}</span>
      {collapsible && <ChevronRightIcon className="ml-auto size-3 shrink-0" />}
    </div>
  )
}

export function OnboardingPreview({ data }: { data: OnboardingPreviewData }) {
  const shouldAnimateBackground = useAnimatedPreviewBackground()
  const workspaceName = data.workspaceName.trim() || "Your workspace"
  const userName = data.name.trim() || "Your name"
  const userEmail = data.email.trim() || "you@company.com"

  return (
    <div className="relative h-full overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-black"
      >
        <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_12%,rgb(255_255_255/0.16)_48%,transparent_76%)]" />
        {shouldAnimateBackground && (
          <PreviewEffectBoundary>
            <Beams
              beamWidth={3}
              beamHeight={30}
              beamNumber={20}
              lightColor="#ffffff"
              speed={2}
              noiseIntensity={1.75}
              scale={0.2}
              rotation={30}
            />
          </PreviewEffectBoundary>
        )}
      </div>

      <div className="absolute top-40 -right-24 bottom-0 left-3/12 z-10 flex overflow-hidden rounded-tl-xl border border-r-0 border-b-0 bg-background text-foreground shadow-xl shadow-black/30">
        <aside className="flex w-48 shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-2 text-sidebar-foreground">
          <div className="flex min-h-12 items-center gap-2 rounded-md px-1.5 py-1">
            <Avatar className="size-8 rounded-md">
              <AvatarImage src={data.workspaceLogoUrl ?? undefined} alt="" />
              <AvatarFallback className="rounded-md text-[0.66rem] font-semibold">
                {initials(workspaceName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <AnimatedPreviewText
                value={workspaceName}
                className="text-[0.75rem] leading-tight font-medium break-words"
              />
              <p className="text-[0.55rem] text-sidebar-foreground/55">
                Workspace
              </p>
            </div>
            <ChevronRightIcon className="size-3.5 shrink-0 text-sidebar-foreground/50" />
          </div>

          <div className="mt-2 flex min-h-0 flex-1 flex-col gap-1 overflow-visible">
            {previewGroups.map((group) => (
              <div key={group.title}>
                <p className="px-1.5 pb-1 text-[0.5rem] font-medium tracking-wider text-sidebar-foreground/45 uppercase">
                  {group.title}
                </p>
                <div className="flex flex-col gap-0.5">
                  {group.items.map((item) => (
                    <PreviewMenuItem
                      key={item.title}
                      title={item.title}
                      icon={item.icon}
                      active={item.active}
                    />
                  ))}
                </div>
              </div>
            ))}

            <div>
              <p className="px-1.5 pb-1 text-[0.5rem] font-medium tracking-wider text-sidebar-foreground/45 uppercase">
                Finance
              </p>
              <div className="flex flex-col gap-0.5">
                {financeSkeletonWidths.map((width) => (
                  <div
                    key={width}
                    className="flex h-7 items-center gap-1.5 px-2"
                  >
                    <Skeleton className="size-4 shrink-0 rounded-sm" />
                    <Skeleton className={cn("h-2", width)} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-md p-1.5">
            <Avatar className="size-8 rounded-md border border-sidebar-border/80 after:border-0">
              <AvatarImage
                src={data.avatarUrl ?? undefined}
                alt=""
                className="rounded-md"
              />
              <AvatarFallback className="rounded-md text-[0.62rem] font-semibold">
                {initials(userName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <AnimatedPreviewText
                value={userName}
                className="text-[0.66rem] leading-tight font-medium break-words"
              />
              <p className="text-[0.5rem] leading-tight [overflow-wrap:anywhere] text-sidebar-foreground/55">
                {userEmail}
              </p>
            </div>
            <ChevronRightIcon className="size-3.5 shrink-0 text-sidebar-foreground/50" />
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col bg-background">
          <header className="flex h-12 shrink-0 items-center gap-2.5 border-b px-4">
            <PanelLeftIcon className="size-4 text-muted-foreground" />
            <span className="h-4 w-px bg-border" />
            <MessageSquareIcon className="size-4 text-muted-foreground" />
            <span className="truncate text-[0.64rem] font-medium">Inbox</span>
          </header>

          <main className="flex min-h-0 flex-1 overflow-hidden">
            <div className="flex min-w-0 flex-1 flex-col bg-background">
              <div className="flex items-center gap-1.5 border-b p-2">
                <div className="flex h-7 min-w-0 flex-1 items-center gap-1.5 rounded-md border bg-muted/20 px-2">
                  <SearchIcon className="size-3.5 text-muted-foreground" />
                  <Skeleton className="h-2 w-10" />
                </div>
                <span className="flex size-7 items-center justify-center rounded-md border text-muted-foreground">
                  <SlidersHorizontalIcon className="size-3.5" />
                </span>
              </div>

              <div className="min-h-0 flex-1 overflow-hidden">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div
                    key={index}
                    className="flex gap-2.5 border-b bg-white p-3"
                  >
                    <Skeleton className="size-7 shrink-0 rounded-full" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <Skeleton
                          className={cn("h-2", index % 2 ? "w-10" : "w-14")}
                        />
                        <Skeleton className="h-1.5 w-4" />
                      </div>
                      <Skeleton className="h-2 w-full" />
                      <div className="flex items-center gap-1">
                        {index % 2 === 0 ? (
                          <span className="rounded-full bg-sky-500/10 px-1.5 py-0.5 text-[0.46rem] leading-none font-medium text-sky-700">
                            Telegram
                          </span>
                        ) : (
                          <span className="rounded-full bg-violet-500/10 px-1.5 py-0.5 text-[0.46rem] leading-none font-medium text-violet-700">
                            Viber
                          </span>
                        )}
                        <span
                          className={cn(
                            "rounded-full px-1.5 py-0.5 text-[0.46rem] leading-none font-medium",
                            leadStatusBadges[index % leadStatusBadges.length]
                              .className
                          )}
                        >
                          {
                            leadStatusBadges[index % leadStatusBadges.length]
                              .label
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </main>
        </section>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-40 right-0 bottom-0 z-20 w-10 overflow-hidden"
      >
        <GradualBlur
          target="parent"
          position="right"
          width="2.5rem"
          strength={0.75}
          divCount={4}
          curve="bezier"
          opacity={0.65}
          zIndex={0}
        />
      </div>
    </div>
  )
}
