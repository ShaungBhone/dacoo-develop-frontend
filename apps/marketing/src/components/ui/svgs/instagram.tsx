import { type SVGProps } from "react"

export function Instagram(props: SVGProps<SVGSVGElement>) {
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
      <title>Instagram</title>
      <defs>
        <radialGradient
          id="ig-bg"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(9 31) rotate(-55) scale(30)"
        >
          <stop stopColor="#FFD776" />
          <stop offset="0.35" stopColor="#F3A345" />
          <stop offset="0.55" stopColor="#E8386E" />
          <stop offset="0.8" stopColor="#CE2A9C" />
          <stop offset="1" stopColor="#6C43D0" />
        </radialGradient>
      </defs>
      <rect x="1" y="1" width="30" height="30" rx="9" fill="url(#ig-bg)" />
      <rect
        x="7"
        y="7"
        width="18"
        height="18"
        rx="6"
        stroke="#fff"
        strokeWidth="2.2"
        fill="none"
      />
      <circle cx="16" cy="16" r="4.4" stroke="#fff" strokeWidth="2.2" fill="none" />
      <circle cx="21.3" cy="10.7" r="1.4" fill="#fff" />
    </svg>
  )
}
