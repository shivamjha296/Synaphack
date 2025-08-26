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

export interface RoundSubmission {
  id?: string
  eventId: string
  roundId: string
  participantEmail: string
  participantName: string
  teamName?: string
  submissionData: {
    pptLink?: string
    githubLink?: string
    videoLink?: string
    additionalLinks?: {
      name: string
      url: string
    }[]
    description?: string
    tags?: string[]
    gitmcpUrl?: string  // Auto-generated GitMCP analysis URL
  }
  submittedAt: Date
  updatedAt: Date
  status: 'submitted' | 'late' | 'reviewed' | 'approved' | 'rejected'
  feedback?: string
  score?: number
  isTeamSubmission: boolean
  teamMembers?: {
    name: string
    email: string
    role: string
  }[]
}

export interface SubmissionStats {
  totalSubmissions: number
  onTimeSubmissions: number
  lateSubmissions: number
  averageScore?: number
  submissionsByRound: {
    [roundId: string]: number
  }
}

const SUBMISSIONS_COLLECTION = 'submissions'

// Utility function to clean undefined values
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

export const submissionService = {
  // Check if user can submit for a team (only team leaders can submit)
  async canUserSubmitForTeam(eventId: string, userEmail: string): Promise<{canSubmit: boolean, reason?: string}> {
    try {
      console.log('Checking submission permission for:', { eventId, userEmail })
      
      // Query registrations directly to avoid circular dependency
      const registrationsQuery = query(
        collection(db, 'registrations'),
        where('eventId', '==', eventId),
        where('participantEmail', '==', userEmail)
      )
      
      const registrationsSnapshot = await getDocs(registrationsQuery)
      console.log('Found registrations:', registrationsSnapshot.size)
      
      if (registrationsSnapshot.empty) {
        console.log('User not registered for event')
        return { canSubmit: false, reason: 'User not registered for this event' }
      }
      
      const userRegistration = registrationsSnapshot.docs[0].data()
      console.log('User registration data:', userRegistration)
      
      // If user is not in a team, they can submit
      if (!userRegistration.teamName) {
        console.log('User not in team, can submit')
        return { canSubmit: true }
      }
      
      // If user is in a team, check if they are the team leader
      const isTeamLeader = userRegistration.teamCreator === userEmail
      console.log('Team check:', { teamName: userRegistration.teamName, teamCreator: userRegistration.teamCreator, isTeamLeader })
      
      if (isTeamLeader) {
        return { canSubmit: true }
      }
      
      return { canSubmit: false, reason: 'Only team leader can submit for the team' }
    } catch (error) {
      console.error('Error checking submission permission:', error)
      return { canSubmit: false, reason: 'Error checking permissions' }
    }
  },

  // Submit or update a round submission
  async submitForRound(submissionData: Omit<RoundSubmission, 'id' | 'submittedAt' | 'updatedAt'>): Promise<string> {
    try {
      console.log('Submitting for round:', submissionData)
      
      // Check if submission already exists
      const existingSubmission = await this.getSubmission(
        submissionData.eventId, 
        submissionData.roundId, 
        submissionData.participantEmail
      )
      
      if (existingSubmission) {
        // Update existing submission
        await this.updateSubmission(existingSubmission.id!, {
          submissionData: submissionData.submissionData,
          teamName: submissionData.teamName,
          teamMembers: submissionData.teamMembers,
          status: submissionData.status,
          updatedAt: new Date()
        })
        return existingSubmission.id!
      } else {
        // Create new submission
        const firestoreData = cleanObjectForFirestore({
          ...submissionData,
          submittedAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        })
        
        console.log('Creating new submission with data:', firestoreData)
        const docRef = await addDoc(collection(db, SUBMISSIONS_COLLECTION), firestoreData)
        console.log('Submission created with ID:', docRef.id)
        return docRef.id
      }
    } catch (error) {
      console.error('Error submitting for round:', error)
      throw error
    }
  },

  // Get a specific submission
  async getSubmission(eventId: string, roundId: string, participantEmail: string): Promise<RoundSubmission | null> {
    try {
      const q = query(
        collection(db, SUBMISSIONS_COLLECTION),
        where('eventId', '==', eventId),
        where('roundId', '==', roundId),
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
        submittedAt: doc.data().submittedAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      } as RoundSubmission
    } catch (error) {
      console.error('Error getting submission:', error)
      throw error
    }
  },

  // Update an existing submission
  async updateSubmission(submissionId: string, updates: Partial<RoundSubmission>): Promise<void> {
    try {
      const submissionRef = doc(db, SUBMISSIONS_COLLECTION, submissionId)
      const cleanedUpdates = cleanObjectForFirestore({
        ...updates,
        updatedAt: Timestamp.now()
      })
      
      await updateDoc(submissionRef, cleanedUpdates)

      // Auto-generate certificate if submission is approved
      if (updates.status === 'approved') {
        try {
          // Get the full submission data
          const submissionDoc = await getDoc(submissionRef)
          if (submissionDoc.exists()) {
            const submission = submissionDoc.data() as RoundSubmission
            await this.generateCertificateForApprovedSubmission(submission)
          }
        } catch (certError) {
          console.error('Error generating certificate:', certError)
          // Don't throw - submission update should still succeed
        }
      }
    } catch (error) {
      console.error('Error updating submission:', error)
      throw error
    }
  },

  // Auto-generate certificate for approved submission
  async generateCertificateForApprovedSubmission(submission: RoundSubmission): Promise<void> {
    try {
      // Dynamic import to avoid circular dependency
      const { certificateService } = await import('./certificateService')
      
      // Get event details
      const eventDoc = await getDoc(doc(db, 'events', submission.eventId))
      if (!eventDoc.exists()) {
        console.error('Event not found for certificate generation')
        return
      }
      
      const event = eventDoc.data()
      
      // Determine certificate type based on score/achievement
      let certificateType: 'completion' | 'achievement' | 'winner' = 'completion'
      let additionalData: any = {
        score: submission.score,
        teamName: submission.teamName
      }
      
      // If there's a high score or special recognition, upgrade to achievement
      if (submission.score && submission.score >= 80) {
        certificateType = 'achievement'
        additionalData.specialMention = 'High Achievement'
      }
      
      // Generate the certificate
      await certificateService.generateCertificate(
        submission.eventId,
        submission.participantEmail,
        submission.participantName,
        submission.participantEmail,
        event.title,
        certificateType,
        additionalData
      )
      
      console.log(`Certificate generated for ${submission.participantName} - ${event.title}`)
    } catch (error) {
      console.error('Error in auto-certificate generation:', error)
      throw error
    }
  },

  // Get all submissions for a participant in an event (including team submissions)
  async getParticipantSubmissions(eventId: string, participantEmail: string): Promise<RoundSubmission[]> {
    try {
      console.log('Getting submissions for:', { eventId, participantEmail })
      
      // First, get the user's registration to check if they're in a team
      const registrationsQuery = query(
        collection(db, 'registrations'),
        where('eventId', '==', eventId),
        where('participantEmail', '==', participantEmail)
      )
      
      const registrationsSnapshot = await getDocs(registrationsQuery)
      
      if (registrationsSnapshot.empty) {
        console.log('No registration found for user')
        return []
      }
      
      const userRegistration = registrationsSnapshot.docs[0].data()
      console.log('User registration:', userRegistration)
      
      let submissionsQuery
      
      if (userRegistration.teamName && userRegistration.teamCreator) {
        // User is in a team - get submissions made by the team leader
        console.log('User is in team, getting team leader submissions')
        submissionsQuery = query(
          collection(db, SUBMISSIONS_COLLECTION),
          where('eventId', '==', eventId),
          where('participantEmail', '==', userRegistration.teamCreator),
          where('isTeamSubmission', '==', true)
        )
      } else {
        // User is solo - get their own submissions
        console.log('User is solo, getting personal submissions')
        submissionsQuery = query(
          collection(db, SUBMISSIONS_COLLECTION),
          where('eventId', '==', eventId),
          where('participantEmail', '==', participantEmail)
        )
      }
      
      const querySnapshot = await getDocs(submissionsQuery)
      console.log('Found submissions:', querySnapshot.size)
      
      const submissions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        submittedAt: doc.data().submittedAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as RoundSubmission[]
      
      // Sort in memory instead of using orderBy
      const sortedSubmissions = submissions.sort((a, b) => {
        const dateA = a.submittedAt || new Date(0)
        const dateB = b.submittedAt || new Date(0)
        return dateB.getTime() - dateA.getTime()
      })
      
      console.log('Returning submissions:', sortedSubmissions)
      return sortedSubmissions
    } catch (error) {
      console.error('Error getting participant submissions:', error)
      throw error
    }
  },

  // Get all submissions for an event (organizer view)
  async getEventSubmissions(eventId: string): Promise<RoundSubmission[]> {
    try {
      console.log('Getting submissions for event:', eventId)
      // Simplified query without orderBy for now
      const q = query(
        collection(db, SUBMISSIONS_COLLECTION),
        where('eventId', '==', eventId)
      )
      const querySnapshot = await getDocs(q)
      
      console.log('Raw query results:', querySnapshot.size, 'documents')
      
      const submissions = querySnapshot.docs.map(doc => {
        const data = doc.data()
        console.log('Processing submission doc:', doc.id, data)
        return {
          id: doc.id,
          ...data,
          submittedAt: data.submittedAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        }
      }) as RoundSubmission[]
      
      // Sort in memory instead of using orderBy
      const sortedSubmissions = submissions.sort((a, b) => {
        const dateA = a.submittedAt || new Date(0)
        const dateB = b.submittedAt || new Date(0)
        return dateB.getTime() - dateA.getTime()
      })
      
      console.log('Final processed submissions:', sortedSubmissions)
      return sortedSubmissions
    } catch (error) {
      console.error('Error getting event submissions:', error)
      throw error
    }
  },

  // Get submissions for a specific round
  async getRoundSubmissions(eventId: string, roundId: string): Promise<RoundSubmission[]> {
    try {
      // Simplified query without orderBy for now
      const q = query(
        collection(db, SUBMISSIONS_COLLECTION),
        where('eventId', '==', eventId),
        where('roundId', '==', roundId)
      )
      const querySnapshot = await getDocs(q)
      
      const submissions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        submittedAt: doc.data().submittedAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as RoundSubmission[]
      
      // Sort in memory instead of using orderBy
      return submissions.sort((a, b) => {
        const dateA = a.submittedAt || new Date(0)
        const dateB = b.submittedAt || new Date(0)
        return dateB.getTime() - dateA.getTime()
      })
    } catch (error) {
      console.error('Error getting round submissions:', error)
      throw error
    }
  },

  // Delete a submission
  async deleteSubmission(submissionId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, SUBMISSIONS_COLLECTION, submissionId))
    } catch (error) {
      console.error('Error deleting submission:', error)
      throw error
    }
  },

  // Get submission statistics for an event
  async getSubmissionStats(eventId: string): Promise<SubmissionStats> {
    try {
      const submissions = await this.getEventSubmissions(eventId)
      
      const stats: SubmissionStats = {
        totalSubmissions: submissions.length,
        onTimeSubmissions: 0,
        lateSubmissions: 0,
        submissionsByRound: {}
      }
      
      submissions.forEach(submission => {
        // Count by status
        if (submission.status === 'late') {
          stats.lateSubmissions++
        } else {
          stats.onTimeSubmissions++
        }
        
        // Count by round
        if (!stats.submissionsByRound[submission.roundId]) {
          stats.submissionsByRound[submission.roundId] = 0
        }
        stats.submissionsByRound[submission.roundId]++
      })
      
      // Calculate average score if scores exist
      const scoredSubmissions = submissions.filter(s => s.score !== undefined)
      if (scoredSubmissions.length > 0) {
        stats.averageScore = scoredSubmissions.reduce((sum, s) => sum + (s.score || 0), 0) / scoredSubmissions.length
      }
      
      return stats
    } catch (error) {
      console.error('Error getting submission stats:', error)
      throw error
    }
  },

  // Check if submission deadline has passed
  isSubmissionLate(submissionDeadline: Date): boolean {
    return new Date() > submissionDeadline
  },

  // Validate submission data
  validateSubmission(submissionData: RoundSubmission['submissionData']): { isValid: boolean; errors: string[] } {
    const errors: string[] = []
    
    // Check if at least one link is provided
    if (!submissionData.pptLink && !submissionData.githubLink && !submissionData.videoLink) {
      errors.push('At least one submission link (PPT, GitHub, or Video) is required')
    }
    
    // Validate URL formats
    const urlRegex = /^https?:\/\/.+/
    
    if (submissionData.pptLink && !urlRegex.test(submissionData.pptLink)) {
      errors.push('PPT link must be a valid URL starting with http:// or https://')
    }
    
    if (submissionData.githubLink && !urlRegex.test(submissionData.githubLink)) {
      errors.push('GitHub link must be a valid URL starting with http:// or https://')
    }
    
    if (submissionData.videoLink && !urlRegex.test(submissionData.videoLink)) {
      errors.push('Video link must be a valid URL starting with http:// or https://')
    }
    
    // Validate additional links
    if (submissionData.additionalLinks) {
      submissionData.additionalLinks.forEach((link, index) => {
        if (!link.name || !link.url) {
          errors.push(`Additional link ${index + 1} must have both name and URL`)
        } else if (!urlRegex.test(link.url)) {
          errors.push(`Additional link "${link.name}" must be a valid URL`)
        }
      })
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  },

  // ===== GitMCP Integration Functions =====

  /**
   * Generate GitMCP URL from GitHub URL
   */
  generateGitMCPUrl(githubUrl: string): string {
    try {
      console.log('� Generating GitMCP URL for:', githubUrl)
      
      // Import GitMCP service
      const { gitMCPService } = require('./gitMCPService')
      
      // Generate GitMCP URL
      const gitmcpUrl = gitMCPService.getGitMCPUrl(githubUrl)
      console.log('✅ GitMCP URL generated:', gitmcpUrl)
      
      return gitmcpUrl
    } catch (error) {
      console.error('❌ GitMCP URL generation failed:', error)
      return ''
    }
  },

  /**
   * Submit for a round with automatic GitMCP URL generation
   */
  async submitForRoundWithGitMCP(
    eventId: string, 
    roundId: string, 
    submissionData: any, 
    userEmail: string,
    userName: string,
    isTeamSubmission: boolean = false,
    teamData?: any
  ) {
    try {
      console.log('📤 Submitting with GitMCP URL generation...')
      
      // Generate GitMCP URL if GitHub link exists
      let enhancedSubmissionData = { ...submissionData }
      if (submissionData.githubLink) {
        const gitmcpUrl = submissionService.generateGitMCPUrl(submissionData.githubLink)
        if (gitmcpUrl) {
          enhancedSubmissionData.gitmcpUrl = gitmcpUrl
          console.log('✅ GitMCP URL added to submission:', gitmcpUrl)
        }
      }
      
      // Submit with enhanced data
      const submissionId = await submissionService.submitForRound({
        eventId,
        roundId,
        participantEmail: userEmail,
        participantName: userName,
        submissionData: enhancedSubmissionData,
        status: 'submitted' as const,
        isTeamSubmission,
        teamName: teamData?.teamName,
        teamMembers: teamData?.teamMembers
      })
      
      console.log('✅ Submission completed successfully')
      return submissionId
    } catch (error) {
      console.error('❌ Submission with GitMCP URL failed:', error)
      throw error
    }
  },

  /**
   * Get event submissions (unchanged, no analysis needed)
   */
  async getEventSubmissionsSimple(eventId: string) {
    try {
      console.log('📊 Loading submissions for event:', eventId)
      
      // Get all submissions for the event
      const submissions = await submissionService.getEventSubmissions(eventId)
      console.log(`📄 Found ${submissions.length} submissions`)
      
      return submissions
    } catch (error) {
      console.error('❌ Error getting submissions:', error)
      throw error
    }
  }
}
