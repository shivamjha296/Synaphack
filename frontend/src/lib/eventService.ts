import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  where,
  Timestamp 
} from 'firebase/firestore'
import { db } from './firebase'

export interface Event {
  id?: string
  title: string
  description: string
  theme: string
  tracks: string[]
  rules: string[]
  timeline: {
    registrationStart: Date
    registrationEnd: Date
    eventStart: Date
    eventEnd: Date
    submissionDeadline: Date
  }
  prizes: {
    position: string
    amount: string
    description: string
  }[]
  sponsors: {
    name: string
    logo?: string
    tier: 'platinum' | 'gold' | 'silver' | 'bronze'
    website?: string
  }[]
  eventType: 'online' | 'offline' | 'hybrid'
  location?: string
  maxParticipants: number
  currentParticipants?: number
  registrationFee: number
  organizerId: string
  organizerName: string
  status: 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled'
  createdAt: Date
  updatedAt: Date
  imageUrl?: string
  technologies: string[]
  eligibility: string[]
  contactEmail: string
  judgingCriteria: {
    criteria: string
    weight: number
  }[]
}

const EVENTS_COLLECTION = 'events'

export const eventService = {
  // Create a new event
  async createEvent(eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      console.log('Creating event with data:', eventData)
      
      // Validate required fields
      if (!eventData.title || !eventData.organizerId) {
        throw new Error('Missing required fields: title or organizerId')
      }
      
      // Validate and convert timeline dates
      const validateDate = (date: Date, fieldName: string) => {
        if (!date || isNaN(date.getTime())) {
          throw new Error(`Invalid date for ${fieldName}`)
        }
        return Timestamp.fromDate(date)
      }
      
      // Convert timeline dates to Timestamps for Firestore
      const firestoreData = {
        ...eventData,
        timeline: {
          registrationStart: validateDate(eventData.timeline.registrationStart, 'registrationStart'),
          registrationEnd: validateDate(eventData.timeline.registrationEnd, 'registrationEnd'),
          eventStart: validateDate(eventData.timeline.eventStart, 'eventStart'),
          eventEnd: validateDate(eventData.timeline.eventEnd, 'eventEnd'),
          submissionDeadline: validateDate(eventData.timeline.submissionDeadline, 'submissionDeadline')
        },
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      }
      
      console.log('Firestore data to be saved:', firestoreData)
      
      const docRef = await addDoc(collection(db, EVENTS_COLLECTION), firestoreData)
      
      console.log('Event created successfully with ID:', docRef.id)
      return docRef.id
    } catch (error) {
      console.error('Error creating event:', error)
      throw error
    }
  },

  // Get all events
  async getAllEvents(): Promise<Event[]> {
    try {
      const q = query(collection(db, EVENTS_COLLECTION), orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        timeline: {
          ...doc.data().timeline,
          registrationStart: doc.data().timeline?.registrationStart?.toDate(),
          registrationEnd: doc.data().timeline?.registrationEnd?.toDate(),
          eventStart: doc.data().timeline?.eventStart?.toDate(),
          eventEnd: doc.data().timeline?.eventEnd?.toDate(),
          submissionDeadline: doc.data().timeline?.submissionDeadline?.toDate(),
        }
      })) as Event[]
    } catch (error) {
      console.error('Error getting events:', error)
      throw error
    }
  },

  // Get events by organizer
  async getEventsByOrganizer(organizerId: string): Promise<Event[]> {
    try {
      console.log('Getting events for organizer:', organizerId)
      const q = query(
        collection(db, EVENTS_COLLECTION), 
        where('organizerId', '==', organizerId),
        orderBy('createdAt', 'desc')
      )
      const querySnapshot = await getDocs(q)
      console.log('Found events:', querySnapshot.size)
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data()
        console.log('Event data:', data)
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          timeline: {
            ...data.timeline,
            registrationStart: data.timeline?.registrationStart?.toDate(),
            registrationEnd: data.timeline?.registrationEnd?.toDate(),
            eventStart: data.timeline?.eventStart?.toDate(),
            eventEnd: data.timeline?.eventEnd?.toDate(),
            submissionDeadline: data.timeline?.submissionDeadline?.toDate(),
          }
        }
      }) as Event[]
    } catch (error) {
      console.error('Error getting events by organizer:', error)
      throw error
    }
  },

  // Get published events (for participants)
  async getPublishedEvents(): Promise<Event[]> {
    try {
      const q = query(
        collection(db, EVENTS_COLLECTION), 
        where('status', '==', 'published'),
        orderBy('createdAt', 'desc')
      )
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Event[]
    } catch (error) {
      console.error('Error getting published events:', error)
      throw error
    }
  },

  // Update an event
  async updateEvent(eventId: string, updates: Partial<Event>): Promise<void> {
    try {
      const eventRef = doc(db, EVENTS_COLLECTION, eventId)
      await updateDoc(eventRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      })
    } catch (error) {
      console.error('Error updating event:', error)
      throw error
    }
  },

  // Delete an event
  async deleteEvent(eventId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, EVENTS_COLLECTION, eventId))
    } catch (error) {
      console.error('Error deleting event:', error)
      throw error
    }
  }
}
