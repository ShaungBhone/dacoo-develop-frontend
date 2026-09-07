import type { MDXComponents } from "mdx/types"

import { Callout, Steps } from "@/components/mdx-elements"

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    Callout,
    Steps,
    ...components,
  }
}
