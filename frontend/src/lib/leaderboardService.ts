import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy,
  doc,
  getDoc
} from 'firebase/firestore'
import { db } from './firebase'
import { submissionService } from './submissionService'
import type { RoundSubmission } from './submissionService'

export interface LeaderboardEntry {
  id: string
  teamName: string
  participantName: string
  participantEmail: string
  score: number
  feedback: string
  status: string
  submissionDate: Date
  projectTitle: string
  githubUrl: string
  rank: number
  totalSubmissions: number
}

export interface EventLeaderboard {
  eventId: string
  eventTitle: string
  totalParticipants: number
  reviewedSubmissions: number
  pendingSubmissions: number
  entries: LeaderboardEntry[]
  lastUpdated: Date
}

export const leaderboardService = {
  // Get leaderboard for a specific event
  async getEventLeaderboard(eventId: string): Promise<EventLeaderboard> {
    try {
      // Get all submissions for the event
      const submissions = await submissionService.getEventSubmissions(eventId)
      
      // Get event details
      const eventDoc = await getDoc(doc(db, 'events', eventId))
      const eventData = eventDoc.data()
      const eventTitle = eventData?.title || 'Unknown Event'
      
      // Filter and process submissions
      const scoredSubmissions = submissions.filter(sub => 
        sub.score !== undefined && sub.score !== null && sub.status === 'reviewed'
      )
      
      const pendingSubmissions = submissions.filter(sub => 
        sub.status !== 'reviewed'
      )
      
      // Sort by score (highest first) and create leaderboard entries
      const sortedSubmissions = scoredSubmissions.sort((a, b) => (b.score || 0) - (a.score || 0))
      
      const entries: LeaderboardEntry[] = sortedSubmissions.map((submission, index) => ({
        id: submission.id!,
        teamName: submission.teamName || 'Individual',
        participantName: submission.participantName,
        participantEmail: submission.participantEmail,
        score: submission.score || 0,
        feedback: submission.feedback || '',
        status: submission.status,
        submissionDate: submission.submittedAt,
        projectTitle: submission.submissionData.description || 'No title provided',
        githubUrl: submission.submissionData.githubLink || '',
        rank: index + 1,
        totalSubmissions: submissions.length
      }))
      
      return {
        eventId,
        eventTitle,
        totalParticipants: submissions.length,
        reviewedSubmissions: scoredSubmissions.length,
        pendingSubmissions: pendingSubmissions.length,
        entries,
        lastUpdated: new Date()
      }
    } catch (error) {
      console.error('Error getting event leaderboard:', error)
      throw error
    }
  },

  // Get leaderboard entry for a specific participant in an event
  async getParticipantRanking(eventId: string, participantEmail: string): Promise<LeaderboardEntry | null> {
    try {
      const leaderboard = await this.getEventLeaderboard(eventId)
      return leaderboard.entries.find(entry => entry.participantEmail === participantEmail) || null
    } catch (error) {
      console.error('Error getting participant ranking:', error)
      throw error
    }
  },

  // Get top N entries from leaderboard
  getTopEntries(leaderboard: EventLeaderboard, limit: number = 10): LeaderboardEntry[] {
    return leaderboard.entries.slice(0, limit)
  },

  // Get leaderboard statistics
  getLeaderboardStats(leaderboard: EventLeaderboard) {
    const scores = leaderboard.entries.map(entry => entry.score)
    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
    const maxScore = scores.length > 0 ? Math.max(...scores) : 0
    const minScore = scores.length > 0 ? Math.min(...scores) : 0
    
    return {
      averageScore: parseFloat(avgScore.toFixed(2)),
      highestScore: maxScore,
      lowestScore: minScore,
      totalEntries: leaderboard.entries.length,
      reviewProgress: leaderboard.totalParticipants > 0 
        ? parseFloat(((leaderboard.reviewedSubmissions / leaderboard.totalParticipants) * 100).toFixed(1))
        : 0
    }
  },

  // Export leaderboard data (for organizers)
  exportLeaderboardData(leaderboard: EventLeaderboard): string {
    const headers = ['Rank', 'Team/Participant', 'Email', 'Project Title', 'Score', 'Status', 'Submission Date']
    const rows = leaderboard.entries.map(entry => [
      entry.rank,
      entry.teamName !== 'Individual' ? entry.teamName : entry.participantName,
      entry.participantEmail,
      entry.projectTitle,
      entry.score,
      entry.status,
      entry.submissionDate.toLocaleDateString()
    ])
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')
    
    return csvContent
  }
}
