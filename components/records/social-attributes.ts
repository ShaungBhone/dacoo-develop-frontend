import type { ComponentType, SVGProps } from "react"

import { AngelList } from "@/components/ui/svgs/angellist"
import { Facebook } from "@/components/ui/svgs/facebook"
import { Instagram } from "@/components/ui/svgs/instagram"
import { LinkedIn } from "@/components/ui/svgs/linkedin"
import { TikTok } from "@/components/ui/svgs/tiktok"
import { X } from "@/components/ui/svgs/x"

/**
 * The per-platform social attributes the backend provisions on people and
 * companies (`ProvisionDefaultObjects::SOCIAL_ATTRIBUTES`), Attio-style: one
 * attribute per platform rather than a single freeform "social profiles" box.
 *
 * They are plain `text` attributes on the wire — the backend deliberately does
 * not type them as `domain`, because that normalises a URL down to its
 * hostname and would throw away the profile path. So every branch that gives
 * them link treatment has to key off the *slug*, not the type, and must be
 * checked before the per-type switch. Icon, display, and input all read this
 * one table so they cannot drift apart.
 */
export interface SocialPlatform {
  /** Brand mark from `components/ui/svgs/`. */
  icon: ComponentType<SVGProps<SVGSVGElement>>
  /** Hosts to strip when shortening a URL down to a handle. */
  hosts: string[]
  placeholder: string
}

export const SOCIAL_PLATFORM_BY_SLUG: Record<string, SocialPlatform> = {
  linkedin: {
    icon: LinkedIn,
    hosts: ["linkedin.com"],
    placeholder: "https://linkedin.com/in/…",
  },
  x: {
    icon: X,
    hosts: ["x.com", "twitter.com"],
    placeholder: "https://x.com/…",
  },
  facebook: {
    icon: Facebook,
    hosts: ["facebook.com", "fb.com"],
    placeholder: "https://facebook.com/…",
  },
  instagram: {
    icon: Instagram,
    hosts: ["instagram.com"],
    placeholder: "https://instagram.com/…",
  },
  tiktok: {
    icon: TikTok,
    hosts: ["tiktok.com"],
    placeholder: "https://tiktok.com/@…",
  },
  angellist: {
    icon: AngelList,
    hosts: ["angel.co", "wellfound.com", "angellist.com"],
    placeholder: "https://wellfound.com/company/…",
  },
}

/** The platform a slug denotes, or undefined for any ordinary attribute. */
export function socialPlatformFor(slug?: string): SocialPlatform | undefined {
  return slug ? SOCIAL_PLATFORM_BY_SLUG[slug] : undefined
}

/** Absolute href for a stored value, which may omit the scheme. */
export function socialHref(value: string): string {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`
}

/**
 * Shorten a profile URL to the part that identifies the person — the full
 * `https://www.linkedin.com/in/jane/` is mostly boilerplate the brand icon
 * already conveys, so a field row shows `in/jane` instead. Anything that is
 * not a recognisable URL for this platform is left exactly as typed.
 */
export function socialHandle(value: string, platform: SocialPlatform): string {
  const trimmed = value.trim()
  const withoutScheme = trimmed
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
  const [hostAndPath = ""] = withoutScheme.split(/[?#]/)
  const slashIndex = hostAndPath.indexOf("/")
  const host = (
    slashIndex === -1 ? hostAndPath : hostAndPath.slice(0, slashIndex)
  ).toLowerCase()

  const known = platform.hosts.some(
    (candidate) => host === candidate || host.endsWith(`.${candidate}`)
  )
  if (!known) return trimmed

  const path = slashIndex === -1 ? "" : hostAndPath.slice(slashIndex + 1)
  const cleaned = path.replace(/\/+$/, "")

  // A bare "linkedin.com" with no path has no handle to show; fall back to the
  // host so the row never renders as empty.
  return cleaned === "" ? host : cleaned
}
