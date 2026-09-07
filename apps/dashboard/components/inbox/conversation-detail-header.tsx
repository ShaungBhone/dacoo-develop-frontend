"use client"

import * as React from "react"
import { toast } from "sonner"

import {
  BellIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ClockIcon,
  FlagIcon,
  MoreVerticalIcon,
  PanelRightIcon,
  SearchIcon,
  ShieldAlertIcon,
  SparklesIcon,
  TagIcon,
  Trash2Icon,
  UserRoundIcon,
  UserRoundPlusIcon,
} from "@/components/ui/icons"
import { Button } from "@/components/ui/button"
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "@/components/ui/button-group"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { getTagColor } from "@/lib/tag-colors"
import { cn } from "@/lib/utils"
import {
  attachConversationTags,
  createOrganizationTag,
  deleteConversation,
  detachConversationTag,
  fetchOrganizationTags,
  syncConversationToRecord,
  updateConversation,
  type Conversation,
  type ConversationPriority,
  type ConversationStatus,
  type ConversationTag,
  type OrganizationMember,
} from "./api"
import { PRIORITY_CONFIG, PRIORITY_OPTIONS } from "./priority"

const STATUS_CONFIG: Record<
  ConversationStatus,
  {
    label: string
    dotColor: string
    buttonClass: string
    separatorClass: string
  }
> = {
  open: {
    label: "Open",
    dotColor: "bg-emerald-400",
    buttonClass:
      "bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500",
    separatorClass: "bg-emerald-400/30",
  },
  pending: {
    label: "Pending",
    dotColor: "bg-amber-400",
    buttonClass:
      "bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-600 dark:hover:bg-amber-500",
    separatorClass: "bg-amber-400/30",
  },
  resolved: {
    label: "Resolved",
    dotColor: "bg-indigo-400",
    buttonClass:
      "bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-600 dark:hover:bg-indigo-500",
    separatorClass: "bg-indigo-400/30",
  },
  closed: {
    label: "Closed",
    dotColor: "bg-slate-400",
    buttonClass:
      "bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-800 dark:hover:bg-slate-700",
    separatorClass: "bg-slate-600/30",
  },
  spam: {
    label: "Spam",
    dotColor: "bg-red-400",
    buttonClass:
      "bg-red-600 hover:bg-red-700 text-white dark:bg-red-600 dark:hover:bg-red-500",
    separatorClass: "bg-red-400/30",
  },
}

const STATUS_OPTIONS: { value: ConversationStatus; label: string; dotColor: string }[] = [
  { value: "open", label: "Open", dotColor: "bg-emerald-500" },
  { value: "pending", label: "Pending", dotColor: "bg-amber-500" },
  { value: "resolved", label: "Resolved", dotColor: "bg-indigo-500" },
  { value: "closed", label: "Closed", dotColor: "bg-slate-400" },
]

const STATUS_LABEL: Record<ConversationStatus, string> = {
  open: "Open",
  pending: "Pending",
  resolved: "Resolved",
  closed: "Closed",
  spam: "Spam",
}

interface ConversationDetailHeaderProps {
  conversation: Conversation
  organizationId: number | string
  members: OrganizationMember[] | null
  isPanelOpen: boolean
  onTogglePanel: () => void
  onAssignClick: (memberId?: number | string) => void
  onAssignAiClick?: () => void
  onConversationUpdate?: (conversation: Conversation) => void
  onConversationDeleted?: (conversationId: number | string) => void
  onBack?: () => void
}

