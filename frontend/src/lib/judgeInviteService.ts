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

export interface JudgeInvite {
  id?: string
  eventId: string
  eventName: string
  inviteCode: string
  createdBy: string // email of the organizer
  createdAt: Date
  expiresAt: Date
  status: 'active' | 'expired' | 'revoked'
}

const JUDGE_INVITES_COLLECTION = 'judgeInvites'
const JUDGE_ASSIGNMENTS_COLLECTION = 'judgeAssignments'

export const judgeInviteService = {
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

  // Create a judge invite
  async createJudgeInvite(eventId: string, eventName: string, createdBy: string, expiryDays = 30): Promise<JudgeInvite> {
    try {
      const inviteCode = this.generateInviteCode()
      
      // Set expiry date
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + expiryDays)
      
      const judgeInvite: JudgeInvite = {
        eventId,
        eventName,
        inviteCode,
        createdBy,
        createdAt: new Date(),
        expiresAt,
        status: 'active'
      }
      
      const docRef = await addDoc(collection(db, JUDGE_INVITES_COLLECTION), {
        ...judgeInvite,
        createdAt: Timestamp.fromDate(judgeInvite.createdAt),
        expiresAt: Timestamp.fromDate(judgeInvite.expiresAt)
      })
      
      return {
        ...judgeInvite,
        id: docRef.id
      }
    } catch (error) {
      console.error('Error creating judge invite:', error)
      throw error
    }
  },

  // Get judge invite by code
  async getJudgeInviteByCode(inviteCode: string): Promise<JudgeInvite | null> {
    try {
      // First query by inviteCode only to avoid requiring a composite index
      const q = query(
        collection(db, JUDGE_INVITES_COLLECTION),
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
      } as JudgeInvite
    } catch (error) {
      console.error('Error getting judge invite:', error)
      throw error
    }
  },

  // Get judge invites by creator
  async getJudgeInvitesByCreator(creatorEmail: string): Promise<JudgeInvite[]> {
    try {
      // Using only the where clause without orderBy to avoid requiring a composite index
      const q = query(
        collection(db, JUDGE_INVITES_COLLECTION),
        where('createdBy', '==', creatorEmail)
      )
      const querySnapshot = await getDocs(q)
      
      // Sort the results in memory instead of using orderBy in the query
      const invites = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        expiresAt: doc.data().expiresAt?.toDate()
      })) as JudgeInvite[]
      
      // Sort by createdAt in descending order
      return invites.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    } catch (error) {
      console.error('Error getting judge invites by creator:', error)
      throw error
    }
  },

  // Accept a judge invite
  async acceptJudgeInvite(inviteCode: string, judgeEmail: string, judgeName: string): Promise<boolean> {
    try {
      // Get the judge invite
      const judgeInvite = await this.getJudgeInviteByCode(inviteCode)
      
      if (!judgeInvite) {
        throw new Error('Invalid invite code')
      }
      
      if (judgeInvite.status !== 'active') {
        throw new Error('Invite code is no longer active')
      }
      
      console.log('Found valid judge invite:', judgeInvite)
      
      // Check if invite is expired
      if (judgeInvite.expiresAt < new Date()) {
        // Update invite status to expired
        await updateDoc(doc(db, JUDGE_INVITES_COLLECTION, judgeInvite.id!), {
          status: 'expired'
        })
        throw new Error('Invite code has expired')
      }
      
      // Check if judge is already assigned to this event
      const assignmentQuery = query(
        collection(db, JUDGE_ASSIGNMENTS_COLLECTION),
        where('judgeEmail', '==', judgeEmail),
        where('eventId', '==', judgeInvite.eventId)
      )
      const assignmentSnapshot = await getDocs(assignmentQuery)
      
      if (!assignmentSnapshot.empty) {
        throw new Error('You are already assigned as a judge for this event')
      }
      
      // Create a new judge assignment
      const assignmentData = {
        eventId: judgeInvite.eventId,
        eventName: judgeInvite.eventName,
        judgeEmail,
        judgeName,
        assignedAt: new Date(),
        status: 'active',
        inviteCode: judgeInvite.inviteCode
      }
      
      await addDoc(collection(db, JUDGE_ASSIGNMENTS_COLLECTION), {
        ...assignmentData,
        assignedAt: Timestamp.fromDate(assignmentData.assignedAt)
      })
      
      return true
    } catch (error) {
      console.error('Error accepting judge invite:', error)
      throw error
    }
  },

  // Check if a judge is assigned to an event
  async isJudgeAssignedToEvent(judgeEmail: string, eventId: string): Promise<boolean> {
    try {
      const assignmentQuery = query(
        collection(db, JUDGE_ASSIGNMENTS_COLLECTION),
        where('judgeEmail', '==', judgeEmail),
        where('eventId', '==', eventId),
        where('status', '==', 'active')
      )
      const assignmentSnapshot = await getDocs(assignmentQuery)
      
      return !assignmentSnapshot.empty
    } catch (error) {
      console.error('Error checking judge assignment:', error)
      throw error
    }
  },

  // Get judge assignments by judge email
  async getJudgeAssignmentsByJudge(judgeEmail: string): Promise<any[]> {
    try {
      const assignmentQuery = query(
        collection(db, JUDGE_ASSIGNMENTS_COLLECTION),
        where('judgeEmail', '==', judgeEmail),
        where('status', '==', 'active')
      )
      const assignmentSnapshot = await getDocs(assignmentQuery)
      
      return assignmentSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        assignedAt: doc.data().assignedAt?.toDate()
      }))
    } catch (error) {
      console.error('Error getting judge assignments:', error)
      throw error
    }
  },

  // Revoke a judge invite
  async revokeJudgeInvite(inviteId: string): Promise<boolean> {
    try {
      await updateDoc(doc(db, JUDGE_INVITES_COLLECTION, inviteId), {
        status: 'revoked'
      })
      return true
    } catch (error) {
      console.error('Error revoking judge invite:', error)
      throw error
    }
  },

  // Get the invite URL for sharing
  getInviteUrl(inviteCode: string): string {
    return `${window.location.origin}/join-judge/${inviteCode}`
  }
}