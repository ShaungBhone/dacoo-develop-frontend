"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { ApiError } from "@/lib/api"
import { cn } from "@/lib/utils"
import { useActiveOrganization } from "@/hooks/use-active-organization"
import {
  fetchRecordTemplates,
  installRecordTemplate,
  type RecordTemplate,
} from "@/components/records/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  ArrowUpRightIcon,
  Building2Icon,
  CheckIcon,
  HandshakeIcon,
  LayoutTemplateIcon,
  RefreshCwIcon,
  SearchIcon,
  SparklesIcon,
  TriangleAlertIcon,
} from "@/components/ui/icons"
import { TypographyH3, TypographyMuted } from "@/components/ui/typography"

type Category = "All" | "Sales"

const TEMPLATE_METADATA: Record<
  string,
  {
    icon: React.ComponentType<{ className?: string }>
    colorClass: string
    iconColorClass: string
    badgeColorClass: string
    objectLabel: string
    features: string[]
  }
> = {
  crm: {
    icon: Building2Icon,
    colorClass:
      "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400",
    iconColorClass: "text-blue-600 dark:text-blue-400",
    badgeColorClass: "border-blue-500/30 text-blue-600 dark:text-blue-400",
    objectLabel: "People & Companies",
    features: [
      "Contact lifecycle tracking",
      "Company account hierarchies",
      "Shared communication history",
      "Default workspace foundation",
    ],
  },
  sales: {
    icon: HandshakeIcon,
    colorClass:
      "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400",
    iconColorClass: "text-amber-600 dark:text-amber-400",
    badgeColorClass: "border-amber-500/30 text-amber-600 dark:text-amber-400",
    objectLabel: "Deals",
    features: [
      "Visual Kanban sales pipeline",
      "Deal value & expected close date",
      "Linked Company & Primary Contact",
      "6-stage deal progression board",
    ],
  },
}

