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
  Timestamp,
  getDoc
} from 'firebase/firestore'
import { db, auth } from './firebase'

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
  rounds?: {
    id: string
    name: string
    description: string
    startDate: Date
    endDate: Date
    submissionDeadline: Date
    requirements: string
    maxParticipants?: number
    eliminationCriteria?: string
  }[]
}

export interface UserProfile {
  id?: string
  email: string
  name: string
  role?: 'participant' | 'organizer' | 'judge'
  phone?: string
  college?: string
  course?: string
  year?: string
  skills: string[]
  experience?: string
  github?: string
  linkedin?: string
  portfolio?: string
  bio?: string
  createdAt: Date
  updatedAt: Date
}

export interface EventRegistration {
  id?: string
  eventId: string
  participantId: string
  participantEmail: string
  participantName: string
  participantPhone?: string
  participantCollege?: string
  participantCourse?: string
  participantYear?: string
  participantSkills?: string[]
  participantExperience?: string
  participantGithub?: string
  participantLinkedin?: string
  participantPortfolio?: string
  participantBio?: string
  teamName?: string
  teamMembers?: {
    name: string
    email: string
    role: string
  }[]
  teamInviteCode?: string // Code for inviting team members
  joinedViaInvite?: boolean // Flag to indicate if user joined via invite
  teamCreator?: string // Email of the team creator
  additionalInfo?: {
    [key: string]: any
  }
  registrationDate: Date
  status: 'pending' | 'approved' | 'rejected'
  paymentStatus: 'pending' | 'paid' | 'failed'
}

const EVENTS_COLLECTION = 'events'
const REGISTRATIONS_COLLECTION = 'registrations'
const PROFILES_COLLECTION = 'profiles'

// Utility function to remove undefined values from objects
const cleanObjectForFirestore = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return null
  }
  
  if (Array.isArray(obj)) {
    return obj.map(cleanObjectForFirestore).filter(item => item !== null && item !== undefined)
  }
  
  if (typeof obj === 'object' && obj.constructor === Object) {
    const cleaned: any = {}
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined && value !== null && value !== '') {
        cleaned[key] = cleanObjectForFirestore(value)
      }
    }
    return cleaned
  }
  
  return obj
}

