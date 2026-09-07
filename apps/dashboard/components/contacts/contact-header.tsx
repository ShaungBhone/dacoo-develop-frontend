"use client"

import * as React from "react"
import {
  ArrowLeftIcon,
  BuildingIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  BriefcaseIcon,
  CalendarIcon,
  GitMergeIcon,
  MoreHorizontalIcon,
} from "@/components/ui/icons"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TypographyH1, TypographyLead } from "@/components/ui/typography"
import type { Contact, LifecycleStage } from "@/components/contacts/data"
import { formatDate } from "@/components/contacts/format"
import { MergeContactSheet } from "@/components/contacts/merge-contact-sheet"

const STAGE_LABEL: Record<LifecycleStage, string> = {
  lead: "Lead",
  active: "Active",
  churned: "Churned",
}

const STAGE_STYLES: Record<LifecycleStage, string> = {
  lead: "bg-chart-3/15 text-chart-3 dark:text-chart-2",
  active:
    "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-400",
  churned: "bg-destructive/10 text-destructive",
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
}

export function ContactHeader({
  contact,
  organizationId,
  onMerged,
}: {
  contact: Contact
  organizationId: number
  onMerged?: () => void
}) {
  const [isMergeOpen, setIsMergeOpen] = React.useState(false)

  const details = [
    { icon: BuildingIcon, label: "Company", value: contact.company },
    { icon: BriefcaseIcon, label: "Job title", value: contact.jobTitle },
    {
      icon: MailIcon,
      label: "Email",
      value: contact.email,
      href: `mailto:${contact.email}`,
    },
    {
      icon: PhoneIcon,
      label: "Phone",
      value: contact.phone,
      href: `tel:${contact.phone}`,
    },
    { icon: MapPinIcon, label: "Location", value: contact.location },
    {
      icon: CalendarIcon,
      label: "Contact since",
      value: formatDate(contact.since),
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/contacts"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" aria-hidden="true" />
        Back to contacts
      </Link>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <Avatar size="lg" className="size-16">
              <AvatarImage src={contact.avatar} alt="" />
              <AvatarFallback className="text-base font-medium">
                {initials(contact.name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex min-w-0 flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <TypographyH1 className="text-balance">
                  {contact.name}
                </TypographyH1>
                <Badge
                  className={cn(
                    "border-transparent",
                    STAGE_STYLES[contact.stage]
                  )}
                >
                  {STAGE_LABEL[contact.stage]}
                </Badge>
              </div>
              {(contact.jobTitle || contact.company) && (
                <TypographyLead>
                  {[contact.jobTitle, contact.company]
                    .filter(Boolean)
                    .join(" at ")}
                </TypographyLead>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="outline"
              render={<a href={`mailto:${contact.email}`} />}
            >
              <MailIcon data-icon="inline-start" aria-hidden="true" />
              Email
            </Button>
            <Button type="button" size="sm">
              Start conversation
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsMergeOpen(true)}
            >
              <GitMergeIcon data-icon="inline-start" aria-hidden="true" />
              Merge
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="More actions"
            >
              <MoreHorizontalIcon aria-hidden="true" />
            </Button>
          </div>
        </div>

        <dl className="mt-5 grid grid-cols-1 gap-x-6 gap-y-4 border-t border-border pt-5 sm:grid-cols-2 lg:grid-cols-3">
          {details.map((d) => (
            <div key={d.label} className="flex items-start gap-2.5">
              <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-muted">
                <d.icon
                  className="size-3.5 text-muted-foreground"
                  aria-hidden="true"
                />
              </div>
              <div className="flex min-w-0 flex-col">
                <dt className="text-xs text-muted-foreground">{d.label}</dt>
                {d.href ? (
                  <a
                    href={d.href}
                    className="truncate text-sm font-medium text-foreground hover:text-primary hover:underline"
                  >
                    {d.value}
                  </a>
                ) : (
                  <dd className="truncate text-sm font-medium text-foreground">
                    {d.value}
                  </dd>
                )}
              </div>
            </div>
          ))}
        </dl>
      </div>

      <MergeContactSheet
        open={isMergeOpen}
        onOpenChange={setIsMergeOpen}
        organizationId={organizationId}
        contactId={contact.id}
        contactName={contact.name}
        onMerged={onMerged ?? (() => {})}
      />
    </div>
  )
}
