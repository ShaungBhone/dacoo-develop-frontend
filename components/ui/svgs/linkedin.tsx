import type { SVGProps } from "react"

export function LinkedIn(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      height="1em"
      width="1em"
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      style={{ flex: "none", lineHeight: 1 }}
      {...props}
    >
      <title>LinkedIn</title>
      <rect width="32" height="32" rx="6" fill="#0A66C2" />
      <path
        fill="#fff"
        d="M11.1 12.9H7.6V24h3.5V12.9Zm.23-3.42a2.03 2.03 0 1 0-4.06 0 2.03 2.03 0 0 0 4.06 0ZM24.4 17.7c0-3.16-1.86-4.98-4.32-4.98-1.44 0-2.5.66-3.06 1.62h-.05V12.9h-3.35V24h3.5v-5.6c0-1.5.28-2.94 2.13-2.94 1.83 0 1.85 1.7 1.85 3.03V24h3.5v-6.3Z"
      />
    </svg>
  )
}