export function ConversationDetailHeader({
  conversation,
  organizationId,
  members,
  isPanelOpen,
  onTogglePanel,
  onAssignClick,
  onAssignAiClick,
  onConversationUpdate,
  onConversationDeleted,
  onBack,
}: ConversationDetailHeaderProps) {
  const [orgTags, setOrgTags] = React.useState<ConversationTag[]>([])
  const [isTagDialogOpen, setIsTagDialogOpen] = React.useState(false)
  const [stagedTagIds, setStagedTagIds] = React.useState<(number | string)[]>([])
  const [isSavingTags, setIsSavingTags] = React.useState(false)
  const [tagSearchQuery, setTagSearchQuery] = React.useState("")

  React.useEffect(() => {
    if (!organizationId) return
    fetchOrganizationTags(organizationId)
      .then(setOrgTags)
      .catch(() => { })
  }, [organizationId])

  React.useEffect(() => {
    if (isTagDialogOpen) {
      setStagedTagIds(conversation.tags.map((t) => t.id))
      setTagSearchQuery("")
      if (organizationId) {
        fetchOrganizationTags(organizationId)
          .then(setOrgTags)
          .catch(() => { })
      }
    }
  }, [isTagDialogOpen, conversation.tags, organizationId])

  const filteredOrgTags = React.useMemo(() => {
    if (!tagSearchQuery.trim()) return orgTags
    const query = tagSearchQuery.trim().toLowerCase()
    return orgTags.filter((t) => t.name.toLowerCase().includes(query))
  }, [orgTags, tagSearchQuery])

  const handleStatusChange = async (newStatus: ConversationStatus) => {
    if (newStatus === conversation.status) return
    try {
      const updated = await updateConversation(organizationId, conversation.id, {
        status: newStatus,
      })
      onConversationUpdate?.(updated)
      toast.success(`Marked as ${STATUS_LABEL[newStatus]}`)
    } catch {
      toast.error(`Couldn't change status to ${STATUS_LABEL[newStatus]}`)
    }
  }

  const handleToggleSpam = async () => {
    const isSpam = conversation.status === "spam"
    const newStatus: ConversationStatus = isSpam ? "open" : "spam"
    try {
      const updated = await updateConversation(organizationId, conversation.id, {
        status: newStatus,
      })
      onConversationUpdate?.(updated)
      toast.success(isSpam ? "Unmarked as spam" : "Marked as spam")
    } catch {
      toast.error(isSpam ? "Couldn't unmark as spam" : "Couldn't mark as spam")
    }
  }

  const handlePriorityChange = async (newPriority: ConversationPriority) => {
    if (newPriority === conversation.priority) return
    try {
      const updated = await updateConversation(organizationId, conversation.id, {
        priority: newPriority,
      })
      onConversationUpdate?.(updated)
      toast.success(`Priority set to ${PRIORITY_CONFIG[newPriority].label}`)
    } catch {
      toast.error("Couldn't update priority")
    }
  }

  const handleToggleStagedTag = (tagId: number | string, shouldAttach: boolean) => {
    setStagedTagIds((prev) => {
      if (shouldAttach) {
        return prev.some((id) => String(id) === String(tagId))
          ? prev
          : [...prev, tagId]
      }
      return prev.filter((id) => String(id) !== String(tagId))
    })
  }

  const handleSaveTags = async () => {
    const currentTagIds = conversation.tags.map((t) => t.id)
    const addedIds = stagedTagIds.filter(
      (id) => !currentTagIds.some((cId) => String(cId) === String(id))
    )
    const removedIds = currentTagIds.filter(
      (id) => !stagedTagIds.some((sId) => String(sId) === String(id))
    )

    if (addedIds.length === 0 && removedIds.length === 0) {
      setIsTagDialogOpen(false)
      return
    }

    setIsSavingTags(true)
    try {
      let updated: Conversation = conversation

      for (const tagId of removedIds) {
        updated = await detachConversationTag(
          organizationId,
          conversation.id,
          tagId
        )
      }

      if (addedIds.length > 0) {
        updated = await attachConversationTags(
          organizationId,
          conversation.id,
          addedIds
        )
      }

      onConversationUpdate?.(updated)
      toast.success("Tags updated successfully")
      setIsTagDialogOpen(false)
    } catch {
      toast.error("Failed to save tags")
    } finally {
      setIsSavingTags(false)
    }
  }

  const handleSyncToRecord = async () => {
    try {
      const record = await syncConversationToRecord(organizationId, conversation.id)
      toast.success(`${record.title} synced to People`)
    } catch {
      toast.error("Couldn't sync customer to People")
    }
  }

  const handleMarkAsUnread = async () => {
    try {
      const updated = await updateConversation(organizationId, conversation.id, {
        read: false,
      })
      onConversationUpdate?.(updated)
      toast.success("Marked as unread")
    } catch {
      toast.error("Couldn't mark as unread")
    }
  }

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const handleSnooze = (durationLabel: string) => {
    toast.success(`Conversation snoozed for ${durationLabel}`)
  }

  const handleDeleteConversation = async () => {
    if (!organizationId) return
    setIsDeleting(true)
    try {
      await deleteConversation(organizationId, conversation.id)
      toast.success("Conversation deleted")
      setIsDeleteDialogOpen(false)
      onConversationDeleted?.(conversation.id)
    } catch {
      toast.error("Failed to delete conversation. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
      {/* Left side: Status pill selector */}
      <div className="flex items-center gap-2">
        {onBack ? (
          <Button
            aria-label="Back to conversations"
            size="icon-sm"
            variant="ghost"
            onClick={onBack}
            className="md:hidden"
          >
            <ChevronLeftIcon />
          </Button>
        ) : null}

        {(() => {
          const currentConfig =
            STATUS_CONFIG[conversation.status] ?? STATUS_CONFIG.open
          return (
            <ButtonGroup>
              <Button
                className={cn(
                  currentConfig.buttonClass
                )}
              >
                <span
                  className={cn("size-2 rounded-full", currentConfig.dotColor)}
                />
                {currentConfig.label}
              </Button>
              <ButtonGroupSeparator className={currentConfig.separatorClass} />
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="default" size="icon" aria-label="More options" className={cn(
                      currentConfig.buttonClass
                    )} />
                  }
                >
                  <ChevronDownIcon aria-hidden="true" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-36">
                  <DropdownMenuGroup>
                    {STATUS_OPTIONS.map((opt) => (
                      <DropdownMenuItem
                        key={opt.value}
                        onClick={() => handleStatusChange(opt.value)}
                        className="flex items-center justify-between"
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className={cn("size-2 rounded-full", opt.dotColor)}
                          />
                          <span>{opt.label}</span>
                        </span>
                        {conversation.status === opt.value ? (
                          <CheckIcon className="size-3.5 text-primary" />
                        ) : null}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </ButtonGroup>
          )
        })()}
      </div>

      {/* Right side: Action icons matching top inbox nav */}
      <div className="flex items-center gap-1">
        {/* Snooze (Bell) dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                aria-label="Snooze conversation"
                size="icon-sm"
                variant="ghost"
                className="text-muted-foreground hover:text-foreground"
              />
            }
          >
            <BellIcon className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Snooze conversation</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleSnooze("1 hour")}>
                <ClockIcon />
                <span>For 1 hour</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSnooze("until tomorrow 9:00 AM")}>
                <ClockIcon />
                <span>Until tomorrow (9:00 AM)</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSnooze("until next week")}>
                <ClockIcon />
                <span>Until next week</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Tag Manager Dialog */}
        <Dialog open={isTagDialogOpen} onOpenChange={setIsTagDialogOpen}>
          <DialogTrigger
            render={
              <Button
                aria-label="Manage tags"
                size="icon-sm"
                variant="ghost"
                className={cn(
                  "relative text-muted-foreground hover:text-foreground",
                  conversation.tags.length > 0 && "text-foreground"
                )}
              />
            }
          >
            <TagIcon className="size-4" />
            {conversation.tags.length > 0 ? (
              <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-primary" />
            ) : null}
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <TagIcon className="size-5" />
                </div>
                <div className="flex flex-col gap-1 text-left">
                  <DialogTitle>Conversation tags</DialogTitle>
                  <DialogDescription>
                    Add or remove tags for this conversation.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="flex flex-col gap-3 py-1">
              {/* Search filter */}
              <div className="relative">
                <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Filter organization tags..."
                  value={tagSearchQuery}
                  onChange={(e) => setTagSearchQuery(e.target.value)}
                  className="h-8.5 pl-8 text-xs"
                />
              </div>

              {/* Tag checkbox list */}
              <div className="max-h-72 overflow-y-auto pr-1">
                {filteredOrgTags.length > 0 ? (
                  <FieldGroup className="w-full gap-2">
                    {filteredOrgTags.map((tag) => {
                      const isAttached = stagedTagIds.some(
                        (id) => String(id) === String(tag.id)
                      )
                      const color = getTagColor(tag.name, tag.color)

                      return (
                        <FieldLabel
                          key={tag.id}
                          className="relative p-0 cursor-pointer select-none"
                        >
                          <Field
                            orientation="horizontal"
                            className="items-center justify-between"
                          >
                            <FieldTitle className="flex items-center gap-2.5">
                              <div
                                className={cn(
                                  "flex size-8 shrink-0 items-center justify-center rounded-lg border",
                                  color.bg,
                                  color.text,
                                  color.border
                                )}
                              >
                                <TagIcon className="size-4" />
                              </div>
                              <span className="text-sm font-semibold text-foreground">
                                {tag.name}
                              </span>
                            </FieldTitle>
                            <Checkbox
                              checked={isAttached}
                              onCheckedChange={(checked) =>
                                handleToggleStagedTag(tag.id, !!checked)
                              }
                              disabled={isSavingTags}
                            />
                          </Field>
                        </FieldLabel>
                      )
                    })}
                  </FieldGroup>
                ) : (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    {tagSearchQuery
                      ? "No tags matching your search."
                      : "No tags found in organization. Configure tags in Settings."}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <DialogClose
                render={
                  <Button variant="outline" disabled={isSavingTags} />
                }
              >
                Cancel
              </DialogClose>
              <Button
                type="button"
                onClick={handleSaveTags}
                disabled={isSavingTags}
              >
                {isSavingTags ? (
                  <>
                    <Spinner className="size-4" />
                    <span>Saving…</span>
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* More actions dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                aria-label="More conversation options"
                size="icon-sm"
                variant="ghost"
                className="text-muted-foreground hover:text-foreground"
              />
            }
          >
            <MoreVerticalIcon className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => onAssignClick()}>
                <UserRoundIcon />
                <span>Assign team member</span>
              </DropdownMenuItem>
              {onAssignAiClick ? (
                <DropdownMenuItem onClick={onAssignAiClick}>
                  <SparklesIcon />
                  <span>Assign to AI</span>
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <FlagIcon
                    className={cn(
                      "size-4",
                      PRIORITY_CONFIG[conversation.priority]?.color
                    )}
                  />
                  <span>Priority</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-36">
                  <DropdownMenuRadioGroup
                    value={conversation.priority}
                    onValueChange={(val) =>
                      handlePriorityChange(val as ConversationPriority)
                    }
                  >
                    {PRIORITY_OPTIONS.map((opt) => (
                      <DropdownMenuRadioItem
                        key={opt.value}
                        value={opt.value}
                        className="flex items-center gap-2"
                      >
                        <FlagIcon className={cn("size-3.5", opt.color)} />
                        <span>{opt.label}</span>
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem onClick={handleMarkAsUnread}>
                <span>Mark as unread</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleToggleSpam}>
                <ShieldAlertIcon className="size-4" />
                <span>
                  {conversation.status === "spam"
                    ? "Mark as not spam"
                    : "Mark as spam"}
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSyncToRecord}>
                <UserRoundPlusIcon />
                <span>Sync to People record</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem
                variant="destructive"
                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2Icon className="size-4" />
                <span>Delete conversation</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Delete conversation dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Delete conversation</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this conversation with{" "}
                <span className="font-medium text-foreground">
                  {conversation.customer.displayName}
                </span>
                ? This will permanently delete the conversation and all of its messages. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:justify-end">
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                type="button"
                onClick={handleDeleteConversation}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Spinner className="size-4" />
                    <span>Deleting…</span>
                  </>
                ) : (
                  "Delete conversation"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Divider before panel toggle */}
        <div className="mx-1 h-4 w-px bg-border" />

        {/* Toggle Customer Details Panel */}
        <Button
          aria-label={isPanelOpen ? "Hide customer details" : "Show customer details"}
          size="icon-sm"
          variant="ghost"
          onClick={onTogglePanel}
          className={cn(
            "text-muted-foreground hover:text-foreground",
            isPanelOpen && "bg-muted text-foreground"
          )}
        >
          <PanelRightIcon className="size-4" />
        </Button>
      </div>
    </div>
  )
}
