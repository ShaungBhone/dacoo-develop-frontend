"use client"

import { PlusIcon, UserRoundIcon } from "@/components/ui/icons"
import type {
  ConversationParticipant,
  OrganizationMember,
} from "@/components/inbox/api"
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
}

interface ConversationAssigneeAvatarGroupProps {
  assignee: ConversationParticipant | null
  members: OrganizationMember[] | null
  onAssignClick: (memberId?: number | string) => void
}

export function ConversationAssigneeAvatarGroup({
  assignee,
  members,
  onAssignClick,
}: ConversationAssigneeAvatarGroupProps) {
  if (members === null || members.length === 0) {
    return (
      <Button onClick={() => onAssignClick()} size="sm" variant="outline">
        {assignee ? (
          <Avatar className="size-4.5" data-icon="inline-start">
            {assignee.avatarUrl ? (
              <AvatarImage src={assignee.avatarUrl} alt="" />
            ) : null}
            <AvatarFallback className="text-[9px]">
              {initials(assignee.name)}
            </AvatarFallback>
          </Avatar>
        ) : (
          <UserRoundIcon data-icon="inline-start" />
        )}
        {assignee?.name ?? "Assign"}
      </Button>
    )
  }

  const assignedMember = assignee
    ? members.find((member) => member.id === assignee.id)
    : undefined
  const orderedMembers = [
    ...(assignedMember ? [assignedMember] : []),
    ...members.filter((member) => member.id !== assignedMember?.id),
  ]
  const visibleMembers = orderedMembers.slice(0, 3)
  const overflowMembers = orderedMembers.slice(3)

  return (
    <div className="flex items-center">
      <Button
        aria-label="Assign conversation"
        className="h-auto gap-0 rounded-full p-0"
        onClick={() => onAssignClick()}
        variant="ghost"
      >
        <AvatarGroup>
          {visibleMembers.map((member) => (
            <Avatar key={member.id}>
              {member.avatarUrl ? (
                <AvatarImage src={member.avatarUrl} alt="" />
              ) : null}
              <AvatarFallback>{initials(member.name)}</AvatarFallback>
            </Avatar>
          ))}
        </AvatarGroup>
      </Button>

      {overflowMembers.length > 0 ? (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                aria-label="Choose a team member"
                className="-ml-2 rounded-full"
                size="icon-sm"
                type="button"
                variant="secondary"
              />
            }
          >
            <PlusIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-48">
            <DropdownMenuGroup>
              {overflowMembers.map((member) => (
                <DropdownMenuItem
                  key={member.id}
                  onSelect={() => onAssignClick(member.id)}
                >
                  <Avatar>
                    {member.avatarUrl ? (
                      <AvatarImage src={member.avatarUrl} alt="" />
                    ) : null}
                    <AvatarFallback>{initials(member.name)}</AvatarFallback>
                  </Avatar>
                  <span>{member.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  )
}
