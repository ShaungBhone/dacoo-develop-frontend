declare module "*.mdx" {
  import type { ComponentType } from "react"
  import type { DocMetadata } from "@/lib/content-types"

  export const metadata: DocMetadata
  const Component: ComponentType
  export default Component
}
