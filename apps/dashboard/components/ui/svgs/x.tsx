import type { SVGProps } from "react"

export function X(props: SVGProps<SVGSVGElement>) {
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
      <title>X</title>
      <rect width="32" height="32" rx="6" fill="#000" />
      <path
        fill="#fff"
        d="M21.4 7.6h2.86l-6.25 7.14L25.36 24.4h-5.76l-4.51-5.9-5.16 5.9H7.06l6.68-7.64L6.64 7.6h5.9l4.08 5.39 4.78-5.39Zm-1 15.1h1.58L11.66 9.2H9.96l11.44 13.5Z"
      />
    </svg>
  )
}
