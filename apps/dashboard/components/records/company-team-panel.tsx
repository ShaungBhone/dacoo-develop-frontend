"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { PlusIcon, UsersIcon, XIcon } from "@/components/ui/icons"
import { toast } from "sonner"

import { ApiError } from "@/lib/api"
import {
  fetchRecords,
  updateRecord,
  type RecordItem,
  type RecordSummary,
} from "@/components/records/api"
import { Alert, AlertDescription } from "@/components/reui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return Object.values(error.errors ?? {})[0]?.[0] ?? error.message
  }

  return "Couldn't update the team. Please try again."
}

function companyReference(value: unknown): RecordSummary | null {
  const entry = Array.isArray(value) ? value[0] : value

  if (
    entry &&
    typeof entry === "object" &&
    "id" in entry &&
    "title" in entry &&
    typeof entry.id === "string" &&
    typeof entry.title === "string"
  ) {
    return entry
  }

  return null
}

/**
 * Attio-style Team relationship for a Company. The Person's Company reference
 * is the only writable side, so every mutation below updates that record and
 * lets the backend's existing Team relation remain the source of truth.
 */
export function CompanyTeamPanel({
  active,
  company,
  organizationId,
  onTeamChanged,
}: {
  active: boolean
  company: RecordItem
  organizationId: number | string
  onTeamChanged: () => Promise<void>
}) {
  const router = useRouter()
  const [people, setPeople] = React.useState<RecordItem[] | null>(null)
  const [isAdding, setIsAdding] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [savingId, setSavingId] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [pendingReassignment, setPendingReassignment] =
    React.useState<RecordItem | null>(null)

  React.useEffect(() => {
    if (!active || people !== null) return

    let current = true
    fetchRecords(organizationId, "person")
      .then((records) => {
        if (current) setPeople(records)
      })
      .catch((requestError) => {
        if (current) {
          setPeople([])
          setError(errorMessage(requestError))
        }
      })

    return () => {
      current = false
    }
  }, [active, organizationId, people])

  const memberIds = React.useMemo(
    () => new Set((company.team ?? []).map((member) => member.id)),
    [company.team]
  )
  const candidates = React.useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase()

    return (people ?? []).filter((person) => {
      if (memberIds.has(person.id)) return false
      if (!normalizedQuery) return true

      return `${person.title} ${JSON.stringify(person.values)}`
        .toLocaleLowerCase()
        .includes(normalizedQuery)
    })
  }, [memberIds, people, query])

  const updateLocalPersonCompany = React.useCallback(
    (personId: string, nextCompany: RecordSummary | null) => {
      setPeople(
        (current) =>
          current?.map((person) =>
            person.id === personId
              ? {
                  ...person,
                  values: { ...person.values, company: nextCompany },
                }
              : person
          ) ?? current
      )
    },
    []
  )

  const savePersonCompany = React.useCallback(
    async (person: RecordItem, nextCompany: RecordSummary | null) => {
      setSavingId(person.id)
      setError(null)

      try {
        await updateRecord(organizationId, person.id, {
          company: nextCompany?.id ?? null,
        })
        updateLocalPersonCompany(person.id, nextCompany)
        await onTeamChanged()
        toast.success(
          nextCompany
            ? `${person.title} added to ${company.title}`
            : `${person.title} removed from ${company.title}`
        )
      } catch (requestError) {
        const message = errorMessage(requestError)
        setError(message)
        toast.error(message)
      } finally {
        setSavingId(null)
      }
    },
    [company.title, onTeamChanged, organizationId, updateLocalPersonCompany]
  )

  const handleAdd = React.useCallback(
    (person: RecordItem) => {
      const currentCompany = companyReference(person.values.company)
      if (currentCompany && currentCompany.id !== company.id) {
        setPendingReassignment(person)
        return
      }

      void savePersonCompany(person, { id: company.id, title: company.title })
    },
    [company.id, company.title, savePersonCompany]
  )

  const handleRemove = React.useCallback(
    (member: RecordSummary) => {
      const person = people?.find((candidate) => candidate.id === member.id)
      if (person) {
        void savePersonCompany(person, null)
        return
      }

      // The Team response is already authoritative; the people picker is
      // loaded lazily, so fetch the member if the tab has not finished loading.
      setSavingId(member.id)
      setError(null)
      updateRecord(organizationId, member.id, { company: null })
        .then(async () => {
          await onTeamChanged()
          toast.success(`${member.title} removed from ${company.title}`)
        })
        .catch((requestError) => {
          const message = errorMessage(requestError)
          setError(message)
          toast.error(message)
        })
        .finally(() => setSavingId(null))
    },
    [company.title, onTeamChanged, organizationId, people, savePersonCompany]
  )

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {(company.team?.length ?? 0) === 1
              ? "1 person works at this company"
              : `${company.team?.length ?? 0} people work at this company`}
          </p>
          <Button
            size="sm"
            onClick={() => {
              setIsAdding((current) => !current)
              setQuery("")
              setError(null)
            }}
            disabled={savingId !== null}
          >
            <PlusIcon aria-hidden="true" />
            Add people
          </Button>
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {isAdding ? (
          <div className="rounded-xl border bg-muted/20 p-3">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search people…"
              aria-label="Search people to add"
              autoFocus
            />
            <div className="mt-2 max-h-56 overflow-y-auto">
              {people === null ? (
                <div className="flex flex-col gap-2 py-1">
                  {[0, 1, 2].map((index) => (
                    <Skeleton key={index} className="h-10 w-full" />
                  ))}
                </div>
              ) : candidates.length > 0 ? (
                <div className="flex flex-col gap-1">
                  {candidates.map((person) => {
                    const linkedCompany = companyReference(
                      person.values.company
                    )
                    const isSaving = savingId === person.id

                    return (
                      <Button
                        key={person.id}
                        variant="ghost"
                        className="h-auto w-full justify-between gap-3 px-2.5 py-2 text-left"
                        disabled={savingId !== null}
                        onClick={() => handleAdd(person)}
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">
                            {person.title}
                          </span>
                          {linkedCompany ? (
                            <span className="block truncate text-xs text-muted-foreground">
                              Currently at {linkedCompany.title}
                            </span>
                          ) : null}
                        </span>
                        {isSaving ? (
                          <Spinner aria-label="Adding person" />
                        ) : null}
                      </Button>
                    )
                  })}
                </div>
              ) : (
                <p className="px-1 py-4 text-sm text-muted-foreground">
                  No people match your search.
                </p>
              )}
            </div>
          </div>
        ) : null}

        {(company.team?.length ?? 0) > 0 ? (
          <div className="divide-y rounded-xl border">
            {(company.team ?? []).map((member) => {
              const isSaving = savingId === member.id

              return (
                <div
                  key={member.id}
                  className="flex items-center gap-3 px-3 py-2.5"
                >
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left outline-none"
                    onClick={() => router.push(`/records/person/${member.id}`)}
                  >
                    <span className="block truncate text-sm font-medium hover:underline">
                      {member.title}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Person
                    </span>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remove ${member.title} from ${company.title}`}
                    disabled={savingId !== null}
                    onClick={() => handleRemove(member)}
                  >
                    {isSaving ? (
                      <Spinner aria-label="Removing person" />
                    ) : (
                      <XIcon />
                    )}
                  </Button>
                </div>
              )
            })}
          </div>
        ) : (
          <Empty className="border py-10">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <UsersIcon />
              </EmptyMedia>
              <EmptyTitle>No team members yet</EmptyTitle>
              <EmptyDescription>
                Add a Person record to start building this company&apos;s team.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>

      <Dialog
        open={pendingReassignment !== null}
        onOpenChange={(open) => {
          if (!open && savingId === null) setPendingReassignment(null)
        }}
      >
        <DialogContent showCloseButton={savingId === null}>
          <DialogHeader>
            <DialogTitle>Move person to {company.title}?</DialogTitle>
            <DialogDescription>
              {pendingReassignment
                ? `${pendingReassignment.title} is currently linked to ${companyReference(pendingReassignment.values.company)?.title ?? "another company"}. Moving them will update their Company field.`
                : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPendingReassignment(null)}
              disabled={savingId !== null}
            >
              Cancel
            </Button>
            <Button
              disabled={!pendingReassignment || savingId !== null}
              onClick={() => {
                if (!pendingReassignment) return
                const person = pendingReassignment
                setPendingReassignment(null)
                void savePersonCompany(person, {
                  id: company.id,
                  title: company.title,
                })
              }}
            >
              {savingId ? <Spinner className="mr-2" /> : null}
              Move person
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
