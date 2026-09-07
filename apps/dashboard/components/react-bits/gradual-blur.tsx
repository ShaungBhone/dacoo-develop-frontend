"use client"

import {
  memo,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PropsWithChildren,
  type RefObject,
} from "react"

import { cn } from "@/lib/utils"

type BlurPosition = "top" | "bottom" | "left" | "right"
type BlurCurve = "linear" | "bezier" | "ease-in" | "ease-out" | "ease-in-out"
type BlurAnimation = boolean | "scroll"
type BlurTarget = "parent" | "page"
type BlurPreset =
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "subtle"
  | "intense"
  | "smooth"
  | "sharp"
  | "header"
  | "footer"
  | "sidebar"
  | "page-header"
  | "page-footer"

export type GradualBlurProps = PropsWithChildren<{
  position?: BlurPosition
  strength?: number
  height?: string
  width?: string
  divCount?: number
  exponential?: boolean
  zIndex?: number
  animated?: BlurAnimation
  duration?: string
  easing?: string
  opacity?: number
  curve?: BlurCurve
  responsive?: boolean
  mobileHeight?: string
  tabletHeight?: string
  desktopHeight?: string
  mobileWidth?: string
  tabletWidth?: string
  desktopWidth?: string
  preset?: BlurPreset
  gpuOptimized?: boolean
  hoverIntensity?: number
  target?: BlurTarget
  onAnimationComplete?: () => void
  className?: string
  style?: CSSProperties
}>

type GradualBlurConfig = Omit<GradualBlurProps, "children"> & {
  position: BlurPosition
  strength: number
  height: string
  divCount: number
  exponential: boolean
  zIndex: number
  animated: BlurAnimation
  duration: string
  easing: string
  opacity: number
  curve: BlurCurve
  responsive: boolean
  gpuOptimized: boolean
  target: BlurTarget
  className: string
  style: CSSProperties
}

const defaultConfig: GradualBlurConfig = {
  position: "bottom",
  strength: 2,
  height: "6rem",
  divCount: 5,
  exponential: false,
  zIndex: 1000,
  animated: false,
  duration: "0.3s",
  easing: "ease-out",
  opacity: 1,
  curve: "linear",
  responsive: false,
  gpuOptimized: false,
  target: "parent",
  className: "",
  style: {},
}

const presets: Record<BlurPreset, Partial<GradualBlurConfig>> = {
  top: { position: "top", height: "6rem" },
  bottom: { position: "bottom", height: "6rem" },
  left: { position: "left", height: "6rem" },
  right: { position: "right", height: "6rem" },
  subtle: { height: "4rem", strength: 1, opacity: 0.8, divCount: 3 },
  intense: { height: "10rem", strength: 4, divCount: 8, exponential: true },
  smooth: { height: "8rem", curve: "bezier", divCount: 10 },
  sharp: { height: "5rem", curve: "linear", divCount: 4 },
  header: { position: "top", height: "8rem", curve: "ease-out" },
  footer: { position: "bottom", height: "8rem", curve: "ease-out" },
  sidebar: { position: "left", height: "6rem", strength: 2.5 },
  "page-header": {
    position: "top",
    height: "10rem",
    target: "page",
    strength: 3,
  },
  "page-footer": {
    position: "bottom",
    height: "10rem",
    target: "page",
    strength: 3,
  },
}

const curveFunctions: Record<BlurCurve, (progress: number) => number> = {
  linear: (progress) => progress,
  bezier: (progress) => progress * progress * (3 - 2 * progress),
  "ease-in": (progress) => progress * progress,
  "ease-out": (progress) => 1 - Math.pow(1 - progress, 2),
  "ease-in-out": (progress) =>
    progress < 0.5
      ? 2 * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 2) / 2,
}

function useViewportWidth(enabled: boolean): number | null {
  const [viewportWidth, setViewportWidth] = useState<number | null>(() =>
    enabled && typeof window !== "undefined" ? window.innerWidth : null
  )

  useEffect(() => {
    if (!enabled) return

    let timeout: ReturnType<typeof setTimeout> | undefined
    const animationFrame = window.requestAnimationFrame(() => {
      setViewportWidth(window.innerWidth)
    })
    const update = () => {
      clearTimeout(timeout)
      timeout = setTimeout(() => setViewportWidth(window.innerWidth), 100)
    }

    window.addEventListener("resize", update)

    return () => {
      window.cancelAnimationFrame(animationFrame)
      clearTimeout(timeout)
      window.removeEventListener("resize", update)
    }
  }, [enabled])

  return viewportWidth
}

function resolveResponsiveDimension(
  base: string | undefined,
  mobile: string | undefined,
  tablet: string | undefined,
  desktop: string | undefined,
  viewportWidth: number | null
): string | undefined {
  if (viewportWidth === null) return base
  if (viewportWidth <= 480) return mobile ?? base
  if (viewportWidth <= 768) return tablet ?? base
  if (viewportWidth <= 1024) return desktop ?? base

  return base
}

