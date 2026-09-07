import {
  BookOpenIcon,
  FoldersIcon,
  TicketIcon,
  UsersIcon,
} from "@/components/ui/icons"

import SocialProof from "@/components/shadcn-studio/blocks/social-proof-07/social-proof-07"

const metricsData = [
  { icon: <BookOpenIcon />, value: "110+", label: "Blocks" },
  { icon: <FoldersIcon />, value: "29", label: "Templates" },
  { icon: <UsersIcon />, value: "3400", label: "Customers" },
  { icon: <TicketIcon />, value: "2844+", label: "Support tickets" },
]

export default function SocialProofPage() {
  return <SocialProof metrics={metricsData} />
}
