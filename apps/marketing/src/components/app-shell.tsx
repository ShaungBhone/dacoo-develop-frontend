import { Fragment, type ReactNode } from "react"

import { AppSidebar } from "@/components/app-sidebar"
import { LegalFooterContent } from "@/components/sidebar-footer"
import { cn } from "@/lib/utils"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

type BreadcrumbEntry = {
  title: string
  href?: string
}

type AppShellProps = {
  breadcrumbs: BreadcrumbEntry[]
  children: ReactNode
  insetClassName?: string
}

export function AppShell({ breadcrumbs, children, insetClassName }: AppShellProps) {
  return (
    <SidebarProvider className="h-svh min-h-0 overflow-hidden">
      <AppSidebar />
      <SidebarInset className={cn("min-h-0 min-w-0 overflow-hidden", insetClassName)}>
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-vertical:h-4 data-vertical:self-auto"
            />
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((breadcrumb, index) => {
                  const isCurrentPage = index === breadcrumbs.length - 1

                  return (
                    <Fragment key={breadcrumb.title}>
                      {index > 0 && <BreadcrumbSeparator className="hidden md:block" />}
                      <BreadcrumbItem className={index === 0 ? "hidden md:block" : undefined}>
                        {isCurrentPage ? (
                          <BreadcrumbPage>{breadcrumb.title}</BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink href={breadcrumb.href ?? "#"}>
                            {breadcrumb.title}
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                    </Fragment>
                  )
                })}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto">
          {children}
        </main>
        <footer className="shrink-0 border-t px-4 py-3">
          <LegalFooterContent />
        </footer>
      </SidebarInset>
    </SidebarProvider>
  )
}
