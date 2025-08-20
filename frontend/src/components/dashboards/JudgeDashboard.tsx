'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import EventCommunication from '../EventCommunication'
import { Event } from '../../lib/eventService'
import { judgeInviteService } from '../../lib/judgeInviteService'

interface User {
  email: string
  name: string
  role: string
}

interface JudgeAssignment {
  id: string
  eventId: string
  eventName: string
  judgeEmail: string
  judgeName: string
  assignedAt: Date
  status: string
  inviteCode: string
}

const JudgeDashboard = () => {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [showCommunication, setShowCommunication] = useState<string | null>(null)
  const [assignments, setAssignments] = useState<JudgeAssignment[]>([])
  const [inviteCode, setInviteCode] = useState('')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [processingInvite, setProcessingInvite] = useState(false)

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('user')
    if (userData) {
      const parsedUser = JSON.parse(userData)
      if (parsedUser.role === 'judge') {
        setUser(parsedUser)
        loadOngoingEvents()
        loadJudgeAssignments(parsedUser.email)
      } else {
        router.push('/login')
      }
    } else {
      router.push('/login')
    }
  }, [router])

  const loadOngoingEvents = async () => {
    try {
      const { eventService } = await import('../../lib/eventService')
      const allEvents = await eventService.getPublishedEvents()
      // Filter for ongoing events where judges can participate
      const ongoingEvents = allEvents.filter(event => 
        event.status === 'ongoing' || event.status === 'published'
      )
      setEvents(ongoingEvents)
    } catch (error) {
      console.error('Error loading events:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const loadJudgeAssignments = async (judgeEmail: string) => {
    try {
      const assignmentsList = await judgeInviteService.getJudgeAssignmentsByJudge(judgeEmail)
      setAssignments(assignmentsList)
    } catch (error) {
      console.error('Error loading judge assignments:', error)
    }
  }

  const handleLogout = async () => {
    try {
      const { authService } = await import('../../lib/authService')
      await authService.signOut()
      localStorage.removeItem('user')
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
      // Fallback: just clear localStorage and redirect
      localStorage.removeItem('user')
      router.push('/')
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-950 via-fuchsia-900 to-pink-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-fuchsia-400 mx-auto"></div>
          <p className="mt-4 text-fuchsia-300 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-fuchsia-900 to-pink-950">
      {/* Navigation */}
      <nav className="bg-gradient-to-r from-slate-900/95 via-purple-900/95 to-fuchsia-900/95 backdrop-blur-sm shadow-lg border-b border-fuchsia-500/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-fuchsia-400 drop-shadow-[0_0_10px_rgb(244,114,182)]">
                HackPlatform
              </Link>
              <span className="ml-4 px-3 py-1 bg-gradient-to-r from-fuchsia-500/20 to-pink-500/20 text-fuchsia-300 text-sm rounded-full border border-fuchsia-400 drop-shadow-[0_0_8px_rgb(244,114,182)]">
                Judge
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-purple-200 font-medium">Welcome, {user.name}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-fuchsia-300 hover:text-white transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-br from-slate-900/80 to-purple-900/80 backdrop-blur-sm border border-fuchsia-500/30 rounded-xl p-6 mb-8 shadow-xl">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
            Judge Dashboard
          </h1>
          <p className="text-purple-200 font-medium">
            Review submissions, score projects, and provide valuable feedback to participants.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-slate-900/80 to-purple-900/80 backdrop-blur-sm border border-fuchsia-500/30 rounded-xl p-6 shadow-xl hover:shadow-2xl transition-all">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-fuchsia-500 to-purple-500 rounded-lg shadow-lg">
                <div className="w-6 h-6 bg-white rounded shadow-sm"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-fuchsia-300">Events to Judge</p>
                <p className="text-2xl font-bold text-white drop-shadow-md">3</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900/80 to-purple-900/80 backdrop-blur-sm border border-fuchsia-500/30 rounded-xl p-6 shadow-xl hover:shadow-2xl transition-all">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-500 rounded-lg shadow-lg">
                <div className="w-6 h-6 bg-white rounded shadow-sm"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-fuchsia-300">Projects Reviewed</p>
                <p className="text-2xl font-bold text-white drop-shadow-md">27</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900/80 to-purple-900/80 backdrop-blur-sm border border-fuchsia-500/30 rounded-xl p-6 shadow-xl hover:shadow-2xl transition-all">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-violet-500 rounded-lg shadow-lg">
                <div className="w-6 h-6 bg-white rounded shadow-sm"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-fuchsia-300">Pending Reviews</p>
                <p className="text-2xl font-bold text-white drop-shadow-md">8</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900/80 to-purple-900/80 backdrop-blur-sm border border-fuchsia-500/30 rounded-xl p-6 shadow-xl hover:shadow-2xl transition-all">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-lg shadow-lg">
                <div className="w-6 h-6 bg-white rounded shadow-sm"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-fuchsia-300">Average Score</p>
                <p className="text-2xl font-bold text-white drop-shadow-md">8.3</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-slate-900/80 to-purple-900/80 backdrop-blur-sm border border-fuchsia-500/30 rounded-xl p-6 hover:border-fuchsia-400 hover:shadow-2xl transition-all cursor-pointer group">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-fuchsia-500 to-purple-500 rounded-xl mx-auto mb-4 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <div className="w-6 h-6 bg-white rounded"></div>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Review Projects</h3>
              <p className="text-purple-200 text-sm mb-4">
                Evaluate and score submitted projects
              </p>
              <button className="w-full bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white py-2 px-4 rounded-lg hover:from-fuchsia-400 hover:to-purple-400 transition-all font-medium shadow-lg hover:shadow-xl">
                Start Reviewing
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900/80 to-purple-900/80 backdrop-blur-sm border border-fuchsia-500/30 rounded-xl p-6 hover:border-emerald-400 hover:shadow-2xl transition-all cursor-pointer group">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl mx-auto mb-4 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <div className="w-6 h-6 bg-white rounded"></div>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">My Events</h3>
              <p className="text-purple-200 text-sm mb-4">
                View events you&apos;re assigned to judge
              </p>
              <button className="w-full bg-gradient-to-r from-emerald-500 to-green-500 text-white py-2 px-4 rounded-lg hover:from-emerald-400 hover:to-green-400 transition-all font-medium shadow-lg hover:shadow-xl">
                View Events
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900/80 to-purple-900/80 backdrop-blur-sm border border-fuchsia-500/30 rounded-xl p-6 hover:border-purple-400 hover:shadow-2xl transition-all cursor-pointer group">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-500 rounded-xl mx-auto mb-4 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <div className="w-6 h-6 bg-white rounded"></div>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Scoring History</h3>
              <p className="text-purple-200 text-sm mb-4">
                Review your past evaluations and scores
              </p>
              <button className="w-full bg-gradient-to-r from-purple-500 to-violet-500 text-white py-2 px-4 rounded-lg hover:from-purple-400 hover:to-violet-400 transition-all font-medium shadow-lg hover:shadow-xl">
                View History
              </button>
            </div>
          </div>
        </div>

        {/* Events Available for Judging */}
        <div className="bg-gradient-to-br from-slate-900/80 to-purple-900/80 backdrop-blur-sm border border-fuchsia-500/30 rounded-xl p-6 mb-8 shadow-xl">
          <h2 className="text-xl font-semibold text-white mb-4 drop-shadow-lg">Events Available for Judging</h2>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fuchsia-500 mx-auto"></div>
              <p className="mt-2 text-purple-200">Loading events...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-purple-200">
                <div className="w-12 h-12 bg-gradient-to-br from-fuchsia-500 to-purple-500 rounded-lg mx-auto mb-4 flex items-center justify-center shadow-lg">
                  <div className="w-6 h-6 bg-white rounded"></div>
                </div>
                <p>No events available for judging at the moment</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {events.map((event) => (
                <div key={event.id} className="bg-gradient-to-br from-slate-900/80 to-purple-900/80 backdrop-blur-sm border border-fuchsia-500/30 rounded-xl hover:border-fuchsia-400 hover:shadow-2xl transition-all p-6 shadow-xl">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-xl text-white">{event.title}</h3>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                      event.status === 'ongoing' ? 'bg-green-900/30 text-green-400 border border-green-600' :
                      'bg-purple-900/30 text-purple-400 border border-purple-600'
                    }`}>
                      {event.status}
                    </span>
                  </div>
                  
                  <p className="text-sm text-purple-200 mb-4 line-clamp-2">{event.description}</p>
                  
                  <div className="space-y-2 mb-4 text-sm text-purple-200">
                    <div className="flex justify-between">
                      <span>Theme:</span>
                      <span className="text-white">{event.theme}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Organizer:</span>
                      <span className="text-fuchsia-400">{event.organizerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Event Date:</span>
                      <span className="text-white">{new Date(event.timeline.eventStart).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-4 border-t border-fuchsia-500/30">
                    <button 
                      onClick={() => setShowCommunication(event.id!)}
                      className="text-fuchsia-400 hover:text-fuchsia-300 text-sm font-medium transition-colors"
                    >
                      💬 Join Discussion
                    </button>
                    <button
                      className="bg-gradient-to-r from-fuchsia-500 to-purple-500 hover:from-fuchsia-400 hover:to-purple-400 text-white px-4 py-2 rounded-lg text-sm transition-all font-medium shadow-lg hover:shadow-xl"
                      onClick={() => handleViewSubmissions(event)}
                    >
                      View Submissions
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Communication Modal */}
      {showCommunication && user && (
        <EventCommunication
          eventId={showCommunication}
          userId={user.email}
          userName={user.name}
          userRole="judge"
          onClose={() => setShowCommunication(null)}
        />
      )}

      {/* Invite Code Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-slate-900 to-purple-900 border border-fuchsia-500/30 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-semibold text-white mb-4">Enter Judge Invite Code</h3>
            <p className="text-purple-200 mb-6">Please enter the invite code provided by the event organizer to access submissions.</p>
            
            {inviteError && (
              <div className="bg-red-900/30 border border-red-500 text-red-300 px-4 py-3 rounded-lg mb-4">
                {inviteError}
              </div>
            )}
            
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="Enter invite code"
              className="w-full bg-slate-800/50 border border-fuchsia-500/30 rounded-lg px-4 py-3 text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 mb-4"
            />
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 text-purple-200 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitInviteCode}
                disabled={processingInvite}
                className="bg-gradient-to-r from-fuchsia-500 to-purple-500 hover:from-fuchsia-400 hover:to-purple-400 text-white px-6 py-2 rounded-lg transition-all font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processingInvite ? (
                  <span className="flex items-center">
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                    Verifying...
                  </span>
                ) : (
                  'Submit'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  // Function to handle viewing submissions
  async function handleViewSubmissions(event: Event) {
    // Check if the judge is assigned to this event
    if (!user) return
    
    const isAssigned = assignments.some(assignment => assignment.eventId === event.id)
    
    if (isAssigned) {
      // If assigned, navigate to submissions page
      router.push(`/dashboard/judge/submissions/${event.id}`)
    } else {
      // If not assigned, show invite code modal
      setInviteCode('')
      setInviteError('')
      setShowInviteModal(true)
    }
  }

  // Function to handle invite code submission
  async function handleSubmitInviteCode() {
    if (!inviteCode.trim() || !user) return
    
    setProcessingInvite(true)
    setInviteError('')
    
    try {
      // Accept the judge invite
      const success = await judgeInviteService.acceptJudgeInvite(
        inviteCode.trim(),
        user.email,
        user.name
      )
      
      if (success) {
        // Reload judge assignments
        await loadJudgeAssignments(user.email)
        setShowInviteModal(false)
        
        // Find the event that matches this invite code
        const judgeInvite = await judgeInviteService.getJudgeInviteByCode(inviteCode.trim())
        if (judgeInvite) {
          router.push(`/dashboard/judge/submissions/${judgeInvite.eventId}`)
        }
      }
    } catch (error: any) {
      setInviteError(error.message || 'Failed to verify invite code')
    } finally {
      setProcessingInvite(false)
    }
  }
}

export default JudgeDashboard
