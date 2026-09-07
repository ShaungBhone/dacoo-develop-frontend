import Image from "next/image"
import Link from "next/link"

import { cn } from "@/lib/utils"

export function AuthSplitShell({
  showcase,
  children,
  contentClassName,
}: {
  showcase?: React.ReactNode
  children: React.ReactNode
  contentClassName?: string
}) {
  return (
    <main
      data-auth-theme="light"
      className="grid min-h-svh bg-background scheme-light lg:grid-cols-[clamp(24rem,30vw,32rem)_minmax(0,1fr)]"
    >
      <aside className="hidden min-h-svh bg-background p-2 lg:flex">
        <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl border bg-muted/40">
          {showcase}
        </div>
      </aside>

      <section className="flex min-h-svh min-w-0 flex-col px-6 py-8 sm:px-10 lg:px-12 xl:px-16 2xl:px-20">
        <div className="flex justify-end">
          <BrandLogo />
        </div>

        <div className="flex flex-1 items-center justify-center py-10 lg:py-12">
          <div className={cn("w-full max-w-xs", contentClassName)}>
            {children}
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Dacoo. All rights reserved.
        </p>
      </section>
    </main>
  )
}

export function BrandLogo() {
  return (
    <Link href="/" aria-label="Dacoo home" className="relative h-9 w-32">
      <Image
        src="/logo-dark.png"
        alt="Dacoo"
        fill
        priority
        sizes="128px"
        className="object-contain"
      />
    </Link>
  )
}
