import type { SVGProps } from "react"

export function DacooLogo({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <rect width="32" height="32" rx="9" fill="currentColor" />
      <path
        d="M9 9h7.25C21.08 9 24 11.55 24 16s-2.92 7-7.75 7H9V9Zm6.9 10.2c2.48 0 3.85-1.1 3.85-3.2s-1.37-3.2-3.85-3.2h-2.65v6.4h2.65Z"
        fill="white"
      />
    </svg>
  )
}
