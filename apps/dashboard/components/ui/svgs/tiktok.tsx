import type { SVGProps } from "react"

export function TikTok(props: SVGProps<SVGSVGElement>) {
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
      <title>TikTok</title>
      <rect width="32" height="32" rx="6" fill="#000" />
      {/* The offset cyan/red pair is the logo's chromatic-aberration look. */}
      <path
        fill="#25F4EE"
        d="M13.03 13.9v-1.32a5.1 5.1 0 0 0-4.4 8.9 5.09 5.09 0 0 1 4.4-7.58Z"
      />
      <path
        fill="#FE2C55"
        d="M20.32 7.6h-.03a5.2 5.2 0 0 0 .8 2.66 5.24 5.24 0 0 1-2.06-2.66h-1.4v11.15a2.14 2.14 0 0 1-3.86 1.24 2.14 2.14 0 0 0 3.06-1.94V7.6h3.49Z"
      />
      <path
        fill="#fff"
        d="M23.68 13.62v-1.3a5.2 5.2 0 0 1-2.79-.81 5.23 5.23 0 0 0 2.79 2.11Zm-2.79-2.11a5.2 5.2 0 0 1-.6-1.25 5.24 5.24 0 0 0 .6 1.25Zm-3.05 7.24V7.6h-2.4v11.15a2.14 2.14 0 0 1-3.98 1.08 2.14 2.14 0 0 1 .38-3.9v-2.45a5.1 5.1 0 0 0-2.5 9.17 5.09 5.09 0 0 0 8.5-3.9Z"
      />
      <path
        fill="#fff"
        d="M23.68 13.62a5.23 5.23 0 0 1-2.79-2.11 5.2 5.2 0 0 1-.6-1.25 5.2 5.2 0 0 1-.79-2.66h-1.06v11.15a5.09 5.09 0 0 1-8.5 3.9 5.09 5.09 0 0 0 8.9-3.4v-6.02a7.55 7.55 0 0 0 4.4 1.4v-1.01h.44Z"
      />
    </svg>
  )
}
