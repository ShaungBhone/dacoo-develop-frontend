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
