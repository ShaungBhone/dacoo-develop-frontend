import { type SVGProps } from 'react'

export function Telegram(props: SVGProps<SVGSVGElement>) {
    return (
        <svg
            height="1em"
            width="1em"
            viewBox="0 0 32 32"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            style={{ flex: 'none', lineHeight: 1 }}
            {...props}>
            <title>{'Telegram'}</title>
            <defs>
                <linearGradient
                    id="tg-bg"
                    x1="16"
                    y1="2"
                    x2="16"
                    y2="30"
                    gradientUnits="userSpaceOnUse">
                    <stop stopColor="#37BBFE" />
                    <stop offset="1" stopColor="#007DBB" />
                </linearGradient>
            </defs>
            <circle cx="16" cy="16" r="14" fill="url(#tg-bg)" />
            <path
                transform="translate(7 9)"
                d="M15.9866 1.20879C16.1112 0.403318 15.3454 -0.232446 14.6292 0.0819956L0.364818 6.34484C-0.148772 6.57034 -0.111204 7.34826 0.421467 7.51789L3.36315 8.45468C3.92458 8.63347 4.53253 8.54102 5.02279 8.20231L11.655 3.62027C11.855 3.4821 12.073 3.76646 11.9021 3.94263L7.12811 8.86465C6.66501 9.34211 6.75693 10.1512 7.31397 10.5005L12.659 13.8523C13.2585 14.2282 14.0297 13.8506 14.1418 13.1261L15.9866 1.20879Z"
                fill="#fff"
            />
        </svg>
    )
}
