import { CheckIcon, SparklesIcon } from "@/components/ui/icons"

import { BrandLogo } from "@/components/auth/auth-split-shell"

const benefits = [
  "One inbox for every customer channel",
  "AI-assisted replies with human control",
  "Shared customer context for every team",
]

export function LoginShowcase() {
  return (
    <div className="relative z-10 flex h-full flex-col p-9 xl:p-12">
      <BrandLogo />

      <div className="my-auto max-w-xl py-12">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 backdrop-blur-sm">
          <SparklesIcon className="size-3.5 text-emerald-400" />
          Customer conversations, connected
        </div>
        <h1 className="mt-7 text-4xl font-semibold tracking-tight text-balance xl:text-5xl xl:leading-[1.08]">
          Turn every conversation into a better customer relationship.
        </h1>
        <p className="mt-5 max-w-lg text-base leading-7 text-white/60">
          Bring your channels, teammates, and customer context together in one
          calm workspace.
        </p>

        <ul className="mt-8 grid gap-3 text-sm text-white/75">
          {benefits.map((benefit) => (
            <li key={benefit} className="flex items-center gap-3">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
                <CheckIcon className="size-3" />
              </span>
              {benefit}
            </li>
          ))}
        </ul>
      </div>

      <figure className="max-w-xl rounded-xl border border-white/10 bg-white/6 p-5 shadow-2xl shadow-black/20 backdrop-blur-md">
        <blockquote className="text-sm leading-6 text-white/85">
          “Dacoo gives our team one clear place to understand the customer and
          respond with confidence.”
        </blockquote>
        <figcaption className="mt-4 flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex size-9 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white ring-1 ring-white/15"
          >
            AO
          </span>
          <span>
            <span className="block text-sm font-medium">Amara Okonkwo</span>
            <span className="block text-xs text-white/50">
              Customer experience lead
            </span>
          </span>
        </figcaption>
      </figure>
    </div>
  )
}
