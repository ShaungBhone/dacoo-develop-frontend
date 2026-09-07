import type { Organization } from "@/contexts/auth-context"
import { useOrganization } from "@/contexts/organization-context"

export function useActiveOrganization(): Organization | null {
  return useOrganization().activeOrganization
}
