import type { SVGProps } from "react"

export function Facebook(props: SVGProps<SVGSVGElement>) {
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
      <title>Facebook</title>
      <circle cx="16" cy="16" r="14" fill="#0866FF" />
      <path
        fill="#fff"
        d="M21.16 20.63 21.78 16.6h-3.87v-2.61c0-1.1.54-2.18 2.27-2.18h1.76V8.37s-1.6-.27-3.12-.27c-3.19 0-5.27 1.93-5.27 5.43v3.07h-3.54v4.03h3.54v9.74a14.1 14.1 0 0 0 4.36 0v-9.74h3.25Z"
      />
    </svg>
  )
}
