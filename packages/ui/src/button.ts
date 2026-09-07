export function buttonClassName(variant: "primary" | "outline" = "outline") {
  const base =
    "inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"

  return variant === "primary"
    ? `${base} bg-primary text-primary-foreground hover:bg-primary/90`
    : `${base} border border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground`
}
