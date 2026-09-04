import type { ConversationStatus } from "@/components/contacts/data"

export type Priority = "low" | "medium" | "high" | "urgent"
export type Channel = "chat" | "email" | "whatsapp"

export interface MockConversation {
  id: string
  contactId: string
  contactName: string
  contactAvatar: string
  subject: string
  preview: string
  timestamp: string
  status: ConversationStatus
  channel: Channel
  priority: Priority
  assignedTo: string | null
  tags: string[]
  internalNotes: string
  messages: MockConversationMessage[]
}

export interface MockConversationMessage {
  id: string
  author: string
  authorRole: "contact" | "agent"
  content: string
  timestamp: string
  channel: Channel
}

// Mock data for the inbox
const NOW = new Date().toISOString()
const HOUR_AGO = new Date(Date.now() - 3600000).toISOString()
const TWO_HOURS_AGO = new Date(Date.now() - 7200000).toISOString()
const DAY_AGO = new Date(Date.now() - 86400000).toISOString()

export const MOCK_CONVERSATIONS: MockConversation[] = [
  {
    id: "tick_001",
    contactId: "cus_8f42a1",
    contactName: "Amara Okonkwo",
    contactAvatar: "/customers/amara-okonkwo.png",
    subject: "Bulk pricing tier clarification needed",
    preview: "Hey — can you confirm the bulk pricing tier kicks in at 500 units or 1000? Need to lock the PO today.",
    timestamp: NOW,
    status: "open",
    channel: "chat",
    priority: "high",
    assignedTo: null,
    tags: ["billing", "urgent"],
    internalNotes: "Contact is time-sensitive, needs response within the hour",
    messages: [
      {
        id: "msg_1",
        author: "Amara Okonkwo",
        authorRole: "contact",
        content: "Hey — can you confirm the bulk pricing tier kicks in at 500 units or 1000? Need to lock the PO today.",
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        channel: "chat",
      },
      {
        id: "msg_1a",
        author: "You",
        authorRole: "agent",
        content: "Hi Amara — the bulk rate starts at 500 units. I can also send over the current tier sheet if that helps with your PO.",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        channel: "chat",
      },
    ],
  },
  {
    id: "tick_002",
    contactId: "cus_9d55e2",
    contactName: "Yuki Tanaka",
    contactAvatar: "",
    subject: "Issue with recent order",
    preview: "The items I received yesterday don't match what was ordered. Need to resolve this quickly.",
    timestamp: HOUR_AGO,
    status: "open",
    channel: "email",
    priority: "urgent",
    assignedTo: "You",
    tags: ["order-issue", "urgent"],
    internalNotes: "",
    messages: [
      {
        id: "msg_2",
        author: "Yuki Tanaka",
        authorRole: "contact",
        content: "The items I received yesterday don't match what was ordered. Need to resolve this quickly.",
        timestamp: HOUR_AGO,
        channel: "email",
      },
    ],
  },
  {
    id: "tick_003",
    contactId: "cus_3b19c7",
    contactName: "Marcus Feldman",
    contactAvatar: "",
    subject: "Feature request: Inventory alerts",
    preview: "Is there a way to set up automated alerts for low inventory levels? This would help us a lot.",
    timestamp: TWO_HOURS_AGO,
    status: "pending",
    channel: "whatsapp",
    priority: "medium",
    assignedTo: "Devin Park",
    tags: ["feature-request"],
    internalNotes: "Follow up on product roadmap, could be good feature to add",
    messages: [
      {
        id: "msg_3",
        author: "Marcus Feldman",
        authorRole: "contact",
        content: "Is there a way to set up automated alerts for low inventory levels? This would help us a lot.",
        timestamp: TWO_HOURS_AGO,
        channel: "whatsapp",
      },
    ],
  },
  {
    id: "tick_004",
    contactId: "cus_8f42a1",
    contactName: "Amara Okonkwo",
    contactAvatar: "/customers/amara-okonkwo.png",
    subject: "Following up on automation demo",
    preview: "Following up on the automation demo — is there a way to schedule restock alerts by region?",
    timestamp: DAY_AGO,
    status: "pending",
    channel: "whatsapp",
    priority: "medium",
    assignedTo: "You",
    tags: ["demo-follow-up"],
    internalNotes: "",
    messages: [
      {
        id: "msg_4",
        author: "Amara Okonkwo",
        authorRole: "contact",
        content: "Following up on the automation demo — is there a way to schedule restock alerts by region?",
        timestamp: DAY_AGO,
        channel: "whatsapp",
      },
    ],
  },
]

