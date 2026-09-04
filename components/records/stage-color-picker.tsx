"use client"

import * as React from "react"
import { CheckIcon, ChevronDownIcon } from "@/components/ui/icons"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  InputGroup,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { getSelectOptionSolidColor } from "@/components/records/select-option-colors"

export const STAGE_COLOR_PRESETS = [
  { name: "blue", hex: "#3b82f6", label: "Blue" },
  { name: "indigo", hex: "#6366f1", label: "Indigo" },
  { name: "purple", hex: "#a855f7", label: "Purple" },
  { name: "pink", hex: "#ec4899", label: "Pink" },
  { name: "red", hex: "#ef4444", label: "Red" },
  { name: "orange", hex: "#f97316", label: "Orange" },
  { name: "amber", hex: "#f59e0b", label: "Amber" },
  { name: "green", hex: "#22c55e", label: "Green" },
  { name: "teal", hex: "#14b8a6", label: "Teal" },
  { name: "cyan", hex: "#06b6d4", label: "Cyan" },
  { name: "slate", hex: "#64748b", label: "Slate" },
]

const STAGE_COLOR_FIELD_PRESETS = STAGE_COLOR_PRESETS.filter(({ name }) =>
  ["blue", "purple", "green", "amber", "red", "pink", "cyan", "slate"].includes(name)
)

export interface StageColorPickerProps {
  color: string
  onChange: (color: string) => void
  disabled?: boolean
  className?: string
  showLabel?: boolean
  variant?: "compact" | "field"
}

export function StageColorPicker({
  color,
  onChange,
  disabled,
  className,
  showLabel = false,
  variant = "compact",
}: StageColorPickerProps) {
  const [open, setOpen] = React.useState(false)

  // Resolve current active color into a display hex
  const activeSolidColor = React.useMemo(() => {
    const preset = STAGE_COLOR_PRESETS.find((p) => p.name === color)
    if (preset) return preset.hex
    return getSelectOptionSolidColor(color) || (color.startsWith("#") ? color : "#3b82f6")
  }, [color])

  const [customHex, setCustomHex] = React.useState(
    color.startsWith("#") ? color : activeSolidColor
  )

  const activeLabel = React.useMemo(() => {
    const preset = STAGE_COLOR_PRESETS.find((p) => p.name === color)
    return preset?.label ?? "Custom"
  }, [color])

  const handleHexChange = (value: string) => {
    let formatted = value.trim()
    if (!formatted.startsWith("#") && /^[0-9a-fA-F]/i.test(formatted)) {
      formatted = "#" + formatted
    }
    setCustomHex(formatted)
    if (/^#[0-9a-fA-F]{6}$/i.test(formatted) || /^#[0-9a-fA-F]{3}$/i.test(formatted)) {
      onChange(formatted)
    }
  }

  if (variant === "field") {
    return (
      <div className={cn("flex flex-wrap items-center gap-2", className)}>
        {STAGE_COLOR_FIELD_PRESETS.map((preset) => {
          const isSelected =
            color === preset.name ||
            color.toLowerCase() === preset.hex.toLowerCase()

          return (
            <button
              key={preset.name}
              type="button"
              disabled={disabled}
              onClick={() => onChange(preset.name)}
              className="relative flex size-7 items-center justify-center rounded-full transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
              style={{ backgroundColor: preset.hex }}
              title={preset.label}
            >
              {isSelected && <CheckIcon className="size-4 text-white drop-shadow" />}
            </button>
          )
        })}
        <Input
          type="color"
          value={activeSolidColor}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          className="size-8 cursor-pointer p-0.5"
          title="Custom color"
          aria-label="Custom stage color"
        />
      </div>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        type="button"
        disabled={disabled}
        className={cn(
          "inline-flex h-6 items-center gap-1.5 rounded-md px-1.5 py-0.5 text-xs font-medium transition-colors hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer select-none border border-transparent hover:border-border/60",
          open && "bg-muted border-border/80",
          className
        )}
        aria-label="Select stage color"
      >
        <span
          className="size-3 rounded-full shrink-0 shadow-2xs ring-1 ring-black/15 dark:ring-white/20"
          style={{ backgroundColor: activeSolidColor }}
        />
        {showLabel && <span>{activeLabel}</span>}
        <ChevronDownIcon className="size-3 text-muted-foreground/80" />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-56 p-3 flex flex-col gap-3 rounded-xl shadow-lg border border-border bg-popover"
      >
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Palette
          </span>
          <div className="grid grid-cols-6 gap-1.5">
            {STAGE_COLOR_PRESETS.map((preset) => {
              const isSelected =
                color === preset.name ||
                color.toLowerCase() === preset.hex.toLowerCase()

              return (
                <button
                  key={preset.name}
                  type="button"
                  className={cn(
                    "size-6 rounded-full transition-transform hover:scale-110 cursor-pointer shadow-2xs relative flex items-center justify-center ring-1 ring-black/10 dark:ring-white/15",
                    isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-popover"
                  )}
                  style={{ backgroundColor: preset.hex }}
                  onClick={() => {
                    setCustomHex(preset.hex)
                    onChange(preset.name)
                    setOpen(false)
                  }}
                  title={preset.label}
                />
              )
            })}
          </div>
        </div>

        <Separator />

        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Custom Hex
          </span>
          <InputGroup className="h-8">
            <InputGroupInput
              value={customHex}
              onChange={(e) => handleHexChange(e.target.value)}
              placeholder="#3b82f6"
              className="h-full text-xs font-mono"
            />
          </InputGroup>
        </div>
      </PopoverContent>
    </Popover>
  )
}