export function RecordTemplatesView() {
  const organization = useActiveOrganization()
  const router = useRouter()
  const [templates, setTemplates] = React.useState<RecordTemplate[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedCategory, setSelectedCategory] =
    React.useState<Category>("All")
  const [installingKey, setInstallingKey] = React.useState<string | null>(null)

  const organizationId = organization?.id

  const loadTemplates = React.useCallback(async () => {
    if (!organizationId) return
    setLoading(true)
    setError(null)
    try {
      const data = await fetchRecordTemplates(organizationId)
      setTemplates(data)
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to load record templates."
      )
    } finally {
      setLoading(false)
    }
  }, [organizationId])

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadTemplates()
  }, [loadTemplates])

  const categories: Category[] = ["All", "Sales"]

  const filteredTemplates = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return templates.filter((template) => {
      const matchesCategory =
        selectedCategory === "All" || template.category === selectedCategory
      const matchesQuery =
        !query ||
        template.name.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query) ||
        template.category.toLowerCase().includes(query)
      return matchesCategory && matchesQuery
    })
  }, [templates, selectedCategory, searchQuery])

  const handleInstall = async (template: RecordTemplate) => {
    if (
      !organizationId ||
      template.key === "crm" ||
      template.installedVersion
    ) {
      return
    }

    setInstallingKey(template.key)
    try {
      await installRecordTemplate(
        organizationId,
        template.key as Exclude<RecordTemplate["key"], "crm">
      )
      setTemplates((prev) =>
        prev.map((item) =>
          item.key === template.key ? { ...item, installedVersion: 1 } : item
        )
      )
      window.dispatchEvent(new Event("record-templates-installed"))
      toast.success(`${template.name} installed successfully`)
      router.refresh()
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : `Failed to install ${template.name}.`
      toast.error(message)
    } finally {
      setInstallingKey(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <TypographyH3>Record Templates</TypographyH3>
        <TypographyMuted>
          Browse and install pre-configured record objects with attributes,
          statuses, and pipeline views for your workspace.
        </TypographyMuted>
      </div>

      {error && (
        <Alert variant="destructive">
          <TriangleAlertIcon aria-hidden="true" />
          <AlertTitle>Couldn&apos;t load templates</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-4">
            <span>{error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void loadTemplates()}
            >
              <RefreshCwIcon data-icon="inline-start" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Toolbar: Category Filters & Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          className="flex flex-wrap items-center gap-1.5"
          role="tablist"
          aria-label="Filter templates by category"
        >
          {categories.map((category) => {
            const isSelected = selectedCategory === category
            return (
              <Button
                key={category}
                type="button"
                variant={isSelected ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  "h-8 text-xs font-medium",
                  isSelected && "bg-muted font-semibold text-foreground"
                )}
              >
                {category === "All" && (
                  <LayoutTemplateIcon
                    data-icon="inline-start"
                    className="size-3.5"
                  />
                )}
                {category}
              </Button>
            )
          })}
        </div>

        <div className="relative w-full sm:w-72">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
            className="h-8 pl-8 text-sm"
          />
        </div>
      </div>

      {/* Templates List / Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="flex flex-col justify-between p-5">
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <Skeleton className="size-11 rounded-xl" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
                <div className="flex flex-col gap-1.5 pt-2">
                  <Skeleton className="h-3.5 w-1/3" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-4/5" />
                </div>
              </div>
              <div className="pt-5">
                <Skeleton className="h-9 w-full rounded-md" />
              </div>
            </Card>
          ))}
        </div>
      ) : filteredTemplates.length === 0 ? (
        <Empty className="rounded-xl border py-12">
          <EmptyMedia>
            <LayoutTemplateIcon className="size-8 text-muted-foreground" />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>No templates found</EmptyTitle>
            <EmptyDescription>
              {searchQuery
                ? `No templates matched "${searchQuery}". Try a different keyword.`
                : "No templates are available in this category."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {filteredTemplates.map((template) => {
            const meta = TEMPLATE_METADATA[template.key] ?? {
              icon: SparklesIcon,
              colorClass: "bg-muted text-foreground",
              iconColorClass: "text-foreground",
              badgeColorClass: "border-border text-muted-foreground",
              objectLabel: template.name,
              features: [
                "Custom workspace model",
                "Attributes and view pipelines",
              ],
            }
            const Icon = meta.icon
            const isInstalled =
              Boolean(template.installedVersion) || template.key === "crm"
            const isInstalling = installingKey === template.key

            return (
              <Card
                key={template.key}
                className={cn(
                  "flex flex-col justify-between border transition-all duration-200",
                  isInstalled
                    ? "bg-card shadow-xs"
                    : "bg-card hover:border-foreground/20 hover:shadow-xs"
                )}
              >
                <div>
                  <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-3">
                    <div
                      className={cn(
                        "flex size-11 items-center justify-center rounded-xl border",
                        meta.colorClass
                      )}
                    >
                      <Icon className="size-5" />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-xs font-normal">
                        {template.category}
                      </Badge>
                      {isInstalled && (
                        <Badge
                          variant="secondary"
                          className="gap-1 border-emerald-500/20 bg-emerald-500/10 text-xs text-emerald-600 dark:text-emerald-400"
                        >
                          <CheckIcon className="size-3" />
                          {template.key === "crm" ? "Default" : "Installed"}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="flex flex-col gap-3.5 pb-4">
                    <div className="flex flex-col gap-1">
                      <CardTitle className="text-base font-semibold">
                        {template.name}
                      </CardTitle>
                      <CardDescription className="text-sm leading-relaxed text-muted-foreground">
                        {template.description}
                      </CardDescription>
                    </div>

                    <div className="flex flex-col gap-2 rounded-lg bg-muted/40 p-3 text-xs">
                      <div className="flex items-center justify-between font-medium text-muted-foreground">
                        <span>Creates object</span>
                        <span className="font-semibold text-foreground">
                          {meta.objectLabel}
                        </span>
                      </div>
                      <ul className="flex flex-col gap-1 border-t border-border/50 pt-1 text-muted-foreground">
                        {meta.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center gap-1.5">
                            <span className="size-1 rounded-full bg-muted-foreground/60" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </div>

                <CardFooter className="pt-0">
                  {isInstalled ? (
                    <div className="flex w-full items-center gap-2">
                      <Button
                        render={
                          <Link href={`/records/${template.objectSlug}`} />
                        }
                        variant="outline"
                        size="sm"
                        className="w-full text-xs font-medium"
                      >
                        View records
                        <ArrowUpRightIcon
                          data-icon="inline-end"
                          className="size-3.5"
                        />
                      </Button>
                      <Button
                        render={<Link href={`/settings?tab=objects`} />}
                        variant="ghost"
                        size="sm"
                        className="text-xs text-muted-foreground"
                      >
                        Schema
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      className="w-full text-xs font-medium"
                      disabled={isInstalling}
                      onClick={() => void handleInstall(template)}
                    >
                      {isInstalling ? (
                        <>
                          <Spinner
                            data-icon="inline-start"
                            className="size-3.5"
                          />
                          Installing template...
                        </>
                      ) : (
                        <>
                          <LayoutTemplateIcon
                            data-icon="inline-start"
                            className="size-3.5"
                          />
                          Use template
                        </>
                      )}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
