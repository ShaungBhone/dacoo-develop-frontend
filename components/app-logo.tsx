import Image from "next/image"
import Link from "next/link"

export function AppLogo() {
  return (
    <Link
      href="/dashboard"
      aria-label="Dacoo dashboard"
      className="flex h-12 items-center overflow-hidden rounded-xl px-2.5 ring-sidebar-ring transition-[width,padding] outline-none group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-0 focus-visible:ring-3"
    >
      <span className="relative h-8 w-25 group-data-[collapsible=icon]:hidden">
        <Image
          src="/logo-dark.png"
          alt="Dacoo"
          fill
          priority
          sizes="100px"
          className="object-left object-contain dark:hidden"
        />
        <Image
          src="/logo-light.png"
          alt="Dacoo"
          fill
          priority
          sizes="100px"
          className="hidden object-left object-contain dark:block"
        />
      </span>
      <Image
        src="/logo-mark.png"
        alt=""
        width={32}
        height={32}
        priority
        className="hidden size-8 object-contain group-data-[collapsible=icon]:block"
      />
    </Link>
  )
}
