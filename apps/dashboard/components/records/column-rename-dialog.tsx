"use client"

import * as React from "react"
import {
  EditAttributeSheet,
  type EditAttributeSheetProps,
} from "@/components/records/edit-attribute-sheet"

export interface ColumnRenameDialogProps {
  attribute: EditAttributeSheetProps["attribute"]
  organizationId: EditAttributeSheetProps["organizationId"]
  objectId: EditAttributeSheetProps["objectId"]
  onSaved: EditAttributeSheetProps["onSaved"]
  onClose: () => void
}

/**
 * Backward compatibility wrapper forwarding to the full EditAttributeSheet.
 */
export function ColumnRenameDialog({
  attribute,
  organizationId,
  objectId,
  onSaved,
  onClose,
}: ColumnRenameDialogProps) {
  return (
    <EditAttributeSheet
      open={!!attribute}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      attribute={attribute}
      organizationId={organizationId}
      objectId={objectId}
      onSaved={onSaved}
    />
  )
}