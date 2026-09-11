import Image from "next/image"

import { cn } from "@/lib/utils"

export const Logo = ({ className }: { className?: string; uniColor?: boolean }) => (
  <Image
    src="/dacoo-logo.png"
    alt="Dacoo"
    width={1015}
    height={327}
    priority
    className={cn("h-8 w-auto", className)}
  />
)

export const LogoIcon = ({ className }: { className?: string; uniColor?: boolean }) => (
  <Image
    src="/dacoo-logo-icon.png"
    alt="Dacoo"
    width={512}
    height={512}
    className={cn("size-6", className)}
  />
)
