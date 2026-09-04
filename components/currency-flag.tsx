import { cn } from "@/lib/utils"

type FlagLayer = {
  inset: string
  src: string
}

const countryByCurrency: Record<string, string> = {
  BND: "BN",
  IDR: "ID",
  KHR: "KH",
  LAK: "LA",
  MMK: "MM",
  MYR: "MY",
  PHP: "PH",
  SGD: "SG",
  THB: "TH",
  USD: "US",
  VND: "VN",
}

const flagLayers: Record<string, FlagLayer[]> = {
  BN: [
    { inset: "inset-[0.01%]", src: "/images/flags/bn-1.svg" },
    {
      inset: "inset-[25.01%_6.7%_14.57%_1.68%]",
      src: "/images/flags/bn-2.svg",
    },
    { inset: "inset-0", src: "/images/flags/bn-3.svg" },
    {
      inset: "inset-[28.26%_30.44%_28.27%_30.44%]",
      src: "/images/flags/bn-4.svg",
    },
  ],
  KH: [
    { inset: "inset-[21.74%_0]", src: "/images/flags/kh-1.svg" },
    { inset: "inset-[0_6.08%]", src: "/images/flags/kh-2.svg" },
    {
      inset: "inset-[31.52%_28.26%_33.7%_28.26%]",
      src: "/images/flags/kh-3.svg",
    },
  ],
  ID: [
    { inset: "inset-0", src: "/images/flags/id-1.svg" },
    { inset: "inset-[0_0_50%]", src: "/images/flags/id-2.svg" },
  ],
  LA: [
    { inset: "inset-[0_4.96%_0.01%]", src: "/images/flags/la-1.svg" },
    { inset: "inset-[28.26%_0]", src: "/images/flags/la-2.svg" },
    { inset: "inset-[32.61%]", src: "/images/flags/la-3.svg" },
  ],
  MM: [
    { inset: "inset-[28.26%_0]", src: "/images/flags/mm-1.svg" },
    {
      inset: "inset-[0_3.11%_67.39%_3.11%]",
      src: "/images/flags/mm-2.svg",
    },
    {
      inset: "inset-[67.39%_3.11%_0_3.11%]",
      src: "/images/flags/mm-3.svg",
    },
    { inset: "inset-[17.39%_15.71%]", src: "/images/flags/mm-4.svg" },
  ],
  MY: [
    { inset: "inset-0", src: "/images/flags/my-1.svg" },
    { inset: "inset-[10.87%_0_0_1.72%]", src: "/images/flags/my-2.svg" },
    { inset: "inset-[0_50%_50%_0]", src: "/images/flags/my-3.svg" },
    {
      inset: "inset-[15.21%_54.34%_54.35%_13.28%]",
      src: "/images/flags/my-4.svg",
    },
  ],
  PH: [
    { inset: "inset-0", src: "/images/flags/ph-1.svg" },
    { inset: "inset-[0_0_0_14.65%]", src: "/images/flags/ph-2.svg" },
    { inset: "inset-[0_0_50%_14.65%]", src: "/images/flags/ph-3.svg" },
    {
      inset: "inset-[19.56%_54.33%_19.57%_4.35%]",
      src: "/images/flags/ph-4.svg",
    },
  ],
  SG: [
    { inset: "inset-0", src: "/images/flags/sg-1.svg" },
    { inset: "inset-[0_0_50%]", src: "/images/flags/sg-2.svg" },
    {
      inset: "inset-[10.87%_36.96%_58.7%_23.91%]",
      src: "/images/flags/sg-3.svg",
    },
  ],
  TH: [
    { inset: "inset-0", src: "/images/flags/th-1.svg" },
    { inset: "inset-[32.61%_0]", src: "/images/flags/th-2.svg" },
    { inset: "inset-[0_12.09%_0_12.1%]", src: "/images/flags/th-3.svg" },
  ],
  US: [
    { inset: "inset-0", src: "/images/flags/us-1.svg" },
    { inset: "inset-[10.87%_0_0_1.72%]", src: "/images/flags/us-2.svg" },
    { inset: "inset-[0_50%_50%_0]", src: "/images/flags/us-3.svg" },
  ],
  VN: [
    { inset: "inset-0", src: "/images/flags/vn-1.svg" },
    { inset: "inset-[26.09%_27.14%_30.43%]", src: "/images/flags/vn-2.svg" },
  ],
  earth: [
    { inset: "inset-0", src: "/images/flags/earth-1.svg" },
    {
      inset: "inset-[3.82%_4.48%_13.68%_3.13%]",
      src: "/images/flags/earth-2.svg",
    },
  ],
}

export function CurrencyFlag({
  currencyCode,
  className,
  ariaLabel,
}: {
  currencyCode: string
  className?: string
  ariaLabel?: string
}) {
  const country = countryByCurrency[currencyCode.toUpperCase()] ?? "earth"

  return (
    <span
      aria-label={ariaLabel ?? `${currencyCode.toUpperCase()} currency`}
      className={cn("relative size-6 shrink-0 overflow-hidden", className)}
      role="img"
    >
      {flagLayers[country].map((layer) => (
        <span key={layer.src} className={cn("absolute", layer.inset)}>
          <img alt="" className="block size-full max-w-none" src={layer.src} />
        </span>
      ))}
    </span>
  )
}
