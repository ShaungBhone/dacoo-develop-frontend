import { LandmarkIcon } from "@/components/ui/icons"

import { Button } from "@/components/ui/button"

export function DepositTab({
  isActive,
  onClose,
}: {
  isActive: boolean
  onClose: () => void
}) {
  return (
    <div hidden={!isActive} className="space-y-5 p-6">
      <div className="flex gap-3 rounded-2xl border border-border bg-muted/10 p-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <LandmarkIcon className="size-4" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-sm font-semibold">
            Deposits are administrator-managed
          </h3>
          <p className="text-sm leading-5 text-muted-foreground">
            Contact your organization administrator to add money to an
            organization wallet. Payment-card deposits are not available here.
          </p>
        </div>
      </div>
      <div className="flex pt-2">
        <Button onClick={onClose} className="w-full">
          Done
        </Button>
      </div>
    </div>
  )
}
