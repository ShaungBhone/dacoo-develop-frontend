export type TagColor = {
  name: string
  bg: string
  text: string
  border: string
  dot: string
}

export const TAG_COLORS: TagColor[] = [
  {
    name: "blue",
    bg: "bg-blue-500/15 dark:bg-blue-500/20",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-500/30",
    dot: "bg-blue-500",
  },
  {
    name: "indigo",
    bg: "bg-indigo-500/15 dark:bg-indigo-500/20",
    text: "text-indigo-700 dark:text-indigo-300",
    border: "border-indigo-500/30",
    dot: "bg-indigo-500",
  },
  {
    name: "purple",
    bg: "bg-purple-500/15 dark:bg-purple-500/20",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-500/30",
    dot: "bg-purple-500",
  },
  {
    name: "pink",
    bg: "bg-pink-500/15 dark:bg-pink-500/20",
    text: "text-pink-700 dark:text-pink-300",
    border: "border-pink-500/30",
    dot: "bg-pink-500",
  },
  {
    name: "red",
    bg: "bg-red-500/15 dark:bg-red-500/20",
    text: "text-red-700 dark:text-red-300",
    border: "border-red-500/30",
    dot: "bg-red-500",
  },
  {
    name: "rose",
    bg: "bg-rose-500/15 dark:bg-rose-500/20",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-500/30",
    dot: "bg-rose-500",
  },
  {
    name: "orange",
    bg: "bg-orange-500/15 dark:bg-orange-500/20",
    text: "text-orange-700 dark:text-orange-300",
    border: "border-orange-500/30",
    dot: "bg-orange-500",
  },
  {
    name: "amber",
    bg: "bg-amber-500/15 dark:bg-amber-500/20",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-500/30",
    dot: "bg-amber-500",
  },
  {
    name: "green",
    bg: "bg-emerald-500/15 dark:bg-emerald-500/20",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-500/30",
    dot: "bg-emerald-500",
  },
  {
    name: "emerald",
    bg: "bg-emerald-500/15 dark:bg-emerald-500/20",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-500/30",
    dot: "bg-emerald-500",
  },
  {
    name: "teal",
    bg: "bg-teal-500/15 dark:bg-teal-500/20",
    text: "text-teal-700 dark:text-teal-300",
    border: "border-teal-500/30",
    dot: "bg-teal-500",
  },
  {
    name: "cyan",
    bg: "bg-cyan-500/15 dark:bg-cyan-500/20",
    text: "text-cyan-700 dark:text-cyan-300",
    border: "border-cyan-500/30",
    dot: "bg-cyan-500",
  },
  {
    name: "slate",
    bg: "bg-slate-500/15 dark:bg-slate-500/20",
    text: "text-slate-700 dark:text-slate-300",
    border: "border-slate-500/30",
    dot: "bg-slate-500",
  },
]

export function getTagColor(
  tagName: string,
  explicitColor?: string | null
): TagColor {
  if (explicitColor) {
    const normalized = explicitColor.toLowerCase().trim()
    const matched = TAG_COLORS.find(
      (c) => c.name === normalized || c.dot.includes(normalized)
    )
    if (matched) return matched

    // Handle hex codes
    if (normalized.startsWith("#")) {
      return {
        name: normalized,
        bg: "bg-muted",
        text: "text-foreground",
        border: "border-border",
        dot: normalized,
      }
    }
  }

  if (!tagName) return TAG_COLORS[0]
  let hash = 0
  for (let i = 0; i < tagName.length; i++) {
    hash = tagName.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % TAG_COLORS.length
  return TAG_COLORS[index]
}
