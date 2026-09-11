import { type SVGProps } from 'react'

export function Messenger(props: SVGProps<SVGSVGElement>) {
    return (
        <svg
            height="1em"
            width="1em"
            viewBox="0 0 32 32"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            style={{ flex: 'none', lineHeight: 1 }}
            {...props}>
            <title>{'Messenger'}</title>
            <defs>
                <linearGradient
                    id="msg-bg"
                    x1="16"
                    y1="3"
                    x2="11.8286"
                    y2="28.8583"
                    gradientUnits="userSpaceOnUse">
                    <stop stopColor="#00B1FF" />
                    <stop offset="1" stopColor="#006BFF" />
                </linearGradient>
            </defs>
            <path
                transform="translate(3 3)"
                fillRule="evenodd"
                clipRule="evenodd"
                d="M13 25.1791C20.1797 25.1791 26 19.5426 26 12.5896C26 5.63654 20.1797 0 13 0C5.8203 0 0 5.63654 0 12.5896C0 16.3712 1.72168 19.7634 4.44737 22.0711V24.6188C4.44737 25.6145 5.4616 26.2824 6.36588 25.8821L9.19299 24.6307C10.397 24.9873 11.6754 25.1791 13 25.1791Z"
                fill="url(#msg-bg)"
            />
            <path
                transform="translate(9 12)"
                d="M3.88701 0.913318L0.117235 6.06895C-0.286957 6.62173 0.439937 7.2858 0.993338 6.86933L4.21228 4.44687C4.53993 4.20029 4.99922 4.19697 5.33069 4.43878L8.19353 6.52721C8.74254 6.92771 9.5272 6.81253 9.92694 6.27274L13.8805 0.934072C14.2905 0.380398 13.558 -0.289058 13.0038 0.132844L9.60063 2.72361C9.27292 2.97308 8.81118 2.97766 8.47819 2.73475L5.62465 0.6531C5.07334 0.250919 4.28503 0.36897 3.88701 0.913318Z"
                fill="#fff"
            />
        </svg>
    )
}
