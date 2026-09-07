import { AlertTriangleIcon } from "@/components/ui/icons"

import { Alert, AlertDescription } from "@/components/reui/alert"

export function ErrorAlert({ message }: { message: string }) {
  return (
    <Alert variant="destructive" className="py-2.5">
      <AlertTriangleIcon className="size-4" />
      <AlertDescription className="text-xs">{message}</AlertDescription>
    </Alert>
  )
}
