'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Event } from '../../lib/eventService'
import { submissionService, RoundSubmission } from '../../lib/submissionService'
import { teamInviteService, TeamInvite } from '../../lib/teamInviteService'
import RegistrationModal from '../RegistrationModal'
import EventCommunication from '../EventCommunication'
import SubmissionForm from '../SubmissionForm'
import ParticipantCertificates from '../ParticipantCertificates'
import SubmissionDeadlineTracker from '../SubmissionDeadlineTracker'
import SubmissionStatusCard from '../SubmissionStatusCard'
import TeamInviteModal from '../TeamInviteModal'

interface User {
  email: string
  name: string
  role: string
}

const ParticipantDashboard = () => {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [registrationEvent, setRegistrationEvent] = useState<Event | null>(null)
  const [registeredEvents, setRegisteredEvents] = useState<string[]>([])
  const [registeredEventsDetails, setRegisteredEventsDetails] = useState<(Event & { registrationData: any })[]>([])
  const [registeredEventsLoading, setRegisteredEventsLoading] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [showCommunication, setShowCommunication] = useState<string | null>(null)
  const [showCertificates, setShowCertificates] = useState(false)
  const [teamInvites, setTeamInvites] = useState<TeamInvite[]>([])
  const [showTeamInviteModal, setShowTeamInviteModal] = useState<{eventId: string, teamName: string} | null>(null)
  
  // Submission-related state
  const [submissionForm, setSubmissionForm] = useState<{event: Event, round: any} | null>(null)
  const [userSubmissions, setUserSubmissions] = useState<{ [eventId: string]: RoundSubmission[] }>({})
  const [submissionsLoading, setSubmissionsLoading] = useState<string | null>(null)

  useEffect(() => {
    // Check if user is logged in and ensure Firebase auth state
    const userData = localStorage.getItem('user')
    console.log('ParticipantDashboard: Raw user data from localStorage:', userData)
    if (userData) {
      const parsedUser = JSON.parse(userData)
      console.log('ParticipantDashboard: Parsed user:', parsedUser)
      if (parsedUser.role === 'participant') {
        setUser(parsedUser)
        console.log('ParticipantDashboard: Loading data for participant email:', parsedUser.email)
        loadAvailableEvents()
        loadUserRegistrations(parsedUser.email)
        loadRegisteredEventsDetails(parsedUser.email)
      } else {
        router.push('/login')
      }
    } else {
      router.push('/login')
    }
  }, [router, refreshTrigger])

  // Load submissions for registered events
  useEffect(() => {
    if (registeredEventsDetails.length > 0) {
      registeredEventsDetails.forEach(event => {
        loadUserSubmissions(event.id!)
      })
    }
  }, [registeredEventsDetails, user])
  
  // Load team invites
  useEffect(() => {
    const loadTeamInvites = async () => {
      if (user?.email) {
        try {
          const invites = await teamInviteService.getTeamInvitesByCreator(user.email)
          setTeamInvites(invites)
        } catch (error) {
          console.error('Error loading team invites:', error)
        }
      }
    }
    
    loadTeamInvites()
  }, [user, refreshTrigger])

  const loadUserRegistrations = async (email: string) => {
    try {
      console.log('Loading user registrations for email:', email)
      
      // Use direct Firebase query like the organizer's dashboard
      const { collection, query, where, getDocs } = await import('firebase/firestore')
      const { db } = await import('../../lib/firebase')
      
      const q = query(
        collection(db, 'registrations'),
        where('participantEmail', '==', email)
      )
      const registrationsSnap = await getDocs(q)
      
      const eventIds = registrationsSnap.docs.map(doc => doc.data().eventId)
      console.log('Found registrations for events:', eventIds)
      
      setRegisteredEvents(eventIds)
    } catch (error) {
      console.error('Error loading user registrations:', error)
    }
  }

  const loadRegisteredEventsDetails = async (email: string) => {
    setRegisteredEventsLoading(true)
    try {
      console.log('Loading registered events for email:', email)
      const { eventService } = await import('../../lib/eventService')
      
      // Use the same logic as organizer's getEventParticipants but query by participant
      const { collection, query, where, getDocs, getDoc, doc } = await import('firebase/firestore')
      const { db } = await import('../../lib/firebase')
      
      // Query registrations by participant email
      const q = query(
        collection(db, 'registrations'),
        where('participantEmail', '==', email)
      )
      const registrationsSnap = await getDocs(q)
      
      console.log('Found registrations:', registrationsSnap.docs.length)
      
      const registeredEventsData = []
      
      for (const regDoc of registrationsSnap.docs) {
        const registrationData = regDoc.data()
        const registration = { 
          id: regDoc.id, 
          ...registrationData,
          registrationDate: registrationData.registrationDate?.toDate(),
        }
        
        console.log('Processing registration:', registration.id, 'for event:', registrationData.eventId)
        
        // Get the event details
        const eventDoc = await getDoc(doc(db, 'events', registrationData.eventId))
        
        if (eventDoc.exists()) {
          const eventData = eventDoc.data()
          // Convert rounds date fields for this event
          let rounds = eventData.rounds || [];
          rounds = rounds.map((round: any) => ({
            ...round,
            startDate: round.startDate && typeof round.startDate.toDate === 'function' ? round.startDate.toDate() : (round.startDate ? new Date(round.startDate) : undefined),
            endDate: round.endDate && typeof round.endDate.toDate === 'function' ? round.endDate.toDate() : (round.endDate ? new Date(round.endDate) : undefined),
            submissionDeadline: round.submissionDeadline && typeof round.submissionDeadline.toDate === 'function' ? round.submissionDeadline.toDate() : (round.submissionDeadline ? new Date(round.submissionDeadline) : undefined)
          }));
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
            },
            rounds
          } as any
          
          console.log('Found event:', eventData.title)
          
          registeredEventsData.push({
            ...event,
            registrationData: registration
          })
        } else {
          console.log('Event not found for eventId:', registrationData.eventId)
        }
      }
      
      console.log('Final registered events:', registeredEventsData.length)
      setRegisteredEventsDetails(registeredEventsData)
    } catch (error) {
      console.error('Error loading registered events details:', error)
    } finally {
      setRegisteredEventsLoading(false)
    }
  }

  const maintainFirebaseAuth = async (user: any) => {
    try {
      const { onAuthStateChanged } = await import('firebase/auth')
      const { auth } = await import('../../lib/firebase')
      
      // Check if user is already authenticated
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (!firebaseUser) {
          // User not authenticated with Firebase, redirect to login
          console.warn('User not authenticated with Firebase, redirecting to login')
          localStorage.removeItem('user')
          router.push('/login')
        }
      })
      
      return unsubscribe
    } catch (error) {
      console.error('Error checking Firebase auth:', error)
    }
  }

  const loadAvailableEvents = async () => {
    console.log('ParticipantDashboard: Loading available events...')
    try {
      const { eventService } = await import('../../lib/eventService')
      // Show only published events for participants (not drafts)
      const publishedEvents = await eventService.getPublishedEvents()
      console.log('ParticipantDashboard: Loaded events:', publishedEvents.length)
      setEvents(publishedEvents)
    } catch (error) {
      console.error('Error loading events:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUserSubmissions = async (eventId: string) => {
    if (!user) return
    
    setSubmissionsLoading(eventId)
    try {
      const submissions = await submissionService.getParticipantSubmissions(eventId, user.email)
      setUserSubmissions(prev => ({
        ...prev,
        [eventId]: submissions
      }))
    } catch (error) {
      console.error('Error loading user submissions:', error)
    } finally {
      setSubmissionsLoading(null)
    }
  }

  const handleSubmissionComplete = (eventId: string) => {
    // Reload submissions for this event
    loadUserSubmissions(eventId)
    setSubmissionForm(null)
  }

  const openSubmissionForm = (event: Event, round: any) => {
    setSubmissionForm({ event, round })
  }

  const getSubmissionForRound = (eventId: string, roundId: string): RoundSubmission | undefined => {
    const eventSubmissions = userSubmissions[eventId] || []
    return eventSubmissions.find(s => s.roundId === roundId)
  }

  const isSubmissionDeadlinePassed = (deadline: Date): boolean => {
    return new Date() > deadline
  }

  const getSubmissionStatus = (eventId: string, roundId: string) => {
    const submission = getSubmissionForRound(eventId, roundId)
    if (!submission) return 'not_submitted'
    return submission.status
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

  const handleRegistrationComplete = () => {
    setRefreshTrigger(prev => prev + 1)
    alert('Registration successful! You will receive a confirmation email shortly.')
  }
  
  const handleCreateTeamInvite = (eventId: string, teamName: string) => {
    setShowTeamInviteModal({ eventId, teamName })
  }
  
  const handleInviteCreated = (invite: TeamInvite) => {
    setTeamInvites(prev => [invite, ...prev])
  }
  
  const handleRevokeInvite = async (inviteId: string) => {
    try {
      await teamInviteService.revokeTeamInvite(inviteId)
      setTeamInvites(prev => prev.filter(invite => invite.id !== inviteId))
    } catch (error) {
      console.error('Error revoking invite:', error)
    }
  }

  const handleRegisterClick = (event: Event) => {
    setRegistrationEvent(event)
  }

  const isRegistered = (eventId: string) => {
    return registeredEvents.includes(eventId)
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-900 to-cyan-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-400 mx-auto"></div>
          <p className="mt-4 text-cyan-300 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-900 to-cyan-950">
      {showTeamInviteModal && (
        <TeamInviteModal
          eventId={showTeamInviteModal.eventId}
          teamName={showTeamInviteModal.teamName}
          creatorEmail={user?.email || ''}
          onClose={() => setShowTeamInviteModal(null)}
          onInviteCreated={handleInviteCreated}
        />
      )}
      {/* Navigation */}
      <nav className="bg-gradient-to-r from-slate-950/95 via-blue-900/95 to-cyan-900/95 backdrop-blur-sm shadow-lg border-b border-cyan-500/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-cyan-400 drop-shadow-[0_0_10px_rgb(244,114,182)]">
                HackPlatform
              </Link>
              <span className="ml-4 px-3 py-1 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 text-sm rounded-full border border-cyan-400 drop-shadow-[0_0_8px_rgb(244,114,182)]">
                Participant
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-blue-200 font-medium">Welcome, {user.name}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-cyan-300 hover:text-cyan-100 transition-colors bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-lg border border-cyan-500/30 hover:border-cyan-400"
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
        <div className="bg-gradient-to-r from-slate-950/80 via-blue-900/80 to-cyan-900/80 backdrop-blur-sm border border-cyan-500/30 rounded-xl p-6 mb-8 shadow-2xl">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 mb-2 drop-shadow-lg">
            Participant Dashboard
          </h1>
          <p className="text-blue-200 font-medium">
            Join events, manage your team, and submit your amazing projects.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-slate-950/80 to-blue-950/80 backdrop-blur-sm border border-cyan-500/30 rounded-xl p-6 shadow-xl hover:shadow-2xl transition-all">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg shadow-lg">
                <div className="w-6 h-6 bg-white rounded shadow-sm"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-cyan-300">Events Joined</p>
                <p className="text-2xl font-bold text-white drop-shadow-md">{registeredEventsDetails.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-950/80 to-blue-950/80 backdrop-blur-sm border border-cyan-500/30 rounded-xl p-6 shadow-xl hover:shadow-2xl transition-all">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                <div className="w-6 h-6 bg-white rounded shadow-sm"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-cyan-300">Submissions</p>
                <p className="text-2xl font-bold text-white drop-shadow-md">3</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-950/80 to-blue-950/80 backdrop-blur-sm border border-cyan-500/30 rounded-xl p-6 shadow-xl hover:shadow-2xl transition-all">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-rose-500 to-pink-500 rounded-lg shadow-lg">
                <div className="w-6 h-6 bg-white rounded shadow-sm"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-cyan-300">Team Members</p>
                <p className="text-2xl font-bold text-white drop-shadow-md">4</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-slate-950/80 to-blue-950/80 backdrop-blur-sm border border-cyan-500/30 rounded-xl p-6 hover:border-cyan-400 hover:shadow-2xl transition-all cursor-pointer group">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl mx-auto mb-4 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <div className="w-6 h-6 bg-white rounded"></div>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Browse Events</h3>
              <p className="text-blue-200 text-sm mb-4">
                Discover new hackathons and competitions to join
              </p>
              <button className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-2 px-4 rounded-lg hover:from-cyan-400 hover:to-blue-400 transition-all font-medium shadow-lg hover:shadow-xl">
                Browse Events
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-950/80 to-blue-950/80 backdrop-blur-sm border border-cyan-500/30 rounded-xl p-6 hover:border-indigo-400 hover:shadow-2xl transition-all cursor-pointer group">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl mx-auto mb-4 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <div className="w-6 h-6 bg-white rounded"></div>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">My Team</h3>
              <p className="text-blue-200 text-sm mb-4">
                Manage your team members and collaborate
              </p>
              <button className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-2 px-4 rounded-lg hover:from-blue-400 hover:to-indigo-400 transition-all font-medium shadow-lg hover:shadow-xl">
                View Team
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-950/80 to-blue-950/80 backdrop-blur-sm border border-cyan-500/30 rounded-xl p-6 hover:border-blue-400 hover:shadow-2xl transition-all cursor-pointer group">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-pink-500 rounded-xl mx-auto mb-4 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <div className="w-6 h-6 bg-white rounded"></div>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Submit Project</h3>
              <p className="text-blue-200 text-sm mb-4">
                Upload your project and submit to competitions
              </p>
              <button className="w-full bg-gradient-to-r from-rose-500 to-pink-500 text-white py-2 px-4 rounded-lg hover:from-rose-400 hover:to-pink-400 transition-all font-medium shadow-lg hover:shadow-xl">
                Submit Project
              </button>
            </div>
          </div>

          <div 
            onClick={() => setShowCertificates(true)}
            className="bg-gradient-to-br from-slate-950/80 to-blue-950/80 backdrop-blur-sm border border-cyan-500/30 rounded-xl p-6 hover:border-cyan-400 hover:shadow-2xl transition-all cursor-pointer group"
          >
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl mx-auto mb-4 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                📜
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">My Certificates</h3>
              <p className="text-blue-200 text-sm mb-4">
                View and download your achievement certificates
              </p>
              <button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-2 px-4 rounded-lg hover:from-amber-400 hover:to-orange-400 transition-all font-medium shadow-lg hover:shadow-xl">
                View Certificates
              </button>
            </div>
          </div>
        </div>

        {/* Submission Deadline Tracker */}
        {registeredEventsDetails.length > 0 && (
          <SubmissionDeadlineTracker
            events={registeredEventsDetails}
            userSubmissions={userSubmissions}
            onOpenSubmissionForm={openSubmissionForm}
          />
        )}

        {/* Available Events */}
        <div className="bg-gradient-to-br from-slate-950/80 to-blue-950/80 backdrop-blur-sm border border-cyan-500/30 rounded-xl p-6 mb-6 shadow-xl">
          <h2 className="text-xl font-semibold text-white mb-4 drop-shadow-lg">Available Events</h2>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
              <span className="ml-2 text-blue-200">Loading events...</span>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg mx-auto mb-4 flex items-center justify-center shadow-lg">
                <div className="w-8 h-8 bg-white rounded"></div>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No events available</h3>
              <p className="text-blue-200">Check back later for new hackathons and competitions</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <div key={event.id} className="bg-gradient-to-br from-slate-950/80 to-blue-950/80 backdrop-blur-sm border border-cyan-500/30 rounded-xl hover:border-cyan-400 hover:shadow-2xl transition-all duration-200 overflow-hidden shadow-xl">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-xl text-white leading-tight">{event.title}</h3>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        event.status === 'ongoing' ? 'bg-green-900/30 text-green-400 border border-green-600' :
                        event.status === 'completed' ? 'bg-slate-700 text-blue-200 border border-slate-600' :
                        event.status === 'published' ? 'bg-blue-900/30 text-blue-400 border border-blue-600' :
                        'bg-yellow-900/30 text-yellow-400 border border-yellow-600'
                      }`}>
                        {event.status}
                      </span>
                    </div>
                    
                    <p className="text-sm text-blue-200 mb-4 line-clamp-2">{event.description}</p>
                    
                    <div className="space-y-3 mb-4">
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-1 bg-cyan-900/30 text-cyan-300 rounded-md text-xs font-medium">{event.theme}</span>
                        <span className="px-2 py-1 bg-blue-900/30 text-blue-300 rounded-md text-xs font-medium">{event.eventType}</span>
                      </div>
                      
                      <div className="text-sm text-blue-200 space-y-1">
                        <div className="flex justify-between">
                          <span>Registration Fee:</span>
                          <span className="text-white font-medium">₹{event.registrationFee}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Event Date:</span>
                          <span className="text-white">{new Date(event.timeline.eventStart).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Organizer:</span>
                          <span className="text-cyan-400">{event.organizerName}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="px-6 py-4 bg-gradient-to-r from-blue-950/50 to-cyan-950/50 border-t border-cyan-500/30">
                    <div className="flex justify-between items-center">
                      <div className="flex space-x-3">
                        <button 
                          onClick={() => setSelectedEvent(event)}
                          className="text-cyan-400 hover:text-cyan-300 text-sm font-medium transition-colors"
                        >
                          View Details
                        </button>
                        {isRegistered(event.id!) && (
                          <button 
                            onClick={() => setShowCommunication(event.id!)}
                            className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                          >
                            💬 Chat
                          </button>
                        )}
                      </div>
                      <button 
                        onClick={() => handleRegisterClick(event)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg ${
                          event.status === 'completed'
                            ? 'bg-slate-600 text-blue-200 cursor-not-allowed'
                            : isRegistered(event.id!)
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white cursor-default'
                            : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white'
                        }`}
                        disabled={event.status === 'completed' || isRegistered(event.id!)}
                      >
                        {event.status === 'completed' 
                          ? 'Event Completed' 
                          : isRegistered(event.id!)
                          ? 'Registered ✓' 
                          : 'Register'
                        }
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Registered Events */}
        <div className="bg-gradient-to-br from-slate-950/80 to-blue-950/80 backdrop-blur-sm border border-cyan-500/30 rounded-xl p-6 mb-6 shadow-xl">
          <h2 className="text-xl font-semibold text-white mb-4 drop-shadow-lg">My Registered Events</h2>
          {registeredEventsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
              <span className="ml-2 text-blue-200">Loading registered events...</span>
            </div>
          ) : registeredEventsDetails.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg mx-auto mb-4 flex items-center justify-center shadow-lg">
                <div className="w-8 h-8 bg-white rounded"></div>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No registered events</h3>
              <p className="text-blue-200">Register for events above to see them here</p>
            </div>
          ) : (
            <div className="space-y-10">
              {registeredEventsDetails.map((eventWithReg) => (
                <div key={eventWithReg.id} className="bg-slate-800/60 rounded-xl p-6 shadow-lg border border-cyan-700/30">
                  <SubmissionStatusCard
                    event={eventWithReg}
                    submissions={userSubmissions[eventWithReg.id!] || []}
                    onOpenSubmissionForm={openSubmissionForm}
                    loading={submissionsLoading === eventWithReg.id}
                  />
                  {/* Hackathon Rounds Timeline */}
                  {eventWithReg.rounds && eventWithReg.rounds.length > 0 && (
                    <div className="mt-8">
                      <h3 className="text-lg font-semibold text-white mb-3">Hackathon Rounds Timeline</h3>
                      <div className="space-y-8 border-l-2 border-cyan-700 pl-6 relative">
                        {eventWithReg.rounds.map((round, index) => (
                          <div key={round.id || index} className="relative pb-2">
                            <div className="absolute -left-7 top-2 w-4 h-4 bg-cyan-400 rounded-full border-4 border-cyan-800 shadow"></div>
                            <div className="bg-slate-700/60 rounded-lg p-4 shadow-md">
                              <div className="flex justify-between items-center mb-2">
                                <h4 className="font-medium text-white text-base">Round {index + 1}: {round.name}</h4>
                                {round.maxParticipants && (
                                  <span className="text-xs bg-blue-900/30 text-blue-300 px-2 py-1 rounded">
                                    Max: {round.maxParticipants}
                                  </span>
                                )}
                              </div>
                              <p className="text-blue-200 text-sm mb-3">{round.description}</p>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs mb-2">
                                <div>
                                  <span className="text-cyan-300 font-semibold">Start:</span>
                                  <span className="text-blue-200 ml-1">{(() => {
                                    if (!round.startDate) return 'Not set';
                                    const d = new Date(round.startDate);
                                    return isNaN(d.getTime()) ? 'Not set' : d.toLocaleString();
                                  })()}</span>
                                </div>
                                <div>
                                  <span className="text-cyan-300 font-semibold">End:</span>
                                  <span className="text-blue-200 ml-1">{(() => {
                                    if (!round.endDate) return 'Not set';
                                    const d = new Date(round.endDate);
                                    return isNaN(d.getTime()) ? 'Not set' : d.toLocaleString();
                                  })()}</span>
                                </div>
                                <div>
                                  <span className="text-cyan-300 font-semibold">Submission:</span>
                                  <span className="text-blue-200 ml-1">{(() => {
                                    if (!round.submissionDeadline) return 'Not set';
                                    const d = new Date(round.submissionDeadline);
                                    return isNaN(d.getTime()) ? 'Not set' : d.toLocaleString();
                                  })()}</span>
                                </div>
                              </div>
                              {round.requirements && (
                                <div className="mt-1">
                                  <span className="text-cyan-300 text-xs font-semibold">Requirements:</span>
                                  <span className="text-blue-200 text-xs ml-1">{round.requirements}</span>
                                </div>
                              )}
                              {round.eliminationCriteria && (
                                <div className="mt-1">
                                  <span className="text-cyan-300 text-xs font-semibold">Elimination:</span>
                                  <span className="text-blue-200 text-xs ml-1">{round.eliminationCriteria}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-gradient-to-br from-slate-950/80 to-blue-950/80 backdrop-blur-sm border border-cyan-500/30 rounded-xl p-6 shadow-xl">
          <h2 className="text-xl font-semibold text-white mb-4 drop-shadow-lg">Recent Activity</h2>
          {/* Team Invites Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Your Team Invites</h3>
            
            {teamInvites.length === 0 ? (
              <p className="text-blue-200">You haven't created any team invites yet.</p>
            ) : (
              <div className="space-y-3">
                {teamInvites.map((invite) => (
                  <div key={invite.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-3 px-4 bg-gradient-to-r from-blue-950/50 to-cyan-950/50 rounded-lg border border-cyan-500/30">
                    <div className="mb-2 sm:mb-0">
                      <div className="text-white font-medium">{invite.teamName}</div>
                      <div className="text-sm text-blue-200">Expires: {invite.expiresAt.toLocaleDateString()}</div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(teamInviteService.getInviteUrl(invite.inviteCode))
                          alert('Invite link copied to clipboard!')
                        }}
                        className="px-3 py-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm rounded hover:from-cyan-400 hover:to-blue-400 transition-all"
                      >
                        Copy Link
                      </button>
                      {invite.status === 'active' && (
                        <button
                          onClick={() => handleRevokeInvite(invite.id!)}
                          className="px-3 py-1 bg-gradient-to-r from-red-500 to-rose-500 text-white text-sm rounded hover:from-red-400 hover:to-rose-400 transition-all"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="pt-4">
              <h3 className="text-lg font-semibold text-white00 mb-3">Your Teams</h3>
              <div className="space-y-3">
                {registeredEventsDetails
                  .filter(event => event.registrationData?.teamName)
                  .map((event) => (
                    <div key={event.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-3 px-4 bg-slate-700/50 rounded-lg border border-slate-600">
                      <div>
                        <div className="text-white00 font-medium">{event.registrationData.teamName}</div>
                        <div className="text-sm text-cyan-30000">{event.title}</div>
                      </div>
                      <div className="mt-2 sm:mt-0">
                        <button
                          onClick={() => handleCreateTeamInvite(event.id!, event.registrationData.teamName!)}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                        >
                          Invite Members
                        </button>
                      </div>
                    </div>
                  ))}
                  
                {registeredEventsDetails.filter(event => event.registrationData?.teamName).length === 0 && (
                  <p className="text-cyan-30000">You haven't created any teams yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-800/70 to-blue-800/70 backdrop-blur-sm00 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-cyan-500/3000">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-cyan-500/3000">
              <div className="flex items-center space-x-4">
                <h2 className="text-2xl font-bold text-white00">{selectedEvent.title}</h2>
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                  selectedEvent.status === 'ongoing' ? 'bg-green-900/30 text-green-400 border border-green-600' :
                  selectedEvent.status === 'completed' ? 'bg-slate-700 text-blue-20000 border border-slate-600' :
                  selectedEvent.status === 'published' ? 'bg-blue-900/30 text-blue-400 border border-blue-600' :
                  'bg-yellow-900/30 text-yellow-400 border border-yellow-600'
                }`}>
                  {selectedEvent.status}
                </span>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-cyan-30000 hover:text-white00 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold text-white00 mb-2">About the Event</h3>
                <p className="text-blue-20000">{selectedEvent.description}</p>
              </div>

              {/* Event Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white00">Event Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-cyan-30000">Theme:</span>
                      <span className="text-white00">{selectedEvent.theme}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cyan-30000">Type:</span>
                      <span className="text-white00 capitalize">{selectedEvent.eventType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cyan-30000">Location:</span>
                      <span className="text-white00">{selectedEvent.location}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cyan-30000">Max Participants:</span>
                      <span className="text-white00">{selectedEvent.maxParticipants}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cyan-30000">Registration Fee:</span>
                      <span className="text-white00">₹{selectedEvent.registrationFee}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white00">Timeline</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-cyan-30000">Registration Start:</span>
                      <span className="text-white00">{new Date(selectedEvent.timeline.registrationStart).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cyan-30000">Registration End:</span>
                      <span className="text-white00">{new Date(selectedEvent.timeline.registrationEnd).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cyan-30000">Event Start:</span>
                      <span className="text-white00">{new Date(selectedEvent.timeline.eventStart).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cyan-300">Event End:</span>
                      <span className="text-white">{new Date(selectedEvent.timeline.eventEnd).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cyan-300">Submission Deadline:</span>
                      <span className="text-white">{new Date(selectedEvent.timeline.submissionDeadline).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rounds Information */}
              {selectedEvent.rounds && selectedEvent.rounds.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white00 mb-3">Hackathon Rounds</h3>
                  <div className="space-y-4">
                    {selectedEvent.rounds.map((round, index) => (
                      <div key={round.id} className="bg-slate-700/50 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-white00">Round {index + 1}: {round.name}</h4>
                          {round.maxParticipants && (
                            <span className="text-xs bg-blue-900/30 text-blue-300 px-2 py-1 rounded">
                              Max: {round.maxParticipants}
                            </span>
                          )}
                        </div>
                        <p className="text-blue-20000 text-sm mb-3">{round.description}</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                          <div>
                            <span className="text-cyan-30000">Start:</span>
                            <span className="text-cyan-30000 ml-1">{(() => {
                              if (!round.startDate) return 'Not set';
                              const d = new Date(round.startDate);
                              return isNaN(d.getTime()) ? 'Not set' : d.toLocaleString();
                            })()}</span>
                          </div>
                          <div>
                            <span className="text-cyan-30000">End:</span>
                            <span className="text-cyan-30000 ml-1">{(() => {
                              if (!round.endDate) return 'Not set';
                              const d = new Date(round.endDate);
                              return isNaN(d.getTime()) ? 'Not set' : d.toLocaleString();
                            })()}</span>
                          </div>
                          <div>
                            <span className="text-cyan-30000">Submission:</span>
                            <span className="text-cyan-30000 ml-1">{(() => {
                              if (!round.submissionDeadline) return 'Not set';
                              const d = new Date(round.submissionDeadline);
                              return isNaN(d.getTime()) ? 'Not set' : d.toLocaleString();
                            })()}</span>
                          </div>
                        </div>
                        {round.requirements && (
                          <div className="mt-2">
                            <span className="text-cyan-30000 text-xs">Requirements:</span>
                            <span className="text-cyan-30000 text-xs ml-1">{round.requirements}</span>
                          </div>
                        )}
                        {round.eliminationCriteria && (
                          <div className="mt-2">
                            <span className="text-cyan-30000 text-xs">Elimination Criteria:</span>
                            <span className="text-cyan-30000 text-xs ml-1">{round.eliminationCriteria}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-semibold text-white00 mb-3">Contact Information</h3>
                <div className="bg-slate-700/50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-cyan-30000">Organizer:</span>
                    <span className="text-white00">{selectedEvent.organizerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cyan-30000">Email:</span>
                    <span className="text-blue-400">{selectedEvent.contactEmail}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-cyan-500/3000">
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="px-6 py-2 text-cyan-30000 hover:text-blue-20000 transition-colors"
                >
                  Close
                </button>
                <button 
                  onClick={() => {
                    setSelectedEvent(null)
                    handleRegisterClick(selectedEvent)
                  }}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    selectedEvent.status === 'completed'
                      ? 'bg-slate-600 text-cyan-30000 cursor-not-allowed'
                      : isRegistered(selectedEvent.id!)
                      ? 'bg-green-600 text-white cursor-default'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                  disabled={selectedEvent.status === 'completed' || isRegistered(selectedEvent.id!)}
                >
                  {selectedEvent.status === 'completed' 
                    ? 'Event Completed' 
                    : isRegistered(selectedEvent.id!)
                    ? 'Already Registered ✓'
                    : 'Register for Event'
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Registration Modal */}
      {registrationEvent && user && (
        <RegistrationModal
          event={registrationEvent}
          userEmail={user.email}
          userName={user.name}
          onClose={() => setRegistrationEvent(null)}
          onRegistrationComplete={handleRegistrationComplete}
        />
      )}

      {/* Communication Modal */}
      {showCommunication && user && (
        <EventCommunication
          eventId={showCommunication}
          userId={user.email}
          userName={user.name}
          userRole="participant"
          onClose={() => setShowCommunication(null)}
        />
      )}

      {/* Submission Form Modal */}
      {submissionForm && user && (
        <SubmissionForm
          event={submissionForm.event}
          round={submissionForm.round}
          participantEmail={user.email}
          participantName={user.name}
          teamName={submissionForm.event.id ? 
            registeredEventsDetails.find(e => e.id === submissionForm.event.id)?.registrationData?.teamName : 
            undefined
          }
          teamMembers={submissionForm.event.id ? 
            registeredEventsDetails.find(e => e.id === submissionForm.event.id)?.registrationData?.teamMembers : 
            undefined
          }
          existingSubmission={getSubmissionForRound(submissionForm.event.id!, submissionForm.round.id)}
          onClose={() => setSubmissionForm(null)}
          onSubmissionComplete={() => handleSubmissionComplete(submissionForm.event.id!)}
        />
      )}

      {/* Certificates Modal */}
      {showCertificates && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">My Certificates</h2>
              <button
                onClick={() => setShowCertificates(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            </div>
            <div className="max-h-[calc(90vh-120px)] overflow-y-auto">
              <ParticipantCertificates />
            </div>
          </div>
        </div>
      )}

      {/* Certificates Modal */}
      {showCertificates && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">My Certificates</h2>
              <button
                onClick={() => setShowCertificates(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            </div>
            <div className="max-h-[calc(90vh-120px)] overflow-y-auto">
              <ParticipantCertificates />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ParticipantDashboard
