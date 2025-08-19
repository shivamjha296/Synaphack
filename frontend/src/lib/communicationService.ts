import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  getDocs,
  Timestamp,
  limit,
  startAfter,
  DocumentSnapshot
} from 'firebase/firestore'
import { db } from './firebase'
import { Message, ChatChannel, EventCommunication } from '../models/communication'

const MESSAGES_COLLECTION = 'messages'
const CHANNELS_COLLECTION = 'channels'
const EVENT_COMMUNICATION_COLLECTION = 'eventCommunication'

export const communicationService = {
  // Initialize communication for an event
  async initializeEventCommunication(eventId: string, organizerId: string): Promise<void> {
    try {
      // Create default channels
      const defaultChannels: Omit<ChatChannel, 'id' | 'createdAt' | 'lastActivity'>[] = [
        {
          eventId,
          name: 'Announcements',
          type: 'announcements',
          description: 'Official announcements from organizers',
          isPublic: true,
          allowedRoles: ['organizer', 'participant', 'judge'],
          createdBy: organizerId,
          messageCount: 0
        },
        {
          eventId,
          name: 'Q&A',
          type: 'qa',
          description: 'Ask questions and get answers',
          isPublic: true,
          allowedRoles: ['organizer', 'participant', 'judge'],
          createdBy: organizerId,
          messageCount: 0
        },
        {
          eventId,
          name: 'General Discussion',
          type: 'general',
          description: 'General discussions and networking',
          isPublic: true,
          allowedRoles: ['organizer', 'participant', 'judge'],
          createdBy: organizerId,
          messageCount: 0
        },
        {
          eventId,
          name: 'Technical Support',
          type: 'technical',
          description: 'Technical issues and support',
          isPublic: true,
          allowedRoles: ['organizer', 'participant', 'judge'],
          createdBy: organizerId,
          messageCount: 0
        }
      ]

      // Create channels
      const channelPromises = defaultChannels.map(channel =>
        addDoc(collection(db, CHANNELS_COLLECTION), {
          ...channel,
          createdAt: Timestamp.now(),
          lastActivity: Timestamp.now()
        })
      )

      await Promise.all(channelPromises)

      // Create event communication settings
      const eventComm: Omit<EventCommunication, 'channels'> = {
        eventId,
        settings: {
          allowParticipantMessages: true,
          allowAnonymousQuestions: true,
          moderationEnabled: false,
          autoArchiveAfterEvent: true
        },
        moderators: [organizerId]
      }

      await addDoc(collection(db, EVENT_COMMUNICATION_COLLECTION), eventComm)
      
      console.log('Event communication initialized successfully')
    } catch (error) {
      console.error('Error initializing event communication:', error)
      throw error
    }
  },

  // Get channels for an event
  async getEventChannels(eventId: string): Promise<ChatChannel[]> {
    try {
      const q = query(
        collection(db, CHANNELS_COLLECTION),
        where('eventId', '==', eventId)
      )
      const snapshot = await getDocs(q)
      
      const channels = snapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          lastActivity: data.lastActivity?.toDate()
        } as ChatChannel
      })
      
      // Filter out archived channels on client side
      return channels.filter(channel => !channel.isArchived)
    } catch (error) {
      console.error('Error getting event channels:', error)
      throw error
    }
  },

  // Send a message
  async sendMessage(message: Omit<Message, 'id' | 'timestamp'>): Promise<string> {
    try {
      const messageData = {
        ...message,
        timestamp: Timestamp.now(),
        reactions: {},
        isRead: false
      }

      const docRef = await addDoc(collection(db, MESSAGES_COLLECTION), messageData)
      
      // Update channel's last activity and message count
      await this.updateChannelActivity(message.eventId)
      
      console.log('Message sent successfully:', docRef.id)
      return docRef.id
    } catch (error) {
      console.error('Error sending message:', error)
      throw error
    }
  },

  // Get messages for a channel with real-time updates
  subscribeToChannelMessages(
    eventId: string, 
    channelType: string,
    callback: (messages: Message[]) => void,
    limitCount: number = 50
  ) {
    const messageType = channelType === 'announcements' ? 'announcement' : 
                       channelType === 'qa' ? 'question' : 'general'
    
    const q = query(
      collection(db, MESSAGES_COLLECTION),
      where('eventId', '==', eventId),
      where('type', '==', messageType),
      limit(limitCount)
    )

    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      })) as Message[]

      // Sort by timestamp ascending for display (client-side sorting)
      messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      callback(messages)
    })
  },

  // Get all messages for an event (for moderators)
  subscribeToEventMessages(
    eventId: string,
    callback: (messages: Message[]) => void
  ) {
    const q = query(
      collection(db, MESSAGES_COLLECTION),
      where('eventId', '==', eventId),
      limit(100)
    )

    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      })) as Message[]

      // Sort by timestamp ascending for display (client-side sorting)
      messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      callback(messages)
    })
  },

  // Send announcement (organizers only)
  async sendAnnouncement(
    eventId: string, 
    senderId: string, 
    senderName: string, 
    content: string,
    isSticky: boolean = false
  ): Promise<string> {
    return this.sendMessage({
      eventId,
      senderId,
      senderName,
      senderRole: 'organizer',
      type: 'announcement',
      content,
      isSticky
    })
  },

  // Ask a question
  async askQuestion(
    eventId: string, 
    senderId: string, 
    senderName: string, 
    senderRole: 'participant' | 'judge',
    content: string
  ): Promise<string> {
    return this.sendMessage({
      eventId,
      senderId,
      senderName,
      senderRole,
      type: 'question',
      content
    })
  },

  // Answer a question
  async answerQuestion(
    eventId: string, 
    senderId: string, 
    senderName: string, 
    senderRole: 'organizer' | 'judge',
    content: string,
    parentMessageId: string
  ): Promise<string> {
    return this.sendMessage({
      eventId,
      senderId,
      senderName,
      senderRole,
      type: 'answer',
      content,
      parentMessageId
    })
  },

  // Add reaction to message
  async addReaction(
    messageId: string, 
    userId: string, 
    reaction: 'like' | 'helpful' | 'question'
  ): Promise<void> {
    try {
      const messageRef = doc(db, MESSAGES_COLLECTION, messageId)
      await updateDoc(messageRef, {
        [`reactions.${userId}`]: reaction
      })
    } catch (error) {
      console.error('Error adding reaction:', error)
      throw error
    }
  },

  // Remove reaction from message
  async removeReaction(messageId: string, userId: string): Promise<void> {
    try {
      const messageRef = doc(db, MESSAGES_COLLECTION, messageId)
      await updateDoc(messageRef, {
        [`reactions.${userId}`]: null
      })
    } catch (error) {
      console.error('Error removing reaction:', error)
      throw error
    }
  },

  // Update channel activity
  async updateChannelActivity(eventId: string): Promise<void> {
    try {
      const q = query(
        collection(db, CHANNELS_COLLECTION),
        where('eventId', '==', eventId)
      )
      const snapshot = await getDocs(q)
      
      const updatePromises = snapshot.docs.map(doc =>
        updateDoc(doc.ref, {
          lastActivity: Timestamp.now()
        })
      )
      
      await Promise.all(updatePromises)
    } catch (error) {
      console.error('Error updating channel activity:', error)
    }
  },

  // Get event communication settings
  async getEventCommunicationSettings(eventId: string): Promise<EventCommunication | null> {
    try {
      const q = query(
        collection(db, EVENT_COMMUNICATION_COLLECTION),
        where('eventId', '==', eventId)
      )
      const snapshot = await getDocs(q)
      
      if (snapshot.empty) return null
      
      const doc = snapshot.docs[0]
      const data = doc.data()
      return {
        eventId: data.eventId,
        settings: data.settings,
        moderators: data.moderators,
        channels: [] // Will be populated separately
      } as EventCommunication
    } catch (error) {
      console.error('Error getting communication settings:', error)
      throw error
    }
  },

  // Delete message (moderators only)
  async deleteMessage(messageId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, MESSAGES_COLLECTION, messageId))
      console.log('Message deleted successfully')
    } catch (error) {
      console.error('Error deleting message:', error)
      throw error
    }
  },

  // Archive channel
  async archiveChannel(channelId: string): Promise<void> {
    try {
      const channelRef = doc(db, CHANNELS_COLLECTION, channelId)
      await updateDoc(channelRef, {
        isArchived: true
      })
    } catch (error) {
      console.error('Error archiving channel:', error)
      throw error
    }
  }
}
