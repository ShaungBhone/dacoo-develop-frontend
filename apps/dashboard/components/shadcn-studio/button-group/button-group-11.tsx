"use client"

import { useState, type ComponentProps } from "react"
import { ChevronDownIcon } from "@/components/ui/icons"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

const options = [
  {
    label: "Merge pull request",
    description:
      "All commits from this branch will be added to the base branch via a commit version.",
  },
  {
    label: "Squash and merge",
    description:
      "The 6 commits from this branch will be combined into one commit in the base branch.",
  },
  {
    label: "Rebase and merge",
    description:
      "The 6 commits from this branch will be rebased and added to the base branch.",
  },
]

function ButtonGroup11({
  className,
  ...props
}: ComponentProps<typeof ButtonGroup>) {
  return (
    <ButtonGroup
      className={cn(
        "*:border-primary *:bg-clip-border *:not-last:border-r-primary-foreground/30",
        className
      )}
      {...props}
    />
  )
}

const ButtonGroupDropdownDemo = () => {
  const [selectedIndex, setSelectedIndex] = useState("0")

  return (
    <ButtonGroup11>
      <Button>{options[Number(selectedIndex)].label}</Button>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button aria-label="Select option" size="icon" type="button" />
          }
        >
          <ChevronDownIcon data-icon="inline-start" />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-full max-w-70"
          side="bottom"
          sideOffset={4}
        >
          <DropdownMenuRadioGroup
            value={selectedIndex}
            onValueChange={setSelectedIndex}
          >
            {options.map((option, index) => (
              <DropdownMenuRadioItem
                className="items-start [&>span]:pt-1.5"
                key={option.label}
                value={String(index)}
              >
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium">{option.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {option.description}
                  </span>
                </div>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup11>
  )
}

export { ButtonGroup11 }
export default ButtonGroupDropdownDemo
