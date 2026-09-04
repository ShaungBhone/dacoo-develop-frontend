"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import {
  CircleAlertIcon,
  TriangleAlertIcon,
  Loader2Icon,
} from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      closeButton={false}
      icons={{
        success: (
          <CircleAlertIcon className="size-4 shrink-0 text-success" />
        ),
        info: (
          <CircleAlertIcon className="size-4 shrink-0 text-info" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4 shrink-0 text-warning" />
        ),
        error: (
          <CircleAlertIcon className="size-4 shrink-0 text-destructive" />
        ),
        loading: (
          <Loader2Icon className="size-4 shrink-0 animate-spin text-muted-foreground" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--invert)",
          "--normal-text": "var(--invert-foreground)",
          "--normal-border": "var(--invert)",
          "--description-color": "color-mix(in srgb, var(--invert-foreground) 75%, transparent)",
          "--border-radius": "calc(var(--radius) + 2px)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-invert group-[.toaster]:text-invert-foreground group-[.toaster]:border-invert group-[.toaster]:shadow-lg group-[.toaster]:rounded-lg group-[.toaster]:font-sans group-[.toaster]:px-3.5 group-[.toaster]:py-3 group-[.toaster]:items-start group-[.toaster]:gap-2.5 [&_[data-icon]]:self-start [&_[data-icon]]:mt-0.5 [&_[data-content]]:gap-1 [&_[data-description]]:!text-invert-foreground/75",
          title:
            "group-[.toast]:!text-invert-foreground group-[.toast]:font-medium group-[.toast]:text-sm group-[.toast]:tracking-tight",
          description:
            "group-[.toast]:!text-invert-foreground/75 group-[.toast]:text-sm group-[.toast]:leading-relaxed",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:text-xs group-[.toast]:font-medium",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:text-xs",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