export const eventService = {
  // Create a new event
  async createEvent(eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
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
        // Process rounds and convert dates to Timestamps
        rounds: eventData.rounds?.map(round => ({
          ...round,
          startDate: validateDate(round.startDate, `round ${round.name} startDate`),
          endDate: validateDate(round.endDate, `round ${round.name} endDate`),
          submissionDeadline: validateDate(round.submissionDeadline, `round ${round.name} submissionDeadline`)
        })) || [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      }
      
      // Clean the data to remove undefined values
      const cleanedData = cleanObjectForFirestore(firestoreData)
      
      console.log('Cleaned Firestore data to be saved:', cleanedData)
      
      const docRef = await addDoc(collection(db, EVENTS_COLLECTION), cleanedData)
      
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
      
      // First try to get events with organizerId
      const q = query(
        collection(db, EVENTS_COLLECTION), 
        where('organizerId', '==', organizerId)
      )
      const querySnapshot = await getDocs(q)
      console.log('Found events with organizerId:', querySnapshot.size)
      
      // If no events found with organizerId, try with organizerName for backward compatibility
      let results = querySnapshot.docs
      if (results.length === 0) {
        console.log('No events found with organizerId, trying with organizerName')
        const qByName = query(
          collection(db, EVENTS_COLLECTION)
        )
        const allEventsSnapshot = await getDocs(qByName)
        console.log('Total events in database:', allEventsSnapshot.size)
        
        // For debugging, let's see all events
        allEventsSnapshot.docs.forEach(doc => {
          const data = doc.data()
          console.log('Event:', data.title, 'organizerId:', data.organizerId, 'organizerName:', data.organizerName)
        })
      }
      
      const events = results.map(doc => {
        const data = doc.data()
        console.log('Event data:', data.title, 'organizerId:', data.organizerId)
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
      
      // Sort by createdAt descending (newest first)
      return events.sort((a, b) => {
        const dateA = a.createdAt || new Date(0)
        const dateB = b.createdAt || new Date(0)
        return dateB.getTime() - dateA.getTime()
      })
    } catch (error) {
      console.error('Error getting events by organizer:', error)
      throw error
    }
  },

  // Get published and ongoing events (for participants)
  async getPublishedEvents(): Promise<Event[]> {
    try {
      console.log('Getting published events...')
      // First try to get events with published/ongoing status
      const qWithStatus = query(
        collection(db, EVENTS_COLLECTION), 
        where('status', 'in', ['published', 'ongoing'])
      )
      const withStatusSnap = await getDocs(qWithStatus)
      console.log('Found events with status:', withStatusSnap.size)
      
      // Also get events without status field (backward compatibility)
      const allEventsQuery = query(collection(db, EVENTS_COLLECTION))
      const allEventsSnap = await getDocs(allEventsQuery)
      console.log('Total events in database:', allEventsSnap.size)
      
      const eventsWithStatus = withStatusSnap.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data
        }
      })
      
      const eventsWithoutStatus = allEventsSnap.docs
        .filter(doc => !doc.data().status) // Only events without status field
        .map(doc => {
          const data = doc.data()
          return {
            id: doc.id,
            ...data,
            status: 'published' // Default to published for backward compatibility
          }
        })
      
      const allPublishedEvents = [...eventsWithStatus, ...eventsWithoutStatus]
      console.log('Combined published events:', allPublishedEvents.length)
      
      return allPublishedEvents.map(eventData => {
        console.log('Published event data:', (eventData as any).title, 'status:', (eventData as any).status)
        return {
          ...eventData,
          createdAt: (eventData as any).createdAt?.toDate(),
          updatedAt: (eventData as any).updatedAt?.toDate(),
          timeline: {
            ...(eventData as any).timeline,
            registrationStart: (eventData as any).timeline?.registrationStart?.toDate(),
            registrationEnd: (eventData as any).timeline?.registrationEnd?.toDate(),
            eventStart: (eventData as any).timeline?.eventStart?.toDate(),
            eventEnd: (eventData as any).timeline?.eventEnd?.toDate(),
            submissionDeadline: (eventData as any).timeline?.submissionDeadline?.toDate(),
          }
        }
      }) as Event[]
    } catch (error) {
      console.error('Error getting published events:', error)
      throw error
    }
  },

  // Update an event
  async updateEvent(eventId: string, updates: Partial<Event>): Promise<void> {
    try {
      const eventRef = doc(db, EVENTS_COLLECTION, eventId)
      
      // Process the updates to handle dates and clean undefined values
      const processedUpdates: any = { ...updates }
      
      // Convert timeline dates if present
      if (processedUpdates.timeline) {
        const validateDate = (date: Date, fieldName: string) => {
          if (!date || isNaN(date.getTime())) {
            throw new Error(`Invalid date for ${fieldName}`)
          }
          return Timestamp.fromDate(date)
        }
        
        processedUpdates.timeline = {
          registrationStart: validateDate(processedUpdates.timeline.registrationStart, 'registrationStart'),
          registrationEnd: validateDate(processedUpdates.timeline.registrationEnd, 'registrationEnd'),
          eventStart: validateDate(processedUpdates.timeline.eventStart, 'eventStart'),
          eventEnd: validateDate(processedUpdates.timeline.eventEnd, 'eventEnd'),
          submissionDeadline: validateDate(processedUpdates.timeline.submissionDeadline, 'submissionDeadline')
        }
      }
      
      // Convert rounds dates if present
      if (processedUpdates.rounds) {
        const validateDate = (date: Date, fieldName: string) => {
          if (!date || isNaN(date.getTime())) {
            throw new Error(`Invalid date for ${fieldName}`)
          }
          return Timestamp.fromDate(date)
        }
        
        processedUpdates.rounds = processedUpdates.rounds.map((round: any) => ({
          ...round,
          startDate: validateDate(round.startDate, `round ${round.name} startDate`),
          endDate: validateDate(round.endDate, `round ${round.name} endDate`),
          submissionDeadline: validateDate(round.submissionDeadline, `round ${round.name} submissionDeadline`)
        }))
      }
      
      // Clean the data and add update timestamp
      const cleanedUpdates = cleanObjectForFirestore({
        ...processedUpdates,
        updatedAt: Timestamp.now(),
      })
      
      await updateDoc(eventRef, cleanedUpdates)
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
  },

  // Profile Management Functions
  async createOrUpdateProfile(profileData: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      console.log('Saving/updating profile data:', profileData)
      
      // Check if profile exists
      const existingProfile = await this.getProfileByEmail(profileData.email)
      
      if (existingProfile) {
        console.log('Updating existing profile:', existingProfile.id)
        // Update existing profile
        const profileRef = doc(db, PROFILES_COLLECTION, existingProfile.id!)
        await updateDoc(profileRef, {
          ...profileData,
          updatedAt: Timestamp.now(),
        })
        return existingProfile.id!
      } else {
        console.log('Creating new profile')
        // Create new profile
        const firestoreData = {
          ...profileData,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        }
        
        const docRef = await addDoc(collection(db, PROFILES_COLLECTION), firestoreData)
        console.log('Profile created with ID:', docRef.id)
        return docRef.id
      }
    } catch (error) {
      console.error('Error creating/updating profile:', error)
      throw error
    }
  },

  // Alias for saveProfile
  async saveProfile(profileData: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    return this.createOrUpdateProfile(profileData)
  },

  async getProfileByEmail(email: string): Promise<UserProfile | null> {
    try {
      const q = query(collection(db, PROFILES_COLLECTION), where('email', '==', email))
      const querySnapshot = await getDocs(q)
      
      if (querySnapshot.empty) {
        return null
      }
      
      const doc = querySnapshot.docs[0]
      return {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      } as UserProfile
    } catch (error) {
      console.error('Error getting profile:', error)
      throw error
    }
  },

  // Registration Functions
  async registerForEvent(registrationData: Omit<EventRegistration, 'id' | 'registrationDate'>): Promise<string> {
    try {
      console.log('Storing registration data:', registrationData)
      
      // Check if user is already registered
      const existingRegistration = await this.getRegistration(registrationData.eventId, registrationData.participantEmail)
      if (existingRegistration) {
        throw new Error('Already registered for this event')
      }

      // Clean the data before storing in Firestore
      // Remove undefined values to prevent Firestore errors
      const cleanedData = cleanObjectForFirestore(registrationData)
      
      // Create registration
      const firestoreData = {
        ...cleanedData,
        registrationDate: Timestamp.now(),
      }
      
      console.log('Final Firestore data being stored:', firestoreData)
      
      const docRef = await addDoc(collection(db, REGISTRATIONS_COLLECTION), firestoreData)
      
      console.log('Registration stored with ID:', docRef.id)
      
      // Update event participant count
      const eventRef = doc(db, EVENTS_COLLECTION, registrationData.eventId)
      const eventDoc = await getDoc(eventRef)
      
      if (eventDoc.exists()) {
        const currentCount = eventDoc.data().currentParticipants || 0
        await updateDoc(eventRef, {
          currentParticipants: currentCount + 1,
          updatedAt: Timestamp.now(),
        })
      }
      
      return docRef.id
    } catch (error) {
      console.error('Error registering for event:', error)
      throw error
    }
  },

  async getRegistration(eventId: string, participantEmail: string): Promise<EventRegistration | null> {
    try {
      const q = query(
        collection(db, REGISTRATIONS_COLLECTION),
        where('eventId', '==', eventId),
        where('participantEmail', '==', participantEmail)
      )
      const querySnapshot = await getDocs(q)
      
      if (querySnapshot.empty) {
        return null
      }
      
      const doc = querySnapshot.docs[0]
      return {
        id: doc.id,
        ...doc.data(),
        registrationDate: doc.data().registrationDate?.toDate(),
      } as EventRegistration
    } catch (error) {
      console.error('Error getting registration:', error)
      throw error
    }
  },

  async getRegistrationsByParticipant(participantEmail: string): Promise<EventRegistration[]> {
    try {
      const q = query(
        collection(db, REGISTRATIONS_COLLECTION),
        where('participantEmail', '==', participantEmail),
        orderBy('registrationDate', 'desc')
      )
      const querySnapshot = await getDocs(q)
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        registrationDate: doc.data().registrationDate?.toDate(),
      })) as EventRegistration[]
    } catch (error) {
      console.error('Error getting registrations by participant:', error)
      throw error
    }
  },

  async getRegistrationsByEvent(eventId: string): Promise<EventRegistration[]> {
    try {
      const q = query(
        collection(db, REGISTRATIONS_COLLECTION),
        where('eventId', '==', eventId),
        orderBy('registrationDate', 'desc')
      )
      const querySnapshot = await getDocs(q)
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        registrationDate: doc.data().registrationDate?.toDate(),
      })) as EventRegistration[]
    } catch (error) {
      console.error('Error getting registrations by event:', error)
      throw error
    }
  },

  // Get user's registered events with registration data
  async getUserRegisteredEvents(userIdOrEmail: string): Promise<(Event & { registrationData: EventRegistration })[]> {
    try {
      console.log('🔍 Getting registered events for user:', userIdOrEmail)
      
      // Try to find registrations by participantId first, then by participantEmail
      let q = query(
        collection(db, REGISTRATIONS_COLLECTION),
        where('participantId', '==', userIdOrEmail)
      )
      let registrationsSnap = await getDocs(q)
      console.log('📋 Found by participantId:', registrationsSnap.docs.length, 'registrations')
      
      // If no results found by participantId, try by participantEmail
      if (registrationsSnap.empty) {
        console.log('🔄 Trying by participantEmail...')
        q = query(
          collection(db, REGISTRATIONS_COLLECTION),
          where('participantEmail', '==', userIdOrEmail)
        )
        registrationsSnap = await getDocs(q)
        console.log('📋 Found by participantEmail:', registrationsSnap.docs.length, 'registrations')
      }
      
      const registeredEvents = []
      
      for (const regDoc of registrationsSnap.docs) {
        const registration = { 
          id: regDoc.id, 
          ...regDoc.data(),
          registrationDate: regDoc.data().registrationDate?.toDate(),
        } as EventRegistration
        
        console.log('🎫 Processing registration:', {
          id: registration.id,
          eventId: registration.eventId,
          participantEmail: registration.participantEmail,
          participantName: registration.participantName
        })
        
        const eventDoc = await getDoc(doc(db, EVENTS_COLLECTION, registration.eventId))
        
        if (eventDoc.exists()) {
          const eventData = eventDoc.data()
          const event = { 
            id: eventDoc.id, 
            ...eventData,
            createdAt: eventData.createdAt?.toDate(),
            updatedAt: eventData.updatedAt?.toDate(),
            timeline: {
              ...eventData.timeline,
              registrationStart: eventData.timeline?.registrationStart?.toDate(),
              registrationEnd: eventData.timeline?.registrationEnd?.toDate(),
              eventStart: eventData.timeline?.eventStart?.toDate(),
              eventEnd: eventData.timeline?.eventEnd?.toDate(),
              submissionDeadline: eventData.timeline?.submissionDeadline?.toDate(),
            }
          } as Event
          
          console.log('✅ Found event:', event.title)
          
          registeredEvents.push({
            ...event,
            registrationData: registration
          })
        } else {
          console.log('❌ Event not found for eventId:', registration.eventId)
        }
      }
      
      console.log('📊 Total registered events found:', registeredEvents.length)
      
      return registeredEvents.sort((a, b) => 
        new Date(b.registrationData.registrationDate).getTime() - new Date(a.registrationData.registrationDate).getTime()
      )
    } catch (error) {
      console.error('Error getting user registered events:', error)
      throw error
    }
  },

  // Get event participants with user profiles
  async getEventParticipants(eventId: string): Promise<(EventRegistration & { userProfile?: UserProfile })[]> {
    try {
      const q = query(
        collection(db, REGISTRATIONS_COLLECTION),
        where('eventId', '==', eventId)
      )
      const registrationsSnap = await getDocs(q)
      
      const participants = []
      
      for (const regDoc of registrationsSnap.docs) {
        const registration = { 
          id: regDoc.id, 
          ...regDoc.data(),
          registrationDate: regDoc.data().registrationDate?.toDate(),
        } as EventRegistration
        
        // Try to get user profile
        try {
          const userProfileDoc = await getDoc(doc(db, PROFILES_COLLECTION, registration.participantId))
          const userProfile = userProfileDoc.exists() ? userProfileDoc.data() as UserProfile : undefined
          
          participants.push({
            ...registration,
            userProfile
          })
        } catch (error) {
          console.warn(`Could not fetch profile for user ${registration.participantId}:`, error)
          participants.push(registration)
        }
      }
      
      return participants.sort((a, b) => 
        new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime()
      )
    } catch (error) {
      console.error('Error getting event participants:', error)
      throw error
    }
  }
}

