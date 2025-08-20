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
import { db } from './firebase'
import { EventRegistration } from './eventService'

export interface TeamInvite {
  id?: string
  eventId: string
  teamName: string
  inviteCode: string
  createdBy: string // email of the team creator
  createdAt: Date
  expiresAt: Date
  status: 'active' | 'expired' | 'revoked'
}

const TEAM_INVITES_COLLECTION = 'teamInvites'
const REGISTRATIONS_COLLECTION = 'registrations'

export const teamInviteService = {
  // Generate a unique invite code
  generateInviteCode(): string {
    // Generate a random string of 8 characters
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    const charactersLength = characters.length
    for (let i = 0; i < 8; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength))
    }
    return result
  },

  // Create a team invite
  async createTeamInvite(eventId: string, teamName: string, createdBy: string, expiryDays = 7): Promise<TeamInvite> {
    try {
      const inviteCode = this.generateInviteCode()
      
      // Set expiry date
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + expiryDays)
      
      const teamInvite: TeamInvite = {
        eventId,
        teamName,
        inviteCode,
        createdBy,
        createdAt: new Date(),
        expiresAt,
        status: 'active'
      }
      
      const docRef = await addDoc(collection(db, TEAM_INVITES_COLLECTION), {
        ...teamInvite,
        createdAt: Timestamp.fromDate(teamInvite.createdAt),
        expiresAt: Timestamp.fromDate(teamInvite.expiresAt)
      })
      
      return {
        ...teamInvite,
        id: docRef.id
      }
    } catch (error) {
      console.error('Error creating team invite:', error)
      throw error
    }
  },

  // Get team invite by code
  async getTeamInviteByCode(inviteCode: string): Promise<TeamInvite | null> {
    try {
      // First query by inviteCode only to avoid requiring a composite index
      const q = query(
        collection(db, TEAM_INVITES_COLLECTION),
        where('inviteCode', '==', inviteCode)
      )
      const querySnapshot = await getDocs(q)
      
      if (querySnapshot.empty) {
        return null
      }
      
      // Filter for active status in memory
      const activeInvites = querySnapshot.docs.filter(doc => doc.data().status === 'active')
      
      if (activeInvites.length === 0) {
        return null
      }
      
      const doc = activeInvites[0]
      return {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        expiresAt: doc.data().expiresAt?.toDate()
      } as TeamInvite
    } catch (error) {
      console.error('Error getting team invite:', error)
      throw error
    }
  },

  // Get team invites by creator
  async getTeamInvitesByCreator(creatorEmail: string): Promise<TeamInvite[]> {
    try {
      // Using only the where clause without orderBy to avoid requiring a composite index
      const q = query(
        collection(db, TEAM_INVITES_COLLECTION),
        where('createdBy', '==', creatorEmail)
      )
      const querySnapshot = await getDocs(q)
      
      // Sort the results in memory instead of using orderBy in the query
      const invites = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        expiresAt: doc.data().expiresAt?.toDate()
      })) as TeamInvite[]
      
      // Sort by createdAt in descending order
      return invites.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    } catch (error) {
      console.error('Error getting team invites by creator:', error)
      throw error
    }
  },

  // Join a team using an invite code
  async joinTeamWithInvite(inviteCode: string, participantEmail: string, participantName: string): Promise<boolean> {
    try {
      // Get the team invite
      const teamInvite = await this.getTeamInviteByCode(inviteCode)
      
      if (!teamInvite) {
        throw new Error('Invalid invite code')
      }
      
      if (teamInvite.status !== 'active') {
        throw new Error('Invite code is no longer active')
      }
      
      console.log('Found valid team invite:', teamInvite)
      
      // Check if invite is expired
      if (teamInvite.expiresAt < new Date()) {
        // Update invite status to expired
        await updateDoc(doc(db, TEAM_INVITES_COLLECTION, teamInvite.id!), {
          status: 'expired'
        })
        throw new Error('Invite code has expired')
      }
      
      // Check if participant is already registered for this event
      // Using a simpler query to avoid requiring a composite index
      const registrationQuery = query(
        collection(db, REGISTRATIONS_COLLECTION),
        where('participantEmail', '==', participantEmail)
      )
      const registrationSnapshot = await getDocs(registrationQuery)
      
      // Filter for the specific event ID in memory
      const eventRegistrations = registrationSnapshot.docs.filter(
        doc => doc.data().eventId === teamInvite.eventId
      )
      
      if (eventRegistrations.length > 0) {
        throw new Error('You are already registered for this event')
      }
      
      // Get the team creator's registration to copy some fields
      // Using a simpler query to avoid requiring a composite index
      const creatorQuery = query(
        collection(db, REGISTRATIONS_COLLECTION),
        where('participantEmail', '==', teamInvite.createdBy)
      )
      const creatorSnapshot = await getDocs(creatorQuery)
      
      // Filter for the specific event ID in memory
      const creatorEventRegistrations = creatorSnapshot.docs.filter(
        doc => doc.data().eventId === teamInvite.eventId
      )
      
      if (creatorEventRegistrations.length === 0) {
        throw new Error('Team creator registration not found')
      }
      
      const creatorRegistration = {
        ...creatorEventRegistrations[0].data(),
        id: creatorEventRegistrations[0].id
      } as EventRegistration
      
      // Create a new registration for the participant
      const registrationData: Partial<EventRegistration> = {
        eventId: teamInvite.eventId,
        participantEmail,
        participantName,
        teamName: teamInvite.teamName,
        teamMembers: creatorRegistration.teamMembers, // Copy team members from creator
        teamCreator: teamInvite.createdBy, // Set the team creator
        joinedViaInvite: true, // Mark that this user joined via invite
        registrationDate: new Date(),
        status: 'pending',
        paymentStatus: 'paid' // Assuming team members don't need to pay individually
      }
      
      // Add the new participant to the registration
      await addDoc(collection(db, REGISTRATIONS_COLLECTION), {
        ...registrationData,
        registrationDate: Timestamp.fromDate(registrationData.registrationDate as Date)
      })
      
      // Update the team members in the creator's registration
      const updatedTeamMembers = [
        ...(creatorRegistration.teamMembers || []),
        {
          name: participantName,
          email: participantEmail,
          role: 'Member' // Default role
        }
      ]
      
      await updateDoc(doc(db, REGISTRATIONS_COLLECTION, creatorRegistration.id!), {
        teamMembers: updatedTeamMembers
      })
      
      return true
    } catch (error) {
      console.error('Error joining team with invite:', error)
      throw error
    }
  },

  // Revoke a team invite
  async revokeTeamInvite(inviteId: string): Promise<boolean> {
    try {
      await updateDoc(doc(db, TEAM_INVITES_COLLECTION, inviteId), {
        status: 'revoked'
      })
      return true
    } catch (error) {
      console.error('Error revoking team invite:', error)
      throw error
    }
  },

  // Get the invite URL for sharing
  getInviteUrl(inviteCode: string): string {
    return `${window.location.origin}/join-team/${inviteCode}`
  }
}