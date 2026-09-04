import { useId } from "react"

import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

const RadioGroupCardRadioDemo = () => {
  const id = useId()

  return (
    <RadioGroup className="w-full max-w-96 gap-2" defaultValue="1">
      <div className="relative flex w-full items-center gap-2 rounded-md border border-input p-4 shadow-xs outline-none has-data-checked:border-primary/50">
        <RadioGroupItem
          value="1"
          id={`${id}-1`}
          aria-label="plan-radio-basic"
          aria-describedby={`${id}-1-description`}
          className="size-5 [&_[data-slot=radio-group-indicator]>span]:size-2.5"
        />
        <div className="grid grow gap-2">
          <Label
            htmlFor={`${id}-1`}
            className="justify-between after:absolute after:inset-0"
          >
            Basic{" "}
            <span className="text-xs leading-[inherit] font-normal text-muted-foreground">
              Free
            </span>
          </Label>
          <p
            id={`${id}-1-description`}
            className="text-xs text-muted-foreground"
          >
            Get 1 project with 1 team member.
          </p>
        </div>
      </div>

      <div className="relative flex w-full items-center gap-2 rounded-md border border-input p-4 shadow-xs outline-none has-data-checked:border-primary/50">
        <RadioGroupItem
          value="2"
          id={`${id}-2`}
          aria-describedby={`${id}-2-description`}
          className="size-5 [&_[data-slot=radio-group-indicator]>span]:size-2.5"
        />
        <div className="grid grow gap-2">
          <Label
            htmlFor={`${id}-2`}
            className="justify-between after:absolute after:inset-0"
          >
            Premium{" "}
            <span className="text-xs leading-[inherit] font-normal text-muted-foreground">
              $5.00
            </span>
          </Label>
          <p
            id={`${id}-2-description`}
            className="text-xs text-muted-foreground"
          >
            Get 5 projects with 5 team members.
          </p>
        </div>
      </div>
    </RadioGroup>
  )
}

export default RadioGroupCardRadioDemo