function useIntersectionVisibility(
  ref: RefObject<HTMLDivElement | null>,
  shouldObserve: boolean
): boolean {
  const [isVisible, setIsVisible] = useState(!shouldObserve)

  useEffect(() => {
    if (!shouldObserve || !ref.current) return

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    )

    observer.observe(ref.current)

    return () => observer.disconnect()
  }, [ref, shouldObserve])

  return isVisible
}

function gradientDirection(position: BlurPosition): string {
  return {
    top: "to top",
    bottom: "to bottom",
    left: "to left",
    right: "to right",
  }[position]
}

function GradualBlurComponent({ children, ...props }: GradualBlurProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const presetConfig = props.preset ? presets[props.preset] : undefined
  const config: GradualBlurConfig = {
    ...defaultConfig,
    ...presetConfig,
    ...props,
  }
  const viewportWidth = useViewportWidth(config.responsive)
  const responsiveHeight = resolveResponsiveDimension(
    config.height,
    config.mobileHeight,
    config.tabletHeight,
    config.desktopHeight,
    viewportWidth
  )
  const responsiveWidth = resolveResponsiveDimension(
    config.width,
    config.mobileWidth,
    config.tabletWidth,
    config.desktopWidth,
    viewportWidth
  )
  const isVisible = useIntersectionVisibility(
    containerRef,
    config.animated === "scroll"
  )

  const increment = 100 / config.divCount
  const currentStrength =
    isHovered && config.hoverIntensity
      ? config.strength * config.hoverIntensity
      : config.strength
  const curveFunction = curveFunctions[config.curve]
  const blurLayers = Array.from({ length: config.divCount }, (_, index) => {
    const layer = index + 1
    const progress = curveFunction(layer / config.divCount)
    const blurValue = config.exponential
      ? Math.pow(2, progress * 4) * 0.0625 * currentStrength
      : 0.0625 * (progress * config.divCount + 1) * currentStrength
    const previous = Math.round((increment * layer - increment) * 10) / 10
    const current = Math.round(increment * layer * 10) / 10
    const next = Math.round((increment * layer + increment) * 10) / 10
    const following = Math.round((increment * layer + increment * 2) * 10) / 10
    const stops = [`transparent ${previous}%`, `black ${current}%`]

    if (next <= 100) stops.push(`black ${next}%`)
    if (following <= 100) stops.push(`transparent ${following}%`)

    const maskImage = `linear-gradient(${gradientDirection(config.position)}, ${stops.join(", ")})`
    const layerStyle: CSSProperties = {
      maskImage,
      WebkitMaskImage: maskImage,
      backdropFilter: `blur(${blurValue.toFixed(3)}rem)`,
      WebkitBackdropFilter: `blur(${blurValue.toFixed(3)}rem)`,
      opacity: config.opacity,
      transition:
        config.animated && config.animated !== "scroll"
          ? `backdrop-filter ${config.duration} ${config.easing}`
          : undefined,
    }

    return <div key={layer} className="absolute inset-0" style={layerStyle} />
  })

  const isVertical = config.position === "top" || config.position === "bottom"
  const isPageTarget = config.target === "page"
  const containerStyle: CSSProperties = {
    position: isPageTarget ? "fixed" : "absolute",
    pointerEvents: config.hoverIntensity ? "auto" : "none",
    opacity: isVisible ? 1 : 0,
    transition: config.animated
      ? `opacity ${config.duration} ${config.easing}`
      : undefined,
    zIndex: isPageTarget ? config.zIndex + 100 : config.zIndex,
    ...config.style,
  }

  if (isVertical) {
    containerStyle.height = responsiveHeight
    containerStyle.width = responsiveWidth ?? "100%"
    containerStyle[config.position] = 0
    containerStyle.left = 0
    containerStyle.right = 0
  } else {
    containerStyle.width = responsiveWidth ?? responsiveHeight
    containerStyle.height = "100%"
    containerStyle[config.position] = 0
    containerStyle.top = 0
    containerStyle.bottom = 0
  }

  const animated = config.animated
  const duration = config.duration
  const onAnimationComplete = config.onAnimationComplete

  useEffect(() => {
    if (!isVisible || animated !== "scroll" || !onAnimationComplete) {
      return
    }

    const timeout = setTimeout(
      onAnimationComplete,
      Number.parseFloat(duration) * 1000
    )

    return () => clearTimeout(timeout)
  }, [animated, duration, isVisible, onAnimationComplete])

  return (
    <div
      ref={containerRef}
      className={cn(
        "isolate",
        config.gpuOptimized && "will-change-[opacity,backdrop-filter]",
        config.className
      )}
      style={containerStyle}
      onMouseEnter={
        config.hoverIntensity ? () => setIsHovered(true) : undefined
      }
      onMouseLeave={
        config.hoverIntensity ? () => setIsHovered(false) : undefined
      }
    >
      <div className="relative h-full w-full">{blurLayers}</div>
      {children && <div className="relative">{children}</div>}
    </div>
  )
}

const GradualBlur = memo(GradualBlurComponent)

GradualBlur.displayName = "GradualBlur"

export default GradualBlur
