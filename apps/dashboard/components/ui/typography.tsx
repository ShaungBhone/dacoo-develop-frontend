import * as React from "react"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * Type scale for app views: H1 is the page title, H2/H3/H4 step down through
 * section and subsection headings, matched to the sizes already established
 * across the dashboard rather than shadcn's docs-site defaults.
 */

function TypographyH1({
  className,
  asChild,
  ...props
}: React.ComponentProps<"h1"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "h1"
  return (
    <Comp
      data-slot="typography-h1"
      className={cn("text-xl font-semibold tracking-tight", className)}
      {...props}
    />
  )
}

function TypographyH2({
  className,
  asChild,
  ...props
}: React.ComponentProps<"h2"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "h2"
  return (
    <Comp
      data-slot="typography-h2"
      className={cn("text-lg font-semibold tracking-tight", className)}
      {...props}
    />
  )
}

function TypographyH3({
  className,
  asChild,
  ...props
}: React.ComponentProps<"h3"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "h3"
  return (
    <Comp
      data-slot="typography-h3"
      className={cn("text-base font-semibold", className)}
      {...props}
    />
  )
}

function TypographyH4({
  className,
  asChild,
  ...props
}: React.ComponentProps<"h4"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "h4"
  return (
    <Comp
      data-slot="typography-h4"
      className={cn("text-sm font-medium", className)}
      {...props}
    />
  )
}

function TypographyP({
  className,
  asChild,
  ...props
}: React.ComponentProps<"p"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "p"
  return (
    <Comp
      data-slot="typography-p"
      className={cn("text-sm leading-6 text-foreground", className)}
      {...props}
    />
  )
}

function TypographyBlockquote({
  className,
  ...props
}: React.ComponentProps<"blockquote">) {
  return (
    <blockquote
      data-slot="typography-blockquote"
      className={cn("border-l-2 border-border pl-4 text-sm italic", className)}
      {...props}
    />
  )
}

function TypographyList({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="typography-list"
      className={cn("ml-5 list-disc text-sm [&>li]:mt-1.5", className)}
      {...props}
    />
  )
}

function TypographyInlineCode({
  className,
  ...props
}: React.ComponentProps<"code">) {
  return (
    <code
      data-slot="typography-inline-code"
      className={cn(
        "relative rounded-md bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs font-semibold",
        className
      )}
      {...props}
    />
  )
}

function TypographyLead({
  className,
  asChild,
  ...props
}: React.ComponentProps<"p"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "p"
  return (
    <Comp
      data-slot="typography-lead"
      className={cn("text-sm text-pretty text-muted-foreground", className)}
      {...props}
    />
  )
}

function TypographyLarge({
  className,
  asChild,
  ...props
}: React.ComponentProps<"div"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "div"
  return (
    <Comp
      data-slot="typography-large"
      className={cn("text-lg font-semibold", className)}
      {...props}
    />
  )
}

function TypographySmall({
  className,
  asChild,
  ...props
}: React.ComponentProps<"small"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "small"
  return (
    <Comp
      data-slot="typography-small"
      className={cn("text-xs leading-none font-medium", className)}
      {...props}
    />
  )
}

function TypographyMuted({
  className,
  asChild,
  ...props
}: React.ComponentProps<"p"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "p"
  return (
    <Comp
      data-slot="typography-muted"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  TypographyH1,
  TypographyH2,
  TypographyH3,
  TypographyH4,
  TypographyP,
  TypographyBlockquote,
  TypographyList,
  TypographyInlineCode,
  TypographyLead,
  TypographyLarge,
  TypographySmall,
  TypographyMuted,
}
