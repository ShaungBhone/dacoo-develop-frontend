import Image from "next/image"

import { cn } from "@/lib/utils"

export const CARD_THEMES = [
  "gray-strip",
  "gradient-strip",
  "transparent-gradient",
  "brand-dark",
  "brand-light",
  "gray-dark",
] as const

export type CardTheme = (typeof CARD_THEMES)[number]

export function isCardTheme(value: string): value is CardTheme {
  return CARD_THEMES.includes(value as CardTheme)
}

export function PaymentCard({
  theme,
  title,
  balance,
  last4 = "1234",
  expiry = "06/28",
  cardholder = "OLIVIA RHYE",
  className,
}: {
  theme: CardTheme
  title?: string
  balance?: string
  last4?: string
  expiry?: string
  cardholder?: string
  className?: string
}) {
  const isLight = theme === "brand-light"
  const isStrip = theme === "gray-strip" || theme === "gradient-strip"

  return (
    <div
      className={cn(
        "relative h-47.5 w-79 shrink-0 overflow-hidden rounded-2xl border",
        theme === "gray-strip" && "border-white bg-[#667085] backdrop-blur-[6px]",
        theme === "gradient-strip" &&
          "border-white bg-[linear-gradient(180deg,#fbc2eb_0%,#a18cd1_105.25%)]",
        theme === "transparent-gradient" &&
          "border-white bg-white backdrop-blur-[6px]",
        theme === "brand-dark" && "border-white",
        theme === "brand-light" && "bg-[#f4ebff]",
        theme === "gray-dark" && "border-white",
        className
      )}
    >
      {theme === "gray-strip" && (
        <div className="absolute inset-0 bg-[linear-gradient(125.102deg,rgba(255,255,255,0.3)_3.5118%,rgba(255,255,255,0)_111.71%)]" />
      )}
      {theme === "transparent-gradient" && (
        <>
          <div className="absolute inset-0 bg-[linear-gradient(125.102deg,rgba(255,255,255,0.3)_3.5118%,rgba(255,255,255,0)_111.71%),linear-gradient(90deg,rgba(0,0,0,0.1)_0%,rgba(0,0,0,0.1)_100%)]" />
          <div className="absolute -top-4.25 -left-4.25 size-40">
            <Image
              src="/card-transparent-gradient.svg"
              alt=""
              fill
              className="max-w-none scale-[2.6] object-contain"
            />
          </div>
        </>
      )}
      {theme === "brand-dark" && (
        <Image
          src="/card-brand-dark.png"
          alt=""
          fill
          className="object-cover"
        />
      )}
      {theme === "gray-dark" && (
        <Image src="/card-gray-dark.png" alt="" fill className="object-cover" />
      )}
      {isStrip && (
        <div className="absolute -inset-y-px right-21.75 -left-px bg-[#252b37]" />
      )}

      {title && (
        <p
          className={cn(
            "absolute top-4.75 right-14 left-4.75 truncate text-base leading-normal font-semibold",
            isLight ? "text-[#414651]" : "text-white"
          )}
        >
          {title}
        </p>
      )}

      {balance && (
        <p
          className={cn(
            "absolute top-[44px] right-14 left-4.75 truncate text-sm leading-normal font-medium",
            isLight ? "text-[#414651]" : "text-white"
          )}
        >
          {balance}
        </p>
      )}

      <Image
        src="/logo-mark.png"
        alt=""
        width={28}
        height={28}
        className="absolute top-[19px] right-[19px] size-7 object-contain"
      />

      <p
        className={cn(
          "absolute top-[127px] left-[15px] text-xs leading-normal font-semibold tracking-[0.6px] uppercase",
          isLight ? "text-[#414651]" : "text-white"
        )}
      >
        {cardholder}
      </p>
      <p
        className={cn(
          "absolute top-[148px] right-[19px] text-xs leading-normal font-semibold tracking-[0.6px] whitespace-nowrap",
          isLight ? "text-[#414651]" : "text-white"
        )}
      >
        {expiry}
      </p>
      <p
        className={cn(
          "absolute top-[151px] left-[15px] font-mono text-base leading-normal font-medium tracking-[0.64px] whitespace-nowrap",
          isLight ? "text-[#414651]" : "text-white"
        )}
      >
        1234 1234 1234 {last4}
      </p>
    </div>
  )
}

export function PaymentCardPreview(
  props: React.ComponentProps<typeof PaymentCard>
) {
  return (
    <div className="h-[137px] w-[228px] overflow-hidden rounded-xl">
      <PaymentCard
        {...props}
        className={cn("origin-top-left scale-[0.72]", props.className)}
      />
    </div>
  )
}
