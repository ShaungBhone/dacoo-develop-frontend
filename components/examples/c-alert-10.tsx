import {
  Alert,
  AlertAction,
  AlertTitle,
} from "@/components/reui/alert"

import { Button } from "@/components/ui/button"
import { ShieldCheckIcon } from "@/components/ui/icons"

export function Pattern() {
  return (
    <Alert>
      <ShieldCheckIcon
      />
      <AlertTitle>Update your password and enable 2FA.</AlertTitle>
      <AlertAction>
        <Button variant="outline" size="xs">
          Dismiss
        </Button>
        <Button size="xs">Update</Button>
      </AlertAction>
    </Alert>
  )
}