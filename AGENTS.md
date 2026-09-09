<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Radix Sheet & Select / Dropdown Portal Guidelines
When placing Radix UI `<Select>` or `<DropdownMenu>` components inside a Radix UI `<Sheet>`, handle `onPointerDownOutside` and `onInteractOutside` on `<SheetContent>` to prevent the Sheet drawer from closing when users open, select, or close dropdown portals. Only explicit clicks on the `sheet-overlay` backdrop will close the sheet:

```tsx
<SheetContent
  onPointerDownOutside={(e) => {
    const target = e.target as HTMLElement | null
    const isOverlay =
      target?.getAttribute?.("data-slot") === "sheet-overlay" ||
      target?.classList?.contains("bg-black/30")
    if (!isOverlay) {
      e.preventDefault()
    }
  }}
  onInteractOutside={(e) => {
    const target = e.target as HTMLElement | null
    const isOverlay =
      target?.getAttribute?.("data-slot") === "sheet-overlay" ||
      target?.classList?.contains("bg-black/30")
    if (!isOverlay) {
      e.preventDefault()
    }
  }}
>
```

# Record & Settings Panels Sheet Convention
Use Radix UI `<Sheet>` (side-drawer panel on the right, matching `ColumnSettingsSheet`) for record creation and column configuration panels instead of centered `<Dialog>` modals.

**Exception — record details.** A record's detail view is a full page at `/records/[object]/[id]`, not a Sheet, so it has a shareable URL and room for the related-content tabs. Clicking a row in the records grid navigates there; `RecordSheet` is now only the create form. Field values are edited inline on that page via `RecordFieldRow`, which reuses the same `AttributeInput` the create Sheet uses — add new attribute types there, not in a second per-type switch.

Ensure all `<SheetContent>` instances include Radix portal overlay guards (`onPointerDownOutside` & `onInteractOutside`) so that dropdowns and select menus opened inside the sheet do not prematurely close it.

# Button & UI Component Conventions
- **Outline Buttons**: When creating or styling outline buttons across the application, follow the ReUI `@reui/c-button-18` pattern (`bunx --bun shadcn@latest add @reui/c-button-18`) and standard shadcn button variants instead of bespoke ad-hoc CSS utility classes.

# ReUI DataGrid Loading & Skeleton Conventions
When implementing loading states for tables and data grids built with `@reui/data-grid`, follow the ReUI `@reui/c-data-grid-21` pattern (`bunx --bun shadcn@latest add @reui/c-data-grid-21`) instead of custom full-table spinners or un-skeletoned states.

### Guidelines:
1. **Pass `isLoading` to `<DataGrid>`**:
   Always pass the loading boolean to `<DataGrid isLoading={isLoading} ...>`. When `true`, `<DataGridTable>` automatically renders `pagination.pageSize` rows of `<DataGridTableBodyRowSkeleton>`.
2. **Define `meta.skeleton` on Every Column**:
   In each TanStack table `ColumnDef`, define `meta.skeleton` matching the expected cell geometry:
   - **Text / ID / Badge Columns**:
     ```tsx
     meta: {
       skeleton: <Skeleton className="h-5 w-20" />,
     }
     ```
   - **Avatar / Entity Combo Columns**:
     ```tsx
     meta: {
       skeleton: (
         <div className="flex items-center gap-3">
           <Skeleton className="size-8 rounded-full" />
           <div className="space-y-1">
             <Skeleton className="h-4 w-28" />
             <Skeleton className="h-3 w-16" />
           </div>
         </div>
       ),
     }
     ```
   - **Expand / Action Buttons**:
     ```tsx
     meta: {
       skeleton: <Skeleton className="size-6 rounded-md" />,
     }
     ```
3. **Prevent Layout Shifts**:
   Do not replace the entire table card or container with a centered spinner while loading initial data. Keep the toolbar, headers, and container stable while the skeleton rows shimmer.

# ReUI Dialog & Form Modal Conventions
When building dialogs, modals, and modal forms, always follow Dacoo's established ReUI component architecture rather than ad-hoc HTML tags or external one-off designs:

1. **Standard Dialog Shell**:
   - Use `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, and `DialogFooter` from `@/components/ui/dialog`.
   - Standard width: `sm:max-w-md` or `sm:max-w-lg`.
   - Never override `DialogContent` with bespoke padding or arbitrary header breadcrumbs unless specifically structured as a wizard.

2. **Form Structure**:
   - Group fields using `<FieldGroup className="gap-4 py-2">` from `@/components/ui/field`.
   - Wrap each input with `<Field>`, `<FieldLabel>`, and optional `<FieldDescription>` or `<FieldError>`.
   - Never use raw `<label>` or unstyled container divs for form inputs.

3. **Buttons & Footer Actions**:
   - Follow standard `DialogFooter` layout with right-aligned action buttons:
     - Secondary action: `<Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>`
     - Primary action: `<Button type="submit" ...>Action</Button>`
   - Do not inject arbitrary keyboard shortcut badges (`<Kbd>`) or custom bottom action bars into standard modal footers.

4. **Reference Implementations**:
   - Standard create dialogs: see `workspace-create-dialog.tsx` and `stage-edit-dialog.tsx`.

