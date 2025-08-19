// Communication models for real-time messaging
export interface Message {
  id?: string
  eventId: string
  senderId: string
  senderName: string
  senderRole: 'organizer' | 'participant' | 'judge'
  type: 'announcement' | 'question' | 'answer' | 'general'
  content: string
  timestamp: Date
  isSticky?: boolean // For important announcements
  parentMessageId?: string // For replies/answers
  reactions?: {
    [userId: string]: 'like' | 'helpful' | 'question'
  }
  isRead?: boolean
  attachments?: {
    name: string
    url: string
    type: 'image' | 'document' | 'link'
  }[]
}

export interface ChatChannel {
  id?: string
  eventId: string
  name: string
  type: 'announcements' | 'qa' | 'general' | 'technical'
  description: string
  isPublic: boolean
  allowedRoles: ('organizer' | 'participant' | 'judge')[]
  createdBy: string
  createdAt: Date
  lastActivity: Date
  messageCount: number
  isArchived?: boolean
}

export interface EventCommunication {
  eventId: string
  channels: ChatChannel[]
  settings: {
    allowParticipantMessages: boolean
    allowAnonymousQuestions: boolean
    moderationEnabled: boolean
    autoArchiveAfterEvent: boolean
  }
  moderators: string[] // User IDs who can moderate
}
